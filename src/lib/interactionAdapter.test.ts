import { describe, expect, it } from 'vitest';
import { maleeConversation } from '../data/conversation';
import { deterministicInteractionAdapter, OPENAI_REALTIME_ADAPTER_NOTE } from './interactionAdapter';

describe('DeterministicInteractionAdapter', () => {
  it('emits the current step, next index, and structured support signals', () => {
    const output = deterministicInteractionAdapter.next({ stepIndex: 1, context: 'concerning_trend' });
    expect(output.step.id).toBe(maleeConversation[1].id);
    expect(output.nextStepIndex).toBe(2);
    expect(output.emittedSignals.assistanceLevel).toBe('Hint-supported');
    expect(output.emittedSignals.intensity).toBe('high');
  });

  it('documents the future OpenAI boundary without exposing browser API keys', () => {
    expect(OPENAI_REALTIME_ADAPTER_NOTE).toContain('server');
    expect(OPENAI_REALTIME_ADAPTER_NOTE).toContain('OPENAI_API_KEY');
    expect(OPENAI_REALTIME_ADAPTER_NOTE).toContain('never receives');
  });
});
