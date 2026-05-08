import { getConversation, maleeConversation, type ConversationStep } from '../data/conversation';
import type { PersonaId } from '../data/personas';
import { decideFriction, type SimulatedContext } from './frictionPolicy';

export type InteractionInput = {
  stepIndex: number;
  utterance?: string;
  context: SimulatedContext;
  personaId?: PersonaId;
};

export type InteractionOutput = {
  step: ConversationStep;
  nextStepIndex: number;
  isComplete: boolean;
  emittedSignals: ConversationStep['signal'] & { intensity: string; rationale: string };
};

export interface InteractionAdapter {
  next(input: InteractionInput): InteractionOutput;
}

export class DeterministicInteractionAdapter implements InteractionAdapter {
  next(input: InteractionInput): InteractionOutput {
    const conversation = input.personaId ? getConversation(input.personaId) : maleeConversation;
    const boundedIndex = Math.max(0, Math.min(input.stepIndex, conversation.length - 1));
    const step = conversation[boundedIndex];
    const friction = decideFriction(step, input.context);
    const isComplete = boundedIndex >= conversation.length - 1;

    return {
      step,
      nextStepIndex: isComplete ? boundedIndex : boundedIndex + 1,
      isComplete,
      emittedSignals: {
        ...step.signal,
        intensity: friction.intensity,
        rationale: friction.rationale,
      },
    };
  }
}

export const deterministicInteractionAdapter = new DeterministicInteractionAdapter();

export const OPENAI_REALTIME_ADAPTER_NOTE =
  'Future OpenAIRealtimeAdapter requires a server or serverless endpoint to mint ephemeral Realtime client secrets from OPENAI_API_KEY. The browser never receives a standard API key.';
