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
| ⬜ | Enable Actions on the fork and create the `sync-approval` environment with reviewers |
| ✅ | The merged result must pass the full test suite before a sync is pushed; a failure pushes nothing |
| ⬜ | Real-time sync triggered by upstream (needs admin access on the upstream repo) |
| ⬜ | Open upstream PRs from feature branches so fork-only files stay out of them |

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
| 🟨 | Friendly error page instead of a blank screen if something crashes (style to be chosen, see Section 5) |
| ⬜ | Stop the page behind the open menu from scrolling |
| ✅ | Swipe left to close the menu on phones (follows the finger; short drags spring back). No swipe-to-open, so it never clashes with the iPhone Back gesture |
| ✅ | Logging out on desktop could leave a spinner instead of the login page (a double redirect); fixed |
| ✅ | Recent chats in the menu: rows and the ⋮ button 36px on phones (were 27px and 24px); desktop unchanged |
| ✅ | Question cards: easier-to-tap buttons (same look), answer options 36px rows, upgrade dialog close button |
| ⬜ | Fix an outdated code comment about phone scaling |

## 4. Mobile production readiness

### 4.1 Viewport, safe areas & app shell

| Status | Task |
|:---:|---|
| 🔍 | Full-height layout that doesn't jump when the browser address bar hides/shows. The app uses a zoom-corrected `--app-vh`; switching to `dvh`/`svh` must keep the 0.85 zoom correction |
| ⬜ | Safe-area padding for the iPhone notch / Dynamic Island on the top bar (`env(safe-area-inset-top)`). The app sets `statusBarStyle: black-translucent` but has no safe-area handling and no `viewport-fit=cover`, so the installed app may draw under the status bar |
| ⬜ | Safe-area padding for the iOS home indicator / Android gesture bar under the composer (`env(safe-area-inset-bottom)`) |
| ✅ | Mobile menu drawer opens and closes over a dimmed backdrop |
| ✅ | Tapping the backdrop or a chat in the menu closes it |
| ⬜ | Page behind the open menu doesn't scroll |
| ✅ | Browser/status-bar colour matches the app theme (light `#f5f3f4`, dark `#121013`, manifest `#121013`) |

### 4.2 Composer & on-screen keyboard

| Status | Task |
|:---:|---|
| ⬜ | Viewport set to resize with the keyboard (`interactive-widget=resizes-content`) so the composer sits right above it |
| 🔍 | Composer controls never squeezed: on phones the textarea takes the full width and the buttons get their own row |
| ✅ | Composer grows with text up to a maximum height, then scrolls |
| 🔍 | No iOS auto-zoom on input focus. Fields are 16px in CSS, but the 0.85 zoom draws them at ~13.6px, which may trigger iOS zoom |
| ✅ | Enter adds a new line on phones and sends on a real keyboard |
| ⬜ | In-progress message is kept if the user switches tabs or refreshes |

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
| ⬜ | Same 44×44px tap areas for chat controls: mode switcher, audio, attach, delete, regenerate |
| 🔍 | No 300ms tap delay (`touch-action: manipulation`): set on the companion switcher only so far |
| ⬜ | No rubber-band bounce of the whole page at the top/bottom of a chat (`overscroll-behavior-y: contain`) |

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
| ⬜ | Bump the service-worker cache version with each mobile release, so installed apps pick up fixes |

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
| 🟨 | **Error page style.** Options: (A) a card inside the app, menu kept; (B) full screen with the companion; (C) only the broken part fails; (D) card plus a reference code and send-report button. Recommended: A for page errors, plus B as the last resort when the whole app fails |
| 🟨 | **Graph files in git.** The guide asks not to commit generated output; `graphify-out/` is currently committed. Decide whether to remove it from git and ignore it |

## 6. From the technical guide

| Status | Task |
|:---:|---|
| ✅ | Technical guide reviewed (`docs/TECHNICAL_GUIDE.md`, upstream commit `47a8c2a`) |
| ✅ | Tests never use the shared `clardentity@test.com` account |
| ⬜ | Live test runs use a throwaway account registered via the API and deleted afterwards |
| ⬜ | Show named progress (searching, reading, thinking, validating) instead of a generic "Thinking…". The server already sends it |
| ⬜ | Loading states designed for backend cold starts (several seconds after inactivity) |
| ⬜ | Handle the paid-preview companions on mobile: unlock prompt and daily-limit message (402 responses) |
| ⬜ | Bring in the latest upstream changes (fork is two commits behind, including this guide) |

## 7. Code knowledge graph

| Status | Task |
|:---:|---|
| ✅ | Knowledge graph of the codebase built (graphify) |
| ⬜ | Refresh the graph after the latest changes |
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

