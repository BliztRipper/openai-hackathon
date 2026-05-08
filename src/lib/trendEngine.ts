import { domainTrends, notices, type DomainTrend, type Notice } from '../data/careSignals';
import type { PersonaId } from '../data/personas';

export type DashboardSummary = {
  trends: DomainTrend[];
  notices: Notice[];
  maskingSummary: string;
  supportLevel: 'Stable' | 'Watch' | 'Support review';
};

export function buildDashboardSummary(personaId: PersonaId): DashboardSummary {
  const trends = domainTrends[personaId];
  const personaNotices = notices[personaId];
  const supportCount = trends.filter((trend) => trend.status === 'support').length;
  const watchCount = trends.filter((trend) => trend.status === 'watch').length;

  return {
    trends,
    notices: personaNotices,
    maskingSummary:
      'AGI may be masking functional change when completion stays high but autonomous effort, latency, or cue needs shift over time.',
    supportLevel: supportCount > 0 ? 'Support review' : watchCount > 0 ? 'Watch' : 'Stable',
  };
}

export function getTrendDirection(trend: DomainTrend): 'down' | 'up' | 'flat' {
  const first = trend.points[0]?.value ?? 0;
  const last = trend.points.at(-1)?.value ?? first;
  if (Math.abs(last - first) < 2) return 'flat';
  return last > first ? 'up' : 'down';
}
