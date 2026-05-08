import { useMemo, useState } from 'react';
import { capabilityExamples, companionBoundarySignals, dashboardMatrices, radarMetrics } from '../data/careSignals';
import { getPersona, personas, type PersonaId } from '../data/personas';
import { buildDashboardSummary, getTrendDirection } from '../lib/trendEngine';
import type { WorkspaceSummary } from '../lib/workspaceApi';
import { ChartIcon, PulseIcon, ShieldIcon } from './Icons';
import { ValidationReadiness } from './ValidationReadiness';

type Props = { selectedId: PersonaId; workspace: WorkspaceSummary; onRestart: () => void; onBack: () => void };

function MiniLine({ points, label }: { points: { month: string; value: number }[]; label: string }) {
  const max = Math.max(...points.map((point) => point.value));
  const min = Math.min(...points.map((point) => point.value));
  const range = Math.max(1, max - min);
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * 100;
      const y = 42 - ((point.value - min) / range) * 34;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  const first = points[0];
  const last = points.at(-1);
  return (
    <figure className="chart-figure">
      <svg className="mini-line" viewBox="0 0 100 48" role="img" aria-label={`${label} trend from ${first?.month} ${first?.value} to ${last?.month} ${last?.value}`}>
        <path d="M0 42 H100" className="axis" />
        <path d={path} className="trend-path" />
        {points.map((point, index) => {
          const x = (index / Math.max(1, points.length - 1)) * 100;
          const y = 42 - ((point.value - min) / range) * 34;
          return <circle key={point.month} cx={x} cy={y} r="2.6" />;
        })}
      </svg>
      <figcaption>{first?.month}: {first?.value} → {last?.month}: {last?.value}</figcaption>
    </figure>
  );
}


function RadarChart({ metrics, label }: { metrics: { axis: string; value: number; benchmark: number; note: string }[]; label: string }) {
  const center = 58;
  const radius = 44;
  const pointFor = (value: number, index: number) => {
    const angle = -Math.PI / 2 + (index / metrics.length) * Math.PI * 2;
    const scaled = radius * (value / 100);
    return { x: center + Math.cos(angle) * scaled, y: center + Math.sin(angle) * scaled };
  };
  const benchmarkPath = metrics.map((metric, index) => pointFor(metric.benchmark, index)).map((point) => `${point.x},${point.y}`).join(' ');
  const currentPath = metrics.map((metric, index) => pointFor(metric.value, index)).map((point) => `${point.x},${point.y}`).join(' ');
  return (
    <article className="panel radar-panel" aria-label={`${label} radar chart`}>
      <div>
        <p className="eyebrow">Multi-domain support radar</p>
        <h3>{label}</h3>
      </div>
      <svg className="radar-chart" viewBox="0 0 116 116" role="img" aria-label={`${label} multi-domain radar`}>
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <circle key={ring} cx={center} cy={center} r={radius * ring} className="radar-ring" />
        ))}
        {metrics.map((metric, index) => {
          const end = pointFor(100, index);
          const labelPoint = pointFor(114, index);
          return (
            <g key={metric.axis}>
              <line x1={center} y1={center} x2={end.x} y2={end.y} className="radar-axis" />
              <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle">{metric.axis}</text>
            </g>
          );
        })}
        <polygon points={benchmarkPath} className="radar-benchmark" />
        <polygon points={currentPath} className="radar-current" />
      </svg>
      <div className="radar-legend">
        {metrics.map((metric) => <span key={metric.axis}><strong>{metric.axis}: {metric.value}</strong>{metric.note}</span>)}
      </div>
    </article>
  );
}

