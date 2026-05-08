import type { ConversationStep } from '../data/conversation';
import { PulseIcon } from './Icons';

type Props = { signal: ConversationStep['signal'] & { intensity?: string; rationale?: string } };
type Severity = 'stable' | 'warning' | 'critical';

const severityInsight: Record<Severity, { label: string; value: string; detail: string }> = {
  stable: {
    label: 'Stable',
    value: 'Support level is within range',
    detail: 'Signals show the user is still responding to the current cue strategy.',
  },
  warning: {
    label: 'Warning',
    value: 'Support friction rising',
    detail: 'Repeated cues, slower recall, or structured choices are now needed.',
  },
  critical: {
    label: 'Critical',
    value: 'Serious support issue detected',
    detail: 'Low-confidence latency, safety uncertainty, or direct help needs immediate attention.',
  },
};

function hasCriticalLatency(signal: Props['signal']): boolean {
  const latency = signal.latency.toLowerCase();
  const seconds = Number(latency.match(/(\d+)\s*s/)?.[1] ?? Number.NaN);
  return latency.includes('very-low') || latency.includes('very low') || latency.includes('low-confidence') || seconds <= 6;
}

function getSignalSeverity(signal: Props['signal']): Severity {
  if (hasCriticalLatency(signal) || signal.assistanceLevel === 'Direct support' || /safety|financial|daily routine safety/i.test(signal.domain)) return 'critical';
  if (signal.assistanceLevel === 'Hint-supported' || signal.assistanceLevel === 'Choice-supported' || /36s|37s|39s|42s|43s|44s|specific|visual anchor|repeated/i.test(`${signal.latency} ${signal.recallGap}`)) return 'warning';
  return 'stable';
}

export function SignalRail({ signal }: Props) {
  const activeSeverity = getSignalSeverity(signal);
  const insight = severityInsight[activeSeverity];
  const items = [
    ['Risk level', insight.label],
    ['Assistance level', signal.assistanceLevel],
    ['Recall gap', signal.recallGap],
    ['Domain', signal.domain],
    ['Cue responsiveness', signal.cueResponsiveness],
    ['Latency', signal.latency],
  ];
  return (
    <aside className={`signal-rail panel ${activeSeverity}`} aria-label="Structured signals emitted by this interaction">
      <div className="rail-title"><PulseIcon /> Live support signals</div>
      <div className={`signal-alert ${activeSeverity}`} aria-live="polite">
        <span>{insight.label}</span>
        <strong>{insight.value}</strong>
        <p>{insight.detail}</p>
      </div>
      {items.map(([label, value]) => (
        <div className="signal-item" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
      {signal.rationale && <p className="rationale"><strong>Friction policy:</strong> {signal.rationale}</p>}
    </aside>
  );
}
