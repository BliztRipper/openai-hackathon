import os
import unittest

from fastapi.testclient import TestClient

from fastapi_service.main import app


COMPANION_PAYLOAD = {
    "personaId": "malee",
    "personaName": "Malee",
    "cueLevel": "Specific cue",
    "userLine": "Maybe after tea. I still cannot picture it.",
    "assistantLine": "Your routine photo log shows the blue pill box beside the green mug at 8:12.",
    "helper": "Visual anchor helped reconstruct the medication event.",
    "signal": {
        "assistanceLevel": "Hint-supported",
        "recallGap": "Needs visual anchor to reconstruct event",
        "domain": "Orientation + short-term memory",
        "cueResponsiveness": "Recognizes routine after specific cue",
        "latency": "31s response latency",
    },
}

EXPRESS_PAYLOAD = {
    "personaId": "malee",
    "sessionId": "session-malee-medication-001",
    "userInput": "Maybe after tea. I still cannot picture it.",
    "context": "concerning_trend",
    "model": "gpt-5.5-pro",
    "supportContext": {
        "personaName": "Malee",
        "cueLevel": "Specific cue",
        "assistantLine": "Your routine photo log shows the blue pill box beside the green mug at 8:12.",
        "helper": "Visual anchor helped reconstruct the medication event.",
        "signal": COMPANION_PAYLOAD["signal"],
    },
}


class FastApiContractTest(unittest.TestCase):
    def setUp(self):
        os.environ.pop("SECOND_BRAIN_API_TOKEN", None)
        os.environ.pop("BACKEND_BEARER_TOKEN", None)
        self.client = TestClient(app)

    def test_health_reports_ready_service(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["service"], "second-brain-fastapi")
        self.assertEqual(data["companionPath"], "/v1/companion")

    def test_v1_companion_accepts_express_contract(self):
        response = self.client.post("/v1/companion", json=EXPRESS_PAYLOAD)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["model"], "gpt-5.5-pro")
        self.assertIn("Malee", data["reply"])
        self.assertIn("next", data["helper"].lower())
        self.assertEqual(data["cueLevel"], "Specific cue")
        self.assertEqual(data["signals"]["domain"], "Orientation + short-term memory")

    def test_api_companion_accepts_frontend_contract(self):
        response = self.client.post("/api/companion", json=COMPANION_PAYLOAD)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["mode"], "fastapi")
        self.assertIn("companionNote", data)
        self.assertIn("nextBestAction", data)

    def test_token_is_enforced_when_configured(self):
        os.environ["BACKEND_BEARER_TOKEN"] = "secret-token"
        client = TestClient(app)
        self.assertEqual(client.post("/v1/companion", json=EXPRESS_PAYLOAD).status_code, 401)
        authorized = client.post(
            "/v1/companion",
            json=EXPRESS_PAYLOAD,
            headers={"Authorization": "Bearer secret-token"},
        )
        self.assertEqual(authorized.status_code, 200)

    def test_workspace_summary_is_available(self):
        response = self.client.get("/api/workspace")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertGreaterEqual(data["summary"]["dashboardMetrics"]["activeSessionCount"], 1)


if __name__ == "__main__":
    unittest.main()
