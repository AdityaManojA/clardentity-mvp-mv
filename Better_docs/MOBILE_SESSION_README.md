# Mobile session README: what was done, where it lives, what's next

A summary of the mobile-view working session on the Clardentity fork, held from 2026-10-09 to 2026-10-12. It covers:
- the ground rules the work followed
- what changed (by area)
- how it is tested
- how to run the phone demo
- where everything is tracked
- what is still open

For deeper detail:
- [`Mv.md`](Mv.md): the line-by-line mobile change log and test checklist
- [`Transition.md`](Transition.md): the full codebase audit and plan for native iOS/Android apps

---

## 1. Ground rules used throughout

| Rule | Detail |
|---|---|
| Phone layout only | Every UI change targets the phone layout (`max-width: 1023.98px` / touch) unless the desktop is named explicitly. Desktop tests (`e2e/web.spec.ts`) check desktop is unchanged. The exceptions were explicit requests: card marks on desktop, desktop curtain hover, and "every screen" fixes. |
| Where work goes | Commit to the fork's **`main`** (`AdityaManojA/clardentity-mvp-mv`). Standing approval to push there. |
| Upstream PRs | Opened from a branch with fork-only files stripped. The current one is **PR #3 from `mobile-polish`** to `clardentity/clardentity-mvp`. Commits are copied onto it through a git worktree, so the graphify hook can't block branch switches. |
| Attribution | Commits are authored by Aditya Manoj only, with no AI co-author lines. |
| Tracking | Every change goes into `Better_docs/Mv.md` **and** the Google Sheet "suggestions/bugs". |
| Testing | Test around every edit. Run the full Playwright regression before pushing. |

---

## 2. What changed

### 2.1 Home (landing) page
- **Card marks**:
  - One minimal outline mark sits centred in each card's empty space, for 8 modes plus Ask/Check/See. The source is `components/marketing/CardEmboss.tsx`.
  - The designs came from the user's sketches:
    - **Finder**: a star with a filled ace of spades
    - **Reflect & Relieve**: a spark, dots and a star
    - **Co-Creative**: two circles and a spark
    - **Learning**: a 1-2-3-6 tree
    - **Decision**: a dotted fork with a ring hub
    - **Ask**: round dots
  - They are exported to `Card_design/` as 48 SVGs (12 concepts × 4 themes: 1 = default `#6B2D5C`, 2 = teal `#0D7C7B`, 3 = indigo `#2D3561`, 4 = plum velvet `#5D3A7A`).
  - Each mark takes its theme's colour from `--card-mark`. They now show on desktop as well.
  - **The Healthcare card will be added later.**
- **The glow behind a tapped card** follows the colour theme.
- **Cards fit every screen.** Both grids wrap, which fixed iPad Mini and in-between widths (M59).
- **Banner curtain**:
  - On desktop, the mouse lights the curtain and stirs the folds (T16).
  - Any screen that can't hover gets an automatic **wave** (M31, M60). Tilt and gyro control was removed.
  - The wave was made visibly stronger. It had been moving folds by about 0.04px, because the movement was measured against each 4px fold instead of the whole curtain.
- **Scroll-in animations are slower on phones**: sections rise over 1.6s, list rows over 0.85s with a 120ms stagger.
- **"An answer is many claims."** has more room on phones and tablets: wider side margins, the text sits lower, and the sentences are justified as one paragraph.
- **Phone held sideways**: the hero drops its desktop spacing, so the banner is on screen.

### 2.2 Chat
- **Scrolling**:
  - a "jump to latest" button
  - each chat reopens where you left off
  - smoother following of streaming answers
  - thin phone scrollbars and fading edges on scrolling rows
- **Cold starts**:
  - a "Waking the server up" notice
  - the first sign-in retries a booting server instead of signing you out
- **Readability**: the touch-phone UI draws at 92% (desktop stays at 85%), and the smallest labels are held at 12.5px.
- **Mode row**:
  - folds into one chip while typing
  - stays folded on short (landscape) screens
- **The chat box** is smaller on phones.
- **New chats**:
  - open centred from the first frame, with no jump from the bottom
  - only the companion shows while loading
  - the **companion stays above the greeting** (M61)
- **The model picker** opens fully on screen.
- **"Was this helpful?"** no longer squeezes onto three lines on the narrowest phones.

### 2.3 App shell and every-device fixes
- **The phone menu** shows the **Clardentity logo** in the top left.
- **Top bar on phones**:
  - shows only the current page title (it used to be cut to "P… / E…")
  - tighter icon spacing
  - the tour "?" button is hidden under 360px
- **Full-height screens** follow the visible viewport (`dvh`), so Safari's toolbar no longer covers the chat box. **Needs a real-device check.**
- **Legal pages' header** and the **admin chart legend** wrap on 280px screens.
- **The new device sweep** (`e2e/devices.spec.ts`) found all of the above. It covers 17 screens × 13 device sizes (folded Galaxy 280px up to a 1920px desktop, landscape phones, iPads), in Chromium and WebKit. On every screen it checks for sideways scroll, controls that can't be reached or are covered, clipped text, the chat box being on screen, a readable title, and the share of the screen a thread gets.

