# Graph Report - clardentity-mvp-mv  (2026-10-10)

## Corpus Check
- 341 files · ~376,321 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 5, .ini 2, .css 2)

## Summary
- 3198 nodes · 7767 edges · 177 communities (140 shown, 37 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 301 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f3788135`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- tour.tsx
- cx
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
- config.py
- guestHandoff.ts
- openai_client.py
- auth.tsx
- AppShell.tsx
- package.json
- api/admin.py
- sqlalchemy_dialects
- test_anthropic_client.py
- api/biases.py
- get_conversation_for_user
- sse.ts
- web_research.py
- test_message_tree.py
- extract_pages
- api/admin_dashboard.py
- documents.py
- api/pro.py
- _serialize
- send_message
- confirm_password_reset
- previewAccess.ts
- Clardentity — technical guide
- LearningRoleCard.tsx
- is_resolvable
- AdminDashboard.tsx
- test_scoring.py
- _Response
- guest_chat
- workspaces.py
- test_guest_demo.py
- backend_client.py
- image_generation.py
- markdown.tsx
- react
- compilerOptions
- TestTheDemoMovesAQuestionToTheRightCompanion
- _flat
- SSEResult
- evaluators.py
- run.py
- app/layout.tsx
- BackendClient
- tables_from
- extract_claims
- api/auth.py
- search_history
- MessageList.tsx
- clean_names
- get_profile
- office_export.py
- test_learning_role.py
- pickableModels.ts
- clean_output
- api/chat.py
- CruxSplitter
- StartChat.tsx
- pdf_source.py
- _validate_clarifying_options
- analytics.ts
- _validate_context_question
- test_admin_dashboard.py
- _build_suggestions
- _clip
- build_system_instructions
- api/profile.py
- ClaimTagStripper
- extract_crux
- split_leading_sentence
- ErrorBoundaries.tsx
- Layer by layer
- export_service.py
- privacy/page.tsx
- Graphify + Antigravity Project Workflow & Setup Guide
- authErrorMessage
- devDependencies
- MessageActions
- fake
- test_prompts.py
- TestIdentity
- complete
- .test_pictures_skip_the_gates_and_prose_does_not
- TestKeepingTheDemoConversation
- scripts
- ConfidenceBadge.tsx
- Mv: project checklist
- memory_service.py
- apiFetch
- consent.ts
- CitationPopover.tsx
- main
- Local development
- model_catalog.py
- nspell
- password_fingerprint
- MessageInput.tsx
- TestTheSearchResultsGetTheBetterExcerpt
- TestRoutes
- e0f1a2b3c4d5_legal_mode.py
- task
- 4. Mobile production readiness
- guest.py
- Deploying Clardentity
- dependencies
- _TextOnly
- bootstrap
- track
- FullScreenError
- ConversationCreate
- deploy-backend.sh
- Analytics
- start.sh
- postcss.config.mjs
- 5. The streaming protocol — read this twice
- TourOverlay.tsx
- DecisionReview.tsx
- event_stream
- SourcesFooter.tsx
- judge.py
- delete_me
- test_guidance.py
- sync-upstream.sh
- demo-api.mjs
- TestGuidanceSeesTheConversation
- check_rate_limit
- 8. Mobile: what exists, and what to watch
- 5. The streaming protocol — read this twice
- rules/graphify.md
- workflows/graphify.md
- TestRenameAndPin
- 8. Mobile: what exists, and what to watch
- warmup.ts
- _ingest_attachments
- .test_it_asks_and_saves_nothing
- TestSearchPlanner
- TestAuthGuards
- TestCoCreativeNeverDeniesIt
- 4. The HTTP API
- 4. The HTTP API
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
9. `Spinner()` - 36 edges
10. `generate_structured()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `1. Upstream sync` --references--> `main()`  [INFERRED]
  Better_docs/Mv.md → evals/run.py
- `10. Setup steps (Aditya)` --references--> `main()`  [INFERRED]
  Better_docs/Mv.md → evals/run.py
- `Auto-deploy on push isn't wired up` --references--> `main()`  [INFERRED]
  DEPLOYMENT.md → evals/run.py
- `Status` --references--> `main()`  [INFERRED]
  DEPLOYMENT.md → evals/run.py
- `Clardentity — technical guide` --references--> `main()`  [INFERRED]
  Better_docs/TECHNICAL_GUIDE.md → evals/run.py

## Import Cycles
- None detected.

## Communities (177 total, 37 thin omitted)

### Community 0 - "tour.tsx"
Cohesion: 0.22
Nodes (17): advanceTour(), endTour(), getServerTourSnapshot(), getTourSnapshot(), IDLE_STATE, readStoredState(), setTourState(), startTour() (+9 more)

### Community 1 - "cx"
Cohesion: 0.04
Nodes (54): Arm(), ARM_ANGLES, AvatarExpression, AvatarGesture, AvatarPanel(), AvatarState, EXPRESSION_EYEBROW_ROTATION, IDLE_CYCLE (+46 more)

### Community 2 - "parse_export"
Cohesion: 0.10
Nodes (21): _clean(), _looks_like(), _parse_chatgpt(), _parse_claude(), parse_export(), _parse_gemini(), ValueError, Google Takeout MyActivity: flat records whose title is the prompt, prefixed… (+13 more)

### Community 3 - "security.py"
Cohesion: 0.16
Nodes (17): create_access_token(), create_password_reset_token(), create_refresh_token(), decode_token(), InvalidTokenError, Exception, UUID, TokenType (+9 more)

### Community 4 - "models/__init__.py"
Cohesion: 0.12
Nodes (33): hash_password(), Base, Conversation, DocumentChunk, AudioTranscript, Citation, ClaimEvidence, Message (+25 more)

### Community 5 - "taxonomy.py"
Cohesion: 0.09
Nodes (45): build_bias_guidance(), _build_instructions(), classify_decision(), DecisionClassification, Classify what kind of decision a turn is about, so bias screening can be scoped…, Never raises - an unusable answer means "no domain", which simply leaves bias…, Prompt fragment naming the biases that most commonly distort this kind of…, _schema() (+37 more)

### Community 6 - "document_ingestion.py"
Cohesion: 0.18
Nodes (15): build_chunks(), chunk_text(), pdf_page_text(), _pdf_pages(), UUID, One PDF page as text, with any tables laid out as rows. A PDF has no idea it…, Extract, chunk and embed one file: the rows to insert, not yet added to any…, _sheet_text() (+7 more)

### Community 7 - "Clardentity — technical guide"
Cohesion: 0.20
Nodes (10): 10. File map, 11. Conventions, 1. What the product is, 2. Topology, 3. Running it locally, 6. Data model, 7. Voice, 9. Limits and failure modes to design for (+2 more)

### Community 8 - "._fixture"
Cohesion: 0.25
Nodes (4): Thumbs up/down plus an optional comment on one answer. Needs a database - a…, DELETE .../messages/{id}: a real, cascading delete - the one destructive…, TestMessageDeletion, TestMessageFeedback

### Community 9 - "guest_demo.py"
Cohesion: 0.23
Nodes (13): _address_key(), charge(), _get(), _global_key(), over_global_budget(), The allowance behind the landing page's try-it-here box. Someone who has not…, Add one turn's tokens to both counters. Returns the session total. Charged…, Tokens already spent by this session, and by this address today. (+5 more)

### Community 10 - "primitives.tsx"
Cohesion: 0.08
Nodes (45): ForgotPasswordPage(), LoginPage(), RegisterPage(), ResetPasswordForm(), ResetPasswordPage(), LegalLayout(), QUESTIONS, WelcomePage() (+37 more)

### Community 11 - "client"
Cohesion: 0.15
Nodes (9): AsyncClient, client(), An account cannot be created without accepting, and what was accepted is…, Signing in used to be three sequential calls before a chat appeared. What…, A call that saved but cannot be read is a call that vanished. The endpoint's…, TestASavedCallIsReachable, TestBootstrapIsOneRoundTrip, TestPasswordResetContract (+1 more)

### Community 12 - "schemas/chat.py"
Cohesion: 0.12
Nodes (24): get_validation(), AsyncSession, get, User, UUID, ActiveLeafIn, CallTranscript, CallTurn (+16 more)

### Community 13 - "deps.py"
Cohesion: 0.07
Nodes (44): AsyncSession, post, UploadFile, User, transcribe(), tts(), One call between signing in and seeing a chat. Getting into the app used to be…, Help with the message before it is sent: inline completion. As the user types,… (+36 more)

### Community 14 - "fixtures.ts"
Cohesion: 0.05
Nodes (54): ADMIN_STATE, AUTH_DIR, USER_STATE, accounts, openChat(), failed, flaky, report (+46 more)

### Community 15 - "_accent_instructions"
Cohesion: 0.08
Nodes (26): _accent_instructions(), CallContext, _clean(), create_realtime_session(), AsyncSession, BaseModel, post, User (+18 more)

### Community 16 - "anthropic_client.py"
Cohesion: 0.09
Nodes (43): _base_kwargs(), _claude_generate_structured(), _claude_generate_text(), _claude_stream_generation(), _create_message(), DeltaEvent, DoneEvent, _drop_temperature() (+35 more)

### Community 17 - "config.py"
Cohesion: 0.14
Nodes (17): _celery_redis_url(), kombu refuses a `rediss://` URL that doesn't spell out `ssl_cert_reqs`, raising…, Settings, email_enabled(), password_reset_html(), Transactional email via Resend. Deliberately a no-op when `RESEND_API_KEY` is…, Returns True if the provider accepted it. Never raises., send_email() (+9 more)

### Community 18 - "guestHandoff.ts"
Cohesion: 0.15
Nodes (23): AppNotices(), claimTheGreeting(), SavedFromDemo(), subscribe(), WelcomeBack(), firstNameOf(), Greeting, greetingFor() (+15 more)

### Community 19 - "openai_client.py"
Cohesion: 0.06
Nodes (45): _build_input(), _CircuitBreaker, CircuitBreakerOpenError, _create_embeddings(), _create_response(), _create_speech(), _create_transcription(), DeltaEvent (+37 more)

### Community 20 - "auth.tsx"
Cohesion: 0.08
Nodes (34): handlePlayAudio(), ExportFileMenu(), download(), FORMATS, DependencyStatus, HealthResponse, LoadState, AudioRecorder() (+26 more)

### Community 21 - "AppShell.tsx"
Cohesion: 0.07
Nodes (28): AccountMenu(), Chevron(), GearIcon(), LeaveIcon(), PersonIcon(), AppShell(), onDrawerPointerEnd(), onDrawerPointerMove() (+20 more)

### Community 22 - "package.json"
Cohesion: 0.12
Nodes (15): eslintConfig, name, private, version, @axe-core/playwright, dictionary-en, dictionary-en-gb, eslint (+7 more)

### Community 23 - "api/admin.py"
Cohesion: 0.23
Nodes (16): Any, get_settings(), AsyncSession, get, put, User, update_setting(), AdminSetting (+8 more)

### Community 25 - "test_anthropic_client.py"
Cohesion: 0.05
Nodes (25): _CircuitBreaker, CircuitBreakerOpenError, _content_blocks(), is_provider_unavailable_error(), _portable_schema(), RuntimeError, §12.2: images ride along as vision context for this turn only. The frontend…, Rewrite nullable enums into the form this API's validator accepts. `{"type":… (+17 more)

### Community 26 - "api/biases.py"
Cohesion: 0.36
Nodes (12): get_bias(), list_biases(), list_categories(), list_decision_categories(), get, User, _to_out(), BiasCategoryOut (+4 more)

### Community 27 - "get_conversation_for_user"
Cohesion: 0.14
Nodes (37): _all_messages(), _conversation_out(), create_conversation(), delete_conversation(), delete_message(), devils_advocate(), export_conversation(), export_file() (+29 more)

### Community 28 - "sse.ts"
Cohesion: 0.13
Nodes (14): GuidanceCard(), ChatFinalEvent, ChatStatus, ChatStreamHandlers, ClarifyingOptionsSuggestion, ContextQuestion, Evidence, Guidance (+6 more)

### Community 29 - "web_research.py"
Cohesion: 0.07
Nodes (37): mark(), _prefetch(), country_name(), gather_context(), _keyword_query(), _merge_sources(), Web research with a supervisor that doesn't take the first answer. Used when…, What the loop settled on, and how it got there. (+29 more)

### Community 30 - "test_message_tree.py"
Cohesion: 0.11
Nodes (18): active_path(), descendants(), latest_leaf(), UUID, The active branch of a conversation - forking's replacement for a flat message…, Descend from `from_id`, always taking the most recently created child, until…, Root-to-leaf order. `messages` must be every row for the conversation the leaf…, Every message sharing `of`'s parent (or every root message of the same… (+10 more)

### Community 31 - "extract_pages"
Cohesion: 0.11
Nodes (16): _decode(), extract_pages(), Returns (page_number, text) pairs. page_number is 1-indexed for PDFs and slide…, _rtf_text(), _docx(), _pptx(), parametrize, Every document type the composer and the uploader accept is readable. (+8 more)

### Community 32 - "api/admin_dashboard.py"
Cohesion: 0.19
Nodes (18): dynamic_query(), _jsonable(), overview(), AsyncSession, get, post, User, The administrator's view: who is signed up, and what they are costing. Read-… (+10 more)

### Community 33 - "documents.py"
Cohesion: 0.17
Nodes (26): AsyncSession, UUID, require_workspace_member(), delete_document(), _excerpt_around(), get_document(), list_documents(), AsyncSession (+18 more)

### Community 34 - "api/pro.py"
Cohesion: 0.13
Nodes (27): close_preview(), open_preview(), _preview_status(), AsyncSession, delete, get, post, User (+19 more)

### Community 35 - "_serialize"
Cohesion: 0.15
Nodes (25): add_aspect(), clear_profile(), complete_onboarding(), import_history(), AsyncSession, delete, post, put (+17 more)

### Community 36 - "send_message"
Cohesion: 0.13
Nodes (12): _derive_title(), EventSourceResponse, A short label for a conversation, from its opening message. Deliberately not an…, send_message(), _classify(), InvalidModeError, InvalidReasoningLensError, ValueError (+4 more)

### Community 37 - "confirm_password_reset"
Cohesion: 0.25
Nodes (21): _client_ip(), confirm_password_reset(), ensure_workspace(), _issue_tokens(), login(), oauth_google(), provision_new_user(), AsyncSession (+13 more)

### Community 38 - "previewAccess.ts"
Cohesion: 0.13
Nodes (20): LockIcon(), Model, ModelPicker(), MODELS, Tile, TILES, UpgradeDialog(), togglePreview() (+12 more)

### Community 39 - "Clardentity — technical guide"
Cohesion: 0.20
Nodes (10): 10. File map, 11. Conventions, 1. What the product is, 2. Topology, 3. Running it locally, 6. Data model, 7. Voice, 9. Limits and failure modes to design for (+2 more)

### Community 40 - "LearningRoleCard.tsx"
Cohesion: 0.30
Nodes (12): LearningRoleCard(), choose(), OPTIONS, emit(), getLearningRole(), getServerLearningRole(), Known, LearningRole (+4 more)

### Community 41 - "is_resolvable"
Cohesion: 0.20
Nodes (7): is_resolvable(), location_prompt_line(), False for anything a lookup can't say anything useful about., One line of background, hedged on purpose. Stated as where they *appear* to be…, Sign-in location. No network here - the lookup is verified by hand against a…, TestPromptLine, TestResolvableFilter

### Community 42 - "AdminDashboard.tsx"
Cohesion: 0.21
Nodes (16): AdminDashboard(), Bucket, Card(), Flag(), Overview, QueryResult, shortDate(), Stat() (+8 more)

### Community 43 - "test_scoring.py"
Cohesion: 0.07
Nodes (32): build_scored_evidence(), compute_claim_score(), compute_message_score(), MessageScore, §9.3 weights and band cutoffs, overridable via /admin (§11.8/FR14). These field…, 0 fabricated, 21-40 distorted, 41-80 gray_area, 81-99 probable_fact, 100…, Recompute a gray_area claim once the blind pass has ruled on it. Returns None…, Ranking key. Unmeasured relevance contributes nothing to the ranking but… (+24 more)

### Community 44 - "_Response"
Cohesion: 0.06
Nodes (22): ASGIApp, configure_logging(), _CorrelationIdFilter, §14 Observability: structured logging + request tracing via a correlation ID…, CorrelationIdMiddleware, Request, Accepts an inbound X-Request-ID (useful if a frontend/proxy already assigns…, _body() (+14 more)

### Community 45 - "guest_chat"
Cohesion: 0.16
Nodes (14): _address(), guest_budget(), guest_chat(), stream(), _limit_reached(), EventSourceResponse, get, Request (+6 more)

### Community 46 - "workspaces.py"
Cohesion: 0.27
Nodes (17): create_workspace(), delete_workspace(), _get_membership(), get_workspace(), list_workspaces(), AsyncSession, delete, get (+9 more)

### Community 47 - "test_guest_demo.py"
Cohesion: 0.22
Nodes (6): The conversation so far, cut to something that cannot be abused. Oldest turns…, trim_history(), The landing page's try-it-here allowance. The counters themselves need Redis,…, TestHistoryIsNotAnOpenDoor, TestTheAllowance, _uuid_of()

### Community 48 - "backend_client.py"
Cohesion: 0.09
Nodes (23): Google and xAI, for the model picker in Learning and Co-Creative. Written…, Grok. xAI speaks the OpenAI chat-completions wire format, so this is that shape…, One `data:` line's JSON, or None for everything else in the frame., Gemini, over generativelanguage's SSE endpoint., _sse_payloads(), stream_google(), stream_xai(), Coarse location from the address a user signs in from. Why at all: "what's the… (+15 more)

### Community 49 - "image_generation.py"
Cohesion: 0.08
Nodes (30): get, UUID, Serving a generated image back to the page that asked for it. Deliberately…, read_generated_image(), generate(), ImageRequest, UUID, Making a picture, in Co-Creative mode only. Co-Creative is the mode whose… (+22 more)

### Community 50 - "markdown.tsx"
Cohesion: 0.21
Nodes (14): CruxCard(), renderBody(), renderCitations(), renderTextWithCitations(), Block, InlineSegment, isTableLine(), renderInline() (+6 more)

### Community 51 - "react"
Cohesion: 0.09
Nodes (36): Home(), ModeSelector(), ModeSwitchToast(), CurtainShimmer(), HeroComposer(), HeroMode, Phase, QUESTION_BY_MODE (+28 more)

### Community 52 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 53 - "TestTheDemoMovesAQuestionToTheRightCompanion"
Cohesion: 0.23
Nodes (4): _Payload, Smart switching, in the demo. The demo had neither the control nor anything…, TestTheDemoMovesAQuestionToTheRightCompanion, suggests()

### Community 54 - "_flat"
Cohesion: 0.13
Nodes (9): Guidance for choosing *how* to reason. Never shown to the user., thinking_framework_block(), _flat(), The client's Thinking Framework Matrix, as embedded. Its thesis is that one-…, `build_system_instructions` returns Anthropic content blocks now, not a string…, The rule survived the Thinking Framework Matrix; only its wording moved. These…, TestNoSelfLabelling, TestReasoningLensStaysHidden (+1 more)

### Community 55 - "SSEResult"
Cohesion: 0.23
Nodes (7): BackendTurnError, _parse_sse(), RuntimeError, One real turn, waiting for the whole SSE stream. `mode_confirmed` and…, The HTTP request succeeded (200, SSE headers sent) but the turn itself failed…, Every event the server sent, in order, plus the raw text for anything an…, SSEResult

### Community 56 - "evaluators.py"
Cohesion: 0.14
Nodes (10): ev_identity_no_vendor_leak(), ev_llm_judge_rubric(), ev_no_bias_watch_prose(), ev_no_self_labeling_in_prose(), ev_plain_text_no_markdown(), ev_uncited_claims_score_low(), Deterministic checks, plus the one generic hook into the LLM judge. Signature…, A structural invariant, checked on every case that returns claims, not just the… (+2 more)

### Community 57 - "run.py"
Cohesion: 0.16
Nodes (13): argparse, collections, dotenv, The cases, and what each one is actually checking. Every case here traces back…, Create the dataset if it doesn't exist, then upsert every case by its stable…, sync_dataset(), _print_report(), Run the policy eval suite against a live Clardentity backend and score it in… (+5 more)

### Community 58 - "app/layout.tsx"
Cohesion: 0.13
Nodes (24): geistMono, geistSans, metadata, outfit, RootLayout(), viewport, Appearance(), Accent (+16 more)

### Community 59 - "BackendClient"
Cohesion: 0.18
Nodes (6): BackendClient, _random_password(), Up to three attempts on a 5xx, with backoff. Measured directly against…, Reuse a cached eval account, or create one. Never touches a real user's account…, One workspace named "Evals", reused across runs rather than created fresh each…, Only ever sets one mode's name, on an account that exists solely to run evals -…

### Community 60 - "tables_from"
Cohesion: 0.47
Nodes (3): Every table in the document, laid out as ' | '-separated rows. Synchronous and…, tables_from(), TestTheTableComesBackAsRows

### Community 61 - "extract_claims"
Cohesion: 0.18
Nodes (6): extract_claims(), Parses <claim id="n">...</claim> blocks out of the model's raw output. Recovers…, Claim tag parsing, including the opinion attribute. <claim id="n"…, extract_claims used to be a block-matching regex: one unclosed tag anywhere…, TestExtractClaims, TestExtractClaimsRecovery

### Community 62 - "api/auth.py"
Cohesion: 0.22
Nodes (16): me(), get, The address to look up for what was typed in the email field. An address is…, resolve_login(), AuthResponse, GoogleOAuthRequest, LoginRequest, PasswordResetConfirm (+8 more)

### Community 63 - "search_history"
Cohesion: 0.20
Nodes (9): _check_database(), AsyncSession, get, User, UUID, search_history(), BaseModel, SearchResultOut (+1 more)

### Community 64 - "MessageList.tsx"
Cohesion: 0.17
Nodes (14): GeneratedImageCard(), GeneratedImagePlaceholder(), ChevronIcon(), Exchange, findEvidenceForMarker(), ForkSwitcher(), formatMessageTime(), parseUserMessage() (+6 more)

### Community 65 - "clean_names"
Cohesion: 0.17
Nodes (8): clean_names(), name_for(), What the user calls their companion, per mode. One name per cognitive mode,…, Whatever came in, reduced to names we will actually show. Unknown modes are…, parametrize, Naming your companion. A display label the user chose, so the guards are about…, TestCleanNames, TestNameFor

### Community 66 - "get_profile"
Cohesion: 0.26
Nodes (13): A long-lived, evolving picture of one user. Built by inference from their own…, UserProfile, gather_evidence(), get_profile(), AsyncSession, UUID, Regenerate and persist. A hand-edited profile is left untouched., The user's own words plus their document titles, and how many of their messages… (+5 more)

### Community 67 - "office_export.py"
Cohesion: 0.14
Nodes (17): Document, build_outline(), export_file(), Turning a Creative-mode answer into an actual file. The chat model already…, Returns (file_bytes, filename). Exceptions propagate as-is - the caller…, render_docx(), render_pptx(), render_xlsx() (+9 more)

### Community 68 - "test_learning_role.py"
Cohesion: 0.23
Nodes (7): LearningRoleRequest, Who the user is when they are learning. A closed set, because it steers the…, instructions(), parametrize, Who the user is when they are learning, and what it does to the prompt. No…, TestTheClosedSet, TestWhatItDoesToThePrompt

### Community 69 - "pickableModels.ts"
Cohesion: 0.22
Nodes (15): Row(), VendorModelPicker(), choose(), choices, emit(), getChoice(), getModels(), getServerSnapshot() (+7 more)

### Community 70 - "clean_output"
Cohesion: 0.10
Nodes (15): clean_output(), Removes the model's own evidential-status asides from the prose., Everything, in the order the passes expect., Em/en dashes to spaced hyphens. Existing hyphens are left alone., HTML and unrendered Markdown out; the rendered set normalised., replace_dashes(), strip_markup(), strip_opinion_preface() (+7 more)

### Community 71 - "api/chat.py"
Cohesion: 0.06
Nodes (52): _plan(), cached(), AvatarCue, compute_avatar_cue(), §8.4: two independent signals combine once confidence scoring completes. A…, Reading a user's history out of another assistant's export. There is no API for…, name_conversation(), A name for a conversation, from its first exchange. The sidebar used to show… (+44 more)

### Community 72 - "CruxSplitter"
Cohesion: 0.17
Nodes (6): CruxSplitter, Streaming counterpart of extract_crux. The crux is the first thing the model…, Returns (crux_text_if_it_just_resolved, text_to_pass_downstream)., Anything still held when the stream ends (e.g. an unclosed crux)., The streaming twin of extract_crux: the crux is announced once, as its own…, TestCruxSplitter

### Community 73 - "StartChat.tsx"
Cohesion: 0.33
Nodes (8): StartPage(), Bootstrap, StartChat(), go(), Rabbit(), ThinkingIndicator(), lastWorkspaceId(), rememberWorkspace()

### Community 74 - "pdf_source.py"
Cohesion: 0.10
Nodes (20): _check_host(), looks_like_pdf(), Exception, Reading a PDF that a web search turned up. Search engines summarise a PDF the…, Cheap pre-filter, so a page of HTML is not fetched twice. Only a hint - the…, The bytes, with every hop vetted and the ceiling enforced as it streams., The tables in the PDF at `url`, or None. Never raises. This is an improvement…, The address is not one this server will fetch. (+12 more)

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

### Community 79 - "_build_suggestions"
Cohesion: 0.35
Nodes (4): _build_suggestions(), One sound decision beside the wrong calls people actually make. The set only…, One sound decision beside the wrong calls. These guards exist because the…, TestDecisionSuggestionSet

### Community 80 - "_clip"
Cohesion: 0.43
Nodes (3): _clip(), Trim to a word boundary, never mid-word. A hard slice produced suggestions…, TestClip

### Community 81 - "build_system_instructions"
Cohesion: 0.16
Nodes (7): build_system_instructions(), Returns Anthropic content blocks, not a string - the split is the point.…, _flat(), `build_system_instructions` returns cache-annotated content blocks, not a…, TestPromptWiring, The split that makes caching possible: content byte-identical for every user in…, TestPromptCaching

### Community 82 - "api/profile.py"
Cohesion: 0.32
Nodes (12): list_roles(), get, The role framework, for rendering the profile editor., OnboardingAnswerIn, OnboardingRequest, ProfileAspectIn, ProfileAspectOut, ProfileRoleOut (+4 more)

### Community 83 - "ClaimTagStripper"
Cohesion: 0.14
Nodes (12): ClaimTagStripper, fit_gist(), _is_partial_close(), _is_partial_open(), ParsedClaim, Returns (gist, overflow): the first sentence of `text`, tag- and citation-free,…, Non-streaming version of the same stripping, for text we already have in full…, Incrementally strips <claim id="n"> / </claim> tags from a stream of text… (+4 more)

### Community 84 - "extract_crux"
Cohesion: 0.21
Nodes (5): extract_crux(), Pulls a leading <crux>...</crux> block off the front of raw text. Returns…, The gist is one sentence, however much the model hands over as the crux., TestExtractCrux, TestGistLength

### Community 85 - "split_leading_sentence"
Cohesion: 0.29
Nodes (4): Fallback for an answer that opens with no <crux> block: peel the opening…, split_leading_sentence(), Rapid mode's fallback when the model skipped the <crux> wrapper: the first…, TestSplitLeadingSentence

### Community 86 - "ErrorBoundaries.tsx"
Cohesion: 0.29
Nodes (8): ErrorAttempt(), InlineError(), isPhone(), Props, ReportSheet(), send(), makeErrorRef(), sendErrorReport()

### Community 87 - "Layer by layer"
Cohesion: 0.12
Nodes (15): build_context_block(), Numbered context the model cites with [n] markers. Documents come first and…, 10. Learning Intelligence — ~40%, 1. Input & Knowledge — ~90%, effectively done, 2. Understanding — ~50%, 3. Practice — ~5%, the largest gap, 4. Assessment — ~10%, 5. Diagnosis — ~15% (+7 more)

### Community 88 - "export_service.py"
Cohesion: 0.42
Nodes (9): MessageOut, build_markdown_export(), build_pdf_export(), _exported_at(), _line(), _message_header(), _pdf_safe(), FPDF (+1 more)

### Community 89 - "privacy/page.tsx"
Cohesion: 0.42
Nodes (7): LegalPage(), Section(), Table(), metadata, PrivacyPage(), metadata, TermsPage()

### Community 91 - "authErrorMessage"
Cohesion: 0.08
Nodes (41): handleSubmit(), handleSubmit(), handleSubmit(), SettingsPage(), ChatView(), handleDeleteMessage(), handleQuickAnswer(), handleRegenerate() (+33 more)

### Community 92 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, @axe-core/playwright, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/postcss, @types/node (+3 more)

### Community 93 - "MessageActions"
Cohesion: 0.29
Nodes (9): ActionIcon(), CopyIcon(), MessageActions(), copy(), PencilIcon(), RedoIcon(), TickIcon(), TrashIcon() (+1 more)

### Community 94 - "fake"
Cohesion: 0.26
Nodes (6): The reviewer's judgement isn't testable here; its guards are, and each one…, TestDecisionReviewGuards, fake(), fake(), fake(), fake()

### Community 95 - "test_prompts.py"
Cohesion: 0.12
Nodes (11): build_conversation_input(), `history` is the verbatim short-term window (oldest-first); anything older than…, decision_tree_block(), monitoring_block(), The client's Thinking Framework Matrix, as prompt guidance. The matrix's own…, Matrix section 8's last two fields. The monitoring question and the escalation…, What we tell the model. These are string assertions rather than model calls:…, The clarifying question has to reach the model, or the answer to it is a non-… (+3 more)

### Community 96 - "TestIdentity"
Cohesion: 0.22
Nodes (3): Which AI should I use" is answered as itself, in every mode - including…, The rule is about not volunteering. Asked directly, it answers - and it never…, TestIdentity

### Community 97 - "complete"
Cohesion: 0.17
Nodes (11): complete(), CompleteOut, CompleteRequest, BaseModel, post, Request, User, The new part only. The model returns the whole sentence, typed part included,… (+3 more)

### Community 98 - ".test_pictures_skip_the_gates_and_prose_does_not"
Cohesion: 0.25
Nodes (3): Asking for a picture must produce a picture, not a question about the wording…, TestPicturesGoRoundTheGates, fake_wanted_image()

### Community 100 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test:e2e, test:e2e:ci, test:e2e:mobile (+1 more)

### Community 101 - "ConfidenceBadge.tsx"
Cohesion: 0.22
Nodes (6): BAND_DOTS, BAND_MEANING, BAND_STYLES, ConfidenceBadge(), TIER_LABELS, Claim

### Community 102 - "Mv: project checklist"
Cohesion: 0.18
Nodes (10): 10. Setup steps (Aditya), 1. Upstream sync, 2. Mobile testing, 3. App improvements (mobile), 5. Decisions, 6. From the technical guide, 7. Code knowledge graph, 8. Test matrix (M12 onwards) (+2 more)

### Community 103 - "memory_service.py"
Cohesion: 0.18
Nodes (16): get_memory(), AsyncSession, get, post, User, UUID, rebuild_memory(), ConversationMemory (+8 more)

### Community 104 - "apiFetch"
Cohesion: 0.08
Nodes (42): AdminPage(), metadata, handleSubmit(), ChatPage(), PageProps, ProfilePage(), PageProps, WorkspaceDocumentsPage() (+34 more)

### Community 105 - "consent.ts"
Cohesion: 0.30
Nodes (9): ConsentBanner(), Consent, consentGranted(), getSnapshot(), listeners, read(), setConsent(), useConsent() (+1 more)

### Community 106 - "CitationPopover.tsx"
Cohesion: 0.31
Nodes (10): CitationPopover(), credibilityPhrase(), ExternalLinkIcon(), factualEvidence(), hostOf(), relevancePhrase(), SUPPORT_BANDS, supportPhrase() (+2 more)

### Community 107 - "main"
Cohesion: 0.36
Nodes (7): main(), How it works, Limitations, One-time setup, Test gate, Testing safely, Upstream sync

### Community 108 - "Local development"
Cohesion: 0.17
Nodes (8): Backend (FastAPI), Celery worker (document ingestion), Clardentity, Cloud deployment (later, after local testing), Frontend (Next.js), Local development, One-time setup, Repository layout

### Community 109 - "model_catalog.py"
Cohesion: 0.27
Nodes (11): list_models(), The models a user may pick from in this mode. Empty in every mode but Learning…, allows_picking(), available(), _catalog(), get(), _has_key(), The models a user may pick from, in the two modes where picking is theirs.… (+3 more)

### Community 111 - "password_fingerprint"
Cohesion: 0.39
Nodes (3): password_fingerprint(), A short, non-reversible marker for "the password as it is right now". Carried…, TestResetSingleUse

### Community 112 - "MessageInput.tsx"
Cohesion: 0.10
Nodes (30): attachmentProblem(), DOCUMENT_ACCEPT, DOCUMENT_EXTENSIONS, fileExtension(), LEGACY_EXTENSIONS, MessageInput(), acceptGhost(), handleChange() (+22 more)

### Community 113 - "TestTheSearchResultsGetTheBetterExcerpt"
Cohesion: 0.19
Nodes (4): The wiring: a PDF result in a search gets its tables read, and everything else…, TestFailureKeepsTheOriginalExcerpt, explode(), TestTheSearchResultsGetTheBetterExcerpt

### Community 115 - "e0f1a2b3c4d5_legal_mode.py"
Cohesion: 0.83
Nodes (3): downgrade(), _swap(), upgrade()

### Community 116 - "task"
Cohesion: 0.25
Nodes (8): {"label", "country", "timezone"} or None. Never raises., resolve(), UUID, Out-of-band on purpose: sign-in must never wait on a third party, and a failed…, refresh_location_task(), _run(), build_task(), task()

### Community 117 - "4. Mobile production readiness"
Cohesion: 0.25
Nodes (8): 4.1 Viewport, safe areas & app shell, 4.2 Composer & on-screen keyboard, 4.3 Chat feed, citations & question cards, 4.4 Touch targets & ergonomics, 4.5 Media, audio & uploads, 4.6 Installable app (PWA) & connection drops, 4.7 Browser & device test matrix, 4. Mobile production readiness

### Community 119 - "guest.py"
Cohesion: 0.09
Nodes (29): asyncio, do_run_migrations(), Run migrations in 'online' mode., Run migrations in 'offline' mode. This configures the context with just a URL…, In this scenario we need to create an Engine and associate a connection with…, run_async_migrations(), run_migrations_offline(), run_migrations_online() (+21 more)

### Community 120 - "Deploying Clardentity"
Cohesion: 0.17
Nodes (12): Auto-deploy on push isn't wired up, Celery + TLS Redis (`rediss://`), Deploying Clardentity, Google sign-in, Migrations run in start.sh, NOT via preDeployCommand, Notes, Render: single service, not two, Status (+4 more)

### Community 121 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, dictionary-en, dictionary-en-gb, next, nspell, posthog-js, react, react-dom

### Community 124 - "_TextOnly"
Cohesion: 0.29
Nodes (3): _html_text(), _TextOnly, HTMLParser

### Community 125 - "bootstrap"
Cohesion: 0.29
Nodes (8): bootstrap(), BootstrapRequest, BootstrapResult, AsyncSession, BaseModel, post, User, Everything needed to open the app, in one round trip.

### Community 126 - "track"
Cohesion: 0.07
Nodes (36): Action, ChatRowMenu(), patch(), remove(), ChatRowWorkspace, Kebab(), PinIcon(), FeedbackWidget() (+28 more)

### Community 127 - "FullScreenError"
Cohesion: 0.48
Nodes (4): AppError(), GlobalError(), frontend_app_globals, FullScreenError()

### Community 128 - "ConversationCreate"
Cohesion: 0.40
Nodes (3): ConversationCreate, The fastest useful answer: a real mode everywhere a mode is checked, with its…, TestRapidMode

### Community 130 - "Analytics"
Cohesion: 0.25
Nodes (7): Analytics, Still to do, The events, The two questions, as PostHog queries, Turning it on, What is deliberately not collected, What was chosen, and why

### Community 140 - "5. The streaming protocol — read this twice"
Cohesion: 0.29
Nodes (7): 5. The streaming protocol — read this twice, A correct minimal reader, Guest stream, Request body, The events, The four gates — the part that is genuinely unusual, Three things that will break a hand-rolled parser

### Community 141 - "TourOverlay.tsx"
Cohesion: 0.20
Nodes (15): Pos, Rect, resolveVisibleTarget(), TourOverlay(), placeCallout(), tick(), layoutViewport(), measure() (+7 more)

### Community 142 - "DecisionReview.tsx"
Cohesion: 0.48
Nodes (6): Chip(), DecisionReview(), Heading(), Tick(), Warn(), DecisionReviewData

### Community 143 - "event_stream"
Cohesion: 0.11
Nodes (14): _in_background(), _no_text(), A generation that produces nothing, for a turn whose answer is a picture.…, The new name if it lands within `wait_seconds` (written to the row here, sent…, event_stream(), metered_stream(), _settle_title(), _store_counterfactual() (+6 more)

### Community 144 - "SourcesFooter.tsx"
Cohesion: 0.48
Nodes (6): collectSources(), DocIcon(), GlobeIcon(), hostOf(), Source, SourcesFooter()

### Community 145 - "judge.py"
Cohesion: 0.38
Nodes (6): Anthropic, _client(), judge(), An LLM judge, separate from the product it is grading. Deterministic checks…, Returns {"pass": bool, "reason": str}. Never raises past this function - a…, os

### Community 146 - "delete_me"
Cohesion: 0.67
Nodes (3): delete_me(), delete, Delete the signed-in account and everything it owns. Irreversible. Two foreign…

### Community 147 - "test_guidance.py"
Cohesion: 0.17
Nodes (10): _history_block(), propose_guidance(), Three judgements about the question, made before the answer exists. All are…, Drop rewrites that ask the user to fill in a blank. "I want to get better at…, Returns the guidance object stored on the message, or None. `history` is the…, _reject_placeholders(), The two per-turn nudges. The model's judgement isn't testable here; what is…, The rule behind the 'it asks several questions' feedback: fast, misspelled… (+2 more)

### Community 150 - "demo-api.mjs"
Cohesion: 0.15
Nodes (14): conversations, documents, gateFor(), messages, msg(), port, profile, route() (+6 more)

### Community 153 - "check_rate_limit"
Cohesion: 0.27
Nodes (7): check_rate_limit(), §14/§15: rate limiting on /auth and /chat to mitigate abuse. Fixed window…, _BrokenRedis, The rate limiter's own dependency going down should not take the product with…, test_a_redis_error_lets_the_request_through(), test_a_working_redis_still_enforces_the_limit(), redis

### Community 154 - "8. Mobile: what exists, and what to watch"
Cohesion: 0.29
Nodes (7): 8. Mobile: what exists, and what to watch, Breakpoints, On-screen keyboards, PWA, The service worker — the single most recurring trap in this repo, The `zoom: 0.85` trap — read before measuring anything, Theming

### Community 156 - "5. The streaming protocol — read this twice"
Cohesion: 0.29
Nodes (7): 5. The streaming protocol — read this twice, A correct minimal reader, Guest stream, Request body, The events, The four gates — the part that is genuinely unusual, Three things that will break a hand-rolled parser

### Community 160 - "8. Mobile: what exists, and what to watch"
Cohesion: 0.29
Nodes (7): 8. Mobile: what exists, and what to watch, Breakpoints, On-screen keyboards, PWA, The service worker — the single most recurring trap in this repo, The `zoom: 0.85` trap — read before measuring anything, Theming

### Community 165 - "_ingest_attachments"
Cohesion: 0.31
Nodes (6): _ingest_attachments(), A document attached to a message becomes a workspace document - stored,…, file_type_of(), None when the type can be read; otherwise the sentence to show., unsupported_reason(), TestTypeGate

### Community 168 - "TestAuthGuards"
Cohesion: 0.40
Nodes (3): parametrize, Nothing that belongs to a user should answer without a token., TestAuthGuards

### Community 174 - "4. The HTTP API"
Cohesion: 0.40
Nodes (5): 4. The HTTP API, Auth, Everything else, Getting into the app — one call, Workspaces, conversations, messages

### Community 175 - "4. The HTTP API"
Cohesion: 0.40
Nodes (5): 4. The HTTP API, Auth, Everything else, Getting into the app — one call, Workspaces, conversations, messages

### Community 177 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **340 isolated node(s):** `2. Mobile testing`, `3. App improvements (mobile)`, `4.1 Viewport, safe areas & app shell`, `4.2 Composer & on-screen keyboard`, `4.3 Chat feed, citations & question cards` (+335 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1069 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `main` to `Mv: project checklist`, `Clardentity — technical guide`, `Clardentity — technical guide`, `task`, `Deploying Clardentity`, `run.py`, `BackendClient`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `tour.tsx`, `cx`, `primitives.tsx`, `TourOverlay.tsx`, `guestHandoff.ts`, `auth.tsx`, `AppShell.tsx`, `package.json`, `previewAccess.ts`, `LearningRoleCard.tsx`, `AdminDashboard.tsx`, `markdown.tsx`, `app/layout.tsx`, `MessageList.tsx`, `pickableModels.ts`, `StartChat.tsx`, `analytics.ts`, `ErrorBoundaries.tsx`, `privacy/page.tsx`, `authErrorMessage`, `ConfidenceBadge.tsx`, `apiFetch`, `consent.ts`, `CitationPopover.tsx`, `MessageInput.tsx`, `track`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `CruxSplitter` connect `CruxSplitter` to `send_message`, `api/chat.py`, `event_stream`, `ClaimTagStripper`, `extract_crux`, `extract_claims`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `send_message()` (e.g. with `ClaimOut` and `EvidenceOut`) actually correct?**
  _`send_message()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `2. Mobile testing`, `3. App improvements (mobile)`, `4.1 Viewport, safe areas & app shell` to the rest of the system?**
  _340 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cx` be split into smaller, more focused modules?**
  _Cohesion score 0.04130808950086059 - nodes in this community are weakly interconnected._
- **Should `parse_export` be split into smaller, more focused modules?**
  _Cohesion score 0.0962566844919786 - nodes in this community are weakly interconnected._