import { describe, expect, it } from 'vitest';
import { domainTrends, validationReadiness } from './careSignals';
import { memoryStores } from './memoryStores';

describe('care signal completeness', () => {
  it('contains baseline and trend-change points for all trends', () => {
    for (const trends of Object.values(domainTrends)) {
      for (const trend of trends) {
        expect(trend.points.length).toBeGreaterThanOrEqual(4);
        expect(trend.confidence.toLowerCase()).toContain('confidence');
        expect(trend.explanation.length).toBeGreaterThan(20);
      }
    }
  });

  it('covers all four cognitively-inspired memory stores', () => {
    expect(memoryStores.map((store) => store.type).sort()).toEqual(['episodic', 'procedural', 'semantic', 'working']);
    for (const store of memoryStores) {
      expect(store.items.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('maps product signals to future validation data needs', () => {
    expect(validationReadiness.length).toBeGreaterThanOrEqual(4);
    expect(validationReadiness.some((item) => item.signal.includes('Recall'))).toBe(true);
    expect(validationReadiness.some((item) => item.signal.includes('AGI-assisted'))).toBe(true);
  });
});
