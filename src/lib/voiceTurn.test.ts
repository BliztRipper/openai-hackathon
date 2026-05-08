import { describe, expect, it, vi } from 'vitest';
import { buildVoiceTurnPayload, getVoicePrompt, requestVoiceTurn } from './voiceTurn';

describe('voiceTurn', () => {
  it('provides fixed AGI questions and voice profile for each persona', () => {
    expect(getVoicePrompt('malee')).toMatchObject({
      question: 'Hi Malee, Did I already take the morning medicine yet?',
      voiceGender: 'female',
    });
    expect(getVoicePrompt('somchai')).toMatchObject({
      question: 'Hi Somchai, there are some suspicious numbers calling you.',
      voiceGender: 'male',
    });
    expect(getVoicePrompt('araya')).toMatchObject({
      question: 'Hi Araya, how about your finances?',
      voiceGender: 'female',
    });
  });

  it('builds a one-turn payload with the spoken transcript', () => {
    expect(buildVoiceTurnPayload('malee', 'I think I took it after breakfast.')).toEqual({
      personaId: 'malee',
      question: 'Hi Malee, Did I already take the morning medicine yet?',
      transcript: 'I think I took it after breakfast.',
    });
  });

  it('requests a one-turn answer from the server', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, reply: 'Thanks, keep using the clue ladder.' }),
    })) as unknown as typeof fetch;

    const result = await requestVoiceTurn('malee', 'I am not sure.', { fetcher });

    expect(result.reply).toContain('clue ladder');
    expect(fetcher).toHaveBeenCalledWith('/api/voice-turn', expect.objectContaining({ method: 'POST' }));
  });
});
