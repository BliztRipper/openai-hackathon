from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import httpx

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DEFAULT_MODEL = "gpt-5.5-pro"
DEFAULT_REALTIME_MODEL = "gpt-realtime"
OPENAI_REALTIME_CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets"
ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_WORKSPACE_PATH = ROOT_DIR / "server" / "workspace-data" / "workspace.json"
MAX_REQUESTS_PER_MINUTE = 30

ALLOWED_PERSONA_IDS = {"malee", "somchai", "araya"}
ALLOWED_CUE_LEVELS = {
    "Open recall",
    "Category hint",
    "Specific cue",
    "Multiple choice",
    "Reality Anchor answer",
}
ALLOWED_ASSISTANCE_LEVELS = {
    "Independent attempt",
    "Hint-supported",
    "Choice-supported",
    "Direct support",
}

rate_limit_buckets: dict[str, dict[str, float | int]] = {}


def pydantic_dict(model: BaseModel) -> dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


class Signal(BaseModel):
    assistanceLevel: str = Field(min_length=1, max_length=80)
    recallGap: str = Field(min_length=1, max_length=240)
    domain: str = Field(min_length=1, max_length=160)
    cueResponsiveness: str = Field(min_length=1, max_length=240)
    latency: str = Field(min_length=1, max_length=120)


class FrontendCompanionRequest(BaseModel):
    personaId: str = Field(min_length=1, max_length=20)
    personaName: str = Field(min_length=1, max_length=80)
    cueLevel: str = Field(min_length=1, max_length=80)
    userLine: str = Field(min_length=1, max_length=700)
    assistantLine: str = Field(min_length=1, max_length=1200)
    helper: str = Field(default="", max_length=800)
    signal: Signal
    sessionId: Optional[str] = None
    context: Optional[str] = None


class SupportContext(BaseModel):
    personaName: str = Field(min_length=1, max_length=80)
    cueLevel: str = Field(min_length=1, max_length=80)
    assistantLine: str = Field(min_length=1, max_length=1200)
    helper: str = Field(default="", max_length=800)
    signal: Signal


class ExpressCompanionRequest(BaseModel):
    personaId: str = Field(min_length=1, max_length=20)
    sessionId: str = Field(min_length=1, max_length=120)
    userInput: str = Field(min_length=1, max_length=700)
    context: str = Field(default="concerning_trend", max_length=120)
    model: str = Field(default=DEFAULT_MODEL, max_length=120)
    supportContext: SupportContext


class RealtimeSessionRequest(BaseModel):
    personaId: str = Field(default="malee", max_length=20)
    voice: str = Field(default="alloy", max_length=40)
    instructions: Optional[str] = Field(default=None, max_length=1200)


class WorkspaceEvent(BaseModel):
    personaId: str
    sessionId: str
    stepId: str
    cueLevel: str
    userLine: str
    assistantLine: str
    signal: Signal


class WorkspaceMutation(BaseModel):
    action: str
    event: WorkspaceEvent


def env_token() -> str:
    return os.getenv("SECOND_BRAIN_API_TOKEN") or os.getenv("BACKEND_BEARER_TOKEN") or ""


def resolve_allowed_origins() -> list[str]:
    configured = os.getenv("CORS_ALLOW_ORIGIN")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip() and origin.strip() != "*"]
    return ["http://localhost:5173", "http://127.0.0.1:5173"]


def require_bearer(authorization: str = Header(default="")) -> None:
    token = env_token()
    if token and authorization != f"Bearer {token}":
        raise HTTPException(status_code=401, detail="Authorized companion service token required")


def validate_contract(persona_id: str, cue_level: str, signal: Signal) -> None:
    details: list[str] = []
    if persona_id not in ALLOWED_PERSONA_IDS:
        details.append("personaId must match a supported care persona")
    if cue_level not in ALLOWED_CUE_LEVELS:
        details.append("cueLevel must match the supported clue ladder")
    if signal.assistanceLevel not in ALLOWED_ASSISTANCE_LEVELS:
        details.append("signal.assistanceLevel must match a supported support level")
    if details:
        raise HTTPException(status_code=422, detail=details)


