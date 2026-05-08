import {
  applyCors,
  methodNotAllowed,
  normalizeSecondBrainExpressBaseUrl,
  readJsonBody,
  sendJson,
} from '../server/companionCore.mjs';

function bearerToken() {
  return process.env.SECOND_BRAIN_API_TOKEN || process.env.BACKEND_BEARER_TOKEN || '';
}

async function safeReadText(response) {
  try {
    return await response.text();
  } catch {
    return 'Unable to read response body';
  }
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  const baseUrl = normalizeSecondBrainExpressBaseUrl(process.env.SECOND_BRAIN_API_BASE_URL);
  const token = bearerToken();
  if (!baseUrl || !token) {
    sendJson(res, 503, { ok: false, error: 'Realtime voice session service is not configured.' });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const response = await fetch(`${baseUrl}/v1/realtime/session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });

    if (!response.ok) {
      const message = await safeReadText(response);
      sendJson(res, response.status, { ok: false, error: 'Unable to create realtime voice session.', detail: message.slice(0, 240) });
      return;
    }

    res.status(200).json(await response.json());
  } catch (error) {
    if (error instanceof SyntaxError) {
      res.status(400).json({ ok: false, error: 'Invalid JSON body' });
      return;
    }
    res.status(500).json({ ok: false, error: 'Unable to create realtime voice session.' });
  }
}
