#!/usr/bin/env bash
# Smoke-test the /api/parse AI prompt with messy spoken-style inputs.
#
# Usage:
#   ANTHROPIC_API_KEY=sk-ant-... ./scripts/test-parse.sh
#
# Boots the server on a free port, sends a few noisy inputs, prints the parsed
# JSON, then shuts the server down. Check that titles are clean, run-ons are
# split, corrections are honored, and categories are assigned.

set -euo pipefail

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ERROR: set ANTHROPIC_API_KEY first." >&2
  exit 1
fi

PORT="${PORT:-5099}"
cd "$(dirname "$0")/.."

ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" PORT="$PORT" node server.js >/tmp/ease-test.log 2>&1 &
SRV=$!
trap 'kill "$SRV" 2>/dev/null || true' EXIT

# wait for boot
for _ in $(seq 1 20); do
  curl -fsS -o /dev/null "http://localhost:$PORT/" 2>/dev/null && break
  sleep 0.25
done

today="$(date +%F)"

probe() {
  echo "INPUT:  $1"
  echo -n "OUTPUT: "
  curl -fsS -X POST "http://localhost:$PORT/api/parse" \
    -H 'content-type: application/json' \
    -d "{\"input\": $(printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'), \"today\": \"$today\"}"
  echo; echo
}

probe "um grab milk and uh eggs, scratch that just milk"
probe "i was thinking maybe call the dentist friday at 3 and i should hit the gym every monday"
probe "you know, pay the electric bill next week and like, plan mom's birthday, no wait dad's birthday"
