import { useMemo, useState } from 'react';
import { getMemoryArchitecture, type SemanticNode, type StoreType } from '../data/memoryStores';
import type { PersonaId } from '../data/personas';
import { ArrowIcon, GraphIcon, ShieldIcon } from './Icons';

type Props = { personaId: PersonaId; onContinue: () => void; onBack: () => void };

function graphPoint(index: number, total: number) {
  if (index === 0) return { x: 360, y: 210 };
  const outerCount = Math.max(total - 1, 1);
  const angle = -Math.PI / 2 + ((index - 1) * Math.PI * 2) / outerCount;
  return {
    x: 360 + Math.cos(angle) * 245,
    y: 210 + Math.sin(angle) * 145,
  };
}

function splitGraphLabel(label: string) {
  const words = label.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 16 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 2);
}

function nodeClass(node: SemanticNode) {
  return node.kind.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

export function MemoryArchitecture({ personaId, onContinue, onBack }: Props) {
  const architecture = useMemo(() => getMemoryArchitecture(personaId), [personaId]);
  const [activeStore, setActiveStore] = useState<StoreType>('episodic');
  const activeStoreMeta = architecture.stores.find((store) => store.type === activeStore) ?? architecture.stores[0];
  const graphTitleId = `semantic-graph-title-${personaId}`;
  const graphArrowId = `semantic-graph-arrow-${personaId}`;

  const renderStoreDetail = () => {
    if (activeStore === 'episodic') {
      return (
        <div className="memory-detail-grid episodic-timeline" aria-label="Episodic timeline table">
          {architecture.episodicTimeline.map((event) => (
            <article className="timeline-row" key={`${event.time}-${event.title}`}>
              <time>{event.time}</time>
              <div>
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
                <small>{event.evidence}</small>
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (activeStore === 'semantic') {
      const positionedNodes = architecture.semanticGraph.nodes.map((node, index, nodes) => ({
        ...node,
        ...graphPoint(index, nodes.length),
      }));
      const nodeLookup = new Map(positionedNodes.map((node) => [node.id, node]));
      const connectedEdges = architecture.semanticGraph.edges
        .map((edge) => ({ ...edge, fromNode: nodeLookup.get(edge.from), toNode: nodeLookup.get(edge.to) }))
        .filter((edge): edge is typeof edge & { fromNode: SemanticNode & { x: number; y: number }; toNode: SemanticNode & { x: number; y: number } } => Boolean(edge.fromNode && edge.toNode));

      return (
        <div className="semantic-detail">
          <p>{architecture.semanticGraph.wikiConcept}</p>
          <div className="graph-rag-layout" aria-label="Semantic graph RAG concept map">
            <div className="graph-rag-visual">
              <svg
                className="graph-rag-canvas"
                viewBox="0 0 720 430"
                role="img"
                aria-labelledby={graphTitleId}
              >
                <title id={graphTitleId}>Graph-RAG map showing connected semantic facts for {activeStoreMeta.subtitle}</title>
                <defs>
                  <marker id={graphArrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                </defs>
                <g className="graph-rag-links">
                  {connectedEdges.map((edge, index) => {
                    const midX = (edge.fromNode.x + edge.toNode.x) / 2;
                    const midY = (edge.fromNode.y + edge.toNode.y) / 2;
                    return (
                      <g key={`${edge.from}-${edge.to}-${edge.label}`}>
                        <path
                          d={`M ${edge.fromNode.x} ${edge.fromNode.y} Q ${midX} ${midY - 22} ${edge.toNode.x} ${edge.toNode.y}`}
                          markerEnd={`url(#${graphArrowId})`}
                        />
                        <text x={midX} y={midY + (index % 2 === 0 ? -12 : 18)} textAnchor="middle">
                          {edge.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
                <g className="graph-rag-nodes">
                  {positionedNodes.map((node) => {
                    const lines = splitGraphLabel(node.label);
                    return (
                      <g className={`graph-rag-node ${nodeClass(node)}`} transform={`translate(${node.x} ${node.y})`} key={node.id}>
                        <circle r={46} />
                        <text className="graph-rag-node-label" textAnchor="middle">
                          {lines.map((line, index) => (
                            <tspan x="0" dy={index === 0 ? -4 : 14} key={line}>{line}</tspan>
                          ))}
                        </text>
                        <text className="graph-rag-node-kind" x="0" y="58" textAnchor="middle">{node.kind}</text>
                      </g>
                    );
                  })}
                </g>
              </svg>
              <div className="graph-rag-pipeline" aria-label="Graph-RAG retrieval path">
                <span>Question</span>
                <span>Retrieve connected facts</span>
                <span>Rank evidence</span>
                <span>Grounded care answer</span>
              </div>
            </div>
            <div className="semantic-edges">
              <strong>Connection evidence</strong>
              {architecture.semanticGraph.edges.map((edge) => (
                <p key={`${edge.from}-${edge.to}-${edge.label}`}><strong>{edge.from}</strong> → {edge.to}: {edge.label}</p>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeStore === 'procedural') {
      return (
        <div className="procedural-detail">
          <div className="procedure-header">
            <strong>{architecture.proceduralModel.routine}</strong>
            <p>{architecture.proceduralModel.decisionPolicy}</p>
          </div>
          <div className="procedure-steps">
            {architecture.proceduralModel.steps.map((step, index) => (
              <article className="procedure-step" key={step.step}>
                <span>{index + 1}</span>
                <div>
                  <h4>{step.step}</h4>
                  <p><strong>Expected:</strong> {step.expected}</p>
                  <p><strong>Observed:</strong> {step.observed}</p>
                  <p><strong>Support rule:</strong> {step.supportRule}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="working-detail">
        <article className="active-task-card">
          <span className="eyebrow">Active task</span>
          <h3>{architecture.workingMemory.activeTask}</h3>
          <p>{architecture.workingMemory.currentCue}</p>
        </article>
        <div className="working-conversation" aria-label="Current conversation memory">
          {architecture.workingMemory.currentConversation.map((turn) => (
            <p key={`${turn.speaker}-${turn.text}`}><strong>{turn.speaker}:</strong> {turn.text}</p>
          ))}
        </div>
        <div className="scratchpad-list">
          {architecture.workingMemory.scratchpad.map((note) => <span key={note}>{note}</span>)}
        </div>
      </div>
    );
  };

  return (
    <section className="stack" aria-labelledby="memory-title">
      <div className="section-heading">
        <p className="eyebrow">Memory map</p>
        <h2 id="memory-title">See why Second Brain is giving this support.</h2>
        <p>{architecture.path}. Choose a memory area to review the timeline, connected knowledge, routine steps, or current task.</p>
      </div>
      <div className="store-grid store-button-grid">
        {architecture.stores.map((store, index) => (
          <button
            className={`store-card panel ${store.type} ${store.type === activeStore ? 'active' : ''}`}
            key={store.type}
            onClick={() => setActiveStore(store.type)}
            aria-pressed={store.type === activeStore}
          >
            <div className="store-index">{index + 1}</div>
            <h3>{store.title}</h3>
            <p className="store-subtitle">{store.subtitle}</p>
            <p>{store.productRole}</p>
            <ul>
              {store.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </button>
        ))}
      </div>

      <article className={`memory-detail-panel panel elevated ${activeStore}`} aria-live="polite">
        <div className="memory-detail-heading">
          <GraphIcon />
          <div>
            <p className="eyebrow">Selected store</p>
            <h3>{activeStoreMeta.title}: {activeStoreMeta.subtitle}</h3>
          </div>
        </div>
        {renderStoreDetail()}
      </article>

      <div className="event-flow privacy-flow panel">
        <ShieldIcon />
        <div>
          <strong>Care review:</strong>
          <p>Only derived trend summaries and necessary notices cross to caregiver/clinician views. Raw logs remain behind explicit permission tiers.</p>
        </div>
      </div>
      <div className="button-row">
        <button className="secondary-action" onClick={onBack}>Back</button>
        <button className="primary-action" onClick={onContinue}>Review care trends <ArrowIcon /></button>
      </div>
    </section>
  );
}
