import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';

function loadLocalEnv(files = ['.env.local', '.env']) {
  for (const file of files) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const index = trimmed.indexOf('=');
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadLocalEnv();
import {
  CompanionRequestError,
  applyCors,
  checkSecondBrainExpressStatus,
  checkRateLimit,
  createCompanionResponse,
  methodNotAllowed,
  normalizeSecondBrainExpressBaseUrl,
  readJsonBody,
  sendJson,
} from './companionCore.mjs';
import { WorkspaceRequestError, appendCompanionEvent, buildWorkspaceSummary, defaultWorkspacePath, loadWorkspace } from './workspaceCore.mjs';

const port = Number(process.env.API_PORT || 8787);

const server = createServer(async (req, res) => {
  applyCors(req, res, { ...process.env, CORS_ALLOW_ORIGIN: process.env.CORS_ALLOW_ORIGIN || 'http://localhost:5173' });

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const path = req.url?.split('?')[0];

  if (path === '/api/provider-status') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET, OPTIONS');
      sendJson(res, 405, { ok: false, error: 'Method not allowed' });
      return;
    }
    sendJson(res, 200, await checkSecondBrainExpressStatus());
    return;
  }

  if (path === '/api/realtime-session') {
    if (req.method !== 'POST') {
      methodNotAllowed(res);
      return;
    }
    try {
      const baseUrl = normalizeSecondBrainExpressBaseUrl(process.env.SECOND_BRAIN_API_BASE_URL);
      const token = process.env.SECOND_BRAIN_API_TOKEN || process.env.BACKEND_BEARER_TOKEN;
      if (!baseUrl || !token) {
        sendJson(res, 503, { ok: false, error: 'Realtime voice session service is not configured.' });
        return;
      }
      const body = await readJsonBody(req);
      const response = await fetch(`${baseUrl}/v1/realtime/session`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      const json = await response.json();
      sendJson(res, response.status, json);
    } catch {
      sendJson(res, 500, { ok: false, error: 'Unable to create realtime voice session.' });
    }
    return;
  }

  if (path === '/api/voice-turn') {
    if (req.method !== 'POST') {
      methodNotAllowed(res);
      return;
    }
    try {
      const baseUrl = normalizeSecondBrainExpressBaseUrl(process.env.SECOND_BRAIN_API_BASE_URL);
      const token = process.env.SECOND_BRAIN_API_TOKEN || process.env.BACKEND_BEARER_TOKEN;
      if (baseUrl && token) {
        const body = await readJsonBody(req);
        const response = await fetch(`${baseUrl}/v1/voice/turn`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {}),
        });
        const json = await response.json();
        sendJson(res, response.status, json);
        return;
      }

      const body = await readJsonBody(req);
      const transcript = String(body?.transcript || '').trim();
      const personaId = String(body?.personaId || '');
      const replies = {
        malee: 'Use the blue pill-box clue first: the morning medicine is normally taken after breakfast. If the slot is still full, take it now and mark it complete.',
        somchai: 'Do not share account details or transfer money. Save the number, let the call go to voicemail, and ask Nok to check it with you.',
        araya: 'Keep the finance reasoning active: name the expense category, compare it with this week’s plan, then I will summarize the safest next step.',
      };
      sendJson(res, 200, {
        ok: true,
        personaId,
        question: String(body?.question || ''),
        transcript,
        reply: replies[personaId] || 'I heard you. I will keep this to one response and guide the next safe step.',
        signal: { severity: personaId === 'somchai' ? 'critical' : 'watch', supportScore: personaId === 'somchai' ? 28 : 62, domain: 'voice-support' },
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(res, 400, { ok: false, error: 'Invalid JSON body' });
        return;
      }
      sendJson(res, 500, { ok: false, error: 'Unable to process voice answer.' });
    }
    return;
  }

  if (path === '/api/workspace') {
    if (req.method === 'GET') {
      const state = await loadWorkspace(process.env.WORKSPACE_JSON_PATH || defaultWorkspacePath);
      sendJson(res, 200, { ok: true, summary: buildWorkspaceSummary(state) });
      return;
    }
    if (req.method !== 'POST') {
      methodNotAllowed(res);
      return;
    }
    try {
      const body = await readJsonBody(req);
      if (body.action !== 'append-event') throw new WorkspaceRequestError('Unsupported workspace action.', ['action must be append-event']);
      const result = await appendCompanionEvent(process.env.WORKSPACE_JSON_PATH || defaultWorkspacePath, body.event);
      sendJson(res, 200, { ok: true, ...result });
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(res, 400, { ok: false, error: 'Invalid JSON body' });
        return;
      }
      if (error instanceof WorkspaceRequestError) {
        sendJson(res, error.statusCode, { ok: false, error: error.message, details: error.details });
        return;
      }
      sendJson(res, 500, { ok: false, error: 'Unable to update workspace.' });
    }
    return;
  }

  if (path !== '/api/companion') {
    sendJson(res, 404, { ok: false, error: 'Not found' });
    return;
  }

  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    checkRateLimit(req);
    const payload = await readJsonBody(req);
    const result = await createCompanionResponse(payload, { headers: req.headers });
    sendJson(res, 200, result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJson(res, 400, { ok: false, error: 'Invalid JSON body' });
      return;
    }
    if (error instanceof CompanionRequestError) {
      sendJson(res, error.statusCode, { ok: false, error: error.message, details: error.details });
      return;
    }
    sendJson(res, 500, { ok: false, error: 'Unable to create companion response.' });
  }
});

server.listen(port, () => {
  console.log(`Second Brain API listening on http://localhost:${port}/api/companion`);
});
