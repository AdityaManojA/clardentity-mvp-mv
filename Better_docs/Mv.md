# Mv: project checklist

Fork: `AdityaManojA/clardentity-mvp-mv` · Upstream: `clardentity/clardentity-mvp`

Status key: ✅ Done · 🔍 Built, needs a real-device check · ⬜ To do · 🟨 Needs decision

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
| ⬜ | Run the tests automatically before every sync is pushed |
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
| ✅ | M10: Swiping vertically always scrolls the page |
| ✅ | M11: Logout clears the session and returns to the login screen |
| ✅ | Critical path (login → workspaces → logout) stable across repeated parallel runs |
| ⬜ | M10b: Swipe test on the chat mode carousel (needs a live test account) |
| ⬜ | Run the test suite on every pull request |
| ⬜ | Save test reports from CI when a test fails |
| ⬜ | Dedicated test account for live-mode runs |
| ⬜ | Mobile tests for the chat screen (typing, scrolling messages, mode carousel) |
| ⬜ | iPhone / Safari testing profile |
| ⬜ | Screenshot comparison to catch layout changes |
| ⬜ | Automated accessibility scan (login, workspaces, menu) |
| ⬜ | Mobile tests for remaining screens: register, password reset, profile, settings, documents, search, admin |
| ⬜ | Full offline test after the app has loaded |

## 3. App improvements (mobile)

| Status | Task |
|:---:|---|
| ✅ | Fixed workspace cards running off the edge of phone screens |
| ✅ | Menu drawer is now a proper accessible dialog for screen readers |
| ✅ | Keyboard focus moves into the menu and stays there while it's open |
| ✅ | Escape key closes the menu |
| ✅ | Phone Back button closes the menu instead of leaving the page |
| ⬜ | Friendly error page instead of a blank screen if something crashes |
| ⬜ | Stop the page behind the open menu from scrolling |
| ⬜ | Swipe to close the menu |
| ⬜ | Larger tap area for the ⋮ menu and rows in recent chats |
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
| ⬜ | Composer grows with text up to a maximum height, then scrolls |
| 🔍 | No iOS auto-zoom on input focus. Fields are 16px in CSS, but the 0.85 zoom draws them at ~13.6px, which may trigger iOS zoom |
| ✅ | Enter adds a new line on phones and sends on a real keyboard |
| ⬜ | In-progress message is kept if the user switches tabs or refreshes |

### 4.3 Chat feed, citations & question cards

| Status | Task |
|:---:|---|
| 🔍 | Citation popups `[1]` `[2]` stay inside the screen on 360–390px phones |
| 🔍 | Follow-up, "Did you mean" and companion suggestion cards wrap cleanly and never hide behind the composer |
| 🔍 | Auto-scroll follows a streaming answer smoothly; scrolling up pauses it |
| 🔍 | Wide tables, formulas and code blocks scroll sideways inside the message, never the whole page |

### 4.4 Touch targets & ergonomics

| Status | Task |
|:---:|---|
| ✅ | 44×44px tap areas on touch screens for the top bar and menu (icons look the same; only the tappable area grows) |
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
| ⬜ | "Connection lost" notice, with sending disabled until the connection is back |
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
