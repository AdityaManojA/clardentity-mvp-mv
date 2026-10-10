---
name: regression
description: Run Clardentity's full regression matrix - scripted API/security smoke, backend tests, and the browser walkthrough - after every set of feature additions, before saying anything is done or ready to share, and after every deploy. Also the place to add a row whenever a feature ships or a bug is found, so the matrix grows with the product.
---

# Clardentity regression run

The user asked for this on 2026-10-10, after a demo was called "ready for
stakeholders" that had been checked for how it *looked* rather than for what
its answers *contained* (no gist, no fact-check, no decision structure).
The rule since then: **every feature batch ends with a full run of this
matrix, and every new feature or bug adds a row to it.**

`MATRIX.md` (next to this file) is the source of truth: every row has an ID,
what it proves, and how it is checked. Three kinds of check:

| Kind | Where | Cost |
|---|---|---|
| `script` | `scripts/regression/smoke.py` - one line per row ID | ~3 min, a few cents |
| `test` | `backend/.venv/bin/python -m pytest -q` (472+ tests, local DB + Redis) | ~30 s |
| `browser` | walked by hand in the browser pane, desktop 1280×860 | ~15 min |

## When to run it

- After any set of changes that ships - before the commit, against the local
  stack; and again after the deploy, against production.
- Before telling the user something is done, fixed, or ready to share.
- When the user reports a bug: reproduce it, add its row, fix, run the lot.

## How to run it

1. **Backend tests** (always first, cheapest):
   ```bash
   cd backend && .venv/bin/python -m pytest -q
   ```
2. **Local stack** (see the `testing-clardentity-locally` memory): backend on
   :8010 started via Bash with `BACKEND_CORS_ORIGINS=http://localhost:3100,...`,
   `frontend/.env.local` repointed 8000→8010 (**revert before committing**).
   For security rows, serve a production build - the CSP only exists there:
   `npm run build` in `frontend/`, then `preview_start name=frontend-prod`.
   Clear Redis `guest:*` and `ratelimit:*` keys first or the demo allowance
   runs out mid-run.
3. **Scripted rows**:
   ```bash
   python3 scripts/regression/smoke.py --target local --images
   ```
   After a deploy, the same with `--target prod`. `--images` costs real
   money (two image generations); include it whenever Co-Creative or the
   image pipeline changed.
4. **Browser rows**: walk every `browser` row in `MATRIX.md` in the browser
   pane at 1280×860. Unregister the service worker and clear caches and
   localStorage before trusting a reload. Use throwaway accounts only
   (`local-regress-*` / `regress-*@example.com`); never
   `clardentity@test.com`. Delete them with `DELETE /api/v1/auth/me`.
5. **Record** the run at the bottom of `MATRIX.md`: date, target, commit,
   pass/fail counts, and any row that failed with what was done about it.

## Rules that came from real misses

- **Compare structure, not screenshots.** For the demo, the question is
  whether a demo answer carries what a signed-in answer carries - gist card,
  claims with evidence, sources, confidence, verdict box, Devil's Draft -
  per mode. A frame that looks right with plain prose inside it failed this
  once.
- **A gate is not a failure.** Context / rewording / options questions fire
  on real models; answer them like a user and continue.
- **Model-judgement rows are reported, not failed** (smart switching is the
  main one): the script marks a miss SKIP with the reason.
- **Prove a fix discriminates.** If a test could pass with the fix removed,
  it proves nothing - disable the fix once and watch it fail.
- **The local backend does not reload.** Restart uvicorn after every backend
  edit before testing it, or you are testing the old code (this happened on
  2026-10-10 with image editing).
- **Stale service workers** serve old chunks with new HTML; bump `CACHE` in
  `frontend/public/sw.js` with every frontend change that must reach open
  tabs, and clear the worker before verifying.

## Adding a row

Every feature that ships and every bug that is found gets a row: a new ID in
the right section, one line on what it proves, and its check kind. If it can
be scripted, add it to `smoke.py` under the same ID; if it is a unit-level
rule, add a test and name the test file in the row. Never delete a row
because it is inconvenient - mark it `retired (date, why)` instead.
