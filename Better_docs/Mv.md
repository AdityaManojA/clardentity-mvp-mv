# Mv: project checklist

Fork: `AdityaManojA/clardentity-mvp-mv` · Upstream: `clardentity/clardentity-mvp`

Status key: ✅ Done · 🔄 Built, waiting on a setup step · 🔍 Built, needs a real-device check · ⬜ To do · 🟨 Needs decision · ❌ Failing

---

## 1. Upstream sync

| Status | Task |
|:---:|---|
| ✅ | Hourly check for new changes on upstream `main`, plus a manual "Run now" button |
| ✅ | Nothing is fetched or merged until a reviewer approves the run |
| ✅ | Safe merge into the fork's `main`: fast-forward or merge commit, never a force-push |
| ✅ | Merge conflicts or rejected pushes stop the run with a clear message; `main` is left untouched |
| ✅ | Re-running with no new changes does nothing (no empty commits) |
| ✅ | Least-privilege permissions; only the approved step can write |
| ✅ | Overlapping runs prevented; never runs inside the upstream repo |
| ✅ | Merge script tested locally against every failure case |
| ✅ | Setup and testing guide (`.github/SYNC_UPSTREAM.md`) |
| ✅ | Actions enabled on the fork; `sync-approval` requires Aditya's approval before any sync |
| ✅ | The merged result must pass the full test suite before a sync is pushed; a failure pushes nothing |
| ⬜ | Real-time sync triggered by upstream (needs admin access on the upstream repo) |
| ✅ | Upstream PRs go from a feature branch (`mobile-view`), so fork-only files stay out |

## 2. Mobile testing

| Status | Task |
|:---:|---|
| ✅ | Playwright test setup with desktop and mobile (375×812, touch) profiles |
| ✅ | Tests run without a backend or real account (simulated API); optional live mode |
| ✅ | Desktop checks the mobile tests depend on: login, workspaces, forms, navigation, errors, logout |
| ✅ | M01: Mobile layout renders with no sideways scrolling |
| ✅ | M02: Buttons and links are at least 44px to tap, without overlapping |
| ✅ | M03: Menu drawer opens and closes, keeps keyboard focus inside, supports Escape and the Back button |
| ✅ | M04: Login works on mobile; the right keyboard shows and the button stays visible |
| ✅ | M05: Workspace cards fit the screen and long names are shortened neatly |
| ✅ | M06: Forms stay usable with the keyboard open; validation and submit work by tap |
| ✅ | M07: Network errors show a clear message inside the mobile layout |
| ✅ | M08: Content scrolls and the top bar never covers input fields |
| ✅ | M09: Portrait and landscape both work, including the menu |
| ✅ | M10: Swiping vertically always scrolls the page (Android profile; iPhone needs a real device) |
| ✅ | M11: Logout clears the session and returns to the login screen |
| ✅ | M10b: Swiping the chat mode carousel changes mode, stops at the ends, and never blocks scrolling |
| ✅ | M12: Chat box: tap to type, grows with longer text, Send never covered, empty messages blocked |
| ✅ | M13: Sending a message by tap; the chat follows new messages, but not if you've scrolled up to read |
| ✅ | M14: Long words, code and tables stay inside the message, never widen the page |
| ✅ | M15: All 8 companions reachable on the mode bar; the chosen one stays selected after sending |
| ✅ | M16: Sign-up: validation, "email already used" message, successful sign-up |
| ✅ | M17: Forgot / reset password: request, mismatch warning, expired link, successful reset |
| ✅ | M18: Profile: loads, add a fact, load-error message |
| ✅ | M19: Settings: rename a companion, save-failure message |
| ✅ | M20: Documents: upload, delete (visible on phones), search, upload-error message |
| ✅ | M21: Chat history search: results, empty result, special characters |
| ✅ | M22: Admin: dashboard for admins, polite refusal for everyone else |
| ✅ | M23: Losing the connection: notice shown, content kept, clear errors, recovers without a refresh |
| ✅ | Accessibility scan (WCAG A/AA) on login, workspaces and the open menu: no serious issues |
| ✅ | Every test runs on two phone profiles: Android (Chrome) and iPhone (Safari engine) |
| ✅ | Critical path (login → workspaces → chat send → logout) passes 5 runs in a row on every profile |
| ✅ | Test suite runs on every pull request; ready to be a required check |
| ✅ | Failed runs keep the report, screenshots, videos and traces for 14 days, with a summary of what failed |
| ✅ | M32–M36: Error screens - one broken answer, page, whole app, recent chats, question card |
| ✅ | M37–M44: Menu holds the page still, draft kept, named progress, no field zoom, phone edges, chat icon tap sizes, paid limit, feedback |
| ✅ | M45–M47: Welcome questions, Privacy and Terms pages, cookie banner on a first visit |
| ✅ | Whole mobile suite: 125 passed on both phone profiles (1 skipped by design) |
| ✅ | Stress run: the whole mobile suite repeated 10× on a production build with 6 parallel browsers and no retries - every repeat-flake traced and fixed (1,248 passed, then the last one fixed and re-checked 40/40) |
| ✅ | Load test: 500 phones at once on the production build - 0 errors, every page a 200 |
| ✅ | Fixed from stress testing: scrolling up just as an answer finished could be ignored, then the next message yanked you to the bottom |
| ✅ | Fixed from code review: the inline "opinion" tag in answers was being blown up to a 44px box mid-sentence on phones; it keeps its size with an invisible 44px tap area |
| 🔄 | Live tests against the real backend: built and skipping cleanly; waiting on the test accounts and secrets |
| 🔄 | Screenshot comparison of 5 key screens: built; waiting on the first baseline run in CI |
| ✅ | M24: "Did you mean" card: ask it reworded or keep your wording; never asked twice |
| ✅ | M25: Clarifying options: tap an option, type your own (keyboard up), or skip; 7 long options all reachable |
| ✅ | M26: "Why do you ask?" card: answer with the keyboard up, a fresh second round, skip |
| ✅ | M27: Automatic companion switch: "Switched to…" notice, "Stay in…" undo, auto-dismiss, paid-companion upgrade |
| 🔍 | With many options and the keyboard open, the "Something else" box may sit below the fold until scrolled (Aditya testing on a device) |

