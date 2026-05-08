import type { PersonaId } from './personas';

export type CueLevel = 'Open recall' | 'Category hint' | 'Specific cue' | 'Multiple choice' | 'Reality Anchor answer';
export type InterventionType = 'retrieval_prompt' | 'hint' | 'choice' | 'direct_answer';

export type ConversationStep = {
  id: string;
  cueLevel: CueLevel;
  intervention: InterventionType;
  userLine: string;
  assistantLine: string;
  helper: string;
  signal: {
    assistanceLevel: 'Independent attempt' | 'Hint-supported' | 'Choice-supported' | 'Direct support';
    recallGap: string;
    domain: string;
    cueResponsiveness: string;
    latency: string;
  };
};

export const maleeConversation: ConversationStep[] = [
  {
    id: 'open-recall',
    cueLevel: 'Open recall',
    intervention: 'retrieval_prompt',
    userLine: 'Did I already take my morning medicine?',
    assistantLine: 'Let’s help your memory first. After breakfast, what is the first thing you usually do with the blue pill box?',
    helper: 'Second Brain asks for effortful recall before using logs.',
    signal: {
      assistanceLevel: 'Independent attempt',
      recallGap: 'Uncertain medication event',
      domain: 'Prospective memory',
      cueResponsiveness: 'Needs first cue',
      latency: '18s response latency',
    },
  },
  {
    id: 'category-hint',
    cueLevel: 'Category hint',
    intervention: 'hint',
    userLine: 'I remember breakfast, but not the pill box.',
    assistantLine: 'That is okay. Think about the kitchen counter. Was the medicine step before tea, after tea, or when you washed the cup?',
    helper: 'A category hint narrows the memory search without giving the answer away.',
    signal: {
      assistanceLevel: 'Hint-supported',
      recallGap: 'Breakfast remembered, pill step unclear',
      domain: 'Short-term memory',
      cueResponsiveness: 'Recovered context after category cue',
      latency: '24s response latency',
    },
  },
  {
    id: 'specific-cue',
    cueLevel: 'Specific cue',
    intervention: 'hint',
    userLine: 'Maybe after tea. I still cannot picture it.',
    assistantLine: 'Your routine photo log shows the blue pill box beside the green mug at 8:12. Does that image help you remember the action?',
    helper: 'Reality Anchor uses ground-truth logs to scaffold reorientation, not shame the user.',
    signal: {
      assistanceLevel: 'Hint-supported',
      recallGap: 'Needs visual anchor to reconstruct event',
      domain: 'Orientation + short-term memory',
      cueResponsiveness: 'Recognizes routine after specific cue',
      latency: '4s very-low-confidence latency',
    },
  },
  {
    id: 'multiple-choice',
    cueLevel: 'Multiple choice',
    intervention: 'choice',
    userLine: 'I see the mug, but I am not sure what I did next.',
    assistantLine: 'Choose the option that feels most familiar: A) opened pill box, B) called Pim, C) checked calendar. No rush.',
    helper: 'Multiple choice preserves agency while preventing unsafe guessing.',
    signal: {
      assistanceLevel: 'Choice-supported',
      recallGap: 'Recognition stronger than free recall',
      domain: 'Cue responsiveness',
      cueResponsiveness: 'Chooses correct routine with structured cue',
      latency: '36s response latency',
    },
  },
  {
    id: 'direct-answer',
    cueLevel: 'Reality Anchor answer',
    intervention: 'direct_answer',
    userLine: 'I think A, but please check the log.',
    assistantLine: 'Yes. The pill box was opened at 8:13 after breakfast. I will mark today as complete and show Pim only a support trend, not raw logs.',
    helper: 'Urgent clarity is provided after a supported recall attempt.',
    signal: {
      assistanceLevel: 'Direct support',
      recallGap: 'Needed log confirmation',
      domain: 'Daily routine safety',
      cueResponsiveness: 'Completes after direct support',
      latency: '42s response latency',
    },
  },
];


