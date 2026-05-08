import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import handler from '../api/workspace.js';
import { seedWorkspaceState } from './workspaceCore.mjs';

let workspacePath;

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end(payload = '') { this.body = payload; return this; },
  };
}

beforeEach(async () => {
  const dir = await mkdtemp(join(tmpdir(), 'second-brain-workspace-handler-'));
  workspacePath = join(dir, 'workspace.json');
  await writeFile(workspacePath, JSON.stringify(seedWorkspaceState, null, 2));
  process.env.WORKSPACE_JSON_PATH = workspacePath;
});

describe('api/workspace handler', () => {
  it('returns workspace summary on GET', async () => {
    const res = mockRes();
    await handler({ method: 'GET', headers: { origin: 'http://localhost:5173' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.summary.dashboardMetrics.storageMode).toBe('care-json');
  });

  it('appends a companion event on POST action append-event', async () => {
    const res = mockRes();
    await handler({
      method: 'POST',
      headers: { origin: 'http://localhost:5173' },
      body: {
        action: 'append-event',
        event: {
          personaId: 'malee',
          sessionId: 'session-malee-medication-001',
          stepId: 'open-recall',
          cueLevel: 'Open recall',
          userLine: 'Did I take medicine?',
          assistantLine: 'Let’s recall first.',
          signal: seedWorkspaceState.events[0].signal,
        },
      },
    }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.event.userLine).toBe('Did I take medicine?');
    expect(res.body.summary.dashboardMetrics.eventsStored).toBe(seedWorkspaceState.events.length + 1);
  });

  it('rejects unsupported actions and methods', async () => {
    const badAction = mockRes();
    await handler({ method: 'POST', headers: {}, body: { action: 'delete-all' } }, badAction);
    expect(badAction.statusCode).toBe(400);

    const badMethod = mockRes();
    await handler({ method: 'DELETE', headers: {} }, badMethod);
    expect(badMethod.statusCode).toBe(405);
  });
});
