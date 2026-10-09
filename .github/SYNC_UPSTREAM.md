# Upstream sync

`.github/workflows/sync-upstream.yml` keeps this fork's `main` in step with
[`clardentity/clardentity-mvp`](https://github.com/clardentity/clardentity-mvp) `main`,
but only after a person approves each sync.

## How it works

| Job | Permissions | What it does |
|---|---|---|
| `check` | `contents: read`, `actions: read` | Runs hourly (and on demand). Reads upstream's head with `git ls-remote`, which fetches no objects. If our `main` already contains that commit, or another run is already waiting for approval, it stops. |
| `sync` | `contents: write` | Gated on the `sync-approval` environment. After approval it fetches upstream, fast-forwards or creates a merge commit, and pushes to `main`. |

The script never force-pushes or resets. A merge conflict or a rejected push fails the
run with a clear error, and `main` is left untouched. A rerun with nothing new exits
successfully without making a commit.

## One-time setup

1. **Enable Actions in the fork.** GitHub turns workflows off in forks by default, so
   open the fork's **Actions** tab and click *I understand my workflows, go ahead and enable them*.
2. **Create the approval gate.** Under **Settings → Environments → New environment**,
   name it `sync-approval` and tick **Required reviewers**. Add yourself and anyone
   else who can approve. Optionally, under *Deployment branches*, restrict it to `main`.
3. **Allow the token to write.** Under **Settings → Actions → General → Workflow permissions**,
   make sure Actions isn't restricted below *read*. The workflow grants `contents: write`
   to the `sync` job itself.
4. **Branch protection (if any).** If `main` is protected, `github-actions[bot]` must
   be allowed to push to it. If it can't be, the push is rejected and the run fails.
5. **Optional `SYNC_TOKEN` secret.** `GITHUB_TOKEN` is enough as long as upstream
   doesn't modify `.github/workflows/*`. GitHub refuses workflow-file changes pushed with
   `GITHUB_TOKEN`. If that happens, create a fine-grained PAT scoped to this repo
   with **Contents: read/write** and **Workflows: read/write**, and save it as the
   repository secret `SYNC_TOKEN`. The workflow picks it up automatically.

To change the destination branch, edit `DEST_BRANCH` in the workflow. No other branch
is ever pushed to.

## Testing safely

1. Run the script locally against throwaway repos. It only needs the three env vars:
   ```bash
   UPSTREAM_URL=https://github.com/clardentity/clardentity-mvp.git UPSTREAM_BRANCH=main DEST_BRANCH=main bash .github/scripts/sync-upstream.sh
   ```
   Run this in a scratch clone, not your working copy, because it pushes to `origin`.
2. On GitHub, open **Actions → Sync upstream main → Run workflow**. If upstream is ahead,
   the `sync` job pauses with *Waiting for review*. **Reject** it the first time to
   confirm nothing is pushed. Then run it again and **Approve**.
3. Run it again. `check` should report *nothing to do* and the `sync` job should be skipped.

## Limitations

- **Polling, not real-time.** The fork can't receive upstream push events. Syncs are
  detected up to about an hour late (GitHub's scheduler can also add delays). For
  real-time syncing, upstream would need a workflow that sends a `repository_dispatch`
  to this fork using a PAT.
- **Scheduled workflows pause after 60 days without repo activity.** Re-enable them from the Actions tab.
- **Pending approvals don't pile up.** While one run waits for review, hourly checks
  skip. If upstream moves before you approve, the approved run syncs the newest upstream head.
- **Rejecting a request doesn't snooze it.** The next hourly check asks again.
- **Pushes by `GITHUB_TOKEN` don't trigger other workflows** (for example CI on `main`).
  Use `SYNC_TOKEN` if you need them to.
