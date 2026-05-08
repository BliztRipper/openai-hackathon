import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('CompanionDemo API contract rendering', () => {
  it('keeps provider implementation details out of user-facing companion copy', () => {
    const source = readFileSync(new URL('../src/components/CompanionDemo.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('apiResponse.safetyBoundary');
    expect(source).not.toContain('apiResponse.degradedReason');
    expect(source).not.toContain('Real API');
    expect(source).not.toContain('server token');
    expect(source).not.toContain('providerStatus.reason');
    expect(source).not.toContain('Safety boundary:');
  });
});

describe('interactive product surfaces', () => {
  it('makes memory stores clickable and passes selected persona into the memory map', () => {
    const memorySource = readFileSync(new URL('../src/components/MemoryArchitecture.tsx', import.meta.url), 'utf8');
    const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

    expect(memorySource).toContain('useState<StoreType>');
    expect(memorySource).toContain('onClick={() => setActiveStore');
    expect(memorySource).toContain('renderStoreDetail');
    expect(memorySource).toContain('graph-rag-canvas');
    expect(memorySource).toContain('Graph-RAG retrieval path');
    expect(appSource).toContain('<MemoryArchitecture personaId={personaId}');
  });

  it('renders persona-specific radar and matrix dashboard sections', () => {
    const dashboardSource = readFileSync(new URL('../src/components/Dashboard.tsx', import.meta.url), 'utf8');
    expect(dashboardSource).toContain('RadarChart');
    expect(dashboardSource).toContain('dashboardMatrices[activePersona]');
    expect(dashboardSource).toContain('radarMetrics[activePersona]');
  });

  it('uses automatic warning and critical states for live support signals', () => {
    const signalSource = readFileSync(new URL('../src/components/SignalRail.tsx', import.meta.url), 'utf8');
    const conversationSource = readFileSync(new URL('../src/data/conversation.ts', import.meta.url), 'utf8');
    expect(signalSource).toContain("type Severity = 'stable' | 'warning' | 'critical'");
    expect(signalSource).toContain('hasCriticalLatency');
    expect(signalSource).toContain('Serious support issue detected');
    expect(signalSource).not.toContain('setPreviewSeverity');
    expect(signalSource).not.toContain('signal-style-picker');
    expect(signalSource).not.toContain(`Selected ${'example'}`);
    expect(conversationSource).toContain('4s very-low-confidence latency');
  });
});
