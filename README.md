# Second Brain

Second Brain is a post-AGI cognitive wellness co-pilot for healthy aging. It helps older adults preserve cognitive agency while still benefiting from AI assistance: the product asks for useful recall or reasoning effort before completing cognitive work, anchors reality from consented context, and turns longitudinal support patterns into caregiver/clinician review summaries.

## Product scope

- React + Vite + TypeScript frontend.
- Server-side companion insight endpoint with protected continuity behavior when provider access is unavailable.
- JSON care workspace for local product state during development.
- Elderly-first UI: large readable text, voice-first interaction framing, visible consent boundaries, and non-diagnostic support language.
- Care dashboard: cognitive-domain trends, necessary notices, capability-inflation signals, companion-boundary signals, and validation-readiness mapping.

## Run locally

```bash
npm install
npm run dev:full
```

Open `http://localhost:5173`.

Useful commands:

```bash
npm run test
npm run build
npm run smoke
```

## Server configuration

The companion insight service is implemented at `/api/companion`. It proxies the Second Brain Express API from `http://206.189.235.67:8787/docs` when `SECOND_BRAIN_API_TOKEN` is configured. `/api/provider-status` checks remote health and whether the server is ready to call authenticated companion routes. Provider credentials stay server-side.

Optional environment variables:

```bash
SECOND_BRAIN_API_BASE_URL=http://206.189.235.67:8787
SECOND_BRAIN_API_TOKEN=<server-side-bearer-token>
SECOND_BRAIN_MODEL=gpt-5.5-pro
OPENAI_API_KEY=<optional-server-side-key>
COMPANION_API_TOKEN=<optional-local-session-token>
CORS_ALLOW_ORIGIN=https://your-domain.example
WORKSPACE_JSON_PATH=/path/to/workspace.json
```

The browser never receives a standard API key. If the remote service is unavailable or the bearer token is not configured, the endpoint returns protected guidance using the same response contract so the care flow can continue safely. The preferred model is `gpt-5.5-pro`.

## Care workspace

`/api/workspace` exposes the local care workspace:

- `GET /api/workspace` returns workspace summary, active sessions, recent events, review queue, and dashboard metrics.
- `POST /api/workspace` with `action: "append-event"` saves companion cue events into the local workspace file.

The storage layer is intentionally simple for local development. Replace it with a production database, authentication, consent records, audit logs, and abuse controls before handling real personal health or care data.

## Safety stance

Second Brain presents support recommendations, not diagnoses. It avoids raw surveillance views by default, separates autonomous attempts from AI-assisted completion, and uses uncertainty language for every caregiver/clinician notice.
