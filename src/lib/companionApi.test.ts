import { describe, expect, it, vi } from 'vitest';
import { buildClientFallback, fetchProviderStatus, requestCompanionInsight, type CompanionApiRequest } from './companionApi';

const payload: CompanionApiRequest = {
  personaId: 'malee',
  personaName: 'Malee',
  cueLevel: 'Open recall',
  userLine: 'Did I already take my morning medicine?',
  assistantLine: 'Let’s help your memory first.',
  helper: 'Second Brain asks for effortful recall before using logs.',
  signal: {
    assistanceLevel: 'Independent attempt',
    recallGap: 'Uncertain medication event',
    domain: 'Prospective memory',
    cueResponsiveness: 'Needs first cue',
    latency: '18s simulated response latency',
  },
};

describe('companionApi client', () => {
  it('posts the companion payload to the server API', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        mode: 'protected',
        source: 'protected-continuity',
        model: null,
        generatedAt: '2026-05-08T00:00:00.000Z',
        companionNote: 'Safe note',
        nextBestAction: 'Review',
        safetyBoundary: 'Synthetic only',
        rubricEvidence: [{ label: 'Execution', evidence: 'Works' }],
      }),
    })) as unknown as typeof fetch;

    const result = await requestCompanionInsight(payload, { fetcher });
    expect(result.companionNote).toBe('Safe note');
    expect(fetcher).toHaveBeenCalledWith('/api/companion', expect.objectContaining({ method: 'POST' }));
  });

  it('returns a safe browser fallback on network errors', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('connection refused');
    }) as unknown as typeof fetch;

    const result = await requestCompanionInsight(payload, { fetcher });
    expect(result.ok).toBe(false);
    expect(result.source).toBe('client-continuity');
    expect(result.degradedReason).toContain('connection refused');
  });

  it('describes the server-side setup in the fallback action', () => {
    const fallback = buildClientFallback(new Error('missing server'));
    expect(fallback.nextBestAction).toContain('Retry the companion insight service');
    expect(fallback.safetyBoundary).toContain('No secret key');
  });

  it('loads real provider readiness from the server status endpoint', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        reachable: true,
        companionReady: true,
        service: 'second-brain-express',
        authMode: 'bearer',
        baseUrl: 'http://206.189.235.67:8787',
        model: 'gpt-5.5-pro',
      }),
    })) as unknown as typeof fetch;

    const status = await fetchProviderStatus({ fetcher });

    expect(status.companionReady).toBe(true);
    expect(status.service).toBe('second-brain-express');
    expect(status.model).toBe('gpt-5.5-pro');
    expect(fetcher).toHaveBeenCalledWith('/api/provider-status');
  });
});
