import {
  CompanionRequestError,
  applyCors,
  checkRateLimit,
  createCompanionResponse,
  methodNotAllowed,
  readJsonBody,
} from '../server/companionCore.mjs';

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

  try {
    checkRateLimit(req);
    const payload = await readJsonBody(req);
    const result = await createCompanionResponse(payload, { headers: req.headers });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      res.status(400).json({ ok: false, error: 'Invalid JSON body' });
      return;
    }
    if (error instanceof CompanionRequestError) {
      res.status(error.statusCode).json({ ok: false, error: error.message, details: error.details });
      return;
    }
    res.status(500).json({ ok: false, error: 'Unable to create companion response.' });
  }
}
