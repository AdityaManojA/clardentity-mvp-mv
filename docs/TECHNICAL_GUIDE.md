# Clardentity — technical guide

Written for someone picking up the **mobile view and the app**, with GitHub
access to this repo. It covers the whole system, but spends most of its
length on the parts a client has to get right: the HTTP API, the streaming
protocol, and the handful of traps that have already cost time here.

Everything below was read off the running system or the code on `main`, not
from memory. Where a number appears, it was measured.

> The root `README.md` predates a lot of this. It says four companion modes
> (there are eight) and points at the old `frontend-eight-blush-49.vercel.app`
> URL. Trust this document over it.

---

## 1. What the product is

A chat product whose distinguishing feature is that **answers are scored
claim by claim against sources**. You pick a *companion* (a mode), ask a
question, and get back an answer plus a per-claim verification pass with
evidence and a confidence band.

Eight companions, chosen in the composer's rail:

| `mode` value | Label shown | Gated? |
|---|---|---|
| `knowing` | Finder | free |
| `decision` | Decision-making | free |
| `thinking` | Thought coach | free |
| `learning` | Learning | free |
| `creative` | Co-Creative | **preview** |
| `mentoring` | Mentoring | **preview** |
| `therapy` | Reflect & Relieve | **preview** |
| `legal` | Legal | **preview** |

There is also an unpickable `rapid` mode used internally for the quick path.
Never send it.

"Preview" means paid-tier-in-waiting. A call in one of those four returns
**402** until the account opens them, which any signed-in user may do:

```
POST /api/v1/pro/preview     → unlocks, returns the allowance
GET  /api/v1/pro/preview     → { unlocked, modes, daily_limit, used_today, remaining_today }
DELETE /api/v1/pro/preview   → locks again
```
Preview modes are also capped at a daily message allowance; exceeding it is
another 402 with a different message. **A mobile client must handle both.**

---

## 2. Topology

```
 Next.js 16 / React 19 / Tailwind v4        FastAPI (Python 3.13)
 ──────────────────────────────────         ─────────────────────
 Vercel  ·  clardentity.ai        ───────▶  Render  ·  clardentity-backend.onrender.com
                                               │
                                               ├── Supabase Postgres + pgvector (via Supavisor pooler)
                                               ├── Upstash Redis (Celery broker + rate limits)
                                               ├── S3-compatible storage (documents, generated images)
                                               ├── Anthropic (primary) · OpenAI (fallback, images, voice)
                                               ├── Google Gemini · xAI Grok (model picker only)
                                               └── Tavily (web search)
```

A Celery worker runs **inside the same web container** (`backend/start.sh`
backgrounds it) because Render's free plan has no worker tier. Consequence:
the whole container sleeps on inactivity, so the first request after a quiet
spell pays a cold start of several seconds. Design the app's loading states
for that — it is the single biggest perceived-latency factor.

Deployment specifics, and the three load-bearing infrastructure fixes you
must not undo, are in [`DEPLOYMENT.md`](../DEPLOYMENT.md).

---

## 3. Running it locally

```bash
# backend  (needs the repo-root .env; ask Alosh)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000

# frontend
cd frontend
npm install
npm run dev            # http://localhost:3000
```

`frontend/.env.local` points the client at the backend:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

If you run the backend on another port, change both — and **change them back
before committing**, which is a rule here because it has been broken before.

Set `BACKEND_CORS_ORIGINS` on the backend to whatever origin you serve from,
comma-separated. A native app doesn't send `Origin`, so CORS is a web-only
concern.

### Testing without burning the shared account

Never sign in as `clardentity@test.com` — its onboarding stamp has to stay
null. Register a throwaway via the API and delete it afterwards:

```bash
curl -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"throwaway-x@example.com","password":"Throwaway!2345",
       "display_name":"X","accepted_terms":true}'
# ... then
curl -X DELETE $API/auth/me -H "Authorization: Bearer $TOKEN"
```

