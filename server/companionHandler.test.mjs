import { describe, expect, it } from 'vitest';
import handler from '../api/companion.js';
import { resetRateLimitForTests } from './companionCore.mjs';

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

describe('api/companion handler', () => {
  it('returns 400 for malformed JSON instead of a 500', async () => {
    resetRateLimitForTests();
    const req = { method: 'POST', headers: { origin: 'http://localhost:5173' }, body: '{bad json' };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'Invalid JSON body' });
  });

  it('returns 413 for oversized request bodies', async () => {
    resetRateLimitForTests();
    const req = { method: 'POST', headers: { origin: 'http://localhost:5173', 'content-length': '40000' }, body: '{}' };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(413);
    expect(res.body.error).toBe('Request body is too large.');
  });

  it('does not use wildcard CORS on OPTIONS responses', async () => {
    resetRateLimitForTests();
    const req = { method: 'OPTIONS', headers: { origin: 'https://evil.example' } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(204);
    expect(res.headers['Access-Control-Allow-Origin']).not.toBe('*');
  });
});
