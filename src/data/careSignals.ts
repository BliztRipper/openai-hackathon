import type { PersonaId } from './personas';

export type TrendPoint = { month: string; value: number };
export type DomainTrend = {
  id: string;
  label: string;
  delta: string;
  status: 'stable' | 'watch' | 'support';
  confidence: string;
  explanation: string;
  evidence: string;
  points: TrendPoint[];
};
export type Notice = {
  title: string;
  why: string;
  uncertainty: string;
  suggestion: string;
};

export const domainTrends: Record<PersonaId, DomainTrend[]> = {
  malee: [
    {
      id: 'memory',
      label: 'Short-term medication recall',
      delta: 'decreased 4% over 3 months',
      status: 'support',
      confidence: 'Moderate confidence: persistent across 18 longitudinal medication events',
      explanation: 'Malee more often needed a category or specific cue before confirming the morning routine.',
      evidence: '18 longitudinal medication events compare baseline recall attempts with trend-change cue levels.',
      points: [
        { month: 'Feb', value: 86 },
        { month: 'Mar', value: 84 },
        { month: 'Apr', value: 83 },
        { month: 'May', value: 82 },
      ],
    },
    {
      id: 'cue',
      label: 'Recovery after one hint',
      delta: 'stable at 72%',
      status: 'stable',
      confidence: 'Higher confidence: consistent recovery after routine cueing',
      explanation: 'Cue responsiveness remains a strength, suggesting gentle prompts still help preserve agency.',
      evidence: 'Hint recovery stayed stable even as free recall became less reliable.',
      points: [
        { month: 'Feb', value: 71 },
        { month: 'Mar', value: 73 },
        { month: 'Apr', value: 72 },
        { month: 'May', value: 72 },
      ],
    },
    {
      id: 'assistance',
      label: 'AGI-assisted routine completion',
      delta: 'increased 9%',
      status: 'watch',
      confidence: 'Moderate confidence: assistance mix changed after routine disruption',
      explanation: 'More tasks were completed with AGI help, so independence may look stronger than unsupported performance.',
      evidence: 'Completion rate remains high, but support ratio shifted toward AGI-assisted routine closure.',
      points: [
        { month: 'Feb', value: 28 },
        { month: 'Mar', value: 31 },
        { month: 'Apr', value: 35 },
        { month: 'May', value: 37 },
      ],
    },
  ],
  somchai: [
    {
      id: 'social',
      label: 'Social-cue interpretation checks',
      delta: 'persistent decline signal',
      status: 'support',
      confidence: 'Low-to-moderate confidence: message examples and contact-pattern changes',
      explanation: 'Requests like “what did they mean?” rose while neighbor calls decreased.',
      evidence: 'Message-interpretation prompts rose across the trend-change period while human-contact markers fell.',
      points: [
        { month: 'Feb', value: 74 },
        { month: 'Mar', value: 70 },
        { month: 'Apr', value: 66 },
        { month: 'May', value: 61 },
      ],
    },
    {
      id: 'finance-risk',
      label: 'Financial judgment support',
      delta: 'increased 12%',
      status: 'watch',
      confidence: 'Moderate confidence: repeated prize-message and transfer simulations',
      explanation: 'AGI stepped in more often before unfamiliar transfers or urgent prize replies.',
      evidence: 'Prize-message and unfamiliar-transfer tasks triggered more verification cues.',
      points: [
        { month: 'Feb', value: 22 },
        { month: 'Mar', value: 26 },
        { month: 'Apr', value: 31 },
        { month: 'May', value: 34 },
      ],
    },
  ],
  araya: [
    {
      id: 'communication-gap',
      label: 'Autonomous vs AGI-assisted explanation gap',
      delta: 'gap widened 11%',
      status: 'support',
      confidence: 'Moderate confidence: writing and finance explanation comparisons',
      explanation: 'Autonomous notes became shorter and less complete while AGI summaries stayed polished.',
      evidence: 'Writing samples track word-finding, syntactic complexity, and pragmatic completeness gaps.',
      points: [
        { month: 'Feb', value: 18 },
        { month: 'Mar', value: 21 },
        { month: 'Apr', value: 25 },
        { month: 'May', value: 29 },
      ],
    },
    {
      id: 'finance-planning',
      label: 'Monthly accounting cueing',
      delta: 'required more cueing this month',
      status: 'watch',
      confidence: 'Low-to-moderate confidence: repeated bill review tasks',
      explanation: 'Budget categories and simple investment tradeoffs needed more structured prompts.',
      evidence: 'Monthly accounting tasks compare unsupported category reasoning with AGI-scaffolded reasoning.',
      points: [
        { month: 'Feb', value: 78 },
        { month: 'Mar', value: 75 },
        { month: 'Apr', value: 72 },
        { month: 'May', value: 69 },
      ],
    },
  ],
};

