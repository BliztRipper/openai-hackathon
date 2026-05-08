import { describe, expect, it, vi } from 'vitest';
import { fetchWorkspaceSummary, saveWorkspaceEvent, workspaceFallbackSummary, type WorkspaceEventInput } from './workspaceApi';

const event: WorkspaceEventInput = {
  personaId: 'malee',
  sessionId: 'session-malee-medication-001',
  stepId: 'open-recall',
  cueLevel: 'Open recall',
  userLine: 'Did I take medicine?',
  assistantLine: 'Let’s recall first.',
  signal: {
    assistanceLevel: 'Independent attempt',
    recallGap: 'Uncertain medication event',
    domain: 'Prospective memory',
    cueResponsiveness: 'Needs first cue',
    latency: '18s simulated response latency',
  },
};

describe('workspaceApi client', () => {
  it('loads workspace summary from /api/workspace', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, summary: workspaceFallbackSummary }),
    })) as unknown as typeof fetch;

    const summary = await fetchWorkspaceSummary({ fetcher });
    expect(summary.dashboardMetrics.storageMode).toBe('care-json');
    expect(fetcher).toHaveBeenCalledWith('/api/workspace');
  });

  it('saves companion events through /api/workspace', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, event, summary: workspaceFallbackSummary }),
    })) as unknown as typeof fetch;

    const result = await saveWorkspaceEvent(event, { fetcher });
    expect(result.summary.workspace.name).toBe('Second Brain Care Workspace');
    expect(fetcher).toHaveBeenCalledWith('/api/workspace', expect.objectContaining({ method: 'POST' }));
  });

  it('falls back to seeded workspace when API is unavailable', async () => {
    const fetcher = vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    const summary = await fetchWorkspaceSummary({ fetcher });
    expect(summary.workspace.storageMode).toBe('care-json');
    expect(summary.dashboardMetrics.eventsStored).toBeGreaterThan(0);
  });
});
