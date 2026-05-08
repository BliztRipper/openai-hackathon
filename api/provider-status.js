import { applyCors, checkSecondBrainExpressStatus, sendJson } from '../server/companionCore.mjs';

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  const status = await checkSecondBrainExpressStatus();
  res.status(200).json(status);
}
