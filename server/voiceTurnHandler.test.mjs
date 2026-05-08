import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import handler from '../api/voice-turn.js';

function createMockRes() {
  const headers = {};
  return {
    headers,
    statusCode: 200,
    body: undefined,
    setHeader(key, value) { headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end(payload = '') { this.body = payload; return this; },
  };
}

describe('api/voice-turn handler', () => {
  const originalFetch = global.fetch;
  const originalBase = process.env.SECOND_BRAIN_API_BASE_URL;
  const originalToken = process.env.SECOND_BRAIN_API_TOKEN;

  beforeEach(() => {
    process.env.SECOND_BRAIN_API_BASE_URL = 'https://second-brain-fastapi.vercel.app';
    process.env.SECOND_BRAIN_API_TOKEN = 'server-token';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.SECOND_BRAIN_API_BASE_URL = originalBase;
    process.env.SECOND_BRAIN_API_TOKEN = originalToken;
  });

  it('proxies one-turn voice transcripts to the FastAPI backend', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, reply: 'Pause and use one clue first.' }),
    }));
    global.fetch = fetchImpl;
    const req = { method: 'POST', headers: { origin: 'http://localhost:5173' }, body: { personaId: 'malee', transcript: 'Not sure', question: 'Hi Malee' } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.reply).toContain('clue');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://second-brain-fastapi.vercel.app/v1/voice/turn',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer server-token' }),
      }),
    );
  });

  it('rejects unsupported methods', async () => {
    const req = { method: 'GET', headers: { origin: 'http://localhost:5173' } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
  });
});