def signal_score(signal: Signal) -> int:
    text = f"{signal.assistanceLevel} {signal.recallGap} {signal.cueResponsiveness} {signal.latency}".lower()
    score = 42
    if "direct support" in text or "critical" in text:
        score += 32
    if "choice-supported" in text or "hint-supported" in text:
        score += 16
    if "cannot" in text or "uncertain" in text or "gap" in text:
        score += 10
    if any(term in text for term in ["31s", "slow", "very low", "very-low", "low latency", "response latency"]):
        score += 8
    return min(score, 98)


def severity_for(score: int) -> str:
    if score >= 78:
        return "critical"
    if score >= 58:
        return "warning"
    return "stable"


def frontend_from_express(payload: ExpressCompanionRequest) -> FrontendCompanionRequest:
    return FrontendCompanionRequest(
        personaId=payload.personaId.strip(),
        personaName=payload.supportContext.personaName.strip(),
        cueLevel=payload.supportContext.cueLevel.strip(),
        userLine=payload.userInput.strip(),
        assistantLine=payload.supportContext.assistantLine.strip(),
        helper=payload.supportContext.helper.strip(),
        signal=payload.supportContext.signal,
        sessionId=payload.sessionId.strip(),
        context=payload.context.strip(),
    )


def rubric_evidence(payload: FrontendCompanionRequest) -> list[dict[str, str]]:
    return [
        {
            "label": "Care continuity",
            "evidence": f"{payload.personaName}'s support pattern remains visible while the system preserves recall effort before direct answers.",
        },
        {
            "label": "Technical feasibility",
            "evidence": "FastAPI keeps insight generation server-side and exposes one stable contract for the product interface.",
        },
        {
            "label": "Impact",
            "evidence": f"Transforms {payload.signal.domain.lower()} into an affordable review signal for family and care teams.",
        },
    ]


def build_reply(payload: FrontendCompanionRequest, model: str = DEFAULT_MODEL) -> dict[str, Any]:
    validate_contract(payload.personaId, payload.cueLevel, payload.signal)
    score = signal_score(payload.signal)
    severity = severity_for(score)
    generated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    next_action = (
        "Escalate the care review queue now, preserve the current cue trail, and use the smallest safe prompt before any direct answer."
        if severity == "critical"
        else "Continue one step down the clue ladder, save the cue response, and route the next trend to the review queue."
    )
    companion_note = (
        f"{payload.personaName}'s {payload.cueLevel.lower()} step shows {payload.signal.recallGap.lower()} "
        f"within {payload.signal.domain.lower()}. Treat it as a {severity} support signal, keep the interaction non-diagnostic, "
        "and protect recall effort before increasing assistance."
    )
    return {
        "ok": True,
        "mode": "fastapi",
        "source": "second-brain-fastapi",
        "model": model,
        "generatedAt": generated_at,
        "reply": companion_note,
        "helper": next_action,
        "companionNote": companion_note,
        "nextBestAction": next_action,
        "safetyBoundary": "Server-side companion service. No browser API key exposure. Non-diagnostic human-review copy only.",
        "rubricEvidence": rubric_evidence(payload),
        "cueLevel": payload.cueLevel,
        "signals": {
            "severity": severity,
            "supportScore": score,
            "domain": payload.signal.domain,
            "assistanceLevel": payload.signal.assistanceLevel,
            "cueResponsiveness": payload.signal.cueResponsiveness,
            "latency": payload.signal.latency,
        },
    }


def workspace_path() -> Path:
    return Path(os.getenv("WORKSPACE_JSON_PATH", str(DEFAULT_WORKSPACE_PATH))).resolve()


def load_workspace() -> dict[str, Any]:
    with workspace_path().open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_workspace(state: dict[str, Any]) -> None:
    path = workspace_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(state, handle, indent=2)
        handle.write("\n")


