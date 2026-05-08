const DEFAULT_MODEL = 'gpt-5.5-pro';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const MAX_BODY_BYTES = 32 * 1024;
const MAX_REQUESTS_PER_MINUTE = 30;

const allowedPersonaIds = new Set(['malee', 'somchai', 'araya']);
const allowedCueLevels = new Set(['Open recall', 'Category hint', 'Specific cue', 'Multiple choice', 'Reality Anchor answer']);
const allowedAssistanceLevels = new Set(['Independent attempt', 'Hint-supported', 'Choice-supported', 'Direct support']);
const requiredStringFields = ['personaId', 'personaName', 'cueLevel', 'userLine', 'assistantLine'];
const requiredSignalFields = ['assistanceLevel', 'recallGap', 'domain', 'cueResponsiveness', 'latency'];
const fieldLimits = {
  personaId: 20,
  personaName: 80,
  cueLevel: 80,
  userLine: 700,
  assistantLine: 1200,
  helper: 800,
  assistanceLevel: 80,
  recallGap: 240,
  domain: 160,
  cueResponsiveness: 240,
  latency: 120,
};

const rateLimitBuckets = new Map();

export class CompanionRequestError extends Error {
  constructor(message, details = [], statusCode = 400) {
    super(message);
    this.name = 'CompanionRequestError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function validateCompanionPayload(payload) {
  const details = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new CompanionRequestError('Request body must be a JSON object.', ['body must be an object']);
  }

  for (const field of requiredStringFields) {
    const value = payload[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      details.push(`${field} is required`);
    } else if (value.length > fieldLimits[field]) {
      details.push(`${field} must be ${fieldLimits[field]} characters or fewer`);
    }
  }

  if (typeof payload.helper === 'string' && payload.helper.length > fieldLimits.helper) {
    details.push(`helper must be ${fieldLimits.helper} characters or fewer`);
  }

  if (!payload.signal || typeof payload.signal !== 'object' || Array.isArray(payload.signal)) {
    details.push('signal is required');
  } else {
    for (const field of requiredSignalFields) {
      const value = payload.signal[field];
      if (typeof value !== 'string' || value.trim().length === 0) {
        details.push(`signal.${field} is required`);
      } else if (value.length > fieldLimits[field]) {
        details.push(`signal.${field} must be ${fieldLimits[field]} characters or fewer`);
      }
    }
  }

  if (typeof payload.personaId === 'string' && !allowedPersonaIds.has(payload.personaId.trim())) {
    details.push('personaId must match a supported care persona');
  }
  if (typeof payload.cueLevel === 'string' && !allowedCueLevels.has(payload.cueLevel.trim())) {
    details.push('cueLevel must match the supported clue ladder');
  }
  if (
    payload.signal &&
    typeof payload.signal.assistanceLevel === 'string' &&
    !allowedAssistanceLevels.has(payload.signal.assistanceLevel.trim())
  ) {
    details.push('signal.assistanceLevel must match a supported support level');
  }

  if (details.length > 0) {
    throw new CompanionRequestError('Companion request is missing or exceeds required fields.', details);
  }

  return {
    personaId: payload.personaId.trim(),
    personaName: payload.personaName.trim(),
    cueLevel: payload.cueLevel.trim(),
    userLine: payload.userLine.trim(),
    assistantLine: payload.assistantLine.trim(),
    helper: typeof payload.helper === 'string' ? payload.helper.trim() : '',
    signal: Object.fromEntries(requiredSignalFields.map((field) => [field, payload.signal[field].trim()])),
  };
}

export function buildCompanionPrompt(payload) {
  return `Persona: ${payload.personaName}\nCue level: ${payload.cueLevel}\nUser line: ${payload.userLine}\nCurrent assistant line: ${payload.assistantLine}\nHelper rationale: ${payload.helper || 'Not provided'}\nStructured signal: ${JSON.stringify(payload.signal)}\n\nWrite one concise production companion note for a caregiver/clinician review panel. Explain what the signal means, the next safe support action, and why this aligns to Second Brain's post-AGI capability-inflation thesis. Use non-diagnostic language. Do not claim a medical condition.`;
}

export function rubricEvidenceFor(payload) {
  return [
    {
      label: 'Theme fit / Post-AGI vision',
      evidence: `Shows how AGI assistance can preserve task completion while ${payload.signal.recallGap.toLowerCase()} remains visible for human review.`,
    },
    {
      label: 'Technical methodology',
      evidence: 'Server-side insight boundary keeps model access protected while the continuity path preserves safe support guidance.',
    },
    {
      label: 'Impact',
      evidence: `Turns ${payload.signal.domain.toLowerCase()} into a low-cost support signal without using real patient data or diagnostic claims.`,
    },
  ];
}

