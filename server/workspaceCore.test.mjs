import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  appendCompanionEvent,
  buildWorkspaceSummary,
  loadWorkspace,
  seedWorkspaceState,
} from './workspaceCore.mjs';

let workspacePath;

beforeEach(async () => {
  const dir = await mkdtemp(join(tmpdir(), 'second-brain-workspace-'));
  workspacePath = join(dir, 'workspace.json');
  await writeFile(workspacePath, JSON.stringify(seedWorkspaceState, null, 2));
});

describe('workspaceCore JSON MVP repository', () => {
  it('loads product-shaped workspace summary from JSON state', async () => {
    const state = await loadWorkspace(workspacePath);
    const summary = buildWorkspaceSummary(state);

    expect(summary.workspace.name).toBe('Second Brain Care Workspace');
    expect(summary.activeSessions.length).toBeGreaterThan(0);
    expect(summary.reviewQueue[0].source).toBe('json-workspace');
    expect(summary.dashboardMetrics.eventsStored).toBeGreaterThan(0);
    expect(summary.dashboardMetrics.storageMode).toBe('care-json');
  });

  it('appends a companion event and updates the active session evidence', async () => {
    const result = await appendCompanionEvent(workspacePath, {
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
    });

    expect(result.event.id).toMatch(/^event-/);
    expect(result.summary.dashboardMetrics.eventsStored).toBe(seedWorkspaceState.events.length + 1);
    expect(result.summary.activeSessions[0].lastCueLevel).toBe('Open recall');

    const saved = JSON.parse(await readFile(workspacePath, 'utf8'));
    expect(saved.events.at(-1).userLine).toBe('Did I take medicine?');
  });



  it('rejects events when the session belongs to a different persona', async () => {
    await expect(appendCompanionEvent(workspacePath, {
      personaId: 'somchai',
      sessionId: 'session-malee-medication-001',
      stepId: 'social-open-recall',
      cueLevel: 'Open recall',
      userLine: 'Prize message?',
      assistantLine: 'Let’s inspect risk cues first.',
      signal: seedWorkspaceState.events[0].signal,
    })).rejects.toMatchObject({ details: expect.arrayContaining(['sessionId must belong to personaId']) });
  });

  it('rejects events for unsupported personas before writing JSON', async () => {
    await expect(appendCompanionEvent(workspacePath, {
      personaId: 'unknown',
      sessionId: 'session-malee-medication-001',
      stepId: 'open-recall',
      cueLevel: 'Open recall',
      userLine: 'x',
      assistantLine: 'y',
      signal: seedWorkspaceState.events[0].signal,
    })).rejects.toMatchObject({ statusCode: 400 });
  });
});
