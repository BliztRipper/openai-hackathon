import { personas, type PersonaId } from '../data/personas';
import { ArrowIcon, CheckIcon, ShieldIcon } from './Icons';

type Props = {
  selectedId: PersonaId;
  onSelect: (id: PersonaId) => void;
  onContinue: () => void;
};

export function PersonaSelector({ selectedId, onSelect, onContinue }: Props) {
  const selected = personas.find((persona) => persona.id === selectedId) ?? personas[0];

  return (
    <section className="stack" aria-labelledby="persona-title">
      <div className="section-heading">
        <p className="eyebrow">Choose who needs support</p>
        <h2 id="persona-title">Select the person you want Second Brain to help right now.</h2>
        <p>Each profile starts a focused support path with clear prompts, memory context, and review notes for trusted care.</p>
      </div>
      <div className="persona-grid">
        {personas.map((persona) => (
          <button
            className={`persona-card panel ${persona.id === selectedId ? 'selected' : ''}`}
            key={persona.id}
            onClick={() => onSelect(persona.id)}
            aria-pressed={persona.id === selectedId}
          >
            <span className="persona-topline">
              <span>{persona.name}, {persona.age}</span>
              {persona.id === selectedId && <CheckIcon label="Selected" />}
            </span>
            <strong>{persona.dashboardVariant}</strong>
            <span>{persona.location} · {persona.scenarioTitle}</span>
            <p>{persona.context}</p>
            <small>{persona.focus}</small>
            <div className="persona-tags" aria-label={`${persona.name} risk markers`}>
              {persona.riskMarkers.slice(0, 2).map((marker) => <span key={marker}>{marker}</span>)}
            </div>
          </button>
        ))}
      </div>

      <article className="selected-persona panel elevated" aria-label="Selected support profile">
        <div>
          <p className="eyebrow">Selected support path</p>
          <h3>{selected.name}: {selected.scenarioGoal}</h3>
          <p>{selected.taskClue}</p>
        </div>
        <div className="sharing-mini"><ShieldIcon /><span>{selected.sharingNote}</span></div>
      </article>

      <button className="primary-action align-start" onClick={onContinue}>
        Continue with {selected.name} <ArrowIcon />
      </button>
    </section>
  );
}
