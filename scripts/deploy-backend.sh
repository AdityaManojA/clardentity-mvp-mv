#!/usr/bin/env bash
# Trigger a Render deploy of the backend.
#
# The hook URL is a secret - anyone holding it can deploy - so it lives in
# .secrets/, which is gitignored, and never in this file. Rotate it from
# Render > clardentity-backend > Settings > Deploy Hook if it ever leaks.
#
# Usage: scripts/deploy-backend.sh [--wait]
#   --wait  poll the health endpoint until the new instance answers
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_FILE="$ROOT/.secrets/render-deploy-hook"
HEALTH="https://clardentity-backend.onrender.com/health"

if [[ ! -r "$HOOK_FILE" ]]; then
  echo "No deploy hook at $HOOK_FILE" >&2
  echo "Get one from Render > clardentity-backend > Settings > Deploy Hook." >&2
  exit 1
fi

HOOK="$(tr -d '[:space:]' < "$HOOK_FILE")"

echo "Triggering Render deploy..."
# --fail-with-body so a 401/404 is an error rather than a cheerful page of HTML.
RESPONSE="$(curl -sS --fail-with-body -X POST "$HOOK")" || {
  echo "Render refused the deploy hook. It may have been rotated." >&2
  exit 1
}
echo "$RESPONSE"

if [[ "${1:-}" == "--wait" ]]; then
  echo "Waiting for the new instance to answer ${HEALTH}..."
  # Render builds first and only swaps on success, so the old instance keeps
  # serving throughout. This is waiting for the swap, not for downtime to end.
  for _ in $(seq 1 60); do
    sleep 10
    CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$HEALTH" || true)"
    printf '  %s -> %s\n' "$(date +%H:%M:%S)" "$CODE"
    [[ "$CODE" == "200" ]] && { echo "Backend healthy."; exit 0; }
  done
  echo "Gave up waiting after 10 minutes; check the Render dashboard." >&2
  exit 1
fi
