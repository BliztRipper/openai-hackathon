import type { ConversationStep } from '../data/conversation';
import type { PersonaId } from '../data/personas';

export type WorkspaceEventInput = {
  personaId: PersonaId;
  sessionId: string;
  stepId: string;
  cueLevel: string;
  userLine: string;
  assistantLine: string;
  signal: ConversationStep['signal'];
};

export type WorkspaceSummary = {
  workspace: {
    id: string;
    name: string;
    storageMode: 'care-json';
    productionScope: string;
    updatedAt: string;
  };
  personas: Array<{ id: PersonaId; name: string; role: string; location: string }>;
  activeSessions: Array<{
    id: string;
    personaId: PersonaId;
    status: string;
    title: string;
    startedAt: string;
    eventCount: number;
    lastCueLevel: string;
    lastSignalDomain: string;
    lastUpdatedAt: string;
  }>;
  recentEvents: Array<WorkspaceEventInput & { id: string; createdAt: string }>;
  reviewQueue: Array<{ id: string; personaId: PersonaId; source: string; priority: string; title: string; summary: string }>;
  dashboardMetrics: {
    storageMode: 'care-json';
    eventsStored: number;
    activeSessionCount: number;
    reviewItemCount: number;
    lastUpdatedAt: string;
  };
};

type Options = { fetcher?: typeof fetch };

export const workspaceFallbackSummary: WorkspaceSummary = {
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
  activeSessions: [
    {
      id: 'session-malee-medication-001',
      personaId: 'malee',
      status: 'active',
      title: 'Morning medication check-in',
      startedAt: '2026-05-09T08:03:00.000+07:00',
      eventCount: 2,
      lastCueLevel: 'Specific cue',
      lastSignalDomain: 'Orientation + short-term memory',
      lastUpdatedAt: '2026-05-09T08:06:00.000+07:00',
    },
    {
      id: 'session-somchai-judgment-001',
      personaId: 'somchai',
      status: 'active',
      title: 'Prize-message judgment check',
      startedAt: '2026-05-09T09:15:00.000+07:00',
      eventCount: 0,
      lastCueLevel: 'Open recall',
      lastSignalDomain: 'Social cognition + financial judgment',
      lastUpdatedAt: '2026-05-09T09:15:00.000+07:00',
    },
    {
      id: 'session-araya-accounting-001',
      personaId: 'araya',
      status: 'active',
      title: 'Monthly accounting reflection',
      startedAt: '2026-05-09T10:30:00.000+07:00',
      eventCount: 0,
      lastCueLevel: 'Open recall',
      lastSignalDomain: 'Planning + financial management',
      lastUpdatedAt: '2026-05-09T10:30:00.000+07:00',
    },
  ],
  recentEvents: [],
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
  dashboardMetrics: {
    storageMode: 'care-json',
    eventsStored: 2,
    activeSessionCount: 3,
    reviewItemCount: 3,
    lastUpdatedAt: '2026-05-09T08:06:00.000+07:00',
  },
};

export async function fetchWorkspaceSummary(options: Options = {}): Promise<WorkspaceSummary> {
  const fetcher = options.fetcher ?? fetch;
  try {
    const response = await fetcher('/api/workspace');
    if (!response.ok) throw new Error(`Workspace API returned ${response.status}`);
    const data = await response.json();
    if (!data?.summary?.dashboardMetrics) throw new Error('Workspace API returned an invalid payload');
    return data.summary as WorkspaceSummary;
  } catch {
    return workspaceFallbackSummary;
  }
}

export async function saveWorkspaceEvent(input: WorkspaceEventInput, options: Options = {}): Promise<{ event?: unknown; summary: WorkspaceSummary }> {
  const fetcher = options.fetcher ?? fetch;
  try {
    const response = await fetcher('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'append-event', event: input }),
    });
    if (!response.ok) throw new Error(`Workspace API returned ${response.status}`);
    const data = await response.json();
    if (!data?.summary?.dashboardMetrics) throw new Error('Workspace API returned an invalid payload');
    return { event: data.event, summary: data.summary as WorkspaceSummary };
  } catch {
    return { summary: workspaceFallbackSummary };
  }
}
