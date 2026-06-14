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
ease-app/
├─ server.js        # serves the app + POST /api/parse (Anthropic proxy)
├─ package.json
├─ .replit          # Replit run/deploy config
└─ public/
   └─ index.html    # the Ease app (wired to /api/parse via a <meta> tag)
```

Everything sits at the repo root so hosts like Replit deploy it directly — no
subfolder to configure.

## Deploy: GitHub → Replit (recommended)

Push-button updates: change code, `git push`, Replit redeploys.

1. **Import into Replit** — Replit → **Create** → **Import from GitHub** → pick
   this repo.
2. **Add your key** — open **Secrets** (lock icon) and add
   `ANTHROPIC_API_KEY = sk-ant-...` *(optional: `ANTHROPIC_MODEL`)*.
3. **Run** — press **Run**; the included `.replit` installs Express and starts
   the server.
4. **Deploy** — click **Deploy** → Autoscale → you get a permanent public URL.
   That's your live link.
5. **Iterate** — each future change is just `git commit` + `git push`; Replit
   redeploys automatically.

If a Repl ever shows "no workflow configured" or "express missing," open the
**Shell** and run `npm install && npm start` once to install deps and boot.

## Run locally

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start      # http://localhost:3000
```

Set `ANTHROPIC_MODEL` to override the default fast Haiku model.

## Other hosts

- **Any Node host (Render, Railway, Fly, a VPS):** set `ANTHROPIC_API_KEY` as an
  env var in the dashboard and point the start command at `npm start`.
- **Static only (GitHub Pages, Netlify drop):** publish just `public/index.html`
  (rename to `index.html`). No server, no key — runs on the offline parser.
  Voice still works over HTTPS; multi-item AI sorting falls back to keywords.
- **Lovable / Supabase:** recreate `/api/parse` as a Supabase Edge Function with
  the same logic as `server.js`, then point the `<meta name="ease-parse-endpoint">`
  in `index.html` at that function's URL.

## Notes

- **Never put your API key in the browser.** It belongs only in server env vars /
  Secrets. This setup keeps it server-side.
- **Voice** uses the browser's built-in speech recognition: best in Chrome/Edge,
  requires HTTPS and mic permission. For universal cross-browser voice later,
  swap in a server-side audio model.
- **Data** is stored per-browser in `localStorage` (no database). Clearing site
  data resets tasks. Add a DB when you want multi-device sync.
- **Model/latency:** defaults to a fast Haiku model. The app shows parsed tasks
  instantly from the offline parser, then upgrades them when the AI responds, so
  there's no perceived wait.