export const notices: Record<PersonaId, Notice[]> = {
  malee: [
    {
      title: 'Medication recall support need is rising',
      why: 'Morning routine recall needed more cueing across the trend-change period.',
      uncertainty: 'This is not a medical conclusion. Sleep, stress, illness, or routine disruption could explain part of the change.',
      suggestion: 'Keep gentle recall prompts, then share a concise trend summary with Pim or a clinician at the next review.',
    },
    {
      title: 'AGI may be masking functional change',
      why: 'Completion still looks high because AGI scaffolds more steps than before.',
      uncertainty: 'Assistance can be helpful; the signal is the changing ratio, not a single event.',
      suggestion: 'Track autonomous attempts separately from AGI-completed tasks.',
    },
  ],
  somchai: [
    {
      title: 'Social-cue and financial judgment checks increased',
      why: 'Prize-message interpretation and unfamiliar-transfer support rose while human-contact indicators fell.',
      uncertainty: 'Repeated examples indicate a support need to review, not a condition.',
      suggestion: 'Nudge verification with a trusted person or bank before payment decisions.',
    },
  ],
  araya: [
    {
      title: 'Communication and finance capability gap widened',
      why: 'Autonomous explanations became less complete while AGI-assisted summaries remained strong.',
      uncertainty: 'The gap suggests where to preserve practice, not what the cause is.',
      suggestion: 'Use step-by-step prompts before AGI writes or chooses for Araya.',
    },
  ],
};



export type CapabilityExample = {
  personaId: PersonaId;
  domain: string;
  autonomousAttempt: string;
  agiAssistedOutput: string;
  measuredGap: string;
  supportInterpretation: string;
};

export const capabilityExamples: CapabilityExample[] = [
  {
    personaId: 'malee',
    domain: 'Daily routine · medication',
    autonomousAttempt: '“I had breakfast. I am not sure if the blue box was opened.”',
    agiAssistedOutput: 'Routine log confirms pill-box open at 8:13 after tea; share only trend summary with Pim.',
    measuredGap: 'Recall gap appears after breakfast context, then resolves with a specific visual cue.',
    supportInterpretation: 'Preserve recall first; direct answer only after the supported attempt or safety need.',
  },
  {
    personaId: 'somchai',
    domain: 'Financial judgment · prize message',
    autonomousAttempt: '“They say I won today. Maybe I should send the account number quickly.”',
    agiAssistedOutput: 'The message has urgency and payment-request markers; verify with Nok or the bank before replying.',
    measuredGap: 'Social-cue and risk-language detection improved only after AGI scaffolding.',
    supportInterpretation: 'AGI may be masking decision-support need; route a gentle trusted-person verification nudge.',
  },
  {
    personaId: 'araya',
    domain: 'Communication + finance · monthly accounting',
    autonomousAttempt: '“Expenses are high. Maybe move money from the safe fund.”',
    agiAssistedOutput: 'Separate fixed bills, variable food costs, and investment risk before choosing any transfer.',
    measuredGap: 'Autonomous explanation is shorter, with fewer categories and less explicit tradeoff language.',
    supportInterpretation: 'Use step-by-step prompts so Araya practices instrumental ADL reasoning before AGI edits.',
  },
];

export type CompanionBoundarySignal = {
  personaId: PersonaId;
  label: string;
  value: string;
  interpretation: string;
};

export const companionBoundarySignals: CompanionBoundarySignal[] = [
  {
    personaId: 'malee',
    label: 'Human connection nudge',
    value: 'Pim visit reminder after repeated medication uncertainty',
    interpretation: 'Encourages family support without exposing raw transcript details.',
  },
  {
    personaId: 'somchai',
    label: 'AGI companion vs human contact',
    value: 'Companion time up 21%; neighbor calls down 18%',
    interpretation: 'Possible overdependence signal; recommend gentle human-contact prompt, not restriction.',
  },
  {
    personaId: 'araya',
    label: 'Autonomy preservation mode',
    value: 'Draft-first writing and accounting prompts enabled',
    interpretation: 'Keeps AGI useful while preserving practice in language and finance domains.',
  },
];

export const validationReadiness = [
  {
    signal: 'Recall success and hint recovery',
    futureData: 'Longitudinal cognitive task performance, medication adherence context, routine logs',
    readiness: 'Ready for longitudinal comparison',
    validationQuestion: 'Do cue-responsive support signals track real support needs over time?',
  },
  {
    signal: 'Autonomous vs AGI-assisted output gap',
    futureData: 'Repeated writing/planning samples, language complexity measures, functional ADL reviews',
    readiness: 'Needs longitudinal validation',
    validationQuestion: 'Does widening AGI assistance gap correlate with changing daily-function support?',
  },
  {
    signal: 'Human contact vs AGI companion use',
    futureData: 'Call/message frequency, loneliness scales, social participation measures',
    readiness: 'Ethics-review required',
    validationQuestion: 'When does companionship shift from beneficial support to review-worthy overdependence?',
  },
  {
    signal: 'Reality Anchor recall gap',
    futureData: 'Ground-truth event logs, prospective memory tasks, clinician/caregiver review summaries',
    readiness: 'Ready for longitudinal comparison',
    validationQuestion: 'Can logged reality gaps identify moments where scaffolding preserves agency?',
  },
];

