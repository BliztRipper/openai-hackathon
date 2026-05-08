import type { ConversationStep } from '../data/conversation';
import type { PersonaId } from '../data/personas';

export type CompanionApiRequest = {
  personaId: PersonaId;
  personaName: string;
  cueLevel: string;
  userLine: string;
  assistantLine: string;
  helper: string;
  signal: ConversationStep['signal'];
  sessionId?: string;
  context?: string;
};

export type RubricEvidence = {
  label: string;
  evidence: string;
};

export type CompanionApiResponse = {
  ok: boolean;
  mode: 'openai' | 'express' | 'fastapi' | 'protected';
  source: string;
  model: string | null;
  generatedAt: string;
  companionNote: string;
  nextBestAction: string;
  safetyBoundary: string;
  rubricEvidence: RubricEvidence[];
  responseId?: string;
  degradedReason?: string;
};

export type ProviderStatus = {
  ok: boolean;
  reachable: boolean;
  companionReady: boolean;
  activeProvider?: 'second-brain-express' | 'second-brain-fastapi' | 'openai-responses-api' | 'unconfigured';
  service?: string;
  authMode?: string;
  hasOpenAiKey?: boolean;
  baseUrl: string;
  model: string;
  reason?: string;
};

type RequestOptions = {
  fetcher?: typeof fetch;
};

export function buildClientFallback(error: unknown): CompanionApiResponse {
  return {
    ok: false,
    mode: 'protected',
    source: 'client-continuity',
    model: null,
    generatedAt: new Date().toISOString(),
    companionNote:
      'The companion insight service is temporarily unavailable, so Second Brain is showing a protected local guidance note. The care contract remains the same: preserve recall effort, show support trends, and avoid diagnostic claims.',
    nextBestAction: 'Retry the companion insight service or continue with the protected guidance note until connectivity is restored.',
    safetyBoundary: 'No secret key is stored in the browser. Personal context remains protected by the current permission tier.',
    rubricEvidence: [
      {
        label: 'Care continuity',
        evidence: 'The protected guidance path keeps support available even when the insight service is unavailable.',
      },
      {
        label: 'Technical feasibility',
        evidence: 'The same client contract can call a server-side OpenAI endpoint once credentials are configured.',
      },
    ],
    degradedReason: error instanceof Error ? error.message : 'Unknown client API error',
  };
}

export async function requestCompanionInsight(
  payload: CompanionApiRequest,
  options: RequestOptions = {},
): Promise<CompanionApiResponse> {
  const fetcher = options.fetcher ?? fetch;

  try {
    const response = await fetcher('/api/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Companion API returned ${response.status}`);
    }

    const data = await response.json();
    if (!data || typeof data.companionNote !== 'string' || !Array.isArray(data.rubricEvidence)) {
      throw new Error('Companion API returned an invalid payload');
    }

    return data as CompanionApiResponse;
  } catch (error) {
    return buildClientFallback(error);
  }
}

export async function fetchProviderStatus(options: RequestOptions = {}): Promise<ProviderStatus> {
  const fetcher = options.fetcher ?? fetch;
  try {
    const response = await fetcher('/api/provider-status');
    if (!response.ok) throw new Error(`Provider status returned ${response.status}`);
    const data = await response.json();
    if (typeof data?.reachable !== 'boolean' || typeof data?.companionReady !== 'boolean') {
      throw new Error('Provider status returned an invalid payload');
    }
    return data as ProviderStatus;
  } catch (error) {
    return {
      ok: false,
      reachable: false,
      companionReady: false,
      baseUrl: '',
      model: 'gpt-5.5-pro',
      reason: error instanceof Error ? error.message : 'Unable to check provider status',
    };
  }
}
