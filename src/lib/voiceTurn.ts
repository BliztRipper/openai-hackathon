import type { PersonaId } from '../data/personas';

export type VoiceGender = 'male' | 'female';
export type AudioFormat = 'wav' | 'mp3';

export type VoicePrompt = {
  question: string;
  voiceGender: VoiceGender;
  audioVoice: string;
};

export type VoicePromptPayload = {
  personaId: PersonaId;
  question: string;
  audioVoice: string;
};

export type VoicePromptResponse = {
  ok: boolean;
  personaId: PersonaId;
  question: string;
  audioVoice: string;
  audioFormat: AudioFormat;
  audioData?: string;
  source?: string;
};

export type CapturedVoiceAnswer = {
  transcript?: string;
  audioData?: string;
  audioFormat?: AudioFormat;
};

export type VoiceTurnPayload = VoicePromptPayload & {
  transcript: string;
  audioData?: string;
  audioFormat?: AudioFormat;
};

export type VoiceTurnResponse = {
  ok: boolean;
  personaId: PersonaId;
  question: string;
  transcript: string;
  reply: string;
  audioVoice?: string;
  audioFormat?: AudioFormat;
  audioData?: string;
  source?: string;
  signal?: { severity: string; supportScore: number; domain: string };
};

const voicePrompts: Record<PersonaId, VoicePrompt> = {
  malee: {
    question: 'Hi Malee, Did I already take the morning medicine yet?',
    voiceGender: 'female',
    audioVoice: 'shimmer',
  },
  somchai: {
    question: 'Hi Somchai, there are some suspicious numbers calling you.',
    voiceGender: 'male',
    audioVoice: 'onyx',
  },
  araya: {
    question: 'Hi Araya, how about your finances?',
    voiceGender: 'female',
    audioVoice: 'nova',
  },
};

export function getVoicePrompt(personaId: PersonaId): VoicePrompt {
  return voicePrompts[personaId];
}

export function buildVoicePromptPayload(personaId: PersonaId): VoicePromptPayload {
  const prompt = getVoicePrompt(personaId);
  return {
    personaId,
    question: prompt.question,
    audioVoice: prompt.audioVoice,
  };
}

export function buildVoiceTurnPayload(personaId: PersonaId, answer: CapturedVoiceAnswer | string): VoiceTurnPayload {
  const prompt = getVoicePrompt(personaId);
  const normalized = typeof answer === 'string' ? { transcript: answer } : answer;
  return {
    personaId,
    question: prompt.question,
    transcript: (normalized.transcript || 'Spoken answer captured.').trim(),
    audioData: normalized.audioData,
    audioFormat: normalized.audioFormat,
    audioVoice: prompt.audioVoice,
  };
}

type Options = { fetcher?: typeof fetch };

async function parseVoiceJson<T extends { ok: boolean }>(response: Response, errorPrefix: string): Promise<T> {
  if (!response.ok) throw new Error(`${errorPrefix} returned ${response.status}`);
  const data = await response.json();
  if (!data?.ok) throw new Error(`${errorPrefix} returned an invalid payload`);
  return data as T;
}

export async function requestVoicePrompt(
  personaId: PersonaId,
  options: Options = {},
): Promise<VoicePromptResponse> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher('/api/voice-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildVoicePromptPayload(personaId)),
  });
  return parseVoiceJson<VoicePromptResponse>(response, 'Voice prompt API');
}

export async function requestVoiceTurn(
  personaId: PersonaId,
  answer: CapturedVoiceAnswer | string,
  options: Options = {},
): Promise<VoiceTurnResponse> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher('/api/voice-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildVoiceTurnPayload(personaId, answer)),
  });
  const data = await parseVoiceJson<VoiceTurnResponse>(response, 'Voice turn API');
  if (!data.reply || typeof data.reply !== 'string') throw new Error('Voice turn API returned an invalid reply');
  return data;
}
