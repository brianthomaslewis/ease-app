# Ease

**Simple, crisp task management.** Capture tasks by typing or speaking; an AI
sorts them into categories, due dates, times, and recurrence — and the app keeps
working even with no key or no internet.

## How it works

Ease is a single-page React app backed by a tiny Express server. The server
exposes `POST /api/parse`, which proxies note-parsing to the Anthropic Messages
API so your API key stays server-side and never reaches the browser.

Parsing degrades gracefully, in order:

1. **Your backend** (`/api/parse`) → real AI sorting.
2. **In-workspace helper** → only inside the Anthropic preview.
3. **Offline keyword parser** → always works, even with no key or internet.

So the app runs before you add a key; you just get the simpler offline parser.

## Project layout

```
deploy/
├─ server.js        # serves the app + POST /api/parse (Anthropic proxy)
├─ package.json
├─ .replit          # Replit run/deploy config
└─ public/
   └─ index.html    # the Ease app (wired to /api/parse via a <meta> tag)
```

## Run locally

```bash
cd deploy
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start      # http://localhost:3000
```

Set `ANTHROPIC_MODEL` to override the default fast Haiku model.

See [`deploy/README.md`](deploy/README.md) for full deployment options
(Replit, Render/Railway/Fly, static-only, and Lovable/Supabase).

## Notes

- **Never put your API key in the browser.** It belongs only in server env vars
  / Secrets. This setup keeps it server-side.
- **Voice** uses the browser's built-in speech recognition: best in Chrome/Edge,
  requires HTTPS and mic permission.
- **Data** is stored per-browser in `localStorage` (no database). Add a DB when
  you want multi-device sync.