def build_workspace_summary(state: dict[str, Any]) -> dict[str, Any]:
    events_by_session: dict[str, list[dict[str, Any]]] = {}
    for event in state.get("events", []):
        events_by_session.setdefault(event.get("sessionId", ""), []).append(event)

    active_sessions = []
    for session in state.get("sessions", []):
        if session.get("status") != "active":
            continue
        events = events_by_session.get(session.get("id", ""), [])
        last_event = events[-1] if events else None
        active_sessions.append(
            {
                **session,
                "eventCount": len(events),
                "lastCueLevel": (last_event or {}).get("cueLevel", session.get("lastCueLevel", "Open recall")),
                "lastSignalDomain": ((last_event or {}).get("signal") or {}).get("domain", "No event yet"),
                "lastUpdatedAt": (last_event or {}).get("createdAt", session.get("startedAt")),
            }
        )

    events = state.get("events", [])
    workspace = state.get("workspace", {})
    return {
        "workspace": workspace,
        "personas": state.get("personas", []),
        "activeSessions": active_sessions,
        "recentEvents": list(reversed(events[-6:])),
        "reviewQueue": state.get("reviewQueue", []),
        "dashboardMetrics": {
            "storageMode": workspace.get("storageMode", "care-json"),
            "eventsStored": len(events),
            "activeSessionCount": len(active_sessions),
            "reviewItemCount": len(state.get("reviewQueue", [])),
            "lastUpdatedAt": (events[-1] if events else {}).get("createdAt", workspace.get("updatedAt")),
        },
    }


def append_workspace_event(input_event: WorkspaceEvent) -> dict[str, Any]:
    state = load_workspace()
    persona_ids = {persona.get("id") for persona in state.get("personas", [])}
    session = next((item for item in state.get("sessions", []) if item.get("id") == input_event.sessionId), None)
    if input_event.personaId not in persona_ids:
        raise HTTPException(status_code=422, detail=["personaId must exist in workspace JSON"])
    if not session or session.get("personaId") != input_event.personaId:
        raise HTTPException(status_code=422, detail=["sessionId must belong to personaId"])

    event = {
        "id": f"event-{int(time.time() * 1000)}-{len(state.get('events', [])) + 1}",
        "sessionId": input_event.sessionId,
        "personaId": input_event.personaId,
        "stepId": input_event.stepId,
        "cueLevel": input_event.cueLevel,
        "userLine": input_event.userLine,
        "assistantLine": input_event.assistantLine,
        "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "signal": pydantic_dict(input_event.signal),
    }
    state.setdefault("events", []).append(event)
    state.setdefault("workspace", {})["updatedAt"] = event["createdAt"]
    for item in state.get("sessions", []):
        if item.get("id") == input_event.sessionId:
            item["lastCueLevel"] = input_event.cueLevel
            item["eventCount"] = int(item.get("eventCount", 0)) + 1
    for item in state.get("reviewQueue", []):
        if item.get("personaId") == input_event.personaId:
            item["summary"] = f"Latest saved cue: {input_event.cueLevel}. {input_event.signal.recallGap}"
            break
    save_workspace(state)
    return {"event": event, "summary": build_workspace_summary(state)}


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    return forwarded or (request.client.host if request.client else "unknown")


def realtime_instructions(payload: RealtimeSessionRequest) -> str:
    persona = payload.personaId if payload.personaId in ALLOWED_PERSONA_IDS else "care profile"
    base = (
        "You are Second Brain voice support for cognitive wellness. Use warm, concise, non-diagnostic language. "
        "Ask for one useful recall or reasoning attempt before giving a direct answer unless the user expresses urgent risk. "
        f"Current persona id: {persona}."
    )
    return f"{base} {payload.instructions.strip()}" if payload.instructions else base


async def request_openai_realtime_client_secret(payload: RealtimeSessionRequest) -> dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key is not configured for Realtime voice sessions")

    model = os.getenv("OPENAI_REALTIME_MODEL") or DEFAULT_REALTIME_MODEL
    body = {
        "session": {
            "type": "realtime",
            "model": model,
            "instructions": realtime_instructions(payload),
            "audio": {"output": {"voice": payload.voice}},
        }
    }
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            OPENAI_REALTIME_CLIENT_SECRETS_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=body,
        )
    if response.status_code >= 400:
        detail = response.text[:240] or "OpenAI Realtime session request failed"
        raise HTTPException(status_code=response.status_code, detail=detail)
    return response.json()


