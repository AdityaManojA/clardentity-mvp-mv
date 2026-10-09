# Graph Report - clardentity-mvp-mv  (2026-10-10)

## Corpus Check
- 342 files · ~377,604 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 5, .ini 2, .css 2)

## Summary
- 3205 nodes · 7779 edges · 171 communities (136 shown, 35 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 301 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f3788135`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- tour.tsx
- ChatView.tsx
- parse_export
- security.py
- models/__init__.py
- taxonomy.py
- document_ingestion.py
- Clardentity — technical guide
- ._fixture
- guest_demo.py
- primitives.tsx
- client
- schemas/chat.py
- deps.py
- fixtures.ts
- _accent_instructions
- anthropic_client.py
- email_service.py
- guestHandoff.ts
- openai_client.py
- auth.tsx
- cx
- package.json
- admin_settings_service.py
- sqlalchemy
- test_anthropic_client.py
- api/biases.py
- get_conversation_for_user
- pydantic
- web_research.py
- test_message_tree.py
- extract_pages
- api/admin_dashboard.py
- documents.py
- api/pro.py
- _serialize
- api/chat.py
- confirm_password_reset
- previewAccess.ts
- Clardentity — technical guide
- LearningRoleCard.tsx
- geolocation.py
- AdminDashboard.tsx
- test_scoring.py
- _Response
- env.py
- workspaces.py
- .test_rejected_seed_falls_through_to_a_search
- token_meter.py
- image_generation.py
- decision_classifier.py
- react
- compilerOptions
- test_transcription_guards.py
- _flat
- backend_client.py
- evaluators.py
- run.py
- app/layout.tsx
- BackendClient
- services/__init__.py
- extract_claims
- api/auth.py
- health.py
- MessageList.tsx
- clean_names
- get_profile
- office_export.py
- test_learning_role.py
- model_router.py
- clean_output
- generate_structured
- CruxSplitter
- StartChat.tsx
- pdf_source.py
- _validate_clarifying_options
- analytics.ts
- _validate_context_question
- test_admin_dashboard.py
- decision_review.py
- test_guidance.py
- build_system_instructions
- api/profile.py
- ClaimTagStripper
- test_claim_parser.py
- split_leading_sentence
- ErrorBoundaries.tsx
- Layer by layer
- export_service.py
- privacy/page.tsx
- Better_docs/README.md
- infer_profile
- storage.py
- _content_blocks
- fake
- test_prompts.py
- TestIdentity
- cached
- .test_pictures_skip_the_gates_and_prose_does_not
- claim_parser.py
- LiveCall
- _portable_schema
- main
- asyncio
- apiFetch
- consent.ts
- strip_opinion_preface
- InstallAppButton.tsx
- Local development
- model_catalog.py
- nspell
- _CircuitBreaker
- MessageInput.tsx
- TestTheSearchResultsGetTheBetterExcerpt
- TestRoutes
- e0f1a2b3c4d5_legal_mode.py
- build_conversation_input
- 4. Mobile production readiness
- guest.py
- Deploying Clardentity
- CorrelationIdMiddleware
- _flat
- bootstrap
- _CircuitBreaker
- FullScreenError
- ConversationCreate
- deploy-backend.sh
- Analytics
- start.sh
- postcss.config.mjs
- thinking_review.py
- CitationPopover.tsx
- compute_avatar_cue
- load_claims_for_messages
- SourcesFooter.tsx
- _round_queries
- TestFallbackToolTranslation
- propose_guidance
- sync-upstream.sh
- _worth_retrying
- demo-api.mjs
- TestGuidanceSeesTheConversation
- TestModes
- check_rate_limit
- 5. The streaming protocol — read this twice
- rules/graphify.md
- workflows/graphify.md
- TestRenameAndPin
- warmup.ts
- test_ingestion.py
- .test_it_asks_and_saves_nothing
- needs_live_data
- TestAuthGuards
- TestCoCreativeNeverDeniesIt
- TestMessageForking
- frontend/README.md
- TestRefreshAcrossDevices
- TestMoveConversation
- TestOnboardingAndAccountDeletion
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `cx()` - 98 edges
2. `react` - 80 edges
3. `apiFetch()` - 64 edges
4. `send_message()` - 61 edges
5. `authErrorMessage()` - 61 edges
6. `ChatView()` - 46 edges
7. `track()` - 46 edges
8. `event_stream()` - 45 edges
9. `generate_structured()` - 36 edges
10. `Spinner()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `Auto-deploy on push isn't wired up` --references--> `main()`  [INFERRED]
  DEPLOYMENT.md → evals/run.py
- `Status` --references--> `main()`  [INFERRED]
  DEPLOYMENT.md → evals/run.py
- `1. Input & Knowledge — ~90%, effectively done` --references--> `build_context_block()`  [INFERRED]
  docs/learning-layer-gap.md → backend/app/services/prompt_builder.py
- `10. Setup steps (Aditya)` --references--> `main()`  [INFERRED]
  Better_docs/Mv.md → evals/run.py
- `1. Upstream sync` --references--> `main()`  [INFERRED]
  Better_docs/Mv.md → evals/run.py

## Import Cycles
- None detected.

## Communities (171 total, 35 thin omitted)

### Community 0 - "tour.tsx"
Cohesion: 0.22
Nodes (17): advanceTour(), endTour(), getServerTourSnapshot(), getTourSnapshot(), IDLE_STATE, readStoredState(), setTourState(), startTour() (+9 more)

### Community 1 - "ChatView.tsx"
Cohesion: 0.04
Nodes (61): ChatPage(), PageProps, Arm(), ARM_ANGLES, AvatarExpression, AvatarGesture, AvatarPanel(), AvatarState (+53 more)

### Community 2 - "parse_export"
Cohesion: 0.10
Nodes (23): _clean(), _looks_like(), _parse_chatgpt(), _parse_claude(), parse_export(), _parse_gemini(), ValueError, Reading a user's history out of another assistant's export. There is no API for… (+15 more)

### Community 3 - "security.py"
Cohesion: 0.13
Nodes (20): create_access_token(), create_password_reset_token(), create_refresh_token(), decode_token(), InvalidTokenError, password_fingerprint(), Exception, UUID (+12 more)

### Community 4 - "models/__init__.py"
Cohesion: 0.11
Nodes (35): hash_password(), Base, Conversation, DocumentChunk, AudioTranscript, Citation, ClaimEvidence, Message (+27 more)

### Community 5 - "taxonomy.py"
Cohesion: 0.19
Nodes (20): _alias_keys(), all_biases(), Bias, bias_categories(), bias_category_for_decision(), _bias_data(), BiasCategory, get_bias() (+12 more)

### Community 6 - "document_ingestion.py"
Cohesion: 0.12
Nodes (18): build_chunks(), chunk_text(), _html_text(), pdf_page_text(), _pdf_pages(), UUID, One PDF page as text, with any tables laid out as rows. A PDF has no idea it…, Extract, chunk and embed one file: the rows to insert, not yet added to any… (+10 more)

### Community 7 - "Clardentity — technical guide"
Cohesion: 0.09
Nodes (22): 10. File map, 11. Conventions, 1. What the product is, 2. Topology, 3. Running it locally, 4. The HTTP API, 6. Data model, 7. Voice (+14 more)

### Community 8 - "._fixture"
Cohesion: 0.25
Nodes (4): Thumbs up/down plus an optional comment on one answer. Needs a database - a…, DELETE .../messages/{id}: a real, cascading delete - the one destructive…, TestMessageDeletion, TestMessageFeedback

### Community 9 - "guest_demo.py"
Cohesion: 0.05
Nodes (38): _address(), guest_budget(), guest_chat(), _limit_reached(), EventSourceResponse, get, Request, UUID (+30 more)

### Community 10 - "primitives.tsx"
Cohesion: 0.08
Nodes (43): ForgotPasswordPage(), LoginPage(), RegisterPage(), ResetPasswordForm(), ResetPasswordPage(), LegalLayout(), QUESTIONS, WelcomePage() (+35 more)

### Community 11 - "client"
Cohesion: 0.15
Nodes (9): AsyncClient, client(), An account cannot be created without accepting, and what was accepted is…, Signing in used to be three sequential calls before a chat appeared. What…, A call that saved but cannot be read is a call that vanished. The endpoint's…, TestASavedCallIsReachable, TestBootstrapIsOneRoundTrip, TestPasswordResetContract (+1 more)

### Community 12 - "schemas/chat.py"
Cohesion: 0.19
Nodes (16): ActiveLeafIn, CallTranscript, CallTurn, ClaimOut, ConversationOut, ConversationUpdate, EvidenceOut, ExportFileIn (+8 more)

### Community 13 - "deps.py"
Cohesion: 0.12
Nodes (29): One call between signing in and seeing a chat. Getting into the app used to be…, Help with the message before it is sent: inline completion. As the user types,…, get_current_user(), User, Live call: ephemeral credentials for the browser's WebRTC session. The browser…, Settings, get_db(), AsyncSession (+21 more)

### Community 14 - "fixtures.ts"
Cohesion: 0.05
Nodes (54): ADMIN_STATE, AUTH_DIR, USER_STATE, accounts, openChat(), failed, flaky, report (+46 more)

### Community 15 - "_accent_instructions"
Cohesion: 0.07
Nodes (29): _accent_instructions(), CallContext, _clean(), create_realtime_session(), AsyncSession, BaseModel, post, User (+21 more)

### Community 16 - "anthropic_client.py"
Cohesion: 0.09
Nodes (37): _base_kwargs(), _claude_generate_structured(), _claude_generate_text(), _claude_stream_generation(), _create_message(), DeltaEvent, DoneEvent, _drop_temperature() (+29 more)

### Community 17 - "email_service.py"
Cohesion: 0.14
Nodes (18): email_enabled(), password_reset_html(), Transactional email via Resend. Deliberately a no-op when `RESEND_API_KEY` is…, Returns True if the provider accepted it. Never raises., send_email(), welcome_html(), UUID, Out-of-band on purpose: sign-in must never wait on a third party, and a failed… (+10 more)

### Community 18 - "guestHandoff.ts"
Cohesion: 0.14
Nodes (26): ChatGreeting(), subscribe(), AppNotices(), claimTheGreeting(), SavedFromDemo(), subscribe(), WelcomeBack(), firstNameOf() (+18 more)

### Community 19 - "openai_client.py"
Cohesion: 0.11
Nodes (34): _build_input(), _create_embeddings(), _create_response(), _create_speech(), _create_transcription(), DeltaEvent, DoneEvent, embed_text() (+26 more)

### Community 20 - "auth.tsx"
Cohesion: 0.08
Nodes (35): handlePlayAudio(), ExportFileMenu(), download(), FORMATS, DependencyStatus, HealthResponse, LoadState, EXPECTED_LANGUAGES (+27 more)

### Community 21 - "cx"
Cohesion: 0.06
Nodes (45): ModeSelector(), RefinedQuestionCard(), CompanionNames(), commit(), AccountMenu(), Chevron(), GearIcon(), LeaveIcon() (+37 more)

### Community 22 - "package.json"
Cohesion: 0.05
Nodes (43): eslintConfig, dependencies, dictionary-en, dictionary-en-gb, next, nspell, posthog-js, react (+35 more)

### Community 23 - "admin_settings_service.py"
Cohesion: 0.15
Nodes (17): Any, get_settings(), AsyncSession, get, put, User, update_setting(), AdminSetting (+9 more)

### Community 25 - "test_anthropic_client.py"
Cohesion: 0.14
Nodes (12): CircuitBreakerOpenError, is_provider_unavailable_error(), _supports_effort(), _FakeAPIError, Exception, The provider-shim behaviour, which is where a migration hides its bugs. The…, Stands in for anthropic/openai SDK exceptions, both of which carry a…, What chat.py shows the user when a generation fails: this decides whether it's… (+4 more)

### Community 26 - "api/biases.py"
Cohesion: 0.36
Nodes (12): get_bias(), list_biases(), list_categories(), list_decision_categories(), get, User, _to_out(), BiasCategoryOut (+4 more)

### Community 27 - "get_conversation_for_user"
Cohesion: 0.14
Nodes (36): _all_messages(), _conversation_out(), create_conversation(), delete_conversation(), delete_message(), devils_advocate(), export_conversation(), export_file() (+28 more)

### Community 28 - "pydantic"
Cohesion: 0.10
Nodes (22): AsyncSession, post, UploadFile, User, transcribe(), tts(), get_memory(), AsyncSession (+14 more)

### Community 29 - "web_research.py"
Cohesion: 0.16
Nodes (21): gather_context(), _merge_sources(), Web research with a supervisor that doesn't take the first answer. Used when…, What the loop settled on, and how it got there., One Tavily query. Empty on any failure - the caller has other queries in flight…, Replace the search engine's excerpt with the document's own tables, where the…, Interleave the branches' results so each angle gets a fair share of the cap,…, One search-and-summarise call. Goes to OpenAI's search tool first, by… (+13 more)

### Community 30 - "test_message_tree.py"
Cohesion: 0.11
Nodes (18): active_path(), descendants(), latest_leaf(), UUID, The active branch of a conversation - forking's replacement for a flat message…, Descend from `from_id`, always taking the most recently created child, until…, Root-to-leaf order. `messages` must be every row for the conversation the leaf…, Every message sharing `of`'s parent (or every root message of the same… (+10 more)

### Community 31 - "extract_pages"
Cohesion: 0.16
Nodes (11): _decode(), extract_pages(), Returns (page_number, text) pairs. page_number is 1-indexed for PDFs and slide…, _rtf_text(), _column_ordered_pdf(), Reading a PDF that contains a table. A PDF has no idea it contains a table. The…, A ruled price list whose cells are drawn column by column., The premise of the fix, pinned. If this ever stops being true the fixture has… (+3 more)

### Community 32 - "api/admin_dashboard.py"
Cohesion: 0.19
Nodes (18): dynamic_query(), _jsonable(), overview(), AsyncSession, get, post, User, The administrator's view: who is signed up, and what they are costing. Read-… (+10 more)

### Community 33 - "documents.py"
Cohesion: 0.17
Nodes (26): AsyncSession, UUID, require_workspace_member(), delete_document(), _excerpt_around(), get_document(), list_documents(), AsyncSession (+18 more)

### Community 34 - "api/pro.py"
Cohesion: 0.13
Nodes (25): close_preview(), open_preview(), _preview_status(), AsyncSession, delete, get, post, User (+17 more)

### Community 35 - "_serialize"
Cohesion: 0.15
Nodes (25): add_aspect(), clear_profile(), complete_onboarding(), import_history(), AsyncSession, delete, post, put (+17 more)

### Community 36 - "api/chat.py"
Cohesion: 0.06
Nodes (44): _derive_title(), _in_background(), _ingest_attachments(), _no_text(), EventSourceResponse, A document attached to a message becomes a workspace document - stored,…, A short label for a conversation, from its opening message. Deliberately not an…, A generation that produces nothing, for a turn whose answer is a picture.… (+36 more)

### Community 37 - "confirm_password_reset"
Cohesion: 0.20
Nodes (24): _client_ip(), confirm_password_reset(), delete_me(), ensure_workspace(), _issue_tokens(), login(), oauth_google(), provision_new_user() (+16 more)

### Community 38 - "previewAccess.ts"
Cohesion: 0.16
Nodes (18): Model, MODELS, Tile, TILES, UpgradeDialog(), togglePreview(), closePreviewAccess(), emit() (+10 more)

### Community 39 - "Clardentity — technical guide"
Cohesion: 0.07
Nodes (29): 10. File map, 11. Conventions, 1. What the product is, 2. Topology, 3. Running it locally, 4. The HTTP API, 5. The streaming protocol — read this twice, 6. Data model (+21 more)

### Community 40 - "LearningRoleCard.tsx"
Cohesion: 0.30
Nodes (12): LearningRoleCard(), choose(), OPTIONS, emit(), getLearningRole(), getServerLearningRole(), Known, LearningRole (+4 more)

### Community 41 - "geolocation.py"
Cohesion: 0.15
Nodes (11): is_resolvable(), location_prompt_line(), Coarse location from the address a user signs in from. Why at all: "what's the…, False for anything a lookup can't say anything useful about., {"label", "country", "timezone"} or None. Never raises., One line of background, hedged on purpose. Stated as where they *appear* to be…, resolve(), Sign-in location. No network here - the lookup is verified by hand against a… (+3 more)

### Community 42 - "AdminDashboard.tsx"
Cohesion: 0.18
Nodes (18): AdminPage(), metadata, AdminDashboard(), Bucket, Card(), Flag(), Overview, QueryResult (+10 more)

### Community 43 - "test_scoring.py"
Cohesion: 0.07
Nodes (32): build_scored_evidence(), compute_claim_score(), compute_message_score(), MessageScore, §9.3 weights and band cutoffs, overridable via /admin (§11.8/FR14). These field…, 0 fabricated, 21-40 distorted, 41-80 gray_area, 81-99 probable_fact, 100…, Recompute a gray_area claim once the blind pass has ruled on it. Returns None…, Ranking key. Unmeasured relevance contributes nothing to the ranking but… (+24 more)

### Community 44 - "_Response"
Cohesion: 0.12
Nodes (7): _body(), _Client, Where a search looks, and how recent it is willing to be. No network. What…, Captures the body instead of sending it., _Response, TestCountryBias, TestNewsIndex

### Community 45 - "env.py"
Cohesion: 0.10
Nodes (19): do_run_migrations(), Run migrations in 'online' mode., Run migrations in 'offline' mode. This configures the context with just a URL…, In this scenario we need to create an Engine and associate a connection with…, run_async_migrations(), run_migrations_offline(), run_migrations_online(), configure_logging() (+11 more)

### Community 46 - "workspaces.py"
Cohesion: 0.27
Nodes (17): create_workspace(), delete_workspace(), _get_membership(), get_workspace(), list_workspaces(), AsyncSession, delete, get (+9 more)

### Community 47 - ".test_rejected_seed_falls_through_to_a_search"
Cohesion: 0.15
Nodes (8): A pre-answer search that arrived late seeds the per-claim research: the seed is…, With a search API, a round fires several queries at once and judges the merged…, TestSeededResearch, fake_search(), fake_supervise(), TestTreeSearch, fake_tavily(), fake_tavily()

### Community 48 - "token_meter.py"
Cohesion: 0.28
Nodes (6): current(), meter(), What a turn cost, in tokens. `messages.token_usage` has existed since the first…, Open a meter for the duration of one turn. Nested meters are not a thing here;…, TurnUsage, contextlib

### Community 49 - "image_generation.py"
Cohesion: 0.09
Nodes (23): generate(), ImageRequest, UUID, Making a picture, in Co-Creative mode only. Co-Creative is the mode whose…, What picture this message is asking for, or None if it is not. `history` is the…, Generate one image, store it, and return what the client needs. Returns `{"id",…, Where one generated image lives. The owner is part of the key, so the serving…, The picture, ten times smaller. The image models hand back a PNG, which at… (+15 more)

### Community 50 - "decision_classifier.py"
Cohesion: 0.20
Nodes (14): _classify(), build_bias_guidance(), _build_instructions(), classify_decision(), DecisionClassification, Classify what kind of decision a turn is about, so bias screening can be scoped…, Never raises - an unusable answer means "no domain", which simply leaves bias…, Prompt fragment naming the biases that most commonly distort this kind of… (+6 more)

### Community 51 - "react"
Cohesion: 0.09
Nodes (32): Home(), StreamingMessage, frontend_components_chat_modeselector_cognitivemode, ModeSwitchToast(), CurtainShimmer(), asMessage(), GATE_COPY, GuestDemo() (+24 more)

### Community 52 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 53 - "test_transcription_guards.py"
Cohesion: 0.17
Nodes (7): _looks_like_silence(), parametrize, The two things a raw speech-to-text result can't be trusted on, and how…, TestLooksLikeSilence, TestTranscribeAudioReportsRatherThanGuesses, fake_call(), types

### Community 54 - "_flat"
Cohesion: 0.16
Nodes (7): _flat(), The client's Thinking Framework Matrix, as embedded. Its thesis is that one-…, `build_system_instructions` returns Anthropic content blocks now, not a string…, The rule survived the Thinking Framework Matrix; only its wording moved. These…, TestNoSelfLabelling, TestReasoningLensStaysHidden, TestThinkingFramework

### Community 55 - "backend_client.py"
Cohesion: 0.15
Nodes (12): BackendTurnError, _parse_sse(), RuntimeError, A thin client that talks to Clardentity exactly the way the real frontend does:…, One real turn, waiting for the whole SSE stream. `mode_confirmed` and…, The HTTP request succeeded (200, SSE headers sent) but the turn itself failed…, Every event the server sent, in order, plus the raw text for anything an…, SSEResult (+4 more)

### Community 56 - "evaluators.py"
Cohesion: 0.11
Nodes (16): Anthropic, ev_identity_no_vendor_leak(), ev_llm_judge_rubric(), ev_no_bias_watch_prose(), ev_no_self_labeling_in_prose(), ev_plain_text_no_markdown(), ev_uncited_claims_score_low(), Deterministic checks, plus the one generic hook into the LLM judge. Signature… (+8 more)

### Community 57 - "run.py"
Cohesion: 0.16
Nodes (13): argparse, collections, dotenv, The cases, and what each one is actually checking. Every case here traces back…, Create the dataset if it doesn't exist, then upsert every case by its stable…, sync_dataset(), _print_report(), Run the policy eval suite against a live Clardentity backend and score it in… (+5 more)

### Community 58 - "app/layout.tsx"
Cohesion: 0.13
Nodes (24): geistMono, geistSans, metadata, outfit, RootLayout(), viewport, Appearance(), Accent (+16 more)

### Community 59 - "BackendClient"
Cohesion: 0.18
Nodes (6): BackendClient, _random_password(), Up to three attempts on a 5xx, with backoff. Measured directly against…, Reuse a cached eval account, or create one. Never touches a real user's account…, One workspace named "Evals", reused across runs rather than created fresh each…, Only ever sets one mode's name, on an account that exists solely to run evals -…

### Community 60 - "services/__init__.py"
Cohesion: 0.17
Nodes (8): looks_like_pdf(), Cheap pre-filter, so a page of HTML is not fetched twice. Only a hint - the…, Every table in the document, laid out as ' | '-separated rows. Synchronous and…, tables_from(), Fetching a PDF that a web search turned up. Two things to pin. The first is the…, TestFailureKeepsTheOriginalExcerpt, TestTheTableComesBackAsRows, TestWhichResultsAreWorthFetching

### Community 61 - "extract_claims"
Cohesion: 0.20
Nodes (5): extract_claims(), Parses <claim id="n">...</claim> blocks out of the model's raw output. Recovers…, extract_claims used to be a block-matching regex: one unclosed tag anywhere…, TestExtractClaims, TestExtractClaimsRecovery

### Community 62 - "api/auth.py"
Cohesion: 0.22
Nodes (16): me(), get, The address to look up for what was typed in the email field. An address is…, resolve_login(), AuthResponse, GoogleOAuthRequest, LoginRequest, PasswordResetConfirm (+8 more)

### Community 63 - "health.py"
Cohesion: 0.18
Nodes (12): _check_database(), _check_redis(), _check_storage(), health_check(), get, AsyncSession, get, User (+4 more)

### Community 64 - "MessageList.tsx"
Cohesion: 0.05
Nodes (71): ClarifierCard(), BAND_DOTS, BAND_MEANING, BAND_STYLES, ConfidenceBadge(), TIER_LABELS, CruxCard(), Chip() (+63 more)

### Community 65 - "clean_names"
Cohesion: 0.17
Nodes (8): clean_names(), name_for(), What the user calls their companion, per mode. One name per cognitive mode,…, Whatever came in, reduced to names we will actually show. Unknown modes are…, parametrize, Naming your companion. A display label the user chose, so the guards are about…, TestCleanNames, TestNameFor

### Community 66 - "get_profile"
Cohesion: 0.27
Nodes (13): capture_stated_facts(), gather_evidence(), get_profile(), AsyncSession, UUID, Regenerate and persist. A hand-edited profile is left untouched., Fold anything the user just said about themselves into their profile. Called…, The user's own words plus their document titles, and how many of their messages… (+5 more)

### Community 67 - "office_export.py"
Cohesion: 0.14
Nodes (16): Document, build_outline(), export_file(), Turning a Creative-mode answer into an actual file. The chat model already…, Returns (file_bytes, filename). Exceptions propagate as-is - the caller…, render_docx(), render_pptx(), render_xlsx() (+8 more)

### Community 68 - "test_learning_role.py"
Cohesion: 0.23
Nodes (7): LearningRoleRequest, Who the user is when they are learning. A closed set, because it steers the…, instructions(), parametrize, Who the user is when they are learning, and what it does to the prompt. No…, TestTheClosedSet, TestWhatItDoesToThePrompt

### Community 69 - "model_router.py"
Cohesion: 0.21
Nodes (12): flatten_instructions(), The fallback provider's Responses API takes a plain string; Claude's…, Google and xAI, for the model picker in Learning and Co-Creative. Written…, Grok. xAI speaks the OpenAI chat-completions wire format, so this is that shape…, One `data:` line's JSON, or None for everything else in the frame., Gemini, over generativelanguage's SSE endpoint., _sse_payloads(), stream_google() (+4 more)

### Community 70 - "clean_output"
Cohesion: 0.13
Nodes (13): clean_output(), Making the model's output look like what the UI actually renders. The chat…, Removes the model's own evidential-status asides from the prose., Everything, in the order the passes expect., Em/en dashes to spaced hyphens. Existing hyphens are left alone., HTML and unrendered Markdown out; the rendered set normalised., replace_dashes(), strip_markup() (+5 more)

### Community 71 - "generate_structured"
Cohesion: 0.20
Nodes (13): generate_structured(), RuntimeError, The model returned something that isn't the requested object., A call whose answer is an object, not prose. Every internal step that needs a…, StructuredOutputError, _build_instructions(), ClaimVerification, §9.1 step 3 / §9.4: entailment + support scoring per cited evidence item, plus… (+5 more)

### Community 72 - "CruxSplitter"
Cohesion: 0.13
Nodes (8): CruxSplitter, Streaming counterpart of extract_crux. The crux is the first thing the model…, Returns (crux_text_if_it_just_resolved, text_to_pass_downstream)., Anything still held when the stream ends (e.g. an unclosed crux)., The streaming twin of extract_crux: the crux is announced once, as its own…, The gist is one sentence, however much the model hands over as the crux., TestCruxSplitter, TestGistLength

### Community 73 - "StartChat.tsx"
Cohesion: 0.33
Nodes (8): StartPage(), Bootstrap, StartChat(), go(), Rabbit(), ThinkingIndicator(), lastWorkspaceId(), rememberWorkspace()

### Community 74 - "pdf_source.py"
Cohesion: 0.12
Nodes (15): _check_host(), Exception, Reading a PDF that a web search turned up. Search engines summarise a PDF the…, The bytes, with every hop vetted and the ceiling enforced as it streams., The tables in the PDF at `url`, or None. Never raises. This is an improvement…, The address is not one this server will fetch., Every address this hostname resolves to, or refuse. All of them, not the first:…, The URL, if this server will fetch it. Raises RefusedURL otherwise. (+7 more)

### Community 75 - "_validate_clarifying_options"
Cohesion: 0.18
Nodes (4): Both fields or neither - a question with one option isn't a choice, and options…, _validate_clarifying_options(), The pre-answer "which did you mean" - clickable options for a missing,…, TestClarifyingOptionsGuards

### Community 76 - "analytics.ts"
Cohesion: 0.33
Nodes (12): Analytics(), analyticsEnabled(), AnalyticsEvent, AnalyticsProps, getClient(), identify(), on(), resetIdentity() (+4 more)

### Community 77 - "_validate_context_question"
Cohesion: 0.19
Nodes (4): Drop anything that is not one plain open question. The guards are cheap and the…, _validate_context_question(), The "why" asked before answering. The judgement itself is the model's; these…, TestContextQuestionGuards

### Community 78 - "test_admin_dashboard.py"
Cohesion: 0.12
Nodes (15): add_model_spend(), Refuse anything that is not one plain read. Checked here rather than trusted to…, Fold one turn's per-model split into a running total. This is the meter's own…, _vet(), admin_emails(), is_admin(), User, parametrize (+7 more)

### Community 79 - "decision_review.py"
Cohesion: 0.20
Nodes (9): _build_instructions(), _build_suggestions(), Judging the options the user brought, not the ones we would have picked.…, One sound decision beside the wrong calls people actually make. The set only…, Returns the review stored on the message, or None when there was no menu of…, review_decisions(), _text(), One sound decision beside the wrong calls. These guards exist because the… (+1 more)

### Community 80 - "test_guidance.py"
Cohesion: 0.23
Nodes (6): _clip(), Trim to a word boundary, never mid-word. A hard slice produced suggestions…, The two per-turn nudges. The model's judgement isn't testable here; what is…, The rule behind the 'it asks several questions' feedback: fast, misspelled…, TestClip, TestTyposAreNotAmbiguity

### Community 81 - "build_system_instructions"
Cohesion: 0.27
Nodes (4): build_system_instructions(), Returns Anthropic content blocks, not a string - the split is the point.…, The split that makes caching possible: content byte-identical for every user in…, TestPromptCaching

### Community 82 - "api/profile.py"
Cohesion: 0.32
Nodes (12): list_roles(), get, The role framework, for rendering the profile editor., OnboardingAnswerIn, OnboardingRequest, ProfileAspectIn, ProfileAspectOut, ProfileRoleOut (+4 more)

### Community 83 - "ClaimTagStripper"
Cohesion: 0.18
Nodes (7): stream(), Which companion answers, and the one it was switched away from. The app offers…, _settle_mode(), ClaimTagStripper, Incrementally strips <claim id="n"> / </claim> tags from a stream of text…, TestStreamingStripperWithOpinionTag, TestClaimTagStripper

### Community 84 - "test_claim_parser.py"
Cohesion: 0.25
Nodes (4): extract_crux(), Pulls a leading <crux>...</crux> block off the front of raw text. Returns…, Claim tag parsing, including the opinion attribute. <claim id="n"…, TestExtractCrux

### Community 85 - "split_leading_sentence"
Cohesion: 0.29
Nodes (4): Fallback for an answer that opens with no <crux> block: peel the opening…, split_leading_sentence(), Rapid mode's fallback when the model skipped the <crux> wrapper: the first…, TestSplitLeadingSentence

### Community 86 - "ErrorBoundaries.tsx"
Cohesion: 0.29
Nodes (8): ErrorAttempt(), InlineError(), isPhone(), Props, ReportSheet(), send(), makeErrorRef(), sendErrorReport()

### Community 87 - "Layer by layer"
Cohesion: 0.15
Nodes (12): 10. Learning Intelligence — ~40%, 2. Understanding — ~50%, 3. Practice — ~5%, the largest gap, 4. Assessment — ~10%, 5. Diagnosis — ~15%, 6. Adaptation — ~25%, 7. Communication Skills — ~35%, 8. Application — ~15% (+4 more)

### Community 88 - "export_service.py"
Cohesion: 0.42
Nodes (9): MessageOut, build_markdown_export(), build_pdf_export(), _exported_at(), _line(), _message_header(), _pdf_safe(), FPDF (+1 more)

### Community 89 - "privacy/page.tsx"
Cohesion: 0.42
Nodes (7): LegalPage(), Section(), Table(), metadata, PrivacyPage(), metadata, TermsPage()

### Community 90 - "Better_docs/README.md"
Cohesion: 0.18
Nodes (7): 1. New Project Setup (One-Time), Graphify + Antigravity Project Workflow & Setup Guide, Better_docs, Keeping the fork in step with the main repo, Tests, The mobile view in one page, What's in this folder

### Community 91 - "infer_profile"
Cohesion: 0.21
Nodes (13): infer_profile(), InferredProfile, Never raises - a failed inference simply leaves the existing profile alone., all_roles(), get_role(), The role list as prompt text, for inferring which roles a user occupies., Drop anything outside the taxonomy and enforce exclusivity. Inference is an LLM…, A facet of a role. `exclusive` qualifiers admit exactly one value (a sibling is… (+5 more)

### Community 92 - "storage.py"
Cohesion: 0.27
Nodes (9): get, UUID, Serving a generated image back to the page that asked for it. Deliberately…, read_generated_image(), download_file(), get_s3_client(), upload_file(), boto3 (+1 more)

### Community 93 - "_content_blocks"
Cohesion: 0.29
Nodes (5): _content_blocks(), §12.2: images ride along as vision context for this turn only. The frontend…, parametrize, Attachments. The frontend sends data URIs; this API wants media type and…, TestContentBlocks

### Community 94 - "fake"
Cohesion: 0.26
Nodes (6): The reviewer's judgement isn't testable here; its guards are, and each one…, TestDecisionReviewGuards, fake(), fake(), fake(), fake()

### Community 95 - "test_prompts.py"
Cohesion: 0.17
Nodes (8): decision_tree_block(), monitoring_block(), The client's Thinking Framework Matrix, as prompt guidance. The matrix's own…, Guidance for choosing *how* to reason. Never shown to the user., Matrix section 8's last two fields. The monitoring question and the escalation…, thinking_framework_block(), What we tell the model. These are string assertions rather than model calls:…, TestTaxonomy

### Community 96 - "TestIdentity"
Cohesion: 0.22
Nodes (3): Which AI should I use" is answered as itself, in every mode - including…, The rule is about not volunteering. Asked directly, it answers - and it never…, TestIdentity

### Community 97 - "cached"
Cohesion: 0.10
Nodes (19): complete(), CompleteOut, CompleteRequest, BaseModel, post, Request, User, The new part only. The model returns the whole sentence, typed part included,… (+11 more)

### Community 99 - "claim_parser.py"
Cohesion: 0.27
Nodes (8): fit_gist(), _is_partial_close(), _is_partial_open(), ParsedClaim, Returns (gist, overflow): the first sentence of `text`, tag- and citation-free,…, Non-streaming version of the same stripping, for text we already have in full…, _split_result(), strip_claim_tags()

### Community 101 - "_portable_schema"
Cohesion: 0.33
Nodes (4): _portable_schema(), Rewrite nullable enums into the form this API's validator accepts. `{"type":…, Nullable enums. `{"type": ["string","null"], "enum": [...]}` is valid JSON…, TestPortableSchema

### Community 102 - "main"
Cohesion: 0.15
Nodes (17): 10. Setup steps (Aditya), 1. Upstream sync, 2. Mobile testing, 3. App improvements (mobile), 5. Decisions, 6. From the technical guide, 7. Code knowledge graph, 8. Test matrix (M12 onwards) (+9 more)

### Community 103 - "asyncio"
Cohesion: 0.18
Nodes (13): asyncio, _celery_redis_url(), kombu refuses a `rediss://` URL that doesn't spell out `ssl_cert_reqs`, raising…, ConversationMemory, get_memory_summary(), AsyncSession, UUID, Regenerates the rolling summary from everything older than the short-term… (+5 more)

### Community 104 - "apiFetch"
Cohesion: 0.05
Nodes (77): handleSubmit(), handleSubmit(), handleSubmit(), handleSubmit(), ProfilePage(), SettingsPage(), PageProps, WorkspaceDocumentsPage() (+69 more)

### Community 105 - "consent.ts"
Cohesion: 0.30
Nodes (9): ConsentBanner(), Consent, consentGranted(), getSnapshot(), listeners, read(), setConsent(), useConsent() (+1 more)

### Community 106 - "strip_opinion_preface"
Cohesion: 0.33
Nodes (3): strip_opinion_preface(), Belt-and-suspenders for prompt_builder's opinion-framing instruction - the…, TestOpinionPreface

### Community 107 - "InstallAppButton.tsx"
Cohesion: 0.28
Nodes (5): BeforeInstallPromptEvent, Environment, getEnvironment(), InstallAppButton(), subscribeNever()

### Community 108 - "Local development"
Cohesion: 0.17
Nodes (8): Backend (FastAPI), Celery worker (document ingestion), Clardentity, Cloud deployment (later, after local testing), Frontend (Next.js), Local development, One-time setup, Repository layout

### Community 109 - "model_catalog.py"
Cohesion: 0.27
Nodes (11): list_models(), The models a user may pick from in this mode. Empty in every mode but Learning…, allows_picking(), available(), _catalog(), get(), _has_key(), The models a user may pick from, in the two modes where picking is theirs.… (+3 more)

### Community 111 - "_CircuitBreaker"
Cohesion: 0.25
Nodes (4): _CircuitBreaker, CircuitBreakerOpenError, RuntimeError, §14 resilience: short-circuits calls after repeated failures instead of letting…

### Community 112 - "MessageInput.tsx"
Cohesion: 0.06
Nodes (49): attachmentProblem(), DOCUMENT_ACCEPT, DOCUMENT_EXTENSIONS, fileExtension(), LEGACY_EXTENSIONS, MessageInput(), acceptGhost(), handleChange() (+41 more)

### Community 113 - "TestTheSearchResultsGetTheBetterExcerpt"
Cohesion: 0.24
Nodes (3): The wiring: a PDF result in a search gets its tables read, and everything else…, explode(), TestTheSearchResultsGetTheBetterExcerpt

### Community 115 - "e0f1a2b3c4d5_legal_mode.py"
Cohesion: 0.83
Nodes (3): downgrade(), _swap(), upgrade()

### Community 116 - "build_conversation_input"
Cohesion: 0.43
Nodes (4): build_conversation_input(), `history` is the verbatim short-term window (oldest-first); anything older than…, The clarifying question has to reach the model, or the answer to it is a non-…, TestClarifierInHistory

### Community 117 - "4. Mobile production readiness"
Cohesion: 0.25
Nodes (8): 4.1 Viewport, safe areas & app shell, 4.2 Composer & on-screen keyboard, 4.3 Chat feed, citations & question cards, 4.4 Touch targets & ergonomics, 4.5 Media, audio & uploads, 4.6 Installable app (PWA) & connection drops, 4.7 Browser & device test matrix, 4. Mobile production readiness

### Community 119 - "guest.py"
Cohesion: 0.23
Nodes (12): GuestRequest, GuestTurn, import_guest_conversation(), ImportRequest, ImportResult, ImportTurn, AsyncSession, BaseModel (+4 more)

### Community 120 - "Deploying Clardentity"
Cohesion: 0.17
Nodes (12): Auto-deploy on push isn't wired up, Celery + TLS Redis (`rediss://`), Deploying Clardentity, Google sign-in, Migrations run in start.sh, NOT via preDeployCommand, Notes, Render: single service, not two, Status (+4 more)

### Community 121 - "CorrelationIdMiddleware"
Cohesion: 0.29
Nodes (5): ASGIApp, CorrelationIdMiddleware, Request, Accepts an inbound X-Request-ID (useful if a frontend/proxy already assigns…, BaseHTTPMiddleware

### Community 124 - "_flat"
Cohesion: 0.38
Nodes (3): _flat(), `build_system_instructions` returns cache-annotated content blocks, not a…, TestPromptWiring

### Community 125 - "bootstrap"
Cohesion: 0.29
Nodes (8): bootstrap(), BootstrapRequest, BootstrapResult, AsyncSession, BaseModel, post, User, Everything needed to open the app, in one round trip.

### Community 127 - "FullScreenError"
Cohesion: 0.48
Nodes (4): AppError(), GlobalError(), frontend_app_globals, FullScreenError()

### Community 128 - "ConversationCreate"
Cohesion: 0.40
Nodes (3): ConversationCreate, The fastest useful answer: a real mode everywhere a mode is checked, with its…, TestRapidMode

### Community 130 - "Analytics"
Cohesion: 0.25
Nodes (7): Analytics, Still to do, The events, The two questions, as PostHog queries, Turning it on, What is deliberately not collected, What was chosen, and why

### Community 140 - "thinking_review.py"
Cohesion: 0.47
Nodes (5): _build_instructions(), What Thinking mode shows instead of evidence. Claims and citations are the…, {"sound": [...], "biased": [...]} or None. Never raises., review_thinking(), _text()

### Community 141 - "CitationPopover.tsx"
Cohesion: 0.12
Nodes (26): CitationPopover(), credibilityPhrase(), ExternalLinkIcon(), factualEvidence(), hostOf(), relevancePhrase(), SUPPORT_BANDS, supportPhrase() (+18 more)

### Community 142 - "compute_avatar_cue"
Cohesion: 0.50
Nodes (3): AvatarCue, compute_avatar_cue(), §8.4: two independent signals combine once confidence scoring completes. A…

### Community 143 - "load_claims_for_messages"
Cohesion: 0.15
Nodes (14): get_validation(), AsyncSession, get, User, UUID, load_claims_for_messages(), AsyncSession, UUID (+6 more)

### Community 144 - "SourcesFooter.tsx"
Cohesion: 0.48
Nodes (6): collectSources(), DocIcon(), GlobeIcon(), hostOf(), Source, SourcesFooter()

### Community 145 - "_round_queries"
Cohesion: 0.40
Nodes (4): _keyword_query(), The claim boiled down to its content words - names, numbers, terms - which is…, The queries one round fires at once - the branches of the search. The first…, _round_queries()

### Community 147 - "propose_guidance"
Cohesion: 0.28
Nodes (6): _history_block(), propose_guidance(), Drop rewrites that ask the user to fill in a blank. "I want to get better at…, Returns the guidance object stored on the message, or None. `history` is the…, _reject_placeholders(), TestPlaceholderRejection

### Community 149 - "_worth_retrying"
Cohesion: 0.67
Nodes (3): BaseException, Same rule as the primary client: a 4xx other than 429 will not get better on…, _worth_retrying()

### Community 150 - "demo-api.mjs"
Cohesion: 0.15
Nodes (14): conversations, documents, gateFor(), messages, msg(), port, profile, route() (+6 more)

### Community 153 - "check_rate_limit"
Cohesion: 0.27
Nodes (7): check_rate_limit(), §14/§15: rate limiting on /auth and /chat to mitigate abuse. Fixed window…, _BrokenRedis, The rate limiter's own dependency going down should not take the product with…, test_a_redis_error_lets_the_request_through(), test_a_working_redis_still_enforces_the_limit(), redis

### Community 156 - "5. The streaming protocol — read this twice"
Cohesion: 0.29
Nodes (7): 5. The streaming protocol — read this twice, A correct minimal reader, Guest stream, Request body, The events, The four gates — the part that is genuinely unusual, Three things that will break a hand-rolled parser

### Community 165 - "test_ingestion.py"
Cohesion: 0.16
Nodes (10): file_type_of(), None when the type can be read; otherwise the sentence to show., unsupported_reason(), _docx(), _pptx(), parametrize, Every document type the composer and the uploader accept is readable., TestExtractPages (+2 more)

### Community 167 - "needs_live_data"
Cohesion: 0.25
Nodes (3): needs_live_data(), Which questions the quick answer searches for, and what a plan looks like when…, TestSearchPlanner

### Community 168 - "TestAuthGuards"
Cohesion: 0.40
Nodes (3): parametrize, Nothing that belongs to a user should answer without a token., TestAuthGuards

### Community 177 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **344 isolated node(s):** `sync-upstream.sh script`, `start.sh script`, `metadata`, `metadata`, `metadata` (+339 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1071 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `main` to `Clardentity — technical guide`, `Clardentity — technical guide`, `email_service.py`, `Deploying Clardentity`, `run.py`, `BackendClient`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `Clardentity — technical guide` connect `Clardentity — technical guide` to `Local development`, `main`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `tour.tsx`, `ChatView.tsx`, `primitives.tsx`, `CitationPopover.tsx`, `guestHandoff.ts`, `auth.tsx`, `cx`, `package.json`, `previewAccess.ts`, `LearningRoleCard.tsx`, `AdminDashboard.tsx`, `app/layout.tsx`, `MessageList.tsx`, `StartChat.tsx`, `analytics.ts`, `ErrorBoundaries.tsx`, `privacy/page.tsx`, `apiFetch`, `consent.ts`, `InstallAppButton.tsx`, `MessageInput.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `send_message()` (e.g. with `ClaimOut` and `EvidenceOut`) actually correct?**
  _`send_message()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `sync-upstream.sh script`, `start.sh script`, `metadata` to the rest of the system?**
  _344 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ChatView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.04396266184884071 - nodes in this community are weakly interconnected._
- **Should `parse_export` be split into smaller, more focused modules?**
  _Cohesion score 0.09759759759759759 - nodes in this community are weakly interconnected._