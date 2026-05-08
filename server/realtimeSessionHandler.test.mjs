import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import handler from '../api/realtime-session.js';

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

describe('api/realtime-session handler', () => {
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

  it('proxies realtime session creation to the FastAPI backend without exposing the bearer token', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, mode: 'openai-realtime', clientSecret: { value: 'ek_test', expiresAt: 1778285000 } }),
    }));
    global.fetch = fetchImpl;
    const req = { method: 'POST', headers: { origin: 'http://localhost:5173' }, body: { personaId: 'malee', voice: 'alloy' } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.clientSecret.value).toBe('ek_test');
    expect(JSON.stringify(res.body)).not.toContain('server-token');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://second-brain-fastapi.vercel.app/v1/realtime/session',
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
    expect(JSON.parse(res.body).ok).toBe(false);
  });
});
