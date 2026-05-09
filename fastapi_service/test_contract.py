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
        self.assertEqual(data["voiceTurnPath"], "/v1/voice/turn")

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

    def test_realtime_session_returns_normalized_client_secret(self):
        import fastapi_service.main as main

        async def fake_secret(payload):
            return {
                "expires_at": 1778285000,
                "session": {
                    "id": "sess_test",
                    "client_secret": {"value": "ek_test", "expires_at": 1778285000},
                    "model": "gpt-realtime",
                },
            }

        original = main.request_openai_realtime_client_secret
        main.request_openai_realtime_client_secret = fake_secret
        try:
            response = self.client.post("/v1/realtime/session", json={"personaId": "malee", "voice": "alloy"})
        finally:
            main.request_openai_realtime_client_secret = original

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["mode"], "openai-realtime")
        self.assertEqual(data["clientSecret"]["value"], "ek_test")
        self.assertEqual(data["session"]["session"]["id"], "sess_test")

    def test_realtime_session_reports_missing_openai_key(self):
        os.environ.pop("OPENAI_API_KEY", None)
        response = self.client.post("/v1/realtime/session", json={"personaId": "malee"})
        self.assertEqual(response.status_code, 503)
        self.assertIn("OpenAI", response.json()["detail"])

    def test_voice_turn_returns_persona_specific_reply(self):
        response = self.client.post(
            "/v1/voice/turn",
            json={
                "personaId": "somchai",
                "question": "Hi Somchai, there are some suspicious numbers calling you.",
                "transcript": "They asked me to send my account number.",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["personaId"], "somchai")
        self.assertIn("account", data["reply"].lower())
        self.assertIn("Nok", data["reply"])

    def test_voice_prompt_uses_stable_openai_audio_voice(self):
        import fastapi_service.main as main

        def fake_audio(messages, persona_id, purpose, max_tokens=220):
            return {"text": "Hi Somchai, there are some suspicious numbers calling you.", "audioData": "UklGRg==", "audioFormat": "wav"}

        original = main.request_openai_gpt_audio
        main.request_openai_gpt_audio = fake_audio
        try:
            response = self.client.post(
                "/v1/voice/prompt",
                json={
                    "personaId": "somchai",
                    "question": "Hi Somchai, there are some suspicious numbers calling you.",
                    "audioVoice": "onyx",
                },
            )
        finally:
            main.request_openai_gpt_audio = original

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["audioVoice"], "onyx")
        self.assertEqual(data["audioData"], "UklGRg==")

    def test_voice_turn_can_process_captured_audio_with_gpt_audio(self):
        import fastapi_service.main as main

        def fake_audio(messages, persona_id, purpose, max_tokens=220):
            self.assertEqual(purpose, "turn")
            self.assertEqual(persona_id, "malee")
            self.assertIsInstance(messages[-1]["content"], list)
            return {
                "text": "Thanks, Malee. Check the blue pill box first.",
                "audioData": "UklGRg==",
                "audioFormat": "wav",
            }

        original = main.request_openai_gpt_audio
        main.request_openai_gpt_audio = fake_audio
        try:
            response = self.client.post(
                "/v1/voice/turn",
                json={
                    "personaId": "malee",
                    "question": "Hi Malee, Did I already take the morning medicine yet?",
                    "transcript": "captured audio",
                    "audioData": "UklGRg==",
                    "audioFormat": "wav",
                    "audioVoice": "shimmer",
                },
            )
        finally:
            main.request_openai_gpt_audio = original

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["source"], "openai-gpt-audio")
        self.assertEqual(data["audioData"], "UklGRg==")
        self.assertEqual(data["audioVoice"], "shimmer")

    def test_api_voice_turn_accepts_frontend_contract(self):
        response = self.client.post(
            "/api/voice-turn",
            json={
                "personaId": "malee",
                "question": "Hi Malee, Did I already take the morning medicine yet?",
                "transcript": "I remember the green mug but not the pill box.",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["personaId"], "malee")
        self.assertIn("blue pill box", data["reply"])

    def test_workspace_summary_is_available(self):
        response = self.client.get("/api/workspace")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertGreaterEqual(data["summary"]["dashboardMetrics"]["activeSessionCount"], 1)


if __name__ == "__main__":
    unittest.main()