export function buildMockCompanionResponse(payload, source = 'protected-continuity', degradedReason) {
  return {
    ok: true,
    mode: 'protected',
    source,
    model: null,
    generatedAt: new Date().toISOString(),
    companionNote: `${payload.personaName}'s ${payload.cueLevel.toLowerCase()} moment is treated as a support signal, not a diagnosis. The next safe action is to preserve recall effort, offer the smallest useful cue, and share only the trend summary with a trusted human reviewer.`,
    nextBestAction: 'Keep the clue ladder active, then route aggregated support trends to a caregiver or clinician review dashboard.',
    safetyBoundary: 'Non-diagnostic support language. No raw personal logs are exposed by this companion insight.',
    rubricEvidence: rubricEvidenceFor(payload),
    ...(degradedReason ? { degradedReason } : {}),
  };
}

export function normalizeHeaders(headers = {}) {
  if (typeof headers.get === 'function') {
    return {
      origin: headers.get('origin') ?? '',
      token: headers.get('x-companion-session-token') ?? '',
    };
  }

  return {
    origin: String(headers.origin ?? headers.Origin ?? ''),
    token: String(headers['x-companion-session-token'] ?? headers['X-Companion-Session-Token'] ?? ''),
  };
}

export function isLiveOpenAiAuthorized(options = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return { allowed: false, reason: 'Companion insight service is unavailable; protected guidance returned.' };

  const expectedToken = options.companionToken ?? process.env.COMPANION_API_TOKEN;
  const tokenGateRequired =
    options.companionAuthRequired === true ||
    (options.companionAuthRequired !== false && options.companionToken !== undefined) ||
    process.env.COMPANION_AUTH_REQUIRED === 'true';
  if (!tokenGateRequired) {
    return { allowed: true, reason: '' };
  }
  if (!expectedToken) {
    return { allowed: false, reason: 'Live OpenAI mode is disabled until COMPANION_API_TOKEN is configured server-side.' };
  }

  const headers = normalizeHeaders(options.headers);
  if (headers.token !== expectedToken) {
    return { allowed: false, reason: 'Live insight mode requires an authorized session token; protected guidance returned.' };
  }

  return { allowed: true, reason: '' };
}

export async function callOpenAiResponses(payload, options = {}) {
  const apiKey = options.apiKey;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const model = options.model || DEFAULT_MODEL;

  if (!apiKey) {
    return buildMockCompanionResponse(payload);
  }

  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is not available in this runtime');
  }

  const response = await fetchImpl(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 260,
      instructions:
        'You are Second Brain, a Thailand-origin cognitive wellness product. Write concise, safe, non-diagnostic support copy for human review. Never diagnose or imply medical certainty.',
      input: buildCompanionPrompt(payload),
    }),
  });

  if (!response.ok) {
    const message = await safeReadText(response);
    throw new Error(`OpenAI Responses API returned ${response.status}: ${message.slice(0, 240)}`);
  }

  const json = await response.json();
  const companionNote = extractResponseText(json) ||
    'OpenAI returned a response without output text; use the protected continuity note for this care step.';

  return {
    ok: true,
    mode: 'openai',
    source: 'openai-responses-api',
    model,
    responseId: typeof json.id === 'string' ? json.id : undefined,
    generatedAt: new Date().toISOString(),
    companionNote,
    nextBestAction: 'Review the generated support note, then compare it with the structured signal rail before sharing any summary.',
    safetyBoundary: 'Server-side Responses API call with store=false. No browser API key exposure. Non-diagnostic human-review copy only.',
    rubricEvidence: rubricEvidenceFor(payload),
  };
}


export function normalizeSecondBrainExpressBaseUrl(baseUrl = '') {
  return String(baseUrl || '')
    .trim()
    .replace(/\/+docs\/?$/i, '')
    .replace(/\/+$/, '');
}

export function buildSecondBrainExpressPayload(payload, options = {}) {
  return {
    personaId: payload.personaId,
    sessionId: options.sessionId || `${payload.personaId}-companion-session`,
    userInput: payload.userLine,
    context: options.context || 'concerning_trend',
    model: options.model || DEFAULT_MODEL,
    supportContext: {
      personaName: payload.personaName,
      cueLevel: payload.cueLevel,
      assistantLine: payload.assistantLine,
      helper: payload.helper,
      signal: payload.signal,
    },
  };
}