export function Dashboard({ selectedId, workspace, onRestart, onBack }: Props) {
  const [activePersona, setActivePersona] = useState<PersonaId>(selectedId);
  const persona = getPersona(activePersona);
  const summary = useMemo(() => buildDashboardSummary(activePersona), [activePersona]);
  const capabilityExample = capabilityExamples.find((item) => item.personaId === activePersona) ?? capabilityExamples[0];
  const boundarySignal = companionBoundarySignals.find((item) => item.personaId === activePersona) ?? companionBoundarySignals[0];
  const personaRadar = radarMetrics[activePersona];
  const personaMatrix = dashboardMatrices[activePersona];

  const supportMetrics = [
    { label: 'Support level', value: summary.supportLevel },
    { label: 'Trends shown', value: String(summary.trends.length) },
    { label: 'Necessary notices', value: String(summary.notices.length) },
    { label: 'Events stored', value: String(workspace.dashboardMetrics.eventsStored) },
  ];

  return (
    <section className="stack dashboard" aria-labelledby="dashboard-title">
      <div className="dashboard-hero panel elevated">
        <div>
          <p className="eyebrow">Care review</p>
          <h2 id="dashboard-title">{persona.name}: support trend summary</h2>
          <p>{persona.supportSignal}</p>
        </div>
        <div className="support-badge" aria-label={`Support level ${summary.supportLevel}`}>
          <ShieldIcon /> {summary.supportLevel}
        </div>
      </div>

      <div className="variant-tabs" role="tablist" aria-label="Care profile tabs">
        {personas.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={activePersona === item.id}
            className={activePersona === item.id ? 'active' : ''}
            onClick={() => setActivePersona(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <section className="workspace-product-panel panel" aria-label="Care workspace metrics">
        <div>
          <p className="eyebrow">Care workspace</p>
          <h3>{workspace.workspace.name}</h3>
          <p>{workspace.workspace.productionScope}. Dashboard reads saved care events plus longitudinal support patterns.</p>
        </div>
        <div className="metric-strip">
          {supportMetrics.map((metric) => <span key={metric.label}><strong>{metric.value}</strong>{metric.label}</span>)}
        </div>
      </section>

      <div className="dashboard-intelligence-grid">
        <RadarChart metrics={personaRadar} label={`${persona.name} support profile`} />
        <article className="panel matrix-panel" aria-label={`${persona.name} support matrix`}>
          <p className="eyebrow">Support matrix</p>
          <h3>{persona.scenarioTitle}</h3>
          <div className="support-matrix">
            {personaMatrix.map((row) => (
              <div className="matrix-row" key={row.domain}>
                <strong>{row.domain}</strong>
                <span>{row.current}</span>
                <span>{row.trend}</span>
                <p>{row.reviewAction}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="trend-grid">
        {summary.trends.map((trend) => (
          <article className={`trend-card panel ${trend.status}`} key={trend.id}>
            <div className="trend-heading">
              <ChartIcon />
              <div>
                <h3>{trend.label}</h3>
                <span>{trend.delta}</span>
              </div>
            </div>
            <MiniLine points={trend.points} label={trend.label} />
            <p>{trend.explanation}</p>
            <p className="trend-evidence"><strong>Evidence:</strong> {trend.evidence}</p>
            <small>{trend.confidence} · Direction: {getTrendDirection(trend)}</small>
          </article>
        ))}
      </div>

      <section className="notice-grid" aria-label="Necessary notices">
        {summary.notices.map((notice) => (
          <article className="notice-card panel" key={notice.title}>
            <div className="rail-title"><PulseIcon /> Necessary notice</div>
            <h3>{notice.title}</h3>
            <p><strong>Why surfaced:</strong> {notice.why}</p>
            <p><strong>Uncertainty:</strong> {notice.uncertainty}</p>
            <p><strong>Suggested next review:</strong> {notice.suggestion}</p>
          </article>
        ))}
      </section>

      <div className="evidence-grid">
        <article className="panel masking-callout">
          <p className="eyebrow">Capability Inflation Detector</p>
          <h3>{capabilityExample.domain}</h3>
          <div className="comparison-grid">
            <div>
              <span>Autonomous attempt</span>
              <p>{capabilityExample.autonomousAttempt}</p>
            </div>
            <div>
              <span>AGI-assisted output</span>
              <p>{capabilityExample.agiAssistedOutput}</p>
            </div>
          </div>
          <p><strong>Measured gap:</strong> {capabilityExample.measuredGap}</p>
          <p><strong>Support interpretation:</strong> {capabilityExample.supportInterpretation}</p>
          <p>{summary.maskingSummary}</p>
        </article>

        <article className="panel companion-boundary">
          <p className="eyebrow">Companion use pattern</p>
          <h3>{boundarySignal.label}</h3>
          <strong>{boundarySignal.value}</strong>
          <p>{boundarySignal.interpretation}</p>
          <p>This treats AGI companionship as potentially beneficial unless longitudinal patterns suggest review-worthy overdependence.</p>
        </article>
      </div>

      <section className="notice-grid" aria-label="Care review queue">
        {workspace.reviewQueue.map((item) => (
          <article className="notice-card panel" key={item.id}>
            <div className="rail-title"><PulseIcon /> Care review queue</div>
            <h3>{item.title}</h3>
            <p><strong>Priority:</strong> {item.priority}</p>
            <p>{item.summary}</p>
            <small>Source: {item.source}</small>
          </article>
        ))}
      </section>

      <ValidationReadiness />

      <div className="button-row wrap">
        <button className="secondary-action" onClick={onBack}>Back to memory map</button>
        <button className="primary-action" onClick={onRestart}>Start over</button>
      </div>
    </section>
  );
}
