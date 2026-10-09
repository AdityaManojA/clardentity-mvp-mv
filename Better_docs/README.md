# Better_docs

Working notes for the **mobile view** of Clardentity: what has been built, how it is tested, and how this fork stays in step with the main repo.

- Fork (where the work happens): [`AdityaManojA/clardentity-mvp-mv`](https://github.com/AdityaManojA/clardentity-mvp-mv)
- Main repo: [`clardentity/clardentity-mvp`](https://github.com/clardentity/clardentity-mvp)
- Finished, tested work goes to the main repo as a pull request from the `mobile-view` branch.

## What's in this folder

| File | What it is | Read it when |
|---|---|---|
| [Mv.md](Mv.md) | The project checklist: every mobile task with its status, the test matrix, decisions taken, and what emulation can't show | You want to know what's done and what's left |
| [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md) | How the app works: API, streaming protocol, data model, voice. Section 8 covers mobile (breakpoints, the 85% zoom, keyboards, the service worker) | You're about to change code |
| [GRAPHIFY_WORKFLOW.md](GRAPHIFY_WORKFLOW.md) | Setting up and refreshing the code knowledge graph (`graphify-out/`) | You want to map which parts of the code a change touches |

Status key used in `Mv.md`: ✅ Done · 🔄 Built, waiting on a setup step · 🔍 Built, needs a real-device check · ⬜ To do · 🟨 Needs decision · ❌ Failing.

## The mobile view in one page

**Scope.** Every visual change applies only to the phone layout: screens narrower than the `lg` breakpoint (1024px), and for tap sizes also touch screens. Desktop keeps its existing design, and the tests check that it does.

What a phone user gets:

- **Error screens.** When one part breaks (an answer, a question card, a chart, the recent-chats list or a page), only that part gives way to a "Try again" box. If the whole app breaks, a full-screen page with the companion offers Reload. Reporting is optional and asks first. A reference number appears only after a report has actually been sent.
- **Navigation.** The menu is a proper modal. Escape, the phone's Back button and a left swipe all close it, and the page behind it stays still. "Clardentity" in the menu goes home.
- **Screen edges and keyboard.** The layout respects the notch, Dynamic Island and home indicator. On Android it resizes with the on-screen keyboard. iOS no longer zooms into small text fields.
- **Tap targets.** 44px tap areas on buttons and icons, and 36px recent-chat rows. The visual size is unchanged; the tappable area is enlarged invisibly.
- **Chat.**
  - The companion floats over the thread instead of covering it.
  - The composer grows with the text.
  - Unsent messages survive a refresh.
  - There is an offline notice.
  - Progress is named while an answer is coming ("Searching the web", "Checking the claims").
  - The daily preview limit is explained instead of failing silently.
- **Readability and motion.**
  - Muted text meets WCAG AA contrast in every accent colour.
  - Nothing scrolls sideways.
  - Lists rise in gently.
  - On the home page, the curtain responds to tilt on Android and sweeps slowly on iPhone.
  - All motion switches off under reduced-motion settings.

The full list, item by item, is in [Mv.md](Mv.md).

## Tests

The tests are end-to-end (Playwright), in `frontend/e2e/`. The backend is mocked at the network layer, so no account, model or API key is needed.

| Profile | Device | Engine |
|---|---|---|
| `mobile-chrome` | Pixel 7, 375×812, touch | Chromium |
| `mobile-safari` | iPhone 14, 375×812, touch | WebKit |
| `web` | Desktop Chrome | Chromium (checks the desktop is unchanged) |

Run the mobile suite:

```bash
cd frontend && npm run test:e2e:mobile
```

What it covers:

- layout and sideways overflow, tap areas, the menu drawer and the tour
- the chat and all four question cards
- every screen and route
- offline behaviour and an axe accessibility scan
- the error screens, drafts, named progress and the paid limit
- the cookie banner

Checklist IDs (`M01`–`M47`) map to the test matrix in `Mv.md`.

Two groups of tests are skipped until they are set up:

- **`@live`**: tests against the real backend. They need the test-account secrets.
- **`@visual`**: screenshot comparisons. They need baselines generated in CI.

**Stress and regression runs.** The whole mobile suite is repeated several times in a row with extra parallel workers and no retries. Any flaky or timing-dependent failure therefore shows up as a failure rather than being retried away:

```bash
cd frontend && npx playwright test --project=mobile-chrome --project=mobile-safari --repeat-each=5 --workers=6
```

**What emulation can't show:** the real on-screen keyboard, safe areas, momentum scrolling and iOS's own zoom. Those items are marked 🔍 in `Mv.md` and need a check on a real iPhone and Android phone.

## Keeping the fork in step with the main repo

Two GitHub Actions workflows handle this:

- **`.github/workflows/sync-upstream.yml`** checks the main repo for new commits and merges them into the fork. Before anything lands, it waits for Aditya's approval (the `sync-approval` environment) and runs the test suite as a gate. Details are in [.github/SYNC_UPSTREAM.md](../.github/SYNC_UPSTREAM.md).
- **`.github/workflows/e2e.yml`** runs the tests on every pull request. **`e2e-visual-baselines.yml`** regenerates screenshot baselines on demand.

Fork-only files never go into pull requests to the main repo: this folder, the sync workflow and the generated `graphify-out/`.