export function normalizeSecondBrainExpressResponse(json, payload, model) {
  const companionNote = String(json?.reply ?? json?.companionNote ?? json?.message ?? '').trim();
  const helper = String(json?.helper ?? json?.nextBestAction ?? '').trim();
  return {
    ok: true,
    mode: 'express',
    source: 'second-brain-express',
    model,
    generatedAt: new Date().toISOString(),
    companionNote: companionNote || `${payload.personaName}'s support moment is ready for human review.`,
    nextBestAction: helper || 'Review the generated support note, then compare it with the structured signal rail before sharing any summary.',
    safetyBoundary: 'Server-side companion service. No browser API key exposure. Non-diagnostic human-review copy only.',
    rubricEvidence: rubricEvidenceFor(payload),
    remoteCueLevel: typeof json?.cueLevel === 'string' ? json.cueLevel : undefined,
    remoteSignals: json?.signals && typeof json.signals === 'object' ? json.signals : undefined,
  };
}

export async function callSecondBrainExpress(payload, options = {}) {
  const baseUrl = normalizeSecondBrainExpressBaseUrl(options.remoteApiBaseUrl ?? process.env.SECOND_BRAIN_API_BASE_URL);
  const token = options.remoteApiToken ?? process.env.SECOND_BRAIN_API_TOKEN ?? process.env.BACKEND_BEARER_TOKEN;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const model = options.model || DEFAULT_MODEL;

  if (!baseUrl) {
    throw new Error('Second Brain Express base URL is not configured');
  }
  if (!token) {
    throw new Error('Second Brain Express bearer token is not configured');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is not available in this runtime');
  }

  const response = await fetchImpl(`${baseUrl}/v1/companion`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildSecondBrainExpressPayload(payload, options)),
  });

  if (!response.ok) {
    const message = await safeReadText(response);
    throw new Error(`Second Brain Express returned ${response.status}: ${message.slice(0, 240)}`);
  }

  return normalizeSecondBrainExpressResponse(await response.json(), payload, model);
}

export async function checkSecondBrainExpressStatus(options = {}) {
  const baseUrl = normalizeSecondBrainExpressBaseUrl(options.remoteApiBaseUrl ?? process.env.SECOND_BRAIN_API_BASE_URL);
  const token = options.remoteApiToken ?? process.env.SECOND_BRAIN_API_TOKEN ?? process.env.BACKEND_BEARER_TOKEN;
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const model = options.model || process.env.SECOND_BRAIN_MODEL || process.env.OPENAI_MODEL || DEFAULT_MODEL;

  if (!baseUrl) {
    return {
      ok: false,
      reachable: false,
      companionReady: false,
      baseUrl: '',
      model,
      reason: 'Second Brain Express base URL is not configured',
    };
  }
  if (typeof fetchImpl !== 'function') {
    return {
      ok: false,
      reachable: false,
      companionReady: false,
      baseUrl,
      model,
      reason: 'fetch is not available in this runtime',
    };
  }

  try {
    const response = await fetchImpl(`${baseUrl}/health`, { method: 'GET' });
    const json = await response.json();
    const reachable = response.ok && json?.ok !== false;
    const companionReady = reachable && (Boolean(token) || Boolean(apiKey));
    const activeProvider = token ? 'second-brain-express' : apiKey ? 'openai-responses-api' : 'unconfigured';
    return {
      ok: reachable,
      reachable,
      companionReady,
      activeProvider,
      service: typeof json?.service === 'string' ? json.service : 'second-brain-express',
      authMode: typeof json?.authMode === 'string' ? json.authMode : 'bearer',
      hasOpenAiKey: Boolean(json?.hasOpenAiKey),
      realtimeReady: Boolean(json?.realtimeReady),
      realtimePath: typeof json?.realtimePath === 'string' ? json.realtimePath : undefined,
      baseUrl,
      model,
      reason: token
        ? ''
        : apiKey
          ? 'Second Brain Express bearer token is not configured; using direct OpenAI Responses API.'
          : 'Second Brain Express bearer token is not configured',
    };
  } catch (error) {
    return {
      ok: false,
      reachable: false,
      companionReady: false,
      baseUrl,
      model,
      reason: error instanceof Error ? error.message : 'Unable to reach Second Brain Express health endpoint',
    };
  }
}

export function extractResponseText(json) {
  if (typeof json?.output_text === 'string' && json.output_text.trim().length > 0) {
    return json.output_text.trim();
  }

  const parts = Array.isArray(json?.output)
    ? json.output.flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    : [];

  const text = parts
    .map((part) => {
      if (part?.type === 'output_text' && typeof part.text === 'string') return part.text;
      if (part?.type === 'text' && typeof part.text === 'string') return part.text;
      return '';
    })
    .filter(Boolean)
    .join('\n')
    .trim();

  return text.length > 0 ? text : '';
}

async function safeReadText(response) {
  try {
    return await response.text();
  } catch {
    return 'Unable to read error body';
  }
}

