import { describe, expect, it } from 'vitest';
import { getMemoryArchitecture, memoryArchitectures, storeTypes } from './memoryStores';
import { personas } from './personas';

describe('persona memory architecture', () => {
  it('gives every persona its own path and all four memory stores', () => {
    const paths = new Set<string>();
    for (const persona of personas) {
      const architecture = getMemoryArchitecture(persona.id);
      paths.add(architecture.path);
      expect(architecture.personaId).toBe(persona.id);
      expect(architecture.stores.map((store) => store.type).sort()).toEqual([...storeTypes].sort());
    }
    expect(paths.size).toBe(personas.length);
  });

  it('uses different episodic, semantic, procedural, and working data per scenario', () => {
    const fingerprints = Object.values(memoryArchitectures).map((architecture) => ({
      episodic: architecture.episodicTimeline.map((item) => item.title).join('|'),
      semantic: architecture.semanticGraph.nodes.map((node) => node.label).join('|'),
      procedural: architecture.proceduralModel.steps.map((step) => step.observed).join('|'),
      working: architecture.workingMemory.activeTask,
    }));

    for (const key of ['episodic', 'semantic', 'procedural', 'working'] as const) {
      expect(new Set(fingerprints.map((item) => item[key])).size).toBe(personas.length);
    }
  });

  it('supports the requested detailed views for clickable memory cards', () => {
    for (const architecture of Object.values(memoryArchitectures)) {
      expect(architecture.episodicTimeline.length).toBeGreaterThanOrEqual(4);
      expect(architecture.semanticGraph.nodes.length).toBeGreaterThanOrEqual(5);
      expect(architecture.semanticGraph.edges.length).toBeGreaterThanOrEqual(4);
      expect(architecture.proceduralModel.steps.length).toBeGreaterThanOrEqual(4);
      expect(architecture.workingMemory.currentConversation.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps semantic graph edges connected to visible Graph-RAG nodes', () => {
    for (const architecture of Object.values(memoryArchitectures)) {
      const nodeIds = new Set(architecture.semanticGraph.nodes.map((node) => node.id));

      for (const edge of architecture.semanticGraph.edges) {
        expect(nodeIds.has(edge.from)).toBe(true);
        expect(nodeIds.has(edge.to)).toBe(true);
        expect(edge.label.length).toBeGreaterThan(4);
      }
    }
  });
});