Three gates bite a scripted account, in this order:
1. Registration needs `accepted_terms: true` and `display_name` (not `name`), else 400.
2. Preview companions 402 until `POST /pro/preview`.
3. SSE frames are **CRLF**-delimited (see §5).

---

## 4. The HTTP API

Base: `https://clardentity-backend.onrender.com/api/v1`. 55 routes. Full
machine-readable spec at `/openapi.json` — **generate your client models from
that**, don't hand-write them.

### Auth

```
POST /auth/register   { email, password, display_name?, accepted_terms }  → 201 { access_token, refresh_token, user }
POST /auth/login      { email, password }                                 → { access_token, refresh_token }
POST /auth/refresh    { refresh_token }                                   → { access_token, refresh_token }
GET  /auth/me                                                             → UserPublic
DELETE /auth/me                                                           → 204, deletes everything
POST /auth/oauth/google
POST /auth/password-reset/request | /auth/password-reset/confirm
```

- **Access token: 15 minutes. Refresh token: 30 days.** Bearer in
  `Authorization`.
- The web client stores them in `localStorage` under
  `clardentity_access_token` / `clardentity_refresh_token`. On mobile use the
  Keychain / EncryptedSharedPreferences — these are long-lived credentials.
- Refresh does **not** rotate a version counter, so refreshing from a second
  device no longer signs the first one out. (It used to; that was fixed in
  `5bea009`.) Only password reset and account deletion revoke.
- Client contract: on `401`, refresh once and retry the original request
  exactly once. See `frontend/lib/apiClient.ts`.
- `UserPublic.is_admin` is computed server-side on the way out; never trust a
  client copy of it, and the server re-checks on every admin call anyway.
- `UserPublic.onboarding_completed_at === null` means the account has not been
  through the first-run questions. The web client routes those users to
  `/welcome` before anything else. **An app must do the equivalent**, or
  profile inference starts with nothing.

### Getting into the app — one call

```
POST /bootstrap  { workspace_id?: uuid }   → {
  user, workspaces[], active_workspace_id, conversation_id, conversation_created
}
```

This replaced a three-call chain and is roughly **twice as fast** (measured
against production: ~1460ms → ~766ms). It resolves the workspace, reuses an
empty chat if one is lying about or creates one, and hands back everything
the shell needs. `workspace_id` is a *hint* — the last workspace the client
was in — honoured if the account still has it, ignored otherwise.

Use this as the app's launch call.

### Workspaces, conversations, messages

```
GET|POST   /workspaces
GET|PATCH|DELETE /workspaces/{id}

GET  /chat/conversations?workspace_id=…     ordered: pinned first, then last activity
POST /chat/conversations                    { workspace_id, default_mode?, title? }
GET|PATCH|DELETE /chat/conversations/{id}

GET  /chat/{conversation_id}/messages       the thread
POST /chat/{conversation_id}/messages       ← the streaming one, see §5
DELETE /chat/{conversation_id}/messages/{message_id}
PUT  /chat/{conversation_id}/active-leaf    move the branch pointer
PUT  /chat/{conversation_id}/messages/{id}/feedback
POST /chat/{conversation_id}/messages/{id}/devils-advocate
GET  /chat/{conversation_id}/export         markdown / pdf
POST /chat/{conversation_id}/call-transcript  save a finished voice call into the thread
GET  /chat/models                           which models this deployment can route to
```

**A conversation is a tree, not a list.** Messages carry `parent_id`,
`sibling_index`, `sibling_count` and `sibling_ids`; the conversation carries
`active_leaf_id`. Editing a message creates a sibling rather than destroying
what came after it, and regenerating creates a sibling answer. If your client
renders a flat list it will silently show one branch and lose the others — the
web client has a fork switcher (`< 2/3 >`) for exactly this.

### Everything else

