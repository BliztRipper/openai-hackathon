import { describe, expect, it, vi } from 'vitest';
import { buildVoicePromptPayload, buildVoiceTurnPayload, getVoicePrompt, requestVoicePrompt, requestVoiceTurn } from './voiceTurn';

describe('voiceTurn', () => {
  it('provides fixed AGI questions and voice profile for each persona', () => {
    expect(getVoicePrompt('malee')).toMatchObject({
      question: 'Hi Malee, Did I already take the morning medicine yet?',
      voiceGender: 'female',
      audioVoice: 'shimmer',
    });
    expect(getVoicePrompt('somchai')).toMatchObject({
      question: 'Hi Somchai, there are some suspicious numbers calling you.',
      voiceGender: 'male',
      audioVoice: 'onyx',
    });
    expect(getVoicePrompt('araya')).toMatchObject({
      question: 'Hi Araya, how about your finances?',
      voiceGender: 'female',
      audioVoice: 'nova',
    });
  });

  it('builds a one-turn payload with captured audio and fallback transcript', () => {
    expect(buildVoiceTurnPayload('malee', {
      transcript: 'I think I took it after breakfast.',
      audioData: 'UklGRg==',
      audioFormat: 'wav',
    })).toEqual({
      personaId: 'malee',
      question: 'Hi Malee, Did I already take the morning medicine yet?',
      transcript: 'I think I took it after breakfast.',
      audioData: 'UklGRg==',
      audioFormat: 'wav',
      audioVoice: 'shimmer',
    });
  });

  it('builds a stable prompt audio payload', () => {
    expect(buildVoicePromptPayload('somchai')).toEqual({
      personaId: 'somchai',
      question: 'Hi Somchai, there are some suspicious numbers calling you.',
      audioVoice: 'onyx',
    });
  });

  it('requests natural GPT-audio prompt playback from the server', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, audioData: 'UklGRg==', audioFormat: 'wav', audioVoice: 'nova' }),
    })) as unknown as typeof fetch;

    const result = await requestVoicePrompt('araya', { fetcher });

    expect(result.audioVoice).toBe('nova');
    expect(fetcher).toHaveBeenCalledWith('/api/voice-prompt', expect.objectContaining({ method: 'POST' }));
  });

  it('requests a one-turn answer from the server', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, reply: 'Thanks, keep using the clue ladder.' }),
    })) as unknown as typeof fetch;

    const result = await requestVoiceTurn('malee', { transcript: 'I am not sure.', audioData: 'UklGRg==', audioFormat: 'wav' }, { fetcher });

    expect(result.reply).toContain('clue ladder');
    expect(fetcher).toHaveBeenCalledWith('/api/voice-turn', expect.objectContaining({ method: 'POST' }));
  });
});