## 3. App improvements (mobile)

| Status | Task |
|:---:|---|
| ✅ | Fixed workspace cards running off the edge of phone screens |
| ✅ | Menu drawer is now a proper accessible dialog for screen readers |
| ✅ | Keyboard focus moves into the menu and stays there while it's open |
| ✅ | Escape key closes the menu |
| ✅ | Phone Back button closes the menu instead of leaving the page |
| ✅ | Chat box grows as you type (up to about five lines) instead of staying one line tall |
| ✅ | The chat keeps following a new answer as it finishes loading, instead of stopping short of the end |
| ✅ | Fixed the "Unchecked - caveats removed" label showing mirrored through every answer (now hidden outright, works in every browser; a test checks it) |
| ✅ | Admin page no longer scrolls sideways on phones |
| ✅ | Documents: the delete button is visible on phones (it only appeared on mouse hover) |
| ✅ | Easier-to-tap buttons across sign-up, password reset, profile, settings, documents, search and admin (same look) |
| ✅ | Faint grey helper text darkened just enough to meet accessibility contrast (all colour themes, light and dark) |
| ✅ | "You're offline" notice; the chat box keeps your text and waits until you're back online |
| ✅ | Stable test hooks (`data-testid`) on the menu, message list and messages |
| ✅ | Friendly error screens on phones: the whole app → full-screen companion page; one broken part (an answer, a question card, a chart, recent chats, a page) → a "Try again" box with a small Report link; the reference appears only once a report is sent |
| ✅ | The page behind the open menu stays still |
| ✅ | Swipe left to close the menu on phones (follows the finger; short drags spring back). No swipe-to-open, so it never clashes with the iPhone Back gesture |
| ✅ | Logging out on desktop could leave a spinner instead of the login page (a double redirect); fixed |
| ✅ | Recent chats in the menu: rows and the ⋮ button 36px on phones (were 27px and 24px); desktop unchanged |
| ✅ | Question cards: easier-to-tap buttons (same look), answer options 36px rows, upgrade dialog close button |
| ✅ | Outdated code comment about phone scaling fixed |