| Area | Routes |
|---|---|
| Documents / RAG | `GET|POST /documents`, `/documents/upload`, `/documents/search`, `GET|DELETE /documents/{id}` |
| Profile | `GET|PUT|DELETE /profile`, `/profile/roles`, `/profile/aspects`, `/profile/onboarding`, `/profile/learning-role`, `/profile/rebuild`, `/profile/import` |
| Memory | `GET /memory/{conversation_id}`, `POST /memory/{conversation_id}/rebuild` |
| Audio | `POST /audio/transcribe`, `POST /audio/tts` |
| Voice call | `POST /realtime/session` (see §7) |
| Images | `GET /images/{owner_id}/{image_id}.webp` |
| Biases catalogue | `GET /biases`, `/biases/categories`, `/biases/decision-categories`, `/biases/{id}` |
| History | `GET /history/search` |
| Validation | `GET /validation/{message_id}` |
| Guest demo | `GET /guest/budget`, `POST /guest/chat`, `POST /guest/import` |
| Composer autocomplete | `POST /compose/complete` |
| Admin (404s for non-admins) | `GET /admin/overview`, `POST /admin/query`, `GET|PUT /admin/settings` |

---

## 5. The streaming protocol — read this twice

`POST /api/v1/chat/{conversation_id}/messages` returns **Server-Sent Events**,
not JSON. This is the most intricate part of the system and the place a new
client will lose the most time.

### Request body

```jsonc
{
  "content": "…",                 // required
  "mode": "knowing",              // required; no auto-detection
  "reasoning_lens": null,
  "model": null,                  // Learning + Co-Creative only, ignored elsewhere
  "attachments": [ { "type": "image"|"document", "data": "<base64>",
                     "mime_type": "…", "filename": "…" } ],
  "audio_duration_seconds": null,

  // gate acknowledgements — see below
  "mode_confirmed": false,
  "context_acknowledged": false,
  "context_rounds": 0,
  "refined_confirmed": false,
  "clarifying_confirmed": false,

  "parent_id": null,              // set when editing: the edited message's own parent
  "regenerate_of": null           // set instead of content/mode to re-answer
}
```

### Three things that will break a hand-rolled parser

1. **Frames are CRLF-delimited.** `sse-starlette` emits `\r\n`, so splitting on
   `\n\n` finds nothing and your client hangs forever looking at a stream
   that is arriving fine. Normalise `\r\n` → `\n` before splitting on a blank
   line. This has bitten this project more than once.
2. **A keep-alive ping arrives every 15 seconds.** Treat *any* bytes as a
   liveness signal. Silence means the connection is gone; a slow answer still
   pings. Don't time out on "no event for N seconds" — time out on no bytes.
3. **The stream can end without a terminal event** (dropped connection,
   server restart). If it ends after `answer`, the answer *exists and is
   committed* — re-read the conversation rather than showing a failure.

### The events

| Event | Payload | When |
|---|---|---|
| `status` | `{ phase, label }` | Named progress: `searching` / `reading` / `thinking` / `validating` / `image` / `slow`. The web client acts on `slow` and `image` only, and shows a generic indicator otherwise. |
| `review` | `{ decision_review?, thinking_review? }` | The verdict box. Usually before the gist. |
| `crux` | `{ text }` | The one-sentence bottom line, complete, **before any body text**. Show this first. |
| `delta` | `{ text }` | Body tokens. |
| `image` | `{ id, owner, prompt }` | Co-Creative only. Often lands *after* the text. Render from `/images/{owner}/{id}.webp`. Also carried on the message for reloads. |
| `answer` | `{ message, user_message? }` | **Answer written and committed.** Re-enable the composer here, not at `final`. `user_message` carries the real server id for the question — swap it for your optimistic copy or you can never address that row again. Absent on regenerate. |
| `final` | `{ message, claims[], confidence, avatar_cue, counterfactual_content, research_notes[], conversation_title? }` | Verification and scoring finished — several seconds after `answer`. |
| `error` | `{ detail }` | One sentence, safe to show. |

Typical order: `status` → `review?` → `crux` → `delta`×N → `answer` →
`image?` → `final`.

### The four gates — the part that is genuinely unusual

Before generating anything, the server may stop and ask a question. When it
does, **exactly one gate event is sent and nothing else** — no answer, no
`final`, and *nothing is written to the database*. The turn is exactly where
it was.

