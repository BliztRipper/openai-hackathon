import { describe, expect, it } from 'vitest';
import handler from '../api/provider-status.js';

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

describe('api/provider-status handler', () => {
  it('returns provider readiness for GET requests', async () => {
    const req = { method: 'GET', headers: { origin: 'http://localhost:5173' } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(typeof res.body.reachable).toBe('boolean');
    expect(typeof res.body.companionReady).toBe('boolean');
    expect(res.body.model).toBeTruthy();
  });

  it('rejects unsupported methods', async () => {
    const req = { method: 'POST', headers: { origin: 'http://localhost:5173' } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res.body).ok).toBe(false);
  });
});
