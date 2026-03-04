// ============================================================
// CLAUDE API — News search & AI headline generation
// ============================================================

const API_BASE = 'https://api.anthropic.com/v1/messages';

// Models
const MODEL_SEARCH = 'claude-opus-4-5';      // supports web_search tool
const MODEL_TEXT = 'claude-haiku-4-5';     // fast & cheap for headline gen

function getHeaders(apiKey) {
    return {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
    };
}

// Extract all text blocks from the response (skips tool_use / tool_result blocks)
function extractText(content = []) {
    return content
        .filter(block => block.type === 'text')
        .map(block => block.text || '')
        .join('\n');
}

// Robustly pull the first JSON array out of a string
function parseJSONArray(raw) {
    if (!raw) return null;
    // Strip markdown fences
    const clean = raw.replace(/```(?:json)?/gi, '').trim();
    // Find the outermost [ ... ]
    const start = clean.indexOf('[');
    if (start === -1) return null;
    // Walk to find matching close bracket
    let depth = 0, end = -1;
    for (let i = start; i < clean.length; i++) {
        if (clean[i] === '[') depth++;
        else if (clean[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) return null;
    try { return JSON.parse(clean.slice(start, end + 1)); } catch { return null; }
}

export async function searchNews(query, apiKey) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({
            model: MODEL_SEARCH,
            max_tokens: 2000,
            tools: [{ type: 'web_search_20250305', name: 'web_search' }],
            messages: [{
                role: 'user',
                content: `Search the web for recent news about: "${query}".

After searching, respond with ONLY a raw JSON array (no markdown, no backticks, no explanation) like this:
[{"title":"...","source":"...","summary":"...","date":"..."},...]

- 4 items max
- title: punchy, max 12 words, ALL CAPS
- source: news outlet name
- summary: 1 factual sentence
- date: e.g. "March 2025"`,
            }],
        }),
    });

    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = extractText(data.content);
    const parsed = parseJSONArray(text);

    if (!parsed || parsed.length === 0) {
        throw new Error('No results parsed — Claude response was empty or malformed');
    }

    return parsed;
}

export async function generateHeadlines(topic, apiKey) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({
            model: MODEL_TEXT,
            max_tokens: 600,
            messages: [{
                role: 'user',
                content: `Generate 4 viral social media poster headlines for: "${topic}"
Style: Pubity / Bleacher Report / House of Highlights
Rules: ALL CAPS, max 8 words, punchy, factual, no emojis
Output ONLY a raw JSON array of strings, no markdown:
["HEADLINE ONE","HEADLINE TWO","HEADLINE THREE","HEADLINE FOUR"]`,
            }],
        }),
    });

    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = extractText(data.content);
    return parseJSONArray(text) ?? [];
}
