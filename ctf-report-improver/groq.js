'use strict';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// Models Groq has retired, remapped so older configs keep working.
const LEGACY_MODELS = {
  'mixtral-8x7b-32768': DEFAULT_MODEL,
  'llama2-70b-4096': DEFAULT_MODEL,
  'llama2-70b': DEFAULT_MODEL,
  'llama3-70b-8192': DEFAULT_MODEL,
  'llama3-8b-8192': 'llama-3.1-8b-instant',
};

const MAX_RETRIES = 4;
const MAX_CONTENT_CHARS = 100_000;

let lastRateLimit = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getRateLimitInfo() {
  return lastRateLimit;
}

function captureRateLimit(headers) {
  const num = (name) => {
    const value = headers.get(name);
    return value == null || value === '' ? null : Number(value);
  };
  const info = {
    limitRequests: num('x-ratelimit-limit-requests'),
    remainingRequests: num('x-ratelimit-remaining-requests'),
    limitTokens: num('x-ratelimit-limit-tokens'),
    remainingTokens: num('x-ratelimit-remaining-tokens'),
    capturedAt: new Date().toISOString(),
  };
  if (info.limitRequests != null || info.limitTokens != null) lastRateLimit = info;
}

function rateLimitWarning() {
  if (!lastRateLimit) return null;
  const budgets = [
    ['requests', lastRateLimit.remainingRequests, lastRateLimit.limitRequests],
    ['tokens', lastRateLimit.remainingTokens, lastRateLimit.limitTokens],
  ];
  for (const [kind, remaining, limit] of budgets) {
    if (limit && remaining != null && remaining / limit < 0.15) {
      return `Approaching the Groq free-tier ${kind} limit (${remaining} of ${limit} left) — requests may start hitting 429s.`;
    }
  }
  return null;
}

function retryDelayMs(response, attempt) {
  const retryAfter = Number(response?.headers?.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  return 1000 * 2 ** attempt + Math.random() * 500;
}

const BASE_PROMPT = `You are an expert editor of CTF (capture-the-flag) writeups and penetration-test reports.
Rewrite the markdown report you receive into a clearer, better-structured, more professional document.

Hard rules:
- Preserve every technical fact: payloads, commands, tool output, hashes, addresses, and flags stay exactly as written. Never invent findings.
- Keep every image reference intact, with its exact relative path (e.g. ![screenshot](img/step1.png)). Do not drop, rename, or rewrite image paths.
- Keep commands and code inside fenced code blocks, with a language hint where it is obvious.
- Use a clean heading hierarchy, short paragraphs, and lists where they genuinely help.
- Fix grammar, spelling, and awkward phrasing without changing meaning.
- Output ONLY the improved markdown document: no preamble, no commentary, and do not wrap the whole document in a code fence.`;

function buildSystemPrompt(settings) {
  const parts = [BASE_PROMPT];

  const extras = [];
  if (settings.addSummary) {
    extras.push('- Open the document with a short "## Summary" section: target, category, and outcome.');
  }
  if (settings.includeCvss) {
    extras.push('- For each concrete vulnerability exploited, add an estimated CVSS 3.1 vector and score in the section that describes it, clearly marked as an estimate.');
  }
  if (settings.technicalDepth) {
    extras.push('- Write for a skilled security audience: prefer technical depth over beginner-level explanation.');
  }
  if (extras.length) parts.push(`Additional requirements:\n${extras.join('\n')}`);

  if (settings.category) parts.push(`The report is from the "${settings.category}" CTF category.`);

  const custom = (settings.customInstructions || '').trim();
  if (custom) {
    parts.push(
      'User\'s custom instructions — follow them, and where they conflict with the style guidance above they win ' +
        `(the hard rules about preserving facts and image paths always apply):\n${custom}`
    );
  }

  return parts.join('\n\n');
}

function buildUserPrompt({ content, filePath, siblingFiles = [] }) {
  const listing = siblingFiles.length ? siblingFiles.map((f) => `- ${f}`).join('\n') : '(none)';
  return `Other files shipped alongside this report (images referenced in the markdown live at these paths):\n${listing}\n\n--- ORIGINAL REPORT: ${filePath} ---\n\n${content}`;
}

function stripWrappingFence(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:markdown|md)?\n([\s\S]*)\n```$/);
  return match ? match[1] : trimmed;
}

async function callGroq({ messages, model }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  let activeModel = model;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let response;
    try {
      response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: activeModel, messages, temperature: 0.3 }),
      });
    } catch (err) {
      lastError = new Error(`Could not reach the Groq API: ${err.message}`);
      await sleep(retryDelayMs(null, attempt));
      continue;
    }

    captureRateLimit(response.headers);

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Groq returned an empty completion.');
      return { content, model: activeModel };
    }

    const body = await response.text();

    // The requested model may have been retired since the dropdown was built.
    if (
      (response.status === 400 || response.status === 404) &&
      /decommission|does not exist|not found|invalid model/i.test(body) &&
      activeModel !== DEFAULT_MODEL
    ) {
      activeModel = DEFAULT_MODEL;
      continue;
    }

    if (response.status === 429 || response.status >= 500) {
      lastError = new Error(
        `Groq API ${response.status} (${response.status === 429 ? 'rate limited' : 'server error'}) after ${attempt + 1} attempt(s)`
      );
      await sleep(retryDelayMs(response, attempt));
      continue;
    }

    let detail = body;
    try {
      detail = JSON.parse(body).error?.message || body;
    } catch {
      /* keep raw body */
    }
    throw new Error(`Groq API ${response.status}: ${detail}`);
  }

  throw lastError || new Error('Groq API request failed after retries.');
}

async function improveMarkdown({ content, filePath, siblingFiles, settings = {} }) {
  const requested = settings.model || process.env.GROQ_MODEL || DEFAULT_MODEL;
  const model = LEGACY_MODELS[requested] || requested;

  const truncated = content.length > MAX_CONTENT_CHARS;
  const body = truncated ? content.slice(0, MAX_CONTENT_CHARS) : content;

  const messages = [
    { role: 'system', content: buildSystemPrompt(settings) },
    { role: 'user', content: buildUserPrompt({ content: body, filePath, siblingFiles }) },
  ];

  const result = await callGroq({ messages, model });

  const warnings = [rateLimitWarning()];
  if (truncated) warnings.push(`${filePath}: file was truncated to ${MAX_CONTENT_CHARS} characters before processing.`);
  if (result.model !== requested) warnings.push(`Model "${requested}" was retired by Groq — used "${result.model}" instead.`);

  return {
    content: stripWrappingFence(result.content),
    model: result.model,
    warnings: warnings.filter(Boolean),
  };
}

module.exports = { improveMarkdown, getRateLimitInfo, DEFAULT_MODEL };
