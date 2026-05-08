import type { PersonaId } from './personas';

export type StoreType = 'episodic' | 'semantic' | 'procedural' | 'working';
export const storeTypes: StoreType[] = ['episodic', 'semantic', 'procedural', 'working'];

export type MemoryStore = {
  type: StoreType;
  title: string;
  subtitle: string;
  productRole: string;
  items: string[];
};

export type EpisodicTimelineItem = {
  time: string;
  title: string;
  detail: string;
  evidence: string;
};

export type SemanticNode = { id: string; label: string; kind: string };
export type SemanticEdge = { from: string; to: string; label: string };

export type ProceduralStep = {
  step: string;
  expected: string;
  observed: string;
  supportRule: string;
};

export type PersonaMemoryArchitecture = {
  personaId: PersonaId;
  path: string;
  stores: MemoryStore[];
  episodicTimeline: EpisodicTimelineItem[];
  semanticGraph: { nodes: SemanticNode[]; edges: SemanticEdge[]; wikiConcept: string };
  proceduralModel: { routine: string; decisionPolicy: string; steps: ProceduralStep[] };
  workingMemory: {
    activeTask: string;
    currentCue: string;
    currentConversation: Array<{ speaker: string; text: string }>;
    scratchpad: string[];
  };
};

export const memoryArchitectures: Record<PersonaId, PersonaMemoryArchitecture> = {
  malee: {
    personaId: 'malee',
    path: 'Malee / Morning medication / Recall-first reality anchor',
    stores: [
      {
        type: 'episodic',
        title: 'Episodic store',
        subtitle: 'Medication timeline',
        productRole: 'Shows exactly what happened this morning before answering for Malee.',
        items: ['08:03 breakfast context', '08:12 blue pill box visible', '08:13 compartment opened', '08:15 medication question asked'],
      },
      {
        type: 'semantic',
        title: 'Semantic store',
        subtitle: 'Routine knowledge graph',
        productRole: 'Links family, objects, rooms, and medication meaning into a small care wiki.',
        items: ['Pim is trusted daughter', 'Blue pill box means morning medicine', 'Green mug belongs to breakfast', 'Kitchen counter is routine location'],
      },
      {
        type: 'procedural',
        title: 'Procedural store',
        subtitle: 'Medication habit model',
        productRole: 'Compares today with Malee’s normal breakfast-to-pill sequence.',
        items: ['Breakfast → tea → pill box', 'Ask open recall before direct answer', 'Use visual anchor when recall stalls', 'Notify trend only after repeated cue escalation'],
      },
      {
        type: 'working',
        title: 'Working memory',
        subtitle: 'Active medication check',
        productRole: 'Holds Malee’s current question, cue level, and safe next response.',
        items: ['Active task: morning medicine confirmation', 'Current cue: breakfast routine', 'User uncertainty: “Did I take it?”', 'Next response: offer smallest useful cue'],
      },
    ],
    episodicTimeline: [
      { time: '08:03', title: 'Breakfast started', detail: 'Photo context shows green mug, rice porridge, and medicine tray on the kitchen counter.', evidence: 'Care context' },
      { time: '08:09', title: 'Tea routine completed', detail: 'Habit signature expects the pill box to be opened after tea, before the clinic-calendar reminder.', evidence: 'Routine sequence model' },
      { time: '08:12', title: 'Blue pill box visible', detail: 'Reality Anchor identifies the blue pill box beside the green mug.', evidence: 'Object context' },
      { time: '08:13', title: 'Morning compartment opened', detail: 'The morning compartment appears open after the usual tea step.', evidence: 'Routine event log' },
      { time: '08:15', title: 'User asks for confirmation', detail: 'Malee asks whether she took medicine; Second Brain starts with recall before direct confirmation.', evidence: 'Conversation event' },
    ],
    semanticGraph: {
      wikiConcept: 'LLM-wiki concept: “morning medicine” connects objects, people, places, and safe disclosure rules so every answer can explain its source without exposing raw logs.',
      nodes: [
        { id: 'malee', label: 'Malee', kind: 'person' },
        { id: 'pim', label: 'Pim · daughter', kind: 'trusted contact' },
        { id: 'pillbox', label: 'Blue pill box', kind: 'object' },
        { id: 'kitchen', label: 'Kitchen counter', kind: 'place' },
        { id: 'green-mug', label: 'Green mug routine', kind: 'routine cue' },
        { id: 'clinic', label: 'Clinic visit', kind: 'calendar context' },
      ],
      edges: [
        { from: 'malee', to: 'pim', label: 'trend summary can be shared with' },
        { from: 'pillbox', to: 'green-mug', label: 'usually appears beside' },
        { from: 'green-mug', to: 'kitchen', label: 'anchors breakfast location' },
        { from: 'clinic', to: 'pillbox', label: 'raises medication importance' },
        { from: 'malee', to: 'pillbox', label: 'asks recall question about' },
      ],
    },
    proceduralModel: {
      routine: 'Morning medication after tea',
      decisionPolicy: 'Preserve recall first; direct confirmation only after one supported attempt or immediate safety concern.',
      steps: [
        { step: 'Orient to morning', expected: 'Recognize breakfast context', observed: 'Needs breakfast cue', supportRule: 'Start with open recall' },
        { step: 'Find routine object', expected: 'Name pill box location', observed: 'Recognizes blue box after visual cue', supportRule: 'Offer category hint before exact answer' },
        { step: 'Confirm action', expected: 'Recall compartment opening', observed: 'Requires specific cue', supportRule: 'Use Reality Anchor evidence' },
        { step: 'Close safely', expected: 'Avoid duplicate dose', observed: 'Accepts trend summary', supportRule: 'Escalate only a concise review note' },
      ],
    },
    workingMemory: {
      activeTask: 'Help Malee decide whether morning medicine was already taken without skipping recall effort.',
      currentCue: 'Open recall → breakfast routine → blue pill box visual anchor',
      currentConversation: [
        { speaker: 'Malee', text: 'Did I already take my morning medicine?' },
        { speaker: 'Second Brain', text: 'Let’s walk through breakfast first. What did you do after tea?' },
        { speaker: 'Malee', text: 'I remember the green mug, but not the pill box.' },
      ],
      scratchpad: ['Do not diagnose', 'Avoid raw-photo display', 'Smallest useful cue first', 'Pim sees summary only'],
    },
  },
  somchai: {
    personaId: 'somchai',
    path: 'Somchai / Prize message / Social-cue and payment verification',
    stores: [
      {
        type: 'episodic',
        title: 'Episodic store',
        subtitle: 'Message and contact timeline',
        productRole: 'Shows the sequence from prize message to verification nudge.',
        items: ['09:14 prize message received', '09:16 payment phrase detected', '09:18 neighbor call skipped', '09:21 Nok verification suggested'],
      },
      {
        type: 'semantic',
        title: 'Semantic store',
        subtitle: 'Fraud-risk knowledge graph',
        productRole: 'Relates message wording, trusted contacts, bank safety rules, and social context.',
        items: ['Nok is trusted niece', 'Urgency language increases risk', 'Bank never asks for account codes', 'Neighbor calls support reality checking'],
      },
      {
        type: 'procedural',
        title: 'Procedural store',
        subtitle: 'Payment judgment protocol',
        productRole: 'Turns unfamiliar money requests into a verify-before-reply routine.',
        items: ['Pause before reply', 'Identify urgency words', 'Ask who benefits', 'Verify with Nok or bank'],
      },
      {
        type: 'working',
        title: 'Working memory',
        subtitle: 'Active prize-message check',
        productRole: 'Holds the suspicious message, current interpretation, and safe next action.',
        items: ['Active task: prize message decision', 'Current cue: urgency + account request', 'User intent: reply quickly', 'Next response: verify with a person'],
      },
    ],
    episodicTimeline: [
      { time: '09:14', title: 'Prize message arrives', detail: 'Message claims Somchai won today and asks for fast account confirmation.', evidence: 'Message metadata' },
      { time: '09:16', title: 'Urgency marker detected', detail: 'Words like “today only” and “send now” appear together.', evidence: 'Language-risk pattern' },
      { time: '09:18', title: 'Human-contact cue missing', detail: 'Usual neighbor check-in did not happen this morning.', evidence: 'Contact pattern' },
      { time: '09:20', title: 'Somchai asks AGI what it means', detail: 'He asks whether the message is good news rather than naming risk markers independently.', evidence: 'Conversation event' },
      { time: '09:21', title: 'Trusted-person verification suggested', detail: 'Second Brain recommends asking Nok or the bank before sharing any account detail.', evidence: 'Safety protocol' },
    ],
    semanticGraph: {
      wikiConcept: 'Graph-RAG concept: suspicious-message meaning comes from connected facts: sender trust, urgency language, payment objects, bank norms, and human verification routes.',
      nodes: [
        { id: 'somchai', label: 'Somchai', kind: 'person' },
        { id: 'nok', label: 'Nok · niece', kind: 'trusted contact' },
        { id: 'prize', label: 'Prize message', kind: 'message' },
        { id: 'urgency', label: 'Urgency language', kind: 'risk cue' },
        { id: 'bank', label: 'Bank verification', kind: 'safe channel' },
        { id: 'neighbor', label: 'Neighbor call', kind: 'human-contact anchor' },
      ],
      edges: [
        { from: 'prize', to: 'urgency', label: 'contains' },
        { from: 'urgency', to: 'bank', label: 'requires verification through' },
        { from: 'somchai', to: 'nok', label: 'can ask before payment' },
        { from: 'neighbor', to: 'somchai', label: 'usually supports social reality check' },
        { from: 'prize', to: 'nok', label: 'safe summary can be forwarded to' },
      ],
    },
    proceduralModel: {
      routine: 'Unfamiliar money-message protocol',
      decisionPolicy: 'Never complete a payment decision from AGI alone; require trusted-person or bank verification.',
      steps: [
        { step: 'Pause', expected: 'Delay reply to unfamiliar sender', observed: 'Wants to answer quickly', supportRule: 'Add friction before composing reply' },
        { step: 'Name risk cues', expected: 'Spot urgency and account request', observed: 'Needs category hint', supportRule: 'Ask what the message wants him to do' },
        { step: 'Choose verifier', expected: 'Select Nok or bank', observed: 'Accepts Nok verification', supportRule: 'Offer two safe choices' },
        { step: 'Prepare safe response', expected: 'No account information shared', observed: 'Needs templated refusal', supportRule: 'Draft short non-payment reply' },
      ],
    },
    workingMemory: {
      activeTask: 'Help Somchai interpret a prize message and avoid sharing payment information before verification.',
      currentCue: 'Category hint: urgency language + account request + trusted-person check',
      currentConversation: [
        { speaker: 'Somchai', text: 'They say I won today. Should I send my account number?' },
        { speaker: 'Second Brain', text: 'Before deciding, what is the message asking you to do quickly?' },
        { speaker: 'Somchai', text: 'It asks for bank details today.' },
      ],
      scratchpad: ['No payment action', 'Nok or bank verification', 'Preserve judgment practice', 'Track human-contact decline'],
    },
  },
  araya: {
    personaId: 'araya',
    path: 'Araya / Monthly accounting / Draft-first finance reasoning',
    stores: [
      {
        type: 'episodic',
        title: 'Episodic store',
        subtitle: 'Accounting attempt timeline',
        productRole: 'Shows Araya’s unsupported finance reasoning before AI polish.',
        items: ['10:31 bill review opened', '10:36 category confusion noted', '10:42 draft explanation shortened', '10:48 AI summary requested'],
      },
      {
        type: 'semantic',
        title: 'Semantic store',
        subtitle: 'Finance concept graph',
        productRole: 'Relates bills, budget categories, risk tolerance, and writing samples.',
        items: ['Fixed bills differ from variable costs', 'Safe fund is not investment cash', 'Daughter receives export only on request', 'Writing sample tracks explanation completeness'],
      },
      {
        type: 'procedural',
        title: 'Procedural store',
        subtitle: 'Draft-first reasoning protocol',
        productRole: 'Keeps budgeting and writing skills active before AI summarizes.',
        items: ['Separate fixed and variable costs', 'Explain tradeoff in own words', 'Compare safe fund vs investment risk', 'Let AI polish after draft'],
      },
      {
        type: 'working',
        title: 'Working memory',
        subtitle: 'Active accounting reflection',
        productRole: 'Holds current budget categories, draft, cue level, and next reasoning prompt.',
        items: ['Active task: monthly expense review', 'Current cue: category sorting', 'User draft: short and uncertain', 'Next response: ask for one tradeoff'],
      },
    ],
    episodicTimeline: [
      { time: '10:31', title: 'Bill review opened', detail: 'Araya starts with rent, groceries, medicine, and savings transfer records.', evidence: 'Budget workspace event' },
      { time: '10:36', title: 'Category sorting slows', detail: 'Variable food cost and medical refill are mixed in the first attempt.', evidence: 'Task interaction log' },
      { time: '10:42', title: 'Autonomous draft is short', detail: 'Draft says expenses are high but omits fixed-vs-variable explanation.', evidence: 'Writing sample' },
      { time: '10:45', title: 'Investment tradeoff prompt needed', detail: 'Needs cue to compare safe fund, liquidity, and risk before transfer.', evidence: 'Finance reasoning prompt' },
      { time: '10:48', title: 'AI polish requested', detail: 'Second Brain summarizes only after Araya completes a draft-first explanation.', evidence: 'Conversation event' },
    ],
    semanticGraph: {
      wikiConcept: 'LLM-wiki concept: budget reasoning links categories, past explanations, risk preferences, and export permissions so AI polish does not hide the unsupported attempt.',
      nodes: [
        { id: 'araya', label: 'Araya', kind: 'person' },
        { id: 'fixed', label: 'Fixed bills', kind: 'budget category' },
        { id: 'variable', label: 'Variable costs', kind: 'budget category' },
        { id: 'safe-fund', label: 'Safe fund', kind: 'asset' },
        { id: 'investment', label: 'Investment option', kind: 'risk concept' },
        { id: 'writing', label: 'Draft explanation', kind: 'language sample' },
      ],
      edges: [
        { from: 'fixed', to: 'variable', label: 'must be separated from' },
        { from: 'safe-fund', to: 'investment', label: 'compared before transfer to' },
        { from: 'writing', to: 'araya', label: 'preserves autonomous reasoning for' },
        { from: 'araya', to: 'safe-fund', label: 'uses for liquidity' },
        { from: 'investment', to: 'writing', label: 'requires tradeoff explanation in' },
      ],
    },
    proceduralModel: {
      routine: 'Monthly accounting draft-first workflow',
      decisionPolicy: 'Ask Araya to draft categories and tradeoffs before AI rewrites or recommends.',
      steps: [
        { step: 'Collect bills', expected: 'List fixed and variable costs', observed: 'Lists bills but blends categories', supportRule: 'Use two-column sorting cue' },
        { step: 'Explain change', expected: 'Name why expenses rose', observed: 'Short explanation', supportRule: 'Ask for one cause in her words' },
        { step: 'Compare options', expected: 'Discuss liquidity and risk', observed: 'Needs risk cue', supportRule: 'Prompt safe fund vs investment tradeoff' },
        { step: 'Polish summary', expected: 'AI edits after draft', observed: 'Accepts draft-first mode', supportRule: 'Keep original draft visible beside polished text' },
      ],
    },
    workingMemory: {
      activeTask: 'Help Araya review monthly expenses while preserving her own finance and writing reasoning.',
      currentCue: 'Specific cue: separate fixed bills, variable costs, and investment risk before AI summary',
      currentConversation: [
        { speaker: 'Araya', text: 'Expenses are high. Maybe move money from the safe fund.' },
        { speaker: 'Second Brain', text: 'Before I summarize, which costs were fixed and which changed this month?' },
        { speaker: 'Araya', text: 'Rent is fixed. Food and medicine changed.' },
      ],
      scratchpad: ['Draft before polish', 'Preserve original explanation', 'No investment recommendation', 'Export only if requested'],
    },
  },
};

export const memoryStores = memoryArchitectures.malee.stores;
export const getMemoryArchitecture = (personaId: PersonaId) => memoryArchitectures[personaId] ?? memoryArchitectures.malee;
