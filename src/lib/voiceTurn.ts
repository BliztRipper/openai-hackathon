import type { PersonaId } from '../data/personas';

export type VoiceGender = 'male' | 'female';

export type VoicePrompt = {
  question: string;
  voiceGender: VoiceGender;
};

export type VoiceTurnPayload = {
  personaId: PersonaId;
  question: string;
  transcript: string;
};

export type VoiceTurnResponse = {
  ok: boolean;
  personaId: PersonaId;
  question: string;
  transcript: string;
  reply: string;
  signal?: { severity: string; supportScore: number; domain: string };
};

const voicePrompts: Record<PersonaId, VoicePrompt> = {
  malee: {
    question: 'Hi Malee, Did I already take the morning medicine yet?',
    voiceGender: 'female',
  },
  somchai: {
    question: 'Hi Somchai, there are some suspicious numbers calling you.',
    voiceGender: 'male',
  },
  araya: {
    question: 'Hi Araya, how about your finances?',
    voiceGender: 'female',
  },
};

export function getVoicePrompt(personaId: PersonaId): VoicePrompt {
  return voicePrompts[personaId];
}

export function buildVoiceTurnPayload(personaId: PersonaId, transcript: string): VoiceTurnPayload {
  return {
    personaId,
    question: getVoicePrompt(personaId).question,
    transcript: transcript.trim(),
  };
}

type Options = { fetcher?: typeof fetch };

export async function requestVoiceTurn(
  personaId: PersonaId,
  transcript: string,
  options: Options = {},
): Promise<VoiceTurnResponse> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher('/api/voice-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildVoiceTurnPayload(personaId, transcript)),
  });
  if (!response.ok) throw new Error(`Voice turn API returned ${response.status}`);
  const data = await response.json();
  if (!data?.reply || typeof data.reply !== 'string') throw new Error('Voice turn API returned an invalid payload');
  return data as VoiceTurnResponse;
}