export type RadarMetric = {
  axis: string;
  value: number;
  benchmark: number;
  note: string;
};

export type DashboardMatrixRow = {
  domain: string;
  current: string;
  trend: string;
  reviewAction: string;
};

export const radarMetrics: Record<PersonaId, RadarMetric[]> = {
  malee: [
    { axis: 'Recall', value: 58, benchmark: 74, note: 'Free recall needs more support before medication confirmation.' },
    { axis: 'Cue recovery', value: 72, benchmark: 70, note: 'Still responds well after a small routine cue.' },
    { axis: 'Routine stability', value: 68, benchmark: 80, note: 'Morning sequence is mostly intact with more uncertainty moments.' },
    { axis: 'Orientation', value: 64, benchmark: 76, note: 'Reality Anchor helps reconstruct the event.' },
    { axis: 'Human review need', value: 46, benchmark: 30, note: 'Pim receives trend summary when cue escalation repeats.' },
  ],
  somchai: [
    { axis: 'Social cue', value: 52, benchmark: 72, note: 'Needs help identifying urgency and intent in messages.' },
    { axis: 'Financial judgment', value: 49, benchmark: 74, note: 'Verification needed before unfamiliar money action.' },
    { axis: 'Human contact', value: 43, benchmark: 68, note: 'Neighbor calls and trusted checks decreased.' },
    { axis: 'Risk language', value: 57, benchmark: 77, note: 'Risk markers are recognized after category prompts.' },
    { axis: 'Verification habit', value: 61, benchmark: 78, note: 'Accepts Nok or bank verification when offered.' },
  ],
  araya: [
    { axis: 'Planning', value: 63, benchmark: 82, note: 'Needs category prompts for monthly review.' },
    { axis: 'Finance reasoning', value: 59, benchmark: 84, note: 'Tradeoff language needs scaffolding.' },
    { axis: 'Writing completeness', value: 54, benchmark: 80, note: 'Autonomous explanations are shorter than AI-polished versions.' },
    { axis: 'Autonomy practice', value: 71, benchmark: 82, note: 'Draft-first mode preserves useful effort.' },
    { axis: 'Export control', value: 88, benchmark: 88, note: 'User controls when summaries are shared.' },
  ],
};

export const dashboardMatrices: Record<PersonaId, DashboardMatrixRow[]> = {
  malee: [
    { domain: 'Medication recall', current: 'Needs specific cue', trend: 'Free recall down 4%', reviewAction: 'Keep routine cue ladder active' },
    { domain: 'Reality Anchor', current: 'Blue pill box confirms event', trend: 'More visual-anchor use', reviewAction: 'Share only concise trend with Pim' },
    { domain: 'Latency', current: '31s on uncertain event', trend: 'Slower after routine disruption', reviewAction: 'Watch next seven mornings' },
    { domain: 'Safety', current: 'Duplicate-dose concern avoided', trend: 'Stable after direct confirmation', reviewAction: 'Direct answer after supported attempt' },
  ],
  somchai: [
    { domain: 'Social interpretation', current: 'Urgency cue missed', trend: 'Checks rising', reviewAction: 'Ask “what do they want?” first' },
    { domain: 'Payment safety', current: 'Account request present', trend: 'Unfamiliar transfer support up', reviewAction: 'Require Nok or bank verification' },
    { domain: 'Human connection', current: 'Neighbor call skipped', trend: 'Human contact down 18%', reviewAction: 'Offer trusted-person nudge' },
    { domain: 'Message drafting', current: 'Wants quick reply', trend: 'More AGI-composed replies', reviewAction: 'Draft refusal only after risk naming' },
  ],
  araya: [
    { domain: 'Budget categories', current: 'Fixed and variable mixed', trend: 'Category cueing increased', reviewAction: 'Use two-column sort before summary' },
    { domain: 'Writing sample', current: 'Short autonomous explanation', trend: 'AI gap widened 11%', reviewAction: 'Keep original draft beside polish' },
    { domain: 'Investment reasoning', current: 'Safe fund transfer suggested', trend: 'Tradeoff prompts increased', reviewAction: 'Ask liquidity/risk comparison' },
    { domain: 'Sharing control', current: 'Self-directed export', trend: 'Stable sharing preference', reviewAction: 'Share only when requested' },
  ],
};
