# AI speech cleanup + auto-categorization

**Date:** 2026-06-14
**Status:** Approved

## Problem

Voice and typed input is parsed by Claude via `POST /api/parse`. The parse prompt
only says "convert this note into tasks, pick categories." As a result:

- Spoken disfluencies survive in task text ("um", "uh", "like", "you know").
- Verbal corrections are not honored ("scratch that", "no wait", "actually make it…").
- Categorization underperforms — tasks land with no category.

The AI path is correctly wired (`onCaptureDrafts` → `parseTasks` → `/api/parse`,
with an offline `heuristic()` placeholder shown instantly and upgraded when the AI
responds). This is a prompt-quality problem, not a wiring problem.

## Goal

Make the single Claude call produce clean, well-categorized tasks from messy
spoken input.

## Approach

Enhanced single prompt + 2 worked few-shot examples (chosen over a two-stage
clean→extract pipeline, which doubles latency/cost for no real gain on Haiku 4.5).

The rewritten prompt instructs the model to:

1. **Clean speech** — drop filler (um, uh, like, you know) and transcription noise.
2. **Obey verbal corrections** — "scratch that", "no wait", "actually make it…",
   "I mean…" apply the correction and discard the retracted portion.
3. **Crisp imperative titles** — "i was thinking i should call the dentist friday"
   → `Call dentist`.
4. **Smart split** — break run-ons into separate tasks; infer `due` / `time` /
   `recurring` from loose phrasing ("every monday" → Weekly; "friday at 3" → date + 15:00).
5. **Categorize confidently** — assign 1+ best-fit category from the fixed list;
   leave `categories` empty *only* when none genuinely fit.

Two short few-shot examples are embedded to lock in the "scratch that" and
run-on-splitting behaviors.

## Scope

**In scope**
- Rewrite the parse prompt in `server.js` (the real `/api/parse` call).
- Mirror the same prompt in `index.html` `PARSE_PROMPT` (the in-workspace fallback),
  and add a cross-reference comment so the two copies don't drift.
- Confirm the running model is `claude-haiku-4-5` (a retired model 502s and silently
  falls back to the offline parser — same symptoms).

**Out of scope (YAGNI)**
- Offline `heuristic()` parser — unchanged; it's only the instant placeholder.
- Output schema — unchanged (`text, categories, due, time, recurring`), so
  `normalizeDraft` / `extractJsonArray` and all downstream code are untouched.

## Testing

This sandbox has no API key, so verification is local:
- A small `curl` script feeds 2-3 messy spoken-style inputs to `/api/parse` and
  prints the JSON — checking for clean titles, correct splits, and assigned categories.
- User confirms behavior in the running UI.

## Risk

Low. No schema or architecture change; the failure mode (bad prompt output) is
caught by the existing `extractJsonArray` / `normalizeDraft` validation, which falls
back to the offline parser on malformed output.
