import { useEffect, useState } from 'react';
import { CompanionDemo } from './components/CompanionDemo';
import { Dashboard } from './components/Dashboard';
import { Landing } from './components/Landing';
import { MemoryArchitecture } from './components/MemoryArchitecture';
import { PersonaSelector } from './components/PersonaSelector';
import { ProgressNav } from './components/ProgressNav';
import type { PersonaId } from './data/personas';
import { nextStage, previousStage, type ProductStage } from './lib/productFlowState';
import { fetchWorkspaceSummary, type WorkspaceSummary, workspaceFallbackSummary } from './lib/workspaceApi';

export default function App() {
  const [stage, setStage] = useState<ProductStage>('landing');
  const [personaId, setPersonaId] = useState<PersonaId>('malee');
  const [workspace, setWorkspace] = useState<WorkspaceSummary>(workspaceFallbackSummary);

  useEffect(() => {
    let active = true;
    fetchWorkspaceSummary().then((summary) => {
      if (active) setWorkspace(summary);
    });
    return () => { active = false; };
  }, []);

  const goNext = () => setStage((current) => nextStage(current));
  const goBack = () => setStage((current) => previousStage(current));
  const restart = () => {
    setPersonaId('malee');
    setStage('landing');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" aria-label="Second Brain home">
          <span className="brand-mark" aria-hidden="true">
            <img className="brand-logo" src="/second-brain-logo.png" alt="" />
          </span>
          <div>
            <strong>Second Brain</strong>
            <span>Cognitive wellness co-pilot</span>
          </div>
        </div>
        <p className="header-note">Care workspace · {workspace.dashboardMetrics.eventsStored} saved events · Non-diagnostic</p>
      </header>
      <ProgressNav current={stage} onSelect={setStage} />
      <main id="main" className="main-content">
        {stage === 'landing' && <Landing onStart={() => setStage('personas')} />}
        {stage === 'personas' && <PersonaSelector selectedId={personaId} onSelect={setPersonaId} onContinue={goNext} />}
        {stage === 'companion' && <CompanionDemo personaId={personaId} workspace={workspace} onWorkspaceUpdate={setWorkspace} onBack={goBack} onContinue={goNext} />}
        {stage === 'architecture' && <MemoryArchitecture personaId={personaId} onBack={goBack} onContinue={goNext} />}
        {stage === 'dashboard' && <Dashboard selectedId={personaId} workspace={workspace} onBack={goBack} onRestart={restart} />}
      </main>
    </div>
  );
}
