#!/usr/bin/env bash
# Trigger a Render deploy of the backend.
#
# Two ways in, preferred first:
#
#   .secrets/render-api-key    an API key. Starts the deploy and can then ask
#                              Render whether *that* deploy finished.
#   .secrets/render-deploy-hook  a hook URL. Starts a deploy and tells you
#                              nothing else about it.
#
# Both are secrets - anyone holding either can deploy this service - so they
# live in .secrets/, which is gitignored, and never in this file. Rotate from
# Render > clardentity-backend > Settings.
#
# Why the API key matters for --wait: Render builds the new image and only
# swaps traffic to it on success, so /health answers 200 from the *old*
# instance for the entire build. The hook-only version of this script polled
# that endpoint and therefore declared victory about one second after it
# started, every time, including for deploys that went on to fail. Polling
# the deploy's own status is the only honest answer.
#
# Usage: scripts/deploy-backend.sh [--wait]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_KEY_FILE="$ROOT/.secrets/render-api-key"
HOOK_FILE="$ROOT/.secrets/render-deploy-hook"
SERVICE="srv-d9jm8vb7uimc739rr0pg"
API="https://api.render.com/v1"
WAIT="${1:-}"

read_secret() { tr -d '[:space:]' < "$1"; }

if [[ -r "$API_KEY_FILE" ]]; then
  KEY="$(read_secret "$API_KEY_FILE")"

  echo "Triggering Render deploy..."
  DEPLOY="$(curl -sS --fail-with-body -X POST "$API/services/$SERVICE/deploys" \
    -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{}')" || {
    echo "Render refused the deploy. The API key may have been rotated." >&2
    exit 1
  }
  DEPLOY_ID="$(printf '%s' "$DEPLOY" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
  echo "Started $DEPLOY_ID"

  [[ "$WAIT" == "--wait" ]] || exit 0

  echo "Waiting for $DEPLOY_ID to go live..."
  for _ in $(seq 1 90); do
    sleep 10
    STATUS="$(curl -sS --max-time 20 "$API/services/$SERVICE/deploys/$DEPLOY_ID" \
      -H "Authorization: Bearer $KEY" \
      | python3 -c 'import json,sys; print(json.load(sys.stdin).get("status","?"))' || echo '?')"
    printf '  %s -> %s\n' "$(date +%H:%M:%S)" "$STATUS"
    case "$STATUS" in
      live)
        echo "Deployed. $DEPLOY_ID is serving."
        exit 0 ;;
      build_failed|update_failed|pre_deploy_failed|canceled|deactivated)
        echo "Deploy ended as '$STATUS'. Logs: https://dashboard.render.com/web/$SERVICE/deploys/$DEPLOY_ID" >&2
        exit 1 ;;
    esac
  done
  echo "Still not live after 15 minutes; check the Render dashboard." >&2
  exit 1
fi

if [[ ! -r "$HOOK_FILE" ]]; then
  echo "No credentials: expected $API_KEY_FILE or $HOOK_FILE" >&2
  echo "Get an API key from Render > Account Settings > API Keys." >&2
  exit 1
fi

echo "Triggering Render deploy via hook (no API key, so --wait is unavailable)..."
RESPONSE="$(curl -sS --fail-with-body -X POST "$(read_secret "$HOOK_FILE")")" || {
  echo "Render refused the deploy hook. It may have been rotated." >&2
  exit 1
}
echo "$RESPONSE"
if [[ "$WAIT" == "--wait" ]]; then
  echo "Cannot wait without an API key: /health answers from the old instance" >&2
  echo "during the entire build, so it proves nothing. Watch the dashboard." >&2
fi
