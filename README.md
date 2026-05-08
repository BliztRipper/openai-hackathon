# Second Brain

Second Brain is a post-AGI cognitive wellness co-pilot for healthy aging. It helps older adults preserve cognitive agency while still benefiting from AI assistance: the product asks for useful recall or reasoning effort before completing cognitive work, anchors reality from consented context, and turns longitudinal support patterns into caregiver/clinician review summaries.

## Product scope

- React + Vite + TypeScript frontend.
- Server-side companion insight endpoint with a FastAPI service option and protected continuity behavior when provider access is unavailable.
- JSON care workspace for local product state during development.
- Elderly-first UI: large readable text, voice-first interaction framing, visible consent boundaries, and non-diagnostic support language.
- Care dashboard: cognitive-domain trends, necessary notices, capability-inflation signals, companion-boundary signals, and validation-readiness mapping.

## Run locally

```bash
npm install
python3 -m pip install -r requirements.txt
npm run dev:full:fastapi
```

Open `http://localhost:5173`.

Useful commands:

```bash
npm run test:fastapi
npm run test
npm run build
npm run smoke
```

## Server configuration

The companion insight service is available through `/api/companion`. For a FastAPI backend with interactive docs and the same product contract, run:

```bash
python3 -m pip install -r requirements.txt
npm run dev:full:fastapi
```

FastAPI routes:

- `GET /health` checks service readiness.
- `POST /v1/companion` accepts the service-to-service companion contract.
- `POST /api/companion` accepts the frontend companion contract.
- `GET /api/workspace` and `POST /api/workspace` expose the care workspace.
- `GET /docs` opens the FastAPI API reference.
- `POST /v1/realtime/session` creates a short-lived OpenAI Realtime client secret for browser voice sessions.

Optional environment variables:

```bash
SECOND_BRAIN_API_BASE_URL=http://localhost:8787
SECOND_BRAIN_API_TOKEN=<server-side-bearer-token>
BACKEND_BEARER_TOKEN=<same-service-bearer-token>
SECOND_BRAIN_MODEL=gpt-5.5-pro
OPENAI_API_KEY=<server-side-key-for-realtime-voice>
COMPANION_API_TOKEN=<optional-local-session-token>
OPENAI_REALTIME_MODEL=gpt-realtime
CORS_ALLOW_ORIGIN=https://your-domain.example
WORKSPACE_JSON_PATH=/path/to/workspace.json
```

The browser never receives a standard API key. For voice, call `/api/realtime-session` from the product server or `/v1/realtime/session` from a trusted backend with the service bearer token; the response returns only a short-lived Realtime client secret. If service access is unavailable, the endpoint returns protected guidance using the same response contract so the care flow can continue safely. The preferred model is `gpt-5.5-pro`.

## Care workspace

`/api/workspace` exposes the local care workspace:

- `GET /api/workspace` returns workspace summary, active sessions, recent events, review queue, and dashboard metrics.
- `POST /api/workspace` with `action: "append-event"` saves companion cue events into the local workspace file.

The storage layer is intentionally simple for local development. Replace it with a production database, authentication, consent records, audit logs, and abuse controls before handling real personal health or care data.

## Safety stance

Second Brain presents support recommendations, not diagnoses. It avoids raw surveillance views by default, separates autonomous attempts from AI-assisted completion, and uses uncertainty language for every caregiver/clinician notice.