## 4. Mobile production readiness

### 4.1 Viewport, safe areas & app shell

| Status | Task |
|:---:|---|
| 🔍 | Full-height layout that doesn't jump when the browser address bar hides/shows. The app uses a zoom-corrected `--app-vh`; switching to `dvh`/`svh` must keep the 0.85 zoom correction |
| 🔍 | Safe-area padding for the notch / Dynamic Island on the top bar and menu (built; needs a real iPhone to see) |
| 🔍 | Safe-area padding for the home indicator / gesture bar under the chat box (built; needs a real phone to see) |
| ✅ | Mobile menu drawer opens and closes over a dimmed backdrop |
| ✅ | Tapping the backdrop or a chat in the menu closes it |
| ✅ | Page behind the open menu doesn't scroll |
| ✅ | Browser/status-bar colour matches the app theme (light `#f5f3f4`, dark `#121013`, manifest `#121013`) |

### 4.2 Composer & on-screen keyboard

| Status | Task |
|:---:|---|
| ✅ | Page resizes with the on-screen keyboard (Android) so the chat box sits right above it |
| 🔍 | Composer controls never squeezed: on phones the textarea takes the full width and the buttons get their own row |
| ✅ | Composer grows with text up to a maximum height, then scrolls |
| ✅ | No iOS auto-zoom on input focus: small fields now draw at 16px on phones |
| ✅ | Enter adds a new line on phones and sends on a real keyboard |
| ✅ | An unsent message is kept if you switch tabs or refresh; cleared once sent |

### 4.3 Chat feed, citations & question cards

| Status | Task |
|:---:|---|
| 🔍 | Citation popups `[1]` `[2]` stay inside the screen on 360–390px phones |
| 🔍 | Follow-up, "Did you mean" and companion suggestion cards wrap cleanly and never hide behind the composer |
| ✅ | Auto-scroll follows a new answer; scrolling up pauses it (tested in emulation; smoothness needs a real device) |
| ✅ | Wide tables, formulas and code blocks stay inside the message, never the whole page |

### 4.4 Touch targets & ergonomics

| Status | Task |
|:---:|---|
| ✅ | 44×44px tap areas on touch screens for the top bar and menu (icons look the same; only the tappable area grows) |
| ✅ | 44×44px tap areas on the main buttons of every other screen |
| ✅ | 44×44px tap areas for chat controls: attach, mic, call, send, copy, regenerate, delete, helpful / not helpful |
| ✅ | No 300ms tap delay on anything you can press |
| ✅ | No rubber-band bounce of the whole page at the top/bottom of a chat |

### 4.5 Media, audio & uploads

