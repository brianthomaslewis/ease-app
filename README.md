# Ease

Crisp task management. Type or speak a task and an AI sorts it into categories, due dates, times, and recurrence. It still works with no API key and no internet.

## How it works

Ease is a single-page React app with a small Express server behind it. The server exposes one endpoint, `POST /api/parse`, which forwards note-parsing to the Anthropic Messages API. Your API key stays on the server and never reaches the browser.

Parsing has three tiers, tried in order:

1. Your backend (`/api/parse`), which does the real AI sorting.
2. An in-workspace helper, available only inside the Anthropic preview.
3. An offline keyword parser that always works, key or not, internet or not.

That last tier is why the app runs before you add a key. You get the simpler offline parser until a key is in place.

## Project layout

```
ease-app/
├─ server.js        # serves the app + POST /api/parse (Anthropic proxy)
├─ package.json
├─ .replit          # Replit run/deploy config
└─ public/
   └─ index.html    # the Ease app (wired to /api/parse via a <meta> tag)
```

Everything lives at the repo root, so hosts like Replit deploy it directly with no subfolder to configure.

## Deploy: GitHub to Replit (recommended)

Once this is set up, updates are just `git push` and Replit redeploys.

1. Import into Replit: **Create** → **Import from GitHub** → pick this repo.
2. Add your key: open **Secrets** (the lock icon) and set `ANTHROPIC_API_KEY = sk-ant-...`. You can also set `ANTHROPIC_MODEL` if you want a different model.
3. Press **Run**. The bundled `.replit` installs Express and starts the server.
4. Click **Deploy** → Autoscale. You get a permanent public URL, which is your live link.
5. After that, every change is `git commit` + `git push` and Replit redeploys on its own.

If a Repl ever reports "no workflow configured" or "express missing", open the **Shell** and run `npm install && npm start` once to install deps and boot.

## Run locally

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start      # http://localhost:5000
```

Set `ANTHROPIC_MODEL` to override the default fast Haiku model.

## Other hosts

- Any Node host (Render, Railway, Fly, a VPS): set `ANTHROPIC_API_KEY` as an env var in the dashboard and point the start command at `npm start`.
- Static only (GitHub Pages, Netlify drop): publish just `public/index.html` (rename it to `index.html`). No server and no key, so it runs on the offline parser. Voice still works over HTTPS; multi-item AI sorting falls back to keywords.
- Lovable / Supabase: recreate `/api/parse` as a Supabase Edge Function with the same logic as `server.js`, then point `<meta name="ease-parse-endpoint">` in `index.html` at that function's URL.

## Notes

- Never put your API key in the browser. It belongs in server env vars or Secrets only. This setup keeps it server-side.
- Voice uses the browser's built-in speech recognition. It works best in Chrome and Edge and needs HTTPS plus mic permission. If you want consistent cross-browser voice later, swap in a server-side audio model.
- Data is stored per-browser in `localStorage`, with no database. Clearing site data resets your tasks. Add a DB when you want multi-device sync.
- Model and latency: the default is a fast Haiku model. The app shows parsed tasks right away from the offline parser, then upgrades them once the AI responds.
