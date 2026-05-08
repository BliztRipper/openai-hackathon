import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const defaultWorkspacePath = join(__dirname, 'workspace-data', 'workspace.json');

export const seedWorkspaceState = Object.freeze({
  workspace: {
    id: 'workspace-bangkok-family-001',
    name: 'Second Brain Care Workspace',
    storageMode: 'care-json',
    productionScope: 'Care workspace with protected review queues',
    updatedAt: '2026-05-09T00:00:00.000Z',
  },
  personas: [
    { id: 'malee', name: 'Malee', role: 'Older adult', location: 'Bangkok' },
    { id: 'somchai', name: 'Somchai', role: 'Older adult', location: 'Chiang Mai' },
    { id: 'araya', name: 'Araya', role: 'Older adult', location: 'Bangkok' },
  ],
  sessions: [
    {
      id: 'session-malee-medication-001',
      personaId: 'malee',
      status: 'active',
      title: 'Morning medication check-in',
      startedAt: '2026-05-09T08:03:00.000+07:00',
      lastCueLevel: 'Specific cue',
      eventCount: 2,
    },
    {
      id: 'session-somchai-judgment-001',
      personaId: 'somchai',
      status: 'active',
      title: 'Prize-message judgment check',
      startedAt: '2026-05-09T09:15:00.000+07:00',
      lastCueLevel: 'Open recall',
      eventCount: 0,
    },
    {
      id: 'session-araya-accounting-001',
      personaId: 'araya',
      status: 'active',
      title: 'Monthly accounting reflection',
      startedAt: '2026-05-09T10:30:00.000+07:00',
      lastCueLevel: 'Open recall',
      eventCount: 0,
    },
  ],
  events: [
    {
      id: 'event-seed-001',
      sessionId: 'session-malee-medication-001',
      personaId: 'malee',
      stepId: 'open-recall',
      cueLevel: 'Open recall',
      userLine: 'Did I already take my morning medicine?',
      assistantLine: 'Let’s help your memory first.',
      createdAt: '2026-05-09T08:04:00.000+07:00',
      signal: {
        assistanceLevel: 'Independent attempt',
        recallGap: 'Uncertain medication event',
        domain: 'Prospective memory',
        cueResponsiveness: 'Needs first cue',
        latency: '18s response latency',
      },
    },
    {
      id: 'event-seed-002',
      sessionId: 'session-malee-medication-001',
      personaId: 'malee',
      stepId: 'specific-cue',
      cueLevel: 'Specific cue',
      userLine: 'Maybe after tea. I still cannot picture it.',
      assistantLine: 'Your routine photo log shows the blue pill box beside the green mug at 8:12.',
      createdAt: '2026-05-09T08:06:00.000+07:00',
      signal: {
        assistanceLevel: 'Hint-supported',
        recallGap: 'Needs visual anchor to reconstruct event',
        domain: 'Orientation + short-term memory',
        cueResponsiveness: 'Recognizes routine after specific cue',
        latency: '31s response latency',
      },
    },
  ],
  reviewQueue: [
    {
      id: 'review-malee-medication-001',
      personaId: 'malee',
      source: 'json-workspace',
      priority: 'review-today',
      title: 'Medication routine needs more cueing',
      summary: 'JSON event history shows recall support is increasing while direct answers remain gated behind recall attempts.',
    },
    {
      id: 'review-somchai-social-001',
      personaId: 'somchai',
      source: 'json-workspace',
      priority: 'watch',
      title: 'Payment verification cue ready',
      summary: 'Care workspace tracks social-cue and financial-judgment support without exposing raw message content.',
    },
    {
      id: 'review-araya-finance-001',
      personaId: 'araya',
      source: 'json-workspace',
      priority: 'routine-review',
      title: 'Draft-first finance support enabled',
      summary: 'Care workspace compares autonomous accounting explanations with AGI-polished summaries.',
    },
  ],
});

export class WorkspaceRequestError extends Error {
  constructor(message, details = [], statusCode = 400) {
    super(message);
    this.name = 'WorkspaceRequestError';
    this.details = details;
    this.statusCode = statusCode;
  }
}

export async function loadWorkspace(path = defaultWorkspacePath) {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

export async function saveWorkspace(state, path = defaultWorkspacePath) {
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`);
}

export function buildWorkspaceSummary(state) {
  const eventsBySession = new Map();
  for (const event of state.events) {
    const list = eventsBySession.get(event.sessionId) ?? [];
    list.push(event);
    eventsBySession.set(event.sessionId, list);
  }

  const activeSessions = state.sessions
    .filter((session) => session.status === 'active')
    .map((session) => {
      const events = eventsBySession.get(session.id) ?? [];
      const lastEvent = events.at(-1);
      return {
        ...session,
        eventCount: events.length,
        lastCueLevel: lastEvent?.cueLevel ?? session.lastCueLevel,
        lastSignalDomain: lastEvent?.signal?.domain ?? 'No event yet',
        lastUpdatedAt: lastEvent?.createdAt ?? session.startedAt,
      };
    });

  return {
    workspace: state.workspace,
    personas: state.personas,
    activeSessions,
    recentEvents: [...state.events].slice(-6).reverse(),
    reviewQueue: state.reviewQueue,
    dashboardMetrics: {
      storageMode: state.workspace.storageMode,
      eventsStored: state.events.length,
      activeSessionCount: activeSessions.length,
      reviewItemCount: state.reviewQueue.length,
      lastUpdatedAt: state.events.at(-1)?.createdAt ?? state.workspace.updatedAt,
    },
  };
}

function validateEventInput(state, input) {
  const details = [];
  const personaIds = new Set(state.personas.map((persona) => persona.id));
  const session = state.sessions.find((item) => item.id === input?.sessionId);

  if (!personaIds.has(input?.personaId)) details.push('personaId must exist in workspace JSON');
  if (!session) details.push('sessionId must exist in workspace JSON');
  if (session && input?.personaId && session.personaId !== input.personaId) details.push('sessionId must belong to personaId');
  for (const field of ['stepId', 'cueLevel', 'userLine', 'assistantLine']) {
    if (typeof input?.[field] !== 'string' || input[field].trim().length === 0) details.push(`${field} is required`);
  }
  if (!input?.signal || typeof input.signal !== 'object') details.push('signal is required');

  if (details.length > 0) throw new WorkspaceRequestError('Workspace event is invalid.', details);
}

export async function appendCompanionEvent(path = defaultWorkspacePath, input) {
  const state = await loadWorkspace(path);
  validateEventInput(state, input);

  const event = {
    id: `event-${Date.now()}-${state.events.length + 1}`,
    sessionId: input.sessionId,
    personaId: input.personaId,
    stepId: input.stepId,
    cueLevel: input.cueLevel,
    userLine: input.userLine,
    assistantLine: input.assistantLine,
    createdAt: new Date().toISOString(),
    signal: input.signal,
  };

  state.events.push(event);
  state.workspace.updatedAt = event.createdAt;
  state.sessions = state.sessions.map((session) => session.id === input.sessionId
    ? { ...session, lastCueLevel: input.cueLevel, eventCount: (session.eventCount ?? 0) + 1 }
    : session);

  const existingReview = state.reviewQueue.find((item) => item.personaId === input.personaId);
  if (existingReview) {
    existingReview.summary = `Latest saved cue: ${input.cueLevel}. ${input.signal.recallGap}`;
  }

  await saveWorkspace(state, path);
  return { event, summary: buildWorkspaceSummary(state) };
}