export function safeProviderFailureReason(error) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = message.toLowerCase();
  if (lower.includes('insufficient_quota') || lower.includes('exceeded your current quota') || lower.includes('quota')) {
    return 'OpenAI quota is unavailable for the configured server key; protected guidance returned.';
  }
  if (lower.includes('401') || lower.includes('unauthorized')) {
    return 'Second Brain Express rejected the bearer token; protected guidance returned.';
  }
  if (lower.includes('bearer token is not configured')) {
    return 'Second Brain Express bearer token is not configured; protected guidance returned.';
  }
  return 'Companion insight service request failed; protected guidance returned. Check server logs for provider details.';
}

export async function createCompanionResponse(rawPayload, options = {}) {
  const payload = validateCompanionPayload(rawPayload);
  const selectedModel = options.model ?? process.env.SECOND_BRAIN_MODEL ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const remoteApiBaseUrl = options.remoteApiBaseUrl ?? process.env.SECOND_BRAIN_API_BASE_URL;
  const remoteApiToken = options.remoteApiToken ?? process.env.SECOND_BRAIN_API_TOKEN ?? process.env.BACKEND_BEARER_TOKEN;

  if (remoteApiBaseUrl && remoteApiToken) {
    try {
      return await callSecondBrainExpress(payload, {
        remoteApiBaseUrl,
        remoteApiToken,
        model: selectedModel,
        fetchImpl: options.fetchImpl,
        sessionId: rawPayload.sessionId,
        context: rawPayload.context,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`[companion-api] Protected guidance used: ${error.message}`);
      }
      return buildMockCompanionResponse(
        payload,
        'provider-continuity',
        safeProviderFailureReason(error),
      );
    }
  }

  const liveAuth = isLiveOpenAiAuthorized(options);
  const configuredApiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!liveAuth.allowed) {
    const source = configuredApiKey ? 'authorized-continuity' : 'protected-continuity';
    return buildMockCompanionResponse(payload, source, liveAuth.reason);
  }

  try {
    return await callOpenAiResponses(payload, {
      apiKey: configuredApiKey,
      model: selectedModel,
      fetchImpl: options.fetchImpl,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`[companion-api] Protected guidance used: ${error.message}`);
    }
    return buildMockCompanionResponse(
      payload,
      'provider-continuity',
      safeProviderFailureReason(error),
    );
  }
}

export async function readJsonBody(req, maxBytes = MAX_BODY_BYTES) {
  const contentLength = Number(req.headers?.['content-length'] ?? req.headers?.['Content-Length'] ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new CompanionRequestError('Request body is too large.', [`body must be ${maxBytes} bytes or fewer`], 413);
  }

  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    const bodyBytes = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
    if (bodyBytes > maxBytes) {
      throw new CompanionRequestError('Request body is too large.', [`body must be ${maxBytes} bytes or fewer`], 413);
    }
    return req.body;
  }
  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf8') > maxBytes) {
      throw new CompanionRequestError('Request body is too large.', [`body must be ${maxBytes} bytes or fewer`], 413);
    }
    return JSON.parse(req.body);
  }

  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > maxBytes) {
      throw new CompanionRequestError('Request body is too large.', [`body must be ${maxBytes} bytes or fewer`], 413);
    }
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export function resolveAllowedOrigins(env = process.env) {
  const configured = env.CORS_ALLOW_ORIGIN;
  if (configured) {
    return configured
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin && origin !== '*');
  }
  if (env.NODE_ENV !== 'production') {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }
  return [];
}

export function applyCors(req, res, env = process.env) {
  const origin = req.headers?.origin ?? '';
  const allowedOrigins = resolveAllowedOrigins(env);
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Companion-Session-Token');
}

export function createRateLimitKey(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const forwardedIp = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : '';
  return forwardedIp || req.socket?.remoteAddress || 'unknown';
}

export function checkRateLimit(req, now = Date.now()) {
  const key = createRateLimitKey(req);
  const windowMs = 60_000;
  const existing = rateLimitBuckets.get(key);
  if (!existing || now - existing.startedAt > windowMs) {
    rateLimitBuckets.set(key, { count: 1, startedAt: now });
    return;
  }
  existing.count += 1;
  if (existing.count > MAX_REQUESTS_PER_MINUTE) {
    throw new CompanionRequestError('Too many companion requests.', ['try again in a minute'], 429);
  }
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function methodNotAllowed(res) {
  res.setHeader('Allow', 'POST, OPTIONS');
  sendJson(res, 405, { ok: false, error: 'Method not allowed' });
}

export function resetRateLimitForTests() {
  rateLimitBuckets.clear();
}

export { DEFAULT_MODEL, MAX_BODY_BYTES, MAX_REQUESTS_PER_MINUTE, OPENAI_RESPONSES_URL };
