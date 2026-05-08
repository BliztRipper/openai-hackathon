# JSON-Backed Production MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Second Brain from a static demo feel into a working MVP where the UI reads/writes product-shaped JSON state through backend APIs, while skipping DB/auth per user instruction.

**Architecture:** Keep Vite/React frontend and existing Node/Vercel API style. Add `server/workspace-data/workspace.json` as the MVP source of truth, `server/workspaceCore.mjs` for read/write/session/signal logic, `/api/workspace` for product state, and client hooks/components that render real workspace status. Existing `/api/companion` remains the OpenAI/mocked insight generator.

**Tech Stack:** React, TypeScript, Vite, Vitest, Node HTTP/serverless handlers, JSON file persistence.

---

## File Structure

- Create `server/workspace-data/workspace.json`: seeded product state with workspace, personas, sessions, events, review queue, and dashboard metrics.
- Create `server/workspaceCore.mjs`: JSON repository, workspace summary builder, event append/session update logic.
- Create `api/workspace.js`: serverless GET/POST endpoint for workspace summary and companion events.
- Modify `server/dev-api.mjs`: route `/api/workspace` in local dev.
- Create `server/workspaceCore.test.mjs`: TDD coverage for summary and event write behavior.
- Create `server/workspaceHandler.test.mjs`: handler method/validation tests.
- Create `src/lib/workspaceApi.ts`: browser client for workspace API with safe seeded fallback.
- Modify `src/App.tsx`: load workspace from API and pass product state to companion/dashboard.
- Modify `src/components/CompanionDemo.tsx`: save cue events to workspace API and show session/event persistence status.
- Modify `src/components/Dashboard.tsx`: show workspace review queue / session evidence from JSON backend.
- Modify `README.md`: explain JSON MVP production mode and no DB/auth scope.

## Tasks

### Task 1: JSON workspace backend
- [ ] Write failing tests for loading workspace summary and appending companion events.
- [ ] Implement JSON read/write helpers and summary builder.
- [ ] Verify tests pass.

### Task 2: API endpoint
- [ ] Write failing handler tests for GET, POST event append, and bad method/invalid action.
- [ ] Implement `/api/workspace` and local dev routing.
- [ ] Verify tests pass.

### Task 3: Frontend product state
- [ ] Write client tests for workspace API success/fallback.
- [ ] Implement `workspaceApi.ts`.
- [ ] Wire App/Companion/Dashboard to API state and event saving.
- [ ] Verify tests/build/smoke.

### Task 4: Documentation and final verification
- [ ] Update README with JSON MVP scope.
- [ ] Run `npm run test`, `npm run build`, smoke/API checks.