| Event | Payload | Re-send with |
|---|---|---|
| `refined_question` | `{ refined_question, refinement_reason }` | the refined wording or the original, **plus `refined_confirmed: true` either way** |
| `clarifying_options` | `{ question, options[] }` | a tapped option / typed answer / nothing, plus `clarifying_confirmed: true` |
| `context_question` | `{ question }` | the user's context appended, or `context_acknowledged: true` to skip; increment `context_rounds` |
| `mode_suggestion` | `{ suggested_mode, mode_reason }` | the chosen mode plus `mode_confirmed: true` |

The `*_confirmed` flags are how the server knows not to ask the same thing
twice. **If your client drops them, the user gets the same question forever.**

Two more rules worth knowing:
- Only one gate fires per turn, and a message that already answered a gate
  (the client embeds `(Clardentity asked: …)` into the resent content) is not
  gated again, except that a mode suggestion may still follow once.
- **Image requests in Co-Creative skip all four gates.** Asked for a logo, the
  product used to reply "did you mean…" and draw nothing.

### A correct minimal reader

Pseudo-code, but the three awkward parts are real — CRLF, the bytes-as-
liveness rule, and ending without a terminal event:

```python
buf, saw_terminal = "", False
with post(f"{API}/chat/{conversation_id}/messages", json=body, stream=True) as r:
    for chunk in r.iter_content():
        buf += chunk.decode("utf-8", "replace").replace("\r\n", "\n")  # (1) CRLF
        touch_liveness_timer()                                          # (2) any bytes
        while "\n\n" in buf:
            frame, buf = buf.split("\n\n", 1)
            event = data = None
            for line in frame.split("\n"):
                if line.startswith("event:"):  event = line[6:].strip()
                elif line.startswith("data:"): data  = line[5:].strip()
            if not event:
                continue                      # keep-alive comment
            payload = json.loads(data) if data else None

            if event == "delta":   append(payload["text"])
            elif event == "crux":  show_gist(payload["text"])
            elif event == "answer":
                enable_composer()             # committed here, not at `final`
                swap_optimistic_id(payload.get("user_message"))
            elif event == "image": show_image(payload)
            elif event == "final":
                saw_terminal = True; apply_claims(payload)
            elif event == "error":
                saw_terminal = True; show(payload["detail"])
            elif event in GATES:              # the four in the table above
                saw_terminal = True; ask_user_then_resend_with_flag(event, payload)

if not saw_terminal:
    # (3) dropped. If `answer` already arrived the answer exists — re-read
    # the conversation instead of showing a failure.
    reload_conversation()
```

### Guest stream

`POST /guest/chat` is unauthenticated, for the landing-page demo. Simpler
protocol: `delta`, then `done` with
`{ text, used, budget, limit_reached }`, or `error`. Budget is **5,000 tokens
per browser session**, plus a per-address and a global daily ceiling. When
`limit_reached` is true the client stashes the transcript and
`POST /guest/import` writes it into the account after sign-up.

---

## 6. Data model

Fifteen tables. The ones a client touches:

```
users ──< workspace_members >── workspaces ──< conversations ──< messages
                                     │                              ├─< message_claims ──< claim_evidence
                                     │                              ├─< citations
                                     │                              └─< audio_transcripts
                                     └─< documents ──< document_chunks   (pgvector)
user_profiles        conversation_memory        admin_settings        pro_interest
```

`messages` carries far more than text: `mode_used`, `reasoning_lens`,
`confidence_score`, `confidence_band`, `crux_text`, `clarifier`, `guidance`,
`decision_review`, `thinking_review`, `generated_image`, `feedback`,
`counterfactual_content`, `token_usage`, and the tree columns.

`token_usage` is written per turn (input, output, calls, and a per-model
split) but **is not exposed on any message-reading endpoint** — only
aggregated in the admin overview. If the app needs to show spend, that's a
new field on the message schema.

---

## 7. Voice

Two separate things:

**Dictation** — `POST /audio/transcribe` with a recording, get text back. Put
it in the composer. Rate-limited to 20/minute.

