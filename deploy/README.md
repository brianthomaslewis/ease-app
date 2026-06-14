# Ease — deploy guide

A simple personal task tracker. Single-page app + a tiny server that proxies the
AI sorting to Anthropic so your API key stays secret.

```
deploy/
├─ server.js        # serves the app + POST /api/parse (Anthropic proxy)
├─ package.json
├─ .replit          # Replit run/deploy config
└─ public/
   └─ index.html    # the Ease app (wired to /api/parse via a <meta> tag)
```

The app works three ways, in order, and degrades gracefully:
1. **Your backend** (`/api/parse`) → real AI sorting. ← what this package sets up
2. In-workspace helper → only inside the Anthropic preview.
3. **Offline keyword parser** → always works, even with no internet/key.

So even before you add a key, the app runs; you just get the simpler offline parser.

---

## Option A — Replit (recommended, ~5 min)

1. Create a new Repl → **Import** → upload this `deploy` folder (or drag its files in).
2. Open the **Secrets** tool (lock icon) and add:
   - `ANTHROPIC_API_KEY` = your key (starts with `sk-ant-...`)
   - *(optional)* `ANTHROPIC_MODEL` = a model id if you want to change it
3. Press **Run**. Replit installs Express and starts the server.
4. Click **Deploy** (Autoscale is fine) to get a permanent public URL.

That URL is your live prototype. Voice works in Chrome/Edge once you allow the mic.

## Option B — Any Node host (Render, Railway, Fly, a VPS)

```bash
cd deploy
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start      # http://localhost:3000
```
Set `ANTHROPIC_API_KEY` as an environment variable in the host's dashboard and
point its start command at `npm start`.

## Option C — Static only (CodeSandbox static, GitHub Pages, Netlify drop)

Upload just `public/index.html` (rename to `index.html`). No server, no key —
the app runs on the **offline parser**. Good for a quick visual demo; voice still
works over HTTPS, but multi-item AI sorting falls back to keywords.

## Option D — Lovable

Lovable apps run on Supabase. Recreate `/api/parse` as a Supabase **Edge
Function** (same logic as `server.js`: read `ANTHROPIC_API_KEY` from function
secrets, call the Anthropic Messages API, return the JSON array), then set the
`<meta name="ease-parse-endpoint">` in `index.html` to that function's URL.

---

## Notes

- **Never put your API key in the browser / in `index.html`.** It belongs only in
  server env vars / Secrets. This setup keeps it server-side.
- **Voice** uses the browser's built-in speech recognition: best in Chrome/Edge,
  requires HTTPS (all the hosts above provide it) and mic permission. For
  universal cross-browser voice later, swap in a server-side audio model.
- **Data** is stored per-browser in localStorage (no database). Clearing site
  data resets tasks. Add a DB when you want multi-device sync.
- **Model/latency:** defaults to a fast Haiku model. The app shows parsed tasks
  instantly from the offline parser, then upgrades them when the AI responds, so
  there's no perceived wait.