| Status | Task |
|:---:|---|
| 🔍 | Voice replies and live calls play on iPhone Safari (audio is resumed on the user's tap) |
| 🔍 | Uploads work with the phone's camera, photo library and files (PDF/DOCX) |
| 🔍 | Image previews fit small screens with an easy-to-tap remove (X) button |
| 🔍 | Live-call screen fits compact phones without overlapping mute, avatar and end-call |

### 4.6 Installable app (PWA) & connection drops

| Status | Task |
|:---:|---|
| 🔍 | Android: "Install app" button opens the system install dialog |
| 🔍 | iPhone: button shows the "Share → Add to Home Screen" steps |
| 🔍 | Opens full-screen from the home screen, with no browser bars |
| 🔍 | Locking the phone or switching apps mid-answer recovers cleanly (reload if the answer was saved, otherwise offer retry) |
| ✅ | "Connection lost" notice, with sending disabled until the connection is back |
| ✅ | Service-worker cache version bumped (v11) so installed apps pick up the mobile release |

### 4.7 Browser & device test matrix

| Status | Task |
|:---:|---|
| ⬜ | iPhone Safari (iOS 16, 17, 18): scrolling, bounce, input zoom, Add to Home Screen |
| ⬜ | Chrome on Android: keyboard resize, install prompt, upload dialogs |
| ⬜ | Samsung Internet: fonts, Back button, bottom toolbar |
| ⬜ | Firefox Mobile & Brave: strict privacy settings don't break sign-in token refresh |

## 5. Decisions

| Status | Task |
|:---:|---|
| ✅ | **Tap target size.** Decided: enlarge only the tappable area on touch screens; the design stays as drawn |
| ✅ | **Where work happens.** Decided: mobile-view work lives in `AdityaManojA/clardentity-mvp-mv`; finished, tested changes are merged into the main repo later |
| ✅ | **Error page style.** Decided: full-screen companion page when the whole app breaks; "Try again" box with a small Report link for single parts |
| 🟨 | **Graph files in git.** The guide asks not to commit generated output; `graphify-out/` is currently committed. Decide whether to remove it from git and ignore it |

## 6. From the technical guide

| Status | Task |
|:---:|---|
| ✅ | Technical guide reviewed (`docs/TECHNICAL_GUIDE.md`, upstream commit `47a8c2a`) |
| ✅ | Tests never use the shared `clardentity@test.com` account |
| ⬜ | Live test runs use a throwaway account registered via the API and deleted afterwards |
| ✅ | Named progress on phones while an answer is on its way: "Searching the web", "Reading sources", "Checking the claims" |
| ⬜ | Loading states designed for backend cold starts (several seconds after inactivity) |
| ✅ | Paid-preview limit (402) explained in the chat, which stays usable |
| ✅ | Latest upstream changes merged (one conflict resolved, keeping both fixes) |

## 7. Code knowledge graph

| Status | Task |
|:---:|---|
| ✅ | Knowledge graph of the codebase built (graphify) |
| ✅ | Graph refreshed; used to map which routes and components the mobile tests didn't reach yet |
| ⬜ | Add project documents and PDFs to the graph |

## 8. Test matrix (M12 onwards)

| ID | Scenario | Assert | Upstream T-Dep | Reg Trigger |
|---|---|---|---|---|
| M10b | Mode carousel swipe | Swipe and arrows change mode; stops at the ends; short drag ignored; vertical drag scrolls | T05 | Yes |
| M12 | Chat typing | Tap focuses; Enter = new line on touch; box grows; Send never overlapped; empty/whitespace blocked | T07 | Yes |
| M13 | Chat send + follow | Sent and answered by tap; list follows to the bottom; a scrolled-up reader isn't pulled down | T03 | Yes (critical) |
| M14 | Wide content | No page or list sideways scroll; message inside 375px | T05 | No |
| M15 | Mode rail | 8 options; one selected; preview modes marked; mode sent with the message and kept after | T05 | Yes |
| M16 | Sign up | Native validation blocks; taken-email message; success redirect; submit ≥44px | T03 | Yes |
| M17 | Forgot / reset password | Request confirmation; incomplete link; mismatch; expired-token message; success sign-in | T03 | Yes |
| M18 | Profile | Renders; add aspect; remove control ≥44px; load-error banner with shell intact | T05 | No |
| M19 | Settings | Rename companion; save-failure message; no sideways scroll | T07 | No |
| M20 | Documents | Upload; delete visible + tappable on touch; upload error; attachment search incl. special characters | T07 | Yes |
| M21 | History search | Result links to its chat; empty state; special characters reach the server intact | T05 | No |
| M22 | Admin | Admin sees dashboard + menu link; ordinary user refused, no link | T13 | Yes |
| M24 | Refined question | Card replaces the answer; nothing written; resend reworded or original with `refined_confirmed` | T03 | Yes |
| M25 | Clarifying options | Option / typed / skip resend with `clarifying_confirmed`; 36px option rows; 44px buttons | T03 | Yes |
| M26 | Context question | Autofocus; Send blocked empty; round counted; fresh second round; skip sets `context_acknowledged` | T03 | Yes |
| M27 | Mode suggestion | Resent in suggested mode with `mode_confirmed`; toast + undo; auto-dismiss; paid → upgrade dialog | T03 | Yes |
| M23 | Offline after load | Notice; content kept; action fails with a message; recovers without refresh; chat draft kept | T12 | Yes |
| M32 | Broken answer | Inline box; rest of chat works; Report sheet asks first, reference only after sending | T05 | Yes |
| M33 | Broken page | Page-level box; menu still works | T05 | Yes |
| M34 | Whole app broken | Full-screen companion page; Reload; Back to start | T03 | Yes |
| M35 | Broken recent chats | Only that list gives way; menu works | T09 | No |
| M36 | Broken question card | Only the card gives way; composer stays | T03 | No |
| M37 | Menu open | Page behind it can't scroll | T09 | No |
| M38 | Draft | Survives refresh; cleared after send | T07 | Yes |
| M39 | Named progress | Real streamed status names shown while waiting | T05 | No |
| M40 | Field zoom / taps | Small fields render ≥16px; touch-action manipulation | T03 | No |
| M41 | Phone edges | viewport-fit cover, keyboard resize, safe-area hooks; drawer keeps pan-y | T09 | No |
| M42 | Chat icons | 44px boxes for attach/mic/regenerate/feedback | T05 | No |
| M43 | Paid limit | 402 detail shown; chat usable | T12 | Yes |
| M44 | Feedback | Helpful tap sends rating | T05 | No |
| M45 | Welcome | Questions, progress, finish → chat | T03 | Yes |
| M46 | Privacy / Terms | Read on a phone, no sideways scroll | — | No |
| M47 | Cookie banner | First visit: fits, tappable, remembers | — | No |
| A11Y-1..3 | Accessibility | No serious/critical WCAG A/AA violations on login, workspaces, open menu | — | No |
| V1..V5 | Screenshots | Login, workspaces, menu, chat, settings within 1% of baseline | — | No |
| L1..L3 | Live (@live) | Real answer on a phone; admin dashboard opens; ordinary user refused | T03, T13 | Yes |

Regression: if a test fails, fix it, then rerun it, its upstream T-test and the critical path (T03 → M04 → M05 → M11 → M13) on both phone profiles until green (`npm run test:e2e:regress`).

## 9. Known limits (what emulation can't show)

| Status | Task |
|:---:|---|
| 🔍 | The real on-screen keyboard and how iOS resizes the page for it (M04/M06 simulate it by shrinking the screen) |
| 🔍 | Safe areas (notch, home bar) and momentum scrolling |
| 🔍 | Finger-drag scrolling on iPhone (the iPhone profile can't simulate a real drag; covered on the Android profile) |
| 🔍 | The iPhone profile is Safari's engine, not real iOS Safari: confirm on a device or a device cloud (e.g. BrowserStack) |
| 🔍 | Answers arrive word by word in real use; the simulated server sends them in one piece |
| 🔍 | Reloading while offline shows the browser's own error page by design (the app's offline cache doesn't cover pages) |

## 10. Setup steps (Aditya)

| Status | Task |
|:---:|---|
| ⬜ | Create two test accounts on the environment to test: an ordinary one and one on the backend's admin list. Sign each in once and finish the welcome questions |
| ⬜ | Add repository secrets: `E2E_LIVE_BASE_URL`, `E2E_LIVE_API_URL`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, and optionally `E2E_CAROUSEL_CHAT` (a chat answered in 2+ modes) |
| ⬜ | Make "E2E / playwright" a required check: Settings → Branches → `main` → Require status checks |
| ⬜ | If `main` is protected, allow GitHub Actions to push (bypass), or the sync's direct push will be refused |
| ⬜ | Run "E2E visual baselines" once from the Actions tab, then review the committed screenshots |

