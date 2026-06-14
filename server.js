// Ease — minimal hosting server with a secure Anthropic proxy.
// Serves the static app from /public and exposes POST /api/parse so your
// API key stays on the server (never shipped to the browser).

const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = process.env.ANTHROPIC_API_KEY;            // set this in Replit "Secrets"
const MODEL   = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5'; // fast + cheap; override if you like

const CATS = ['Home','Work','Ideas','Medical','Fitness','Groceries','Family'];

// NOTE: keep this prompt in sync with PARSE_PROMPT in public/index.html (the
// in-workspace fallback). Same rules, same output schema.
const prompt = (today, note) =>
`Today is ${today}. The note below is raw spoken or typed input and may be messy. Turn it into a clean JSON array of to-do tasks.

Rules:
- Clean the speech: remove filler ("um", "uh", "like", "you know") and obvious transcription noise. Do not invent tasks that were not said.
- Honor verbal corrections: if the speaker retracts or changes something ("scratch that", "no wait", "actually make it...", "I mean..."), apply the correction and drop the retracted part.
- Write each task as a short imperative title, e.g. "Call dentist", "Buy milk". No filler, no first-person preamble ("I need to", "I was thinking").
- Split run-ons and lists (groceries, errands, multiple intents) into separate tasks.
- categories: assign one or more best-fit categories per task from this exact list, using the exact strings: ${CATS.join(', ')}. Leave categories empty ONLY if none genuinely fit.
- due = YYYY-MM-DD only if a day is implied; resolve relative dates ("friday", "tomorrow", "next week") against today's date. Else null.
- time = HH:MM (24-hour) only if a time is stated, else null. Attach a time to the specific task it was said for, not all of them.
- recurring = Daily, Weekly, or Monthly if implied ("every monday" -> Weekly), else null.
- No em dashes anywhere.

Output ONLY a JSON array, no prose, like:
[{"text":"","categories":[],"due":null,"time":null,"recurring":null}]

Examples:
Input: "um grab milk and uh eggs, scratch that just milk"
Output: [{"text":"Buy milk","categories":["Groceries"],"due":null,"time":null,"recurring":null}]
Input: "i was thinking call the dentist at 3 and i should hit the gym every monday"
Output: [{"text":"Call dentist","categories":["Medical"],"due":null,"time":"15:00","recurring":null},{"text":"Go to the gym","categories":["Fitness"],"due":null,"time":null,"recurring":"Weekly"}]

Note: "${note}"`;

function extractJsonArray(s){
  if (!s) return null;
  let t = String(s).trim();
  const fence = t.match(/```(?:json)?([\s\S]*?)```/i); if (fence) t = fence[1].trim();
  const a = t.indexOf('['), b = t.lastIndexOf(']');
  if (a !== -1 && b !== -1) t = t.slice(a, b + 1);
  try { return JSON.parse(t); } catch (e) { return null; }
}

app.post('/api/parse', async (req, res) => {
  const { input, today } = req.body || {};
  if (!input || typeof input !== 'string') return res.status(400).json({ error: 'missing input' });
  if (!API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt(today || new Date().toISOString().slice(0,10), input) }],
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: 'anthropic error', detail });
    }
    const data = await r.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    const arr = extractJsonArray(text);
    if (!Array.isArray(arr)) return res.status(502).json({ error: 'could not parse model output', raw: text });
    return res.json(arr);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Ease running on http://localhost:${PORT}`));
