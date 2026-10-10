# Clardentity regression matrix

How to run it: see `SKILL.md`. Kinds: **script** = `scripts/regression/smoke.py`
row of the same ID · **test** = backend pytest (file named) · **browser** =
walked by hand at 1280×860.

Add a row for every feature that ships and every bug found. Retire, never delete.

## A. Landing, signed out
| ID | Proves | Kind |
|---|---|---|
| A1 | Landing renders; curtain stage visible; banner cycles companions | browser |
| A2 | "Log in" (signed out only) → /login; "Start exploring" → /register | browser |
| A3 | "See how it works" anchor scrolls | browser |
| A4 | Analytics consent prompt appears; "No thanks" dismisses it | browser |

## B. Landing demo - must answer exactly like the signed-in chat
| ID | Proves | Kind |
|---|---|---|
| B1 | Opens from the banner, grows out of the stage, curtain behind; welcome reads "Hi, Welcome to Clardentity." with no mention of accounts | browser |
| B2 | All 8 companions selectable, none locked; composer has attach, call, mic, send, Switching; **no tier chip** | browser |
| DEMO-FINDER | Finder answer has gist (crux event first), claims with evidence, sources, confidence band; not every claim tagged opinion; budget event last | script |
| DEMO-DECISION | Decision-making answer has the verdict box (`review` event + `decision_review`), gist, claims | script |
| DEMO-THOUGHT | Thought coach answer has `thinking_review`, gist, claims | script |
| DEMO-QUICK | Quick answer (rapid) returns an unchecked answer with no claims, no gates | script |
| DEMO-GATES | Pre-answer questions arrive as the app's events and stop the turn | script |
| DEMO-SWITCH | Smart switching moves a question (`switched` event); a miss is a judgement call (SKIP) | script |
| B3 | In the browser: gist card leads with the rabbit under it; then "Likely Fact"-style badge (Finder), Devil's Draft toggle, "Show full answer", citation markers, Sources list | browser |
| B4 | Decision-making in the browser: decisions box with bias tags above the gist; "Details of the decision making journey" | browser |
| B5 | Context-question card: answer it → answered turn; "Answer without this" → answered turn | browser |
| B6 | Switch toast (4s ring, "Stay in X") then banner "Switched to X - … Back to Y"; labels use the app's spelling ("Thought coach") | browser |
| B7 | Quick answer button appears after 7s with no gist and returns an instant answer | browser |
| B8 | Regenerate replaces the last answer; edit a question re-asks from there; delete truncates | browser |
| B9 | Gated controls (attach, call, mic, Co-Creative model chip) each show their account card | browser |
| B10 | New chat resets the thread, keeps the mode; Close returns to landing; Esc stops a running answer, closes otherwise | browser |
| B11 | 5,000-token wall: "Save it to a free account" → sign up → "Your demo conversation is saved" → opened thread shows gists, verdict boxes and pictures, per-turn companions, no confidence badges | browser + test (`test_guest_demo.py::test_the_answer_comes_across_as_it_looked`) |
| B12 | Visitor is charged for the conversation (answer output + their words), not for sources or checking; address/daily ceilings charged in full | test (`test_guest_demo.py`) |
| B13 | Co-Creative in the demo can draw, and "now make it …" edits its own last picture (owner forced to the visitor's session) | browser |

## C. Auth and welcome
| ID | Proves | Kind |
|---|---|---|
| AUTH-REGISTER | Register (name, email, password, terms) → 201 | script |
| AUTH-BOOTSTRAP | One call returns user, workspaces and an empty chat | script |
| AUTH-DELETE | Delete account → 204 | script |
| C1 | Terms unchecked is refused; wrong password refused; forgot-password reachable | browser |
| C2 | /welcome shows "Welcome to Clardentity, <first name>"; Skip keeps typed answers | browser |
| C3 | First visit: no "Welcome back" notice; night band says "Hello, night owl" | browser |
| C4 | Returning visit (>20 min after onboarding): "Welcome back, <name>" notice once per tab; time-of-day heading + "Let's accomplish something today." | browser |
| C5 | Log out → /login; log in → back in | browser |

## D. Core chat (signed in)
| ID | Proves | Kind |
|---|---|---|
| APP-FINDER | Finder answer: gist, claims with evidence, band | script |
| D1 | Composer re-enables at `answer`, before checking finishes; placeholder "Writing the answer…" while generating | browser |
| D2 | Stop cancels mid-answer; Quick answer appears after 7s | browser |
| D3 | Auto-title from the first exchange | browser |
| D4 | Copy, feedback up/down, regenerate (sibling + fork switcher), edit (branch), delete | browser |
| D5 | Devil's Draft flip; export conversation | browser |
| D6 | Empty context never yields all-opinion claims or a "no documents" disclaimer | test (`test_answer_pipeline.py`) + script (DEMO-FINDER, APP-FINDER) |

## E. Modes, plans and gating
| ID | Proves | Kind |
|---|---|---|
| E1 | All 8 modes in the rail; preview modes 402 until unlocked; unlock → they work | browser + test (`test_api_contract.py`) |
| E2 | **No tier chip in any mode's composer** | browser |
| E3 | Account menu: Profile · Settings · **Upgrade** · Log out; Upgrade shows Clar Basic (your plan) · Clar Pro · Clar Max · Clar Ultra, gem icons, **no PRO pills**, detail card on hover; a locked tier opens the plans dialog | browser |
| MODELS-CO-CREATIVE-ONLY | Named-model list in Co-Creative only (`/chat/models?mode=learning` empty) | script + test (`test_answer_pipeline.py`) |
| E4 | Learning role card offers student and teacher only (no "Just visiting"); no model picker in Learning | browser |
| E5 | Picking a named model in Co-Creative routes to it | browser |

## F. The four pre-answer gates
| ID | Proves | Kind |
|---|---|---|
| F1 | Order: rewording → options → why → companion; one question about the question at most; why stops at the round cap; pictures go round all four | test (`test_answer_pipeline.py`) |
| F2 | Each gate's card works and re-sends correctly (app and demo) | browser |

## G. Co-Creative images
| ID | Proves | Kind |
|---|---|---|
| G1 | "Draw me X" produces an image, no prose denial | browser |
| IMAGE-EDIT-ATTACHED | An attached image + instruction → `/images/edits` with the attachment as reference | script (`--images`) + test (`test_image_generation.py`) |
| IMAGE-EDIT-PREVIOUS | "Now make it …" with no attachment edits the last picture drawn | script (`--images`) |
| IMAGE-SERVED | The picture is served from `/images/<owner>/<id>.webp` | script (`--images`) |
| G2 | Image survives reload; prose request in Co-Creative still answers normally | browser |

## H. Workspaces and documents
| ID | Proves | Kind |
|---|---|---|
| H1 | Create / rename / delete a workspace | browser |
| H2 | Upload a document → ingested; a grounded question cites it; list + delete | browser |
| H3 | Workspace search and history search | browser |

## I. Shell and navigation
| ID | Proves | Kind |
|---|---|---|
| I1 | Sidebar: new chat, recents, workspace switcher; collapse persists | browser |
| I2 | Pin / rename / delete a conversation; deep link to /chat/<id>; back/forward | browser |

## J. Profile and settings
| ID | Proves | Kind |
|---|---|---|
| J1 | Profile renders; roles include "teacher"; add/remove an aspect | browser |
| J2 | Light/dark, companion rename, accent colour | browser |

## K. Voice
| ID | Proves | Kind |
|---|---|---|
| K1 | Dictation asks for the mic and transcribes | browser |
| K2 | Live call opens; transcript saves into the thread | browser |

## L. Security and cross-cutting
| ID | Proves | Kind |
|---|---|---|
| HEALTH | /health 200 with database, redis, storage ok | script |
| SEC-API-HEADERS | API responses carry nosniff, X-Frame-Options DENY, Referrer-Policy no-referrer | script + test (`test_security.py`) |
| SEC-CORS | A foreign origin's preflight gets no Allow-Origin | script |
| SEC-APP-HEADERS | App serves CSP (default-src 'self', object-src 'none', frame-ancestors 'none', base-uri 'self'), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy | script |
| SEC-SOURCEMAPS | Source maps are not served | script |
| SEC-BUNDLE-SECRETS | No API keys in shipped JS (PostHog's public key is expected) | script |
| L1 | No CSP violations in the console across landing, demo, login (Google button), chat, images, live call | browser (production build) |
| L2 | No console errors / failed requests on the main flows | browser |
| L3 | Service worker serves the current build (`CACHE` bumped) | browser |
| L4 | Admin dashboard hidden from a normal account; 404 route behaves | browser |
| L5 | Answer text is rendered as escaped text with no links; source links are `rel="noopener noreferrer nofollow"` | code review on change |

## M. Mobile and responsive (Aditya's Playwright suite)
| ID | Proves | Kind |
|---|---|---|
| E2E-SUITE | T01-T15 desktop, M01-M47 phone layouts (drawer, swipe, keyboard, gates, offline, error screens, tap targets), A11Y-1..3 axe scans - on Chrome, Pixel 7 and iPhone 14 | e2e |
| E2E-1 | Unset repository secrets arrive as "" - fixtures fall back with `||`, never `??` | e2e (T03, M04, M17) |
| E2E-2 | Accessibility scans wait for finite entrance animations before measuring contrast | e2e (A11Y-2) |

## Run log
| Date | Target | Commit | Result | Notes |
|---|---|---|---|---|
| 2026-10-10 | local (prod build) | pre-commit | 20/20 script after a harness fix; 472 tests; browser B1-B7, B9, B10, C2-C4, E2-E4, G1, IMAGE-*, L1 | Found and fixed: all-opinion claims on empty context; demo missing gist/claims/verdict/gates/switch toast/Quick answer; no browser security headers |
| 2026-10-10 | prod | fb0d41c | 20/20 script (`--images`); browser B1, B3, L1 (login + Google button, demo), SEC headers live | Rebased onto the mobile-view merge first (AccountMenu and sw.js conflicts resolved; cache now v12). E2E workflow dispatched (run 38030338040). |
| 2026-10-10 | CI (e2e.yml) | fbe76a8 | 134 passed, 17 skipped (live/visual need secrets), 0 failed | Runs 1-2 failed on the suite, not the app: blank credentials from unset secrets (T03/M04/M17), M39's 127.0.0.1 stream vs the new CSP (test-only `CSP_EXTRA_CONNECT_SRC`), A11Y-2 scanning mid-fade. |
