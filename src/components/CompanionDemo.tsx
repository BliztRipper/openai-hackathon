import { useEffect, useMemo, useState } from 'react';
import { getConversation } from '../data/conversation';
import { getPersona } from '../data/personas';
import { requestCompanionInsight, type CompanionApiResponse } from '../lib/companionApi';
import { saveWorkspaceEvent, type WorkspaceSummary } from '../lib/workspaceApi';
import { deterministicInteractionAdapter } from '../lib/interactionAdapter';
import type { PersonaId } from '../data/personas';
import { ArrowIcon, BrainIcon, CheckIcon, PulseIcon, ShieldIcon } from './Icons';
import { SignalRail } from './SignalRail';

type Props = {
  personaId: PersonaId;
  workspace: WorkspaceSummary;
  onWorkspaceUpdate: (workspace: WorkspaceSummary) => void;
  onContinue: () => void;
  onBack: () => void;
};

const cueLabels = ['Open recall', 'Category hint', 'Specific cue', 'Multiple choice', 'Answer'];

export function CompanionDemo({ personaId, workspace, onWorkspaceUpdate, onContinue, onBack }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const persona = getPersona(personaId);
  const conversation = useMemo(() => getConversation(personaId), [personaId]);
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [apiResponse, setApiResponse] = useState<CompanionApiResponse | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const output = useMemo(
    () => deterministicInteractionAdapter.next({ stepIndex, context: 'concerning_trend', personaId }),
    [personaId, stepIndex],
  );
  const step = output.step;
  const activeSession = workspace.activeSessions.find((session) => session.personaId === personaId) ?? workspace.activeSessions[0];

  useEffect(() => {
    setStepIndex(0);
  }, [personaId]);

  useEffect(() => {
    setApiStatus('idle');
    setApiResponse(null);
    setWorkspaceStatus('idle');
  }, [personaId, stepIndex]);

  const requestApiInsight = async () => {
    setApiStatus('loading');
    const response = await requestCompanionInsight({
      personaId,
      personaName: persona.name,
      cueLevel: step.cueLevel,
      userLine: step.userLine,
      assistantLine: step.assistantLine,
      helper: step.helper,
      signal: step.signal,
      sessionId: activeSession?.id,
      context: 'concerning_trend',
    });
    setApiResponse(response);
    setApiStatus('ready');
  };

  const saveCurrentCue = async () => {
    if (!activeSession) return;
    setWorkspaceStatus('saving');
    const result = await saveWorkspaceEvent({
      personaId,
      sessionId: activeSession.id,
      stepId: step.id,
      cueLevel: step.cueLevel,
      userLine: step.userLine,
      assistantLine: step.assistantLine,
      signal: step.signal,
    });
    onWorkspaceUpdate(result.summary);
    setWorkspaceStatus('saved');
  };

  const advance = async () => {
    await saveCurrentCue();
    setStepIndex((current) => Math.min(current + 1, conversation.length - 1));
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };
  const reset = () => setStepIndex(0);

  return (
    <section className="stack" aria-labelledby="companion-title">
      <div className="section-heading">
        <p className="eyebrow">Guided support</p>
        <h2 id="companion-title">Second Brain helps without taking over the thinking.</h2>
        <p>{persona.taskClue}</p>
      </div>
      <div className="companion-layout">
        <article className="chat-panel panel elevated" aria-live="polite">
          <div className="task-card">
            <BrainIcon />
            <div>
              <span className="eyebrow">Current support need</span>
              <strong>{persona.name}: {persona.scenarioTitle}</strong>
              <p>{persona.scenarioGoal}</p>
            </div>
          </div>

          <div className="voice-first-card">
            <PulseIcon />
            <div>
              <strong>Hands-free mode</strong>
              <p>Listening can stay active to reduce typing burden; large controls keep the session easy to review and adjust.</p>
            </div>
            <span>Voice ready</span>
          </div>

          <div className="workspace-status-card">
            <span className="eyebrow">Care workspace</span>
            <strong>{workspace.workspace.name}</strong>
            <p>{activeSession?.title ?? 'No active session'} · {workspace.dashboardMetrics.eventsStored} stored events · {workspaceStatus === 'saving' ? 'Saving…' : workspaceStatus === 'saved' ? 'Saved' : 'Ready to save next cue'}</p>
          </div>

          <div className="cue-step-frame" key={step.id}>
            <div className="cue-meter" aria-label={`Cue level ${stepIndex + 1} of ${conversation.length}`}>
              {conversation.map((cue, index) => (
                <span className={index <= stepIndex ? 'filled' : ''} key={cue.id}>{cueLabels[index] ?? index + 1}</span>
              ))}
            </div>

            <div className="message user-message">
              <span>{persona.name}</span>
              <p>{step.userLine}</p>
            </div>
            <div className="message assistant-message">
              <span>Second Brain · {step.cueLevel}</span>
              <p>{step.assistantLine}</p>
            </div>
            <div className="helper-card">
              <CheckIcon />
              <p>{step.helper}</p>
            </div>
          </div>

          <div className="safety-strip">
            <ShieldIcon />
            <p><strong>Support guidance:</strong> urgent or risky requests can move to direct support after one supported attempt; trend summaries stay non-diagnostic.</p>
          </div>

          <article className="api-insight-panel" aria-label="Care insight">
            <div>
              <span className="eyebrow">Care insight</span>
              <h3>Summarize this support moment for review.</h3>
              <p>Creates a concise, non-diagnostic note that explains what support was needed and what the next gentle step should be.</p>
            </div>
            <button className="secondary-action align-start" onClick={requestApiInsight} disabled={apiStatus === 'loading'}>
              {apiStatus === 'loading' ? 'Preparing care note…' : 'Prepare care note'}
            </button>
            {apiResponse && (
              <div className={`api-result ${apiResponse.mode}`}>
                <div className="api-mode-row">
                  <strong>Care review note</strong>
                  <span>{apiResponse.mode === 'protected' ? 'Continuity note' : 'Personalized note'}</span>
                </div>
                <p>{apiResponse.companionNote}</p>
                <p><strong>Next action:</strong> {apiResponse.nextBestAction}</p>
                <ul>
                  {apiResponse.rubricEvidence.map((item) => (
                    <li key={item.label}><strong>{item.label}:</strong> {item.evidence}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
          <div className="button-row wrap">
            <button className="secondary-action" onClick={onBack}>Back</button>
            <button className="secondary-action" onClick={reset}>Restart clues</button>
            {!output.isComplete ? (
              <button className="primary-action" onClick={advance}>Save cue + continue <ArrowIcon /></button>
            ) : (
              <button className="primary-action" onClick={async () => { await saveCurrentCue(); onContinue(); }}>Save final cue + open memory map <ArrowIcon /></button>
            )}
          </div>
        </article>
        <SignalRail signal={output.emittedSignals} />
      </div>
    </section>
  );
}
