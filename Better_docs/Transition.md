# Transition.md: Clardentity web app → native iOS & Android

> The master reference for turning the Clardentity web app into iOS and Android apps.
> It assumes the reader knows nothing about this codebase.
>
> **Audit facts**
> - Commit audited: `75469fe` on `AdityaManojA/clardentity-mvp-mv` `main` (the fork of `clardentity/clardentity-mvp`), dated 2026-10-11.
> - Every directory listed here was walked and every route, router, model, config and env source was opened. Five parallel investigation passes produced the material. The load-bearing claims were then re-checked against the code by hand:
>   - Google sign-in accepts one audience: `backend/app/api/auth.py:324-326`
>   - tokens are kept in `localStorage`: `frontend/lib/auth.tsx:15-16`
>   - chat streams over `ReadableStream`: `frontend/lib/sse.ts:369`
>   - voice notes are uploaded as `recording.webm`: `frontend/components/upload/AudioRecorder.tsx:65,86`
>   - live calls connect straight to OpenAI: `frontend/lib/liveCall.ts:14`
>   - the reset link is built from `APP_URL`: `backend/app/workers/send_password_reset_email.py:17`
>   - account deletion exists: `backend/app/api/auth.py:376`
>   - `/admin/settings` has no admin check: `backend/app/api/admin.py:20-55`
>
> **Conventions**
> - Paths are relative to the repo root unless they start with a drive letter. Inside sections 2 and 6, frontend paths are relative to `frontend/`.
> - `file:line` citations reflect the files as read on 2026-10-11.
> - **ASSUMPTION:** marks anything inferred rather than read. Verify those before relying on them.
> - No secret values appear in this document. Secrets are named, never quoted. The scan found no real credentials in the repo (section 4).

---

## Contents

0. [Key findings: read this first](#0-key-findings-read-this-first)
1. [Project Overview](#1-project-overview)
2. [Full Codebase Inventory](#2-full-codebase-inventory)
3. [Backend & API Audit](#3-backend--api-audit)
4. [Environment Variables & Secrets](#4-environment-variables--secrets)
5. [Third-Party Integrations](#5-third-party-integrations)
6. [State Management & Data Flow](#6-state-management--data-flow)
7. [UI/UX & Design System](#7-uiux--design-system)
8. [Mobile Conversion Strategy Recommendation](#8-mobile-conversion-strategy-recommendation)
9. [Action Checklist: What I Need to Prepare](#9-action-checklist--what-i-need-to-prepare)
10. [Risks & Unknowns](#10-risks--unknowns)
11. [Suggested Migration Roadmap](#11-suggested-migration-roadmap)
12. [Additional knowledge: the product, the team's workflow and the fork](#12-additional-knowledge-the-product-the-teams-workflow-and-the-fork)
13. [Build, deploy, CI & compliance details](#13-build-deploy-ci--compliance-details)

---

## 0. Key findings: read this first

1. **The backend is already mobile-friendly at the transport level.**
   - It is a JSON + SSE API under `/api/v1` with **Bearer-JWT auth and no cookies anywhere** (`backend/app/api/deps.py:12-42`, no `set_cookie` in `backend/app`).
   - There is no SSR data fetching, no server sessions and no CSRF.
   - A native client can call the same endpoints the web app calls (section 3).
2. **The web app is a client-side React app hosted by Next.js.**
   - All 17 pages are client-rendered behind `RequireAuth` or are public marketing/legal pages.
   - There is no middleware, there are no `route.ts` handlers and no server actions (section 2.2).
   - That makes wrapping it (Capacitor) or porting its logic (React Native) both feasible.
3. **Mobile blockers that need backend work before any store build:**
   - **Google sign-in** checks the ID token against **one** client ID (`backend/app/api/auth.py:324-326`). Native iOS and Android client IDs will be rejected.
   - **Sign in with Apple does not exist.** **ASSUMPTION:** App Store guideline 4.8 requires it because Google sign-in is offered.
   - **There is no logout or per-device revocation.** The only revocation bumps a per-user version on password reset (`backend/app/api/auth.py:264`).
   - **There are no push notifications and no device registration.**
   - **Reset and welcome email links are plain web URLs** (`{APP_URL}/reset-password?token=…`). They need Universal Links / App Links.
4. **Three hard client features:**
   - **Streaming chat over a POST response** (`frontend/lib/sse.ts`). React Native's stock `fetch` cannot stream this; WKWebView can.
   - **Live voice calls over WebRTC straight to OpenAI Realtime** (`frontend/lib/liveCall.ts:14`).
   - **Voice notes recorded as `audio/webm`.** iOS cannot record that natively, and the backend rejects `.caf` and `.3gp` (`backend/app/api/audio.py:17`).
5. **Security issue to fix regardless of mobile.** `GET` and `PUT /api/v1/admin/settings` check only that the user is signed in (`backend/app/api/admin.py:20-55`). Any signed-in user can change global feature flags, the model and scoring weights. A follow-up task has been raised.
6. **Compliance status:**
   - **In place:** in-app account deletion (`DELETE /api/v1/auth/me`, UI in `frontend/components/profile/DeleteAccount.tsx`).
   - **Gaps:**
     - the privacy policy does not name Google (Gemini and Sign-In), xAI, ipapi.co or OpenAI image generation (`frontend/app/(legal)/privacy/page.tsx:115-128`)
     - Google sign-ups never record terms acceptance (`backend/app/api/auth.py:343-348`)
     - there is no whole-account data export
     - there is no billing code at all (no Stripe, StoreKit or Play Billing)
7. **Recommendation (section 8):**
   - **Ship v1 as a Capacitor app wrapping the existing Next.js client.** Add native plugins for secure token storage, Google and Apple sign-in, push, share and haptics.
   - **Do the backend hardening first** (section 11, phase 1).
   - **Keep React Native/Expo as the planned v2** if store review, performance or the voice stack demands it.
   - **Why:** the phone layout is already polished and covered by a 600+ test Playwright suite, including `e2e/devices.spec.ts` across 13 device sizes. All business logic lives in about 22.5k lines of client TypeScript (section 2).

---

## 1. Project Overview

### 1.1 What the app does (inferred from code)

Clardentity is an **AI "thinking companion" whose answers are fact-checked claim by claim.** A signed-in user asks a question in one of eight **cognitive modes** (`frontend/lib/modes.ts:16-113`):

| Mode value (API) | Label in UI | Notes |
|---|---|---|
| `knowing` | Finder | Default. Facts with sources (`frontend/lib/modes.ts:16-22`) |
| `decision` | Decision-making | Adds a bias watch-list and a "decision review" verdict box (`backend/app/api/chat.py:1196-1249`) |
| `thinking` | Thought coach | Optional `reasoning_lens` (11 lenses, `backend/app/services/router.py:11-23`) and a "thinking review" |
| `learning` | Learning | Adapts to a learning role: student, teacher or visiting (`PUT /profile/learning-role`) |
| `creative` | Co-Creative | Can generate images (OpenAI image model) and Office files. The only mode with a model picker (Claude, GPT, Gemini, Grok; `backend/app/services/model_catalog.py:34`) |
| `mentoring` | Mentoring | Preview (paid-tier) companion |
| `therapy` | Reflect & Relieve | Preview companion |
| `legal` | Legal | Preview companion |
| `rapid` | Quick answer | Not pickable. Used for the "Quick answer" fallback with no fact-check (`frontend/lib/modes.ts:126-141`) |

**What each answer comes with** (pipeline in `backend/app/services/answer_pipeline.py` and `backend/app/api/chat.py:799-1702`, detailed in section 3.5):
- **Streaming:** the answer is streamed (SSE) along with a one-line **crux** (the gist).
- **Claims and checking:** the answer is split into **claims**. Each claim is verified against the user's own documents (pgvector retrieval) and the web (Tavily), screened for cognitive biases, and scored.
- **Confidence:** the whole answer gets a **confidence band**: Likely Fact ≥90, Plausible ≥70, otherwise Needs Verification (`backend/app/services/confidence_scoring.py:315-379`).
- **Counterfactual:** a **devil's-advocate** version is written for every answer.
- **Pre-answer gates:** before answering, the system may stop and ask a **gate** question (refine the question, pick an option, give context, or switch mode).
- **Avatar:** an animated **companion avatar** reacts to the answer (expression and gesture cues).

**Other features found in code:**
- workspaces, each holding chats and **documents** (upload, then ingestion, then retrieval)
- full-text **history search** and attachment search
- conversation **branching** (edit, regenerate, sibling switcher)
- **export** of a chat to Markdown or PDF, and of one answer to docx, pptx or xlsx
- **voice**:
  - dictation through Whisper
  - read-aloud through TTS
  - live **voice calls** through the OpenAI Realtime API
- a **personality profile**:
  - inferred from chats
  - built from onboarding answers
  - importable from a ChatGPT, Claude or Gemini export
- a per-conversation **memory** summary
- companion **nicknames**
- a no-account **guest demo** on the landing page, whose transcript is imported into the account at sign-up
- an **admin dashboard** with usage, token spend and plain-English-to-SQL queries
- two **coachmark tours**
- **consent-gated PostHog analytics**
- installable **PWA** support (`frontend/public/sw.js`, `frontend/app/manifest.ts`)

**Target users.** ASSUMPTION, from the copy and modes:
- individuals who want trustworthy, sourced answers and help with thinking, decisions, learning and emotional reflection
- students and teachers, via the Learning roles
- people interested in the premium tiers "Clar Pro / Max / Ultra" (`backend/app/api/pro.py:35`, interest capture only)

### 1.2 Tech stack (exact versions)

**Frontend** (`frontend/package.json`, resolved in `frontend/package-lock.json`):

| Package | Version |
|---|---|
| next | 16.2.12 (App Router, Turbopack) |
| react / react-dom | 19.2.4 |
| typescript | 5.9.3 |
| tailwindcss + @tailwindcss/postcss | 4.3.3 (CSS-first config in `frontend/app/globals.css`; no `tailwind.config.*`) |
| posthog-js | 1.434.15 (lazy-loaded, consent-gated) |
| nspell, dictionary-en, dictionary-en-gb | 2.1.5 / 4.0.0 / 3.0.0 (client autocorrect) |
| @playwright/test, @axe-core/playwright | 1.64.0 / 4.13.0 |
| eslint, eslint-config-next | 9.39.5 / 16.2.12 |

No state library, no data-fetching library, no UI kit, no chart library and no Sentry are installed. Google Identity Services is loaded as a script tag, not an npm package.

**Backend** (`backend/requirements.txt`, `backend/Dockerfile`):

| Component | Version |
|---|---|
| Python | 3.12-slim (Docker) |
| FastAPI / Starlette / uvicorn | 0.140.0 / 1.3.1 / 0.51.0 |
| sse-starlette | 3.4.6 |
| Pydantic / pydantic-settings | 2.13.4 / 2.14.2 |
| SQLAlchemy (async) / asyncpg / Alembic / pgvector | 2.0.51 / 0.31.0 / 1.18.5 / 0.5.0 |
| Celery / redis-py | 5.6.3 / 8.0.1 |
| PyJWT / bcrypt / google-auth | 2.13.0 / 5.0.0 / 2.56.2 |
| openai | 2.48.0 |
| anthropic | **unpinned** (`backend/requirements.txt:91`) |
| boto3 | 1.43.56 |

### 1.3 High-level architecture

```
 ┌──────────────────────────── Clients ────────────────────────────┐
 │  Browser (desktop + phone layout) / installed PWA               │
 │  Next.js 16 client app (frontend/)                              │
 │   • tokens in localStorage • SSE via fetch ReadableStream       │
 │   • service worker (static cache only)                          │
 └───────┬───────────────┬────────────────────┬────────────────────┘
         │ HTTPS JSON +  │ GIS script          │ WebRTC (ephemeral key
         │ SSE, Bearer   │ (Google ID token)   │ minted by backend)
         ▼               ▼                     ▼
 ┌──────────────────┐ accounts.google.com  api.openai.com/v1/realtime/calls
 │ FastAPI backend  │                      PostHog EU (consented analytics)
 │ /api/v1 (Render, │
 │ Docker, standard)│──► Anthropic Claude (Opus/Sonnet/Haiku) ─ fallback ─► OpenAI
 │ + Celery worker  │──► OpenAI: embeddings, Whisper, TTS, images, Realtime secrets
 │ in same container│──► Google Gemini / xAI Grok (Co-Creative picker only)
 └───┬─────┬────┬───┘──► Tavily (web search) ─ ipapi.co (IP→city) ─ Resend (email)
     │     │    │
     ▼     ▼    ▼
 Supabase  Upstash   Supabase Storage (S3 API)
 Postgres  Redis     bucket clardentity-prod
 +pgvector (rate limits, (documents, generated images)
 (pooler)  Celery broker,
           quotas)
```

**Hosting** (`render.yaml`, `DEPLOYMENT.md`):
- **Backend:** one Render web service, `clardentity-backend`, Docker on the `standard` plan. Its `start.sh` runs migrations, then a background Celery worker, then uvicorn.
- **Database and Redis:** external. Supabase Postgres via the Supavisor pooler, and Upstash Redis.
- **Production app URL:** `https://clardentity.ai` (`render.yaml:103-104`).
- **Frontend host:** an older frontend is listed on Vercel (`DEPLOYMENT.md:13-15`). ASSUMPTION: the production frontend is hosted on Vercel, but no Vercel config is committed.
- **Deploys:** triggered manually through the Render API (`DEPLOYMENT.md:132-148`, `scripts/deploy-backend.sh`). Pushes do not auto-deploy.


---

## 2. Full Codebase Inventory

### 2.1 Repository tree (whole repo)

```
clardentity-mvp-mv/
├── frontend/            Next.js 16 web app (the client; all UI and client logic) - detailed tree below
├── backend/             FastAPI API + Celery worker (Python 3.12)
│   ├── app/main.py      App assembly: middleware, CORS, routers under /api/v1
│   ├── app/api/         20 routers + deps.py (auth dependencies): admin, admin_dashboard, audio, auth, biases,
│   │                    bootstrap, chat, compose, documents, guest, health, history, images, memory, pro,
│   │                    profile, realtime, validation, workspaces
│   ├── app/services/    46 service modules - the answer pipeline (answer_pipeline, anthropic_client,
│   │                    openai_client, guidance, retrieval, web_research, verification_agent,
│   │                    confidence_scoring, devils_advocate, reflection_agent, prompt_builder, ...),
│   │                    storage, email, geolocation, profile/memory, image generation, exports
│   ├── app/models/      SQLAlchemy models (15 tables) - user, workspace, conversation, message (+claims,
│   │                    evidence, citations, audio transcripts), document (+chunks), memory, profile,
│   │                    pro_interest, admin settings
│   ├── app/schemas/     Pydantic request/response schemas per router
│   ├── app/workers/     Celery tasks: ingest_document, rebuild_memory, rebuild_profile, refresh_location,
│   │                    send_welcome_email, send_password_reset_email
│   ├── app/core/        config (Settings), security (JWT/bcrypt), rate_limit, middleware, logging, celery_app
│   ├── app/db/          async engine/session (Supavisor pooler settings)
│   ├── app/data/        static reference data (bias taxonomy etc.)
│   ├── alembic/         27 migrations, one linear chain
│   ├── tests/           28 pytest files (API contract, pipeline, scoring, security, ...)
│   ├── Dockerfile       python:3.12-slim image
│   └── start.sh         migrate -> background Celery worker -> exec uvicorn
├── infra/docker-compose.yml   Local stack: Postgres+pgvector, Redis, MinIO, backend, worker
├── render.yaml          Render blueprint: one Docker web service + shared env group
├── DEPLOYMENT.md        How production is wired (Supabase, Upstash, Render, Vercel, Resend)
├── .env.example         Backend env template (only env file tracked)
├── .github/             workflows: e2e.yml (Playwright on PRs), e2e-visual-baselines.yml (manual),
│                        sync-upstream.yml (15-min upstream sync) + scripts/, SYNC_UPSTREAM.md
├── scripts/             deploy-backend.sh (Render API deploy), regression/smoke.py (prod smoke test)
├── evals/               LLM answer-quality eval harness (dataset, judge, evaluators, run.py)
├── docs/                SRS PDF, bias taxonomy PDFs, analytics.md, flow/sequence diagrams, call notes
├── Better_docs/         TECHNICAL_GUIDE.md, Mv.md (mobile-view log), GRAPHIFY_WORKFLOW.md, README.md
├── Card_design/         48 SVG card marks (12 concepts × 4 colour themes) - design source, unused by code
├── graphify-out/        Generated code knowledge graph (tooling; not part of the product)
└── .agents/ .claude/    Agent tooling config (rules, workflows, launch.json, skills)
```

The frontend tree in detail (paths relative to `frontend/`):


```
frontend/
  app/                         Next App Router routes, root layout, metadata files, global CSS
    (auth)/                    Route group (no URL segment, no layout) - signed-out auth forms
      login/page.tsx           Email/username + password login, Google button
      register/page.tsx        Sign-up (name optional, email, password, terms checkbox), Google button
      forgot-password/page.tsx Request a reset email
      reset-password/page.tsx  Redeem ?token= and set new password (signs you in)
    (legal)/                   Route group with its own layout (no auth, no app shell)
      layout.tsx               Sticky header (Wordmark, Privacy/Terms links, ThemeToggle)
      legal.tsx                Shared LegalPage / Section / Table typography helpers (not a route)
      privacy/page.tsx         Privacy policy (static, server component, has metadata)
      terms/page.tsx           Terms of service (static, server component, has metadata)
    admin/page.tsx             Admin dashboard (RequireAuth; server enforces admin via 404)
    chat/[conversationId]/page.tsx  The chat screen
    profile/page.tsx           Learned profile
    settings/page.tsx          Appearance / companion names / plan / delete account
    start/page.tsx             Post-sign-in router: POST /bootstrap then redirect into a chat
    welcome/page.tsx           First-run onboarding questions (3 optional free-text answers)
    workspace/page.tsx         Workspace list (supports ?enter=1)
    workspace/[id]/page.tsx    Workspace detail (chat list, new chat, delete workspace)
    workspace/[id]/documents/page.tsx  Attachments (upload/list/delete + full-text search)
    workspace/[id]/search/page.tsx     Chat history search
    page.tsx                   Landing page (marketing + guest demo)
    layout.tsx                 Root layout: fonts, metadata, viewport, providers, inline theme + SW scripts
    error.tsx                  Route error boundary -> FullScreenError
    global-error.tsx           Root-layout error boundary -> FullScreenError (own <html>/<body>)
    manifest.ts                PWA web manifest (served at /manifest.webmanifest)
    opengraph-image.png        File-based OG image
    twitter-image.png          File-based Twitter card image
    favicon.ico                Favicon
    globals.css                1239 lines: Tailwind v4 import, design tokens (light/dark x 4 accents), zoom, safe-area, utilities
  components/                  React components (all client components except a few presentational ones)
    admin/                     Admin dashboard, (unused) admin settings, hand-drawn SVG charts
    auth/                      Google button, password field with reveal, redirect-if-signed-in
    avatar/                    SVG companion avatar with states/gestures/visemes
    chat/                      Chat screen and everything inside it (27 files)
    marketing/                 Landing page, guest demo, hero animations
    profile/                   Profile page + settings sub-sections
    settings/                  Settings page container
    system/                    App shell, auth gate, notices, errors, analytics, consent, PWA install
    tour/                      Coachmark overlay
    ui/                        Primitives (Button, Input, Card...), MaskIcon
    upload/                    Audio recorder (dictation), document uploader
    workspace/                 Workspace list/detail/documents/search
  lib/                         Non-visual logic: API client, auth, SSE, stores, hooks, analytics
  types/nspell.d.ts            Ambient types for the nspell module
  public/                      Static assets
    dict/                      Hunspell dictionaries (en-US, en-GB) + common words + licenses, for autocorrect
    landing/                   Landing page SVG icons, logo dots, curtain-stage.webp
    ui/                        App SVG icons: composer (mic, dialpad, paperclip), 8 mode icons, nav icons, logo
    sw.js                      Service worker (installability; caches /_next/static only)
    icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png, favicon-32.png
    file.svg, globe.svg, next.svg, vercel.svg, window.svg   create-next-app leftovers (ASSUMPTION: unused)
  e2e/                         Playwright suite (mocked backend by default; `live` project hits real backend)
    fixtures.ts                Shared mockApi + sseBody helpers
    auth.setup.ts, auth-paths.ts  Saves live-account sessions for the `live` project
    web.spec.ts                Desktop T-nodes
    mobile.spec.ts, mobile-extras.spec.ts, screens.spec.ts, chat.spec.ts, gates.spec.ts, offline.spec.ts, devices.spec.ts
    a11y.spec.ts               axe-core WCAG A/AA scan on mobile layouts
    visual.spec.ts (+ -snapshots/)  Screenshot baselines (CI Docker only)
    live.spec.ts               Real backend + model
    warmup.ts                  Pre-compiles routes for local runs
    demo-api.mjs               In-memory stand-in backend for manual UI testing
    preflight-stub.mjs         Answers CORS OPTIONS on :8000 for WebKit
    ci-summary.mjs             GitHub job summary writer
    visual.css                 Stabilising CSS for screenshots
  next.config.ts               Security headers / CSP only
  playwright.config.ts         Projects: setup, web (Desktop Chrome), mobile-chrome, mobile-safari, live (Pixel 7); webServer = next dev/start + preflight stub on :8000
```

#### `lib/` file-by-file

| File | Purpose |
|---|---|
| `lib/apiClient.ts` | `apiFetch<T>()` JSON client, `API_BASE_URL`, `BACKEND_ROOT_URL`, `ApiError`, 3-second GET dedupe cache, 401->refresh->retry |
| `lib/auth.tsx` | Token storage, `refreshAccessToken()`, `AuthProvider`/`useAuth` (Context), `useHasStoredSession` (useSyncExternalStore), error-message helpers |
| `lib/serverWait.ts` | Cold-start detector store (`trackServerWait`, `useServerWait`) |
| `lib/sse.ts` | Chat stream types (`ChatMessage`, `Claim`, `Evidence`, ...), `streamChatMessage()`, `consumeChatStream()` SSE parser |
| `lib/liveCall.ts` | `LiveCall` class: WebRTC voice call directly to OpenAI Realtime |
| `lib/guestDemo.ts` | Landing-page guest chat stream (`POST /guest/chat`) + guest session id |
| `lib/guestHandoff.ts` | Stash guest transcript in localStorage, import into new account (`POST /guest/import`), store for "saved" notice |
| `lib/analytics.ts` | PostHog wrapper (lazy import, consent-gated, property sanitising) |
| `lib/consent.ts` | Analytics consent store (localStorage) |
| `lib/errorReport.ts` | Crash report via PostHog `error_reported` event (memory persistence) |
| `lib/theme.tsx` | Theme (light/dark) + accent store on `<html>` attributes, `THEME_INIT_SCRIPT`, `ThemeProvider`, `AccentScope`, `useAppearance` |
| `lib/tour.tsx` | Two coachmark tours (workspace, chat): definitions, store, `TourProvider` auto-start |
| `lib/previewAccess.ts` | Locked/paid-mode preview store (`/pro/preview`) |
| `lib/companionNames.ts` | Per-mode companion names store (`GET/PUT /profile`) |
| `lib/learningRole.ts` | Learning-mode role store (`GET /profile`, `PUT /profile/learning-role`) |
| `lib/pickableModels.ts` | Co-Creative model list (`GET /chat/models`) + chosen model per mode (localStorage) |
| `lib/modeSwitching.ts` | Smart vs manual mode-switching preference (localStorage) |
| `lib/modes.ts` | Static catalogue of the 8 modes (value, label, icon, copy), `DEFAULT_MODE = "knowing"`, `COMING_SOON_MODES` |
| `lib/lastWorkspace.ts` | Remember last workspace id (localStorage) |
| `lib/freshChats.ts` | In-memory set of just-created chat ids (layout hint) |
| `lib/greeting.ts` | Time-of-day greeting / welcome-back text, `isFirstRun` |
| `lib/autocorrect.ts` | nspell-based autocorrect for the composer (desktop/fine-pointer only) |
| `lib/text.ts` | `cleanMessageText` normaliser for the limited markup set |
| `lib/markdown.tsx` | Tiny inline/block markdown splitter+renderer (bold, italic, code, lists, pipe tables) |
| `lib/uiScale.ts` | Converts measured rects under CSS `zoom` (0.85 / 0.92) to layout px |
| `lib/useOnline.ts` | `navigator.onLine` hook |
| `lib/usePhoneLayout.ts` | `(max-width: 1023.98px)` hook - the "phone layout" switch |
| `lib/useTouchKeyboard.ts` | `(pointer: coarse) and (hover: none)` hook |
| `lib/useReducedMotion.ts` | `prefers-reduced-motion` hook (server snapshot = true) |
| `lib/useScrollEdges.ts` | Ref callback setting `data-more-start/end` for scroll fades |



### 2.2 Every page / route / screen

> Paths relative to `frontend/`.

No `middleware.ts` / `proxy.ts`. No `route.ts` route handlers. No `not-found.tsx`, no `loading.tsx`. Only one non-group layout (root) plus `(legal)/layout.tsx`. Every data fetch happens in the browser; server components only unwrap `params` and render client components.

| URL | File | Purpose | Auth-gated? | Client/Server | Main component |
|---|---|---|---|---|---|
| `/` | `app/page.tsx` | Marketing landing + guest demo | No (shows "Open" vs "Log in" from stored token, `app/page.tsx:12-17`) | Client (`"use client"`) | `LandingPage` (`components/marketing/LandingPage.tsx`) |
| `/login` | `app/(auth)/login/page.tsx` | Email/username + password login; `router.replace("/start")` on success (`:33`) | No; `RedirectIfSignedIn` bounces to `/start` if a refresh token is stored | Client | inline form + `GoogleSignInButton`, `PasswordInput` |
| `/register` | `app/(auth)/register/page.tsx` | Sign-up incl. required `accepted_terms` checkbox; -> `/start` (`:35`) | No; `RedirectIfSignedIn` | Client | inline form + `GoogleSignInButton` |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | `POST /auth/password-reset/request`; shows neutral "check your email" | No | Client | inline form |
| `/reset-password?token=` | `app/(auth)/reset-password/page.tsx` | `POST /auth/password-reset/confirm` -> tokens -> `/start`; handles missing token | No | Client (Suspense for `useSearchParams`) | `ResetPasswordForm` |
| `/welcome` | `app/welcome/page.tsx` | First-run 3 optional questions -> `POST /profile/onboarding`, `refresh()`, `resetTours()`, -> `/start` | Self-gated: no user -> `/login`; already onboarded -> `/start` (`:49-53`). Not wrapped in RequireAuth/AppShell | Client | inline wizard |
| `/start` | `app/start/page.tsx` | `POST /bootstrap` -> `router.replace(/chat/{id})` | `RequireAuth` | Server page -> client child | `StartChat` |
| `/workspace` | `app/workspace/page.tsx` | List/create workspaces; `?enter=1` auto-enters if exactly one (`WorkspaceList.tsx:45,69-71`) | `RequireAuth` | Server -> client (Suspense) | `WorkspaceList` |
| `/workspace/[id]` | `app/workspace/[id]/page.tsx` | Workspace detail: chats, new chat (with optional mode), delete workspace | `RequireAuth` | Server (async params) -> client | `WorkspaceDetail` |
| `/workspace/[id]/documents` | `app/workspace/[id]/documents/page.tsx` | Attachments: upload, list, delete, search | `RequireAuth` | Server -> client | `WorkspaceDocuments` (-> `DocumentUploader`, `AttachmentSearch`) |
| `/workspace/[id]/search` | `app/workspace/[id]/search/page.tsx` | Search chat history in workspace | `RequireAuth` | Server -> client | `WorkspaceSearch` (-> `HistorySearch`) |
| `/chat/[conversationId]` | `app/chat/[conversationId]/page.tsx` | The chat | `RequireAuth` | Server -> client | `ChatView` |
| `/profile` | `app/profile/page.tsx` | Learned profile (aspects, roles, import history, rebuild, delete) | `RequireAuth` | Server -> client | `ProfileView` |
| `/settings` | `app/settings/page.tsx` | Appearance, companion names, plan, install app, delete account | `RequireAuth` | Server -> client | `SettingsView` |
| `/admin` | `app/admin/page.tsx` | Admin analytics dashboard + NL query; metadata title "Admin · Clardentity" | `RequireAuth` only; real gate is server (`/admin/overview` 404s for non-admins, comment `:7-10`). Sidebar link only if `user.is_admin` (`AppShell.tsx:725`) | Server -> client | `AdminDashboard` |
| `/privacy` | `app/(legal)/privacy/page.tsx` | Privacy policy (has `metadata`, `mailto:` contact) | No | Server | `LegalPage` |
| `/terms` | `app/(legal)/terms/page.tsx` | Terms of service | No | Server | `LegalPage` |
| `/manifest.webmanifest` | `app/manifest.ts` | PWA manifest: name/short_name "Clardentity", `start_url: /workspace`, `scope: /`, `display: standalone`, bg/theme `#121013`, `orientation: any`, icons 192/512/maskable-512 | - | Metadata route | - |
| OG/Twitter image | `app/opengraph-image.png`, `app/twitter-image.png` | File-based metadata images; `metadataBase` `https://clardentity.ai` (`app/layout.tsx:64`) | - | static | - |
| (error) | `app/error.tsx` | Route-level error -> `FullScreenError onRetry={reset}` | - | Client | `FullScreenError` |
| (global error) | `app/global-error.tsx` | Root-layout error; own `<html><body>` + globals.css | - | Client | `FullScreenError` |

#### Root layout (`app/layout.tsx`)
- Fonts via `next/font/google`: Geist, Geist_Mono, Outfit (landing typeface) as CSS variables (`:24-41`).
- `metadata` (`:43-73`): title "Clardentity", description, `manifest: /manifest.webmanifest`, `appleWebApp { capable, title, statusBarStyle: "black-translucent" }`, icons (`/icon.svg`, `/favicon-32.png`, apple `/apple-touch-icon.png` 180), OpenGraph, Twitter `summary_large_image`.
- `viewport` (`:75-91`): `viewportFit: "cover"`, `interactiveWidget: "resizes-content"`, `themeColor` light `#f5f3f4` / dark `#121013`.
- Inline `<head>` scripts: `THEME_INIT_SCRIPT` (sets `data-theme`, `data-accent` pre-paint, `lib/theme.tsx:34-54`) and SW registration of `/sw.js` on `load` (`:16-22`).
- Provider tree (`:114-125`): `ThemeProvider > AuthProvider > TourProvider > { AccentScope, children, TourOverlay, Analytics, ConsentBanner, ServerWakingNotice }`.
- The app shell (sidebar/topbar) is NOT in the layout: it is applied per route by `RequireAuth` -> `AppShell`.

#### `next.config.ts`
Only `headers()` for `source: "/(.*)"` (`:97-101`). No rewrites, redirects, `images` config, `output` mode (default, i.e. a Node `next start` server - ASSUMPTION: deployed on a Node host/Vercel-like platform), no `basePath`, no i18n.
Security headers (`:79-95`):
- `Content-Security-Policy` (`:56-77`, no nonces, `'unsafe-inline'` scripts allowed):
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' [+ 'unsafe-eval' in dev] https://accounts.google.com https://*.posthog.com`
  - `style-src 'self' 'unsafe-inline' https://accounts.google.com`
  - `img-src 'self' data: blob: {API origin} https://*.googleusercontent.com`
  - `font-src 'self' data:`; `media-src 'self' blob: {API origin}`
  - `connect-src 'self' {API origin} https://*.posthog.com https://api.openai.com https://accounts.google.com [+ ws: wss: in dev] [+ $CSP_EXTRA_CONNECT_SRC]`
  - `frame-src https://accounts.google.com`; `worker-src 'self' blob:`; `manifest-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`; `upgrade-insecure-requests` only when API is https and not dev.
  - API origin derived from `NEXT_PUBLIC_API_URL` ?? `NEXT_PUBLIC_BACKEND_URL + /api/v1` ?? `http://localhost:8000/api/v1` (`:29-39`).
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`.

#### Service worker (`public/sw.js`)
Cache name `clardentity-shell-v12` (`:46`). Precaches `/icon-192.png`, `/icon-512.png`. Ignores non-GET, cross-origin, `/api/*`, and navigations. `/_next/static/*` cache-first; other same-origin static assets stale-while-revalidate. Not an offline mode. (Irrelevant for native; native needs no SW.)

#### Navigation graph (from `href`/`router.*` grep)
- Sign-in entry points (login, register, reset, Google, RedirectIfSignedIn, welcome finish) all `replace("/start")`.
- `/start` -> `replace(/chat/{conversation_id})` (`StartChat.tsx:58`).
- `RequireAuth`: no user -> `replace("/login")`; `onboarding_completed_at === null` -> `replace("/welcome")` (`RequireAuth.tsx:31-40`).
- AppShell sidebar: new chat (`POST /chat/conversations` -> `/chat/{id}`, falls back to `/start` with no workspace, `AppShell.tsx:649-660`), recents -> `/chat/{id}`, "Chats" -> `/workspace/{id}/search`, Attachments -> `/workspace/{id}/documents` (`:705`), workspace switcher -> `/workspace/{id}` or `/workspace`, Admin -> `/admin` (only `is_admin`), logo -> `/`.
- AccountMenu: `/profile`, `/settings`, Upgrade (opens `PlanTiers`/`UpgradeDialog`), Log out (`logout()`).
- Delete account -> `replace("/")`; delete workspace -> `replace("/workspace")`.
- Drawer uses `history.pushState({clardentityDrawer})` so Android Back closes it (`AppShell.tsx:570-585`).


### 2.3 Every reusable component

> Paths relative to `frontend/`. "Logic-heavy" = fetches, holds app state or calls APIs.

Legend: **P** = presentational (props in, callbacks out, no API/app-state). **B** = business-logic heavy (fetches, owns domain state, uses stores/Context).

#### `components/system/`
| Name | File | Purpose | P/B |
|---|---|---|---|
| `AppShell` | `components/system/AppShell.tsx:374` | Signed-in chrome: desktop sidebar (collapsible) + phone drawer (swipe-to-close, focus trap, history entry), topbar with breadcrumbs, new-chat button, tour replay button, ThemeToggle; hosts `AppNotices`, `OfflineNotice`, `ErrorBoundary`. Internal subcomponents: `RecentConversations` (`:118`, GET recents), `NavItem` (`:233`), `WorkspaceSwitcher` (`:274`), `Breadcrumbs`/`Crumbs` (`:968`,`:1038`, GET conversation for title). Listens for `clardentity:open-nav`/`close-nav`/`conversation-renamed` events | B |
| `RequireAuth` | `components/system/RequireAuth.tsx:19` | Auth + onboarding gate; wraps children in `AppShell` | B (auth Context) |
| `AccountMenu` | `components/system/AccountMenu.tsx:63` | Sidebar-foot account card menu: Profile, Settings, Upgrade (PlanTiers view), Log out | B (useAuth, router) |
| `PlanTiers`, `GemIcon`, `PLAN_TIERS` | `components/system/PlanTiers.tsx:103,73,36` | Static Clar Pro/Max/Ultra plan cards; `onLocked` callback | P |
| `AppNotices` | `components/system/AppNotices.tsx:24` | "Welcome back" pill (once per tab via sessionStorage) + "Your demo conversation is saved" (triggers `importStashedTranscript()`) | B |
| `Analytics` | `components/system/Analytics.tsx:12` | Sends `app_opened`, `$pageview` (route pattern), `identify(user.id)`, `signed_in`; resets identity on logout/consent withdrawal. Renders null | B |
| `ConsentBanner` | `components/system/ConsentBanner.tsx:18` | Allow / No thanks analytics banner; only if `NEXT_PUBLIC_POSTHOG_KEY` set and consent unset | B (consent store) |
| `ErrorBoundary` | `components/system/ErrorBoundaries.tsx:32` | Class error boundary; phone layout shows inline "Try again" + "Report" sheet (PostHog crash report, copy ref to clipboard); desktop rethrows | B |
| `FullScreenError` | `components/system/FullScreenError.tsx:12` | Whole-app failure screen (avatar, Reload, link to `/start`) | P |
| `ServerWakingNotice` | `components/system/ServerWakingNotice.tsx:9` | Phone-only notice while backend cold-starts (`useServerWait`) | B (store) |
| `OfflineNotice` | `components/system/OfflineNotice.tsx:9` | Pill when `navigator.onLine` false | P-ish (hook) |
| `InstallAppButton` | `components/system/InstallAppButton.tsx:44` | PWA install: `beforeinstallprompt` prompt or iOS Share-sheet instructions; hidden when standalone | B (browser APIs) - drop for native |
| `ThemeToggle` | `components/system/ThemeToggle.tsx:13` | Sun/moon toggle calling `toggleTheme()` | P (writes theme store) |
| `Wordmark` | `components/system/Wordmark.tsx:12` | Logo + name, links `/` | P |
| `HealthStatus` | `components/system/HealthStatus.tsx:18` | GETs `{BACKEND_ROOT_URL}/health` and shows status. **Not imported anywhere (dead code)** | B |

#### `components/auth/`
| Name | File | Purpose | P/B |
|---|---|---|---|
| `GoogleSignInButton` | `components/auth/GoogleSignInButton.tsx:32` | Loads GIS script, renders Google button, posts ID token to `/auth/oauth/google`, stores tokens, `refresh()`, -> `/start`. Renders nothing without `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | B |
| `PasswordInput` | `components/auth/PasswordInput.tsx:13` | Password field with show/hide | P |
| `RedirectIfSignedIn` | `components/auth/RedirectIfSignedIn.tsx:24` | If a refresh token exists, `replace("/start")` | B (session store) |

#### `components/chat/`
| Name | File | Purpose | P/B |
|---|---|---|---|
| `ChatView` | `components/chat/ChatView.tsx:90` | **The chat controller.** Loads conversation+messages, owns messages/streaming/mode/gates/draft state, sends via SSE, handles gates (mode suggestion, context question, refined question, clarifying options), smart switching, quick answer (`rapid` mode), stop/abort, stall watchdog (45s) + drop recovery, regenerate/edit (forks), branch switching, delete message, TTS playback, live call + transcript save, upsell for locked modes, analytics | B (heaviest) |
| `MessageList` | `components/chat/MessageList.tsx:54` | Renders thread: user/assistant bubbles, streaming bubble, crux, markdown, citation pills, confidence badge, sources, reviews, feedback, flip (devil's draft), export, listen, edit/regenerate/delete, fork switcher, per-chat scroll restore (sessionStorage) | Mostly P (callbacks), but embeds B children (Feedback, Export, ResponseFlip) |
| `MessageInput` | `components/chat/MessageInput.tsx:85` | Composer: autosizing textarea, attachments (FileReader -> base64; images <=5MB, docs <=25MB, extension whitelist `:41-46`), mic (`AudioRecorder`), live-call button, model picker (Co-Creative), autocorrect, ghost completion (`POST /compose/complete` after 650ms idle, `:163-196`), send/stop. Also exports `PendingAttachment`, `DOCUMENT_EXTENSIONS`, `DOCUMENT_ACCEPT`, `attachmentProblem()` | B |
| `ModeSelector` | `components/chat/ModeSelector.tsx:22` | 8-mode picker (rail/segmented), lock badges from `useLockedModes`, custom companion names | B (stores) |
| `ModeCarousel`, `groupByMode` | `components/chat/ModeCarousel.tsx:94,30` | Splits a mixed-mode thread into per-mode swipeable tracks | P |
| `ModeSwitchToast` | `components/chat/ModeSwitchToast.tsx:20` | "Switched to X" toast with 4s ring and "Stay in Y" | P |
| `ChatGreeting` | `components/chat/ChatGreeting.tsx:32` | Time-of-day greeting for empty chat | P (useAuth for name) |
| `StartChat` | `components/chat/StartChat.tsx:24` | `POST /bootstrap` and redirect; retry UI | B |
| `ChatRowMenu` | `components/chat/ChatRowMenu.tsx:54` | "..." menu on chat rows: rename, pin, move to workspace (PATCH), delete (DELETE) | B |
| `CitationPopover` | `components/chat/CitationPopover.tsx:134` | `[n]` pill popover showing evidence excerpt/scores/credibility | P |
| `SourcesFooter`, `collectSources` | `components/chat/SourcesFooter.tsx:76,29` | Source cards at answer foot (web links open new tab) | P |
| `ConfidenceBadge` | `components/chat/ConfidenceBadge.tsx:42` | Confidence band badge with breakdown | P |
| `CruxCard` | `components/chat/CruxCard.tsx:14` | One-sentence bottom line card | P |
| `OpinionMarker` | `components/chat/OpinionMarker.tsx:11` | Inline "opinion" tag with tap explanation | P |
| `ClarifierCard` | `components/chat/ClarifierCard.tsx:16` | Post-answer question with 1-4 numbered options | P |
| `ClarifyingOptionsCard` | `components/chat/ClarifyingOptionsCard.tsx:22` | Pre-answer gate: question + tappable options / typed answer / skip | P |
| `ContextQuestionCard` | `components/chat/ContextQuestionCard.tsx:21` | Pre-answer gate: open "why" question + "answer without this" | P |
| `RefinedQuestionCard` | `components/chat/RefinedQuestionCard.tsx:14` | Pre-answer gate: suggested rewording, accept/keep | P |
| `GuidanceCard` | `components/chat/GuidanceCard.tsx:17` | Faint post-answer suggestions (better mode, refined question) | P |
| `DecisionReview` | `components/chat/DecisionReview.tsx:68` | Decision-mode verdict panel | P |
| `ThinkingReview` | `components/chat/ThinkingReview.tsx:18` | Thought-coach sound vs biased approaches panel | P |
| `GeneratedImageCard`, `GeneratedImagePlaceholder` | `components/chat/GeneratedImageCard.tsx:18,58` | Co-Creative image `<img src={API}/images/{owner}/{id}.webp>` (unauthenticated URL; uuid is the capability, `:19-23`) | P |
| `ResponseFlip`, `FlipButton`, `FlipIcon`, `useCounterfactual` | `components/chat/ResponseFlip.tsx:86,180,22,46` | Flip answer to "Devil's Draft"; fetches `POST .../devils-advocate` if not shipped with message | B (hook fetches) |
| `FeedbackWidget` | `components/chat/FeedbackWidget.tsx:23` | Thumbs + comment, `PUT .../feedback` | B |
| `ExportFileMenu` | `components/chat/ExportFileMenu.tsx:22` | Co-Creative: export answer as docx/pptx/xlsx (raw fetch, blob download via object URL + `<a download>`) | B |
| `ThinkingIndicator` | `components/chat/ThinkingIndicator.tsx:47` | Rabbit mascot + "Thinking"/label | P |
| `LearningRoleCard` | `components/chat/LearningRoleCard.tsx:41` | First-time Learning mode: student/teacher | B (learningRole store) |
| `LiveCallOverlay` | `components/chat/LiveCallOverlay.tsx:27` | Full-screen live voice call UI (avatar visemes, mute, end); returns transcript turns on unmount | B (owns `LiveCall`) |
| `UpgradeDialog` | `components/chat/UpgradeDialog.tsx:64` | Bento upsell; "Skip for now" opens preview (`POST /pro/preview`), hand back (`DELETE`), register interest (`POST /pro/interest`) | B |
| `VendorModelPicker` | `components/chat/VendorModelPicker.tsx:31` | Co-Creative model picker (GET `/chat/models`, choice in localStorage) | B |

#### `components/marketing/`
| Name | File | Purpose | P/B |
|---|---|---|---|
| `LandingPage` | `components/marketing/LandingPage.tsx:244` | Figma-derived landing (nav with Log in/Open, hero stage with curtain, mode cards, how-it-works, footer links); CTA `/start` if signed in else `/register` (`:245`); mounts `GuestDemo` (`:663`) | P-ish (analytics only) |
| `GuestDemo` | `components/marketing/GuestDemo.tsx:182` | Real chat UI for guests: reuses `MessageInput`, `MessageList`, `ModeSelector`, gate cards, `ModeSwitchToast`; streams `POST /guest/chat`; history kept client-side; budget/limit -> stash transcript + sign-up CTA; gated features (call, etc.) emit `guest_demo_gated` | B |
| `HeroComposer` | `components/marketing/HeroComposer.tsx:63` | Animated typing demo in hero | P |
| `CurtainShimmer` | `components/marketing/CurtainShimmer.tsx:92` | Pointer-reactive curtain shimmer (rAF) | P |
| `CardEmboss` | `components/marketing/CardEmboss.tsx:163` | Decorative SVG emboss in cards | P |
| `Reveal` | `components/marketing/Reveal.tsx:17` | IntersectionObserver scroll-in reveal | P |

#### `components/profile/` and `components/settings/`
| Name | File | Purpose | P/B |
|---|---|---|---|
| `ProfileView` | `components/profile/ProfileView.tsx:44` | `GET /profile`, add/delete aspects, rebuild, delete profile, import history; sections Conversation History / Learned Profile Facts / Occupational Roles | B |
| `AspectList` | `components/profile/AspectList.tsx:39` | List of learned facts with add/remove | P (callbacks) |
| `ImportHistory` | `components/profile/ImportHistory.tsx:29` | Upload ChatGPT/Claude/Gemini export (multipart `POST /profile/import`, manual 401 refresh) | B |
| `ProfileSection`, `OutlineButton` | `components/profile/ProfileSection.tsx:14,47` | Section layout band + outline button | P |
| `Appearance` | `components/profile/Appearance.tsx:14` | Theme + 4 accents (burgundy, indigo, teal, plum) | B (theme store) |
| `CompanionNames` | `components/profile/CompanionNames.tsx:28` | Rename each mode's companion (`PUT /profile`) | B |
| `DeleteAccount` | `components/profile/DeleteAccount.tsx:12` | Two-click confirm `DELETE /auth/me`, logout, -> `/` | B |
| `SettingsView` | `components/settings/SettingsView.tsx:23` | Sections: Appearance, Companion Naming, Your Plan (UpgradeDialog, InstallAppButton), Account Termination | B (composition) |

#### `components/workspace/`
| Name | File | Purpose | P/B |
|---|---|---|---|
| `WorkspaceList` | `components/workspace/WorkspaceList.tsx:39` | GET/POST `/workspaces`, inline create card, `?enter=1` auto-enter | B |
| `WorkspaceDetail` | `components/workspace/WorkspaceDetail.tsx:37` | Workspace + its chats; new chat with mode; delete workspace; row menu | B |
| `WorkspaceDocuments` | `components/workspace/WorkspaceDocuments.tsx:12` | Loads workspace; hosts uploader + attachment search | B |
| `WorkspaceSearch` | `components/workspace/WorkspaceSearch.tsx:11` | Loads workspace; hosts `HistorySearch` | B |
| `HistorySearch` | `components/workspace/HistorySearch.tsx:40` | `GET /history/search` results linking to chats | B |
| `AttachmentSearch` | `components/workspace/AttachmentSearch.tsx:30` | `GET /documents/search` (workspace or conversation scope) | B |

#### `components/upload/`
| Name | File | Purpose | P/B |
|---|---|---|---|
| `AudioRecorder` | `components/upload/AudioRecorder.tsx:27` | Mic dictation: `MediaRecorder` -> webm blob -> multipart `POST /audio/transcribe`; handles `heard_speech=false` and unexpected language notices | B |
| `DocumentUploader` | `components/upload/DocumentUploader.tsx:26` | List (`GET /documents?workspace_id`), upload (multipart `POST /documents/upload` with `workspace_id`,`file`), delete | B |

#### `components/admin/`
| Name | File | Purpose | P/B |
|---|---|---|---|
| `AdminDashboard` | `components/admin/AdminDashboard.tsx:82` | `GET /admin/overview` (tokens by user/mode/model, daily usage, users) + "Ask for a view" `POST /admin/query` | B |
| `AdminSettings` | `components/admin/AdminSettings.tsx:77` | Model params, scoring weights, gesture map, feature flags (`tts_enabled`, `image_input_enabled`, `bias_screening_enabled`) via `GET/PUT /admin/settings`. **Not imported anywhere (dead code)** | B |
| `DonutChart`, `BarChart`, `LineChart`, `paletteColor`, `formatTokens` | `components/admin/Charts.tsx` | Hand-drawn SVG charts | P |

#### `components/avatar/`, `components/tour/`, `components/ui/`
| Name | File | Purpose | P/B |
|---|---|---|---|
| `AvatarPanel` | `components/avatar/AvatarPanel.tsx:117` | SVG companion with states (`idle/listening/thinking/speaking/reacting`), gestures, expressions, viseme mouth; CSS animations | P |
| `TourOverlay` | `components/tour/TourOverlay.tsx:47` | Coachmark ring + callout positioned on `data-tour` targets (uses `uiScale`), opens/closes drawer via custom events | B (tour store) |
| `cx`, `Card`, `CardHeader`, `Button`, `Input`, `Textarea`, `Field`, `Badge`, `PageHeader`, `EmptyState`, `Spinner` | `components/ui/primitives.tsx` | Design-system primitives | P |
| `MaskIcon` | `components/ui/MaskIcon.tsx:15` | SVG used as CSS mask, colored by `currentColor` | P |

#### `app/(legal)/legal.tsx`
`LegalPage`, `Section`, `Table` - presentational typography for the legal pages.


### 2.4 Browser-only API usage (needs mobile replacements)

> Paths relative to `frontend/`.

#### Table, grouped by file

| File:line | API | What it does there | Mobile replacement |
|---|---|---|---|
| **app/layout.tsx** | | | |
| app/layout.tsx:16-22, 109 | `navigator.serviceWorker.register('/sw.js')` on `window` `load` (inline `<head>` script) | Registers the PWA service worker. | Drop it. Native apps bundle their JS (or use OTA updates such as expo-updates). |
| app/layout.tsx:108 | Inline `THEME_INIT_SCRIPT` (see lib/theme.tsx) | Sets the theme before first paint. | Read the theme from AsyncStorage/MMKV before the splash screen hides, then use `Appearance` / `useColorScheme`. |
| **lib/theme.tsx** | | | |
| lib/theme.tsx:37-50 | `localStorage.getItem` (theme, accent, token), `matchMedia('(prefers-color-scheme: dark)')`, `location.pathname`, `document.documentElement.dataset.theme/accent`, `style.colorScheme` | Head script that applies the theme and accent before paint. | `Appearance.getColorScheme()`, a theme context, and persisted prefs in MMKV/AsyncStorage. |
| lib/theme.tsx:57-64 | `document.documentElement.dataset` / `style.colorScheme` | `applyTheme` / `currentTheme`. The `<html>` attribute is the single source of truth. | A theme context or store (zustand or similar) feeding a tokens object. |
| lib/theme.tsx:77, 148, 154 | `localStorage.setItem` | Saves the theme and accent choice. | AsyncStorage/MMKV. |
| lib/theme.tsx:101, 110, 131 | `localStorage.getItem` | Accent rule: the landing page is forced to burgundy unless the user is signed in. Also reads the stored accent. | AsyncStorage/MMKV (the landing-only rule probably does not apply in the native app). |
| lib/theme.tsx:115-122 | `document.documentElement.dataset.accent` | Applies the accent. | Theme context. |
| lib/theme.tsx:144, 165-166 | `window.dispatchEvent(new CustomEvent('clardentity:appearance'))` plus a listener | Notifies React subscribers when appearance changes. | Store subscription or EventEmitter. |
| lib/theme.tsx:149, 181 | `window.location.pathname` | Accent rule depends on the route. | Navigation state (`useRoute` / expo-router `usePathname`). |
| lib/theme.tsx:189-194 | `matchMedia('(prefers-color-scheme: dark)').addEventListener('change')` | Follows the OS until the user picks a theme. | `Appearance.addChangeListener`. |
| **lib/auth.tsx** | | | |
| lib/auth.tsx:15-16, 20, 25 | `localStorage.getItem('clardentity_access_token' / 'clardentity_refresh_token')` | Reads the JWT access and refresh tokens. | **expo-secure-store** / iOS Keychain / Android Keystore (react-native-keychain). Must not go in AsyncStorage. |
| lib/auth.tsx:30-31, 37-38 | `localStorage.setItem/removeItem` | Writes and clears the tokens. | SecureStore. |
| lib/auth.tsx:46-49 | `window.addEventListener('storage')` | Syncs sign-in and sign-out across tabs. | Not needed (a native app has one instance). Use an in-memory listener set. |
| lib/auth.tsx:176 | `matchMedia('(max-width: 1023.98px)')` | Phone layout gets a 60s retry loop on `/auth/me` while a cold backend wakes up. | Always phone: apply the retry policy unconditionally. Pair it with NetInfo. |
| **lib/consent.ts** | | | |
| lib/consent.ts:14, 23, 46, 58 | `localStorage` key `clardentity-consent` | Analytics consent: `granted`, `denied` or `unset`. | AsyncStorage/MMKV. iOS also needs App Tracking Transparency only if tracking applies. **ASSUMPTION:** PostHog with `person_profiles: identified_only` and no IDFA does not need ATT, but the App Store privacy label must still list analytics. |
| **lib/analytics.ts / lib/errorReport.ts** | | | |
| lib/analytics.ts:123-141 | dynamic `import('posthog-js')`, `posthog.init` with no `persistence` option | PostHog web SDK. **ASSUMPTION:** the default persistence (`localStorage+cookie`) writes `ph_<key>_posthog` to localStorage and a cookie. | `posthog-react-native`. |
| lib/errorReport.ts:21 | `crypto.getRandomValues` | 8-hex error reference such as "7F3A-C21D". | `expo-crypto` `getRandomBytes`, or the `react-native-get-random-values` polyfill. |
| lib/errorReport.ts:33-52 | `posthog.init({persistence:'memory'})`, `window.location.pathname` | Sends a crash report. | posthog-react-native plus the navigation route. Also consider Sentry or Crashlytics. |
| **lib/guestDemo.ts** | | | |
| lib/guestDemo.ts:14, 28-31 | `localStorage` key `clardentity.guest.session`, `crypto.randomUUID()` | Persistent guest-demo session id, so the allowance survives a reload. | `expo-crypto.randomUUID()` and AsyncStorage. |
| lib/guestDemo.ts:36 | `crypto.randomUUID()` | Fallback id when storage is blocked. | expo-crypto. |
| **lib/guestHandoff.ts** | | | |
| lib/guestHandoff.ts:23, 61, 71, 95 | `localStorage` key `clardentity.guestTranscript` (JSON, 24h max age, line 28) | Stores the guest demo transcript so it can be imported after sign-up. | AsyncStorage/MMKV. |
| **lib/lastWorkspace.ts** | | | |
| lib/lastWorkspace.ts:5, 9, 17 | `localStorage` key `clardentity-last-workspace` | Last workspace id, used as the default for a new chat. | AsyncStorage/MMKV. |
| **lib/modeSwitching.ts** | | | |
| lib/modeSwitching.ts:13, 28, 39 | `localStorage` key `clardentity-mode-switching` (`smart` / `manual`) | Smart mode-switching preference. | AsyncStorage/MMKV. |
| **lib/pickableModels.ts** | | | |
| lib/pickableModels.ts:30, 53, 80 | `localStorage` key `clardentity.model.choice` (JSON map mode -> model) | Chosen vendor model per mode. | AsyncStorage/MMKV. |
| **lib/tour.tsx** | | | |
| lib/tour.tsx:153, 174, 206 | `localStorage` key `clardentity-tour` (JSON `{active, stepIndex, done}`) | Onboarding tour progress. | AsyncStorage/MMKV, plus a native coach-mark library (for example react-native-copilot). |
| **lib/sse.ts** | | | |
| lib/sse.ts:293 | `fetch(... /chat/{id}/messages)` that returns a streamed body | Chat streaming over SSE-format text on a POST. There is no `EventSource`. | RN's `fetch` does **not** expose `ReadableStream` bodies. Use `react-native-sse`, `expo/fetch` (SDK 52+ supports streaming), or XHR `onprogress` chunk parsing. |
| lib/sse.ts:366-370 | `ReadableStream.getReader()`, `TextDecoder` | Parses the stream. | `expo/fetch` streaming plus a TextDecoder polyfill (`text-encoding`), or `react-native-sse`. |
| **lib/liveCall.ts** | | | |
| lib/liveCall.ts:46 | `navigator.languages` | Sends a locale hint so the realtime voice can match the accent. | `expo-localization` `getLocales()`. |
| lib/liveCall.ts:14, 141 | `fetch('https://api.openai.com/v1/realtime/calls')` with an SDP body | WebRTC signalling to OpenAI Realtime using an ephemeral secret minted at lib/liveCall.ts:57 (`/realtime/session`). | Same HTTP call from RN. |
| lib/liveCall.ts:110 | `navigator.mediaDevices.getUserMedia({audio:{echoCancellation,noiseSuppression,autoGainControl}})` | Microphone for the live voice call. | `react-native-webrtc` `mediaDevices.getUserMedia`. Needs `NSMicrophoneUsageDescription` and Android `RECORD_AUDIO`. Set the audio session category (playAndRecord) through react-native-incall-manager or expo-av. |
| lib/liveCall.ts:93, 115-148 | `RTCPeerConnection`, `createDataChannel('oai-events')`, `createOffer` | WebRTC peer to OpenAI Realtime. | `react-native-webrtc` (requires an Expo dev client / config plugin; not available in Expo Go). |
| lib/liveCall.ts:95, 191-197 | `new Audio()` with `srcObject = stream`, `autoplay` | Plays the remote voice track. | react-native-webrtc plays remote audio tracks automatically. Route to the speaker with InCallManager. |
| lib/liveCall.ts:96, 200 | `AudioContext` / `webkitAudioContext` and an AnalyserNode | Reads the voice amplitude to animate the avatar's mouth. | No Web Audio in RN. Options: `react-native-audio-api` (Software Mansion), WebRTC stats `audioLevel` polling, or fake the lip-sync from speaking events. |
| lib/liveCall.ts:262-283 | `requestAnimationFrame` loop | Mouth-amplitude animation. | Reanimated shared values / `useFrameCallback`. |
| **lib/autocorrect.ts** | | | |
| lib/autocorrect.ts:33-51 | `fetch('/dict/en-us.aff' ...)` (about 1.2MB of dictionaries) | Lazy-loads Hunspell dictionaries for in-composer autocorrect and ghost suggestions. | Drop it. The native keyboard autocorrects (`autoCorrect`, `spellCheck` on TextInput). The feature is already disabled for touch (next row). |
| lib/autocorrect.ts:76 | `matchMedia('(pointer: fine)')` | Autocorrect runs only with a fine pointer, so it is already off on phones. | N/A. |
| **lib/uiScale.ts** | | | |
| lib/uiScale.ts:24 | `getComputedStyle(document.documentElement).zoom` | Reads the root CSS zoom (0.85 or 0.92). | N/A. There is no root zoom in RN. Scale tokens directly (see section 3.8). |
| lib/uiScale.ts:35 | `window.addEventListener('resize')` | Invalidates the measured scale. | `useWindowDimensions`. |
| lib/uiScale.ts:46-58 | `document.createElement('div')` probe and `getBoundingClientRect` | Measures the zoom factor per engine (iOS WebKit and Chromium disagree). | `onLayout` / `measureInWindow`. The zoom problem goes away. |
| lib/uiScale.ts:93 | `window.innerWidth/innerHeight` | Viewport in layout pixels. | `useWindowDimensions` / `useSafeAreaFrame`. |
| **lib/useOnline.ts** | | | |
| lib/useOnline.ts:10-21 | `online`/`offline` events, `navigator.onLine` | Network status for OfflineNotice and holding drafts. | `@react-native-community/netinfo`. |
| **lib/usePhoneLayout.ts** | | | |
| lib/usePhoneLayout.ts:6-15 | `matchMedia('(max-width: 1023.98px)')` | Phone vs desktop layout switch in JS. | Always true on a phone. For tablets use `useWindowDimensions().width < 1024`. |
| **lib/useReducedMotion.ts** | | | |
| lib/useReducedMotion.ts:5-14 | `matchMedia('(prefers-reduced-motion: reduce)')` | Disables animations. | `AccessibilityInfo.isReduceMotionEnabled()` + `reduceMotionChanged`, or Reanimated `useReducedMotion()`. |
| **lib/useScrollEdges.ts** | | | |
| lib/useScrollEdges.ts:24-34 | `scroll` listener, `requestAnimationFrame`, `ResizeObserver`, `MutationObserver` | Sets `data-more-start/end` to drive the CSS mask edge fades. | `onScroll` + `onContentSizeChange` + `onLayout` on ScrollView/FlatList, with expo-linear-gradient or `@react-native-masked-view/masked-view` for the fades. |
| **lib/useTouchKeyboard.ts** | | | |
| lib/useTouchKeyboard.ts:17-26 | `matchMedia('(pointer: coarse) and (hover: none)')` | On touch, Enter inserts a newline and only the button sends. | Always the touch behaviour. Use a multiline TextInput (`returnKeyType="default"`, `blurOnSubmit={false}`). |
| **lib/apiClient.ts** | | | |
| lib/apiClient.ts (whole file) | `fetch` with a Bearer token | REST client. | Works in RN unchanged. Only the token source changes. |
| **components/auth/GoogleSignInButton.tsx** | | | |
| components/auth/GoogleSignInButton.tsx:67-80, 87-88 | `next/script` loading `https://accounts.google.com/gsi/client`, `window.google.accounts.id.initialize/renderButton` | Google Identity Services button that posts a credential to the backend. | `@react-native-google-signin/google-signin` (native) or `expo-auth-session` with Google. The backend must accept the native ID token (audience = iOS/Android client IDs). **Apple guideline 4.8: offering Google sign-in on iOS requires Sign in with Apple** (`expo-apple-authentication`). |
| **components/avatar/AvatarPanel.tsx** | | | |
| components/avatar/AvatarPanel.tsx:146 | `matchMedia('(prefers-reduced-motion: reduce)')` | Skips the avatar gesture animation. | `AccessibilityInfo` / Reanimated `useReducedMotion`. |
| **components/chat/ChatView.tsx** | | | |
| components/chat/ChatView.tsx:177-185, 220-229 | `sessionStorage` key `clardentity-draft:{conversationId}`, phone layout only | Keeps the composer draft per chat across refresh or tab switch. | MMKV/AsyncStorage keyed per conversation, or in-memory state that survives navigation. |
| components/chat/ChatView.tsx:179, 205 | `matchMedia('(max-width:1023.98px)')`, `'(pointer: coarse) and (max-width:1023.98px)'` | Phone-only behaviours. | Always on. |
| components/chat/ChatView.tsx:204-219 | `document` `focusin`/`focusout` | Folds the mode rail into a chip while the composer has focus, keeping room above the keyboard. | TextInput `onFocus`/`onBlur` plus `Keyboard` events / `react-native-keyboard-controller`. |
| components/chat/ChatView.tsx:271, 401 | `AbortController` | Cancels the stream ("stop"). | Supported in RN (`AbortController` works with fetch; with react-native-sse call `.close()`). |
| components/chat/ChatView.tsx:554-556 | `window.dispatchEvent(new CustomEvent('clardentity:conversation-renamed'))` | Tells the sidebar a chat was renamed. | Shared store / query-cache invalidation (TanStack Query). |
| components/chat/ChatView.tsx:765-773 | `window` `keydown` Escape | Stops the running answer. | Hardware keyboard only. Use a Stop button (already present). Android back could map to it. |
| components/chat/ChatView.tsx:913-945 | `fetch('/audio/tts')` -> `res.blob()` -> `URL.createObjectURL` -> `new Audio(url).play()` | Plays a spoken answer. The object URL is never revoked (small leak). | Save to a file with expo-file-system (base64), then `expo-audio` / `expo-av` `Sound`, or stream through react-native-track-player. RN `fetch().blob()` exists but `createObjectURL` does not. |
| components/chat/ChatView.tsx:1525-1532 | `matchMedia('(pointer: coarse) and (max-width:1023.98px) and (max-height:500px)')` | Landscape phone: the rail stays folded. | `useWindowDimensions().height < 500` (or lock the app to portrait). |
| **components/chat/MessageList.tsx** | | | |
| components/chat/MessageList.tsx:132-190 | `sessionStorage` key `clardentity-place:{conversationId}`, `requestAnimationFrame` | Saves and restores the thread scroll position per chat on phones. | Keep FlatList mounted, or save the offset in memory/MMKV and `scrollToOffset`. |
| components/chat/MessageList.tsx:200, 215 | `el.scrollTo({behavior:'smooth'})` | Scrolls to the bottom. | `FlatList.scrollToEnd({animated:true})`, or an inverted FlatList. |
| components/chat/MessageList.tsx:228-249 | `ResizeObserver`, `requestAnimationFrame` | Keeps following the latest message while a streamed answer grows. | Inverted FlatList or `maintainVisibleContentPosition` with `onContentSizeChange`. |
| components/chat/MessageList.tsx:307 | `onTouchStart` | Stops auto-scroll when the user touches. | `onScrollBeginDrag`. |
| components/chat/MessageList.tsx:1192 | `navigator.clipboard.writeText` | Copies a message (citation markers stripped). | `expo-clipboard` `setStringAsync`. Add haptics (`expo-haptics`) and a toast. |
| **components/chat/MessageInput.tsx** | | | |
| components/chat/MessageInput.tsx:227 | `el.addEventListener('focus', warm, {once:true})` | Warms the spellchecker on first focus. | Drop it (see autocorrect). |
| components/chat/MessageInput.tsx:349-353 | `FileReader.readAsDataURL` | Converts an attachment to base64 for the API. | `expo-file-system` `readAsStringAsync(uri, {encoding: Base64})`, or upload multipart from a URI. |
| components/chat/MessageInput.tsx:456-457 | `<input type="file" accept="image/*,.pdf,.docx,...">` | Attach an image or document. | `expo-image-picker` (camera and photos) plus `expo-document-picker`, offered from an action sheet. |
| **components/chat/ExportFileMenu.tsx** | | | |
| components/chat/ExportFileMenu.tsx:53-65 | `res.blob()`, `URL.createObjectURL`, `document.createElement('a').download`, `revokeObjectURL` | Downloads a generated docx/pptx/xlsx. | `expo-file-system` `downloadAsync` to the cache dir, then `expo-sharing` `shareAsync` (native share sheet / "Save to Files"). |
| **components/chat/ModeCarousel.tsx** | | | |
| components/chat/ModeCarousel.tsx:122-131 | `window` `keydown` ArrowLeft/Right when focused | Keyboard navigation between modes. | N/A on touch. Use a swipe pager. |
| components/chat/ModeCarousel.tsx:135-140 | `onWheel` deltaX | Trackpad swipe. | N/A. |
| components/chat/ModeCarousel.tsx:144-193, 241-244 | Pointer events (`pointerType !== 'mouse'`) and `window.getSelection().removeAllRanges()` | Touch swipe between mode tracks (DRAG_COMMIT threshold). | `react-native-pager-view` or `react-native-reanimated-carousel` / Gesture Handler `Pan`. |
| components/chat/ModeCarousel.tsx:279 | Inline `filter: blur(2px)` on inactive tracks | Defocuses neighbouring tracks. | RN has no CSS filter. Use `expo-blur` BlurView overlay, or just lower opacity. |
| **components/chat/CitationPopover.tsx** | | | |
| components/chat/CitationPopover.tsx:160-173, 238-247, 309 | `createPortal(..., document.body)`, measured fixed positioning (uses `toLayoutRect`) | Anchored citation popover. | Bottom sheet (`@gorhom/bottom-sheet`) or a `Modal`-based popover. |
| components/chat/CitationPopover.tsx:252-256 | `<a target="_blank" rel="noopener noreferrer nofollow">` | Opens a web source. | `expo-web-browser` `openBrowserAsync` (SFSafariViewController / Custom Tabs). |
| **components/chat/ClarifierCard.tsx** | | | |
| components/chat/ClarifierCard.tsx:31-50 | `window` `keydown` digits 1..n, `document.activeElement` | Number keys pick a clarifier option. | N/A on touch. Tap targets only. |
| **components/chat/ConfidenceBadge.tsx / ChatRowMenu.tsx / VendorModelPicker.tsx / AccountMenu.tsx / AppShell.tsx (workspace menu)** | | | |
| components/chat/ConfidenceBadge.tsx:64-70; components/chat/ChatRowMenu.tsx:109-115; components/chat/VendorModelPicker.tsx:52-58; components/system/AccountMenu.tsx:82-91; components/system/AppShell.tsx:293-299 | `document` `mousedown` (click outside) and `keydown` Escape | Dismisses dropdowns and popovers. | `Modal` / bottom sheet with a backdrop press. Android back via `BackHandler`. |
| **components/chat/LiveCallOverlay.tsx** | | | |
| components/chat/LiveCallOverlay.tsx:88-93 | `window` `keydown` Escape | Ends or closes the call. | `BackHandler` / close button. Also consider CallKit / ConnectionService. |
| **components/chat/UpgradeDialog.tsx** | | | |
| components/chat/UpgradeDialog.tsx:128-134 | `window` `keydown` Escape, `closeRef.focus()` | Dialog close and initial focus. | RN `Modal` `onRequestClose`. Plan purchases need IAP (StoreKit / Play Billing via RevenueCat) under App Store rule 3.1.1. |
| **components/marketing/** (landing page; **ASSUMPTION:** probably not ported, or replaced by a native onboarding screen) | | | |
| components/marketing/CardEmboss.tsx:191-197 | `ResizeObserver`, `document.fonts.ready` | Centres an SVG mark in the space left on a card. | `onLayout` + react-native-svg. |
| components/marketing/CurtainShimmer.tsx:82, 117 | `matchMedia('(hover: none), (max-width:1023.98px) and (pointer: coarse)')` | Phones get an automatic wave instead of the hover light. | Always the "phone" path. |
| components/marketing/CurtainShimmer.tsx:121, 233, 240 | `document.visibilityState`, `visibilitychange` | Pauses the rAF loop when the tab is hidden. | `AppState` change listener. |
| components/marketing/CurtainShimmer.tsx:173-181, 239 | `requestAnimationFrame` loop that drives about 51 pleat divs | Curtain light and wind animation. | Reanimated worklets, or Skia (`@shopify/react-native-skia`) for blend modes. |
| components/marketing/CurtainShimmer.tsx:219-222 | Pointer enter/move/leave/cancel | Hover and finger light pool. | Gesture Handler `Pan` / `Hover`. |
| components/marketing/CurtainShimmer.tsx:227 | `IntersectionObserver` | Runs only while on screen. | `onViewableItemsChanged` / scroll position. |
| components/marketing/CurtainShimmer.tsx:258-259, 272 | CSS `maskImage` radial gradient, `mixBlendMode:'screen'` | Light field and screen blending. | Skia (`BlendMode.Screen`, shaders), or MaskedView with LinearGradient (no blend modes). |
| components/marketing/GuestDemo.tsx:247, 346 | `AbortController` | Cancels the guest-demo stream. | Same as ChatView. |
| components/marketing/GuestDemo.tsx:276-277 | `requestAnimationFrame` | Grow-in animation on open. | Reanimated `entering` layout animation. |
| components/marketing/GuestDemo.tsx:283, 559 | `inputRef.focus()` on a timeout | Autofocuses the composer. | `TextInput autoFocus` / ref `.focus()`. |
| components/marketing/GuestDemo.tsx:520-538 | `document` `keydown` Escape, `document.body.style.overflow='hidden'` | Modal scroll lock and close. | RN `Modal`. |
| components/marketing/GuestDemo.tsx:606 | `getComputedStyle(document.documentElement).zoom` | Zoom correction for geometry. | N/A. |
| components/marketing/LandingPage.tsx:259-266 | `document.body.style.backgroundColor` | Paints the body cream behind the landing page. | Screen background / `SystemUI.setBackgroundColorAsync`. |
| components/marketing/Reveal.tsx:45-66 | `IntersectionObserver` (rootMargin depends on `matchMedia`), rAF fallback | Scroll-reveal animation. | Reanimated `FadeInDown` entering animations, or viewability callbacks. |
| **components/system/** | | | |
| components/system/AppNotices.tsx:48, 65-67 | `sessionStorage` key `clardentity.greetedThisSession` | Greets once per tab opening. | In-memory flag reset on cold start, or `AppState` "active after N minutes". |
| components/system/AppShell.tsx:36, 51-60 | `localStorage` key `clardentity-sidebar-collapsed` (`"1"`/`"0"`) | Desktop sidebar collapse. | N/A on phone (drawer). Keep it for tablets if a permanent sidebar is built. |
| components/system/AppShell.tsx:404-408 | `window` events `clardentity:open-nav`, `clardentity:close-nav` | The tour opens and closes the drawer. | `navigation.openDrawer()/closeDrawer()`. |
| components/system/AppShell.tsx:505, 570-588 | `history.pushState({clardentityDrawer:true})`, `history.back()`, `popstate` | Makes the Android/browser Back button close the drawer. | Built into `@react-navigation/drawer`. `BackHandler`. |
| components/system/AppShell.tsx:528-563, 828-830 | Pointer events and `setPointerCapture` | Swipe-to-close drawer (40% or a flick). There is no edge-swipe-open because it would clash with iOS Safari back. | react-navigation Drawer (`swipeEnabled`; edge-open is fine natively). |
| components/system/AppShell.tsx:591-626 | Focus trap via `document.activeElement`, Tab cycling, `opener.focus()` | Accessible modal drawer. | Native drawer handles accessibility focus (`accessibilityViewIsModal`, `importantForAccessibility`). |
| components/system/AppShell.tsx:639-640 | `window` `clardentity:conversation-renamed` listener | Refreshes the recents title. | Store / query invalidation. |
| components/system/Analytics.tsx:29-30 | `window.innerWidth`, `matchMedia('(display-mode: standalone)')` | Analytics props: viewport class and "installed". | `Platform.OS`, `Device.deviceType` (expo-device). `installed` is always true. |
| components/system/ErrorBoundaries.tsx:20-21 | `matchMedia('(max-width:1023.98px)')` | Phone shows the error as a bottom sheet. | Always the sheet. |
| components/system/ErrorBoundaries.tsx:166 | `navigator.clipboard.writeText(ref)` | Copies the error reference. | expo-clipboard. |
| components/system/ErrorBoundaries.tsx:187 | `createPortal(..., document.body)` | Error sheet portal. | `Modal` / bottom sheet. |
| components/system/FullScreenError.tsx:27 | `window.location.reload()` | "Reload" button. | `Updates.reloadAsync()` (expo-updates) or remount the root / refetch. |
| components/system/InstallAppButton.tsx:27-104 | `matchMedia('(display-mode: standalone)')`, `navigator.standalone`, `navigator.userAgent`, `navigator.maxTouchPoints`, `beforeinstallprompt`, `appinstalled`, `deferred.prompt()` | PWA install button plus iOS "Add to Home Screen" instructions. | Delete it. Optionally replace with "Rate the app" (`expo-store-review`). |
| **components/tour/TourOverlay.tsx** | | | |
| components/tour/TourOverlay.tsx:23-31 | `document.querySelectorAll('[data-tour=...]')`, `getBoundingClientRect`, `window.innerWidth` | Finds and measures tour targets. | Refs + `measureInWindow`, or a coach-mark library (react-native-copilot / react-native-spotlight-tour). |
| components/tour/TourOverlay.tsx:91, 169 | `performance.now()` | Grace timeout. | `performance.now()` exists in RN (Hermes), or `Date.now()`. |
| components/tour/TourOverlay.tsx:96, 168 | `window.dispatchEvent('clardentity:close-nav' / 'open-nav')` | Drives the drawer for sidebar steps. | Navigation API. |
| components/tour/TourOverlay.tsx:129-131 | `target.scrollIntoView({block:'center'})` | Brings the target on screen. | `scrollTo` on the parent ScrollView ref. |
| components/tour/TourOverlay.tsx:183-189 | `requestAnimationFrame` tick | Tracks the target while things move. | Reanimated / `onLayout`. |
| components/tour/TourOverlay.tsx:202, 212-215 | `panelRef.focus()`, `window` keydown Escape | Accessibility focus and skip. | `AccessibilityInfo.setAccessibilityFocus`, BackHandler. |
| components/tour/TourOverlay.tsx:228, 273, 326 | `position: fixed` ring and panel via `createPortal(document.body)` | Spotlight overlay. | Absolute-fill `Modal` with an SVG cut-out mask. |
| **components/upload/AudioRecorder.tsx** | | | |
| components/upload/AudioRecorder.tsx:47 | `window.setInterval` | Recording timer. | Plain `setInterval`. |
| components/upload/AudioRecorder.tsx:55-66 | `getUserMedia({audio:true})`, `MediaRecorder`, `new Blob(chunks,{type:'audio/webm'})` | Voice message recording, uploaded to `/audio/transcribe` as `recording.webm`. | `expo-audio` (or `expo-av` `Audio.Recording`) recording to **m4a/AAC**. The backend must accept `audio/m4a` / `audio/mp4`; webm/Opus is not produced natively on iOS. Upload a FormData `{uri, name, type}`. |
| **components/workspace/WorkspaceList.tsx** | | | |
| components/workspace/WorkspaceList.tsx:84 | `nameRef.focus()` | Focuses the new-workspace name field. | TextInput ref `.focus()`. |
| **components/chat/MessageInput.tsx / profile/ImportHistory.tsx / upload/DocumentUploader.tsx** | | | |
| components/profile/ImportHistory.tsx:87-88 | `<input type="file" accept="application/json,.json">` | Imports chat history as JSON. | `expo-document-picker` with type `application/json`. |
| components/upload/DocumentUploader.tsx:154-155 | `<input type="file" accept={DOCUMENT_ACCEPT}>` | Workspace document upload. | expo-document-picker (multiple). |

**Not found anywhere** in app/, components/ or lib/: `EventSource`, `WebSocket`, `Notification`, push, `document.cookie`, `visualViewport`, `deviceorientation`/`DeviceMotion` (tilt was tried and removed; see the comment at components/marketing/CurtainShimmer.tsx:32-35), `navigator.share`/`canShare`, `DataTransfer`/drag-and-drop events, `indexedDB`, `BroadcastChannel`, `speechSynthesis`/`SpeechRecognition`, `vibrate`, `wakeLock`, fullscreen, `print()`, `<canvas>`/`getContext`, `window.open`, `contentEditable`.

**Gaps to add natively.** There are no push notifications and no share-sheet entry today. A native port will likely want `expo-notifications` and share-intent handling (sharing a document into the app).

#### Storage keys (complete list)

| Storage | Key | Value / purpose | Defined at | Native target |
|---|---|---|---|---|
| localStorage | `clardentity_access_token` | **JWT access token** | lib/auth.tsx:15 (also read raw at lib/theme.tsx:14, 45) | **SecureStore / Keychain** |
| localStorage | `clardentity_refresh_token` | **JWT refresh token** | lib/auth.tsx:16 | **SecureStore / Keychain** |
| localStorage | `clardentity-theme` | `"light"` / `"dark"` (absent = follow OS) | lib/theme.tsx:9 | MMKV/AsyncStorage |
| localStorage | `clardentity-accent` | `"burgundy"`, `"indigo"`, `"teal"` or `"plum"` | lib/theme.tsx:10 | MMKV/AsyncStorage |
| localStorage | `clardentity-consent` | `"granted"` / `"denied"` analytics consent | lib/consent.ts:14 | MMKV/AsyncStorage |
| localStorage | `clardentity-tour` | JSON `{active: "workspace"\|"chat"\|null, stepIndex, done:{...}}` | lib/tour.tsx:153 | MMKV/AsyncStorage |
| localStorage | `clardentity-sidebar-collapsed` | `"1"` / `"0"` (desktop sidebar) | components/system/AppShell.tsx:36 | Not needed on phone |
| localStorage | `clardentity-last-workspace` | Workspace id | lib/lastWorkspace.ts:5 | MMKV/AsyncStorage |
| localStorage | `clardentity-mode-switching` | `"smart"` / `"manual"` | lib/modeSwitching.ts:13 | MMKV/AsyncStorage |
| localStorage | `clardentity.model.choice` | JSON `{[mode]: modelId}` | lib/pickableModels.ts:30 | MMKV/AsyncStorage |
| localStorage | `clardentity.guest.session` | UUID for the guest-demo allowance | lib/guestDemo.ts:14 | MMKV (if the guest demo is ported) |
| localStorage | `clardentity.guestTranscript` | JSON `{mode, turns[], savedAt}`, 24h TTL (lib/guestHandoff.ts:28) | lib/guestHandoff.ts:23 | MMKV (if ported) |
| localStorage (PostHog SDK) | `ph_<key>_posthog` (**ASSUMPTION:** SDK default, plus a cookie) | Anonymous distinct id and super properties | lib/analytics.ts:125 (no `persistence` set) | posthog-react-native's own storage |
| sessionStorage | `clardentity-draft:{conversationId}` | Unsent composer text (phone layout only) | components/chat/ChatView.tsx:177 | MMKV keyed per chat, or memory |
| sessionStorage | `clardentity-place:{conversationId}` | Thread `scrollTop` (phone only; removed when within 80px of the bottom) | components/chat/MessageList.tsx:132 | Memory |
| sessionStorage | `clardentity.greetedThisSession` | `"1"`, so the greeting toast shows once per opening | components/system/AppNotices.tsx:48 | Memory, reset on cold start |
| Module memory | `fresh` Set | Chats just created in this tab (layout hint) | lib/freshChats.ts:12 | Same, in JS |

Security note: next.config.ts (header comment) says outright that the session lives in localStorage, so any script on the origin can read it. That risk is the reason for the CSP. In the native app the tokens must go to Keychain/Keystore.

Custom window events (an event bus that needs a native replacement): `clardentity:appearance` (lib/theme.tsx:141), `clardentity:open-nav` / `clardentity:close-nav` (AppShell.tsx:404-405, TourOverlay.tsx:96, 168), `clardentity:conversation-renamed` (ChatView.tsx:555, AppShell.tsx:639).



---

## 3. Backend & API Audit

### 3.1 Architecture type, assembly and deployment

#### Framework and versions
| Component | Version | Source |
|---|---|---|
| FastAPI | 0.140.0 | `backend/requirements.txt:25` |
| Starlette | 1.3.1 | `backend/requirements.txt:75` |
| uvicorn | 0.51.0 (+ uvloop 0.22.1, httptools 0.8.0) | `backend/requirements.txt:84,85,32` |
| sse-starlette | 3.4.6 | `backend/requirements.txt:74` |
| Pydantic / pydantic-settings | 2.13.4 / 2.14.2 | `backend/requirements.txt:53-54` |
| SQLAlchemy (async) + asyncpg | 2.0.51 / 0.31.0 | `backend/requirements.txt:73,6` |
| Alembic | 1.18.5 | `backend/requirements.txt:1` |
| pgvector | 0.5.0 | `backend/requirements.txt:45` |
| Celery + redis-py | 5.6.3 / 8.0.1 | `backend/requirements.txt:11,67` |
| PyJWT | 2.13.0 | `backend/requirements.txt:57` |
| bcrypt | 5.0.0 | `backend/requirements.txt:7` |
| google-auth | 2.56.2 | `backend/requirements.txt:28` |
| boto3 (S3-compatible storage) | 1.43.56 | `backend/requirements.txt:9` |
| openai | 2.48.0 | `backend/requirements.txt:42` |
| anthropic | **unpinned** | `backend/requirements.txt:91` |
| python-multipart | 0.0.32 | `backend/requirements.txt:64` |
| Python runtime | 3.12-slim | `backend/Dockerfile:1` |

#### App assembly (`backend/app/main.py`)
- No factory. There is a module-level `app = FastAPI(title="Clardentity API", lifespan=lifespan)` (`main.py:51`). The default OpenAPI docs are not disabled. **ASSUMPTION:** `/docs`, `/redoc` and `/openapi.json` are therefore publicly reachable in production, which is useful for generating mobile client code.
- `configure_logging()` runs at import (`main.py:32`). It produces plain-text stdout logs with `correlation_id=` on every line (`backend/app/core/logging_config.py:16-33`).
- Lifespan: `ensure_bootstrap_admin` seeds the admin account if it is missing (`main.py:35-48`, `backend/app/services/admin_access.py:33-64`).
- Middleware, in add order (`main.py:53-60`):
  1. `CorrelationIdMiddleware` (`backend/app/core/middleware.py:11-38`). It reads `X-Request-ID` from the request or mints a uuid4 and echoes it as the `X-Request-ID` response header. It also sets security headers with `setdefault`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` (`middleware.py:41-45`). There is **no CSP, no HSTS and no CORP** (the CORP omission is deliberate, `middleware.py:33-35`).
  2. `CORSMiddleware` with `allow_origins=settings.cors_origins`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]` (`main.py:54-60`).
- CORS origins logic: `BACKEND_CORS_ORIGINS` is split on commas and trimmed (`backend/app/core/config.py:206,209-211`). The default is `http://localhost:3000`. In production it is set on the Render dashboard (`render.yaml:74-75`, `sync: false`). DEPLOYMENT.md says it holds the Vercel URL (`DEPLOYMENT.md:15`). There are no wildcard or regex origins. **CORS does not affect native apps.**
- Routers included (`main.py:64-82`). The prefix is `API_PREFIX = "/api/v1"` (`main.py:62`) for everything except health:
  `health` (no prefix), `admin_dashboard`, `auth`, `workspaces`, `chat`, `documents`, `images`, `guest`, `history`, `biases`, `profile`, `memory`, `validation`, `admin` (settings), `audio`, `compose`, `realtime`, `pro`, `bootstrap`.
- **No custom exception handlers.** A grep for `exception_handler` returns nothing in `backend/app`. Errors use the FastAPI defaults (see section 5.3).
- **No global rate-limit middleware.** Rate limiting is per-endpoint through `check_rate_limit()` (`backend/app/core/rate_limit.py:13-40`). It uses a fixed-window Redis counter and **fails open** on Redis errors (`rate_limit.py:29-35`).
- Request logging: there is no access-log middleware beyond uvicorn's default. Chat turns log phase timings (`backend/app/api/chat.py:1499,1685`).

#### Health check
- `GET /health` (`backend/app/api/health.py:53-73`). Unauthenticated. It returns `{"status":"ok"|"error","dependencies":{"database","redis","storage"},"search":"tavily"|"model-tool","uptime_seconds":int}`. It always returns HTTP 200. The `status` field carries the result.
- Render uses it as `healthCheckPath: /health` (`render.yaml:19`).

#### Data and infra dependencies
- Postgres with pgvector on Supabase, reached through the Supavisor transaction pooler. `statement_cache_size=0` is set (`backend/app/db/session.py:15-28`, `DEPLOYMENT.md:39-61`). Pool size 3, overflow 2 (`render.yaml:90-93`).
- Redis on Upstash. It backs rate limits, the preview counters, the guest budgets, and serves as Celery broker and result backend (`backend/app/core/celery_app.py:20-34`, `DEPLOYMENT.md:63-79`).
- Object storage is S3-compatible (Supabase Storage), bucket `clardentity-prod`, region `ap-northeast-2` (`render.yaml:64-67`). The client is `backend/app/services/storage.py:7-30`. There are only `put/get/delete`, **no presigned URLs**.
- External AI providers: OpenAI (embeddings, STT, TTS, realtime, images), Anthropic (main generation), plus optional Google, xAI and Tavily (`backend/app/core/config.py:15-176`).
- Email goes through Resend and is a no-op when the key is unset (`backend/app/services/email_service.py:20-28`).

#### Deployment (`render.yaml`, `Dockerfile`, `start.sh`, `DEPLOYMENT.md`)
- **There is one Render service**, `type: web`, `name: clardentity-backend`, `runtime: docker`, on the `standard` plan with autoscaling configured on the dashboard (`render.yaml:8-26`). `render.yaml` has **no separate worker, cron, database or redis entries**. The DB and Redis are external (Supabase and Upstash) (`DEPLOYMENT.md:3-5`).
- `preDeployCommand: alembic upgrade head` (`render.yaml:24`).
- Env group `clardentity-shared` (`render.yaml:28-110`):
  - Secret, `sync:false`: `OPENAI_API_KEY`, `DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `JWT_SECRET`, `BACKEND_CORS_ORIGINS`, `ADMIN_BOOTSTRAP_PASSWORD`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`.
  - Plain values: model names, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15`, `JWT_REFRESH_TOKEN_EXPIRE_DAYS=30`, `MAX_UPLOAD_SIZE_MB=25`, `ADMIN_EMAILS`, `ADMIN_BOOTSTRAP_EMAIL`, `DB_POOL_SIZE=3`, `DB_MAX_OVERFLOW=2`, `APP_URL=https://clardentity.ai`, `EMAIL_FROM`.
  - Not in `render.yaml` but read by config: `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `GOOGLE_CLIENT_SECRET` (unused in code), `PREVIEW_MODES`, `PREVIEW_DAILY_MESSAGES`, `GUEST_DAILY_TOKEN_BUDGET`, and others (`backend/app/core/config.py`). **ASSUMPTION:** these are set on the Render dashboard.
- Dockerfile: `python:3.12-slim`, installs `libpq-dev gcc`, runs `pip install -r requirements.txt`, `EXPOSE 8000`, `CMD ["./start.sh"]` (`backend/Dockerfile:1-17`).
- `start.sh` steps (`backend/start.sh`):
  1. `set -e` (line 2).
  2. `alembic upgrade head` (line 17). This is the second of two migration paths. Alembic takes an advisory lock (`start.sh:13-15`).
  3. Background Celery worker: `celery -A app.core.celery_app worker --loglevel=info --concurrency=1 --max-tasks-per-child=100 --without-gossip --without-mingle --without-heartbeat &` (lines 40-44).
  4. `exec uvicorn app.main:app --host 0.0.0.0 --port 8000` (line 46). It does **not** pass `--proxy-headers`/`--forwarded-allow-ips` (see section 5.1 caveat).
- Celery tasks (`backend/app/core/celery_app.py:26-33`): `ingest_document`, `rebuild_memory`, `rebuild_profile`, `refresh_location`, `send_password_reset_email`, `send_welcome_email`. There is **no Celery beat/cron**.
- Public URLs: backend `https://clardentity-backend.onrender.com`, older frontend `https://frontend-eight-blush-49.vercel.app` (`DEPLOYMENT.md:13-14`). Production app URL is `https://clardentity.ai` (`render.yaml:104`).
- Deploys: auto-deploy on push is **not** wired up. Deploys are triggered manually through the Render API (`DEPLOYMENT.md:132-148`).


### 3.2 Every API endpoint

> Cross-references of the form "section N" inside this sub-section point at its own numbered parts in the source audit notes, not at the top-level sections of this document.

Legend: **Auth** values:
- `user`: `Depends(get_current_user)`, Bearer access JWT (`backend/app/api/deps.py:15-42`).
- `admin`: `Depends(require_admin)`, which is `user` plus email in `ADMIN_EMAILS`. Non-admins get **404** (`backend/app/api/admin_dashboard.py:35-40`).
- `none`: no auth.

"WS-member" means the handler also calls `require_workspace_member` or `get_conversation_for_user`. Non-members get 404 (`backend/app/api/deps.py:45-66`).

#### Health
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| GET | `/health` | `backend/app/api/health.py:53` | Dependency health | none | - | `{status, dependencies{database,redis,storage}, search, uptime_seconds}` |

#### Auth (`/api/v1/auth`, `backend/app/api/auth.py`, schemas `backend/app/schemas/auth.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | `auth.py:139` | Create password account, auto-create "My workspace", queue welcome email | none (rate 10/300s per IP) | JSON `RegisterRequest{email: EmailStr, password: str 8-72, display_name?: str, accepted_terms: bool}`. Must be `true`, else 400 (`auth.py:147-151`) | 201 `AuthResponse{access_token, refresh_token, token_type:"bearer", user: UserPublic}`. 409 if email exists |
| POST | `/api/v1/auth/login` | `auth.py:176` | Password login. `"admin"` (no `@`) resolves to the admin bootstrap email (`auth.py:61-75`) | none (10/300s per IP) | JSON `LoginRequest{email: str 1-254, password: str 1-72}` | `TokenResponse{access_token, refresh_token, token_type}`. 401 "Invalid email or password". **Note: no `user` object. Call `/auth/me` or `/bootstrap` next** |
| POST | `/api/v1/auth/password-reset/request` | `auth.py:199` | Email a reset link. Same response whether or not the account exists | none (5/900s per IP) | JSON `{email: EmailStr}` | 202 `{"detail": "If that address has an account, a reset link is on its way."}` |
| POST | `/api/v1/auth/password-reset/confirm` | `auth.py:227` | Redeem reset token, set new password, bump `refresh_token_version` (signs out all devices), sign in | none (10/900s per IP) | JSON `{token: str, password: str 8-72}` | `TokenResponse`. 400 "This reset link has expired or has already been used..." |
| POST | `/api/v1/auth/refresh` | `auth.py:276` | New access+refresh pair. Version is **not** bumped | none (30/300s per IP) | JSON `{refresh_token: str}` | `TokenResponse`. 401 "Invalid or expired refresh token" |
| POST | `/api/v1/auth/oauth/google` | `auth.py:313` | Google ID-token sign-in or sign-up. Links to an existing account with the same email | none (**no rate limit**) | JSON `{id_token: str}` | `TokenResponse`. 501 if `GOOGLE_CLIENT_ID` unset. 401 "Invalid Google ID token" |
| GET | `/api/v1/auth/me` | `auth.py:371` | Current user | user | - | `UserPublic{id, email, display_name, onboarding_completed_at, is_admin}` |
| DELETE | `/api/v1/auth/me` | `auth.py:376` | Delete account and everything owned (files too). Irreversible | user | - | 204 |

#### Bootstrap (`/api/v1/bootstrap`, `backend/app/api/bootstrap.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| POST | `/api/v1/bootstrap` | `bootstrap.py:54` | One-shot app entry: user, workspaces, active workspace, reusable empty chat (created if none) | user | JSON `{workspace_id?: uuid}` (hint) | `BootstrapResult{user: UserPublic, workspaces: WorkspaceOut[], active_workspace_id, conversation_id, conversation_created: bool}` |

#### Workspaces (`/api/v1/workspaces`, `backend/app/api/workspaces.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| POST | `/api/v1/workspaces` | `workspaces.py:26` | Create | user | `{name: str 1-200}` | 201 `WorkspaceOut{id, name, role, created_at}` |
| GET | `/api/v1/workspaces` | `workspaces.py:45` | List memberships, ordered by created_at | user | - | `WorkspaceOut[]` |
| GET | `/api/v1/workspaces/{workspace_id}` | `workspaces.py:62` | Get one | user + member | - | `WorkspaceOut` / 404 |
| PATCH | `/api/v1/workspaces/{workspace_id}` | `workspaces.py:81` | Rename (owner only, else 404) | user | `{name: str 1-200}` | `WorkspaceOut` |
| DELETE | `/api/v1/workspaces/{workspace_id}` | `workspaces.py:103` | Delete (owner only, else 404) | user | - | 204 |

#### Chat (`/api/v1/chat`, `backend/app/api/chat.py`, schemas `backend/app/schemas/chat.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| POST | `/api/v1/chat/conversations` | `chat.py:281` | New conversation | user + WS-member | `ConversationCreate{workspace_id, title?, default_mode?: one of 9 modes}` | 201 `ConversationOut{id, workspace_id, title, default_mode, pinned, created_at, last_activity_at}` |
| GET | `/api/v1/chat/models` | `chat.py:311` | Pickable models (non-empty only for `creative`) | user | query `mode?` | `{models:[{id,label,vendor,blurb}]}` |
| GET | `/api/v1/chat/conversations` | `chat.py:338` | List all conversations in workspace. Pinned first, then last activity. **Unpaginated** | user + WS-member | query `workspace_id` (required) | `ConversationOut[]` |
| GET | `/api/v1/chat/conversations/{conversation_id}` | `chat.py:369` | Get one | user + member | - | `ConversationOut` |
| PATCH | `/api/v1/chat/conversations/{conversation_id}` | `chat.py:379` | Move / rename / pin. Only sent fields applied | user + member (and of destination) | `ConversationUpdate{workspace_id?, title? (<=120 chars, ""=reset), pinned?}` | `ConversationOut` |
| DELETE | `/api/v1/chat/conversations/{conversation_id}` | `chat.py:418` | Delete | user + member | - | 204 |
| GET | `/api/v1/chat/{conversation_id}/messages` | `chat.py:457` | Active branch of the message tree, with sibling info and claims. **Unpaginated** | user + member | - | `MessageOut[]` (see 2.5.2) |
| GET | `/api/v1/chat/{conversation_id}/export` | `chat.py:468` | Download transcript | user + member | query `format=markdown\|pdf` | `text/markdown` or `application/pdf` with `Content-Disposition: attachment` |
| POST | `/api/v1/chat/{conversation_id}/messages/{message_id}/devils-advocate` | `chat.py:503` | Counterfactual answer (cached on row) | user + member (20/300s per user) | - | `{counterfactual_content: str}`. 502 on provider failure |
| POST | `/api/v1/chat/{conversation_id}/messages/{message_id}/export-file` | `chat.py:562` | Turn one answer into an Office file (generated, not stored) | user + member (10/300s per user) | `{format: "docx"\|"pptx"\|"xlsx"}` | Binary with Office MIME type + `Content-Disposition: attachment` |
| PUT | `/api/v1/chat/{conversation_id}/messages/{message_id}/feedback` | `chat.py:608` | Thumbs and comment on an assistant message | user + member (30/60s per user) | `FeedbackIn{rating?: "up"\|"down"\|null, comment?: str<=2000}` | `{feedback:{rating,comment}}` |
| PUT | `/api/v1/chat/{conversation_id}/active-leaf` | `chat.py:642` | Switch branch (fork switcher) | user + member | `{message_id: uuid}` | `{active_leaf_id: str}` |
| DELETE | `/api/v1/chat/{conversation_id}/messages/{message_id}` | `chat.py:667` | Delete message and its descendant subtree | user + member | - | 204 |
| POST | `/api/v1/chat/{conversation_id}/messages` | `chat.py:799` | **Send message / regenerate, SSE stream** | user + member (20/60s per user) | JSON `MessageCreate` (see 2.5.1) | `text/event-stream` (see 2.5.3). Pre-stream errors are normal JSON: 400/402/404/429 |
| POST | `/api/v1/chat/{conversation_id}/call-transcript` | `chat.py:1704` | Save a finished voice call's turns into the thread (unscored) | user + member | `CallTranscript{mode: str, turns: [{role:"user"\|"assistant", content: str 1-8000}] 1-200}` | 201 `MessageOut[]` |

##### `MessageCreate` (`backend/app/schemas/chat.py:76-133`)
- `content: str = ""`. Required unless `regenerate_of` is set. A blank value gives 400 "content required" (`chat.py:982-983`).
- `mode: str | None`. Must be one of `rapid, knowing, thinking, decision, learning, mentoring, therapy, creative, legal` (`backend/app/models/conversation.py:10-20`). Anything else gives **400**, not 422 (`chat.py:977-981`).
- `reasoning_lens: str | None`. Thinking mode only. Valid values: `analytical, critical, creative, divergent, convergent, abstract, concrete, associative, linear, non_linear, meta_cognitive` (`backend/app/services/router.py:11-23`).
- `model: str | None`. Co-Creative only.
- `attachments: [{type:"image"|"document", data: base64 (data-URI prefix optional), mime_type="image/jpeg", filename?}]`. **Files are sent inline as base64 in the JSON body, not multipart.** Documents are limited to `MAX_UPLOAD_SIZE_MB` (25 MB) each after decoding and must have a supported extension (`chat.py:115-191`). Images have no explicit size check.
- `audio_duration_seconds: float | None`. Set when `content` came from `/audio/transcribe`.
- Gate re-send flags: `mode_confirmed`, `refined_confirmed`, `clarifying_confirmed`, `context_acknowledged` (bools), `context_rounds: int 0-10`.
- `parent_id: uuid | None`. Used for edit-as-fork. Explicitly sending `null` means root (`chat.py:1014-1023`).
- `regenerate_of: uuid | None`. Regenerates an assistant message. Content, mode and gates are ignored.
- Preview-mode gate: modes in `PREVIEW_MODES` (default `mentoring,therapy,creative,legal`, `config.py:89`) require `user.preview_unlocked_at`, else **402**. They are capped at `PREVIEW_DAILY_MESSAGES` (default 25, `config.py:164`) per UTC day, else **402** (`chat.py:989-1003`).

##### `MessageOut` (`backend/app/schemas/chat.py:178-226`)
`id, role, content, mode_used, reasoning_lens, confidence_score, confidence_band, avatar_expression, avatar_gesture, created_at, counterfactual_content, crux_text, clarifier{question,options}, guidance{...}, decision_review, thinking_review, generated_image{id,owner,prompt}, feedback{rating,comment}, parent_id, sibling_index, sibling_count, sibling_ids[], claims: ClaimOut[]`.
`ClaimOut` (`chat.py` schema lines 154-175): `claim_index, claim_text, claim_score, entailment_label, distortion_flag, distortion_explanation, bias_name, bias_definition, bias_category, bias_category_name, reconciliation_note, dynamic, evidence: EvidenceOut[]`. `EvidenceOut` (lines 136-151): `citation_marker, document_id?, document_filename, excerpt, support_score, relevance_score, entailment_label, source_type ("document"|"web"), url?, credibility_score?, credibility_note?`.

##### SSE events from `POST /chat/{id}/messages`
Transport: `sse_starlette.EventSourceResponse` (`chat.py:1116,1701`). Each frame is `event: <name>\ndata: <json>\n\n`. **ASSUMPTION:** sse-starlette sends periodic `: ping` comment frames, every 15 s by default. Clients must ignore comment lines.

A **gated** turn ends after exactly one event. The message is not persisted (`chat.py:1099-1116`, `backend/app/services/answer_pipeline.py:130-208`):
| event | data |
|---|---|
| `refined_question` | `{refined_question, refinement_reason}` |
| `clarifying_options` | `{question, options: [str]}` |
| `context_question` | `{question}` |
| `mode_suggestion` | `{suggested_mode, mode_reason}` |
The client re-sends the message with the matching `*_confirmed` flag (or `context_rounds+1`).

A **normal** turn, in order:
| event | data | source |
|---|---|---|
| `status` | `{phase:"slow", label}` (optional early warning) | `answer_pipeline.py:356-361` |
| `status` | `{phase:"reading"\|"searching"\|"thinking", label}` | `answer_pipeline.py:393-402` |
| `review` | `{decision_review: {...}}` or `{thinking_review: {...}}` (decision/thinking modes, any time before `answer`) | `answer_pipeline.py:320-334` |
| `status` | `{phase:"image", label:"Making the image"}` (creative image turns) | `answer_pipeline.py:291-303` |
| `crux` | `{text}`: the one-sentence gist, sent once | `answer_pipeline.py:442` |
| `delta` | `{text}`: incremental body text (claim tags stripped) | `answer_pipeline.py:445,450` |
| `image` | `{id, owner, prompt}` (may arrive mid-stream, after analysis, or just before `final`) | `answer_pipeline.py:305-318`, `chat.py:1686-1688` |
| `error` | `{detail}`: fixed vendor-neutral sentence. Stream ends | `chat.py:1404` |
| `answer` | `{message: MessageOut (draft, persisted, real id), user_message: MessageOut \| null}` (null on regenerate) | `chat.py:1452-1455` |
| `status` | `{phase:"validating", label:"Weighing the evidence"}` (not in rapid mode) | `chat.py:1521-1524` |
| `final` | `{message: MessageOut (with claims), conversation_title: str\|null, counterfactual_content, decision_review, thinking_review, research_notes: [str], claims: ClaimOut[], confidence:{score,band}, avatar_cue:{expression,gesture}}` | `chat.py:1500-1518` (rapid), `chat.py:1668-1689` |

Persistence: the user message is committed before streaming (`chat.py:1181-1182`) and the assistant row before `answer` (`chat.py:1419-1447`). A client that disconnects after `answer` still finds the message on reload, though claims may be missing. **ASSUMPTION:** if the client disconnects mid-analysis the generator is cancelled and the claim/score write (`chat.py:1556-1644`) may never run.

#### Documents (`/api/v1/documents`, `backend/app/api/documents.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| POST | `/api/v1/documents/upload` | `documents.py:52` | Upload a workspace document, then async ingest through Celery | user + WS-member | **multipart/form-data**: `workspace_id` (form field, uuid), `file` (UploadFile). Max `MAX_UPLOAD_SIZE_MB`=25 MB (whole file read into memory, then checked, `documents.py:65-71`). Allowed extensions: pdf, docx, xlsx, xlsm, pptx, txt, md, markdown, csv, tsv, json, xml, html, htm, rtf, log, yaml, yml (`backend/app/services/document_ingestion.py:29-48`). doc/xls/ppt get a specific 400 | 201 `DocumentUploadOut{document_id, status:"processing"}`. Poll `GET /documents/{id}` for status |
| GET | `/api/v1/documents/search` | `documents.py:96` | Literal (ILIKE) passage search in workspace or in one conversation's citations | user + WS-member | query `workspace_id`, `q`, `conversation_id?`, `limit=25` (capped 100) | `AttachmentSearchOut{query, conversation_id, total, hits:[{document_id, filename, chunk_index, page_number, excerpt, cited_here}]}` |
| GET | `/api/v1/documents` | `documents.py:180` | List workspace documents (newest first). **Unpaginated** | user + WS-member | query `workspace_id` | `DocumentOut[]{id, filename, file_type, status, created_at}` |
| GET | `/api/v1/documents/{document_id}` | `documents.py:196` | Detail | user + member | - | `DocumentDetailOut{..., chunk_count}` |
| DELETE | `/api/v1/documents/{document_id}` | `documents.py:221` | Delete row and stored file | user + member | - | 204 |
There is **no endpoint to download or view the original stored file.**

#### Images (`/api/v1/images`, `backend/app/api/images.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| GET | `/api/v1/images/{owner_id}/{image_id}.webp` | `images.py:26` | Serve a generated image. **Unauthenticated by design**: the uuid4 in the URL acts as the capability (`images.py:3-13`). Falls back to a stored PNG | none | path uuids | `image/webp` or `image/png`, `Cache-Control: private, max-age=31536000, immutable` |
The client builds this URL from `generated_image.{owner,id}`. The backend never returns a full URL. For guests, `owner` is the guest `session_id` (`backend/app/api/guest.py:294-298`).

#### Guest demo (`/api/v1/guest`, `backend/app/api/guest.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| GET | `/api/v1/guest/budget` | `guest.py:199` | Remaining guest allowance | none | query `session_id: uuid` | `{used, budget: 5000, remaining}` |
| POST | `/api/v1/guest/chat` | `guest.py:206` | Anonymous demo turn (full pipeline, nothing stored). **SSE** | none (30/600s per X-Forwarded-For address, `guest.py:223`) | `GuestRequest{session_id: uuid (client-generated), mode, message: 1-2000 chars, history:[{role,content}], smart_switching=true, mode_confirmed, refined_confirmed, clarifying_confirmed, context_acknowledged, context_rounds 0-10, regenerate, last_image_id?}` (`guest.py:114-138`) | Same events as 2.5.3, plus `switched {from,to}` (`guest.py:346-349`) and `budget {used, budget, limit_reached}` (`guest.py:628-641`). When exhausted, a single `budget` event is sent. 422 unknown mode. 503 when global daily budget is spent |
| POST | `/api/v1/guest/import` | `guest.py:690` | Save a demo transcript into the new account's first workspace (unscored) | user | `ImportRequest{mode, turns:[{role, content, mode?, crux_text?, decision_review?, thinking_review?, generated_image?{id,owner,prompt}}] 1-40}`. Total <= 60,000 chars (`guest.py:651-652,719-729`) | 201 `{conversation_id, workspace_id, message_count}`. 413 too long. 409 no workspace |
Guest budgets: 5,000 tokens per session, 400,000 per address per day, `GUEST_DAILY_TOKEN_BUDGET`=2,000,000 global per day (`backend/app/services/guest_demo.py:38,46`, `config.py:102`). The history is limited to 12,000 chars and 20 turns (`guest_demo.py:53-55`).

#### History search (`/api/v1/history`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| GET | `/api/v1/history/search` | `backend/app/api/history.py:15` | Postgres full-text search over messages in a workspace | user + WS-member | query `workspace_id`, `q` (min 1), `limit=20` (<=100) | `SearchResultOut[]{message_id, conversation_id, conversation_title, role, content, mode_used, created_at, rank}` |

#### Biases taxonomy (`/api/v1/biases`, `backend/app/api/biases.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| GET | `/api/v1/biases/categories` | `biases.py:28` | Bias categories | user | - | `BiasCategoryOut[]{id,index,name,scenario,bias_count}` |
| GET | `/api/v1/biases/decision-categories` | `biases.py:44` | Decision categories | user | - | `DecisionCategoryOut[]{id,name,examples[],bias_category_id}` |
| GET | `/api/v1/biases` | `biases.py:62` | Search biases (**offset pagination**) | user | query `q=""`, `category?`, `defined_only=false`, `limit=100 (1-500)`, `offset=0` | `BiasListOut{total, biases: BiasOut[]}` |
| GET | `/api/v1/biases/{bias_id}` | `biases.py:88` | One bias | user | - | `BiasOut{id,name,definition,example,categories,variants,defined}` |

#### Profile (`/api/v1/profile`, `backend/app/api/profile.py`, schemas `backend/app/schemas/profile.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| GET | `/api/v1/profile` | `profile.py:71` | Read profile | user | - | `ProfileOut{personality_md, companion_names{}, aspects[], roles[], user_edited, learning_role, updated_at}` |
| PUT | `/api/v1/profile/learning-role` | `profile.py:79` | Set learning role | user | `{role: "student"\|"teacher"\|"visiting"}` | `ProfileOut` |
| GET | `/api/v1/profile/roles` | `profile.py:108` | Role framework | user | - | `RoleOut[]` |
| PUT | `/api/v1/profile` | `profile.py:129` | Edit profile (sets `user_edited`) | user | `ProfileUpdate{personality_md? <=20000, companion_names?: {mode:name}, roles?: ProfileRoleOut[]}` | `ProfileOut` |
| POST | `/api/v1/profile/aspects` | `profile.py:172` | Add one fact (max 40) | user | `{label, value}` | 201 `ProfileOut` |
| DELETE | `/api/v1/profile/aspects/{aspect_id}` | `profile.py:215` | Remove one fact | user | - | `ProfileOut` |
| DELETE | `/api/v1/profile` | `profile.py:233` | Clear profile | user | - | 204 |
| POST | `/api/v1/profile/rebuild` | `profile.py:245` | Queue rebuild | user | - | 202 `{status:"rebuilding"}` |
| POST | `/api/v1/profile/onboarding` | `profile.py:262` | **Onboarding gate completion**: stores answers, stamps `onboarding_completed_at` | user | `OnboardingRequest{answers:[{question 1-300, answer <=2000}] <=10}` (empty = skip) | 202 `{status:"building"\|"skipped"}` |
| POST | `/api/v1/profile/import` | `profile.py:308` | Import a ChatGPT/Claude/Gemini export to seed the profile | user | **multipart** `file`. Max 60 MB (`profile.py:305,321-327`) | 202 `{status:"importing", source, messages, conversations}`. 413/400 |

#### Memory (`/api/v1/memory`, `backend/app/api/memory.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| GET | `/api/v1/memory/{conversation_id}` | `memory.py:16` | Conversation memory summary | user + member | - | `MemoryOut{summary, last_updated}` |
| POST | `/api/v1/memory/{conversation_id}/rebuild` | `memory.py:32` | Rebuild synchronously | user + member | - | `MemoryOut` |

#### Validation (`/api/v1/validation`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| GET | `/api/v1/validation/{message_id}` | `backend/app/api/validation.py:15` | Score and claims for one message | user + member | - | `ValidationOut{score, band, claims: ClaimOut[]}` |

#### Audio (`/api/v1/audio`, `backend/app/api/audio.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| POST | `/api/v1/audio/transcribe` | `audio.py:20` | Speech to text (OpenAI `whisper-1`) | user (20/60s per user) | **multipart** `file`. Extension (taken from the **filename**) must be one of webm, mp3, wav, m4a, ogg, mp4, mpeg, mpga (`audio.py:17,27-32`). **No server-side size cap.** **ASSUMPTION:** the OpenAI 25 MB limit applies | `TranscribeOut{transcript, duration_seconds, language, heard_speech}` |
| POST | `/api/v1/audio/tts` | `audio.py:44` | Text to speech (OpenAI `tts-1`) | user (20/60s per user) | JSON `{text, voice?}`. No max length in schema | `audio/mpeg` body (StreamingResponse over in-memory bytes). 403 if `feature_flags.tts_enabled` is false |
Mobile note: iOS records m4a/caf and Android records m4a/3gp/ogg. Send `.m4a` or `.mp4` filenames. `.caf` and `.3gp` are rejected.

#### Compose (`/api/v1/compose`, `backend/app/api/compose.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| POST | `/api/v1/compose/complete` | `compose.py:80` | Inline typing autocomplete (Haiku). Never errors | user (240/300s per user) | `{text: 1-2000}` | `{completion: str}` (empty = no suggestion) |

#### Realtime voice (`/api/v1/realtime`, `backend/app/api/realtime.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| POST | `/api/v1/realtime/session` | `realtime.py:132` | Mint an OpenAI Realtime **ephemeral client secret** for one call. The client then connects **directly to OpenAI** (WebRTC per the docstring, `realtime.py:1-8`) | user (20/3600s per user) | optional JSON `CallContext{timezone? <=64, languages: [str] <=6}` | 201 `{client_secret: str, expires_at}`. 503 on upstream failure |
The backend does not return the model name (`realtime.py:225-228`). The session config is set server-side: model `gpt-realtime-2.1`, voice `marin`, semantic VAD, input transcription on (`realtime.py:156-180`, `config.py:175-176`). **ASSUMPTION:** the native client must know the model and endpoint itself, or the backend must be changed to return them. After the call, the client posts turns to `POST /chat/{id}/call-transcript`.

#### Pro / preview (`/api/v1/pro`, `backend/app/api/pro.py`)
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| POST | `/api/v1/pro/interest` | `pro.py:35` | Record paid-tier interest | user | `{model?: "clar pro"\|"clar max"\|"clar ultra"}` | 202 `{status:"registered", email}` |
| GET | `/api/v1/pro/preview` | `pro.py:71` | Preview grant status | user | - | `PreviewStatus{unlocked, modes[], daily_limit, used_today, remaining_today}` |
| POST | `/api/v1/pro/preview` | `pro.py:80` | Unlock preview companions (idempotent) | user | - | `PreviewStatus` |
| DELETE | `/api/v1/pro/preview` | `pro.py:96` | Re-lock | user | - | `PreviewStatus` |
**There is no billing, Stripe or IAP code at all.** A grep finds no `stripe`, `webhook` or payment code in `backend/app`.

#### Admin
| Method | Path | File:line | Purpose | Auth | Request | Response |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/overview` | `backend/app/api/admin_dashboard.py:76` | Users, usage and token spend | **admin** (404 otherwise) | query `days=30 (1-365)` | `AdminOverview` (`backend/app/schemas/admin_dashboard.py:29-52`) |
| POST | `/api/v1/admin/query` | `admin_dashboard.py:308` | NL to read-only SQL, run in a read-only transaction with a 10 s timeout | **admin** | `{question: 1-500}` | `DynamicQueryResult{question, sql, explanation, chart, label_column, value_column, columns, rows}` |
| GET | `/api/v1/admin/settings` | `backend/app/api/admin.py:20` | Global runtime settings | **user only (NOT admin-gated)** | - | `{settings:{openai_model, openai_temperature, retrieval_top_k, scoring_weights, avatar_gesture_map, feature_flags{tts_enabled, image_input_enabled, bias_screening_enabled, web_search_enabled}}}` |
| PUT | `/api/v1/admin/settings` | `admin.py:28` | Change a global setting | **user only (NOT admin-gated)** | `{key, value}` | same |
**Security finding:** `/admin/settings` GET and PUT only depend on `get_current_user` (`admin.py:22,31`, comment `admin.py:16-17`). **Any signed-in user can change global feature flags, model and scoring weights.** This should be fixed independently of the mobile work.

#### Not present
- **WebSockets**: none. No `@router.websocket` anywhere.
- **Webhooks** (Stripe or other): none.
- **Server-rendered HTML pages**: none. The only HTML the backend produces is email bodies (`backend/app/services/email_service.py:54-128`).


### 3.3 Authentication flow as implemented

#### Mechanism: Bearer JWT, no cookies
- `get_current_user` reads `Authorization: Bearer <access>` through `HTTPBearer(auto_error=False)` (`backend/app/api/deps.py:12-42`). It decodes the token with `TokenType.ACCESS` and loads the `User` by `sub`. Any failure returns **401** `{"detail":"Not authenticated"}` with `WWW-Authenticate: Bearer`.
- There is **no cookie support whatsoever**. A grep for `set_cookie`/`Set-Cookie` finds nothing in `backend/app`. `allow_credentials=True` in CORS is therefore irrelevant.
- **Implication for mobile:** the API is already mobile-friendly. Store `access_token` and `refresh_token` in Keychain (iOS) or EncryptedSharedPreferences/Keystore (Android). Attach `Authorization: Bearer` to every call. On 401, call `/auth/refresh` once and retry. The web client does the same (`frontend/lib/auth.tsx:87-108`).

#### JWT details (`backend/app/core/security.py`)
- Algorithm **HS256** (`security.py:11`). The secret is `settings.jwt_secret`, from env `JWT_SECRET` (`config.py:192`; production value set on Render, `render.yaml:68-69` [redacted]).
- Access token claims: `sub` (user uuid str), `type:"access"`, `iat`, `exp = now + JWT_ACCESS_TOKEN_EXPIRE_MINUTES` (15) (`security.py:36-44`).
- Refresh token claims: `sub`, `type:"refresh"`, `ver` (= `users.refresh_token_version`), `iat`, `exp = now + JWT_REFRESH_TOKEN_EXPIRE_DAYS` (30) (`security.py:47-56`).
- Reset token claims: `sub`, `type:"reset"`, `pwf` (first 32 hex of sha256 of the current password hash), `iat`, `exp = now + 30 min` (`security.py:15,59-84`).
- There is no `iss`, `aud`, `jti` or device id. `decode_token` checks signature, exp and `type` (`security.py:87-96`).
- Passwords are hashed with bcrypt (`security.py:28-33`). The 72-byte maximum is enforced in the schemas (`backend/app/schemas/auth.py:9,24,43`).

#### Registration
`POST /auth/register` (`auth.py:139-173`):
1. Rate limit by IP.
2. Require `accepted_terms`.
3. Return 409 on a duplicate email.
4. Create the user with `terms_accepted_at` and `terms_version` (`config.py:79`).
5. `provision_new_user` creates "My workspace" with an owner membership (`auth.py:78-92`).
6. Commit and queue the welcome email through Celery.
7. Return tokens and the user.

There is **no email verification step.** The account is active immediately and `email_verified` is never checked.

#### Login
`POST /auth/login` (`auth.py:176-196`):
1. `resolve_login` maps the bare word "admin" to the admin bootstrap email (`auth.py:61-75`).
2. Verify bcrypt. Accounts with no password (Google-only) get 401.
3. `ensure_workspace` repairs accounts that have no workspace (`auth.py:95-112`).
4. Queue the geolocation refresh from `request.client.host` (`auth.py:115-124`).
5. Return `TokenResponse` only. The client must then call `/auth/me` or `/bootstrap`.

#### Google sign-in (ID-token flow, no redirect)
- Web: the frontend renders the Google Identity Services button and its JS callback receives a credential, which it POSTs to `/auth/oauth/google` (`frontend/components/auth/GoogleSignInButton.tsx:44,70-74`). **There is no OAuth redirect URI and no backend callback URL.** The token returns to the frontend in the JSON response body.
- Backend `POST /auth/oauth/google` (`auth.py:313-368`):
  1. Returns 501 if `GOOGLE_CLIENT_ID` is unset.
  2. `google_id_token.verify_oauth2_token(id_token, Request(), settings.google_client_id)`. **Exactly one audience is accepted.**
  3. Looks up `(oauth_provider="google", oauth_subject=sub)`, then falls back to the same email. An existing password account is linked (`auth.py:352-356`).
  4. A new user gets a workspace and a welcome email.
- **The `email_verified` claim is not checked** before linking by email (`auth.py:332-339`). **ASSUMPTION:** this is low risk for Google consumer accounts, but should be checked.
- `GOOGLE_CLIENT_SECRET` is declared in config (`config.py:196`) but never used.
- **Mobile impact:** native Google Sign-In on iOS and Android produces ID tokens whose `aud` is the iOS client ID or the web/server client ID, depending on configuration. **ASSUMPTION:** with Android `requestIdToken(serverClientId)` or iOS `GIDConfiguration(serverClientID:)` set to the existing web client ID, the `aud` matches and no backend change is needed. Otherwise the backend must accept a list of client IDs. **Sign in with Apple is not implemented.** **ASSUMPTION:** App Store guideline 4.8 will require it on iOS when Google sign-in is offered.

#### Refresh
`POST /auth/refresh` with `{refresh_token}` (`auth.py:276-310`):
1. Validates type `refresh` and checks that `ver == user.refresh_token_version`.
2. Issues a new access token **and a new refresh token with the same version**. There is no rotation and no reuse detection (`auth.py:300-310`).
3. Each refresh resets the 30-day expiry. The session therefore slides indefinitely while the app is used at least every 30 days.
4. Rate limit: 30 per 300 s per IP.

#### Logout / revocation
- **There is no logout endpoint.** The web logout only clears `localStorage` (`frontend/lib/auth.tsx:36-38`). The refresh token stays valid until it expires.
- Revocation only happens by bumping `users.refresh_token_version` (`backend/app/models/user.py:20-25`). The only place that bumps it is password-reset confirm (`auth.py:264`). Account deletion removes the user row, so lookups fail.
- Access tokens cannot be revoked. They stay valid for up to 15 minutes after a version bump, because `get_current_user` does not check the version (`deps.py:28-42`).

#### Password reset
1. `POST /auth/password-reset/request` queues `send_password_reset_email_task(email, token)` (`auth.py:199-224`).
2. The worker builds the link as **`f"{settings.app_url.rstrip('/')}/reset-password?token={quote(token)}"`** (`backend/app/workers/send_password_reset_email.py:17`). `APP_URL` is the env var holding the frontend URL. It is `https://clardentity.ai` in production (`render.yaml:103-104`) and defaults to `http://localhost:3000` (`config.py:203`). The web route is `frontend/app/(auth)/reset-password/`.
3. The reset page posts `{token, password}` to `/auth/password-reset/confirm`. The token is single-use through the password fingerprint (`security.py:59-72`, `auth.py:257-258`). It expires after 30 minutes. On success the user is signed straight in with fresh tokens.
- Mobile: to open the app from the email, serve `apple-app-site-association` and `assetlinks.json` on `clardentity.ai` covering `/reset-password`. Without that, the user resets on the web and signs in on the phone afterwards.
- The welcome email CTA is `settings.app_url` (`backend/app/workers/send_welcome_email.py:17`).
- Email sender caveat: `DEPLOYMENT.md:184-192` says the Resend sender was `onboarding@resend.dev`, which only delivers to the owner. `render.yaml:105-106` now sets `EMAIL_FROM` to `hello@clardentity.ai`. **ASSUMPTION:** the domain has since been verified.

#### Email verification
None exists. There is no verified flag on `User` (`backend/app/models/user.py:11-68`).

#### Admin role
- `is_admin(user)` is true when the email is in `ADMIN_EMAILS` (comma list, default and production `admin@clardentity.ai`) (`backend/app/services/admin_access.py:25-30`, `render.yaml:84-85`). The flag is not stored. It is computed into `UserPublic.is_admin` (`backend/app/schemas/auth.py:57,61-67`).
- `require_admin` returns 404 for non-admins (`admin_dashboard.py:35-40`). See the `/admin/settings` gap in 2.18.
- A bootstrap admin is created at boot when `ADMIN_BOOTSTRAP_PASSWORD` is set (`admin_access.py:33-64`; production value [redacted], `render.yaml:88-89`).

#### Onboarding gate
- `UserPublic.onboarding_completed_at` is null until `POST /profile/onboarding` is called (`backend/app/schemas/auth.py:50-52`, `profile.py:262-300`). **The client enforces this gate.** The backend does not block any endpoint for un-onboarded users. The web routes them to `/welcome`.
- The terms gate applies only at registration (`auth.py:147-151`). Google sign-up does **not** record `terms_accepted_at` (`auth.py:343-348`).

#### Summary
**Auth is bearer-token based (JWT in the `Authorization` header). It is not cookie-based.** Nothing depends on browser cookie semantics, so native apps can use the same endpoints unchanged. The gaps are lifecycle features (logout, per-device revocation, Apple sign-in, multi-audience Google), not transport.


### 3.4 Database engine, ORM and full schema

#### Database engine, ORM, pooling, migrations

##### Engine
| Item | Value | Source |
|---|---|---|
| RDBMS | PostgreSQL (Supabase in prod; `pgvector/pgvector:pg16` image locally) | `DEPLOYMENT.md:3-4,9`; `infra/docker-compose.yml:8-9` |
| Vector extension | pgvector (`CREATE EXTENSION IF NOT EXISTS vector`); prod reports pgvector 0.8.2 | `backend/alembic/versions/3de2e7bee450_initial_schema.py:24`; `DEPLOYMENT.md:9` |
| Python pgvector binding | `pgvector==0.5.0` (`pgvector.sqlalchemy.Vector`) | `backend/requirements.txt`; `backend/app/models/document.py:4,48` |
| Embedding dimension | 1536 (`text-embedding-3-small`) | `backend/app/models/document.py:11` |
| Vector index | `ivfflat (embedding vector_cosine_ops) WITH (lists = 100)` on `document_chunks` | `3de2e7bee450_initial_schema.py:107-110` |
| Full-text index | GIN on `to_tsvector('english', coalesce(content,''))` on `messages` | `3de2e7bee450_initial_schema.py:132-135`; used by `backend/app/api/history.py:15-55` |
| Prod connection | Supabase Supavisor **transaction-mode pooler** (`aws-N-<region>.pooler.supabase.com:6543`) because direct host is IPv6-only | `render.yaml:51-55`; `DEPLOYMENT.md:39` |
| `DATABASE_URL` | env var, `sync: false` (secret, set on dashboard) | `render.yaml:54-55`; `backend/app/core/config.py:179` |

##### ORM / query layer
- **SQLAlchemy 2.0.51**, fully **async** (`create_async_engine`, `AsyncSession`, `async_sessionmaker`) with **asyncpg 0.31.0** driver (`backend/requirements.txt`; `backend/app/db/session.py:1-45`). `psycopg2-binary` is also installed (`requirements.txt`) - ASSUMPTION: unused at runtime (no sync engine found).
- Declarative typed models (`Mapped[...]`, `mapped_column`) on a single `Base(DeclarativeBase)` (`backend/app/models/base.py:4-5`).
- Some raw SQL via `text()`: history FTS search (`backend/app/api/history.py:28-41`), admin NL->SQL query runner (`backend/app/api/admin_dashboard.py:340-360`).

##### Connection / pooling settings (`backend/app/db/session.py`)
| Setting | Value | Line |
|---|---|---|
| `statement_cache_size` | 0 (required by Supavisor transaction mode) | 15, 28 |
| `pool_pre_ping` | True | 19 |
| `pool_size` | `DB_POOL_SIZE` default 3 (render.yaml sets "3") | 23; `config.py:74`; `render.yaml:90-91` |
| `max_overflow` | `DB_MAX_OVERFLOW` default 2 (render.yaml "2") | 24; `config.py:75`; `render.yaml:92-93` |
| `pool_recycle` | 300 s | 27 |
| Worker engine | separate `NullPool` engine for Celery tasks (each task runs its own `asyncio.run`) | 33-40 |
| Request session | `get_db()` yields `AsyncSessionLocal()` per request, `expire_on_commit=False` | 31, 43-45 |

##### Migration tool and deploy behaviour
- **Alembic 1.18.5** (`requirements.txt`), async env (`backend/alembic/env.py:86-114`), `target_metadata = Base.metadata` (`env.py:27`).
- `%` in `DATABASE_URL` escaped to `%%` for configparser (`env.py:22-25`).
- Cluster-wide lock: `SELECT pg_advisory_xact_lock(8374652910)` inside Alembic's transaction (`env.py:75-83`); `NullPool` + `statement_cache_size=0` (`env.py:98-103`).
- Runs **twice per deploy, idempotently**: Render `preDeployCommand: alembic upgrade head` (`render.yaml:20-24`) and again at container boot in `backend/start.sh` (`alembic upgrade head` under `set -e`, so a failed migration fails the boot). `DEPLOYMENT.md:105-121` documents that preDeployCommand was inert on the free plan, hence the boot-time run.

##### Alembic migrations (27 files, linear chain)
Chain order reconstructed from each file's `Revises:` header.

| # | File (`backend/alembic/versions/`) | Date | What it changes |
|---|---|---|---|
| 1 | `3de2e7bee450_initial_schema.py` | 2026-07-26 | Enables `vector`; creates `admin_settings`, `users`, `workspaces`, `conversations`, `documents`, `workspace_members`, `conversation_memory`, `document_chunks` (+ivfflat index), `messages` (+conversation_id index, FTS GIN index), `audio_transcripts`, `citations`, `message_claims`, `claim_evidence`. Modes then limited to knowing/thinking/decision/learning. |
| 2 | `a1b2c3d4e5f6_bias_taxonomy.py` | 2026-08-04 | Drops `ck_message_claims_distortion_flag` (vocabulary now app data), adds `message_claims.bias_category`, index `ix_message_claims_distortion_flag`. |
| 3 | `b2c3d4e5f6a7_user_profiles.py` | 2026-08-05 | Creates `user_profiles` (personality_md, roles JSONB, user_edited, messages_at_last_build, timestamps). |
| 4 | `c3d4e5f6a7b8_counterfactual_and_web_sources.py` | 2026-08-10 | `messages.counterfactual_content`; `citations.url/title/credibility_score/credibility_note`. |
| 5 | `d4e5f6a7b8c9_support_bands_and_clarifier.py` | 2026-08-10 | Widens claim entailment check; adds `messages.clarifier` JSONB. |
| 6 | `e5f6a7b8c9d0_profile_aspects.py` | 2026-08-11 | `user_profiles.aspects` JSONB. |
| 7 | `f6a7b8c9d0e1_veracity_tiers.py` | 2026-08-12 | Claim entailment labels -> veracity tiers; adds `message_claims.reconciliation_note`, `message_claims.dynamic` (bool, default false). |
| 8 | `a7b8c9d0e1f2_turn_guidance.py` | 2026-08-13 | `messages.guidance` JSONB. |
| 9 | `b8c9d0e1f2a3_user_location.py` | 2026-08-13 | `users.location_label/location_country/location_timezone/location_updated_at`. |
| 10 | `c9d0e1f2a3b4_imported_history.py` | 2026-08-13 | `user_profiles.imported_context/imported_source/imported_at`. |
| 11 | `d0e1f2a3b4c5_pro_interest.py` | 2026-08-13 | Creates `pro_interest` + `ix_pro_interest_user_id`. |
| 12 | `e1f2a3b4c5d6_decision_review.py` | 2026-08-14 | `messages.decision_review` JSONB. |
| 13 | `f2a3b4c5d6e7_thinking_review.py` | 2026-08-14 | `messages.thinking_review` JSONB. |
| 14 | `c1d2e3f4a5b6_companion_names.py` | 2026-08-18 | `users.companion_names` JSONB. |
| 15 | `d2e3f4a5b6c7_opinion_claim_tier.py` | 2026-08-31 | Adds `opinion` to claim entailment check. |
| 16 | `e3f4a5b6c7d8_message_feedback.py` | 2026-09-01 | `messages.feedback` JSONB. |
| 17 | `f4a5b6c7d8e9_message_forking.py` | 2026-09-01 | `messages.parent_id` (self-FK CASCADE, indexed) + `conversations.active_leaf_id` (FK SET NULL); backfills a linear tree. |
| 18 | `a5b6c7d8e9f0_three_new_modes.py` | 2026-09-01 | Mode checks add mentoring, therapy, creative. |
| 19 | `b6c7d8e9f0a1_message_crux.py` | 2026-09-03 | `messages.crux_text`. |
| 20 | `c7d8e9f0a1b2_onboarding.py` | 2026-09-12 | `users.onboarding_completed_at`; `user_profiles.onboarding_answers` JSONB. |
| 21 | `d8e9f0a1b2c3_rapid_mode.py` | 2026-09-13 | Mode checks add `rapid`. |
| 22 | `e0f1a2b3c4d5_legal_mode.py` | 2026-09-22 | Mode checks add `legal`. |
| 23 | `f1a2b3c4d5e6_preview_access.py` | 2026-09-23 | `users.preview_unlocked_at`. |
| 24 | `a2b3c4d5e6f7_pin_conversation.py` | 2026-09-25 | `conversations.pinned_at`. |
| 25 | `b3c4d5e6f7a8_terms_acceptance.py` | 2026-09-28 | `users.terms_accepted_at`, `users.terms_version`. |
| 26 | `c4d5e6f7a8b9_learning_role.py` | 2026-10-07 | `user_profiles.learning_role` (String 16). |
| 27 | `d5e6f7a8b9c0_generated_image.py` | 2026-10-07 | `messages.generated_image` JSONB (head). |


#### Full schema (15 tables, 15 models)

All models registered in `backend/app/models/__init__.py:1-36`. Types: UUID = `postgresql.UUID(as_uuid=True)`; ts = `DateTime(timezone=True)`. "srv now()" = `server_default=func.now()`.

##### `users` - `backend/app/models/user.py:11`
| Column | Type | Null | Default / notes |
|---|---|---|---|
| id | UUID PK | no | `uuid4` (l.14) |
| email | String | no | **unique, indexed** `ix_users_email` (l.15) |
| password_hash | String | yes | bcrypt (`core/security.py:28-33`); null for Google-only accounts |
| oauth_provider / oauth_subject | String | yes | "google" + Google `sub` (l.17-18) |
| display_name | String | yes | |
| refresh_token_version | Integer | no | 0; bump revokes all refresh tokens (l.23-25) |
| location_label | String(120) | yes | "City, Region, Country" from IP (l.29) |
| location_country | String(2) | yes | ISO code (l.30) |
| location_timezone | String(64) | yes | (l.31) |
| companion_names | JSONB | yes | `{"learning":"Nick",...}` per mode (l.37) |
| location_updated_at | ts | yes | (l.38) |
| onboarding_completed_at | ts | yes | (l.45) |
| terms_accepted_at | ts | yes | (l.52) |
| terms_version | String(20) | yes | current `2026-09-28` (`config.py:79`) |
| preview_unlocked_at | ts | yes | paid-tier preview grant (l.60) |
| created_at | ts | no | srv now() |
Relationships: `workspace_memberships` -> WorkspaceMember; `profile` -> UserProfile (1:1, cascade delete-orphan) (l.65-68).

##### `workspaces` - `backend/app/models/workspace.py:11`
id UUID PK; `owner_id` UUID FK `users.id` (**no ON DELETE**) not null; `name` String not null; created_at srv now(). Relationship `members` (cascade delete-orphan).

##### `workspace_members` - `backend/app/models/workspace.py:24`
Composite PK (`workspace_id` FK workspaces CASCADE, `user_id` FK users CASCADE); `role` String not null, CHECK `role IN ('owner','member')`. ASSUMPTION: no invite/sharing endpoint exists, so in practice each user has only their own workspaces (`backend/app/api/workspaces.py` has create/list/get/patch/delete only).

##### `conversations` - `backend/app/models/conversation.py:23`
| Column | Type | Null | Notes |
|---|---|---|---|
| id | UUID PK | no | |
| workspace_id | FK workspaces CASCADE | no | |
| title | String | yes | auto-named by small model on first turn |
| default_mode | String | yes | CHECK in `COGNITIVE_MODES` (l.10-20, 26-28) |
| active_leaf_id | FK messages.id SET NULL | yes | tip of displayed branch (l.45-47) |
| pinned_at | ts | yes | |
| created_at | ts | no | srv now() |
Enum `COGNITIVE_MODES` = rapid, knowing, thinking, decision, learning, mentoring, therapy, creative, legal (`conversation.py:10-20`).

##### `messages` - `backend/app/models/message.py:48`
| Column | Type | Null | Notes |
|---|---|---|---|
| id | UUID PK | no | |
| conversation_id | FK conversations CASCADE | no | index `ix_messages_conversation_id` (migration only) |
| parent_id | FK messages CASCADE | yes | tree/forking; index `ix_messages_parent_id` |
| role | String | no | CHECK user/assistant/system |
| content | Text | yes | **user/assistant text**; FTS GIN index |
| mode_used | String | no | CHECK in COGNITIVE_MODES |
| reasoning_lens | String | yes | thinking mode only (11 lenses, `services/router.py:11-23`) |
| confidence_score | Numeric | yes | |
| confidence_band | String | yes | CHECK Likely Fact / Plausible / Needs Verification (l.21) |
| distortion_penalty_applied | Boolean | no | False |
| avatar_expression / avatar_gesture | String | yes | |
| counterfactual_content | Text | yes | devil's-advocate version |
| crux_text | Text | yes | one-sentence gist |
| clarifier | JSONB | yes | `{question, options[]}` |
| guidance | JSONB | yes | `{suggested_mode, mode_reason, refined_question, refinement_reason}` |
| decision_review | JSONB | yes | decision mode verdict box |
| thinking_review | JSONB | yes | `{sound[], biased[]}` |
| generated_image | JSONB | yes | `{id, prompt, ...}` pointer to object storage |
| feedback | JSONB | yes | `{rating: up/down/null, comment}` |
| token_usage | JSONB | yes | `{input_tokens, output_tokens, total_tokens, calls, by_model}` |
| created_at | ts | no | srv now() |
Relationships: `claims` (ordered by claim_index, cascade), `citations` (cascade) (l.122-128).

##### `message_claims` - `backend/app/models/message.py:131`
id UUID PK; `message_id` FK messages CASCADE, indexed; `claim_index` Integer not null; `claim_text` Text not null; `claim_score` Numeric; `entailment_label` String CHECK in `ENTAILMENT_LABELS` (verifiable_fact, probable_fact, gray_area, distorted, fabricated, opinion + legacy full/moderate/partial/none/unsupported; l.28-40); `distortion_flag` String indexed (bias id from `app/data/biases.json`, no CHECK); `distortion_explanation` Text; `bias_category` String; `reconciliation_note` Text; `dynamic` Boolean default false; created_at.

##### `claim_evidence` - `backend/app/models/message.py:178`
id UUID PK; `claim_id` FK message_claims CASCADE, indexed; `citation_id` FK citations SET NULL; `support_score`, `relevance_score` Numeric; `entailment_label` CHECK full/partial/none; `source_excerpt` Text; created_at.

##### `citations` - `backend/app/models/message.py:204`
id UUID PK; `message_id` FK messages CASCADE; `document_id` FK documents CASCADE (null for web); `chunk_id` FK document_chunks CASCADE; `source_type` CHECK document/web; `marker` Integer; `relevance_score` Numeric; web-only `url`, `title` Text, `credibility_score` Numeric, `credibility_note` Text.

##### `audio_transcripts` - `backend/app/models/message.py:235`
id UUID PK; `message_id` FK messages CASCADE; `storage_path` String (never written - raw audio is not stored, `backend/app/api/chat.py:1147-1160`); `transcript` Text; `duration_seconds` Numeric. No timestamps.

##### `documents` - `backend/app/models/document.py:14`
id UUID PK; `workspace_id` FK workspaces CASCADE (index `ix_documents_workspace_id` from migration); `filename` String not null; `file_type` String; `storage_path` String (S3 key `{workspace_id}/{document_id}/{filename}`); `status` CHECK uploading/processing/processed/failed, default "uploading"; `uploaded_by` FK users (**no ON DELETE**) not null; created_at.

##### `document_chunks` - `backend/app/models/document.py:39`
id UUID PK; `document_id` FK documents CASCADE; `chunk_index` Integer; `content` Text; **`embedding` Vector(1536)** nullable (ivfflat cosine index); `page_number` Integer; created_at.

##### `conversation_memory` - `backend/app/models/memory.py:11`
id UUID PK; `conversation_id` FK conversations CASCADE, **unique**; `summary` Text; `updated_at` srv now()/onupdate.

##### `user_profiles` - `backend/app/models/profile.py:11`
PK `user_id` FK users CASCADE; `personality_md` Text; `imported_context` Text (user's own messages from ChatGPT/Claude/Gemini export); `imported_source` String(32); `imported_at` ts; `onboarding_answers` JSONB `[{question, answer}]`; `aspects` JSONB `[{id,label,value,source}]`; `roles` JSONB `[{role_id, qualifiers, evidence}]`; `learning_role` String(16) student/teacher/visiting; `user_edited` bool default false; `messages_at_last_build` Integer default 0; created_at/updated_at.

##### `pro_interest` - `backend/app/models/pro_interest.py:11`
id UUID PK; `user_id` FK users CASCADE, indexed; `requested_model` String(32) (allowed: "clar pro", "clar max", "clar ultra", `backend/app/api/pro.py:33`); created_at. Unique (`user_id`,`requested_model`).

##### `admin_settings` - `backend/app/models/admin.py:10`
`key` String PK; `value` JSONB not null; `updated_at`. Runtime overrides; defaults in `backend/app/services/admin_settings_service.py:10-48` (openai_model, openai_temperature, retrieval_top_k=5, scoring_weights, avatar_gesture_map, feature_flags tts_enabled/image_input_enabled/bias_screening_enabled/web_search_enabled).

##### Static reference data (not in DB)
`backend/app/data/biases.json` (~437 cognitive biases, 10 categories), `decisions.json` (decision categories), `roles.json` (25 user roles) - loaded by `backend/app/services/taxonomy.py`.

##### Cascade gaps worth knowing
`workspaces.owner_id` and `documents.uploaded_by` have no ON DELETE; account deletion handles them manually (`backend/app/api/auth.py:383-413`).


### 3.5 Background jobs, the answer pipeline, storage, email and monitoring

#### Background processing

- **Queue:** Celery 5.6.3 with Redis as broker **and** result backend (`backend/app/core/celery_app.py:20-34`); JSON serializer, UTC (`celery_app.py:36-42`). `rediss://` URLs get `ssl_cert_reqs=required` appended (`celery_app.py:6-17`; `DEPLOYMENT.md:63-79`).
- **Redis provider:** Upstash (TLS) in prod (`DEPLOYMENT.md:3-5,11`).
- **Worker topology:** started in the web container by `backend/start.sh` (`celery -A app.core.celery_app worker --concurrency=1 --max-tasks-per-child=100 --without-gossip --without-mingle --without-heartbeat &`, then `exec uvicorn`). One worker per autoscaled instance. Locally a separate `celery_worker` service (`infra/docker-compose.yml:84-101`).
- **No scheduler:** no `beat_schedule`/cron anywhere in `backend/app` (grep). No retention/purge jobs.

| Task name | File | Triggered from | Does |
|---|---|---|---|
| `ingest_document` | `backend/app/workers/ingest_document.py:11-36` | `POST /documents/upload` (`api/documents.py:91`) | Download from S3, extract/chunk/embed (`services/document_ingestion.build_chunks`), set status processed/failed |
| `rebuild_memory` | `backend/app/workers/rebuild_memory.py` | chat turn when `should_rebuild_memory` (every 15 messages, `services/memory_service.py:11-12,30`) (`api/chat.py:1486,1653`) | Rolling conversation summary via Claude fast model |
| `rebuild_profile` | `backend/app/workers/rebuild_profile.py` | chat turn every 8 new user messages (`services/profile_service.py:45,260-268`; `api/chat.py:1494,1661`), profile rebuild/onboarding/import (`api/profile.py:258,296,348`) | Infer personality_md + roles from last 60 user messages + doc filenames + onboarding answers + imported history (`profile_service.py:40,80-120`) |
| `refresh_location` | `backend/app/workers/refresh_location.py:18-47` | login/OAuth (`api/auth.py:116-124,194,363`) | IP -> city/country/timezone via ipapi.co, at most every 14 days; IP itself not stored |
| `send_welcome_email` | `backend/app/workers/send_welcome_email.py` | register/new Google user (`api/auth.py:127-136`) | Resend email |
| `send_password_reset_email` | `backend/app/workers/send_password_reset_email.py` | `POST /auth/password-reset/request` (`api/auth.py:218`) | Resend email with `{APP_URL}/reset-password?token=...` (30-min JWT) |

In-process background work (not Celery), via `asyncio.create_task` in `backend/app/api/chat.py`: conversation title (`chat.py:730-783`), counterfactual write-back (`chat.py:785-797`), stated-fact capture (`chat.py:1492,1659` -> `services/stated_facts.py`).

**Other Redis uses** (redis-py 8.0.1 async):
- Fixed-window rate limiter, keys `ratelimit:*`, fails open (`backend/app/core/rate_limit.py:10-40`).
- Preview-mode daily counter `preview:{user_id}:{YYYY-MM-DD}` (`backend/app/services/preview_access.py:27-72`).
- Guest demo budgets `guest:session:{id}`, `guest:address:{ip}`, `guest:global:{date}` (`backend/app/services/guest_demo.py:56-67`).
- Health check ping (`backend/app/api/health.py:33-41`).

Rate limits observed: chat send 20/min/user (`api/chat.py:806`); feedback 30/min (`chat.py:624`); audio transcribe & TTS 20/min (`api/audio.py:25,50`); realtime session 20/hour (`api/realtime.py:144-145`); register/login 10 per 5 min per IP, reset-request 5/15 min, reset-confirm 10/15 min, refresh 30/5 min (`api/auth.py:143,180,211,232,280`).


#### Core product pipeline (chat question -> answer)

Entry point: `POST /api/v1/chat/{conversation_id}/messages` -> `send_message` (`backend/app/api/chat.py:799-1702`), returns **SSE** (`sse-starlette`). The answer machinery is shared with the landing-page guest demo via `backend/app/services/answer_pipeline.py` (`AnswerRun`, l.237).

##### Request shape
`MessageCreate` (`backend/app/schemas/chat.py` ~l.80-116): `content`, `mode` (mandatory, 400 if missing/invalid, `services/router.py`), `reasoning_lens`, `model` (Co-Creative picker), `attachments[]` (`{type: image|document, data: base64, mime_type, filename}`, l.61-73), `audio_duration_seconds`, `parent_id` (edit/fork), `regenerate_of`, gate flags `mode_confirmed`, `refined_confirmed`, `clarifying_confirmed`, `context_acknowledged`, `context_rounds`.

##### SSE events emitted
`status`, `review`, `crux`, `delta`, `answer`, `image`, `final`, `error`, plus gate stops `refined_question`, `clarifying_options`, `context_question`, `mode_suggestion`; guest-only `switched`, `budget` (grep of `"event":` across `backend/app`).

##### Step by step (signed-in path)
1. Rate limit, load conversation/admin settings/all messages (`chat.py:806-822`).
2. **Preview/plan gate**: modes in `PREVIEW_MODES` (default `mentoring,therapy,creative,legal`, `config.py:89`) require `users.preview_unlocked_at` (else **402**) and a Redis daily cap `PREVIEW_DAILY_MESSAGES`=25 (`config.py:164`; `chat.py:985-1003`; `services/preview_access.py`). Spent only after gates pass (`chat.py:1121-1122`). Toggled by `POST/DELETE /api/v1/pro/preview` (`api/pro.py:71-107`). No billing/payments exist (`services/preview_access.py:4-6`).
3. **History** = active branch via `parent_id` tree, last 20 (`services/message_tree.py`; `HISTORY_WINDOW=20`, `memory_service.py:11`); **conversation memory summary** read (`chat.py:1051`).
4. In parallel:
   - **Guidance / gates** (skipped in rapid): `propose_guidance` - Claude fast model structured call (`services/guidance.py:397-405`) producing refined question, clarifying options, context question, suggested mode.
   - **Search plan**: `plan_searches` (fast model, `services/search_planner.py`) or `optimize_query` (`services/query_optimizer.py`) for retrieval-only rewrite (`chat.py:849-863`).
   - **Prefetch**: pgvector retrieval (`services/retrieval.py:41-87`, top-k from admin setting, Knowing adds up to two "Wh-lens" sub-queries) + speculative web search `gather_context` (Tavily, country-biased, `services/web_research.py:506-546`) (`chat.py:865-919`).
5. **Co-Creative image intent** (`wanted_image`, fast-model structured call, `services/image_generation.py:156`) decided before gates (`chat.py:1081-1088`).
6. **Gate stop** - `gate_event` fixed order: refined_question -> clarifying_options -> context_question (max rounds `MAX_CONTEXT_ROUNDS`) -> mode_suggestion (`answer_pipeline.py:130-209`). If one fires, only that event is streamed and nothing is persisted (`chat.py:1095-1116`). **Smart mode switching** is client-driven off the `mode_suggestion` event in the app; the guest endpoint performs the switch server-side when `smart_switching` is true and emits `switched` (`api/guest.py:124,316-348`). ASSUMPTION: in the signed-in app the auto-switch countdown lives in the frontend (analytics event `mode_switched_automatically`, `docs/analytics.md`).
7. **Attachments**: documents are ingested synchronously into the workspace (stored to S3, chunked, embedded) and their first 12 chunks lead the context (`chat.py:115-196`); images go to the model as vision input if `image_input_enabled` (`chat.py:1325-1333`).
8. Persist user message, `AudioTranscript` row if voice (`chat.py:1124-1145`), set `active_leaf_id`, derived title (`chat.py:1147-1173`).
9. **Decision classification** (`services/decision_classifier.py`, Claude structured) -> bias domain; Decision mode injects a bias watch-list (`chat.py:1196-1249`).
10. **Verdict boxes** started early: `review_decisions` (decision mode, `services/decision_review.py`) / `review_thinking` (thinking mode, `services/thinking_review.py`) (`chat.py:1222-1237`).
11. **Prompt**: `build_system_instructions` (`services/prompt_builder.py`; `IDENTITY` l.18, `MODE_INSTRUCTIONS` l.67-170 for all 9 modes, formatting rules incl. `<crux>` and `<claim id="n">` tags l.180, learning-role variants l.278-300) with profile block (`profile_service.profile_prompt_block`), hedged IP-location line (`services/geolocation.py:location_prompt_line`), **companion name** (`services/companion_names.name_for`; stored in `users.companion_names`, max 24 chars, `companion_names.py:14`), learning role, Thinking Framework guidance (`services/thinking_framework.py`).
12. **Model routing** (`answer_pipeline.generation_model_for`, l.111-127): admin override > rapid -> `ANTHROPIC_RAPID_MODEL` (`claude-haiku-4-5-20251001`) > `FAST_GENERATION_MODES` (knowing, learning, creative, decision, legal) -> `ANTHROPIC_FAST_MODEL` (`claude-sonnet-5`) > else flagship `ANTHROPIC_MODEL` (`claude-opus-5`) (`config.py:44-63`). Co-Creative picker (`services/model_catalog.py`, `PICKABLE_MODES = {"creative"}` l.34 - note docstring also mentions Learning but code allows Co-Creative only) can route to Claude Opus/Sonnet/Fable/Haiku, GPT-5.6 Sol/Terra/5.4-mini, Gemini Pro/Flash, Grok via `services/model_router.py` with **no fallback**.
13. **Generation** streamed (`services/anthropic_client.stream_generation`): Claude with prompt caching (`cached()`, l.67-68), retries (tenacity 3x), circuit breaker (5 failures/30s), automatic **OpenAI fallback** (`openai_model` gpt-5.4-mini) on 401/403/429/5xx/529/connection/credit exhaustion (`anthropic_client.py:189-258,393-432`). Crux streamed as `crux` event; claim tags stripped from `delta` stream (`answer_pipeline.py:340-472`).
14. **Rapid mode** ends here: no reflection, claims, score, counterfactual (`chat.py:1465-1472`).
15. **Analyse** (`answer_pipeline.py:489-746`), all concurrent:
    - Claim extraction from `<claim>` tags (`services/claim_parser.py`).
    - Reflection/revision pass (not in Knowing) (`services/reflection_agent.py`, fast model).
    - Per-claim **verification** against cited evidence + bias screening against ~60-bias domain shortlist (`services/verification_agent.verify_claim`, Claude structured).
    - **Per-claim web research** for unsupported claims, up to 6 claims, 2 search+supervisor rounds each, 45 s phase deadline, credibility floor 0.55 (`answer_pipeline.py:65-93`; `services/web_research.research_claim`, l.547+). Search via Tavily (advanced depth) or, without a Tavily key, OpenAI Responses `web_search` tool first and Claude `web_search_20260209` tool as fallback (`web_research.py:184-201,426-455`). PDF results fetched and table-parsed with SSRF guards (https only, private IPs refused, 10 MB cap, 12 s timeout) (`services/pdf_source.py:1-47`).
    - **Blind second look** for `gray_area` claims (`verification_agent.reconcile_gray_area`) (`answer_pipeline.py:662-691`).
    - **Confidence scoring** (`services/confidence_scoring.py:315-379`): score = 0.6*mean claim score + 0.25*citation coverage + 0.15*relevance (weights admin-tunable), minus 15 for any distortion; bands Likely Fact >=90, Plausible >=70, else Needs Verification; all-opinion answers get no band.
    - **Counterfactual / devil's advocate** generated automatically after the draft (`services/devils_advocate.py`; `answer_pipeline.py:520-523`), written to `messages.counterfactual_content` in background (`chat.py:1532-1536`); also on demand `POST /chat/{cid}/messages/{mid}/devils-advocate` (`chat.py:503`).
16. **Avatar cue**: gesture by mode, expression by band, "concerned" on distortion (`services/avatar_cue_service.py:1-51`; admin-overridable gesture map).
17. Persist assistant message + claims + evidence + citations + reviews + `token_usage` (`chat.py:1545-1650`); queue memory/profile rebuilds; capture stated facts (`services/stated_facts.py` - regex gate then fast-model extraction into profile aspects with source "stated"); `final` event with avatar cue; INFO log of per-phase timings (`chat.py:1685`).

##### Other pipeline pieces
| Feature | Files |
|---|---|
| Co-Creative image generation | `services/image_generation.py` - OpenAI `POST /v1/images/generations` or `/v1/images/edits` (refs = attached images or last generated), model `IMAGE_MODEL` `gpt-image-2.5-sunburst`, 1024x1024, converted to WebP q82, stored at `generated/{user_id}/{image_id}.webp` (l.249-352; `config.py:112-116`) |
| Office export (Co-Creative) | `services/office_export.py` (docx/pptx/xlsx via structured Claude call), route `POST /chat/{cid}/messages/{mid}/export-file` (`chat.py:562`) - generated per request, not stored |
| Conversation export | `services/export_service.py` (Markdown / PDF via fpdf2), `GET /chat/{cid}/export` (`chat.py:468`) |
| Inline composer autocomplete | `api/compose.py` (`POST /compose/complete`, smallest model, max 12 words) |
| Conversation titles | `services/conversation_title.py` |
| Memory | `services/memory_service.py`, `api/memory.py` (`GET /memory/{cid}`, `POST /memory/{cid}/rebuild`) |
| Personality profile | `services/profile_service.py`, `api/profile.py` (GET/PUT profile, aspects add/delete, learning-role, roles, DELETE (forget), rebuild, onboarding, import of ChatGPT/Claude/Gemini export up to 60 MB, `profile.py:305`) ; parser `services/chat_import.py` keeps only the user's own messages |
| Validation panel | `api/validation.py` (`GET /validation/{message_id}`), `services/claim_loader.py` |
| Bias catalogue API | `api/biases.py` (categories, decision categories, list, detail) |
| Message tree (edit/regenerate/branches) | `services/message_tree.py`; `PUT /chat/{cid}/active-leaf`, `DELETE /chat/{cid}/messages/{mid}` |
| Feedback | `PUT /chat/{cid}/messages/{mid}/feedback` -> `messages.feedback` (`chat.py:608-640`) |
| Output cleanup (dashes, tags) | `services/output_cleanup.py` |
| Guest demo (no account) | `api/guest.py` (`GET /guest/budget`, `POST /guest/chat`, authenticated `POST /guest/import`), `services/guest_demo.py`: 5,000 tokens/session, 400,000/IP/day, 2,000,000/day global (`config.py:102`); stores nothing except Redis counters |
| Bootstrap | `POST /bootstrap` - user + workspaces + an empty chat in one call (`api/bootstrap.py`) |

##### Voice
| Function | Endpoint | Provider/model | File |
|---|---|---|---|
| STT (push-to-talk) | `POST /audio/transcribe` (multipart; webm/mp3/wav/m4a/ogg/mp4/mpeg/mpga) | OpenAI `whisper-1`, `verbose_json`, silence detection | `api/audio.py:17-41`; `services/openai_client.py:381-408` |
| TTS ("Listen") | `POST /audio/tts` -> `audio/mpeg` stream | OpenAI `tts-1`, voice `alloy`; gated by `tts_enabled` flag; not stored | `api/audio.py:44-60`; `openai_client.py:411-422` |
| Live call | `POST /realtime/session` -> `{client_secret, expires_at}` | OpenAI Realtime `gpt-realtime-2.1`, voice `marin`, input transcription `whisper-1`; client connects to OpenAI directly (WebRTC); instructions include profile + accent hints from device languages/timezone/IP location | `api/realtime.py:1-228`; `config.py:175-176` |
| Call transcript save | `POST /chat/{cid}/call-transcript` - saved unscored | | `chat.py:1704-1763` |


#### File storage

- **S3-compatible object storage** via boto3 (`backend/app/services/storage.py:1-30`, SigV4). Prod: **Supabase Storage S3 endpoint**, bucket `clardentity-prod`, region `ap-northeast-2` (`render.yaml:58-67`; `.env.example:15` comment; `DEPLOYMENT.md:10`). Local: MinIO bucket `clardentity-dev` (`infra/docker-compose.yml:34-61`; `config.py:185-189`, default creds [redacted]).
- **Keys**:
  - Uploaded/attached documents: `{workspace_id}/{document_id}/{filename}` (`api/documents.py:83`; `chat.py:177`).
  - Generated images: `generated/{user_id}/{image_id}.webp` (legacy `.png`) (`services/image_generation.py:323-331`).
- **Limits**: `MAX_UPLOAD_SIZE_MB` = 25 (`config.py:207`; `render.yaml:76-77`) for uploads and chat attachments; allowed document types pdf, docx, xlsx, xlsm, pptx, txt, md, markdown, csv, tsv, json, xml, html, htm, rtf, log, yaml, yml; legacy doc/xls/ppt rejected with guidance (`services/document_ingestion.py:29-65`). Chunking 650 tokens / 100 overlap with `cl100k_base` (`document_ingestion.py:20-24`). Profile import 60 MB. Audio has an extension allow-list but **no explicit size cap** (`api/audio.py:17-35`). Web PDFs 10 MB.
- **Serving back**:
  - Documents: original bytes are **not** downloadable through the API; only metadata and chunk counts (`api/documents.py:180-219`) and passage search (`api/documents.py:96-178`). Citations expose chunk excerpts.
  - Generated images: `GET /api/v1/images/{owner_id}/{image_id}.webp`, **unauthenticated** capability URL, `Cache-Control: private, max-age=31536000, immutable` (`api/images.py:26-48`).
  - TTS audio and office exports: streamed, never stored.
- **Deletion**: `DELETE /documents/{id}` removes the object (`documents.py:221-235`); account delete removes document objects (`auth.py:399-408`). **Not removed**: document objects when a workspace or conversation is deleted (`api/workspaces.py:103-116`, `chat.py:418-426` only delete rows - objects orphaned), and generated images on account delete (no code touches `generated/` on delete).


#### Email, analytics, logging/monitoring, cost tracking

##### Email
- Provider **Resend** via raw HTTPS (`httpx`) to `https://api.resend.com/emails` (`backend/app/services/email_service.py:17-51`). No-op if `RESEND_API_KEY` unset. From `EMAIL_FROM` = `Clardentity <hello@clardentity.ai>` (`render.yaml:105-106`).
- Templates (inline HTML f-strings): password reset (`email_service.py:54-83`), welcome (`email_service.py:86-128`). Only these two emails exist. Sent from Celery tasks (section 3). `DEPLOYMENT.md:178-196` notes the shared Resend sender only delivers to the owner address until a domain is verified (render.yaml now sets a clardentity.ai sender).

##### Analytics (server-side)
- No server-side product analytics SDK (no PostHog/Mixpanel/Segment in backend; grep). PostHog is **frontend-only** (EU cloud, `NEXT_PUBLIC_POSTHOG_KEY`), no content/email, no autocapture/replay (`docs/analytics.md`). Server-side PostHog events listed as "still to do" (`docs/analytics.md`, "Still to do").
- Internal admin analytics: `GET /api/v1/admin/overview` (users, per-user token spend, per-model spend, activity) and `POST /api/v1/admin/query` (Claude writes a read-only SELECT over allow-listed tables/columns, run in a read-only transaction, 10 s timeout, 500 rows) (`backend/app/api/admin_dashboard.py:76-375`). Admin = email in `ADMIN_EMAILS` (`services/admin_access.py:25-30`); bootstrap admin seeded at startup (`main.py:35-48`; `admin_access.py:33-64`).
- Demand signals stored in DB: `pro_interest` table, `messages.feedback`.

##### Logging / monitoring
- stdlib logging to stdout, format with `correlation_id` (`backend/app/core/logging_config.py:16-33`); `CorrelationIdMiddleware` honours/echoes `X-Request-ID` and adds `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` (`backend/app/core/middleware.py:11-45`).
- Per-turn phase timings logged at INFO (`chat.py:1499,1685`).
- `/health` checks DB, Redis, S3 bucket and reports uptime (`backend/app/api/health.py:24-73`); used as Render health check (`render.yaml:19`).
- **No Sentry/APM/error tracker** anywhere in the repo (grep for "sentry" returned nothing). Langfuse is used only by the offline evals harness (`evals/run.py:1-12`).

##### Cost / token tracking
- `services/token_meter.py`: a contextvar meter opened per chat turn (`chat.py:1384`); every Anthropic/OpenAI/Google/xAI call records input/output tokens per model (`anthropic_client._meter` l.144; `openai_client._meter` l.118; `extra_providers.py` incl. thinking tokens). Total written to `messages.token_usage` (`chat.py:1475,1565`).
- Guest demo spend tracked in Redis budgets (section 4.4). No per-user monetary cost or quota besides preview cap and rate limits.


#### Tests and evals

- **backend/tests** (pytest 9.1.1, pytest-asyncio auto mode, `backend/pytest.ini`): 27 files (~6,700 lines) - `test_api_contract.py` (1,820 lines; API surface + auth, needs a live DB/Redis), `test_admin_dashboard`, `test_answer_pipeline`, `test_anthropic_client` (fallback shim), `test_call_accent`, `test_chat_import`, `test_claim_parser`, `test_companion_names`, `test_geolocation`, `test_guest_demo`, `test_guidance`, `test_image_generation`, `test_ingestion` (all document types), `test_learning_role`, `test_message_tree`, `test_office_export`, `test_output_cleanup`, `test_pdf_source`, `test_pdf_tables`, `test_prompts`, `test_rate_limit`, `test_scoring`, `test_search_locality`, `test_security` (tokens), `test_stated_facts`, `test_transcription_guards`. `conftest.py` clears `ratelimit:*` keys and disposes pools per test (`backend/tests/conftest.py`).
- **evals/**: policy eval harness against a live backend, results to **Langfuse** dataset "clardentity-policy-evals" (`evals/run.py:1-12`); deterministic evaluators (`evals/evaluators.py`) plus a Claude Sonnet 5 LLM judge (`evals/judge.py:1-20`); cases cover identity, context gate, decision teaching, bias watch, formatting, reasoning lens, companion naming, clarifier, safety (`evals/dataset.py:1-25`). Deps: anthropic, httpx, langfuse, rich (`evals/requirements.txt`).
- **scripts/regression/smoke.py**: scripted regression against local/prod via curl; creates and deletes throwaway accounts (`scripts/regression/smoke.py:1-25`). `scripts/deploy-backend.sh` triggers Render deploys using keys in gitignored `.secrets/`.


### 3.6 Data collected about users

| Data | Where stored | Source / notes |
|---|---|---|
| Email address | `users.email` | Registration or Google token (`api/auth.py:157-163,339-347`) |
| Password (bcrypt hash) | `users.password_hash` | `core/security.py:28-33` |
| Name (display name) | `users.display_name` | Registration form or Google `name` claim |
| Google account identifier | `users.oauth_provider`, `users.oauth_subject` | `api/auth.py:332-353` |
| Coarse location (city/region/country, timezone) derived from IP | `users.location_*` | ipapi.co lookup from login IP (`workers/refresh_location.py`); **raw IP not stored** (`models/user.py:26-28`) but IP is sent to ipapi.co and used transiently as a Redis key for rate limiting (`ratelimit:auth:*:{ip}`) and guest budgets (`guest:address:{ip}`, from `X-Forwarded-For`, `api/guest.py:95-106`) |
| Device language/timezone (live call) | Not stored; sent to OpenAI in realtime instructions | `api/realtime.py:56-126` |
| Consent records | `users.terms_accepted_at`, `users.terms_version` | Email sign-up only |
| Onboarding answers (free text about self) | `user_profiles.onboarding_answers` | `api/profile.py:262-306` |
| Inferred personality profile, roles (incl. family relationships, gender qualifiers), stated facts (home town, job, family), learning role | `user_profiles.personality_md/aspects/roles/learning_role` | `services/profile_service.py`, `services/stated_facts.py` (sensitive inferences - likely "Other User Content"/"Sensitive Info" for labels) |
| Imported chat history from ChatGPT/Claude/Gemini (user's own messages) | `user_profiles.imported_context` | `api/profile.py:308-354` |
| Companion nicknames | `users.companion_names` | |
| Chat content (questions, answers, gists, counterfactuals, reviews, clarifiers, guidance) | `messages.*` | Includes therapy/legal/mentoring conversations |
| Conversation summaries | `conversation_memory.summary` | |
| Claims, evidence excerpts, web citation URLs | `message_claims`, `claim_evidence`, `citations` | |
| Uploaded documents and chat attachments (original files + extracted text + embeddings) | S3 `{workspace}/{doc}/{filename}`; `documents`, `document_chunks` | |
| Attached images (vision input) | **Not stored** server-side (base64 passed to model per turn); used as edit references only in-request | `chat.py:1325-1333`; `image_generation.reference_images` |
| Generated images + prompts | S3 `generated/{user_id}/...`; `messages.generated_image` | |
| Voice audio | **Raw audio not stored**; transcript + duration in `audio_transcripts` and message content; audio sent to OpenAI Whisper / Realtime | `chat.py:1147-1160`; `api/audio.py` |
| Live-call transcripts | `messages` via `/call-transcript` | |
| Feedback (thumbs + free-text comment) | `messages.feedback` | |
| Paid-tier interest | `pro_interest` | |
| Preview grant + daily usage count | `users.preview_unlocked_at`; Redis `preview:*` (24h TTL) | |
| Usage/token metrics | `messages.token_usage` | |
| Account timestamps (created, onboarding, location updated) | `users` | |
| Server logs (correlation IDs, timings, errors; stdout on Render) | Render log stream | `core/logging_config.py` |
| Client analytics (PostHog, account UUID, enumerated props, no content) | PostHog EU (frontend) | `docs/analytics.md` |
| Guest demo conversation | **Not stored** server-side (browser holds history); only Redis token counters | `api/guest.py:1-31` |

**Third parties receiving user content** (for the privacy policy "who we share with"): Anthropic and OpenAI (all chat content, documents excerpts, profile block, images, audio), Google and xAI (only when a user picks those models in Co-Creative), Tavily (search queries derived from questions), ipapi.co (IP addresses), Resend (email address + name), Supabase (DB + files, region per bucket `ap-northeast-2`), Upstash (rate-limit keys incl. IPs and user IDs), Render (hosting/logs), Google (ID token verification).

**User controls already implemented**: delete account (`DELETE /auth/me`), delete conversation/message/document/workspace, forget profile (`DELETE /profile`), delete profile aspects, export conversation (Markdown/PDF). **Gaps**: no data retention/TTL jobs; orphaned storage objects on workspace/conversation delete and generated images on account delete (section 5); no full-account data export endpoint; Google sign-ups lack terms-acceptance records.

ASSUMPTION: `request.client.host` used for auth rate-limit keys and location refresh (`api/auth.py:50-51`) is the real client IP only if uvicorn trusts Render's proxy headers; start.sh runs `uvicorn app.main:app --host 0.0.0.0 --port 8000` without `--proxy-headers`/`--forwarded-allow-ips`, so behind Render this may be the proxy address (the guest module explicitly reads `X-Forwarded-For` for this reason, `api/guest.py:95-106`).

### 3.7 What depends on browser behaviour (cookies, SSR, CORS, SSE...)

| Concern | Finding | Mobile impact |
|---|---|---|
| Cookies | None set or read anywhere | None |
| CORS | `CORSMiddleware` with explicit origins (`main.py:54-60`) | Not applied to native HTTP clients. A WebView loading a remote origin would need that origin listed |
| CSRF / Origin checks | None. A grep for `Origin`/`csrf` only finds a comment in `middleware.py:33` | None |
| Redirects to frontend | No HTTP redirects. A grep for `RedirectResponse` finds nothing. Frontend URLs appear only in **emails** (`APP_URL` reset link and welcome CTA) | Needs Universal Links/App Links for `/reset-password` |
| Server-rendered HTML | None (emails only) | None |
| SSE | `POST` + `text/event-stream` through sse-starlette (`chat.py:1701`, `guest.py:595`). The web client reads it with `fetch` + `ReadableStream.getReader()` (`frontend/lib/sse.ts:369`), **not** `EventSource` (which cannot POST or send headers) | Native needs a POST streaming reader: URLSession `bytes(for:)` / OkHttp-SSE with POST / Ktor. Parse `event:`/`data:` lines and ignore `:` comment pings. Disable response buffering and timeouts. Turns can take tens of seconds (`config.py:17-23,56-60`) |
| Unauthenticated image URLs | `GET /api/v1/images/{owner}/{id}.webp` is capability-style because `<img>` cannot send headers (`images.py:3-13`) | Works with native image loaders. URLs are built client-side from `generated_image.owner/id` |
| File downloads | `export` and `export-file` return attachments with `Content-Disposition` (`chat.py:489-500,601-605`) and require a Bearer header | Download with the auth header, then hand off to the share sheet / Storage Access Framework |
| Signed URLs | None. Storage has no presign code (`backend/app/services/storage.py`) | N/A |
| WebRTC realtime | Ephemeral secret, then a direct client connection to OpenAI (`realtime.py:1-8,132-228`) | Needs a native WebRTC stack (e.g. Google WebRTC lib / LiveKit-style) plus mic permission. **ASSUMPTION:** the OpenAI realtime WebRTC SDP exchange endpoint is called by the client (see the frontend audit) |
| Google Sign-In | GIS JavaScript button (`GoogleSignInButton.tsx:70-88`) | Replace with the native Google SDK. Audience caveat in 3.5 |
| Client geolocation hint | Realtime takes `timezone`/`languages` from the client (`realtime.py:62-67`) | Supply from device locale |
| `X-Forwarded-For` | Guest rate limit and budget use it (`guest.py:95-106`) | Works as-is |
| Guest session id | Client-generated uuid kept in browser storage (`guest.py:115-117`) | Persist in app storage |


### 3.8 Limits, quotas, pagination, errors, versioning

#### Rate limits (Redis fixed window, fail-open, `backend/app/core/rate_limit.py:13-40`). A breach returns 429 `{"detail":"Too many requests - please slow down and try again shortly"}`
| Key | Limit | Scope | Source |
|---|---|---|---|
| `auth:register` | 10 / 300 s | client IP | `auth.py:143` |
| `auth:login` | 10 / 300 s | client IP | `auth.py:180` |
| `auth:reset-request` | 5 / 900 s | client IP | `auth.py:210-212` |
| `auth:reset-confirm` | 10 / 900 s | client IP | `auth.py:231-233` |
| `auth:refresh` | 30 / 300 s | client IP | `auth.py:280` |
| `chat:send` | 20 / 60 s | user | `chat.py:806` |
| `chat:devils-advocate` | 20 / 300 s | user | `chat.py:516-518` |
| `chat:export-file` | 10 / 300 s | user | `chat.py:575-577` |
| `chat:feedback` | 30 / 60 s | user | `chat.py:624` |
| `audio:transcribe` | 20 / 60 s | user | `audio.py:25` |
| `audio:tts` | 20 / 60 s | user | `audio.py:50` |
| `compose:complete` | 240 / 300 s | user | `compose.py:88` |
| `realtime:session` | 20 / 3600 s | user | `realtime.py:144-146` |
| `guest` | 30 / 600 s | X-Forwarded-For first hop | `guest.py:223` |

**Caveat:** the auth limits key on `request.client.host` (`auth.py:50-51`). `guest.py:98-101` itself says the socket peer behind Render is the platform proxy, and `start.sh:46` runs uvicorn without `--forwarded-allow-ips`. **ASSUMPTION:** all users then share one auth-limit bucket per proxy IP. A burst of mobile users signing in or refreshing behind the same proxy could hit 429 collectively, and `/auth/refresh` (30 per 5 min) is the most exposed. Check this before launch, because mobile clients refresh every 15 minutes.

#### Quotas
- Preview companions (`mentoring, therapy, creative, legal`): 25 messages per user per UTC day. The counter is in Redis `preview:{user}:{YYYY-MM-DD}` (`backend/app/services/preview_access.py:39-72`, `config.py:89,164`). Exceeding it returns **402** (`chat.py:995-1003`). Status comes from `GET /pro/preview`.
- Guest: 5,000 tokens per session, 400,000 per address per day, 2,000,000 global per day (section 2.8).
- Upload size: 25 MB per document and per document attachment. 60 MB for profile import. No cap on audio or TTS text.
- Profile aspects: maximum 40 (`profile.py:169,198-202`).

#### Error format
- No custom handlers, so FastAPI defaults apply:
  - `HTTPException`: `{"detail": "<string>"}` with the status code. 401s carry `WWW-Authenticate: Bearer`.
  - Pydantic validation: **422** `{"detail":[{"type","loc","msg","input",...}]}`. The send-message mode and content checks deliberately return **400** with a string `detail` instead (`chat.py:974-983`).
- Status codes in use: 200, 201, 202, 204, 400, 401, 402 (preview quota), 404 (also used for "not yours" and for non-admin on admin routes), 409, 413, 422, 429, 501 (Google not configured), 502 (provider failure on devil's-advocate/export-file), 503 (realtime upstream, guest global budget).
- Mid-stream errors arrive as SSE `event: error` / `data: {"detail": "..."}` (`chat.py:1404`, `guest.py:446-449`). The HTTP status has already been sent as 200.
- Every response carries an `X-Request-ID` header for support correlation (`middleware.py:21-27`).

#### Pagination
- **Effectively none.** Only `GET /biases` has `limit`/`offset` (`biases.py:69-70`). `GET /history/search` and `GET /documents/search` have a `limit` only. Conversations, messages, documents and workspaces return full lists (`chat.py:338-366,457-465`, `documents.py:180-193`, `workspaces.py:45-59`).
- **Mobile impact:** large accounts will download whole conversation lists and full message trees. Cursor pagination should be added before mobile scale.

#### Versioning
- Path version `/api/v1` (`main.py:62`). There is no header versioning, no `v2`, and no deprecation mechanism. There is no app or client version negotiation.


### 3.9 What a mobile client needs that does not exist yet

1. **Push notifications / device registration.** No device table, no push token endpoint, no APNs/FCM sender. A grep for push/apns/fcm/device returns nothing. Needed for "your long answer is ready", document ingestion finished, and similar events. Celery is already available to send them.
2. **Logout / per-device sessions.** There is no `POST /auth/logout` and no refresh-token store. `refresh_token_version` is per user (`models/user.py:23-25`), so revoking one phone signs out everything (`auth.py:300-309` explains why rotation was removed). Recommended: a `refresh_tokens` or `devices` table keyed by device id, with rotation, reuse detection and a "sign out this device" endpoint.
3. **Mobile-appropriate refresh semantics.** Refresh is IP rate-limited with a likely shared proxy IP (section 5.1). Access tokens are not checked against the version, so a revoked device keeps access for up to 15 minutes. That is acceptable, but should be documented.
4. **Native OAuth.** Accept several Google audiences (iOS client ID, Android/web server client ID) in `verify_oauth2_token` (`auth.py:324-326`). Check `email_verified`. Add **Sign in with Apple** (`POST /auth/oauth/apple`, verifying Apple's JWKS). Record terms acceptance for OAuth sign-ups.
5. **Deep links.** The reset link and welcome CTA are plain `APP_URL` web URLs (`send_password_reset_email.py:17`, `send_welcome_email.py:17`). They need Universal Links / App Links association files on `clardentity.ai`, or a mobile-specific link format. No deep-link-aware OAuth callback is needed, since Google uses the ID-token POST.
6. **App version check / kill switch.** There is no `/config` or `/app-version` endpoint. `/health` does not report a version. Add a minimum supported client version (and optionally feature flags readable by clients; today `/admin/settings` exposes them but is mis-gated).
7. **Pagination** for conversations, messages and documents (section 5.4).
8. **Resumable or recoverable streaming.** A turn's analysis phase runs inside the SSE generator (`chat.py:1526-1689`). A backgrounded app that loses its connection may lose claims and score persistence. Mobile OSes suspend sockets aggressively, so consider moving post-answer analysis to a background task plus polling or push, or a `GET` that resumes or returns the final state.
9. **Realtime call parameters.** `/realtime/session` returns only `{client_secret, expires_at}` (`realtime.py:228`). A native WebRTC client also needs the OpenAI realtime call URL and model. Decide whether to hard-code them in the app or return them from the server.
10. **Audio formats.** The `/audio/transcribe` allow-list (`audio.py:17`) excludes `caf`/`3gp`/`aac`. Add a server-side size cap.
11. **Document download.** There is no endpoint to fetch an uploaded original (section 2.6). There is no presigned-URL support if one is wanted.
12. **Billing.** There is none (section 2.17). Store-distributed apps that sell the "Clar Pro/Max/Ultra" tiers will need StoreKit / Play Billing receipt validation and server webhooks (App Store Server Notifications / Google RTDN). None of that exists.
13. **Account deletion** already exists (`DELETE /auth/me`, `auth.py:376-422`). This satisfies the App Store requirement for in-app deletion.
14. **Security fix before shipping any new client:** `/api/v1/admin/settings` GET/PUT are open to every authenticated user (`backend/app/api/admin.py:20-55`).


### 3.10 Backend source index

- App and core: `D:\Projects\clardentity-mvp-mv\backend\app\main.py`, `backend\app\core\{config,security,rate_limit,middleware,logging_config,celery_app}.py`, `backend\app\api\deps.py`, `backend\app\db\session.py`
- Routers: `backend\app\api\{health,auth,bootstrap,workspaces,chat,documents,images,guest,history,biases,profile,memory,validation,admin,admin_dashboard,audio,compose,realtime,pro}.py`
- Schemas: `backend\app\schemas\{auth,chat,document,profile,pro,audio,admin,admin_dashboard,biases,history,memory,validation,workspace}.py`
- SSE event producers: `backend\app\services\answer_pipeline.py:130-208,291-470`, `backend\app\api\chat.py:1378-1701`, `backend\app\api\guest.py:255-595,628-645`
- Email and links: `backend\app\workers\send_password_reset_email.py`, `backend\app\workers\send_welcome_email.py`, `backend\app\services\email_service.py`
- Deploy: `D:\Projects\clardentity-mvp-mv\render.yaml`, `DEPLOYMENT.md`, `backend\Dockerfile`, `backend\start.sh`


---

## 4. Environment Variables & Secrets

### 4.1 Every environment variable

Sources read: `.env.example:1-33`, `render.yaml:28-110`, `backend/app/core/config.py:8-214` (pydantic `Settings`, reads repo-root `.env`, `extra="ignore"`, field names map case-insensitively to env vars), `backend/alembic/env.py:25`, `infra/docker-compose.yml`, `backend/Dockerfile`, `backend/start.sh` (no env reads), `frontend/next.config.ts`, `frontend/playwright.config.ts`, `frontend/lib/*`, `frontend/components/*`, `frontend/e2e/*`, `.github/workflows/*.yml`, `.github/scripts/sync-upstream.sh`, `scripts/deploy-backend.sh`, `scripts/regression/smoke.py`, `evals/*.py`.
No `os.environ` / `os.getenv` reads exist in `backend/` - all backend config flows through `Settings`. `backend/Dockerfile` and `backend/start.sh` define no env vars.

Legend for "Declared in": E = `.env.example`, R = `render.yaml` envVarGroup `clardentity-shared`, C = `config.py`, D = `infra/docker-compose.yml`.

#### Backend (FastAPI + Celery) - all server-only

| Variable | Used in (file paths) | Purpose | Public or Secret | Default (if non-secret) | Mobile handling notes |
|---|---|---|---|---|---|
| OPENAI_API_KEY | C:16 (required), E:2, R:31; used `services/openai_client.py:39`, `api/realtime.py:187`, `services/image_generation.py:273,288` | OpenAI: embeddings, STT, TTS, realtime session minting, image gen, fallback LLM, web-search tool | Secret | required, no default | Server-only, never ship in app. Mobile live call uses only the ephemeral secret returned by `POST /realtime/session`. |
| OPENAI_MODEL | C:24, E:3 (`gpt-5`, stale), R:38 | Main OpenAI chat model (fallback path) | Public config | `gpt-5.4-mini` (E says `gpt-5`) | Server-only; no change. |
| OPENAI_FAST_MODEL | C:28, R:40 | Classification/rewrites | Public config | `gpt-5.4-nano` | Server-only. |
| OPENAI_REASONING_EFFORT | C:31, R:42 | Latency lever | Public config | `low` | Server-only. |
| OPENAI_EMBEDDING_MODEL | C:32, E:4, R:44 | pgvector embeddings | Public config | `text-embedding-3-small` | Server-only. |
| OPENAI_STT_MODEL | C:168, E:5, R:46; `api/realtime.py:177` | Whisper transcription (also realtime input transcription) | Public config | `whisper-1` | Server-only. |
| OPENAI_TTS_MODEL | C:169, E:6, R:48 | Read-aloud TTS (`POST /audio/tts`) | Public config | `tts-1` | Server-only. |
| OPENAI_TTS_VOICE | C:170, E:7, R:50 | TTS voice | Public config | `alloy` | Server-only. |
| OPENAI_REALTIME_MODEL | C:175 only | Live-call speech-to-speech model | Public config | `gpt-realtime-2.1` | Server-only; not in R/E. |
| OPENAI_REALTIME_VOICE | C:176 only | Live-call voice | Public config | `marin` | Server-only. |
| ANTHROPIC_API_KEY | C:37 only (NOT in E or R); `services/anthropic_client.py:44`; also `evals/judge.py:39` | Primary LLM (Claude) for all answers | Secret | `""` | Server-only. **Missing from render.yaml and .env.example** - add to both. |
| ANTHROPIC_MODEL | C:44 | Flagship answer model | Public config | `claude-opus-5` | Server-only. |
| ANTHROPIC_FAST_MODEL | C:51 | Auxiliary judgements | Public config | `claude-sonnet-5` | Server-only. |
| ANTHROPIC_RAPID_MODEL | C:54 | Quick answer | Public config | `claude-haiku-4-5-20251001` | Server-only. |
| ANTHROPIC_EFFORT | C:167 | Effort param | Public config | `low` | Server-only. |
| FAST_GENERATION_MODES | C:63 | Modes using fast model | Public config | `knowing,learning,creative,decision,legal` | Server-only. |
| PREVIEW_MODES | C:89 | Paid-tier companions locked in picker | Public config | `mentoring,therapy,creative,legal` | Server-only. ASSUMPTION: if paid tiers ship in-app, App Store 3.1.1 IAP rules apply. |
| PREVIEW_DAILY_MESSAGES | C:164 | Daily preview cap | Public config | `25` | Server-only. |
| TAVILY_API_KEY | C:43, E:33 (not R); `services/web_research.py:210,301` | Web search for grounding/verification | Secret | `None` (falls back to model search tool) | Server-only. Missing from render.yaml. |
| GOOGLE_API_KEY | C:121 only; `services/extra_providers.py:74` (`x-goog-api-key` header) | Gemini models in Co-Creative picker | Secret | `""` (entry hidden) | Server-only. Not in E/R. |
| GOOGLE_MODEL | C:140 | Gemini model id | Public config | `gemini-3.1-pro-preview` | Server-only. |
| GOOGLE_FAST_MODEL | C:146 | Gemini fast id | Public config | `gemini-3.5-flash` | Server-only. |
| GOOGLE_THINKING_BUDGET | C:163 | Gemini thinking budget | Public config | `128` | Server-only. |
| XAI_API_KEY | C:122; `services/extra_providers.py:138` | Grok models | Secret | `""` (hidden) | Server-only. Not in E/R. |
| XAI_MODEL | C:150 | Grok id (marked UNVERIFIED in comment) | Public config | `grok-4.7` | Server-only. |
| XAI_BASE_URL | C:152 | xAI OpenAI-compatible endpoint | Public config | `https://api.x.ai/v1` | Server-only. |
| XAI_REASONING_EFFORT | C:162 | Grok reasoning effort | Public config | `low` | Server-only. |
| IMAGE_MODEL | C:112 | Co-Creative image model | Public config | `gpt-image-2.5-sunburst` | Server-only. |
| IMAGE_SIZE | C:116 | Generated image size | Public config | `1024x1024` | Server-only; mobile should reserve a square slot. |
| GUEST_DAILY_TOKEN_BUDGET | C:102 | Global daily cap for landing-page guest demo | Public config | `2000000` | Server-only. Guest demo keyed on client session id + `X-Forwarded-For` (`api/guest.py:100-105`); a native client should send a stable install id. |
| DATABASE_URL | C:179 (required), E:10, R:54, D:68,89; `alembic/env.py:25` | Postgres+pgvector (Supabase Supavisor pooler in prod) | Secret (contains password) | E has local dev value (see section 2) | Server-only, never ship. |
| DB_POOL_SIZE | C:74, R:90 | Per-container pool | Public config | `3` | Server-only. |
| DB_MAX_OVERFLOW | C:75, R:92 | Pool overflow | Public config | `2` | Server-only. |
| REDIS_URL | C:182, E:13, R:56, D:69; `core/celery_app.py`, `core/rate_limit.py`, `api/health.py`, `services/guest_demo.py`, `services/preview_access.py` | Upstash Redis: Celery broker, rate limits, guest/preview counters | Secret (prod URL has password) | `redis://localhost:6379/0` | Server-only. |
| S3_ENDPOINT | C:185, E:16, R:58, D:70; `services/storage.py:8` | S3-compatible storage (MinIO local / Supabase Storage prod) | Secret-ish (sync:false) | `http://localhost:9000` | Server-only. Mobile never touches storage directly; images served via `GET /api/v1/images/{owner}/{id}.webp` (unauthenticated capability URL, `api/images.py:26`). |
| S3_ACCESS_KEY | C:186, E:17, R:60 | Storage key id | Secret | dev default `minioadmin` | Server-only. |
| S3_SECRET_KEY | C:187, E:18, R:62 | Storage secret | Secret | dev default `minioadmin` | Server-only. |
| S3_BUCKET | C:188, E:19, R:64 | Bucket | Public config | `clardentity-dev` (prod `clardentity-prod`) | Server-only. |
| S3_REGION | C:189, E:20, R:66 | Region | Public config | `us-east-1` (prod `ap-northeast-2`) | Server-only. |
| JWT_SECRET | C:192 (required), E:23, R:68; `core/security.py` | Signs access/refresh JWTs | Secret | required | Server-only. Mobile stores issued tokens in Keychain / EncryptedSharedPreferences (web uses localStorage, `frontend/lib/auth.tsx:20-37`). |
| JWT_ACCESS_TOKEN_EXPIRE_MINUTES | C:193, E:24, R:70 | Access token TTL | Public config | `15` | Mobile must implement refresh via `POST /auth/refresh` (`api/auth.py:276`). |
| JWT_REFRESH_TOKEN_EXPIRE_DAYS | C:194, E:25, R:72 | Refresh token TTL | Public config | `30` | Consider longer for mobile; no logout/revocation endpoint exists. |
| GOOGLE_CLIENT_ID | C:195, E:26, R:109; `api/auth.py:317,326` | Audience for Google ID-token verification | Public (client id) | `None` -> `/auth/oauth/google` returns 501 | **Needs mobile-specific values**: iOS and Android OAuth clients have different client IDs; backend must accept a list of audiences (currently single string). |
| GOOGLE_CLIENT_SECRET | C:196, E:27 | Declared but unused (ID-token flow needs no secret, per `DEPLOYMENT.md:164-166`) | Secret | `None` | Not needed for mobile; ASSUMPTION: can be removed. |
| RESEND_API_KEY | C:200, R:107; `services/email_service.py:34` | Transactional email | Secret | `None` (email disabled) | Server-only. |
| EMAIL_FROM | C:201, R:105 | Sender | Public config | `Clardentity <onboarding@resend.dev>` (prod `hello@clardentity.ai`) | Server-only. |
| APP_URL | C:203, R:103; `workers/send_password_reset_email.py:17`, `workers/send_welcome_email.py:17` | Base URL for email links (reset, welcome CTA) | Public config | `http://localhost:3000` (prod `https://clardentity.ai`) | **Needs mobile handling**: reset link `https://clardentity.ai/reset-password?token=` must open the app via iOS Universal Links (`apple-app-site-association`) and Android App Links (`assetlinks.json`) served from clardentity.ai, or fall back to web. |
| BACKEND_CORS_ORIGINS | C:206, E:30, R:74; `main.py:55-60` (`allow_credentials=True`) | Allowed browser origins | Public config | `http://localhost:3000` | Native HTTP is not subject to CORS. If a WebView/Capacitor shell is used, add `capacitor://localhost` / `https://localhost` / `http://localhost` origins. |
| MAX_UPLOAD_SIZE_MB | C:207, E:31, R:76 | Upload cap | Public config | `25` | Mirror client-side in app pickers. |
| TERMS_VERSION | C:79 | Version of terms/privacy recorded at sign-up | Public config | `2026-09-28` (must match `frontend/app/(legal)/privacy/page.tsx:13`) | Bake same version into app's consent screen; keep in sync. |
| ADMIN_EMAILS | C:82, R:84 | Who may open /admin | Public config | `admin@clardentity.ai` | Server-only; admin UI ASSUMPTION: exclude from mobile app. |
| ADMIN_BOOTSTRAP_EMAIL | C:87, R:86 | Seeded admin account | Public config | `admin@clardentity.ai` | Server-only. |
| ADMIN_BOOTSTRAP_PASSWORD | C:88, R:88 (sync:false) | Seeded admin password | Secret | `""` | Server-only. |

#### Frontend (Next.js) - build-time

| Variable | Used in (file paths) | Purpose | Public or Secret | Default (if non-secret) | Mobile handling notes |
|---|---|---|---|---|---|
| NEXT_PUBLIC_BACKEND_URL | `frontend/lib/apiClient.ts:5`, `frontend/next.config.ts:32`; set via Vercel per `DEPLOYMENT.md:128` | Backend root URL | Public | `http://localhost:8000` | Public, bake into app config per build flavor (dev/staging/prod: `https://clardentity-backend.onrender.com`). |
| NEXT_PUBLIC_API_URL | `frontend/lib/apiClient.ts:8`, `frontend/next.config.ts:31` | Full API base (overrides above) | Public | `${BACKEND_URL}/api/v1` | Public, bake into app config. |
| NEXT_PUBLIC_POSTHOG_KEY | `frontend/lib/analytics.ts:26`, `frontend/lib/errorReport.ts:16`, `frontend/components/system/ConsentBanner.tsx:21` | PostHog project key; unset = no analytics, no banner | Public (project write key, by design) | unset | Public, bake into app config; use PostHog iOS/Android SDK with same key. Keep consent gate (also needed for ATT/Play disclosure). |
| NEXT_PUBLIC_POSTHOG_HOST | `frontend/lib/analytics.ts:30`, `frontend/lib/errorReport.ts:17` | PostHog host | Public | `https://eu.i.posthog.com` | Public, bake in. |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | `frontend/components/auth/GoogleSignInButton.tsx:9` | Web GIS client id | Public | unset (button hidden) | **Needs mobile-specific values**: separate iOS client id (+ reversed-client-id URL scheme in Info.plist) and Android client id (package name + SHA-1); a "web client id" is still needed as `serverClientId` on Android to get an ID token. |
| NODE_ENV | `frontend/next.config.ts:26` | Dev vs prod CSP | Public | set by Next | N/A on native. |
| CSP_EXTRA_CONNECT_SRC | `frontend/next.config.ts:52-53`; set `frontend/playwright.config.ts:106` | Test-only CSP widening | Public | unset | N/A on native. |

#### Tests / CI / tooling (never shipped)

| Variable | Used in (file paths) | Purpose | Public or Secret | Default (if non-secret) | Mobile handling notes |
|---|---|---|---|---|---|
| CI | `frontend/playwright.config.ts:19`, `frontend/e2e/warmup.ts:13`; set in `.github/workflows/e2e.yml:41`, `e2e-visual-baselines.yml:28`, `sync-upstream.yml:104` | CI mode | Public | unset | Reuse in mobile CI. |
| E2E_PORT | `playwright.config.ts:20`, `e2e/warmup.ts:14` | Test web port | Public | `3100` | N/A. |
| E2E_BASE_URL | `playwright.config.ts:21,87`, `e2e/warmup.ts:14` | External web target | Public | `http://localhost:3100` | N/A. |
| E2E_LIVE_BASE_URL | `playwright.config.ts:23`, `e2e/auth.setup.ts:25`; GH secret `e2e.yml:45` | Live web URL for @live | Secret (GH secret) | unset | Mobile E2E (Detox/Maestro) could reuse. |
| E2E_LIVE_API_URL | `e2e/live.spec.ts:12`; GH secret `e2e.yml:46` | Live API | GH secret | `https://clardentity-backend.onrender.com/api/v1` | Reuse. |
| E2E_USER_EMAIL / E2E_USER_PASSWORD | `e2e/auth.setup.ts:19`, `e2e/fixtures.ts:19-20`; GH secrets `e2e.yml:47-48` | Live test user creds | Secret | fixtures fall back to `e2e@clardentity.test` / placeholder | Reuse as mobile CI secrets. |
| E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD | `e2e/auth.setup.ts:20`; GH secrets `e2e.yml:49-50` | Live admin creds | Secret | unset | Not needed for mobile. |
| E2E_CAROUSEL_CHAT | `e2e/live.spec.ts:61`; GH secret `e2e.yml:51` | Fixed chat id for live test | GH secret | unset | N/A. |
| E2E_EMAIL / E2E_PASSWORD | `e2e/mobile.spec.ts:160,162`, `e2e/fixtures.ts:19-20` | Mocked-suite creds | Fixture | placeholders | N/A. |
| E2E_VISUAL | `playwright.config.ts:26`; `e2e.yml:43`, `e2e-visual-baselines.yml:30` | Enable @visual | Public | unset | N/A. |
| E2E_LIVE | `e2e/fixtures.ts:11` | Live mode toggle | Public | unset | N/A. |
| E2E_API_URL | `e2e/fixtures.ts:12` | Mock API | Public | `http://localhost:8000` | N/A. |
| E2E_API_PORT | `e2e/preflight-stub.mjs:15` | CORS stub port | Public | `8000` | N/A. |
| E2E_NO_WARMUP | `e2e/warmup.ts:13` | Skip warmup | Public | unset | N/A. |
| DEMO_API_PORT / DEMO_NAP | `e2e/demo-api.mjs:18,208` (file is untracked) | Local demo API | Public | `8010` / on | N/A. |
| GITHUB_STEP_SUMMARY / GITHUB_SERVER_URL / GITHUB_REPOSITORY / GITHUB_RUN_ID | `e2e/ci-summary.mjs:8-9`, `e2e/live.spec.ts:13` | GH Actions runtime | Public | GH-provided | N/A. |
| HOME | `e2e.yml:42`, `e2e-visual-baselines.yml:29` | `/root` in container | Public | - | N/A. |
| GH_TOKEN | `sync-upstream.yml:43` (`github.token`) | `gh run list` | Secret (auto) | - | N/A. |
| SYNC_TOKEN | `sync-upstream.yml:90` | PAT for pushing workflow changes | Secret (GH secret) | falls back to `github.token` | N/A. |
| UPSTREAM_URL / UPSTREAM_BRANCH / DEST_BRANCH / EXPECTED_SHA / GATE_CMD | `sync-upstream.yml:17-19,103-111`, `.github/scripts/sync-upstream.sh:11-13,33,61` | Fork sync | Public | `https://github.com/clardentity/clardentity-mvp.git`, `main`, `main` | N/A. |
| CLARDENTITY_API_BASE | `evals/run.py:169-171` | Eval target | Public | `https://clardentity-backend.onrender.com/api/v1` | N/A. |
| LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY | `evals/run.py:182-189` | Langfuse eval tracking | Secret | none | Dev tooling only. |
| LANGFUSE_HOST | `evals/run.py:190` | Langfuse host | Public | `https://cloud.langfuse.com` | Dev tooling only. |
| ANTHROPIC_API_KEY (evals) | `evals/judge.py:39`, `evals/run.py:182` | LLM judge | Secret | none | Dev tooling only. |
| RENDER_API_KEY (doc only) / `.secrets/render-api-key` / `.secrets/render-deploy-hook` | `DEPLOYMENT.md:141`, `scripts/deploy-backend.sh:26-27` (files gitignored, `.gitignore` `.secrets/`; not present on disk) | Trigger Render deploys | Secret | - | N/A. |
| POSTGRES_USER/PASSWORD/DB, MINIO_ROOT_USER/PASSWORD | `infra/docker-compose.yml:11-13,38-39` | Local container stack | Dev-only creds | see section 2 | N/A. |

#### Drift between declaration sources

- In `config.py` but **absent from both** `.env.example` and `render.yaml`: `ANTHROPIC_API_KEY`, `ANTHROPIC_*_MODEL`, `ANTHROPIC_EFFORT`, `GOOGLE_API_KEY`, `GOOGLE_*MODEL`, `GOOGLE_THINKING_BUDGET`, `XAI_*`, `IMAGE_MODEL`, `IMAGE_SIZE`, `OPENAI_REALTIME_*`, `GUEST_DAILY_TOKEN_BUDGET`, `PREVIEW_*`, `FAST_GENERATION_MODES`, `TERMS_VERSION`.
- In `.env.example` but not `render.yaml`: `TAVILY_API_KEY`, `GOOGLE_CLIENT_SECRET`.
- In `render.yaml` but not `.env.example`: `OPENAI_FAST_MODEL`, `OPENAI_REASONING_EFFORT`, `ADMIN_*`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `APP_URL`, `EMAIL_FROM`, `RESEND_API_KEY`.
- `.env.example:3` says `OPENAI_MODEL=gpt-5`; code default and render.yaml say `gpt-5.4-mini` (`render.yaml:33-38` comments explain gpt-5 was the cause of ~30s responses).
- No frontend env template exists (`frontend/` has no `.env.example`); `NEXT_PUBLIC_*` documented only in `DEPLOYMENT.md:128,169`.


### 4.2 Hardcoded secrets scan

Method: `git ls-files` (752 tracked files); `git grep` + ripgrep for provider key prefixes, `api_key|secret|password|token|bearer` literal assignments, connection strings with inline credentials, `BEGIN ... PRIVATE KEY`, JWT shapes. Also listed untracked/ignored files.

#### Tracked env files
- Only **`.env.example`** is tracked. `.gitignore` excludes `.env`, `.env.local`, `*.env.local`, `.secrets/`, `evals/.eval_creds.json`. No `.env` file exists anywhere on disk. Untracked (non-ignored) files: only `frontend/e2e/demo-api.mjs` (no secrets).

#### Actual production credentials found
- **None.** No live API key, token, private key or production connection string is present in tracked or untracked files.

#### Local-dev default credentials (not production, but worth noting)
| File:line | Kind | Note |
|---|---|---|
| `.env.example:10` | Postgres DSN with inline password `clar...` | Local dev DB user; also `README.md:49`, `infra/docker-compose.yml:12,68,89` |
| `.env.example:17-18` | S3 access/secret key `mini...` | MinIO factory default |
| `backend/app/core/config.py:186-187` | Same MinIO default as **code defaults** for `s3_access_key`/`s3_secret_key` | Low risk, but a prod deploy missing these env vars would silently use them; ASSUMPTION: prefer no default for secrets. |
| `infra/docker-compose.yml:38-39,58`, `README.md:41` | MinIO root user/password | Local container defaults |

#### Test fixtures / placeholders (non-issues)
| File:line | Value kind |
|---|---|
| `frontend/e2e/fixtures.ts:134,316-317` | Mock tokens `e2e-access` / `e2e-refresh` |
| `frontend/e2e/fixtures.ts:19-20`, `frontend/e2e/mobile.spec.ts:160,162` | Fallback test email `e2e@clardentity.test` and placeholder password `e2e-p...` |
| `frontend/e2e/fixtures.ts:35` | CSS selector `#password` (not a credential) |
| `frontend/playwright.config.ts:101` | Stand-in PostHog key `phc_e2e_test` pointed at a localhost mock |
| `backend/tests/test_api_contract.py:121,130,179,187,214,298,390,475,572,634,782,939,1105,1154,1223,1265,1376,1499,1648,1738,1797` | Per-test throwaway passwords for freshly registered users |
| `backend/tests/test_guest_demo.py:90`, `scripts/regression/smoke.py:248`, `docs/TECHNICAL_GUIDE.md:114`, `Better_docs/TECHNICAL_GUIDE.md:114` | Throwaway registration password `Thro...` for smoke tests (note: `smoke.py` registers real throwaway accounts on prod by default, `smoke.py:37`) |
| `evals/backend_client.py:136-170` | Generates random eval account password at runtime; persisted to gitignored `evals/.eval_creds.json` (not present) |

#### Identifiers that are not secrets but are worth knowing
- Render service id `srv-d9jm...` in `DEPLOYMENT.md:142` and `scripts/deploy-backend.sh:28` - an identifier, useless without the API key.
- `Authorization: Bearer` usage in code is always built from settings/runtime tokens (`backend/app/api/realtime.py:187`, `services/email_service.py:34`, `services/extra_providers.py:138`, `services/image_generation.py:273,288`, `services/web_research.py:301`; frontend `lib/apiClient.ts:104`, `lib/sse.ts:297`, `lib/liveCall.ts:60,144`, several components) - no literals.
- `DEPLOYMENT.md:186` contains the Resend account owner's personal email address (PII, not a secret).
- `DEPLOYMENT.md:158-160` states "This repo is public."



---

## 5. Third-Party Integrations

### 5.1 Every external service / SDK

Frontend runtime deps (`frontend/package.json:15-23`): `next 16.2.12`, `react/react-dom 19.2.4`, `posthog-js ^1.434.15`, `nspell ^2.1.5`, `dictionary-en ^4`, `dictionary-en-gb ^3`. Dev: Playwright 1.64, axe-core, Tailwind v4, ESLint, TypeScript.
Backend (`backend/requirements.txt`): `openai==2.48.0`, `anthropic` (**unpinned**, line 91), `google-auth==2.56.2`, `boto3==1.43.56`, `celery==5.6.3`, `redis==8.0.1`, `httpx`, `asyncpg`, `pgvector`, `SQLAlchemy`, `alembic`, `PyJWT`, `bcrypt`, `fastapi`, `sse-starlette`, `pypdf`, `pdfplumber`, `python-docx`, `python-pptx`, `openpyxl`, `XlsxWriter`, `fpdf2`, `Pillow`, `tiktoken`. Evals (`evals/requirements.txt`): `anthropic==1.0.0`, `langfuse==4.14.4`, `httpx`, `rich`.

| Service | Web/server package used | Where (files) | Purpose | Native mobile equivalent | Integration notes |
|---|---|---|---|---|---|
| Anthropic (Claude) | `anthropic` (Python, AsyncAnthropic) | `backend/app/services/anthropic_client.py:35,44`; `web_research.py:187` (server web_search tool) | Primary LLM for all answers, quick answers, judgements; fallback search tool | Server-side only - no change | Streams to client over SSE (`sse-starlette`, `api/chat.py`, `api/guest.py`); mobile needs an SSE client (e.g. URLSession bytes / OkHttp-SSE / `react-native-sse`). |
| OpenAI - text/embeddings/search | `openai` (AsyncOpenAI) | `services/openai_client.py:39,109-115,310-323`; `web_research.py:426-451` | Fallback LLM, embeddings (pgvector RAG), web-search tool (first choice) | Server-side only | - |
| OpenAI - STT (Whisper) | `openai` | `services/openai_client.py:327,381`; endpoint `POST /api/v1/audio/transcribe` (`api/audio.py:20`) | Dictation | Server-side only; app records audio natively (AVAudioRecorder / MediaRecorder) and uploads | Web uses browser `MediaRecorder` (`components/upload/AudioRecorder.tsx`). Needs `NSMicrophoneUsageDescription` / `RECORD_AUDIO`. Check accepted audio formats (m4a/aac from iOS). |
| OpenAI - TTS | `openai` | `services/openai_client.py:332`; `POST /api/v1/audio/tts` (`api/audio.py:44`) | Read answers aloud | Server-side only; play returned audio with AVPlayer / ExoPlayer | Web plays from blob: URLs (`next.config.ts:64-65`). Consider background-audio entitlement. |
| OpenAI Realtime (live voice call) | backend `httpx` mints ephemeral secret; **browser** WebRTC posts SDP direct to OpenAI | `backend/app/api/realtime.py:38,132,184-228`; `frontend/lib/liveCall.ts:14,57-60,144` | Speech-to-speech live call | Client-side: WebRTC on device (Google WebRTC iOS/Android SDK, or `react-native-webrtc`), or OpenAI's mobile/realtime SDK if available | The only LLM traffic the client sends directly to a third party. Backend returns `{client_secret, expires_at}` only. Needs mic permission, audio-session handling (AVAudioSession category playAndRecord), CallKit/ConnectionService optional. Sends `navigator.languages` + timezone (`liveCall.ts:46`) - use `Locale.preferredLanguages` / `LocaleList`. |
| OpenAI Images | `httpx` direct REST | `services/image_generation.py:272,287`; served at `GET /api/v1/images/{owner_id}/{image_id}.webp` (`api/images.py:26`, unauthenticated capability URL) | Co-Creative image generate/edit | Server-side only | Image URLs load without auth header - works directly in native image views. Not listed in privacy policy as a distinct use. |
| Google Gemini | `httpx` SSE to `generativelanguage.googleapis.com` | `services/extra_providers.py:54-74` | Optional models in Co-Creative picker | Server-side only | **Not named in privacy policy.** |
| xAI Grok | `httpx` to `XAI_BASE_URL` (OpenAI wire format) | `services/extra_providers.py:136-138`; `config.py:150-162` | Optional models in picker | Server-side only | **Not named in privacy policy.** |
| Tavily | `httpx` | `services/web_research.py:210,251-301` | Web search for grounding/claim verification | Server-side only | Named in privacy policy. |
| Arbitrary HTTPS PDFs | `httpx` + `pdfplumber` | `services/pdf_source.py:91-192` (https-only, host vetting at `:59`) | Reads tables from cited source PDFs | Server-side only | SSRF-guarded. |
| ipapi.co | `httpx` (free tier, no key) | `services/geolocation.py:25`; Celery `workers/refresh_location.py:18` | Coarse city/country/timezone from sign-in IP | Server-side only | **Processor not named in privacy policy** (policy describes the data at `privacy/page.tsx:69-71` but not the vendor). Relevant to App Privacy "Coarse Location" label. |
| Google Sign-In | Web: Google Identity Services script `accounts.google.com/gsi/client` (`frontend/components/auth/GoogleSignInButton.tsx:88`); server: `google-auth` `verify_oauth2_token` (`backend/app/api/auth.py:325-327`) | `POST /api/v1/auth/oauth/google` (`auth.py:313`) | ID-token sign-in | iOS: GoogleSignIn-iOS SDK; Android: Credential Manager + Sign in with Google (`googleid`) | Backend must accept iOS/Android client IDs as audiences. App Store 4.8 requires **Sign in with Apple** (no endpoint exists; needs `POST /auth/oauth/apple` verifying Apple identity tokens + Apple's account-deletion token revocation). Avatars from `*.googleusercontent.com` (`next.config.ts:62`). |
| PostHog | `posthog-js` (lazy-loaded, only after consent) | `frontend/lib/analytics.ts:26-57,124`; `frontend/lib/errorReport.ts:16-53` (error_reported events); consent `frontend/lib/consent.ts`, `components/system/ConsentBanner.tsx` | Content-free product analytics + client error reports | `posthog-ios` / `posthog-android` (or `posthog-react-native`) | Keep config: autocapture off, session recording off, `person_profiles: identified_only`, masking on, EU host. Identify by user id only. Consent gate must be replicated natively before SDK init. |
| Resend | `httpx` REST | `services/email_service.py:17,34`; Celery `workers/send_welcome_email.py`, `workers/send_password_reset_email.py` | Welcome + password-reset email | Server-side only | Reset link needs deep linking (see APP_URL). `DEPLOYMENT.md:184-191` says sender was `onboarding@resend.dev`; `render.yaml:105-106` now sets `hello@clardentity.ai` (ASSUMPTION: domain verified). |
| Supabase (Postgres + pgvector, Storage via S3 API) | `asyncpg`, `SQLAlchemy`, `pgvector`, `boto3` | `backend/app/db/session.py`, `services/storage.py:7-29`, `render.yaml:51-66`, `DEPLOYMENT.md:39-61,81-103` | Primary DB and file store | Server-side only | Mobile never talks to Supabase directly. |
| Upstash Redis | `redis`, `celery`/`kombu` (`rediss://`) | `core/celery_app.py:22`, `core/rate_limit.py`, `services/guest_demo.py`, `services/preview_access.py`, `api/health.py` | Celery broker, rate limiting, demo/preview counters | Server-side only | - |
| Render | Docker web service | `render.yaml:8-26`, `backend/Dockerfile`, `backend/start.sh`, `scripts/deploy-backend.sh` | Hosts API + in-process Celery worker | Server-side only | API base `https://clardentity-backend.onrender.com/api/v1`. |
| Vercel | Next.js hosting | `DEPLOYMENT.md:3,14,123-130`, `docs/TECHNICAL_GUIDE.md:58` | Hosts web frontend at `clardentity.ai` | N/A for native (would host `apple-app-site-association` / `assetlinks.json` under `/.well-known/`) | - |
| Google Fonts (via `next/font/google`) | Next build-time self-hosting | `frontend/app/layout.tsx:2,25-39` (Geist, Geist Mono, Outfit) | Typography | Bundle the font files in the app (OFL licensed; ASSUMPTION verify licences) | No runtime call to Google Fonts (`font-src 'self' data:`, `next.config.ts:63`). |
| Hunspell dictionaries (SCOWL/aspell) | `nspell`, `dictionary-en`, `dictionary-en-gb`; static files `frontend/public/dict/*` with `LICENSE-en-us.txt`, `LICENSE-en-gb.txt` | Client spellcheck | Native OS spellcheck (UITextChecker / Android SpellCheckerService) - can drop | Licence files must ship if dictionaries are bundled. |
| PWA service worker / manifest | `frontend/public/sw.js`, `frontend/app/manifest.ts` | Installability only; no offline API caching | Not needed natively; reuse icons (`public/icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`) and theme `#121013` | - |
| Langfuse (dev only) | `langfuse==4.14.4` | `evals/run.py:32,187-214`, `evals/dataset.py` | Offline eval tracking | N/A | Not in production path. |
| GitHub Actions / GHCR images | `mcr.microsoft.com/playwright:v1.64.0-noble` | `.github/workflows/*` | CI | Add macOS runners for iOS builds | - |

**Not present**: no payments (Stripe/Razorpay/IAP), no Sentry/Crashlytics (errors go to PostHog `error_reported` only, and backend logs), no push notifications (APNs/FCM), no Apple sign-in, no CDN beyond Vercel edge.

**Webhooks**: none implemented in the app. The only webhook mentioned is Render's GitHub App deploy webhook (`DEPLOYMENT.md:132-148`, not connected - "Auto-deploy on push isn't wired up") and a Render deploy-hook URL kept in gitignored `.secrets/render-deploy-hook` (`scripts/deploy-backend.sh:8,27,75`).

**Browser CSP allow-list** (`frontend/next.config.ts:56-77`) is a good map of client-side egress: self, API origin, `*.posthog.com`, `api.openai.com`, `accounts.google.com`, `*.googleusercontent.com` (img). Equivalent for iOS App Transport Security: all HTTPS, no exceptions needed in prod.


### 5.2 External services called by the backend (detail)

| Service | Purpose | Package / transport | File(s) | Config (env name) |
|---|---|---|---|---|
| Anthropic Claude | All answer generation, gates, classification, verification, reviews, reflection, counterfactual, titles, memory, profile, stated facts, compose, office export, admin NL->SQL, image intent; web_search tool fallback | `anthropic` (unpinned in requirements) `AsyncAnthropic` | `services/anthropic_client.py:35-44` | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` etc. (`config.py:37-63,167`) |
| OpenAI | Fallback text gen (Responses API), embeddings `text-embedding-3-small`, Whisper STT, TTS, web_search tool (primary for research rounds), picker models | `openai==2.48.0` `AsyncOpenAI` | `services/openai_client.py:31-422`; `web_research.py:426-445` | `OPENAI_API_KEY`, `OPENAI_*` (`config.py:16-32,168-176`; `render.yaml:31-50`) |
| OpenAI Images | gpt-image generation/edits | `httpx` to `api.openai.com/v1/images/*` | `services/image_generation.py:249-317` | `IMAGE_MODEL`, `IMAGE_SIZE` |
| OpenAI Realtime | Ephemeral client secret for live call | `httpx` to `api.openai.com/v1/realtime/client_secrets` | `api/realtime.py:38,132-228` | `OPENAI_REALTIME_MODEL/VOICE` |
| Google Gemini | Optional Co-Creative picker models | `httpx` SSE to `generativelanguage.googleapis.com/v1beta/models/{m}:streamGenerateContent` | `services/extra_providers.py:52-70` | `GOOGLE_API_KEY`, `GOOGLE_MODEL`, `GOOGLE_FAST_MODEL`, `GOOGLE_THINKING_BUDGET` (`config.py:121-163`) |
| xAI Grok | Optional Co-Creative picker model | `httpx` to `{XAI_BASE_URL}/chat/completions` | `services/extra_providers.py:136` | `XAI_API_KEY`, `XAI_MODEL`, `XAI_BASE_URL`, `XAI_REASONING_EFFORT` |
| Tavily | Web search for context and claim research | `httpx` to `api.tavily.com/search` | `services/web_research.py:210-306,506-546` | `TAVILY_API_KEY` (optional) |
| Arbitrary web hosts | Fetch PDFs found by search (SSRF-guarded) | `httpx` + `pdfplumber` | `services/pdf_source.py` | - |
| ipapi.co | IP -> city/region/country/timezone | `httpx` | `services/geolocation.py:25-82` | - (free tier, no key) |
| Resend | Transactional email | `httpx` | `services/email_service.py:17-51` | `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL` |
| Google Identity | Verify Google ID tokens | `google-auth==2.56.2` (`google.oauth2.id_token`) | `api/auth.py:6-7,313-368` | `GOOGLE_CLIENT_ID` |
| Supabase Storage (S3 API) | Documents + generated images | `boto3==1.43.56` | `services/storage.py` | `S3_ENDPOINT/ACCESS_KEY/SECRET_KEY/BUCKET/REGION` |
| Supabase Postgres | Primary DB | `asyncpg`, SQLAlchemy | `db/session.py` | `DATABASE_URL` |
| Upstash Redis | Celery broker/backend, rate limits, counters | `redis==8.0.1`, `celery==5.6.3` | `core/celery_app.py`, `core/rate_limit.py`, `services/preview_access.py`, `services/guest_demo.py` | `REDIS_URL` |
| Payments | **None** - no Stripe/RevenueCat/IAP code | - | `services/preview_access.py:4-6` | - |
| Apple Sign-In | **None** | - | - | - |

Secrets are environment variables only; `render.yaml` marks them `sync: false` (`render.yaml:31-110`). Dev-only default credentials appear in `backend/app/core/config.py:186-187` and `infra/docker-compose.yml:12,38-39,58,68,89` [redacted].



---

## 6. State Management & Data Flow

### 6.1 State management

> Paths relative to `frontend/`.

No Redux/Zustand/Jotai. Exactly **one React Context** (`AuthContext`). Everything else is a module-level store read through `useSyncExternalStore`, or local component state.

| Store | File | Mechanism | Holds | Persistence |
|---|---|---|---|---|
| Auth | `lib/auth.tsx:158-274` | React Context `AuthProvider`/`useAuth` | `user: User | null` (`id, email, display_name, onboarding_completed_at?, is_admin?`), `loading`, `login/register/logout/completePasswordReset/refresh` | Tokens in localStorage (below); user re-fetched from `/auth/me` on boot |
| Stored session | `lib/auth.tsx:42-66` | useSyncExternalStore (`useHasStoredSession`) + `storage` event | whether a refresh token exists | localStorage `clardentity_refresh_token` |
| Server wait | `lib/serverWait.ts` | useSyncExternalStore | `"none" | "waking" | "still"` (4s / 20s thresholds; "awake" if any answer in last 5 min) | memory |
| Theme/accent | `lib/theme.tsx` | `<html data-theme / data-accent>` as source of truth, `clardentity:appearance` window event, `useAppearance` | theme light/dark, accent burgundy/indigo/teal/plum (accent not applied on `/` when signed out) | localStorage `clardentity-theme`, `clardentity-accent` |
| Tour | `lib/tour.tsx:153-298` | useSyncExternalStore | `{active: "workspace"|"chat"|null, stepIndex, done{}}`; `TourProvider` auto-starts chat tour on `/chat/*`, workspace tour on `/workspace/[id]` | localStorage `clardentity-tour` (JSON) |
| Consent | `lib/consent.ts` | useSyncExternalStore | `"granted" | "denied" | "unset"` | localStorage `clardentity-consent` |
| Preview access | `lib/previewAccess.ts` | useSyncExternalStore | `{unlocked, modes[], dailyLimit, usedToday, remainingToday}`; default locked modes `mentoring, therapy, creative, legal` | server (`/pro/preview`), memory |
| Companion names | `lib/companionNames.ts` | useSyncExternalStore | `Record<mode, name>` | server (`/profile` `companion_names`) |
| Learning role | `lib/learningRole.ts` | subscribe/getSnapshot (used with useSyncExternalStore in `LearningRoleCard`) | `student | teacher | visiting | null` | server (`/profile`, `/profile/learning-role`) |
| Pickable models | `lib/pickableModels.ts` | subscribe/getSnapshot | models list for Co-Creative; chosen model per mode | list from server; choice in localStorage `clardentity.model.choice` (JSON) |
| Smart switching | `lib/modeSwitching.ts` | useSyncExternalStore | boolean (default smart) | localStorage `clardentity-mode-switching` = `smart`/`manual` |
| Sidebar collapsed | `components/system/AppShell.tsx:36-60` | useSyncExternalStore | boolean | localStorage `clardentity-sidebar-collapsed` = `1`/`0` |
| Guest import result | `lib/guestHandoff.ts:115-188` | subscribe/snapshot (`subscribeImported`, `importedSnapshot`) | last imported `{conversation_id, workspace_id, message_count}` until announced | transcript stash in localStorage `clardentity.guestTranscript` (24h max age) |
| Guest session id | `lib/guestDemo.ts:14-38` | plain function | uuid for demo allowance | localStorage `clardentity.guest.session` |
| Last workspace | `lib/lastWorkspace.ts` | plain get/set | workspace id | localStorage `clardentity-last-workspace` |
| Fresh chats | `lib/freshChats.ts` | module `Set` | ids of just-created chats | memory |
| Online | `lib/useOnline.ts` | useSyncExternalStore | `navigator.onLine` | - |
| Media queries | `lib/usePhoneLayout.ts`, `useTouchKeyboard.ts`, `useReducedMotion.ts` | useSyncExternalStore | booleans | - |
| GET cache | `lib/apiClient.ts:49-87` | module `Map` | in-flight/recent GET promises (3s), cleared on any write | memory |
| Chat draft | `components/chat/ChatView.tsx:177-229` | component state + sessionStorage | composer draft per chat | sessionStorage `clardentity-draft:{conversationId}` |
| Scroll position | `components/chat/MessageList.tsx:132-180` | sessionStorage | scrollTop per chat (dropped when near bottom) | sessionStorage `clardentity-place:{conversationId}` |
| Greeted this tab | `components/system/AppNotices.tsx:48-70` | sessionStorage | "welcome back" shown flag | sessionStorage `clardentity.greetedThisSession` |

Custom window events used as a message bus: `clardentity:appearance` (theme), `clardentity:conversation-renamed` (`ChatView.tsx:554-556`, consumed by AppShell to retitle), `clardentity:open-nav` / `clardentity:close-nav` (TourOverlay -> AppShell drawer).

#### All browser-storage keys (complete)
localStorage: `clardentity_access_token`, `clardentity_refresh_token`, `clardentity-theme`, `clardentity-accent`, `clardentity-tour`, `clardentity-consent`, `clardentity-mode-switching`, `clardentity-sidebar-collapsed`, `clardentity-last-workspace`, `clardentity.model.choice`, `clardentity.guest.session`, `clardentity.guestTranscript`, plus PostHog's own keys when consent granted (ASSUMPTION: default `ph_<key>_posthog` localStorage+cookie persistence, since `persistence` is not set in `lib/analytics.ts:125-142`).
sessionStorage: `clardentity-draft:{id}`, `clardentity-place:{id}`, `clardentity.greetedThisSession`.
No cookies written by app code.


### 6.2 Data fetching, the API client, streaming and the frontend → backend map

#### API client (`lib/apiClient.ts`)
- Base URL: `BACKEND_ROOT_URL = NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"` (`:4-5`); `API_BASE_URL = NEXT_PUBLIC_API_URL ?? BACKEND_ROOT_URL + "/api/v1"` (`:7-8`). All paths below are relative to `API_BASE_URL` unless noted.
- `apiFetch<T>(path, {method, body, headers, fresh, ...RequestInit})`:
  - JSON-encodes `body` and sets `Content-Type: application/json` only when body present (`:103,107`).
  - Injects `Authorization: Bearer <localStorage clardentity_access_token>` when present (`:97,104`).
  - No cookies/credentials mode (default fetch, so no cookies cross-origin).
  - **Dedupe/cache**: identical GET paths share one promise for 3000ms; failures evicted; any non-GET clears the whole cache; `fresh: true` opts out (`:49-87`).
  - **401 handling**: on 401 and not already a retry and a refresh token exists -> `refreshAccessToken()` -> replay once (`:110-115`).
  - **Errors**: non-2xx throws `ApiError(status, parsedJsonBodyOrNull)` (`:117-125`); 204 returns `undefined` (`:127-129`); otherwise `res.json()`.
  - Every request wrapped in `trackServerWait(...)` (status < 500 counts as "server awake") for the cold-start notice (`:100-108`).
- `refreshAccessToken()` (`lib/auth.tsx:87-119`): single-flight; `POST /auth/refresh {refresh_token}` with raw fetch; on 401/403 clears tokens; on 5xx/network returns null but keeps tokens; on success stores both new tokens (refresh token rotates).
- **Cold-start retry** (`lib/auth.tsx:167-200`): on boot, if a refresh token exists, `GET /auth/me`; on **phone layout only** (`max-width: 1023.98px`) retries every 3s for up to 60s while the error is a network `TypeError` or 502/503/504. 401/403 clears tokens. Other errors keep tokens (user is just not loaded). Desktop tries once.
- Error message helpers: `networkErrorMessage()` maps "Failed to fetch"-style errors to "Couldn't reach the server. It may be waking up..." (`lib/auth.tsx:287-295`); `authErrorMessage()` prefers `ApiError.body.detail` (`:297-303`).
- Raw `fetch` (not `apiFetch`) is used where the body is not JSON or is multipart/stream: SSE chat, TTS (blob), export file (blob), audio transcribe (multipart), document upload (multipart), profile import (multipart), Google OAuth, refresh, realtime session, guest chat, health, dictionaries. These each re-implement bearer injection; only `sse.ts`, `liveCall.ts`, `ImportHistory.tsx` also do the 401->refresh->retry; `AudioRecorder`, `DocumentUploader` upload, `ChatView` TTS and `ExportFileMenu` do **not** retry on 401.

#### SSE / streaming (`lib/sse.ts`)
- Not `EventSource` (needs POST + auth header). `streamChatMessage(conversationId, body, handlers, signal)` does `fetch POST {API}/chat/{id}/messages` with JSON + bearer (`:287-302`), one 401->refresh->reopen (`:324-337`), then `consumeChatStream(res.body)`.
- Non-OK: reads `detail`; a 401 after refresh becomes "Your session has expired. Please sign in again." (`:339-353`).
- Parser (`consumeChatStream`, `:365-450`): `ReadableStream` reader + `TextDecoder`, normalises `\r\n` -> `\n` (sse-starlette), splits frames on blank line, per frame collects `event:` and concatenated `data:` lines, `JSON.parse`, dispatches. Any chunk calls `onActivity` (server pings every 15s). Read error -> `onDropped`. Stream end without a concluding event -> `onDropped`. AbortError is silent.
- Event types (`handleRawEvent`, `:452-483`):

| SSE `event:` | Payload | Handler |
|---|---|---|
| `status` | `{phase, label}` phases: searching, reading, thinking, validating, image, slow (`ChatView.tsx:57-64`) | `onStatus` |
| `crux` | `{text}` one-sentence gist, sent first | `onCrux` |
| `review` | `{decision_review?, thinking_review?}` | `onReview` |
| `delta` | `{text}` body token chunk | `onDelta` |
| `answer` | `{message: ChatMessage, user_message?: ChatMessage}` answer saved, composer re-enabled | `onAnswer` |
| `image` | `GeneratedImage {id, owner, prompt}` | `onImage` |
| `final` | `ChatFinalEvent {message, claims, confidence, avatar_cue, counterfactual_content, research_notes, conversation_title?}` | `onFinal` |
| `mode_suggestion` | `{suggested_mode, mode_reason}` (gate, nothing saved) | `onModeSuggestion` |
| `context_question` | `{question}` (gate) | `onContextQuestion` |
| `refined_question` | `{refined_question, refinement_reason}` (gate) | `onRefinedQuestion` |
| `clarifying_options` | `{question, options[]}` (gate) | `onClarifyingOptions` |
| `switched` | `{from, to}` (guest demo only) | `onSwitched` |
| `budget` | `{used, budget, limit_reached}` (guest demo only) | `onBudget` |
| `error` | `{detail}` | `onError` |

- Request body `SendMessageBody` (`:249-281`): `content, mode, reasoning_lens?, model? (Co-Creative only), attachments[] {type: image|document, data: base64, mime_type, filename}, audio_duration_seconds?, mode_confirmed?, context_acknowledged?, context_rounds?, refined_confirmed?, clarifying_confirmed?, parent_id? (edit fork), regenerate_of? (regenerate)`.
- Client-side reliability in `ChatView`: `SILENCE_MS = 45000` watchdog (`:73,743-750`) and `onDropped` both call `recoverAfterDrop()` which re-reads `GET /chat/{id}/messages` (fresh) and either shows the saved answer or drops the optimistic question (`:702-740`). `SLOW_AFTER_MS = 7000` (or server `status: slow`) shows a "Quick answer" button that re-sends in mode `rapid` with `mode_confirmed` (`:66-68,685-691`). Stop = `AbortController.abort()`; Esc also stops.

#### No React Query / SWR / axios / WebSocket / EventSource
Confirmed by grep: none. The only realtime transport other than fetch-streams is WebRTC (section 8).

#### Custom hooks with data
`usePreviewAccess`/`useLockedModes` (`lib/previewAccess.ts:118-139`), `useCompanionNames` (`lib/companionNames.ts:68`), `useCounterfactual` (`components/chat/ResponseFlip.tsx:46`), `useServerWait`, `useHasStoredSession`, `useConsent`, `useAppearance`, `useTour`, `useOnline`, `usePhoneLayout`, `useTouchKeyboard`, `usePrefersReducedMotion`, `useScrollEdges`.

#### Frontend -> backend endpoint map (complete)
Base = `API_BASE_URL` (`.../api/v1`) unless marked otherwise. "raw" = plain fetch rather than `apiFetch`.

| Method | Path | Called from (file:line) | Purpose |
|---|---|---|---|
| POST | `/auth/login` `{email, password}` -> `{access_token, refresh_token}` | `lib/auth.tsx:209` | Password login (email or admin username) |
| GET | `/auth/me` -> `User` | `lib/auth.tsx:182` (boot hydrate w/ retry), `:214` (after login), `:251` (after reset), `:256` (`refresh()`) | Current user |
| POST | `/auth/register` `{email, password, display_name?, accepted_terms}` -> tokens + `user` | `lib/auth.tsx:220` | Sign up |
| POST (raw) | `/auth/refresh` `{refresh_token}` -> tokens | `lib/auth.tsx:95` | Rotate tokens |
| POST | `/auth/password-reset/request` `{email}` | `app/(auth)/forgot-password/page.tsx:22` | Send reset email |
| POST | `/auth/password-reset/confirm` `{token, password}` -> tokens | `lib/auth.tsx:246` | Reset and sign in |
| POST (raw) | `/auth/oauth/google` `{id_token}` -> tokens | `components/auth/GoogleSignInButton.tsx:44` | Google sign-in/up |
| DELETE | `/auth/me` | `components/profile/DeleteAccount.tsx:23` | Delete account |
| POST | `/bootstrap` `{workspace_id: lastWorkspaceId|null}` -> `{active_workspace_id, conversation_id}` | `components/chat/StartChat.tsx:53` | Resolve/create workspace + reusable empty chat |
| GET | `/workspaces` -> `Workspace[] {id,name,role,created_at}` | `components/system/AppShell.tsx:414`, `components/workspace/WorkspaceList.tsx:58`, `components/workspace/WorkspaceDetail.tsx:60` | List workspaces |
| POST | `/workspaces` `{name}` | `components/workspace/WorkspaceList.tsx:93` | Create workspace |
| GET | `/workspaces/{id}` | `components/workspace/WorkspaceDetail.tsx:58`, `WorkspaceDocuments.tsx:18`, `WorkspaceSearch.tsx:17` | Workspace detail |
| DELETE | `/workspaces/{id}` | `components/workspace/WorkspaceDetail.tsx:113` | Delete workspace |
| GET | `/chat/conversations?workspace_id={id}` | `components/system/AppShell.tsx:146` (recents), `components/workspace/WorkspaceDetail.tsx:59` | List chats |
| POST | `/chat/conversations` `{workspace_id, default_mode}` | `components/system/AppShell.tsx:654` (mode null), `components/workspace/WorkspaceDetail.tsx:82` | New chat |
| GET | `/chat/conversations/{id}` -> `{id,title,default_mode,workspace_id}` | `components/chat/ChatView.tsx:284`, `components/system/AppShell.tsx:446` (breadcrumb) | Chat metadata |
| PATCH | `/chat/conversations/{id}` `{title}` / `{pinned}` / `{workspace_id}` | `components/chat/ChatRowMenu.tsx:124` | Rename / pin / move |
| DELETE | `/chat/conversations/{id}` | `components/chat/ChatRowMenu.tsx:141` | Delete chat |
| GET | `/chat/{id}/messages` -> `ChatMessage[]` (active branch) | `components/chat/ChatView.tsx:285` (load), `:709` (drop recovery, fresh), `:905` (reload, fresh) | Thread |
| POST (raw, SSE) | `/chat/{id}/messages` `SendMessageBody` | `lib/sse.ts:293` via `ChatView.tsx:413` (`handleSend`, also used by regenerate `:804`, edit `:843`, quick answer `:685`, clarifier/refined/context/options re-sends) | Ask / regenerate / edit-fork; streamed answer |
| DELETE | `/chat/{id}/messages/{messageId}` | `components/chat/ChatView.tsx:892` | Delete a message |
| PUT | `/chat/{id}/active-leaf` `{message_id}` -> `{active_leaf_id}` | `components/chat/ChatView.tsx:874` | Switch fork branch |
| POST | `/chat/{id}/call-transcript` `{mode, turns[{role,content}]}` -> `ChatMessage[]` | `components/chat/ChatView.tsx:787` | Save live-call transcript to thread |
| PUT | `/chat/{id}/messages/{messageId}/feedback` `{rating: up|down|null, comment}` | `components/chat/FeedbackWidget.tsx:42` | Feedback |
| POST | `/chat/{id}/messages/{messageId}/devils-advocate` -> `{counterfactual_content}` | `components/chat/ResponseFlip.tsx:71` | Generate counterfactual |
| POST (raw, blob) | `/chat/{id}/messages/{messageId}/export-file` `{format: docx|pptx|xlsx}` -> file, `Content-Disposition` filename | `components/chat/ExportFileMenu.tsx:38` | Export answer as Office file |
| GET | `/chat/models?mode={mode}` -> `{models[{id,label,vendor,blurb}]}` | `lib/pickableModels.ts:91` | Co-Creative model list |
| POST | `/compose/complete` `{text}` -> `{completion}` | `components/chat/MessageInput.tsx:185` | Ghost-text autocomplete |
| POST (raw, blob) | `/audio/tts` `{text}` -> audio bytes | `components/chat/ChatView.tsx:923` | Read answer aloud |
| POST (raw, multipart) | `/audio/transcribe` form `file=recording.webm` -> `{transcript, heard_speech?, language?}` | `components/upload/AudioRecorder.tsx:89` | Dictation |
| POST (raw) | `/realtime/session` `{timezone, languages[]}` -> `{client_secret}` | `lib/liveCall.ts:57` | Mint OpenAI Realtime ephemeral key |
| POST (raw, external) | `https://api.openai.com/v1/realtime/calls` body = SDP offer, `Authorization: Bearer {client_secret}`, `Content-Type: application/sdp` | `lib/liveCall.ts:141` | WebRTC SDP exchange (not our backend) |
| GET | `/documents?workspace_id={id}` (fresh) | `components/upload/DocumentUploader.tsx:40` | List documents |
| POST (raw, multipart) | `/documents/upload` form `workspace_id`, `file` | `components/upload/DocumentUploader.tsx:88` | Upload document |
| DELETE | `/documents/{documentId}` | `components/upload/DocumentUploader.tsx:111` | Delete document |
| GET | `/documents/search?workspace_id=&q=[&conversation_id=]` | `components/workspace/AttachmentSearch.tsx:57` | Literal search in attachments |
| GET | `/history/search?workspace_id=&q=` | `components/workspace/HistorySearch.tsx:54` | Search chat history |
| GET | `/images/{owner}/{id}.webp` (via `<img src>`, no auth header) | `components/chat/GeneratedImageCard.tsx:23` | Generated image bytes |
| GET | `/profile` -> `{personality_md, aspects, roles, user_edited, updated_at, companion_names?, learning_role?}` | `components/profile/ProfileView.tsx:61`, `lib/companionNames.ts:42`, `lib/learningRole.ts:53` | Profile |
| PUT | `/profile` `{companion_names}` | `lib/companionNames.ts:85` | Save companion names |
| DELETE | `/profile` | `components/profile/ProfileView.tsx:122` | Wipe learned profile |
| POST | `/profile/aspects` `{label, value}` -> Profile | `components/profile/ProfileView.tsx:80` | Add fact |
| DELETE | `/profile/aspects/{id}` -> Profile | `components/profile/ProfileView.tsx:95` | Remove fact |
| POST | `/profile/rebuild` | `components/profile/ProfileView.tsx:107` | Rebuild profile from history (background) |
| POST (raw, multipart) | `/profile/import` form `file` | `components/profile/ImportHistory.tsx:44` | Import other-assistant export |
| POST | `/profile/onboarding` `{answers[{question, answer}]}` | `app/welcome/page.tsx:59` | Welcome answers / skip (stamps onboarding) |
| PUT | `/profile/learning-role` `{role}` | `lib/learningRole.ts:80` | Learning role |
| GET | `/pro/preview` -> `{unlocked, modes, daily_limit, used_today, remaining_today}` | `lib/previewAccess.ts:87` | Locked-mode preview status |
| POST | `/pro/preview` | `lib/previewAccess.ts:102` (via `UpgradeDialog.tsx:89`) | Open preview |
| DELETE | `/pro/preview` | `lib/previewAccess.ts:108` (via `UpgradeDialog.tsx:92`) | Close preview |
| POST | `/pro/interest` `{model}` -> `{email}` | `components/chat/UpgradeDialog.tsx:104` | Register upgrade interest |
| POST (raw, SSE, no auth) | `/guest/chat` `{session_id, mode, message, history, smart_switching, mode_confirmed, refined_confirmed, clarifying_confirmed, context_acknowledged, context_rounds, regenerate, last_image_id}` | `lib/guestDemo.ts:72` (from `GuestDemo.tsx:357`) | Landing demo chat (429 / 503 mapped to messages) |
| POST | `/guest/import` `{mode, turns}` -> `{conversation_id, workspace_id, message_count}` | `lib/guestHandoff.ts:196` (triggered by `AppNotices.tsx`) | Import demo transcript into new account |
| GET | `/admin/overview` | `components/admin/AdminDashboard.tsx:92` | Admin stats (404 for non-admin) |
| POST | `/admin/query` `{question}` | `components/admin/AdminDashboard.tsx:105` | Admin NL read-only query |
| GET / PUT | `/admin/settings` / `{key, value}` | `components/admin/AdminSettings.tsx:85,126` | Admin settings (component unused) |
| GET (raw) | `{BACKEND_ROOT_URL}/health` (root, not `/api/v1`) | `components/system/HealthStatus.tsx:24` | Health (component unused) |
| GET (raw, same origin) | `/dict/en-us.aff`, `/dict/en-us.dic`, `/dict/en-gb.aff`, `/dict/en-gb.dic`, `/dict/en-common.txt` | `lib/autocorrect.ts:34,47-51` | Autocorrect dictionaries (frontend static, not backend) |

Third-party network: `https://accounts.google.com/gsi/client` script (`GoogleSignInButton.tsx` `<Script>`), PostHog (`NEXT_PUBLIC_POSTHOG_HOST`, default `https://eu.i.posthog.com`), OpenAI Realtime (above).


### 6.3 Auth on the frontend

- **Token storage**: localStorage `clardentity_access_token`, `clardentity_refresh_token` (`lib/auth.tsx:15-40`). Both rotated on refresh. `lib/theme.tsx:14` reads the access-token key directly (pre-paint accent rule). Native port: move to Keychain / Android Keystore (EncryptedSharedPreferences).
- **Bearer only**; no cookies, no CSRF.
- **Boot**: `AuthProvider` hydrates only if a refresh token exists; `loading` true until `/auth/me` resolves (with phone cold-start retry, section 6.1).
- **Login** (`app/(auth)/login/page.tsx`): field accepts email or admin username (`type="text" inputMode="email"`, `:59-76`); `login()` -> `/auth/login` -> store tokens -> `/auth/me` -> `replace("/start")`.
- **Register** (`app/(auth)/register/page.tsx`): name optional, email, password (min 8), required unticked terms checkbox -> `accepted_terms: true` (`:100-122`); `/auth/register` returns tokens and user.
- **Google OAuth** (`components/auth/GoogleSignInButton.tsx`): Google Identity Services ID-token flow (popup/One Tap button, not redirect). No `/auth/callback` page exists - the GIS callback posts `id_token` to `/auth/oauth/google`, stores tokens, `refresh()`, `replace("/start")`. Hidden unless `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. COOP `same-origin-allow-popups` exists for this. Native: use Google Sign-In SDK to obtain an ID token and post the same endpoint (ASSUMPTION: backend verifies audience; native client IDs may need adding server-side).
- **Logout**: `logout()` = `clearTokens()` + `setUser(null)` only (`lib/auth.tsx:240-243`). **No server call** (no token revocation endpoint used). Triggered from `AccountMenu.tsx:184`. Analytics identity reset by `Analytics.tsx:51-54`.
- **Password reset**: `/forgot-password` -> `/auth/password-reset/request` (neutral message, link valid 30 min per copy); email links to `/reset-password?token=...` -> `/auth/password-reset/confirm` returns tokens -> signed in -> `/start`. Native: needs universal/app links for `/reset-password`.
- **Session expiry**: refresh 401/403 clears tokens; any `RequireAuth` page then redirects to `/login`. SSE 401-after-refresh shows "Your session has expired" (`lib/sse.ts:350`). Comment notes tokens last ~30 days (`lib/sse.ts:347-349`).
- **RequireAuth gate** (`components/system/RequireAuth.tsx`): spinner while loading; no user -> `/login`; `onboarding_completed_at === null` (strict null, undefined does not gate) -> `/welcome`; else render inside `AppShell`.
- **RedirectIfSignedIn** (`components/auth/RedirectIfSignedIn.tsx`): on login/register pages, a stored refresh token sends you to `/start` immediately (no `/auth/me` wait).
- **Onboarding/welcome gate**: `/welcome` page itself redirects signed-out -> `/login`, already onboarded -> `/start`; finishing or "Skip for now" both POST `/profile/onboarding` with whatever was typed, then `refresh()`, `resetTours()`, -> `/start`.
- **Admin gate**: client hides the sidebar Admin link unless `user.is_admin` (`AppShell.tsx:725`); `/admin` page is only `RequireAuth`; the server returns 404 from `/admin/overview` for non-admins and the dashboard shows "This account cannot open the dashboard." (`AdminDashboard.tsx:92-94`).
- **Account deletion**: `DELETE /auth/me` -> logout -> `/`.


### 6.4 Realtime / voice on the client

| Feature | Files | APIs |
|---|---|---|
| **Live voice call** | `lib/liveCall.ts` (class `LiveCall`), `components/chat/LiveCallOverlay.tsx`, launched from composer button (`data-tour="live-call"`) in `MessageInput`, overlay mounted in `ChatView.tsx:1043`; transcript saved by `handleCallEnded` (`ChatView.tsx:782-797`) | 1) `POST /realtime/session` with `{timezone, languages}` -> `client_secret` (401 -> refresh once; 429/503 detail shown) (`liveCall.ts:53-90`). 2) `getUserMedia({audio: echoCancellation, noiseSuppression, autoGainControl})` (`:110-112`). 3) `new RTCPeerConnection()` (default ICE config), add mic track, data channel `"oai-events"` (`:115-136`). 4) SDP offer POSTed to `https://api.openai.com/v1/realtime/calls` with `Bearer {client_secret}`, `Content-Type: application/sdp`; answer SDP set as remote (`:138-149`). 5) Remote audio played via `new Audio()` with `srcObject`; `AudioContext` + `AnalyserNode` (fftSize 1024) drives mouth visemes `{openness, width}` per rAF (`:190-265`). 6) Data-channel events: `output_audio_buffer.started/stopped` -> phase speaking/listening; `conversation.item.input_audio_transcription.completed` (user) and `response.output_audio_transcript.done` (assistant) -> transcript turns (`:166-187`). Mute = disable mic track (`:270-274`). Phases: connecting, listening, speaking, ended, error. Errors: mic blocked (`NotAllowedError`), call dropped (`connectionState failed/disconnected`). Overlay: full-screen dialog, Escape closes, turns handed to parent on unmount; saved via `POST /chat/{id}/call-transcript`. Native: use OpenAI Realtime WebRTC via native WebRTC libs (or the Realtime WebSocket API) with the same ephemeral-key mint. |
| **Dictation (voice message)** | `components/upload/AudioRecorder.tsx` (in composer, `data-tour="voice"`) | `getUserMedia({audio:true})` -> `MediaRecorder` (default mime) -> Blob typed `audio/webm` -> multipart `POST /audio/transcribe` (`file=recording.webm`). Response `{transcript, heard_speech, language}`; silent -> "Didn't catch any speech"; unexpected language -> "Heard this as X" notice; transcript appended to composer. No 401 retry. ASSUMPTION: Safari/iOS MediaRecorder produces mp4/aac despite the `audio/webm` label; backend must sniff. Native: record m4a/aac and upload. |
| **TTS (Listen)** | `ChatView.tsx:913-946` `handlePlayAudio`, Listen control in `MessageList` | `POST /audio/tts {text}` -> blob -> `URL.createObjectURL` -> `new Audio(url).play()`; toggles pause; avatar state "speaking" while playing. Gated server-side by admin flag `tts_enabled` (ASSUMPTION: the server rejects/hides when off; `AdminSettings.tsx:43-46` describes it). Object URLs are never revoked (minor leak). |
| **Avatar** | `components/avatar/AvatarPanel.tsx` | Pure SVG + CSS; states driven by ChatView (`reacting/speaking/thinking/listening/idle`), gesture per mode (`ChatView.tsx:75-83`), expression from `final.avatar_cue`. |
| WebSocket | none | - |
| Streaming text | `lib/sse.ts` | fetch ReadableStream SSE (section 6.2) |

Permissions-Policy allows microphone on self only; camera disabled (no camera capture in app).


### 6.5 Analytics, consent, error reporting, tours, flags, guest demo

#### Analytics (PostHog) - `lib/analytics.ts`
- Enabled only if `NEXT_PUBLIC_POSTHOG_KEY` is set **and** consent is `granted` (`:109-111`). SDK is dynamically imported on first event (`:119-148`).
- Host `NEXT_PUBLIC_POSTHOG_HOST ?? https://eu.i.posthog.com`.
- Init options: `autocapture:false`, `disable_session_recording:true`, `capture_pageview:false`, `capture_pageleave:false`, `person_profiles:"identified_only"`, `mask_all_text`, `mask_all_element_attributes`, `sanitize_properties` (rewrites url/pathname/referrer/host/origin props to route patterns, strips query).
- `track()` drops any property whose key matches `/content|question|answer|text|title|email|name|filename|query|prompt/i` and string values > 40 chars (`:151-166`).
- `trackPageView(pattern)` sends `$pageview {pattern}` with `/chat/[id]`, `/workspace/[id]` patterns; `identify(user.id)` (UUID only); `resetIdentity()`; `durationBucket()`.
- Closed event list (`:37-98`): `app_opened, signed_in, chat_opened, question_asked, gist_shown, answer_shown, answer_failed, mode_picked, model_picked, learning_role_set, accent_picked, theme_picked, mode_switched_automatically, mode_switch_reverted, quick_answer_tapped, attachment_added, voice_recorded, call_started, completion_accepted, guest_demo_opened, guest_demo_asked, guest_demo_limit, guest_demo_signup_clicked, guest_demo_new_chat, guest_demo_mode_picked, guest_demo_gated, guest_demo_mode_switched, gate_shown, gate_answered, gate_skipped, locked_mode_tapped, plans_opened, preview_opened, stream_dropped, chat_renamed, chat_pinned, chat_moved, chat_deleted, tour_started, tour_finished, feedback_given, answer_regenerated, counterfactual_flipped, answer_listened, conversation_exported, document_uploaded, consent_choice` (+ `error_reported` from errorReport, `$pageview`).
- Session-level sender: `components/system/Analytics.tsx` (`app_opened {viewport: phone|tablet|desktop, installed}`).

#### Consent - `lib/consent.ts`, `components/system/ConsentBanner.tsx`
localStorage `clardentity-consent` = granted/denied; banner only when key configured, settled, and unset; equal-weight Allow / No thanks; `resetConsent()` exists for a "change your mind" link but has **no caller** (grep: only defined at `lib/consent.ts:55`), so there is currently no in-app way to change the choice after answering. Native: replicate as a first-run prompt; iOS may additionally need ATT only if IDFA is used (it is not).

#### Error reporting
- No Sentry. `ErrorBoundary` (`components/system/ErrorBoundaries.tsx`) on phone layout shows inline retry and a "Report" sheet; `sendErrorReport(ref, where, error)` (`lib/errorReport.ts:30-64`) inits PostHog with `persistence:"memory"`, flags/surveys/external loading disabled, and sends one `error_reported {ref, where, error_type, frame (first /_next/ stack line, 160 chars), route pattern}` with `send_instantly`. Ref format `XXXX-XXXX` (`makeErrorRef`). Ref copyable via `navigator.clipboard`.
- `app/error.tsx` / `app/global-error.tsx` -> `FullScreenError` (Reload = `window.location.reload()`, link `/start`).
- Wrapped regions: AppShell content, chat parts, MessageList items, admin cards (imports of `ErrorBoundary`).

#### Tours / coachmarks - `lib/tour.tsx`, `components/tour/TourOverlay.tsx`
Two tours: `workspace` (8 steps: workspace-switcher, nav-attachments, nav-chats, nav-workspaces, nav-profile, theme-toggle, chat-list, new-chat) and `chat` (8 steps: mode-picker, switching-toggle, composer-input (touch-specific copy), voice, live-call, attach-image, autocomplete, ask-button). Targets via `data-tour="..."` attributes. Auto-start: chat tour on first `/chat/*` visit, workspace tour on first `/workspace/[id]` visit; topbar "?" replays current page's tour (`AppShell.tsx:932`); finishing welcome resets both. Sidebar steps open the phone drawer via `clardentity:open-nav`. Persisted in `clardentity-tour`. Analytics `tour_started`/`tour_finished`.

#### Feature flags
No client-side flag system (PostHog flags explicitly disabled in error reporter; analytics client doesn't call flag APIs). Server-side flags exist and are only edited in the unused `AdminSettings` component: `tts_enabled`, `image_input_enabled`, `bias_screening_enabled` (`components/admin/AdminSettings.tsx:36-55`). Other gating:
- Env-driven: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Google button), `NEXT_PUBLIC_POSTHOG_KEY` (analytics + banner + crash reports).
- Plan/preview gating of 4 modes (`mentoring`, `therapy`, `creative`, `legal`) via `/pro/preview` (`lib/previewAccess.ts`, `lib/modes.ts:150-158 COMING_SOON_MODES`).
- Layout gating: many behaviours are "phone layout only" (`max-width: 1023.98px`) e.g. cold-start retry, ServerWakingNotice, inline error boundaries; autocorrect only on `(pointer: fine)` (`lib/autocorrect.ts:74-80`).

#### Guest demo on landing page
- `components/marketing/GuestDemo.tsx` (984 lines) mounted in `LandingPage.tsx:663`, opened from the hero stage (`HeroComposer` -> `guest_demo_opened`).
- Reuses the real chat components; history held in component state and posted every turn to `POST /guest/chat` (no auth) with a per-browser `session_id` (localStorage `clardentity.guest.session`). Server applies smart switching itself and emits `switched`; emits `budget` last on every stream.
- On `budget.limit_reached` the transcript (with mode, crux, reviews, image per turn; never claims/verification) is stashed to localStorage `clardentity.guestTranscript` (`GuestDemo.tsx:475-489`) and sign-up CTAs link `/register`.
- After sign-up, `AppNotices` -> `importStashedTranscript()` -> `POST /guest/import` once per page load; notice "Your demo conversation is saved · N messages" with link to the imported chat.
- Composer completion and other account features are disabled for guests via the `gated` prop (`MessageInput.tsx:169-172`, `GuestDemo.tsx:953-957`).
- Errors: 503 "The demo is resting for today...", 429 "That's a lot of questions at once" (`lib/guestDemo.ts:98-109`).


### 6.6 Port notes from the frontend audit

- All business logic lives in the client; server pages are thin. The port mostly needs: the API client semantics (bearer, 401->refresh single-flight, rotate tokens, cold-start retry, GET dedupe optional), the SSE parser with the 14 event types and gate re-send flags, WebRTC Realtime, multipart uploads, and the stores listed in section 5 mapped to native persistence.
- Web-only pieces to drop or replace: `public/sw.js`, `InstallAppButton`, `app/manifest.ts`, CSP/headers, `THEME_INIT_SCRIPT`, CSS `zoom` compensation (`lib/uiScale.ts`, `--ui-zoom` 0.85 desktop / 0.92 touch phones in `app/globals.css:480-494`), `--app-vh`/safe-area CSS (`app/globals.css:44,130,597-621`), drawer history hack, nspell dictionaries (use OS autocorrect - the web app already disables its own on touch devices).
- Deep links to support: `/reset-password?token=`, `/chat/{id}`, `/workspace/{id}`, `/workspace/{id}/documents`, `/workspace/{id}/search`.
- Dead code found: `components/system/HealthStatus.tsx`, `components/admin/AdminSettings.tsx` (no importers). `public/file.svg|globe.svg|next.svg|vercel.svg|window.svg` are template leftovers (ASSUMPTION: unreferenced).
- Inconsistencies worth fixing before/while porting: raw-fetch callers `AudioRecorder` (transcribe), `DocumentUploader` (upload), `ChatView` TTS, `ExportFileMenu` lack the 401 refresh-retry that `apiFetch`/`sse.ts`/`liveCall.ts`/`ImportHistory` have; TTS object URLs are not revoked; logout does not revoke the refresh token server-side.


---

## 7. UI/UX & Design System

### 7.1 Responsive breakpoints, phone layout and PWA handling already present

#### Service worker: public/sw.js
- Purpose (sw.js:1-12): installability and a fast cold launch. It is **not** for offline use. API traffic is never cached.
- Cache name: `clardentity-shell-v12` (sw.js:46). Bumping the name purges old caches on `activate` (sw.js:59-66). The version history v4 to v12 is documented inline (sw.js:17-45).
- Precache: `/icon-192.png`, `/icon-512.png` (sw.js:51). `skipWaiting()` on install, `clients.claim()` on activate.
- Fetch strategy (sw.js:68-110):
  - Requests that are not GET, are cross-origin, or are `/api/*` pass through untouched. This includes SSE and realtime traffic.
  - `request.mode === 'navigate'` always goes to the network (no HTML caching).
  - `/_next/static/*` is served **cache-first** (content-addressed).
  - Everything else of our own (icons, the manifest, `/landing`, `/ui`, `/dict`) is served **stale-while-revalidate**: a cached hit is returned and a background fetch updates it.
- Registration: inline in `<head>` on `window.load` (app/layout.tsx:16-22).

#### Web app manifest: app/manifest.ts
- `name`/`short_name` "Clardentity". Description "Your lifelong thinking companion. Every claim scored, every source shown." (manifest.ts:16-20)
- `start_url: "/workspace"`, `scope: "/"`, `display: "standalone"`, `orientation: "any"` (manifest.ts:21-30)
- `background_color` and `theme_color` both `#121013` (the dark canvas) (manifest.ts:28-29)
- `categories: ["productivity","education","utilities"]`
- Icons: `/icon-192.png` 192 (any), `/icon-512.png` 512 (any), `/icon-maskable-512.png` 512 (maskable) (manifest.ts:32-37)

#### Metadata and viewport: app/layout.tsx
- `appleWebApp: { capable: true, title: "Clardentity", statusBarStyle: "black-translucent" }` (layout.tsx:49)
- Icons: `/icon.svg` (sizes any, colour-scheme-aware mark), `/favicon-32.png`, apple `/apple-touch-icon.png` 180x180 (layout.tsx:50-60). `app/favicon.ico` holds 16 and 48 px images.
- OG/Twitter: `metadataBase https://clardentity.ai`, `app/opengraph-image.png` and `app/twitter-image.png` (both 1200x630) (layout.tsx:64-72)
- Viewport (layout.tsx:75-91): `viewportFit: "cover"`, `interactiveWidget: "resizes-content"` (on Android the layout shrinks with the keyboard), `themeColor` light `#f5f3f4` / dark `#121013`.
- **No apple-touch-startup-image (splash) is defined.** iOS PWA launches show a blank screen.

#### Install prompt
- components/system/InstallAppButton.tsx handles three cases: Chromium `beforeinstallprompt` (line 65), an iOS "Share -> Add to Home Screen" instruction (lines 96-100), and hiding the button when already standalone (lines 29-33, 73).
- Analytics records `installed: display-mode standalone` (components/system/Analytics.tsx:30).

#### Offline and cold-start handling
- `useOnline` (lib/useOnline.ts) feeds `components/system/OfflineNotice.tsx:16`, a fixed pill below the topbar on phone only (`lg:hidden`).
- Phone composer keeps the draft and waits while offline (ChatView.tsx:188-191, 230 `online = useOnline() || !phoneLayout`).
- Server waking: `components/system/ServerWakingNotice.tsx:15` (z-60 pill) with `lib/serverWait.ts`. On phone, auth retries for 60s (lib/auth.tsx:170-190).
- Playwright `e2e/offline.spec.ts` has 2 tests.

#### Phone-layout CSS (app/globals.css)
- **Breakpoint line** `max-width: 1023.98px` (just below Tailwind `lg`) means "phone layout". It appears in about 14 CSS blocks and mirrors `usePhoneLayout`.
- **Root zoom** (globals.css:21-44, 480-494): `--ui-zoom: 1` by default. Under `@supports (zoom:1)`, `:root { --ui-zoom: 0.85; zoom: var(--ui-zoom) }`. For `(pointer: coarse) and (max-width:1023.98px)` it is `--ui-zoom: 0.92`. The design was drawn on a 1728px frame and the whole UI is scaled down.
- **`--app-vh`** (globals.css:44, 128-132): `calc(1vh / var(--ui-zoom))`, upgraded to `calc(1dvh / var(--ui-zoom))` where `dvh` is supported. Full-height usages are `min-h-[calc(var(--app-vh)*100)]` in RequireAuth.tsx:44, FullScreenError.tsx:14, AppShell.tsx:766, LandingPage.tsx:272, welcome/page.tsx:91,102, (legal)/layout.tsx:11, and the four auth pages. Partial heights: GuestDemo.tsx:727 (45), UpgradeDialog.tsx:153 (85), ChatView.tsx:1135 (50). AppShell.tsx:761 still also uses `h-screen min-h-screen`.
- **Muted-text AA override** on phones for every accent and theme (globals.css:468-478; values in section 3.2).
- **`.text-xs` floor** at 12.5px on the glass for coarse-pointer phones (globals.css:499-504).
- **Safe areas** (globals.css:597-623): `[data-safe~="top"]` pads by `env(safe-area-inset-top)/zoom` and grows the height by the same amount. `[data-safe~="bottom"]` (only `max-width:639.98px`) pads `0.75rem + inset-bottom`. Used at AppShell.tsx:842 (drawer header), AppShell.tsx:878 (topbar) and ChatView.tsx:1313 (composer wrapper). ErrorBoundaries.tsx:132 uses `pb-[calc(1.25rem+env(safe-area-inset-bottom))]` directly.
- **iOS input zoom prevention**: `input/textarea/select.text-sm|.text-xs` render at `calc(16px/zoom)` on phones (globals.css:605-611).
- **Overscroll**: `main, [data-testid="message-list"] { overscroll-behavior-y: contain }` (globals.css:614-617).
- **touch-action: manipulation** on all interactive elements below lg (globals.css:657-671).
- **Landscape phones** (`max-height:500px` and `max-width:1023.98px`): hero padding tweaks (globals.css:676-683). JS `SHORT_SCREEN` folds the mode rail (ChatView.tsx:1525).
- **Container query**: `.chat-empty { container-type:size }`, and the avatar hides when the container is at most 260px tall, i.e. when the keyboard is open (globals.css:689-696).
- **Staggered list entrance** `.phone-rise` with `--i` index, 120ms steps, capped at 10 (globals.css:702-717). Used in AppShell, DocumentUploader, AttachmentSearch, HistorySearch, WorkspaceList.
- **Edge fades** `.scroll-fade-x/-y` with `data-more-start/end` from lib/useScrollEdges (globals.css:953-975). Used in ChatView, ModeSelector, AppShell.
- **Scrollbars**: `.scroll-slim` is styled only for `min-width:1024px`, fine or no pointer (globals.css:936-948), so phones keep native indicators.
- **Landing reveal** is slower on phones (1.6s) (globals.css:583-589). `.landing-card:active` glow is in the accent colour (globals.css:736-742).

#### Touch tap-target utilities
- `@custom-variant phone-touch (@media (pointer: coarse) and (max-width: 1023.98px))` (globals.css:518). Used 7 times: ChatRowMenu.tsx:167, ClarifyingOptionsCard.tsx:53/70/95, CompanionNames.tsx:70, AppShell.tsx:192, DocumentUploader.tsx:205.
- `@utility tap-area` (globals.css:520-533): an invisible `::after` of at least 44px on the glass (`44px/zoom`). Used 32 times in 20 files, including the `Button` primitive (components/ui/primitives.tsx:91).
- `@utility tap-target` (globals.css:535-540): min-width and min-height 44px/zoom. Used 10 times in 4 files.
- Global rules: `[data-testid="message"] button[aria-label]:not([data-inline])` get a 44px minimum. `[data-composer] button[aria-label]::after` gets a 44px hit area (globals.css:630-652).
- The globals.css:32-37 comment admits the smallest control is 27px before these utilities.
- Tested by e2e `M02 touch targets >= 44px` (e2e/mobile.spec.ts).

#### Keyboard handling
- `interactiveWidget: "resizes-content"` (layout.tsx:81) handles Android. iOS relies on `dvh`.
- On touch, Enter inserts a newline and Send is button-only (lib/useTouchKeyboard.ts; MessageInput.tsx:309).
- The mode rail folds to a chip while the composer is focused (ChatView.tsx:195-219).
- The container query hides the empty-chat avatar when space is short (globals.css:692).
- **Native:** use `KeyboardAvoidingView` or (better) `react-native-keyboard-controller`. Make sure the composer sits above the keyboard and above the home indicator.

#### Gestures
- Drawer swipe-to-close (AppShell.tsx:511-563): pointer-captured, closes past 40% width or on a flick faster than 0.6 px/ms. No edge-swipe-open. Back button closes the drawer through a pushState entry (AppShell.tsx:565-589).
- Mode carousel horizontal swipe (ModeCarousel.tsx:144-193), touch and pen only.
- Curtain finger-light on the landing page (CurtainShimmer.tsx:219-222).
- No pull-to-refresh, long-press or pinch anywhere.


### 7.2 Design system (Tailwind v4 tokens, colours, typography, dark mode, motion)

#### Tailwind setup
- Tailwind v4 has no `tailwind.config.*`. postcss.config.mjs contains only `"@tailwindcss/postcss": {}`.
- app/globals.css:1 has `@import "tailwindcss"`. Tokens are bridged through `@theme inline { ... }` (globals.css:380-450), which maps CSS variables to Tailwind colour names.

Tailwind colour utilities (`@theme inline`, globals.css:381-415):

| Tailwind name | CSS var |
|---|---|
| `canvas` | `--canvas` |
| `surface` | `--surface` |
| `surface-muted` | `--surface-muted` |
| `surface-hover` | `--surface-hover` |
| `surface-sunken` | `--surface-sunken` |
| `bubble-mine` | `--bubble-mine` |
| `surface-raised` | `--surface-raised` |
| `hairline` / `hairline-strong` | `--border` / `--border-strong` |
| `ink` / `ink-secondary` / `ink-muted` / `ink-inverse` | `--text` / `--text-secondary` / `--text-muted` / `--text-inverse` |
| `brand` / `brand-dark` / `brand-soft` / `brand-border` | `--brand` ... |
| `band-moderate`, `band-high(-bg,-border)`, `band-mid(-bg,-border)`, `band-low(-bg,-border)` | confidence bands |
| `caution`, `caution-bg`, `caution-border` | bias callouts |

Fonts: `--font-sans: var(--font-outfit)`, `--font-mono: var(--font-geist-mono)` (globals.css:420-421).

Type scale (globals.css:442-449). These **override Tailwind defaults**:

| Class | Size |
|---|---|
| `text-xs` | 12px |
| `text-sm` | 16px |
| `text-base` | 16px |
| `text-lg` | 20px |
| `text-xl` | 20px |
| `text-2xl` | 24px |
| `text-3xl` | 28px |
| `text-4xl` | 32px |

All of these are then multiplied by the root zoom of 0.85 (desktop) or 0.92 (touch phone). Line heights are Tailwind's ratios.

#### Colour tokens (all values)

**Default / Burgundy, light** (`:root`, globals.css:55-124):

| Var | Value |
|---|---|
| --canvas | #f5f3f4 |
| --surface | #ffffff |
| --surface-muted | #faf8f9 |
| --surface-hover | rgba(77,67,57,0.05) |
| --surface-sunken | #f5f3f4 |
| --bubble-mine | #edeaeb |
| --surface-raised | #ffffff |
| --border | #f2f0ed |
| --border-strong | #e8e3e7 |
| --text | #3d2a2f |
| --text-secondary | #6b5c60 |
| --text-muted | #9e8e93 (phone: #776b6f) |
| --text-inverse | #ffffff |
| --text-nav | #5f5551 |
| --text-nav-strong | #4d4339 |
| --text-nav-muted | #8b7b73 |
| --brand | #6b2d5c |
| --brand-dark | #5a2550 |
| --brand-soft | #f7f1f6 |
| --brand-border | #e3cfdd |
| --band-moderate | #5f8b21 |
| --band-high / -bg / -border | #248a3d / #f1f9f3 / #c2e5cd |
| --band-mid / -bg / -border | #c04c00 / #fff8f0 / #fbd9b5 |
| --band-low / -bg / -border | #d70015 / #fff2f2 / #f8cbcb |
| --caution / -bg / -border | #b25000 / #fff8f1 / #f7d6b3 |
| --focus-ring | #6b2d5c |
| --avatar-skin-lit / skin / skin-shade | #ffffff / #dfeaf7 / #b4cbe3 |
| --avatar-body-lit | #4a9eea |
| --avatar-face | #1d2b3a |
| --avatar-blush | #f0a8b8 |
| --avatar-shadow | rgb(0 0 0 / 0.12) |
| --sidebar-width | 287px |
| --topbar-height | 67px |
| --card-mark | var(--brand) (globals.css:747-749) |

**Default / Burgundy, dark** (`[data-theme="dark"]`, globals.css:145-225):

| Var | Value |
|---|---|
| --canvas | #131011 |
| --surface | #1c1819 |
| --surface-muted | #0d0b0b |
| --surface-hover | #292325 |
| --surface-sunken | #0d0b0b |
| --bubble-mine | #2d2628 |
| --surface-raised | #231e1f |
| --border / --border-strong | #332b2d / #453a3d |
| --text | #f5f0f2 |
| --text-secondary | #b6a5aa |
| --text-muted | #8e8084 (phone: #928488) |
| --text-inverse | #ffffff |
| --text-nav / -strong / -muted | #beafb3 / #ded3d6 / #8e8084 |
| --brand / -dark / -soft / -border | #c86ab1 / #d982c4 / #2b1525 / #582f4e |
| --band-moderate | #9be34f |
| --band-high / -bg / -border | #30d158 / #0a1f10 / #1c4527 |
| --band-mid / -bg / -border | #ff9f0a / #241705 / #4d360b |
| --band-low / -bg / -border | #ff453a / #260d0c / #55201d |
| --caution / -bg / -border | #ff9f0a / #241705 / #4d360b |
| --focus-ring | #c86ab1 |
| --avatar-skin-lit / skin / shade | #f0f5fb / #c8dcf0 / #93b4d4 |
| --avatar-body-lit | #5aa9f8 |
| --avatar-face | #16212e |
| --avatar-blush | #e58aa8 |
| --avatar-shadow | rgb(255 255 255 / 0.10) |

Note: `theme-color` and the manifest use `#121013` for dark, but the burgundy dark `--canvas` is `#131011`. `#121013` is actually Plum's dark canvas, so there is a slight mismatch.

**Accent overrides.** Only the vars listed below change. Bands, caution and avatar tokens are inherited from burgundy.

| Var | Indigo light | Indigo dark | Teal light | Teal dark | Plum Velvet light | Plum Velvet dark |
|---|---|---|---|---|---|---|
| --canvas | #f3f3f5 | #101113 | #f3f5f5 | #101313 | #f5f3f4 | #121013 |
| --surface | (inherit #fff) | #18191c | (inherit) | #181c1c | (inherit) | #1a181c |
| --surface-muted | #f5f6fb | #0b0b0d | #f8fcfc | #0b0d0d | #f9f7fc | #0c0b0d |
| --surface-sunken | #f3f3f5 | #0b0b0d | #f3f5f5 | #0b0d0d | #f5f3f4 | #0c0b0d |
| --surface-hover | rgba(70,57,77,.05) | #232429 | rgba(57,62,77,.05) | #232929 | rgba(77,57,72,.05) | #262329 |
| --surface-raised | (inherit) | #1e1f23 | (inherit) | #1e2323 | (inherit) | #211e23 |
| --bubble-mine | #eaebed | #26272d | #eaeded | #262d2d | #ebeaed | #2a262d |
| --border | #f1edf2 | #2b2c33 | #edeef2 | #2b3333 | #f2edf0 | #2f2b33 |
| --border-strong | #e3e6e8 | #3a3c45 | #e3e8e5 | #3a4545 | #e3e3e8 | #403a45 |
| --text | #2f334c | #f0f1f5 | #1a3434 | #f0f5f5 | #2f1f3f | #f3f0f5 |
| --text-secondary | #5f6582 | #a5a7b6 | #4a6b6a | #a5b6b6 | #6b5a7b | #ada5b6 |
| --text-muted | #8b8fa6 (phone #6a6d7f) | #80828e (phone #858793) | #7b9898 (phone #5d7373) | #808e8e (phone #859393) | #9d8ba6 (phone #77697d) | #87808e (phone #908a96) |
| --text-nav | #57515f | #afb1be | #51575f | #afbebe | #5f515e | #b6afbe |
| --text-nav-strong | #46394d | #d3d5de | #393e4d | #d3dede | #4d3948 | #d9d3de |
| --text-nav-muted | #7e738b | #80828e | #737d8b | #808e8e | #8b7389 | #87808e |
| --brand | #2d3561 | #6a79c8 | #0d7c7b | #6ac8c7 | #4b2f64 | #9c6ac8 |
| --brand-dark | #25305a | #828fd9 | #255a57 | #82d9d8 | #3e255a | #b082d9 |
| --brand-soft | #f1f2f7 | #15182b | #f1f7f6 | #152b2b | #f4f1f7 | #20152b |
| --brand-border | #cfd1e3 | #2f3658 | #cfe2e3 | #2f5857 | #dbcfe3 | #452f58 |
| --focus-ring | #2d3561 | #6a79c8 | #0d7c7b | #6ac8c7 | #4b2f64 | #9c6ac8 |
| --card-mark | var(--brand) | var(--brand) | var(--brand) | var(--brand) | **#5d3a7a** | var(--brand) |

Sources: Indigo globals.css:249-290, Teal 293-334, Plum 337-378, phone muted 468-478, card-mark 747-752.

Picker swatches (lib/theme.tsx:21-26): Burgundy `#6b2d5c`, Indigo `#2d3561`, Teal `#0d7c7b`, Plum Velvet `#4b2f64`. Burgundy is the default and means "no `data-accent` attribute".

**Hard-coded colours outside the tokens:**
- components/marketing/CurtainShimmer.tsx:45-46: `#a72341`, `#d74564` (curtain pleats).
- components/marketing/GuestDemo.tsx:70, 786, 801, 825: `#1a0710`, `#ff9db4`.
- components/admin/Charts.tsx:11-20 palette: `var(--brand)`, then Apple system colours `#34c759 #ff9f0a #af52de #5ac8fa #ff375f #ffd60a #64d2ff`.
- components/avatar/AvatarPanel.tsx:248-288: white highlights.
- globals.css:731-732: landing card hover `#d9cfd6` and shadow `rgba(107,45,92,.45)`.

#### Typography
- Fonts come from `next/font/google` (app/layout.tsx:2, 24-41):
  - **Outfit**, weights 400/500/600, latin, `--font-outfit`. This is the **app-wide sans** (globals.css:420) and is also set explicitly on the landing page (LandingPage.tsx:272).
  - **Geist** (sans), latin, `--font-geist-sans`. It is loaded but **unused**: `--font-sans` points at Outfit, and nothing references `--font-geist-sans`.
  - **Geist Mono**, latin, `--font-geist-mono`, used for `font-mono` in code spans (lib/markdown.tsx:45, ErrorBoundaries.tsx:159).
- Body fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif` (globals.css:545-546).
- **Native:** bundle Outfit-Regular, Medium and SemiBold TTFs (and GeistMono) through `expo-font` or `@expo-google-fonts/outfit`. RN needs a separate family name per weight on Android.

#### Spacing, radius and elevation conventions
- Spacing uses the default Tailwind 4px scale. Layout constants are `--sidebar-width` 287px and `--topbar-height` 67px. The composer max width is 925px (ChatView.tsx:1313 `max-w-[925px]`).
- Radius usage counts across app/, components/ and lib/: `rounded-full` 62, `rounded-lg` 48, `rounded-md` 47, `rounded-xl` 33, `rounded` 19, `rounded-[12px]` 12, `rounded-[34px]` 8, `rounded-[8px]` 6, `rounded-2xl` 6, `rounded-[9px]` 3. Landing-only fractional values appear too: 13.185, 10.83, 7.22, 19.855, 18.05, 14.44, 37, 20 px. Gist card radius is 14/13px (globals.css:1137, 1153).
- Primitives (components/ui/primitives.tsx):
  - `Card`, `CardHeader`, `Button`, `Input`, `Textarea`, `Field`, `Badge`, `PageHeader`, `EmptyState`, `Spinner`.
  - Button variants `primary` (bg-brand, white text, hover brand-dark), `secondary` (surface + hairline-strong), `ghost`, `danger` (band-low).
  - Button sizes `sm` h-8 px-2.5 text-xs and `md` h-9 px-3.5 text-sm, with `rounded-lg` (primitives.tsx:58-76).
  - Fields: `rounded-lg border-hairline-strong bg-surface px-3 text-sm`, hover `brand-border`, focus `brand`.
- Shadows: `shadow` 21, `shadow-lg` 11, `shadow-xl` 3, `shadow-2xl` 3, `shadow-sm` 2, plus two multi-layer landing shadows. Gist-card glow uses `color-mix` (globals.css:1145-1147).
- Focus ring: `outline 2px solid var(--focus-ring); offset 2px; radius 4px` (globals.css:801-805). The composer and `data-field="bare"` inputs are exempt (816-827).

#### Breakpoints actually used
- Tailwind default prefixes (counts in app/, components/, lib/): `sm:` 92, `md:` about 0-1, `lg:` 18, `xl:` 10 (LandingPage, ProfileView, SettingsView, DocumentUploader, WorkspaceDetail, WorkspaceDocuments, WorkspaceList), `2xl:` 0.
- `max-sm:` and `max-lg:` together: 42 uses in AdminDashboard (2), ChatView (6), MessageInput (13), MessageList (2), VendorModelPicker (2), LandingPage (13), AppShell (4).
- Arbitrary variants: `max-[359px]:` (FeedbackWidget.tsx:77, AppShell.tsx:935), `[@media(min-height:600px)]:` (LiveCallOverlay.tsx:138, 143), `phone-touch:` (7 uses).
- Custom CSS media queries: `max-width:1023.98px` (phone layout), `max-width:639.98px` (bottom safe area), `min-width:640px` (carousel peek, globals.css:1113), `min-width:1024px` (scrollbars), `max-height:500px` (landscape), `pointer: coarse|fine|none`, `hover: none`, `prefers-reduced-motion`, `prefers-color-scheme`, `display-mode: standalone`, `@container (max-height:260px)`.
- **For native:** in practice there is a single phone layout (below 1024px). Tablets probably need the desktop sidebar layout (`lg`), which needs a decision. **ASSUMPTION:** start phone-only and lock to portrait, or use the same 1024dp rule.

#### Dark mode mechanism
- Attribute-based: `<html data-theme="light|dark">` plus `style.colorScheme`, set by the inline `THEME_INIT_SCRIPT` before paint (lib/theme.tsx:34-54; app/layout.tsx:108). `suppressHydrationWarning` sits on `<html>` (layout.tsx:104).
- Resolution order: stored `clardentity-theme`, then `prefers-color-scheme`. While nothing is stored, the app follows OS changes live (lib/theme.tsx:188-196).
- The accent is `data-accent` on `<html>`. It is absent for burgundy, and is suppressed on `/` for signed-out visitors (lib/theme.tsx:44-50, 97-119).
- `[data-theme="dark"]` matches **any element**, so a subtree can be dark. The landing GuestDemo uses this (globals.css:139-146).
- `.theme-when-dark` / `.theme-when-light` toggle icons with no flash (globals.css:922-930).
- Accent and dark specificity are handled with `:not([data-theme="dark"])` (globals.css:243-245).

#### Animations and keyframes (complete)

| Name | Where | What |
|---|---|---|
| `.landing-reveal` transition (0.7s; 1.6s on phone) | globals.css:563-589 | Scroll reveal: fade plus translateY 28/36px |
| `phone-rise` | globals.css:702-717 | Phone list stagger: fade plus 16px rise, 0.85s, 120ms steps |
| `.landing-card:hover` transition | globals.css:722-742 | Card lift of 6px plus shadow |
| `landing-caret-blink` | globals.css:760-782 | Typing caret |
| `account-menu-in` | globals.css:834-848 | Menu pops from the bottom-left, 140ms |
| `fade-in` | globals.css:858-865; used via `animate-[fade-in_0.15s..0.4s_ease]` about 11 times | Generic fade |
| `mode-marquee` (48s linear infinite, pauses on hover/focus) | globals.css:871-893 | Landing mode-card strip |
| `.mode-flip-card` scaleX squash 0.2s | globals.css:903-909 | 2D "flip" |
| `avatar-breathe` 3.2s | globals.css:980, 1045 | Avatar idle |
| `avatar-blink` 4.5s | globals.css:990, 1057 | Eyes |
| `avatar-talk` 0.32s alternate | globals.css:1001, 1062 | Mouth |
| `avatar-scale-wobble` 1.4s / 0.5s wave | globals.css:1011, 1067-1081 | Scales and wave gestures |
| `avatar-antenna-pulse` 1.6s (animates SVG `r`) | globals.css:1021, 1053 | Antenna |
| `avatar-react-pulse` 0.7s | globals.css:1033, 1083 | Reaction |
| `gist-sheen` 1.5s once | globals.css:1161-1179 | Gist card shine |
| `rabbit-bob`, `rabbit-ear` 1.8s | globals.css:1186-1222 | "Thinking" rabbit |
| `mode-switch-countdown` | globals.css:1235; inline at ModeSwitchToast.tsx:73 | SVG ring countdown (stroke-dashoffset 56.55) |
| Tailwind `animate-spin` (2), `animate-pulse` (3), `animate-ping` (1) | various | Spinners and dots |
| JS rAF animations | CurtainShimmer, liveCall mouth, Reveal, TourOverlay, GuestDemo grow | see section 1 |

Every one of these is disabled under `prefers-reduced-motion: reduce` (globals.css:784-798, 850-854, 911-918, 1088-1099, 1224-1231). **Native:** Reanimated. The avatar SVG animations need react-native-svg with Reanimated `useAnimatedProps`, or a Lottie/Rive re-export.

#### The root zoom approach (porting implication)
- The design was drawn at 1728px. CSS `zoom` on `:root` scales everything to 0.85 (desktop) or 0.92 (touch phone).
- Consequences in code:
  - `--app-vh` divides vh by the zoom.
  - Safe-area and 44px tap targets are divided by the zoom.
  - `lib/uiScale.ts` measures how `getBoundingClientRect` relates to style pixels, because iOS WebKit and Chromium differ, and `toLayoutRect`/`rectScale` convert between them. These are used by CitationPopover, TourOverlay and the AppShell drawer swipe.
- **Native port:** pre-multiply every design number by 0.92 (phone) in the token layer. A 16px `text-sm` becomes 14.7dp, 20px becomes 18.4dp, and the 67px topbar becomes about 61.6dp. The other option is to keep design numbers and apply a `scale()` helper. Never scale the whole root view. The text-xs floor is effectively 12.5dp. **ASSUMPTION:** the designers will want phone sizes re-specified in dp rather than inherited from a zoomed desktop frame.


### 7.3 Web-only UI patterns that need mobile-native equivalents

| Pattern | Where | Native equivalent |
|---|---|---|
| **Hover styling** (`hover:` / `group-hover:`, about 160 uses in 58 files; heaviest in AppShell 14, GuestDemo 10, MessageInput 9, LandingPage 7, ChatRowMenu 7) | everywhere | Pressable `pressed` state / Android ripple. Most are cosmetic. |
| **Hover-only revealed controls** | MessageList.tsx:1207-1213: own-message action row (Copy, Edit, Delete) is `opacity-0` until `group-hover/msg` or focus-within, so **it is effectively hidden on touch**. Assistant row is at opacity-45. DocumentUploader.tsx:205: delete button is `opacity-0 group-hover/tile` but `phone-touch:opacity-100` (fixed). GuidanceCard.tsx:35: `opacity-55 hover:opacity-100`. PlanTiers.tsx:110-116: `onMouseEnter` highlight. | Long-press context menu (`react-native-context-menu-view` / `zeego`) or always-visible actions. |
| **Hover gestures** | Landing curtain hover light (CurtainShimmer); `.mode-marquee-track:hover` pause; `.landing-card:hover` lift | Touch already has fallbacks (auto wave, `:active`). |
| **title= tooltips** (native DOM `title`) | ChatRowMenu.tsx:162; ChatView.tsx:1292; CitationPopover.tsx:224; ConfidenceBadge.tsx:91; FeedbackWidget.tsx:83, 99; GeneratedImageCard.tsx:40; MessageInput.tsx:390, 448, 472, 498, 520; MessageList.tsx:1218, 1230, 1245, 1275; ModeCarousel.tsx:65; ResponseFlip.tsx:195; VendorModelPicker.tsx:86; GuestDemo.tsx:666, 870; AspectList.tsx:117; ProfileView.tsx:182; ProfileSection.tsx:73; AccountMenu.tsx:147; AppShell.tsx:205, 801, 896, 915, 933; ThemeToggle.tsx:19; WorkspaceDetail.tsx:234. (`title=` in (legal)/*, Admin*, SettingsView and ProfileView:219-263 are **component props**, not tooltips.) | `accessibilityLabel` / `accessibilityHint`. Long-press tooltip if needed. Most already have `aria-label`. |
| **Right-click / context menus** | None (`onContextMenu` is not used). ChatRowMenu is a click-triggered kebab menu. | Action sheet / native context menu. |
| **confirm / alert / prompt** | **None.** Deletion uses inline confirm state (e.g. MessageList.tsx:1182 `confirmingDelete`, autoFocus + onBlur cancel). Line InstallAppButton.tsx:82 is `BeforeInstallPromptEvent.prompt()`, not `window.prompt`. | `Alert.alert` for destructive confirms would be idiomatic. |
| **Drag-and-drop upload** | **None** (no onDrop/dataTransfer). | N/A |
| **Keyboard shortcuts** | Enter-to-send / Shift+Enter (MessageInput.tsx:309, desktop only). Shift accepts ghost suggestion, Escape drops it, Backspace undoes autocorrect (MessageInput.tsx:316-332). Escape stops streaming (ChatView.tsx:767). Escape closes dialogs and menus (ChatRowMenu:109, ConfidenceBadge:64, LiveCallOverlay:90, UpgradeDialog:128, VendorModelPicker:52, AccountMenu:82, AppShell:293/598, TourOverlay:212, GuestDemo:524, WorkspaceList:168, CompanionNames:89, FeedbackWidget:135, MessageList:956). Enter submits inline editors (ContextQuestionCard:45, FeedbackWidget:131, MessageList:960, CompanionNames:85). Digits 1-9 pick clarifier options (ClarifierCard.tsx:31-50). Arrow keys move the mode carousel (ModeCarousel.tsx:127-128). | `onSubmitEditing` / `returnKeyType`. Android `BackHandler` for Escape semantics. Hardware-keyboard shortcuts are optional (iPad). |
| **Focus traps / focus management** | Drawer Tab-cycling trap (AppShell.tsx:591-626). Tour panel focus (TourOverlay.tsx:202). Upgrade dialog close focus (UpgradeDialog.tsx:133). autoFocus inputs. | `Modal` + `accessibilityViewIsModal`; `AccessibilityInfo.setAccessibilityFocus`. |
| **Scroll-snap carousels** | **None** (no `snap-*`). The mode carousel is transform-based (`.carousel-track` `--track-step` 100% / 78% on sm+, globals.css:1108-1126). Landing marquee is a CSS animation. | PagerView / reanimated-carousel; an auto-scrolling FlatList for the marquee. |
| **position: fixed overlays** | LiveCallOverlay.tsx:107 (full screen z-50); UpgradeDialog.tsx:144 (+ `backdrop-blur-sm` :150); GuestDemo.tsx:631 (expanding modal); AppNotices.tsx:31 (toasts z-40); AppShell.tsx:777 (desktop sidebar), :814 (phone drawer + backdrop z-40); ConsentBanner.tsx:34 (bottom banner); ErrorBoundaries.tsx:122-132 (bottom sheet via portal); OfflineNotice.tsx:16 and ServerWakingNotice.tsx:15 (pills under the topbar); TourOverlay.tsx:228, 273; CitationPopover.tsx:247 (portal). (legal)/layout.tsx:12 sticky header with `backdrop-blur`. | `Modal`, `@gorhom/bottom-sheet`, a toast library (burnt / sonner-native), `expo-blur` BlurView. |
| **Custom scrollbars** | `.scroll-slim` (globals.css:936-948; 6 files). Desktop/fine pointer only. | Not needed. `showsVerticalScrollIndicator`. |
| **Masks / blend modes** | Landing curtain: CSS `mask-image` radial-gradient plus `mix-blend-mode: screen` on about 51 pleats (CurtainShimmer.tsx:258-272). Edge fades `.scroll-fade-x/y` with linear-gradient masks (globals.css:953-975). Carousel viewport edge mask on sm+ (globals.css:1122-1125). MaskIcon: SVG files used as a CSS `mask` coloured with `currentColor` (components/ui/MaskIcon.tsx:32-45; used for every `/ui/*.svg` and `/landing/*.svg` mark). Blur filter on inactive carousel tracks (ModeCarousel.tsx:279). | Skia for the curtain. MaskedView + LinearGradient for fades. **MaskIcon -> import the SVGs as components through `react-native-svg-transformer` and set `fill`/`color`** (most `/ui` SVGs have hard-coded fills such as #5F5551 that need replacing with `currentColor`). |
| **SVG charts** | components/admin/Charts.tsx: hand-made SVG `DonutChart`, `BarChart` (divs), `LineChart` (path). Admin only. | react-native-svg (direct port) or victory-native. **ASSUMPTION:** admin is probably not ported to mobile. |
| **Other inline SVG** | Inline SVG icons in about 38 components (AccountMenu 5, MessageList 5, ChatRowMenu 5, GuestDemo 4, MessageInput 4, ...). AvatarPanel animated companion. CardEmboss landing marks. DecisionReview. ThinkingIndicator rabbit. ModeSwitchToast countdown ring. | react-native-svg. Consider an icon set (lucide-react-native) for generic icons. |
| **Canvas** | None. (The CSP comment at next.config.ts mentions a composer thumbnail canvas, but no `<canvas>`/`getContext` exists. **ASSUMPTION:** that comment is stale.) | N/A |
| **contenteditable** | None. Composer is a `<textarea>` with a ghost-text overlay. | TextInput multiline. Ghost/autocomplete overlay probably dropped. |
| **select / dropdown menus** | Native `<select>` in AdminSettings.tsx:248 and AspectList.tsx:150. Custom dropdowns: ChatRowMenu, VendorModelPicker, AccountMenu, AppShell workspace switcher, ExportFileMenu, ConfidenceBadge popover. | `@react-native-picker/picker` / ActionSheetIOS / zeego dropdown menus. |
| **File inputs** | MessageInput.tsx:456 (image/* + docs; 5MB image / 25MB doc limits at :38-39); DocumentUploader.tsx:154; ImportHistory.tsx:87 (JSON) | expo-image-picker (+camera), expo-document-picker |
| **Copy to clipboard** | MessageList.tsx:1192; ErrorBoundaries.tsx:166 | expo-clipboard |
| **New tabs / external links** | `target="_blank"`: register/page.tsx:113, 117 (Terms, Privacy); CitationPopover.tsx:254; SourcesFooter.tsx:108; GeneratedImageCard.tsx:27 (opens the image). `mailto:` in privacy/terms (privacy:40, 177; terms:59, 152). No `window.open`. | expo-web-browser for sources and legal; `Linking.openURL('mailto:')`; an image viewer (react-native-image-viewing) for generated images. |
| **File download** | ExportFileMenu.tsx:53-65 (blob + `a.download`) | expo-file-system + expo-sharing |
| **Print** | None. | N/A |
| **History / back semantics** | Drawer pushState (AppShell.tsx:565-589). `router.replace` after auth. | react-navigation stack/drawer; BackHandler. |
| **Text selection management** | `window.getSelection().removeAllRanges()` (ModeCarousel.tsx:174), `select-none` (ModeCarousel.tsx:238, AppShell.tsx:838) | `selectable` prop on Text (off by default in RN; turn it on for answers so users can copy). |
| **Google Sign-In (GIS iframe/popup)** | GoogleSignInButton.tsx; COOP `same-origin-allow-popups` in next.config.ts | Native Google Sign-In, plus **Sign in with Apple** (required on iOS when Google is offered). |
| **PWA install** | InstallAppButton.tsx | Remove. |
| **Cookie/consent banner** | ConsentBanner.tsx:34 | A native consent screen on first launch. Map it to the App Store privacy nutrition label and Play Data Safety. |


### 7.4 Porting hotspots, ranked

1. **Auth tokens in localStorage** need to move to Keychain/Keystore. Google GIS has to be replaced by native Google Sign-In, and Sign in with Apple must be added.
2. **Streaming chat** relies on `fetch` with a `ReadableStream`, which RN fetch does not support. Use `expo/fetch` or react-native-sse.
3. **Live voice call** uses WebRTC, Web Audio and getUserMedia. It needs react-native-webrtc (dev client), audio session management and a lip-sync substitute.
4. **Voice recording** produces `audio/webm` from MediaRecorder. Native produces m4a, so the backend's accepted formats must be checked.
5. **TTS playback and export download** use blob/object URLs. Replace with expo-file-system plus expo-audio and expo-sharing.
6. **Root CSS zoom of 0.85/0.92** must be baked into the dp tokens. `lib/uiScale.ts` and all measure-then-position code (tour, citation popover, drawer) get rewritten.
7. **MaskIcon (CSS mask SVG icons)** becomes SVG components with `currentColor`.
8. **The landing page curtain** (mask plus mix-blend plus rAF) is either rebuilt in Skia or replaced with static onboarding.
9. **Hover-only own-message actions** (MessageList.tsx:1213) are invisible on touch today. Use long-press menus natively.
10. **Store assets** are missing: 1024 icon, adaptive icon layers, splash and feature graphic.

### 7.5 Static asset inventory

#### frontend/public (root)

| File | Format | Size | Dimensions | Referenced? |
|---|---|---|---|---|
| apple-touch-icon.png | PNG | 3.6 KB | 180x180 | yes (layout.tsx:59) |
| favicon-32.png | PNG | 696 B | 32x32 | yes |
| icon-192.png | PNG | 4.0 KB | 192x192 | yes (manifest, sw precache) |
| icon-512.png | PNG | 15.0 KB | 512x512 | yes (manifest, sw precache) |
| icon-maskable-512.png | PNG | 12.9 KB | 512x512 (maskable) | yes (manifest) |
| icon.svg | SVG | 1.9 KB | 33.08x32 viewBox; transparent; colour-scheme aware mark | yes (layout.tsx:56) |
| sw.js | JS | 4.8 KB | n/a | yes |
| file.svg, globe.svg, next.svg, vercel.svg, window.svg | SVG | 0.1-1.3 KB | Next.js boilerplate | **unused (dead)** |

#### frontend/public/landing (marketing page)

| File | Size | Notes |
|---|---|---|
| curtain-stage.webp | 37.8 KB | WebP 1909x824. Hero stage photo of burgundy curtain. Used at LandingPage.tsx:353 (next/image, priority, inline base64 blur placeholder) and GuestDemo.tsx:637 |
| arrow-up.svg / arrow-up-right.svg | 1.3 KB / 981 B | Send arrows |
| icon-card-{cocreative,decision,finder,learning,legal,mentoring,reflect,thought}.svg | 1.2-4.9 KB each (8 files) | Mode card icons (dark-on-light) |
| icon-hero-{cocreative,decision,finder,learning,legal,mentoring,reflect,thought}.svg | 1.4-5.2 KB each (8 files) | White-on-dark variants for the hero composer |
| logo-dots.svg | 1.3 KB | Wordmark dots (referenced) |
| logo-dots-audit.svg, logo-dots-footer.svg, logo-dots-plum.svg, logo-dots-steps.svg | about 1.2-1.3 KB each | **No reference found by filename** (likely unused variants) |

#### frontend/public/ui (app chrome icons; rendered through MaskIcon as CSS masks)

| File | Size | Referenced? |
|---|---|---|
| composer-dialpad.svg | 4.7 KB | yes |
| composer-paperclip.svg | 2.5 KB | yes |
| composer-mic.svg | 1.8 KB | **no** |
| dot.svg | 1.1 KB | yes |
| logo-dots.svg | 1.3 KB | yes (same basename as the landing copy) |
| mode-{cocreative,decision,finder,learning,legal,mentoring,reflect,thought}.svg | 1.4-5.2 KB each (8) | yes |
| nav-attachments.svg 2.5 KB, nav-folder.svg 1.1 KB, nav-newchat.svg 1.9 KB, nav-search.svg 1.5 KB | | yes |
| nav-caret.svg 1.0 KB, nav-sidebar.svg 683 B | | **no** |
| recent-dot.svg | 1.1 KB | yes |

The Figma-exported SVGs carry baked-in fill colours such as #5F5551 and #6B5C60 (MaskIcon.tsx:5-9), which is why they are used as masks.

#### frontend/public/dict (autocorrect)

| File | Size |
|---|---|
| en-us.dic | 587.2 KB |
| en-gb.dic | 587.6 KB |
| en-us.aff, en-gb.aff | 3.2 KB each |
| en-common.txt | 83.9 KB |
| LICENSE-en-us.txt, LICENSE-en-gb.txt | 15.7 KB each |
| SOURCES.txt | 249 B |

Not needed natively, since the OS keyboard autocorrects. Check the licence terms if they are bundled anyway.

#### frontend/app (file-convention assets)

| File | Notes |
|---|---|
| favicon.ico | 7.2 KB; ICO with 16x16 and 48x48 images |
| opengraph-image.png | 26.9 KB, 1200x630 |
| twitter-image.png | 26.9 KB, 1200x630 (identical size to OG; **ASSUMPTION:** same image) |
| manifest.ts | Generated `/manifest.webmanifest` |

#### Fonts
- No font files in the repo. Outfit (400/500/600), Geist and Geist Mono are fetched at build time by `next/font/google` and self-hosted in `/_next/static/media`.
- A native app needs TTF/OTF files added: Outfit Regular, Medium and SemiBold (OFL licence), and Geist Mono if code spans are kept.

#### Repo-level Card_design/ (`D:\Projects\clardentity-mvp-mv\Card_design`)
- 48 SVG files: 12 concepts x 4 colour themes, each `viewBox="0 0 100 100"`. Files are 411 B-3.7 KB and identical in size across themes. Only the stroke colour differs.
- Concepts: Ask, Check, See (landing "Ask./Check./See." steps), Co-Creative, Decision-making, Finder, **Healthcare**, Learning, Legal, Mentoring, Reflect-and-Relieve, Thought-Coach.
- Theme suffix to colour: `1` = default/burgundy `#6B2D5C`, `2` = teal `#0D7C7B`, `3` = indigo `#2D3561`, `4` = plum velvet `#5D3A7A` (matches `--card-mark`, globals.css:744-752).
- The frontend does **not** load these files. The shapes are re-drawn in code in components/marketing/CardEmboss.tsx (stroke `var(--card-mark)`), so they are source design references.
- "Healthcare" has no matching mode in `public/ui` or `public/landing`. **ASSUMPTION:** it is a planned mode.
- For native these work as single-colour assets with `currentColor`, so one SVG per concept is enough.

#### Icon and splash coverage vs store requirements

| Need | Exists? | Gap |
|---|---|---|
| iOS App Store icon 1024x1024 PNG, no alpha, no rounded corners | **No** (largest is 512) | Create a 1024 master from icon.svg (the vector exists) |
| iOS app icon set (180, 167, 152, 120, 87, 80, 60, 58, 40, 29, 20 @1x/2x/3x) | Only 180 (apple-touch-icon) | Expo generates these from a single 1024 `icon` |
| Android adaptive icon: foreground 432x432 (108dp, 66dp safe zone) plus background colour/layer, and a monochrome layer (Android 13 themed icons) | Only `icon-maskable-512.png` (a flattened, not layered, maskable PNG) | Export a transparent foreground and a separate background (#121013 or brand) plus a monochrome glyph from icon.svg |
| Android legacy mipmaps (48/72/96/144/192) | 192 only | Generated by Expo/Android Studio from the 1024 or 512 master |
| Google Play hi-res icon 512x512 (32-bit PNG) | Yes (icon-512.png, **ASSUMPTION:** usable as is) | Verify there is no transparency issue |
| Play feature graphic 1024x500 | **No** | Create one (OG image 1200x630 is a starting point) |
| Splash screen (iOS LaunchScreen / Android 12 SplashScreen API: icon 288dp in a 192dp circle with background colour) | **No** (no apple-touch-startup-image; manifest only gives `background_color #121013`) | expo-splash-screen: logo PNG (at least 1024 transparent) plus light #f5f3f4 / dark #121013 backgrounds |
| Notification icon (Android, white silhouette 96x96) | No | Needed if push is added |
| Store screenshots (iPhone 6.9"/6.5", iPad 13" if supporting tablets; Play phone/tablet) | No (Playwright visual snapshots exist under e2e/visual.spec.ts-snapshots but are test artefacts) | Produce them |


### 7.6 Test coverage note

- Playwright projects (playwright.config.ts:60-79): `setup`, `web` (Desktop Chrome), `mobile-chrome` (Pixel 7 at 375x812, touch), `mobile-safari` (iPhone 14 at 375x812, touch), `live` (Pixel 7 against the deployed URL).
- Spec files and test counts:
  - mobile-extras.spec.ts (30)
  - mobile.spec.ts (19), covering M01 viewport, M02 44px targets, M03 drawer focus trap and Back, M04 login, M05 workspace cards, and more
  - web.spec.ts (11)
  - gates.spec.ts (9)
  - screens.spec.ts (9)
  - live.spec.ts (8)
  - chat.spec.ts (6)
  - visual.spec.ts (6, with snapshots)
  - a11y.spec.ts (3, axe-core)
  - offline.spec.ts (2)
  - devices.spec.ts (1)
- Fixtures include a demo API mock (`e2e/demo-api.mjs`).
- The mobile behaviour these tests encode (safe areas, tap targets, drawer, offline draft, keyboard) is effectively the acceptance spec for the native port. They do not carry over: a native app needs Detox or Maestro.



---

## 8. Mobile Conversion Strategy Recommendation

### 8.1 Facts that decide this

| Fact | Evidence | Why it matters |
|---|---|---|
| All business logic is client-side TypeScript, about 22.5k lines | section 2. Largest files: `components/chat/ChatView.tsx` (1533 lines), `MessageList.tsx` (1335), `AppShell.tsx` (1067), `GuestDemo.tsx` (984) | Any option that keeps TypeScript keeps this logic. A Flutter or Swift/Kotlin rewrite re-implements it |
| No SSR data, no middleware, no route handlers, no server actions | section 2.2 / 3.2 | The app can run as a static or client bundle inside a WebView |
| Bearer JWT, no cookies, no CSRF | `backend/app/api/deps.py:12-42` | Works the same from native code or from a WebView. No cookie bridging needed |
| The phone layout is already built and heavily tested | `Better_docs/Mv.md`; `frontend/e2e/*.spec.ts` (600+ tests across Chromium and WebKit, including `devices.spec.ts` with 17 screens × 13 device sizes) | A wrapper ships that work as-is. A native rewrite starts from zero on UI |
| The UI depends on browser-only rendering | Root CSS `zoom` (`app/globals.css`), CSS-mask icons (`MaskIcon`), the landing curtain's mix-blend and masks, `dvh` and safe-area CSS (section 7) | Free in a WebView. Has to be rebuilt in React Native, Flutter or native |
| Streaming answers over a POST body | `lib/sse.ts:369` | WKWebView and Android WebView support this. React Native needs `expo/fetch` streaming or a custom native module |
| WebRTC to OpenAI Realtime, plus MediaRecorder | `lib/liveCall.ts`, `components/upload/AudioRecorder.tsx` | WKWebView has had `getUserMedia` and WebRTC since iOS 14.3. **ASSUMPTION:** MediaRecorder in WKWebView emits `audio/mp4`, not webm, so the forced `recording.webm` filename must change or the backend must sniff the format. React Native needs `react-native-webrtc` and a dev client |
| Missing native capabilities | no push, no Apple sign-in, no device tokens, tokens in localStorage (section 3) | Every option needs these backend and native additions |

### 8.2 Options compared for this codebase

**Option A: React Native / Expo**
- Pros:
  - Reuses the TypeScript domain code: `lib/apiClient.ts` semantics, the SSE event model in `lib/sse.ts`, mode definitions (`lib/modes.ts`), types, and the external stores (they are plain `useSyncExternalStore` modules, which work in React Native).
  - Truly native feel: gestures, lists, keyboard, haptics.
  - Expo has first-class modules for SecureStore, AuthSession and Apple auth, Notifications, AV, FileSystem and Sharing.
  - Low store-review risk.
- Cons:
  - **Every screen's UI is rewritten.** About 60 components use Tailwind classes, CSS zoom, CSS masks, `position: fixed` overlays, `title` tooltips and DOM measuring (tour, citation popovers, drawer).
  - The landing curtain and avatar animations need Skia or Reanimated.
  - Streaming needs `expo/fetch` (SDK 52+) or a native module.
  - Live calls need `react-native-webrtc` (so no Expo Go, a custom dev client instead).
  - The mobile web test suite doesn't carry over. It would need Detox or Maestro.
- **ASSUMPTION:** about 10–14 weeks for one experienced RN developer to reach parity.

**Option B: Flutter (full rewrite)**
- Pros:
  - Excellent rendering control. The curtain, avatar and motion are easy in Flutter.
  - One codebase for both stores.
- Cons:
  - **Zero reuse.** Dart replaces all 22.5k lines of TypeScript, including the subtle client logic: SSE gate re-send flags, cold-start retries, draft and scroll restore, tour logic.
  - Two languages (Python and Dart) plus the web app to keep in sync.
  - The team's tooling (Next, Tailwind, Playwright) doesn't transfer.
- **ASSUMPTION:** 14–20 weeks. Not justified by anything in this codebase.

**Option C: Capacitor (wrap the existing web app)**
- Pros:
  - **Ships the existing, tested phone UI.** The only change is the root zoom, which already treats touch phones separately (`--ui-zoom: 0.92`).
  - Bearer auth means no cookie problems.
  - WebView supports streaming fetch and WebRTC.
  - Native plugins fill the gaps:
    - `@capacitor/preferences`, or better a Keychain/Keystore secure-storage plugin, for tokens
    - `@capacitor/push-notifications`
    - `@capacitor/share` and `@capacitor/filesystem` for exports
    - `@capacitor/haptics`
    - `@capacitor/app` for deep links and back button
    - `@capacitor/keyboard`
    - native Google and Apple sign-in plugins (e.g. `@capacitor-community/apple-sign-in`; for Google, a plugin that returns an ID token)
  - **About 4–6 weeks to both stores.**
  - The web, PWA and apps stay one codebase. Every fix from this session's mobile work lands in the app too.
- Cons:
  - **App Store guideline 4.2 ("minimum functionality") risk** for apps that look like a website. Mitigate with real native integration: push, Sign in with Apple, native share, haptics, offline/cold-start UX, a native splash, and no external browser chrome.
  - WebView performance on low-end Android for long threads. There is no virtualization today; message lists render fully (section 3: no pagination).
  - **The Next.js build has to run from the device or a server:**
    - Static export needs `output: 'export'` and work for the dynamic routes `/chat/[conversationId]` and `/workspace/[id]` (they read params client-side, so they can become `?id=` query routes, or be served from a single `index.html` shell with client routing).
    - Pointing the WebView at the live site (`server.url`) works but raises review risk and breaks offline launch.
  - The service worker (`public/sw.js`) and PWA install button must be disabled inside the app.
  - The CSP in `next.config.ts` must allow the `capacitor://localhost` origin. The backend CORS (`BACKEND_CORS_ORIGINS`) must add `capacitor://localhost` (iOS) and `https://localhost` (Android).

**Option D: Separate native apps (Swift + Kotlin)**
- Pros:
  - Best possible platform fidelity and performance.
  - First-class WebRTC, audio session and StoreKit integration.
- Cons:
  - Two full rewrites plus the web app, which means three UIs to maintain.
  - Duplicated SSE, gate, branching and tour logic in two languages.
  - The highest cost and slowest to reach either store.
- **ASSUMPTION:** 2 × 14–20 weeks.

### 8.3 Recommendation

**Ship v1 with Option C (Capacitor), after the backend hardening in section 11 phase 1. Plan Option A (Expo) as v2 only if a trigger below fires.**

**Why this fits this codebase:**
1. The value is in the client logic and the phone UX, both TypeScript/React and both already tested on 13 device sizes in two engines. Capacitor keeps all of it. Every other option throws away the UI layer.
2. Nothing in the architecture fights a WebView. There are no cookies, no SSR data and no server routes. The streaming fetch, WebRTC and MediaRecorder APIs the app uses all exist in WKWebView (iOS 14.3+) and Android System WebView.
3. The real work is the same under any option: backend auth for native sign-in (multi-audience Google, Apple, logout and device sessions), push, deep links, secure token storage, audio format, and store compliance. Capacitor lets the team spend its time there instead of re-drawing screens.
4. It keeps one product. Web, PWA, iOS and Android share one codebase and one test suite.

**Triggers to move to Option A (Expo/React Native) later:**
- App Review rejects under 4.2 despite the native integrations.
- Profiling shows unacceptable jank on long threads on mid-range Android even after adding pagination and list virtualization.
- The voice experience needs native audio-session control the WebView can't give (background audio, AirPods routing, CallKit).

When that happens, port in this order: `lib/` (API client, SSE, stores, modes), then chat, then the shell, then everything else. Keep the FastAPI backend unchanged.

---

## 9. Action Checklist: What I Need to Prepare

### 9.1 Accounts and signing
- [ ] **Apple Developer Program** membership ($99/yr), **App Store Connect** app record, bundle ID (ASSUMPTION: e.g. `ai.clardentity.app`).
- [ ] **Google Play Console** developer account ($25 one-time), app record, package name (the same reverse-DNS).
- [ ] iOS **distribution certificate** and **provisioning profiles**, ideally managed by Xcode automatic signing or Fastlane match. Turn on these capabilities: Push Notifications, Sign in with Apple, Associated Domains.
- [ ] Android **upload keystore**, backed up, with the password in a password manager. Enrol in **Play App Signing**.
- [ ] A **D-U-N-S number** if publishing as an organisation.

### 9.2 Keys and secrets to create or rescope (see section 4)
- [ ] **Google OAuth**:
  - create an **iOS client ID** and an **Android client ID** (with the SHA-1/SHA-256 of the upload and Play signing keys) in the same Google Cloud project as `GOOGLE_CLIENT_ID`
  - change the backend to accept all of them (`backend/app/api/auth.py:324-326` currently passes a single audience)
  - ASSUMPTION: alternatively, configure the native SDKs with the existing web client ID as `serverClientID`, so the `aud` matches
- [ ] **Sign in with Apple**: a Services ID and key (`.p8`), team ID and key ID. Add new backend settings, e.g. `APPLE_TEAM_ID`, `APPLE_CLIENT_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (all secret, server-only).
- [ ] **APNs auth key** (`.p8`) and **Firebase project** (FCM server credentials / service account JSON). Server-only secrets.
- [ ] **PostHog**: decide whether the apps report to the same project key (`NEXT_PUBLIC_POSTHOG_KEY` is public by design) or a separate one. Use the mobile SDK only for a native rewrite; in Capacitor the existing JS keeps working.
- [ ] **Nothing else ships in the app.**
  - All LLM, search, email and storage keys are server-only: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `TAVILY_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `RESEND_API_KEY`, `S3_*`, `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`. Keep them that way.
  - Live calls already use **ephemeral** OpenAI secrets minted per call (`backend/app/api/realtime.py:132-228`). Never embed `OPENAI_API_KEY` in an app.
- [ ] Fix config drift: add `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`, `GOOGLE_API_KEY` and `XAI_API_KEY` to `render.yaml` (as `sync: false`) so environments are reproducible. Add a `frontend/.env.example` for the 4 `NEXT_PUBLIC_*` vars (section 4).
- [ ] Remove the MinIO default credentials as **code defaults** in `backend/app/core/config.py:186-187`.

### 9.3 Backend changes required for mobile
- [ ] **Fix `/api/v1/admin/settings` authorization** (`backend/app/api/admin.py:20-55`). Do this before any new client ships.
- [ ] **Auth hardening:**
  - multi-audience Google verification
  - check `email_verified` before linking by email (`backend/app/api/auth.py:332-339`)
  - `POST /auth/oauth/apple`
  - record `terms_accepted_at` / `terms_version` for OAuth sign-ups (`backend/app/api/auth.py:343-348`)
- [ ] **Sessions:**
  - a `devices` or `refresh_tokens` table: device ID, platform, push token, last seen, hashed refresh token
  - rotation with reuse detection
  - `POST /auth/logout` (revoke this device) and "sign out everywhere"
  - today the only revocation is the per-user `refresh_token_version` bump on password reset (`backend/app/api/auth.py:264`)
- [ ] **Rate limits behind Render's proxy:**
  - run uvicorn with `--proxy-headers --forwarded-allow-ips` (`backend/start.sh:46`), or key auth limits on `X-Forwarded-For` the way `backend/app/api/guest.py:95-106` does
  - otherwise every user shares one `/auth/refresh` bucket (30 per 5 min), and phones refresh every 15 minutes
- [ ] **Push:**
  - `POST /devices` / `DELETE /devices/{id}` for APNs/FCM token registration
  - a sender in Celery (e.g. answer ready, document ingested, profile rebuilt)
- [ ] **Resilient streaming:** move post-answer analysis out of the SSE generator (`backend/app/api/chat.py:1526-1689`) into a Celery task, plus `GET /chat/{id}/messages/{mid}` (or the existing `GET /validation/{message_id}`) so a backgrounded app can recover claims and score.
- [ ] **Pagination:** cursor pagination for conversations, messages and documents. They are all unpaginated today (`backend/app/api/chat.py:338-366,457-465`, `backend/app/api/documents.py:180-193`).
- [ ] **Audio:**
  - accept `m4a`/`aac`/`caf`/`3gp`, or sniff the MIME type instead of the filename extension (`backend/app/api/audio.py:17`)
  - add a server-side size cap
- [ ] **App config endpoint:** `GET /api/v1/app-config` returning minimum supported app version, feature flags safe for clients, and the Realtime model/URL. Today the client hard-codes `https://api.openai.com/v1/realtime/calls` (`frontend/lib/liveCall.ts:14`).
- [ ] **CORS / CSP** (Capacitor only): add `capacitor://localhost` and `https://localhost` to `BACKEND_CORS_ORIGINS`, and extend `connect-src` in `frontend/next.config.ts`.
- [ ] **Storage cleanup:** delete document files on workspace/conversation delete, and generated images on account delete (section 3.4, "Cascade gaps worth knowing"). Store reviewers test account deletion.
- [ ] **Billing:** decide now. If "Clar Pro/Max/Ultra" will be sold inside the apps, App Store and Play rules require StoreKit / Play Billing, plus server-side receipt validation and App Store Server Notifications v2 / Google RTDN webhooks. **None of that exists** (`backend/app/api/pro.py`, no payment code anywhere).

### 9.4 Deep linking
- [ ] Serve `https://clardentity.ai/.well-known/apple-app-site-association` (applinks for `/reset-password`, `/chat/*`, `/workspace/*`) and `https://clardentity.ai/.well-known/assetlinks.json` (Android App Links with the signing-key fingerprints). Both can be static files from the Next.js `public/.well-known/` folder.
- [ ] Handle `appUrlOpen` (Capacitor) or Linking (React Native) and route to the same paths. The deep-link targets are listed in section 2.2.
- [ ] Reset emails keep their web URL (`backend/app/workers/send_password_reset_email.py:17`). Universal Links make them open the app when it's installed.

### 9.5 Store assets
- [ ] **iOS:**
  - 1024×1024 App Store icon (no alpha)
  - the Xcode asset catalog generates the 20, 29, 40, 60, 76 and 83.5 pt sizes at @2x and @3x
  - a launch screen storyboard
- [ ] **Android:**
  - adaptive icon (foreground and background layers, 108 dp)
  - monochrome themed icon
  - 512×512 Play icon
  - 1024×500 feature graphic
  - splash via `core-splashscreen`
- [ ] Screenshots:
  - iPhone 6.9" (1320×2868) and 6.5" (1284×2778)
  - iPad 13" (2064×2752) if iPad is supported
  - Android phone, plus 7" and 10" tablet if supported
- [ ] What exists today (section 7.5): `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-icon.png`, `favicon.ico`, OG images. **There is no 1024 icon, no adaptive-icon layers, no splash and no feature graphic.**
- [ ] `Card_design/` has 48 SVGs (12 concepts × 4 colour themes). They are useful for marketing screenshots and are not used by the app.

### 9.6 Privacy, permissions and policy (based on what the code collects; section 3.6 / 13)
- [ ] **Update the privacy policy** (`frontend/app/(legal)/privacy/page.tsx:115-128`). Add these processors: Google (Gemini API and Google Sign-In), xAI (Grok), ipapi.co (IP geolocation) and OpenAI image generation. If Apple sign-in and push are added, add Apple and Firebase/Google too.
- [ ] **App Store privacy labels / Play Data Safety:**

  | Data | Category | Where in the code |
  |---|---|---|
  | Email, name | Contact Info | `users.email`, `users.display_name` |
  | Chat content, documents, imported chat history, onboarding answers | User Content | `messages`, `documents`/`document_chunks`, `user_profiles.imported_context`, `user_profiles.onboarding_answers` |
  | Inferred personality profile, roles (incl. family relationships), stated facts | User Content / sensitive inferences | `user_profiles.personality_md/aspects/roles` |
  | Voice audio | Audio Data: processed by OpenAI, not stored | `backend/app/api/audio.py`, `backend/app/api/realtime.py` |
  | Coarse location (city/country from IP) | Location | `users.location_*` via ipapi.co |
  | User ID, product interaction (enumerated events, no content) | Identifiers / Usage Data | PostHog, consent-gated (`frontend/lib/analytics.ts`) |
  | Crash/diagnostic errors | Diagnostics | PostHog error events |

  Mark as **linked to the user**. Tracking: **no** (ASSUMPTION: PostHog is first-party product analytics with no ad SDKs).
- [ ] **Permission strings:**
  - `NSMicrophoneUsageDescription` (dictation, live calls)
  - `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` (image and document attachments from camera or library; `components/upload/*`)
  - Android `RECORD_AUDIO`, `CAMERA`, `POST_NOTIFICATIONS` (13+)
  - Location permission is **not** needed: location is IP-derived on the server
- [ ] **Account deletion:** already in-app (`DELETE /api/v1/auth/me`, `frontend/components/profile/DeleteAccount.tsx:23`). Also provide the **web URL** Play requires for deletion requests. Fix the orphaned-file gaps first.
- [ ] **AI content:**
  - Reflect & Relieve (therapy) and Legal modes need clear "not professional advice" disclaimers in-app and in the store listing (ASSUMPTION: review guideline 1.4.1 for health-adjacent apps)
  - Co-Creative image generation means content-moderation questions in the age-rating questionnaire (ASSUMPTION: rating 12+ or higher)
- [ ] Record terms acceptance for Google and Apple sign-ups (section 9.3).

### 9.7 New endpoints mobile specifically needs (summary)
`POST /auth/oauth/apple` · `POST /auth/logout` · `POST /auth/logout-all` · `POST /devices` · `DELETE /devices/{id}` · `GET /app-config` · paginated `GET /chat/conversations?cursor=` and `GET /chat/{id}/messages?before=` · a way to recover an answer after a dropped stream (`GET /chat/{id}/messages/{mid}`) · billing receipt validation and store webhooks (only if selling in-app).

### 9.8 Testing and release pipeline
- [ ] **TestFlight:**
  - internal testers
  - then external testers, which needs Beta App Review
  - a demo account for App Review: build it from `e2e/demo-api.mjs`-style seed data on a staging backend, or a real test account
- [ ] **Google Play:** Internal testing, then Closed testing. **New personal accounts must run a closed test with 12+ testers for 14 days before production access** (ASSUMPTION: the current Play policy for new developer accounts).
- [ ] **CI:**
  - add a mobile build job (Fastlane or EAS / Capacitor + Gradle and xcodebuild on macOS runners)
  - keep the Playwright suite as the UI regression gate. In a Capacitor app it tests the same bundle.
  - add backend `pytest` to CI (`backend/tests` has 28 files but **no workflow runs them**; section 13)
- [ ] **Staging:** a separate Render service and Supabase project for app-review and beta builds. Today there's one production environment.
- [ ] **Crash reporting:** add Sentry or Firebase Crashlytics in the native shell. Today there's only PostHog error events.

---

## 10. Risks & Unknowns

### 10.1 Not fully traced
- **Frontend production hosting.** `DEPLOYMENT.md:13-15` names a Vercel URL, but no `vercel.json` or project config is committed. ASSUMPTION: production `clardentity.ai` is on Vercel.
- **Settings outside the repo.** `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `PREVIEW_*`, `GUEST_DAILY_TOKEN_BUDGET` and others are read by `backend/app/core/config.py` but declared nowhere else. ASSUMPTION: they are set on the Render dashboard. They must be verified there before a staging environment can be cloned.
- **Behind Render's proxy:** `request.client.host` may be the proxy, not the user (`backend/app/api/auth.py:50-51` vs `backend/start.sh:46`). This affects auth rate limits and the location lookup. Verify with a request log in production.
- **Mid-stream disconnects.** It's not confirmed whether the claim/score write runs when the client disconnects during analysis (`backend/app/api/chat.py:1556-1644`). ASSUMPTION: the generator is cancelled. Test by backgrounding a phone mid-answer.
- **Resend sender domain** (`DEPLOYMENT.md:184-192` vs `render.yaml:105-106`). ASSUMPTION: `clardentity.ai` is verified, since password reset depends on it.
- **The `anthropic` package is unpinned** (`backend/requirements.txt:91`), so a breaking SDK release could change behaviour on redeploy.
- **Dead code:** `components/system/HealthStatus.tsx`, `components/admin/AdminSettings.tsx`, `resetConsent()` in `lib/consent.ts`. Template SVGs in `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) and four unused `logo-dots-*` variants. Confirm before deleting.

### 10.2 Hard or impossible as-is on mobile
- **Live voice calls.**
  - WebRTC to OpenAI works in WKWebView, but iOS mutes WebView audio when the app goes to the background, so calls can't continue with the screen locked or in another app.
  - A full CallKit / background-audio experience needs a native module, or Option A/D.
  - The lip-sync visualiser uses `AudioContext` analysers (section 7). They work in a WebView but are CPU-heavy.
- **Voice notes.** The forced `audio/webm` blob type and `recording.webm` filename (`components/upload/AudioRecorder.tsx:65,86`) are wrong on iOS, where the recorder produces mp4/AAC. Fix the client to use the recorder's real `mimeType`, and the server allow-list.
- **Streaming answers while backgrounded.** iOS suspends the WebView or socket within seconds. Long fact-checks (tens of seconds; `backend/app/core/config.py:17-23,56-60`) will be cut off unless the server finishes the analysis independently and the app re-fetches it, or a push says "answer ready".
- **Hover-only controls.** The Copy/Edit/Delete actions under your own messages are hover-only (`components/chat/MessageList.tsx:1213`). They need a long-press menu or always-visible actions on touch.
- **The PWA service worker** (`public/sw.js`) and **install button** must be disabled inside a native shell. A static-export WebView doesn't need them, and a stale cache-first worker inside an app would pin old bundles.
- **In-app purchases.** Selling the paid tiers inside the apps requires StoreKit and Play Billing. None exists, and external payment links have strict rules.

### 10.3 Dependencies that could block mobile builds
- **Next.js 16** static export (`output: 'export'`) doesn't support dynamic route segments without `generateStaticParams`. `/chat/[conversationId]` and `/workspace/[id]/*` read their params client-side, so they need restructuring (query params or a catch-all client router) for Capacitor's bundled mode. **ASSUMPTION:** `next/image` must use `unoptimized: true` in export mode. The landing page uses `next/image` for the curtain and icons.
- `posthog-js`, `nspell` and the dictionary files work in a WebView. For React Native, `posthog-js` would be swapped for `posthog-react-native`, and nspell dropped in favour of OS autocorrect (the web already disables its own on touch).
- The CSS root `zoom` and `dvh` units are WebKit-supported (iOS 16.4+ for `dvh`; `zoom` is long-standing in WebKit). Older iOS versions (14–15) fall back to `vh` (`app/globals.css` `@supports` block).
- React 19 + Next 16 are current, so there are no deprecated packages. React Native, if chosen later, would need its own React version alignment.

---

## 11. Suggested Migration Roadmap

Estimates assume **one full-stack developer** familiar with this repo. ASSUMPTION: double them for someone new to it. Phases 1 and 2 can overlap.

| Phase | Scope | Effort |
|---|---|---|
| **0. Decisions and accounts** | Confirm Option C. Decide in-app billing (yes or no). Set up Apple and Google developer accounts, bundle IDs, a staging backend (Render + Supabase + Upstash clone), and the config-drift cleanup (section 9.2) | 2–4 days (plus account approval wait) |
| **1. Backend hardening for native clients** | Admin-settings auth fix. Multi-audience Google. Sign in with Apple. Terms on OAuth sign-up. `devices` table with rotating per-device refresh tokens. Logout and logout-all. Proxy-aware rate limits. `/app-config`. Audio formats and size cap. Storage cleanup on delete. Tests for each | 8–12 days |
| **2. Resilient answers and pagination** | Move post-answer analysis to Celery. Add a recover endpoint. Cursor pagination for conversations, messages and documents. Client changes in `lib/sse.ts` / `ChatView` to resume or re-fetch | 6–9 days |
| **3. Capacitor shell** | Add Capacitor to `frontend/`. Restructure dynamic routes for static export. Disable the service worker and install button under native. Move tokens from localStorage to secure storage (an adapter behind `lib/auth.tsx`). CORS/CSP for the app origin. Native splash and icons. Status-bar and keyboard plugins. Back button. Safe areas (already in CSS) | 6–8 days |
| **4. Native integrations** | Native Google and Apple sign-in. Push (APNs/FCM) with registration and two or three notification types. Universal Links / App Links. Native share for exports (Markdown, PDF, Office). Haptics. Fix the voice-note MIME type. Long-press message actions. Check that live calls work in WKWebView and Android WebView, with permission prompts | 8–12 days |
| **5. Compliance and store prep** | Privacy policy and processor list. Privacy labels and Data Safety. Age rating. AI and therapy disclaimers. Screenshots on real devices. App Review demo account and notes. Account-deletion web URL | 3–5 days |
| **6. Beta and release** | TestFlight internal and external. Play internal, then closed (14-day, 12-tester rule if applicable). Fix device findings (the `Better_docs/Mv.md` items marked "needs a device check"). Submit | 2–3 weeks elapsed, about 5–8 dev days |
| **7. (Optional) v2 native** | If an 8.3 trigger fires: Expo app reusing `lib/`, built in this order: chat, then shell, then the rest. Push, auth and backend are unchanged | 10–14 weeks |

**Critical path to the first store submission: about 6–9 weeks** (phases 0 to 5 plus beta). **ASSUMPTION:** this excludes billing. Add 2–3 weeks for StoreKit and Play Billing with server validation if the paid tiers are sold in-app.

---

## 12. Additional knowledge: the product, the team's workflow and the fork

### 12.1 Glossary (terms that appear across code and UI)
| Term | Meaning | Where |
|---|---|---|
| Crux | One-sentence gist streamed before the answer body | SSE `crux` event; `messages.crux_text` |
| Claim | One checkable statement in an answer, tagged `<claim id="n">` by the model | `backend/app/services/claim_parser.py`; `message_claims` |
| Evidence / citation | Document excerpt or web source backing a claim, with support, relevance and credibility scores | `claim_evidence`, `citations` |
| Confidence band | Likely Fact ≥90 / Plausible ≥70 / Needs Verification | `backend/app/services/confidence_scoring.py` |
| Gate | Pre-answer stop: `refined_question`, `clarifying_options`, `context_question`, `mode_suggestion`. The client re-sends with `*_confirmed` flags | `backend/app/services/answer_pipeline.py:130-209` |
| Smart switching | Auto-switching to a better mode on `mode_suggestion`, with a countdown and a way back | `frontend/components/chat/ChatView.tsx` (`switchedFrom`); guest version is server-side |
| Devil's advocate / counterfactual | Opposing version of an answer ("Flip to the unchecked version" in the UI) | `backend/app/services/devils_advocate.py` |
| Preview companions | Mentoring, Reflect & Relieve, Co-Creative and Legal behind `preview_unlocked_at`, 25 messages per day | `backend/app/services/preview_access.py`, `PREVIEW_MODES` |
| Rapid / Quick answer | Unchecked fast answer used as a fallback when an answer is slow | `frontend/lib/modes.ts:126-141`; `ChatView` `handleQuickAnswer` |
| Companion names | User-chosen nickname per mode | `users.companion_names`; Settings page |
| Bootstrap | One call returning user, workspaces and a reusable empty chat at app entry | `POST /api/v1/bootstrap` |
| Branch / sibling | Edit-and-resend and regenerate create siblings in a message tree | `backend/app/services/message_tree.py` |

### 12.2 Repository workflow (this fork)
- **Upstream** is `clardentity/clardentity-mvp`. **This fork** is `AdityaManojA/clardentity-mvp-mv`, with work committed to the fork's `main`.
- Upstream changes are merged into the fork by hand (the automatic 15-minute sync workflow was removed on 2026-10-12). The Playwright E2E suite is kept locally only (`frontend/e2e`, gitignored); upstream still runs it in CI.
- **Upstream pull requests** come from a branch with fork-only files stripped. The current one is `mobile-polish`, PR #3.
- `graphify-out/` holds a generated code knowledge graph. A git hook rebuilds it on commit (`Better_docs/GRAPHIFY_WORKFLOW.md`). Don't commit its churn by accident.
- Product and technical documentation:
  - `README.md`, `DEPLOYMENT.md`
  - `Better_docs/TECHNICAL_GUIDE.md` (a copy is in `docs/TECHNICAL_GUIDE.md`)
  - `Better_docs/Mv.md`: the mobile-view change log and test checklist
  - `docs/analytics.md`: the analytics event dictionary
  - `docs/learning-layer-gap.md`
  - the SRS PDF: `docs/Clardentity AI Platform - MVP Software Requirements Specification.pdf`
  - bias taxonomy PDFs
  - flow and sequence diagrams: `docs/clardentity_flow_diagram.png`, `docs/clardentity_sequence_diagram.png`
- **Task tracker:** a Google Sheet, "suggestions/bugs", with `WebApp` and `MobileView` tabs (IDs `CLD-*` and `MV-*`; Status values: Fixed - merged, WIP, Wont do, New, Built - needs device check).

### 12.3 The mobile web work already done (carries straight into a Capacitor app)
`Better_docs/Mv.md` records about 150 phone-layout changes. Highlights a mobile developer should know:
- **Phone layout:** below 1024px. The root zoom is `--ui-zoom` 0.92 on touch phones and 0.85 elsewhere. `--app-vh` uses `dvh`, so the toolbars are excluded. Safe areas use `data-safe`, with `interactive-widget=resizes-content` for the Android keyboard.
- **Tap targets:** 44px via the `tap-target` / `tap-area` utilities.
- **Phone menu:** a drawer with a focus trap, Back-button close and swipe-to-close.
- **Chat behaviour:**
  - jump to latest
  - per-chat scroll restore
  - draft kept per chat
  - offline notice
  - cold-start "waking the server" notice and sign-in retry
  - the mode row folds into a chip while typing and on short (landscape) screens
  - new chats open centred with the companion
- **Loading and errors:** skeletons, error boundaries with a report link, and a friendly full-screen crash page.
- **Landing page:** a curtain wave on screens without hover, theme-coloured card marks (`components/marketing/CardEmboss.tsx`), and cards that fit every screen.
- **Tests:**
  - `e2e/mobile*.spec.ts` (M-IDs)
  - `e2e/devices.spec.ts` (D-IDs, 17 screens × 13 devices × 2 engines)
  - `e2e/visual.spec.ts` (screenshot baselines generated in CI)
  - `e2e/a11y.spec.ts` (axe)
  - `e2e/offline.spec.ts`
- **Local phone demo:** run `frontend/e2e/demo-api.mjs`, an untracked mock backend on port 8010 with seeded accounts, and serve a LAN build with `NEXT_PUBLIC_API_URL` pointed at it. That makes a ready-made App Review or demo data set.

### 12.4 Known issues found during this audit (outside mobile scope, worth fixing)
- **`/api/v1/admin/settings` is not admin-gated** (`backend/app/api/admin.py:20-55`). This is security-relevant.
- **Four raw `fetch` callers skip the 401 refresh-and-retry:** dictation (`components/upload/AudioRecorder.tsx`), document upload (`components/upload/DocumentUploader.tsx`), read-aloud (`ChatView`) and Office export (`ExportFileMenu`). Read-aloud also never revokes its TTS object URLs.
- **Logout doesn't revoke anything on the server.**
- **Google sign-up** doesn't check `email_verified` and doesn't record terms acceptance.
- **Storage orphans:** files are left behind on workspace/conversation delete and on account delete (generated images).
- **Image uploads have no server-side size check**, and neither does `/audio/transcribe` (`backend/app/api/chat.py:115-191`, `backend/app/api/audio.py`).
- **CI runs no backend tests, lint or type-check** (section 13).
- **Docs drift:** `.env.example:3` says `OPENAI_MODEL=gpt-5`, but the code and `render.yaml` use `gpt-5.4-mini`.


---

## 13. Build, deploy, CI & compliance details

### 13.1 Build, deploy and CI

#### GitHub workflows (`.github/workflows/`)
| Workflow | Triggers | Jobs / what it runs |
|---|---|---|
| `e2e.yml` (name "E2E") | `pull_request` to `main`; `workflow_dispatch` (`:19-22`) | Job `playwright` in container `mcr.microsoft.com/playwright:v1.64.0-noble` (`:36`); `npm ci`; checks Playwright version equals image (`:62-65`); `npm run test:e2e:ci` = projects web + mobile-chrome (Pixel 7) + mobile-safari (iPhone 14 WebKit) + live (`frontend/package.json:13`); `E2E_VISUAL=1` so @visual screenshot comparisons run; live tests use GH secrets (`:45-51`) and skip on forks; uploads report/traces on failure. Reporters: list, html, junit, json (`playwright.config.ts:36-43`). |
| `e2e-visual-baselines.yml` | `workflow_dispatch` only (`:8-9`) | Regenerates `@visual` baselines for mobile-chrome + mobile-safari with `--update-snapshots=all`, commits `frontend/e2e/visual.spec.ts-snapshots` and pushes to the branch (`:41-56`); `contents: write`. |
| `sync-upstream.yml` | `schedule` cron every 15 min (`"2,17,32,47 * * * *"`), `workflow_dispatch` (`:11-14`) | Only in `AdityaManojA/clardentity-mvp-mv` (`:26`). `check` job: `git ls-remote` upstream `clardentity/clardentity-mvp` main; `sync` job gated by protected environment `sync-approval`, merges upstream, runs gate `npm ci && playwright install chromium webkit && npm run test:e2e:ci`, then pushes via `.github/scripts/sync-upstream.sh` (never force-pushes). Doc: `.github/SYNC_UPSTREAM.md`. |

**Gaps**: no workflow runs backend `pytest` (472+ tests per `.claude/skills/regression/SKILL.md:20`), no lint (`npm run lint` / ruff), no type-check, no build/deploy workflow, no frontend unit tests. Backend tests and smoke run manually via the `regression` skill (`.claude/skills/regression/SKILL.md`, `scripts/regression/smoke.py`). Mobile will need new jobs (macOS runner + Xcode, Android SDK/Gradle, signing secrets, Fastlane/EAS).

#### Render (`render.yaml`)
- One `web` service `clardentity-backend`, `runtime: docker`, `dockerfilePath: ./backend/Dockerfile`, `dockerContext: ./backend`, `plan: standard` with dashboard-side autoscaling, `healthCheckPath: /health`, `preDeployCommand: alembic upgrade head` (`render.yaml:8-26`).
- Env vars from group `clardentity-shared` (`:28-110`); secrets are `sync: false` (set on dashboard).
- No separate worker service: Celery runs in-container (`backend/start.sh:40-44`, `--concurrency=1`), uvicorn on 8000 (`start.sh:46`). Migrations run twice by design (preDeploy + `start.sh:17`, with Postgres advisory lock in `alembic/env.py`).
- `DEPLOYMENT.md` is partly stale vs `render.yaml` (it describes the free plan and preDeployCommand being inert; render.yaml now says standard plan where it runs).

#### Docker
- `backend/Dockerfile:1-17`: `python:3.12-slim`, installs `libpq-dev gcc`, `pip install -r requirements.txt`, `CMD ./start.sh`, `EXPOSE 8000`. (Note `docs/TECHNICAL_GUIDE.md:55-58` diagram says Python 3.13 - minor drift.)
- No frontend Dockerfile (Vercel builds it).

#### infra/
- `infra/docker-compose.yml` only: local stack `pgvector/pgvector:pg16`, `redis:7-alpine`, `minio/minio:latest` + `minio-init` bucket creation, `backend` (uvicorn --reload) and `celery_worker`, both reading `../.env` and overriding DB/Redis/S3 to container hosts (`:63-101`). Comment says day-to-day dev runs natively instead (`:4-6`).

#### scripts/
- `scripts/deploy-backend.sh`: triggers Render deploy via API key (`.secrets/render-api-key`, polls deploy status with `--wait`) or deploy hook (`.secrets/render-deploy-hook`); service `srv-d9jm...`, API `https://api.render.com/v1` (`:26-83`).
- `scripts/regression/smoke.py`: API/security smoke test; targets `prod` (`https://clardentity-backend.onrender.com`, `https://clardentity.ai`) or `local` (`:8010`/`:3100`) (`:37-38`); checks health, CORS rejection of a foreign origin (`:181`), guest demo, signed-in flow (registers a throwaway user, `:248`); `--images` costs money (`:344`).
- `.github/scripts/sync-upstream.sh`: see 4a.
- `.claude/launch.json`: dev servers frontend `:3100`, backend `:8010`, frontend-prod `:3100`.

#### Hosting and domains
| Component | Host | URL(s) referenced |
|---|---|---|
| Web frontend | Vercel | `https://clardentity.ai` (`frontend/app/layout.tsx:64,68`, `render.yaml:104`, `smoke.py:37`); legacy `https://frontend-eight-blush-49.vercel.app` (`DEPLOYMENT.md:14`, `README.md:13`) |
| Backend API | Render (Docker, standard plan) | `https://clardentity-backend.onrender.com` + `/api/v1` (`DEPLOYMENT.md:13`, `e2e/live.spec.ts:12`, `evals/run.py:170`, `docs/TECHNICAL_GUIDE.md:129`) |
| DB + Storage | Supabase (pooler `aws-N-<region>.pooler.supabase.com:6543`, bucket `clardentity-prod`, region `ap-northeast-2`) | `render.yaml:51-67` |
| Redis | Upstash (`rediss://`) | `DEPLOYMENT.md:5,63-79` |
| Email | Resend, from `hello@clardentity.ai` | `render.yaml:105-106` |
| Contact | `hello@clardentity.ai` | `privacy/page.tsx:15` |
| Admin | `admin@clardentity.ai` | `render.yaml:85-87`, `config.py:82,87` |
| Repos | fork `AdityaManojA/clardentity-mvp-mv`; upstream `clardentity/clardentity-mvp` | `sync-upstream.yml:17,26` |

Mobile implications: API base for the apps = `https://clardentity-backend.onrender.com/api/v1` (ASSUMPTION: consider a custom domain like `api.clardentity.ai` before shipping so the app is not pinned to a Render subdomain). OpenAPI spec at `/openapi.json` (`docs/TECHNICAL_GUIDE.md:129-131`) can generate Swift/Kotlin clients. Universal/App Links files would be served by Vercel at `https://clardentity.ai/.well-known/`.


### 13.2 Licensing and compliance (legal pages, data, processors, consent, deletion)

#### Legal pages
- `frontend/app/(legal)/privacy/page.tsx` (version `2026-09-28`, `:13`, must match `TERMS_VERSION` `config.py:79`) and `frontend/app/(legal)/terms/page.tsx`; shared layout `frontend/app/(legal)/legal.tsx`, `layout.tsx`.
- Acceptance recorded at sign-up (`accepted_terms` in register payload, `scripts/regression/smoke.py:248`; terms_version stored per account per `config.py:76-79`).

#### Data collected (privacy `:44-94`)
Account details (email, hashed password, display name, terms acceptance date); content (questions, answers, follow-ups, chat names); attached files (PDF/Word/Excel/PowerPoint/text/images) + extracted text + embeddings; voice recordings + transcripts; approximate location (city/country from sign-in IP, IP not stored); language + time zone (sent for voice call, not stored); technical logs (timestamps, endpoints, errors, timings); consented product analytics (content-free events). No children under 16 (`:92-93`; terms `:57` also requires 16+). Legal bases: GDPR (contract, legitimate interest, consent for analytics) and India DPDP Act 2023 (`:97-106`). Governing law India, courts of Bengaluru (terms `:147`).

#### Processors named (privacy `:115-128`)
Anthropic (US), OpenAI (US; fallback, transcription, embeddings), Tavily (US), Supabase, Render (US), Vercel (global edge), Upstash, Resend (US), PostHog (EU).
**Missing vs code**: Google (Gemini API, `extra_providers.py`; and Google Sign-In), xAI (`extra_providers.py`), ipapi.co (`geolocation.py`), OpenAI for TTS / realtime voice / image generation (policy only lists transcription + embeddings + fallback for OpenAI). Should be fixed before App Store / Play submission since the privacy labels must match.

#### Retention / rights (privacy `:143-185`)
Data kept until user deletes; chat delete removes messages/claims/citations; account delete is immediate and irreversible; server logs up to 30 days; analytics up to 12 months. Self-service: export a conversation, delete account; other requests by email within 30 days.

#### Consent banner behaviour
- `frontend/components/system/ConsentBanner.tsx:18-71`: shown only when `NEXT_PUBLIC_POSTHOG_KEY` is set and consent is `unset`; two equal-weight buttons "Allow" / "No thanks"; links to /privacy and /terms.
- `frontend/lib/consent.ts:14-60`: stored in localStorage key `clardentity-consent` (`granted`/`denied`); unreadable storage = treated as unset (analytics off); `resetConsent()` to ask again. PostHog SDK is not even downloaded before consent (`lib/analytics.ts:120-123`).
- Mobile: replicate with a native first-run sheet persisted in UserDefaults/SharedPreferences; PostHog native SDK should start opted-out. ASSUMPTION: Apple ATT prompt is **not** required because analytics are first-party, content-free, keyed on user id, and not used for cross-app tracking - but App Privacy labels must declare "Product Interaction" / "Diagnostics" linked to user ID.

#### Account deletion / export endpoints (App Store 5.1.1(v), Play account-deletion policy)
| Endpoint | File:line | Behaviour |
|---|---|---|
| `DELETE /api/v1/auth/me` | `backend/app/api/auth.py:376-427` (router prefix `/auth` at `:47`) | Deletes owned workspaces, documents (and S3 objects), memberships, then the user; cascades conversations, messages, chunks, memories, profile, pro-interest. Returns 204. UI: `frontend/components/profile/DeleteAccount.tsx:23`. **Satisfies in-app deletion requirement.** |
| `DELETE /api/v1/profile` | `backend/app/api/profile.py:233` | Clears learned profile (not account). |
| `DELETE /api/v1/profile/aspects/{id}` | `profile.py:215` | Removes one profile aspect. |
| `DELETE /api/v1/documents/{id}` | `backend/app/api/documents.py:221` | Deletes a document + file. |
| `DELETE /api/v1/chat/{conversation_id}/messages/{message_id}` | `backend/app/api/chat.py:667` | Deletes a message. |
| `GET /api/v1/chat/{conversation_id}/export?format=markdown|pdf` | `chat.py:468` | Per-conversation export. |
| `POST /api/v1/chat/{cid}/messages/{mid}/export-file` | `chat.py:562` | Per-answer Office/PDF export. |

Gaps for mobile compliance:
- No whole-account export (GDPR portability currently via email request).
- No logout / refresh-token revocation endpoint (`auth.py` has register, login, password-reset request/confirm, refresh, oauth/google, me, delete me only, `:139-376`); mobile logout will only clear local tokens.
- When Sign in with Apple is added, account deletion must also call Apple's `/auth/revoke` for that user's token (Apple requirement since 2022).
- Deletion is not offered for guests (guest demo stores session counters in Redis only; ASSUMPTION: no personal data persisted for guests beyond `guest/import`, `api/guest.py:690`, which should be checked).
- Paid companion "previews" (terms `:97-104`, `PREVIEW_MODES`): if paid plans launch, digital unlocks inside iOS/Android apps must use IAP / Play Billing.

#### Third-party licences to carry into apps
- Hunspell/SCOWL dictionary licences `frontend/public/dict/LICENSE-en-us.txt`, `LICENSE-en-gb.txt` (only if dictionaries are bundled).
- Fonts Geist / Geist Mono / Outfit (via `next/font/google`) - include OFL licence text in the app's acknowledgements if bundled.
- ASSUMPTION: no root `LICENSE` file was observed in the repo listing; the repo is stated public (`DEPLOYMENT.md:160`) - confirm licensing intent before shipping store builds.


---
*End of Transition.md. Generated from a full read of the repository at commit `75469fe` (2026-10-11).*
