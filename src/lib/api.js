// ============================================================
// CLAUDE API — News search & AI headline generation
// ============================================================

const API_BASE = 'https://api.anthropic.com/v1/messages';

function getHeaders(apiKey) {
    return {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
    };
}

function parseJSON(text) {
    const clean = text.replace(/```json|```/g, '').trim();
    // Extract first JSON array or object
    const match = clean.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
}

export async function searchNews(query, apiKey) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 1000,
            tools: [{ type: 'web_search_20250305', name: 'web_search' }],
            messages: [{
                role: 'user',
                content: `Search for recent news about: "${query}". Return ONLY a JSON array (no markdown, no backticks) of 4 news items, each with: title (string, punchy headline max 12 words), source (string), summary (string, 1 sentence fact), date (string). Example: [{"title":"...","source":"...","summary":"...","date":"..."}]`,
            }],
        }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    const text = data.content?.map(i => i.text || '').join('') ?? '';
    return parseJSON(text) ?? [];
}

export async function generateHeadlines(topic, apiKey) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 500,
            messages: [{
                role: 'user',
                content: `Generate 4 viral social media poster headlines for topic: "${topic}".
Style: like Instagram pages Pubity, Bleacher Report, House of Highlights.
Rules: ALL CAPS, max 8 words each, punchy, factual, no emojis.
Return ONLY JSON array of strings. Example: ["HEADLINE ONE","HEADLINE TWO","HEADLINE THREE","HEADLINE FOUR"]`,
            }],
        }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    const text = data.content?.map(i => i.text || '').join('') ?? '';
    return parseJSON(text) ?? [];
}
