import { Fragment, type CSSProperties } from 'react';
import { ArrowIcon, BrainIcon, ChartIcon, LockIcon, PulseIcon, ShieldIcon } from './Icons';

type Props = { onStart: () => void };

const proofCards = [
  { label: 'Longitudinal signals', value: '90 days', detail: 'Baseline plus trend-change period across routine, finance, writing, and social signals.' },
  { label: 'Cognitive domains', value: '6', detail: 'Memory, attention, language, executive function, orientation, and social cognition.' },
  { label: 'Sharing controls', value: 'User-led', detail: 'The app keeps review notes concise and only shares what is useful for trusted support.' },
];

const loop = [
  { icon: <BrainIcon />, title: 'Friction before offloading', detail: 'Recall, planning, and communication prompts preserve useful cognitive effort.' },
  { icon: <LockIcon />, title: 'Reality Anchor', detail: 'Ground-truth logs scaffold reorientation without shaming or exposing raw surveillance.' },
  { icon: <ChartIcon />, title: 'Review-ready trends', detail: 'Caregivers and clinicians see concise support signals with uncertainty language.' },
];

const carePathway = [
  {
    step: '01',
    title: 'AGI use becomes daily life',
    detail: 'Voice help, reminders, message writing, payments, and companionship become normal supports for older adults.',
  },
  {
    step: '02',
    title: 'Second Brain measures hidden support',
    detail: 'The system separates independent attempts from AGI-assisted completion so families can see when help is quietly increasing.',
  },
  {
    step: '03',
    title: 'Family receives a simple action',
    detail: 'Trusted contacts see concise support trends and next steps through channels that fit family-based care.',
  },
  {
    step: '04',
    title: 'Community care reviews only what matters',
    detail: 'Village health volunteers, clinics, and care coordinators can focus on repeated red or yellow patterns rather than raw personal logs.',
  },
  {
    step: '05',
    title: 'The model expands globally',
    detail: 'The same autonomy-preservation logic can support Japan, Singapore, Europe, and the US as AGI becomes everyday infrastructure.',
  },
];

const scaleCards = [
  { label: 'Thailand first', value: 'Family + clinic', detail: 'Built around aging households, trusted relatives, community health workers, and low-cost wellness support.' },
  { label: 'Low-friction reach', value: 'LINE-ready', detail: 'Care summaries can fit familiar message workflows instead of forcing a new clinical portal.' },
  { label: 'Global expansion', value: 'Middleware', detail: 'The product can sit between users and any AGI assistant that reports assistance level, task domain, and cue response.' },
];

const heroWords = ['Second', 'Brain', 'makes', 'AGI-masked', 'support', 'needs', 'visible.'];

export function Landing({ onStart }: Props) {
  return (
    <section className="launch-page" aria-labelledby="hero-title">
      <div className="hero-grid">
        <div className="hero-copy panel elevated">
          <p className="eyebrow">Second Brain · post-AGI cognitive wellness</p>
          <h1 id="hero-title" className="word-reveal" aria-label="Second Brain makes AGI-masked support needs visible.">
            {heroWords.map((word, index) => (
              <Fragment key={`${word}-${index}`}>
                <span
                  aria-hidden="true"
                  className="word-reveal-item"
                  style={{ '--word-index': index } as CSSProperties}
                >
                  {word}
                </span>
                {index < heroWords.length - 1 ? ' ' : null}
              </Fragment>
            ))}
          </h1>
          <p className="lead">
            An elderly-first cognitive agency layer: voice-first companion support, gentle recall prompts,
            longitudinal behavioral signals, and caregiver/clinician dashboards that never claim diagnosis.
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={onStart}>
              Start support setup <ArrowIcon />
            </button>
            <span className="disclosure-pill"><ShieldIcon /> User-led sharing · human review</span>
          </div>
        </div>

        <aside className="launch-preview panel" aria-label="Live product preview">
          <div className="preview-topline">
            <span className="status-dot" aria-hidden="true" />
            <strong>Today’s care workspace</strong>
          </div>
          <div className="voice-card">
            <PulseIcon />
            <div>
              <span className="eyebrow">Hands-free companion</span>
              <p>“Before I answer, can you picture where the blue pill box was after breakfast?”</p>
            </div>
          </div>
          <div className="preview-metrics" aria-label="Example support trend metrics">
            <span><strong>-4%</strong> short-term medication recall</span>
            <span><strong>+9%</strong> AGI-assisted routine completion</span>
            <span><strong>72%</strong> recovery after one hint</span>
          </div>
          <div className="instrument-note">
            <strong>How this helps:</strong> reveal when AGI is helping so much that independence looks stronger than unsupported performance.
          </div>
        </aside>
      </div>

      <div className="proof-grid" aria-label="Care support proof points">
        {proofCards.map((card) => (
          <article className="proof-card panel" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>

      <section className="loop-grid" aria-label="Second Brain support loop">
        {loop.map((item) => (
          <article className="loop-card panel" key={item.title}>
            {item.icon}
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="care-pathway panel elevated" aria-labelledby="care-pathway-title">
        <div className="section-heading compact">
          <p className="eyebrow">Thailand-to-global pathway</p>
          <h2 id="care-pathway-title">Start with family-based aging care, scale as AGI becomes daily infrastructure.</h2>
          <p>
            Second Brain is designed for Thailand’s fast-aging society first: family caregivers, familiar messaging habits,
            and community review. The same autonomy-preservation layer can then travel to any market where AGI quietly
            completes memory, planning, finance, language, or companionship work.
          </p>
        </div>

        <div className="pathway-timeline" aria-label="Care pathway from Thailand to global scale">
          {carePathway.map((item) => (
            <article className="pathway-step" key={item.step}>
              <span>{item.step}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="scale-grid" aria-label="Scalability strengths">
          {scaleCards.map((card) => (
            <article className="scale-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
