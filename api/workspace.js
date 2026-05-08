import { applyCors, methodNotAllowed, readJsonBody } from '../server/companionCore.mjs';
import {
  WorkspaceRequestError,
  appendCompanionEvent,
  buildWorkspaceSummary,
  defaultWorkspacePath,
  loadWorkspace,
} from '../server/workspaceCore.mjs';

function workspacePath() {
  return process.env.WORKSPACE_JSON_PATH || defaultWorkspacePath;
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    const state = await loadWorkspace(workspacePath());
    res.status(200).json({ ok: true, summary: buildWorkspaceSummary(state) });
    return;
  }

  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const body = await readJsonBody(req);
    if (body.action !== 'append-event') {
      throw new WorkspaceRequestError('Unsupported workspace action.', ['action must be append-event']);
    }
    const result = await appendCompanionEvent(workspacePath(), body.event);
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof SyntaxError) {
      res.status(400).json({ ok: false, error: 'Invalid JSON body' });
      return;
    }
    if (error instanceof WorkspaceRequestError) {
      res.status(error.statusCode).json({ ok: false, error: error.message, details: error.details });
      return;
    }
    res.status(500).json({ ok: false, error: 'Unable to update workspace.' });
  }
}