### 2.4 Tests
- New tests:
  - M48–M61 (phone features)
  - T16 (desktop curtain hover)
  - the D-series device sweep
- Flake fixes:
  - M21 waits for the search query to reach the server
  - the sweep's network-idle wait is capped at 10 seconds
- The last full run had **603 passed, 2 timed out, 7 skipped**. The 2 timeouts were the dev server being overloaded and passed 8/8 on rerun. The 7 skips are live-server tests (no secrets set), visual tests (no baselines yet) and one WebKit touch test.
- Command: `cd frontend && npx playwright test`. It needs the dev server on port 3100, which Playwright starts.

---

## 3. Running the phone demo (for testing on a real phone)

1. Run the mock backend: `cd frontend && node e2e/demo-api.mjs`. It listens on port 8010, includes test accounts and a fake slow "nap" for cold-start testing, and is **untracked: never commit it**.
2. Build against the machine's LAN IP (it was `192.168.68.58`):
   ```bash
   NEXT_PUBLIC_API_URL=http://192.168.68.58:8010/api/v1 NEXT_PUBLIC_BACKEND_URL=http://192.168.68.58:8010 npx next build
   npx next start --hostname 0.0.0.0 --port 3000
   ```
3. On a phone on the same Wi-Fi, open `http://<LAN-IP>:3000`.
4. If the curtain wave looks still on an iPhone, check that **Reduce Motion** is off (Settings → Accessibility → Motion).

---

## 4. Where things are tracked

| Where | What |
|---|---|
| `Better_docs/Mv.md` | Every mobile change and its test ID (✅ done, 🔍 needs a device check, ⬜ to do) |
| Google Sheet "suggestions/bugs": **WebApp** tab | `CLD-*` items for the web app |
| Google Sheet: **MobileView** tab | `MV-001` to `MV-059`. Status values: Fixed - merged / WIP / Wont do / New / Built - needs device check |
| Google Sheet: **MOBILE APP** tab (new) | `MA-001` to `MA-039`: the native-app transition tasks from `Transition.md`, all **New** |
| PR #3 (`mobile-polish`) | The upstream copy of the mobile work, waiting on review |
| `Better_docs/Transition.md` | The native iOS/Android master reference (see section 5) |

The sheet was edited through Claude in Chrome. Autosheet's trial had ended.

---

## 5. The native app plan (`Transition.md`)

A full audit of the repo at `75469fe`. It contains:
- every route, component, endpoint (59), table (15), env var and integration
- the auth flow
- browser-only APIs
- the design tokens
- the store checklist
- the risks
- a phased roadmap

**Key conclusions:**
- **The backend already suits mobile apps.** It uses Bearer-JWT, sets no cookies and has no server-side page logic.
- **Recommended path:**
  1. Fix the backend gaps first.
  2. Ship v1 as a **Capacitor** app wrapping the existing, tested web app.
  3. Plan React Native/Expo as v2 only if Apple rejects the wrapper, long chats are too slow, or voice needs deeper phone control.
- **Backend work needed first:**
  - Google sign-in accepts only one client ID, so the app's client IDs would be rejected
  - no Sign in with Apple
  - no logout or per-device sessions
  - no push notifications
  - reset links need Universal Links / App Links
  - answers need to survive the phone backgrounding the app
  - voice-note formats from phones are rejected
  - no pagination
- **Compliance:**
  - account deletion already exists
  - the privacy policy is missing several processors (Google, xAI, ipapi.co, OpenAI images)
  - there is no billing code if paid tiers will be sold in-app
- **Estimate:** about 6–9 weeks to the first store submission, plus 2–3 weeks if billing is added.

---

## 6. Found along the way (outside mobile scope)
- **Security:** any signed-in user can change the global admin settings, because `/api/v1/admin/settings` checks login but not admin status (`backend/app/api/admin.py:20-55`). A separate fix task was suggested in the app.
- **Four raw `fetch` calls skip the token refresh-and-retry:** dictation, document upload, read-aloud and Office export.
- **Logout doesn't revoke anything on the server.**
- **Google sign-ups don't record terms acceptance.**
- **Storage files are orphaned** when items are deleted.
- **CI runs no backend tests.**

---

## 7. Open items and next steps
- [ ] **Real-device checks** (Mv.md 🔍): safe areas and keyboard, PWA install, voice and live calls, uploads, Safari's toolbar not covering the chat box (`dvh`).
- [ ] **Generate the visual baselines** for PR #3: run the "E2E visual baselines" workflow on `mobile-polish`.
- [ ] **Test accounts and secrets** for the live E2E project.
- [ ] **Healthcare card** (the design is ready in `Card_design/`).
- [ ] **Merge PR #3** after review.
- [ ] **Native app:** work through the MOBILE APP tab, starting with MA-001 (the admin-settings fix), MA-002 and MA-003 (decisions), and the account setup.
