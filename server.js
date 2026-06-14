// Ease — minimal hosting server with a secure Anthropic proxy.
// Serves the static app from /public and exposes POST /api/parse so your
// API key stays on the server (never shipped to the browser).

const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = process.env.ANTHROPIC_API_KEY;            // set this in Replit "Secrets"
const MODEL   = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest'; // fast + cheap; override if you like

const CATS = ['Home','Work','Ideas','Medical','Fitness','Groceries','Family'];

const prompt = (today, note) =>
`Today is ${today}. Convert this note into to-do tasks as a JSON array. Split lists (e.g. groceries, errands) into separate tasks. Pick 0+ categories per task from: ${CATS.join(', ')}. due = YYYY-MM-DD only if a day is implied, else null. time = HH:MM only if stated, else null. recurring = Daily/Weekly/Monthly or null. No em dashes. Output ONLY a JSON array like [{"text":"","categories":[],"due":null,"time":null,"recurring":null}]
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