**Live call** — `POST /realtime/session` mints a **short-lived ephemeral
client secret**, and the client then opens a **WebRTC peer connection
directly to OpenAI's realtime endpoint**. Audio never goes through our
backend; it couldn't, latency-wise. Our API key is never on the client.

For a native app this is the one flow you can't port by copying the web
code — `frontend/lib/liveCall.ts` uses `RTCPeerConnection` directly. Use the
platform's WebRTC SDK with the same ephemeral secret.

Calls run **outside** the claim-scoring pipeline (retrieval and verification
take seconds, which is fatal between spoken turns), so there are no
citations and no confidence band. A finished call is saved into the thread
via `POST /chat/{id}/call-transcript` and is stored unscored on purpose.

---

## 8. Mobile: what exists, and what to watch

The web app is responsive today and installable as a PWA. It is **not** a
native app, and a few of its tricks are web-only.

### Breakpoints

Effectively two: `sm:` (640px, used ~96 times) and `lg:` (1024px, ~15 times).
`md:` is used twice and `xl:` for a few wide-screen refinements. So the
design is **phone → tablet/desktop**, with `lg:` as the line where the
sidebar stops being a drawer:

- below `lg`: sidebar is an overlay drawer (`mobileOpen` in `AppShell.tsx`),
  opened from a hamburger.
- at `lg` and above: a fixed 287px sidebar (`--sidebar-width`) that can be
  collapsed, and slides out of view rather than unmounting so collapsing it
  does not refetch the workspace list.

### The `zoom: 0.85` trap — read before measuring anything

`:root` carries `zoom: 0.85` (guarded by `@supports (zoom: 1)`). Two
consequences that have cost real time:

1. **`getBoundingClientRect()` returns screen pixels; `offsetWidth` and fixed
   `position` offsets are layout pixels.** Mixing them puts things 15% off in
   both axes. Divide the rect by the zoom before combining them. The landing
   page's demo-panel animation does exactly this.
2. **`vh` is measured on the unzoomed viewport**, so a `100vh` box leaves a
   band at the bottom. Anything full-height uses
   `calc(var(--app-vh) * 100)` instead, where `--app-vh: calc(1vh / var(--ui-zoom))`.

A native app has neither problem — but if you touch the web view, both apply.

### On-screen keyboards

`frontend/lib/useTouchKeyboard.ts` detects `(pointer: coarse) and (hover: none)`
and **flips what Enter does**: new line on touch, send on a real keyboard.
This matters — Enter-to-send on a phone made paragraphs impossible to type
and sent half-written questions. A laptop with a touchscreen still reports a
fine pointer and keeps Enter-to-send, which is correct.

The composer stacks on narrow screens: textarea gets the full width, controls
get their own row underneath (`sm:contents` dissolves the wrapper above the
breakpoint). At 390px the five controls and the textarea previously fought
over one row and the textarea lost.

### PWA

`frontend/app/manifest.ts`: `display: standalone`, `start_url: /workspace`
(signed-out users get bounced to `/login`, which is where they were going),
`theme_color` / `background_color` `#121013`, and a **separate maskable
icon** because Android crops `any` icons to its own shape and ate the
antenna. `appleWebApp.statusBarStyle` is `black-translucent`.

### The service worker — the single most recurring trap in this repo

`frontend/public/sw.js` serves `/_next/static/*` **cache-first**. That is safe
because those filenames are content-addressed, but it means:

> **A shipped fix does not reach a browser that already has the app open.**

The only thing that evicts it is bumping `const CACHE = "clardentity-shell-vN"`,
whose `activate` deletes every cache that isn't the current name. It is at
**v7** and has been bumped for exactly this reason several times. When
verifying a change locally, clear caches *and* unregister the worker *and*
reload twice, or you will measure the old bundle — which has happened here
twice in one sitting.

API traffic, SSE and navigations are never cached, deliberately.

### Theming

