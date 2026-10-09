#!/usr/bin/env bash
# Merge UPSTREAM_URL@UPSTREAM_BRANCH into DEST_BRANCH of the checked-out repo
# and push it to origin. Never force-pushes, resets, or discards changes:
# conflicts and push rejections fail the run for manual resolution.
#
# Required env: UPSTREAM_URL, UPSTREAM_BRANCH, DEST_BRANCH
# Optional env: EXPECTED_SHA (upstream sha the reviewer approved; informational)
#               GATE_CMD     (command the merged tree must pass before the push)
set -euo pipefail

: "${UPSTREAM_URL:?UPSTREAM_URL is not set}"
: "${UPSTREAM_BRANCH:?UPSTREAM_BRANCH is not set}"
: "${DEST_BRANCH:?DEST_BRANCH is not set - refusing to guess a branch to push to}"

current="$(git rev-parse --abbrev-ref HEAD)"
if [ "$current" != "$DEST_BRANCH" ]; then
  echo "::error::Checked-out branch is '$current', expected '$DEST_BRANCH'. Aborting."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "::error::Working tree is not clean. Aborting rather than mixing in unrelated changes."
  exit 1
fi

echo "Fetching ${UPSTREAM_URL} ${UPSTREAM_BRANCH}"
git fetch --no-tags "$UPSTREAM_URL" "refs/heads/${UPSTREAM_BRANCH}"
upstream_sha="$(git rev-parse FETCH_HEAD)"
dest_sha="$(git rev-parse HEAD)"
echo "upstream ${UPSTREAM_BRANCH}: ${upstream_sha}"
echo "${DEST_BRANCH}:            ${dest_sha}"

if [ -n "${EXPECTED_SHA:-}" ] && [ "$EXPECTED_SHA" != "$upstream_sha" ]; then
  echo "::notice::Upstream moved since approval was requested (${EXPECTED_SHA} -> ${upstream_sha}); syncing the newer head."
fi

if git merge-base --is-ancestor "$upstream_sha" "$dest_sha"; then
  echo "Already up to date - nothing to sync."
  echo "result=up-to-date" >> "${GITHUB_OUTPUT:-/dev/null}"
  exit 0
fi

if git merge-base --is-ancestor "$dest_sha" "$upstream_sha"; then
  echo "Fast-forwarding ${DEST_BRANCH} to upstream."
  git merge --ff-only "$upstream_sha"
else
  echo "${DEST_BRANCH} has its own commits - creating a merge commit."
  if ! git merge --no-ff --no-edit \
        -m "Merge upstream ${UPSTREAM_BRANCH} (${upstream_sha:0:7}) into ${DEST_BRANCH}" \
        "$upstream_sha"; then
    echo "::error::Merge conflict. Resolve manually: git fetch ${UPSTREAM_URL} ${UPSTREAM_BRANCH} && git merge FETCH_HEAD"
    echo "Conflicting files:"
    git diff --name-only --diff-filter=U | sed 's/^/  /'
    git merge --abort
    exit 1
  fi
fi

# Post-merge gate: the merged tree must pass before anything is pushed. The
# workflow sets GATE_CMD to the same `npm run test:e2e:ci` the PR check runs.
if [ -n "${GATE_CMD:-}" ]; then
  echo "Running the post-merge gate: ${GATE_CMD}"
  if ! bash -c "$GATE_CMD"; then
    echo "::error::The merged tree failed the E2E gate. Nothing was pushed; ${DEST_BRANCH} is unchanged. Reproduce locally by merging upstream and running: cd frontend && npm run test:e2e:ci"
    exit 1
  fi
fi

if ! git push origin "HEAD:refs/heads/${DEST_BRANCH}"; then
  echo "::error::Push to ${DEST_BRANCH} was rejected (branch moved, protection rule, or the upstream changed .github/workflows and the token lacks the 'workflows' scope). Nothing was force-pushed."
  exit 1
fi

echo "Synced ${DEST_BRANCH}: ${dest_sha:0:7} -> $(git rev-parse --short HEAD)"
echo "result=synced" >> "${GITHUB_OUTPUT:-/dev/null}"