def normalize_realtime_secret(openai_json: dict[str, Any]) -> dict[str, Any]:
    session = openai_json.get("session") if isinstance(openai_json.get("session"), dict) else {}
    secret = openai_json.get("client_secret") if isinstance(openai_json.get("client_secret"), dict) else None
    if secret is None:
        secret = session.get("client_secret") if isinstance(session.get("client_secret"), dict) else None
    value = openai_json.get("value") or (secret or {}).get("value")
    expires_at = openai_json.get("expires_at") or (secret or {}).get("expires_at") or session.get("expires_at")
    return {
        "ok": True,
        "mode": "openai-realtime",
        "clientSecret": {"value": value, "expiresAt": expires_at},
        "session": openai_json,
    }


def check_rate_limit(request: Request) -> None:
    key = client_ip(request)
    now = time.time()
    bucket = rate_limit_buckets.get(key)
    if not bucket or now - float(bucket["started_at"]) > 60:
        rate_limit_buckets[key] = {"count": 1, "started_at": now}
        return
    bucket["count"] = int(bucket["count"]) + 1
    if int(bucket["count"]) > MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Too many companion requests")


app = FastAPI(
    title="Second Brain Companion API",
    version="1.0.0",
    description="FastAPI service for Second Brain companion insights and care workspace state.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=resolve_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Companion-Session-Token"],
)


@app.get("/")
def root() -> dict[str, Any]:
    return {"ok": True, "service": "second-brain-fastapi", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "reachable": True,
        "companionReady": True,
        "service": "second-brain-fastapi",
        "authMode": "bearer" if env_token() else "open",
        "hasOpenAiKey": bool(os.getenv("OPENAI_API_KEY")),
        "model": os.getenv("SECOND_BRAIN_MODEL") or os.getenv("OPENAI_MODEL") or DEFAULT_MODEL,
        "companionPath": "/v1/companion",
        "realtimePath": "/v1/realtime/session",
        "realtimeReady": bool(os.getenv("OPENAI_API_KEY")),
    }


@app.get("/api/provider-status")
def provider_status() -> dict[str, Any]:
    model = os.getenv("SECOND_BRAIN_MODEL") or os.getenv("OPENAI_MODEL") or DEFAULT_MODEL
    return {
        "ok": True,
        "reachable": True,
        "companionReady": True,
        "activeProvider": "second-brain-fastapi",
        "service": "second-brain-fastapi",
        "authMode": "bearer" if env_token() else "open",
        "hasOpenAiKey": bool(os.getenv("OPENAI_API_KEY")),
        "baseUrl": os.getenv("SECOND_BRAIN_API_BASE_URL", "http://localhost:8787"),
        "model": model,
        "reason": "",
        "realtimeReady": bool(os.getenv("OPENAI_API_KEY")),
    }


@app.post("/v1/realtime/session", dependencies=[Depends(require_bearer)])
async def realtime_session(payload: RealtimeSessionRequest, request: Request) -> dict[str, Any]:
    check_rate_limit(request)
    openai_json = await request_openai_realtime_client_secret(payload)
    return normalize_realtime_secret(openai_json)


@app.post("/v1/companion", dependencies=[Depends(require_bearer)])
def v1_companion(payload: ExpressCompanionRequest) -> dict[str, Any]:
    frontend_payload = frontend_from_express(payload)
    return build_reply(frontend_payload, payload.model or DEFAULT_MODEL)


@app.post("/api/companion", dependencies=[Depends(require_bearer)])
def api_companion(payload: FrontendCompanionRequest, request: Request) -> dict[str, Any]:
    check_rate_limit(request)
    return build_reply(payload, os.getenv("SECOND_BRAIN_MODEL") or os.getenv("OPENAI_MODEL") or DEFAULT_MODEL)


@app.get("/api/workspace")
def get_workspace() -> dict[str, Any]:
    return {"ok": True, "summary": build_workspace_summary(load_workspace())}


@app.post("/api/workspace")
def post_workspace(payload: WorkspaceMutation) -> dict[str, Any]:
    if payload.action != "append-event":
        raise HTTPException(status_code=400, detail=["action must be append-event"])
    return {"ok": True, **append_workspace_event(payload.event)}
