export type PersonaId = 'malee' | 'somchai' | 'araya';

export type Persona = {
  id: PersonaId;
  name: string;
  age: number;
  location: string;
  context: string;
  taskClue: string;
  focus: string;
  dashboardVariant: string;
  supportSignal: string;
  caregiver: string;
  sharingNote: string;
  scenarioTitle: string;
  scenarioGoal: string;
  riskMarkers: string[];
  dataSources: string[];
};

export const personas: Persona[] = [
  {
    id: 'malee',
    name: 'Malee',
    age: 76,
    location: 'Bangkok',
    context: 'Retired teacher managing morning medicine with occasional support from her daughter.',
    taskClue: 'Ask Second Brain whether you took your morning medication. Try to recall before the log answers.',
    focus: 'Short-term and prospective medication recall',
    dashboardVariant: 'Medication memory support',
    supportSignal: 'Medication recall needed more cueing over 3 months, while recovery after a hint stayed stable.',
    caregiver: 'Pim, daughter · visits twice a month',
    sharingNote: 'Caregiver view uses trend summaries, not raw photo or transcript logs',
    scenarioTitle: 'Morning medication check',
    scenarioGoal: 'Preserve recall effort while preventing missed-dose uncertainty.',
    riskMarkers: ['Repeated medication questions', 'Longer response latency', 'Needs visual reality anchor'],
    dataSources: ['Medication reminder events', 'Routine photo context', 'Calendar clinic visit', 'Conversation transcript'],
  },
  {
    id: 'somchai',
    name: 'Somchai',
    age: 72,
    location: 'Chiang Mai',
    context: 'Retired shop owner living alone; AGI often helps interpret messages and payment decisions.',
    taskClue: 'Review a suspicious prize message without letting AGI decide for you immediately.',
    focus: 'Social-cue perception and financial judgment',
    dashboardVariant: 'Hidden judgment support need',
    supportSignal: 'Social-cue checks and financial decision support increased as human-contact markers fell.',
    caregiver: 'Nok, niece · remote weekly call',
    sharingNote: 'Trusted contact view receives financial-safety notices after repeated support signals',
    scenarioTitle: 'Prize-message judgment check',
    scenarioGoal: 'Encourage verification with a person before unfamiliar payment decisions.',
    riskMarkers: ['Urgent prize replies', 'Reduced neighbor calls', 'More “what did they mean?” prompts'],
    dataSources: ['Payment-category history', 'Message metadata', 'Human-contact indicators', 'AGI companion time'],
  },
  {
    id: 'araya',
    name: 'Araya',
    age: 69,
    location: 'Bangkok',
    context: 'Retired accountant who wants to preserve monthly budgeting and basic investment reasoning.',
    taskClue: 'Think through monthly expenses before asking AGI to summarize or choose for you.',
    focus: 'Communication and financial instrumental ADL preservation',
    dashboardVariant: 'Capability inflation gap',
    supportSignal: 'Autonomous finance explanations shortened while AGI-assisted summaries stayed polished.',
    caregiver: 'Self-directed · clinician summary only when requested',
    sharingNote: 'Finance and writing summaries stay user-controlled',
    scenarioTitle: 'Monthly accounting reflection',
    scenarioGoal: 'Keep instrumental daily-living skills active before AGI polishes the answer.',
    riskMarkers: ['Shorter autonomous explanations', 'More AGI-written messages', 'Needs category prompts for budgeting'],
    dataSources: ['Budget task attempts', 'Autonomous draft samples', 'AGI-assisted summaries', 'Investment reasoning prompts'],
  },
];

export const getPersona = (id: PersonaId) => personas.find((persona) => persona.id === id) ?? personas[0];
