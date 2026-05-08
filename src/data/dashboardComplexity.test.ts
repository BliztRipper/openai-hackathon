import { describe, expect, it } from 'vitest';
import { dashboardMatrices, radarMetrics } from './careSignals';
import { personas } from './personas';

describe('persona dashboard complexity', () => {
  it('provides unique radar and matrix data for every persona dashboard', () => {
    for (const persona of personas) {
      expect(radarMetrics[persona.id].length).toBeGreaterThanOrEqual(5);
      expect(dashboardMatrices[persona.id].length).toBeGreaterThanOrEqual(4);
    }

    const radarFingerprints = personas.map((persona) => radarMetrics[persona.id].map((metric) => `${metric.axis}:${metric.value}`).join('|'));
    const matrixFingerprints = personas.map((persona) => dashboardMatrices[persona.id].map((row) => `${row.domain}:${row.current}`).join('|'));

    expect(new Set(radarFingerprints).size).toBe(personas.length);
    expect(new Set(matrixFingerprints).size).toBe(personas.length);
  });
});