Light and dark, keyed off `data-theme` on an element — not
`prefers-color-scheme` — so the in-app toggle can override the OS. An inline
script stamps it before first paint. The dark palette has four real surface
steps and **no `#000`** in it. Because the selector matches any element (not
just `:root`), you can theme a subtree: the landing page's guest demo does
this to show the real dark chat UI over a light page.

---

## 9. Limits and failure modes to design for

| Thing | Limit |
|---|---|
| Send a message | 20 / minute / user |
| Transcribe, TTS | 20 / minute / user each |
| Feedback | 30 / minute / user |
| Composer autocomplete | 240 / 5 min / user |
| Login, register | 10 / 5 min / IP |
| Refresh | 30 / 5 min / IP |
| Guest demo | 30 / 10 min / IP, 5,000 tokens / session |
| Image attachment | 5 MB |
| Document attachment | 25 MB |

Expected response times, measured on production:

- First token: **~7–9s** on the default models; the pipeline spends ~6s before
  generation on search planning, the gates, retrieval and context assembly.
- `final` (verification done): ~15–30s after send.
- Gemini and Grok are slower than Claude/OpenAI even after capping their
  reasoning effort; Grok was 93s to first token before that cap and is ~24–37s
  now.
- Image generation: ~25s end to end, returned as WebP (~250KB).
- Cold start after inactivity: several seconds on top of all of the above.

A mobile client should show named progress rather than a spinner. The server
already sends `status` events for this; **the web client currently ignores
all but `slow` and `image`** and shows a generic "Thinking…". If you want the
phases on mobile, they are already on the wire.

---

## 10. File map

```
backend/app/
  api/            one module per route group — chat.py is the big one (2,368 lines)
  services/       the pipeline: prompt_builder, guidance, retrieval, web_research,
                  verification_agent, confidence_scoring, image_generation,
                  model_catalog, model_router, extra_providers, token_meter …
  models/         SQLAlchemy tables
  schemas/        Pydantic request/response shapes
  data/           biases.json, decisions.json, roles.json (reference taxonomies)
  core/           config (every setting + env var), security, rate_limit, celery
backend/tests/    445 tests; DB-backed ones skip when no database is reachable
backend/alembic/  migrations, run at boot by start.sh

frontend/
  app/            routes (App Router) — /chat/[id], /workspace, /start, /welcome, /admin …
  components/
    chat/         ChatView (the orchestrator), MessageList, MessageInput, ModeSelector …
    marketing/    LandingPage, GuestDemo (mounts the real chat components)
    system/       AppShell, RequireAuth, AppNotices
  lib/            sse.ts (the streaming client), apiClient.ts, auth.tsx, modes.ts …
  public/sw.js    the service worker

scripts/deploy-backend.sh    triggers a Render deploy and waits for it to actually land
docs/                        this file, DEPLOYMENT.md, the SRS and taxonomy PDFs
```

Start with `frontend/lib/sse.ts` and `backend/app/api/chat.py`. Between them
they define the contract everything else hangs off.

The code is heavily commented, and the comments explain *why* rather than
restating the line — several record a bug that the current shape exists to
prevent. They are worth reading before changing the thing they sit on.

---

## 11. Conventions

- **"Done" means live.** A change is finished when it is committed, pushed
  (Vercel auto-deploys the frontend) and, for the backend,
  `scripts/deploy-backend.sh --wait` has reported `live`. That script polls
  the deploy's own status; `/health` answers 200 from the *old* instance for
  the whole build, so it proves nothing.
- Branches go **in this repo**, not a fork. Vercel refuses to deploy a fork's
  PR without manual authorisation — "Authorization required to deploy" — and
  that's deliberate: a fork's preview would get the project's environment.
  You have write access; use `git push origin your-branch`.
- Bugs and suggestions live in the *suggestions/bugs* Google Sheet, seven
  columns, `Fixed - live` as the only "done".
- Secrets live in `.secrets/` (gitignored) and in Render's environment. The
  repo is public — nothing with a credential in it goes in a file.
- Don't add generated output to git. `graphify-out/` is currently tracked at
  9.8 MB / 179 files, which is already a third of the repository's history.