const somchaiConversation: ConversationStep[] = [
  {
    id: 'social-open-recall',
    cueLevel: 'Open recall',
    intervention: 'retrieval_prompt',
    userLine: 'This message says I won a prize if I reply today. Should I send my account number?',
    assistantLine: 'Before I decide for you, what signs in the message make it feel trustworthy or risky?',
    helper: 'Second Brain protects judgment practice before AGI takes over the decision.',
    signal: {
      assistanceLevel: 'Independent attempt',
      recallGap: 'Risk cues not identified independently',
      domain: 'Social cognition + financial judgment',
      cueResponsiveness: 'Needs open judgment prompt',
      latency: '22s response latency',
    },
  },
  {
    id: 'social-category-hint',
    cueLevel: 'Category hint',
    intervention: 'hint',
    userLine: 'It says urgent, but maybe that is normal.',
    assistantLine: 'Think about two categories: urgency words and requests for money or private account details. Which category appears here?',
    helper: 'A category hint points to social and financial risk markers without removing agency.',
    signal: {
      assistanceLevel: 'Hint-supported',
      recallGap: 'Urgency recognized after category cue',
      domain: 'Executive function and decision-making',
      cueResponsiveness: 'Recognizes urgency after category hint',
      latency: '29s response latency',
    },
  },
  {
    id: 'social-specific-cue',
    cueLevel: 'Specific cue',
    intervention: 'hint',
    userLine: 'It asks for bank details. I still feel I should reply quickly.',
    assistantLine: 'Your previous safe routine was to call Nok or the bank before sharing account information. Does that step fit this message?',
    helper: 'Reality Anchor uses a known safe routine to scaffold decision-making.',
    signal: {
      assistanceLevel: 'Hint-supported',
      recallGap: 'Safe verification routine needed as anchor',
      domain: 'Financial management',
      cueResponsiveness: 'Accepts trusted-person verification cue',
      latency: '34s response latency',
    },
  },
  {
    id: 'social-multiple-choice',
    cueLevel: 'Multiple choice',
    intervention: 'choice',
    userLine: 'Maybe I can call Nok. What should I choose?',
    assistantLine: 'Choose one safe next step: A) send account details, B) call Nok or the bank first, C) reply with your ID number.',
    helper: 'Multiple choice keeps the user involved while steering away from unsafe action.',
    signal: {
      assistanceLevel: 'Choice-supported',
      recallGap: 'Recognition stronger than independent risk judgment',
      domain: 'Social-cue perception',
      cueResponsiveness: 'Selects safe verification with structured choice',
      latency: '39s response latency',
    },
  },
  {
    id: 'social-direct-answer',
    cueLevel: 'Reality Anchor answer',
    intervention: 'direct_answer',
    userLine: 'B. Please help me not make a mistake.',
    assistantLine: 'Good choice. Do not share account details. I can help you call Nok and will log this only as a support trend, not a diagnosis.',
    helper: 'Direct safety support is appropriate after a supported judgment attempt.',
    signal: {
      assistanceLevel: 'Direct support',
      recallGap: 'Needed confirmation for safe financial action',
      domain: 'Daily routine safety',
      cueResponsiveness: 'Completes after direct support',
      latency: '44s response latency',
    },
  },
];

const arayaConversation: ConversationStep[] = [
  {
    id: 'finance-open-recall',
    cueLevel: 'Open recall',
    intervention: 'retrieval_prompt',
    userLine: 'Can you write my monthly money summary and decide what to move from savings?',
    assistantLine: 'Let’s have you start first. What are the three spending categories you usually review before any transfer?',
    helper: 'Second Brain asks for an autonomous draft before AGI summarizes or decides.',
    signal: {
      assistanceLevel: 'Independent attempt',
      recallGap: 'Budget categories not fully retrieved',
      domain: 'Planning + financial management',
      cueResponsiveness: 'Needs first planning prompt',
      latency: '20s response latency',
    },
  },
  {
    id: 'finance-category-hint',
    cueLevel: 'Category hint',
    intervention: 'hint',
    userLine: 'Food and bills. I cannot remember the last one.',
    assistantLine: 'Think in categories: fixed bills, variable living costs, and future-risk money. Which one is missing?',
    helper: 'Category hint supports accounting structure without taking over the task.',
    signal: {
      assistanceLevel: 'Hint-supported',
      recallGap: 'Third finance category missing',
      domain: 'Executive function and decision-making',
      cueResponsiveness: 'Recovers category after hint',
      latency: '27s response latency',
    },
  },
  {
    id: 'finance-specific-cue',
    cueLevel: 'Specific cue',
    intervention: 'hint',
    userLine: 'Future-risk money means the safe fund?',
    assistantLine: 'Yes. Last month you wrote: “do not move safe-fund money until fixed bills and food are separated.” Does that rule apply today?',
    helper: 'Reality Anchor compares current reasoning with Araya’s own previous rule.',
    signal: {
      assistanceLevel: 'Hint-supported',
      recallGap: 'Needs prior-rule anchor for investment decision',
      domain: 'Financial management',
      cueResponsiveness: 'Recognizes prior rule after specific cue',
      latency: '33s response latency',
    },
  },
  {
    id: 'finance-multiple-choice',
    cueLevel: 'Multiple choice',
    intervention: 'choice',
    userLine: 'I think I should not move it yet, but I want a clean sentence.',
    assistantLine: 'Choose the draft that sounds most like your reasoning: A) move the fund now, B) separate bills first, C) let AGI decide later.',
    helper: 'Multiple choice supports communication while preserving authorship.',
    signal: {
      assistanceLevel: 'Choice-supported',
      recallGap: 'Drafting completeness improves with structured options',
      domain: 'Language and communication',
      cueResponsiveness: 'Selects self-authored reasoning with choice cue',
      latency: '37s response latency',
    },
  },
  {
    id: 'finance-direct-answer',
    cueLevel: 'Reality Anchor answer',
    intervention: 'direct_answer',
    userLine: 'B. Please polish it, but keep my meaning.',
    assistantLine: 'I will keep your decision: separate fixed bills and food first; do not move safe-fund money today. I will mark this as draft-first support.',
    helper: 'AGI assists with wording after Araya completes the reasoning step.',
    signal: {
      assistanceLevel: 'Direct support',
      recallGap: 'Needed wording support after autonomous reasoning',
      domain: 'Communication + financial management',
      cueResponsiveness: 'Completes after direct support',
      latency: '43s response latency',
    },
  },
];

export const conversations: Record<PersonaId, ConversationStep[]> = {
  malee: maleeConversation,
  somchai: somchaiConversation,
  araya: arayaConversation,
};

export function getConversation(personaId: PersonaId): ConversationStep[] {
  return conversations[personaId] ?? maleeConversation;
}
