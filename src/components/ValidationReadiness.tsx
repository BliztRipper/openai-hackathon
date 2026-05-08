import { validationReadiness } from '../data/careSignals';

export function ValidationReadiness() {
  return (
    <section className="panel validation" aria-labelledby="validation-title">
      <div className="section-heading compact">
        <p className="eyebrow">Validation readiness</p>
        <h3 id="validation-title">Validation pathway for clinical longitudinal evidence.</h3>
        <p>Every support signal maps to the kind of longitudinal dataset needed for stronger clinical evidence.</p>
      </div>
      <div className="validation-grid">
        {validationReadiness.map((item) => (
          <article className="validation-card" key={item.signal}>
            <strong>{item.signal}</strong>
            <small>{item.readiness}</small>
            <p><span>Future data:</span> {item.futureData}</p>
            <p><span>Question:</span> {item.validationQuestion}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
