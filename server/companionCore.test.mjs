import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Readable } from 'node:stream';
import {
  CompanionRequestError,
  MAX_BODY_BYTES,
  applyCors,
  buildMockCompanionResponse,
  callSecondBrainExpress,
  checkSecondBrainExpressStatus,
  checkRateLimit,
  createCompanionResponse,
  extractResponseText,
  readJsonBody,
  resetRateLimitForTests,
  validateCompanionPayload,
} from './companionCore.mjs';

const validPayload = {
  personaId: 'malee',
  personaName: 'Malee',
  cueLevel: 'Specific cue',
  userLine: 'Maybe after tea. I still cannot picture it.',
  assistantLine: 'Your routine photo log shows the blue pill box beside the green mug at 8:12.',
  helper: 'Reality Anchor uses ground-truth logs to scaffold reorientation.',
  signal: {
    assistanceLevel: 'Hint-supported',
    recallGap: 'Needs visual anchor to reconstruct event',
    domain: 'Orientation + short-term memory',
    cueResponsiveness: 'Recognizes routine after specific cue',
    latency: '31s simulated response latency',
  },
};

describe('companionCore', () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });
  it('validates required request fields', () => {
    expect(validateCompanionPayload(validPayload).personaName).toBe('Malee');
    expect(() => validateCompanionPayload({ personaId: 'malee' })).toThrow(CompanionRequestError);
  });

  it('returns protected guidance when no API key is configured', async () => {
    const result = await createCompanionResponse(validPayload, { apiKey: '' });
    expect(result.mode).toBe('protected');
    expect(result.source).toBe('protected-continuity');
    expect(result.companionNote).toContain('support signal');
    expect(result.rubricEvidence.map((item) => item.label)).toContain('Impact');
  });


  it('uses the Second Brain Express companion API with gpt-5.5-pro when configured', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        reply: 'Remote recall-first guidance from Second Brain Express.',
        cueLevel: 'Specific cue',
        helper: 'Use the smallest useful cue.',
        signals: { supportNeed: 'review' },
      }),
    }));

    const result = await createCompanionResponse(validPayload, {
      remoteApiBaseUrl: 'http://206.189.235.67:8787',
      remoteApiToken: 'remote-token',
      model: 'gpt-5.5-pro',
      fetchImpl,
    });

    expect(result.mode).toBe('express');
    expect(result.source).toBe('second-brain-express');
    expect(result.model).toBe('gpt-5.5-pro');
    expect(result.companionNote).toBe('Remote recall-first guidance from Second Brain Express.');
    expect(result.nextBestAction).toContain('Use the smallest useful cue');
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://206.189.235.67:8787/v1/companion',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer remote-token' }),
      }),
    );
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body).toMatchObject({
      personaId: 'malee',
      sessionId: 'malee-companion-session',
      context: 'concerning_trend',
      model: 'gpt-5.5-pro',
      userInput: validPayload.userLine,
    });
  });

  it('normalizes direct Second Brain Express responses', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ reply: 'Thai care reply', cueLevel: 'Category hint', helper: 'Ask one question first.' }),
    }));

    const result = await callSecondBrainExpress(validateCompanionPayload(validPayload), {
      remoteApiBaseUrl: 'http://206.189.235.67:8787/docs',
      remoteApiToken: 'remote-token',
      model: 'gpt-5.5-pro',
      fetchImpl,
    });

    expect(result.mode).toBe('express');
    expect(result.companionNote).toBe('Thai care reply');
    expect(result.remoteCueLevel).toBe('Category hint');
    expect(result.nextBestAction).toContain('Ask one question first.');
    expect(fetchImpl.mock.calls[0][0]).toBe('http://206.189.235.67:8787/v1/companion');
  });

  it('checks remote Second Brain Express health without exposing the bearer token', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        service: 'second-brain-express',
        authMode: 'bearer',
        hasOpenAiKey: true,
      }),
    }));

    const status = await checkSecondBrainExpressStatus({
      remoteApiBaseUrl: 'http://206.189.235.67:8787/docs',
      remoteApiToken: 'super-secret-token',
      model: 'gpt-5.5-pro',
      fetchImpl,
    });

    expect(status).toMatchObject({
      ok: true,
      reachable: true,
      companionReady: true,
      activeProvider: 'second-brain-express',
      service: 'second-brain-express',
      authMode: 'bearer',
      hasOpenAiKey: true,
      baseUrl: 'http://206.189.235.67:8787',
      model: 'gpt-5.5-pro',
    });
    expect(JSON.stringify(status)).not.toContain('super-secret-token');
    expect(fetchImpl).toHaveBeenCalledWith('http://206.189.235.67:8787/health', expect.objectContaining({ method: 'GET' }));
  });

  it('reports remote health separately from missing companion bearer token', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, service: 'second-brain-express', authMode: 'bearer', hasOpenAiKey: true }),
    }));

    const status = await checkSecondBrainExpressStatus({
      remoteApiBaseUrl: 'http://206.189.235.67:8787',
      remoteApiToken: '',
      apiKey: '',
      fetchImpl,
    });

    expect(status.reachable).toBe(true);
    expect(status.companionReady).toBe(false);
    expect(status.activeProvider).toBe('unconfigured');
    expect(status.reason).toContain('bearer token');
  });

  it('marks direct OpenAI as ready when remote bearer is missing but an OpenAI key exists', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, service: 'second-brain-express', authMode: 'bearer', hasOpenAiKey: true }),
    }));

    const status = await checkSecondBrainExpressStatus({
      remoteApiBaseUrl: 'http://206.189.235.67:8787',
      remoteApiToken: '',
      apiKey: 'test-openai-key',
      fetchImpl,
    });

    expect(status.reachable).toBe(true);
    expect(status.companionReady).toBe(true);
    expect(status.activeProvider).toBe('openai-responses-api');
    expect(status.reason).toContain('direct OpenAI');
  });

  it('uses direct OpenAI when Second Brain Express is reachable but its bearer token is missing', async () => {
    const fetchImpl = vi.fn(async (url) => {
      expect(url).toBe('https://api.openai.com/v1/responses');
      return {
        ok: true,
        json: async () => ({
          id: 'resp_real_path',
          output: [{ content: [{ type: 'output_text', text: 'Real provider note from OpenAI.' }] }],
        }),
      };
    });

    const result = await createCompanionResponse(validPayload, {
      remoteApiBaseUrl: 'http://206.189.235.67:8787',
      remoteApiToken: '',
      apiKey: 'test-openai-key',
      companionAuthRequired: false,
      model: 'gpt-5.5-pro',
      fetchImpl,
    });

    expect(result.mode).toBe('openai');
    expect(result.model).toBe('gpt-5.5-pro');
    expect(result.companionNote).toBe('Real provider note from OpenAI.');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('uses injected OpenAI Responses API fetcher when an API key exists', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 'resp_test',
        output: [
          {
            type: 'message',
            content: [{ type: 'output_text', text: 'Generated safe support note from raw Responses output.' }],
          },
        ],
      }),
    }));

    const result = await createCompanionResponse(validPayload, {
      apiKey: 'test-key',
      companionToken: 'trusted-session',
      headers: { 'x-companion-session-token': 'trusted-session' },
      model: 'gpt-5.2',
      fetchImpl,
    });

    expect(result.mode).toBe('openai');
    expect(result.model).toBe('gpt-5.2');
    expect(result.responseId).toBe('resp_test');
    expect(result.companionNote).toBe('Generated safe support note from raw Responses output.');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses',
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer test-key' }) }),
    );
  });

  it('degrades to protected guidance if the OpenAI call fails', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500, text: async () => 'server error' }));
    const result = await createCompanionResponse(validPayload, {
      apiKey: 'test-key',
      companionToken: 'trusted-session',
      headers: { 'x-companion-session-token': 'trusted-session' },
      fetchImpl,
    });
    expect(result.mode).toBe('protected');
    expect(result.source).toBe('provider-continuity');
    expect(result.degradedReason).toContain('protected guidance returned');
  });

  it('surfaces a safe quota message when the real OpenAI provider has no available quota', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 429,
      text: async () => '{"error":{"message":"You exceeded your current quota","type":"insufficient_quota"}}',
    }));

    const result = await createCompanionResponse(validPayload, {
      apiKey: 'test-key',
      companionAuthRequired: false,
      fetchImpl,
    });

    expect(result.mode).toBe('protected');
    expect(result.degradedReason).toContain('OpenAI quota');
    expect(result.degradedReason).not.toContain('test-key');
  });





  it('extracts Responses API text from SDK convenience and raw REST shapes', () => {
    expect(extractResponseText({ output_text: 'SDK text' })).toBe('SDK text');
    expect(extractResponseText({
      output: [
        { content: [{ type: 'output_text', text: 'Raw part A' }, { type: 'output_text', text: 'Raw part B' }] },
      ],
    })).toBe('Raw part A\nRaw part B');
  });

  it('does not spend OpenAI quota without the server session token gate', async () => {
    const fetchImpl = vi.fn();
    const result = await createCompanionResponse(validPayload, {
      apiKey: 'test-key',
      companionToken: 'trusted-session',
      headers: { 'x-companion-session-token': 'wrong-token' },
      fetchImpl,
    });

    expect(result.mode).toBe('protected');
    expect(result.source).toBe('authorized-continuity');
    expect(result.degradedReason).toContain('authorized session token');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects unsupported enum values and oversized fields before model calls', () => {
    expect(() => validateCompanionPayload({ ...validPayload, personaId: 'unknown' })).toThrow(CompanionRequestError);
    expect(() => validateCompanionPayload({ ...validPayload, userLine: 'x'.repeat(701) })).toThrow(CompanionRequestError);
  });

  it('caps request bodies before buffering unlimited input', async () => {
    await expect(readJsonBody({ headers: { 'content-length': String(MAX_BODY_BYTES + 1) } })).rejects.toMatchObject({ statusCode: 413 });
    await expect(readJsonBody({ headers: {}, body: { personaId: 'malee', extra: 'x'.repeat(MAX_BODY_BYTES) } })).rejects.toMatchObject({ statusCode: 413 });

    const stream = Readable.from(['{', '"personaId":"', 'x'.repeat(MAX_BODY_BYTES), '"}']);
    stream.headers = {};
    await expect(readJsonBody(stream)).rejects.toMatchObject({ statusCode: 413 });
  });

  it('rate-limits repeated requests from the same client key', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.10' } };
    for (let index = 0; index < 30; index += 1) checkRateLimit(req, 1000);
    expect(() => checkRateLimit(req, 1000)).toThrow(CompanionRequestError);
  });

  it('does not emit wildcard CORS and fails closed in production without configured origins', () => {
    const headers = {};
    const res = { setHeader: (key, value) => { headers[key] = value; } };
    applyCors({ headers: { origin: 'https://evil.example' } }, res, { NODE_ENV: 'production' });
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();

    const wildcardHeaders = {};
    const wildcardRes = { setHeader: (key, value) => { wildcardHeaders[key] = value; } };
    applyCors({ headers: { origin: 'https://evil.example' } }, wildcardRes, { NODE_ENV: 'production', CORS_ALLOW_ORIGIN: '*' });
    expect(wildcardHeaders['Access-Control-Allow-Origin']).toBeUndefined();
    expect(headers['Access-Control-Allow-Headers']).toContain('X-Companion-Session-Token');
  });

  it('keeps protected response non-diagnostic and human-review oriented', () => {
    const result = buildMockCompanionResponse(validateCompanionPayload(validPayload));
    expect(result.safetyBoundary).toContain('Non-diagnostic');
    expect(result.nextBestAction).toContain('caregiver or clinician review');
  });
});
