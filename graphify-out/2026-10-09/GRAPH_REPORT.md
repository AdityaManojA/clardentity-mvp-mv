# Graph Report - clardentity-mvp-mv  (2026-10-09)

## Corpus Check
- 306 files · ~333,195 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: (none) 5, .ini 2, .aff 2)

## Summary
- 2773 nodes · 7020 edges · 159 communities (124 shown, 35 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 261 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c612d616`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- tour.tsx
- authErrorMessage
- parse_export
- MessageInput.tsx
- models/__init__.py
- taxonomy.py
- thinking_review.py
- apiFetch
- office_export.py
- guest_demo.py
- react
- client
- api/chat.py
- guest.py
- LandingPage.tsx
- _accent_instructions
- anthropic_client.py
- ingest_document.py
- guestHandoff.ts
- openai_client.py
- ChatView.tsx
- cx
- package.json
- InstallAppButton.tsx
- sqlalchemy_dialects
- test_anthropic_client.py
- MessageList.tsx
- get_conversation_for_user
- image_generation.py
- web_research.py
- test_message_tree.py
- profile_prompt_block
- api/admin_dashboard.py
- upload_document
- _preview_status
- _serialize
- send_message
- security.py
- previewAccess.ts
- admin_settings_service.py
- api/auth.py
- CitationPopover.tsx
- AdminDashboard.tsx
- compute_claim_score
- _Response
- document_ingestion.py
- workspaces.py
- get_profile
- clean_names
- strip_opinion_preface
- test_prompts.py
- test_ingestion.py
- compilerOptions
- test_transcription_guards.py
- _flat
- backend_client.py
- evaluators.py
- run.py
- theme.tsx
- BackendClient
- AvatarPanel.tsx
- extract_claims
- compute_message_score
- rescore_after_reconciliation
- _validate_clarifying_options
- SourcesFooter.tsx
- test_learning_role.py
- record
- is_resolvable
- _validate_context_question
- clean_output
- event_stream
- CruxSplitter
- api/profile.py
- test_scoring.py
- fake
- LearningRoleCard.tsx
- analytics.ts
- model_catalog.py
- decision_review.py
- test_guidance.py
- build_system_instructions
- claim_parser.py
- ClaimTagStripper
- test_claim_parser.py
- split_leading_sentence
- trim_history
- token_meter.py
- export_service.py
- privacy/page.tsx
- LiveCall
- Message
- preview_access.py
- _CircuitBreaker
- _portable_schema
- dataclasses
- TestIdentity
- complete
- logging_config.py
- app/layout.tsx
- build_conversation_input
- TestSearchPlanner
- TestCruxSplitter
- judge.py
- _flat
- consent.ts
- track
- import_guest_conversation
- prompt_builder.py
- StartChat.tsx
- nspell
- TestCompleteRoute
- guest_chat
- TestFallbackToolTranslation
- TestRoutes
- e0f1a2b3c4d5_legal_mode.py
- memory_service.py
- Settings
- TestKeepingTheDemoConversation
- deploy-backend.sh
- documents.py
- start.sh
- postcss.config.mjs
- _content_blocks
- TourOverlay
- devDependencies
- dependencies
- search_history
- _TextOnly
- pytest
- HealthStatus.tsx
- get_validation
- Document
- scripts
- _worth_retrying
- TestModes
- Graphify + Antigravity Project Workflow & Setup Guide
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `cx()` - 96 edges
2. `react` - 77 edges
3. `apiFetch()` - 66 edges
4. `authErrorMessage()` - 61 edges
5. `send_message()` - 60 edges
6. `track()` - 46 edges
7. `event_stream()` - 45 edges
8. `ChatView()` - 43 edges
9. `generate_structured()` - 36 edges
10. `Spinner()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `rebuild_memory_task()` --references--> `task()`  [EXTRACTED]
  backend/app/workers/rebuild_memory.py → evals/run.py
- `rebuild_profile_task()` --references--> `task()`  [EXTRACTED]
  backend/app/workers/rebuild_profile.py → evals/run.py
- `TestCruxSplitter` --uses--> `CruxSplitter`  [INFERRED]
  backend/tests/test_claim_parser.py → backend/app/services/claim_parser.py
- `set_active_branch()` --uses--> `ActiveLeafIn`  [INFERRED]
  backend/app/api/chat.py → backend/app/schemas/chat.py
- `save_call_transcript()` --uses--> `CallTranscript`  [INFERRED]
  backend/app/api/chat.py → backend/app/schemas/chat.py

## Import Cycles
- None detected.

## Communities (159 total, 35 thin omitted)

### Community 0 - "tour.tsx"
Cohesion: 0.22
Nodes (17): advanceTour(), endTour(), getServerTourSnapshot(), getTourSnapshot(), IDLE_STATE, readStoredState(), setTourState(), startTour() (+9 more)

### Community 1 - "authErrorMessage"
Cohesion: 0.07
Nodes (40): handleSubmit(), handleSubmit(), handleSubmit(), PageProps, WorkspacePage(), ChatView(), handleDeleteMessage(), handlePlayAudio() (+32 more)

### Community 2 - "parse_export"
Cohesion: 0.10
Nodes (23): _clean(), _looks_like(), _parse_chatgpt(), _parse_claude(), parse_export(), _parse_gemini(), ValueError, Reading a user's history out of another assistant's export. There is no API for… (+15 more)

### Community 3 - "MessageInput.tsx"
Cohesion: 0.06
Nodes (52): attachmentProblem(), DOCUMENT_ACCEPT, DOCUMENT_EXTENSIONS, fileExtension(), LEGACY_EXTENSIONS, MessageInput(), acceptGhost(), handleChange() (+44 more)

### Community 4 - "models/__init__.py"
Cohesion: 0.11
Nodes (38): hash_password(), Base, Conversation, DocumentChunk, ConversationMemory, AudioTranscript, Citation, ClaimEvidence (+30 more)

### Community 5 - "taxonomy.py"
Cohesion: 0.07
Nodes (61): get_bias(), list_biases(), list_categories(), list_decision_categories(), get, User, _to_out(), _classify() (+53 more)

### Community 6 - "thinking_review.py"
Cohesion: 0.47
Nodes (5): _build_instructions(), What Thinking mode shows instead of evidence. Claims and citations are the…, {"sound": [...], "biased": [...]} or None. Never raises., review_thinking(), _text()

### Community 7 - "apiFetch"
Cohesion: 0.07
Nodes (47): AdminPage(), metadata, handleSubmit(), ChatPage(), PageProps, ProfilePage(), SettingsPage(), StartPage() (+39 more)

### Community 8 - "office_export.py"
Cohesion: 0.17
Nodes (14): build_outline(), export_file(), Turning a Creative-mode answer into an actual file. The chat model already…, Returns (file_bytes, filename). Exceptions propagate as-is - the caller…, render_pptx(), render_xlsx(), _safe_filename(), The renderers only - build_outline needs a real model call, so it's exercised… (+6 more)

### Community 9 - "guest_demo.py"
Cohesion: 0.22
Nodes (14): _address_key(), charge(), exhausted(), _get(), _global_key(), over_global_budget(), The allowance behind the landing page's try-it-here box. Someone who has not…, Add one turn's tokens to both counters. Returns the session total. Charged… (+6 more)

### Community 10 - "react"
Cohesion: 0.07
Nodes (52): ForgotPasswordPage(), LoginPage(), RegisterPage(), ResetPasswordForm(), ResetPasswordPage(), LegalLayout(), QUESTIONS, WelcomePage() (+44 more)

### Community 11 - "client"
Cohesion: 0.06
Nodes (23): AsyncClient, client(), parametrize, Two devices hold two refresh tokens for one account. Refreshing on one must not…, A chat can be re-filed under another workspace the user belongs to, and only…, An account cannot be created without accepting, and what was accepted is…, The other two edits on the chat menu. Needs a database., Register -> not yet onboarded -> answer the welcome questions -> stamped,… (+15 more)

### Community 12 - "api/chat.py"
Cohesion: 0.17
Nodes (21): ActiveLeafIn, CallTranscript, CallTurn, ClaimOut, ConversationCreate, ConversationUpdate, EvidenceOut, ExportFileIn (+13 more)

### Community 13 - "guest.py"
Cohesion: 0.09
Nodes (40): Help with the message before it is sent: inline completion. As the user types,…, The new part only. The model returns the whole sentence, typed part included,…, _tidy(), get_current_user(), User, The try-it-here box on the landing page. A visitor with no account can ask the…, get_memory(), AsyncSession (+32 more)

### Community 14 - "LandingPage.tsx"
Cohesion: 0.14
Nodes (19): ModeSwitchToast(), CurtainShimmer(), HeroComposer(), HeroMode, Phase, QUESTION_BY_MODE, shuffle(), CURTAIN_GEOMETRY (+11 more)

### Community 15 - "_accent_instructions"
Cohesion: 0.16
Nodes (15): _accent_instructions(), CallContext, _clean(), create_realtime_session(), AsyncSession, BaseModel, post, User (+7 more)

### Community 16 - "anthropic_client.py"
Cohesion: 0.11
Nodes (34): _base_kwargs(), _claude_generate_structured(), _claude_generate_text(), _claude_stream_generation(), _create_message(), DeltaEvent, DoneEvent, _drop_temperature() (+26 more)

### Community 17 - "ingest_document.py"
Cohesion: 0.07
Nodes (35): asyncio, do_run_migrations(), Run migrations in 'online' mode., Run migrations in 'offline' mode. This configures the context with just a URL…, In this scenario we need to create an Engine and associate a connection with…, run_async_migrations(), run_migrations_offline(), run_migrations_online() (+27 more)

### Community 18 - "guestHandoff.ts"
Cohesion: 0.16
Nodes (22): AppNotices(), claimTheGreeting(), SavedFromDemo(), subscribe(), WelcomeBack(), firstNameOf(), Greeting, greetingFor() (+14 more)

### Community 19 - "openai_client.py"
Cohesion: 0.10
Nodes (35): _build_input(), _create_embeddings(), _create_response(), _create_speech(), _create_transcription(), DeltaEvent, DoneEvent, embed_texts() (+27 more)

### Community 20 - "ChatView.tsx"
Cohesion: 0.05
Nodes (68): Home(), ChatGreeting(), subscribe(), AvatarCue, Conversation, EMPTY_MODES, GESTURE_BY_MODE, ExportFileMenu() (+60 more)

### Community 21 - "cx"
Cohesion: 0.06
Nodes (40): ModeCarousel(), StepButton(), ModeSelector(), RefinedQuestionCard(), CompanionNames(), commit(), AccountMenu(), Chevron() (+32 more)

### Community 22 - "package.json"
Cohesion: 0.12
Nodes (15): eslintConfig, name, private, version, dictionary-en, dictionary-en-gb, eslint, eslint-config-next (+7 more)

### Community 23 - "InstallAppButton.tsx"
Cohesion: 0.28
Nodes (5): BeforeInstallPromptEvent, Environment, getEnvironment(), InstallAppButton(), subscribeNever()

### Community 25 - "test_anthropic_client.py"
Cohesion: 0.12
Nodes (14): CircuitBreakerOpenError, is_provider_unavailable_error(), RuntimeError, _supports_effort(), _FakeAPIError, Exception, parametrize, The provider-shim behaviour, which is where a migration hides its bugs. The… (+6 more)

### Community 26 - "MessageList.tsx"
Cohesion: 0.07
Nodes (49): ClarifierCard(), ConfidenceBadge(), CruxCard(), Chip(), DecisionReview(), Heading(), Tick(), Warn() (+41 more)

### Community 27 - "get_conversation_for_user"
Cohesion: 0.13
Nodes (39): _all_messages(), _conversation_out(), create_conversation(), delete_conversation(), delete_message(), devils_advocate(), export_conversation(), export_file() (+31 more)

### Community 28 - "image_generation.py"
Cohesion: 0.08
Nodes (33): _check_database(), _check_redis(), _check_storage(), health_check(), get, get, UUID, Serving a generated image back to the page that asked for it. Deliberately… (+25 more)

### Community 29 - "web_research.py"
Cohesion: 0.08
Nodes (32): gather_context(), _keyword_query(), _merge_sources(), Web research with a supervisor that doesn't take the first answer. Used when…, What the loop settled on, and how it got there., One Tavily query. Empty on any failure - the caller has other queries in flight…, The claim boiled down to its content words - names, numbers, terms - which is…, The queries one round fires at once - the branches of the search. The first… (+24 more)

### Community 30 - "test_message_tree.py"
Cohesion: 0.11
Nodes (18): active_path(), descendants(), latest_leaf(), UUID, The active branch of a conversation - forking's replacement for a flat message…, Descend from `from_id`, always taking the most recently created child, until…, Root-to-leaf order. `messages` must be every row for the conversation the leaf…, Every message sharing `of`'s parent (or every root message of the same… (+10 more)

### Community 31 - "profile_prompt_block"
Cohesion: 0.12
Nodes (14): profile_prompt_block(), Compact profile context for the generation prompt. Deliberately framed as…, extract(), looks_like_self_talk(), merge(), Catching what someone tells you about themselves, when they tell you. The…, Fold newly stated facts into the aspect list. Matched on the label, case-…, Whether this message is worth asking the model about at all. (+6 more)

### Community 32 - "api/admin_dashboard.py"
Cohesion: 0.08
Nodes (33): dynamic_query(), _jsonable(), overview(), AsyncSession, get, post, User, The administrator's view: who is signed up, and what they are costing. Read-… (+25 more)

### Community 33 - "upload_document"
Cohesion: 0.23
Nodes (15): delete_document(), _excerpt_around(), get_document(), list_documents(), AsyncSession, delete, get, post (+7 more)

### Community 34 - "_preview_status"
Cohesion: 0.20
Nodes (15): close_preview(), open_preview(), _preview_status(), AsyncSession, delete, get, post, User (+7 more)

### Community 35 - "_serialize"
Cohesion: 0.15
Nodes (25): add_aspect(), clear_profile(), complete_onboarding(), import_history(), AsyncSession, delete, post, put (+17 more)

### Community 36 - "send_message"
Cohesion: 0.10
Nodes (20): _derive_title(), EventSourceResponse, A short label for a conversation, from its opening message. Deliberately not an…, send_message(), mark(), _plan(), _prefetch(), InvalidModeError (+12 more)

### Community 37 - "security.py"
Cohesion: 0.13
Nodes (20): create_access_token(), create_password_reset_token(), create_refresh_token(), decode_token(), InvalidTokenError, password_fingerprint(), Exception, UUID (+12 more)

### Community 38 - "previewAccess.ts"
Cohesion: 0.16
Nodes (18): Model, MODELS, Tile, TILES, UpgradeDialog(), togglePreview(), closePreviewAccess(), emit() (+10 more)

### Community 39 - "admin_settings_service.py"
Cohesion: 0.13
Nodes (22): Any, get_settings(), AsyncSession, get, put, User, update_setting(), AsyncSession (+14 more)

### Community 40 - "api/auth.py"
Cohesion: 0.10
Nodes (47): _client_ip(), confirm_password_reset(), delete_me(), ensure_workspace(), _issue_tokens(), login(), me(), oauth_google() (+39 more)

### Community 41 - "CitationPopover.tsx"
Cohesion: 0.27
Nodes (11): CitationPopover(), credibilityPhrase(), ExternalLinkIcon(), factualEvidence(), hostOf(), relevancePhrase(), SUPPORT_BANDS, supportPhrase() (+3 more)

### Community 42 - "AdminDashboard.tsx"
Cohesion: 0.21
Nodes (16): AdminDashboard(), Bucket, Card(), Flag(), Overview, QueryResult, shortDate(), Stat() (+8 more)

### Community 43 - "compute_claim_score"
Cohesion: 0.21
Nodes (6): compute_claim_score(), claim_score = 100 * (0.7*support + 0.3*relevance) of whichever evidence item…, ev(), Web sources gathered before generation carry no credibility judgement - the…, TestClaimScore, TestUnmeasuredRelevance

### Community 44 - "_Response"
Cohesion: 0.08
Nodes (12): ASGIApp, CorrelationIdMiddleware, Request, Accepts an inbound X-Request-ID (useful if a frontend/proxy already assigns…, _body(), _Client, Where a search looks, and how recent it is willing to be. No network. What…, Captures the body instead of sending it. (+4 more)

### Community 45 - "document_ingestion.py"
Cohesion: 0.21
Nodes (13): build_chunks(), chunk_text(), _decode(), extract_pages(), UUID, Returns (page_number, text) pairs. page_number is 1-indexed for PDFs and slide…, Extract, chunk and embed one file: the rows to insert, not yet added to any…, _rtf_text() (+5 more)

### Community 46 - "workspaces.py"
Cohesion: 0.27
Nodes (17): create_workspace(), delete_workspace(), _get_membership(), get_workspace(), list_workspaces(), AsyncSession, delete, get (+9 more)

### Community 47 - "get_profile"
Cohesion: 0.27
Nodes (13): capture_stated_facts(), gather_evidence(), get_profile(), AsyncSession, UUID, Regenerate and persist. A hand-edited profile is left untouched., Fold anything the user just said about themselves into their profile. Called…, The user's own words plus their document titles, and how many of their messages… (+5 more)

### Community 48 - "clean_names"
Cohesion: 0.17
Nodes (8): clean_names(), name_for(), What the user calls their companion, per mode. One name per cognitive mode,…, Whatever came in, reduced to names we will actually show. Unknown modes are…, parametrize, Naming your companion. A display label the user chose, so the guards are about…, TestCleanNames, TestNameFor

### Community 49 - "strip_opinion_preface"
Cohesion: 0.33
Nodes (3): strip_opinion_preface(), Belt-and-suspenders for prompt_builder's opinion-framing instruction - the…, TestOpinionPreface

### Community 50 - "test_prompts.py"
Cohesion: 0.17
Nodes (8): decision_tree_block(), monitoring_block(), The client's Thinking Framework Matrix, as prompt guidance. The matrix's own…, Guidance for choosing *how* to reason. Never shown to the user., Matrix section 8's last two fields. The monitoring question and the escalation…, thinking_framework_block(), What we tell the model. These are string assertions rather than model calls:…, TestTaxonomy

### Community 51 - "test_ingestion.py"
Cohesion: 0.16
Nodes (10): file_type_of(), None when the type can be read; otherwise the sentence to show., unsupported_reason(), _docx(), _pptx(), parametrize, Every document type the composer and the uploader accept is readable., TestExtractPages (+2 more)

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
Cohesion: 0.13
Nodes (12): ev_identity_no_vendor_leak(), ev_llm_judge_rubric(), ev_no_bias_watch_prose(), ev_no_self_labeling_in_prose(), ev_plain_text_no_markdown(), ev_uncited_claims_score_low(), Deterministic checks, plus the one generic hook into the LLM judge. Signature…, A structural invariant, checked on every case that returns claims, not just the… (+4 more)

### Community 57 - "run.py"
Cohesion: 0.16
Nodes (15): argparse, collections, dotenv, The cases, and what each one is actually checking. Every case here traces back…, Create the dataset if it doesn't exist, then upsert every case by its stable…, sync_dataset(), build_task(), main() (+7 more)

### Community 58 - "theme.tsx"
Cohesion: 0.24
Nodes (14): Appearance(), Accent, accentApplies(), ACCENTS, announce(), applyAccent(), applyTheme(), currentTheme() (+6 more)

### Community 59 - "BackendClient"
Cohesion: 0.18
Nodes (6): BackendClient, _random_password(), Up to three attempts on a 5xx, with backoff. Measured directly against…, Reuse a cached eval account, or create one. Never touches a real user's account…, One workspace named "Evals", reused across runs rather than created fresh each…, Only ever sets one mode's name, on an account that exists solely to run evals -…

### Community 60 - "AvatarPanel.tsx"
Cohesion: 0.18
Nodes (12): Arm(), ARM_ANGLES, AvatarExpression, AvatarGesture, AvatarPanel(), AvatarState, EXPRESSION_EYEBROW_ROTATION, IDLE_CYCLE (+4 more)

### Community 61 - "extract_claims"
Cohesion: 0.20
Nodes (5): extract_claims(), Parses <claim id="n">...</claim> blocks out of the model's raw output. Recovers…, extract_claims used to be a block-matching regex: one unclosed tag anywhere…, TestExtractClaims, TestExtractClaimsRecovery

### Community 62 - "compute_message_score"
Cohesion: 0.25
Nodes (7): compute_message_score(), §9.3 weights and band cutoffs, overridable via /admin (§11.8/FR14). These field…, §9.3: message-level rollup + distortion penalty/band cap., ScoredClaim, ScoringWeights, Nothing in it claimed to be a fact, so there is nothing to verify - and "Needs…, TestMessageScore

### Community 63 - "rescore_after_reconciliation"
Cohesion: 0.24
Nodes (9): Recompute a gray_area claim once the blind pass has ruled on it. Returns None…, Ranking key. Unmeasured relevance contributes nothing to the ranking but…, 0-100 for one piece of evidence. When relevance is unmeasured the score is…, rescore_after_reconciliation(), score_of(), ScoredEvidence, _weight(), The second-level pass rules on the first pass's *support* judgement, and the… (+1 more)

### Community 64 - "_validate_clarifying_options"
Cohesion: 0.18
Nodes (4): Both fields or neither - a question with one option isn't a choice, and options…, _validate_clarifying_options(), The pre-answer "which did you mean" - clickable options for a missing,…, TestClarifyingOptionsGuards

### Community 65 - "SourcesFooter.tsx"
Cohesion: 0.48
Nodes (6): collectSources(), DocIcon(), GlobeIcon(), hostOf(), Source, SourcesFooter()

### Community 66 - "test_learning_role.py"
Cohesion: 0.23
Nodes (7): LearningRoleRequest, Who the user is when they are learning. A closed set, because it steers the…, instructions(), parametrize, Who the user is when they are learning, and what it does to the prompt. No…, TestTheClosedSet, TestWhatItDoesToThePrompt

### Community 67 - "record"
Cohesion: 0.29
Nodes (8): Grok. xAI speaks the OpenAI chat-completions wire format, so this is that shape…, One `data:` line's JSON, or None for everything else in the frame., Gemini, over generativelanguage's SSE endpoint., _sse_payloads(), stream_google(), stream_xai(), Called by the model clients. Silent when no meter is open., record()

### Community 68 - "is_resolvable"
Cohesion: 0.20
Nodes (7): is_resolvable(), location_prompt_line(), False for anything a lookup can't say anything useful about., One line of background, hedged on purpose. Stated as where they *appear* to be…, Sign-in location. No network here - the lookup is verified by hand against a…, TestPromptLine, TestResolvableFilter

### Community 69 - "_validate_context_question"
Cohesion: 0.19
Nodes (4): Drop anything that is not one plain open question. The guards are cheap and the…, _validate_context_question(), The "why" asked before answering. The judgement itself is the model's; these…, TestContextQuestionGuards

### Community 70 - "clean_output"
Cohesion: 0.13
Nodes (13): clean_output(), Making the model's output look like what the UI actually renders. The chat…, Removes the model's own evidential-status asides from the prose., Everything, in the order the passes expect., Em/en dashes to spaced hyphens. Existing hyphens are left alone., HTML and unrendered Markdown out; the rendered set normalised., replace_dashes(), strip_markup() (+5 more)

### Community 71 - "event_stream"
Cohesion: 0.07
Nodes (29): _in_background(), _no_text(), A generation that produces nothing, for a turn whose answer is a picture.…, The new name if it lands within `wait_seconds` (written to the row here, sent…, event_stream(), metered_stream(), _settle_title(), _store_counterfactual() (+21 more)

### Community 72 - "CruxSplitter"
Cohesion: 0.16
Nodes (6): CruxSplitter, Streaming counterpart of extract_crux. The crux is the first thing the model…, Returns (crux_text_if_it_just_resolved, text_to_pass_downstream)., Anything still held when the stream ends (e.g. an unclosed crux)., The gist is one sentence, however much the model hands over as the crux., TestGistLength

### Community 73 - "api/profile.py"
Cohesion: 0.32
Nodes (12): list_roles(), get, The 25-role framework, for rendering the profile editor., OnboardingAnswerIn, OnboardingRequest, ProfileAspectIn, ProfileAspectOut, ProfileRoleOut (+4 more)

### Community 74 - "test_scoring.py"
Cohesion: 0.19
Nodes (10): build_scored_evidence(), MessageScore, 0 fabricated, 21-40 distorted, 41-80 gray_area, 81-99 probable_fact, 100…, `markers` are the 1-indexed CONTEXT positions a claim cited. Markers…, veracity_tier(), EvidenceVerification, Claim and message scoring. The regression these guard against is the one that…, TestEvidenceAssembly (+2 more)

### Community 75 - "fake"
Cohesion: 0.16
Nodes (8): The gates judge a follow-up against the whole thread, not the newest line alone…, The reviewer's judgement isn't testable here; its guards are, and each one…, TestDecisionReviewGuards, fake(), fake(), fake(), fake(), TestGuidanceSeesTheConversation

### Community 76 - "LearningRoleCard.tsx"
Cohesion: 0.30
Nodes (12): LearningRoleCard(), choose(), OPTIONS, emit(), getLearningRole(), getServerLearningRole(), Known, LearningRole (+4 more)

### Community 77 - "analytics.ts"
Cohesion: 0.33
Nodes (12): Analytics(), analyticsEnabled(), AnalyticsEvent, AnalyticsProps, getClient(), identify(), on(), resetIdentity() (+4 more)

### Community 78 - "model_catalog.py"
Cohesion: 0.27
Nodes (11): list_models(), The models a user may pick from in this mode. Empty in every mode but Learning…, allows_picking(), available(), _catalog(), get(), _has_key(), The models a user may pick from, in the two modes where picking is theirs.… (+3 more)

### Community 79 - "decision_review.py"
Cohesion: 0.20
Nodes (9): _build_instructions(), _build_suggestions(), Judging the options the user brought, not the ones we would have picked.…, One sound decision beside the wrong calls people actually make. The set only…, Returns the review stored on the message, or None when there was no menu of…, review_decisions(), _text(), One sound decision beside the wrong calls. These guards exist because the… (+1 more)

### Community 80 - "test_guidance.py"
Cohesion: 0.13
Nodes (13): _clip(), _history_block(), propose_guidance(), Three judgements about the question, made before the answer exists. All are…, Trim to a word boundary, never mid-word. A hard slice produced suggestions…, Drop rewrites that ask the user to fill in a blank. "I want to get better at…, Returns the guidance object stored on the message, or None. `history` is the…, _reject_placeholders() (+5 more)

### Community 81 - "build_system_instructions"
Cohesion: 0.27
Nodes (4): build_system_instructions(), Returns Anthropic content blocks, not a string - the split is the point.…, The split that makes caching possible: content byte-identical for every user in…, TestPromptCaching

### Community 82 - "claim_parser.py"
Cohesion: 0.24
Nodes (8): fit_gist(), _is_partial_close(), _is_partial_open(), ParsedClaim, Returns (gist, overflow): the first sentence of `text`, tag- and citation-free,…, Non-streaming version of the same stripping, for text we already have in full…, _split_result(), strip_claim_tags()

### Community 83 - "ClaimTagStripper"
Cohesion: 0.27
Nodes (4): ClaimTagStripper, Incrementally strips <claim id="n"> / </claim> tags from a stream of text…, TestStreamingStripperWithOpinionTag, TestClaimTagStripper

### Community 84 - "test_claim_parser.py"
Cohesion: 0.25
Nodes (4): extract_crux(), Pulls a leading <crux>...</crux> block off the front of raw text. Returns…, Claim tag parsing, including the opinion attribute. <claim id="n"…, TestExtractCrux

### Community 85 - "split_leading_sentence"
Cohesion: 0.29
Nodes (4): Fallback for an answer that opens with no <crux> block: peel the opening…, split_leading_sentence(), Rapid mode's fallback when the model skipped the <crux> wrapper: the first…, TestSplitLeadingSentence

### Community 86 - "trim_history"
Cohesion: 0.24
Nodes (5): The conversation so far, cut to something that cannot be abused. Oldest turns…, trim_history(), The landing page's try-it-here allowance. The counters themselves need Redis,…, TestHistoryIsNotAnOpenDoor, TestTheAllowance

### Community 87 - "token_meter.py"
Cohesion: 0.22
Nodes (8): stream(), current(), meter(), What a turn cost, in tokens. `messages.token_usage` has existed since the first…, Open a meter for the duration of one turn. Nested meters are not a thing here;…, TurnUsage, contextlib, contextvars

### Community 88 - "export_service.py"
Cohesion: 0.42
Nodes (9): MessageOut, build_markdown_export(), build_pdf_export(), _exported_at(), _line(), _message_header(), _pdf_safe(), FPDF (+1 more)

### Community 89 - "privacy/page.tsx"
Cohesion: 0.42
Nodes (7): LegalPage(), Section(), Table(), metadata, PrivacyPage(), metadata, TermsPage()

### Community 90 - "LiveCall"
Cohesion: 0.31
Nodes (3): CallSession(), LiveCallOverlay(), LiveCall

### Community 91 - "Message"
Cohesion: 0.29
Nodes (8): Conversation, The path a user actually sees, each message annotated with where it sits among…, _serialize_active_path(), _serialize_message(), Message, needs_rewriting(), optimize_query(), §5.2 step 3 / reconciliation note: ambiguity detection and query rewriting…

### Community 92 - "preview_access.py"
Cohesion: 0.24
Nodes (11): daily_limit(), is_preview_mode(), _key(), preview_modes(), The preview grant: paid-tier companions, opened to the people testing this…, How many preview-mode messages this user has sent today. 0 when the counter is…, Count one preview-mode message and return the new total., spend() (+3 more)

### Community 93 - "_CircuitBreaker"
Cohesion: 0.14
Nodes (7): _CircuitBreaker, _CircuitBreaker, CircuitBreakerOpenError, RuntimeError, The model returned something that isn't the requested object., §14 resilience: short-circuits calls after repeated failures instead of letting…, StructuredOutputError

### Community 94 - "_portable_schema"
Cohesion: 0.33
Nodes (4): _portable_schema(), Rewrite nullable enums into the form this API's validator accepts. `{"type":…, Nullable enums. `{"type": ["string","null"], "enum": [...]}` is valid JSON…, TestPortableSchema

### Community 95 - "dataclasses"
Cohesion: 0.20
Nodes (6): AvatarCue, compute_avatar_cue(), §8.4: two independent signals combine once confidence scoring completes. A…, The fastest useful answer: a real mode everywhere a mode is checked, with its…, TestRapidMode, dataclasses

### Community 96 - "TestIdentity"
Cohesion: 0.22
Nodes (3): Which AI should I use" is answered as itself, in every mode - including…, The rule is about not volunteering. Asked directly, it answers - and it never…, TestIdentity

### Community 97 - "complete"
Cohesion: 0.29
Nodes (8): complete(), CompleteOut, CompleteRequest, BaseModel, post, Request, User, Empty completion, never an error, whenever nothing sensible can be offered -…

### Community 98 - "logging_config.py"
Cohesion: 0.18
Nodes (9): configure_logging(), _CorrelationIdFilter, §14 Observability: structured logging + request tracing via a correlation ID…, LogRecord, starlette_middleware_base, starlette_requests, starlette_responses, starlette_types (+1 more)

### Community 99 - "app/layout.tsx"
Cohesion: 0.20
Nodes (11): frontend_app_globals, geistMono, geistSans, metadata, outfit, RootLayout(), viewport, AccentScope() (+3 more)

### Community 100 - "build_conversation_input"
Cohesion: 0.43
Nodes (4): build_conversation_input(), `history` is the verbatim short-term window (oldest-first); anything older than…, The clarifying question has to reach the model, or the answer to it is a non-…, TestClarifierInHistory

### Community 103 - "judge.py"
Cohesion: 0.50
Nodes (4): Anthropic, _client(), An LLM judge, separate from the product it is grading. Deterministic checks…, os

### Community 104 - "_flat"
Cohesion: 0.38
Nodes (3): _flat(), `build_system_instructions` returns cache-annotated content blocks, not a…, TestPromptWiring

### Community 105 - "consent.ts"
Cohesion: 0.30
Nodes (9): ConsentBanner(), Consent, consentGranted(), getSnapshot(), listeners, read(), setConsent(), useConsent() (+1 more)

### Community 106 - "track"
Cohesion: 0.09
Nodes (27): Action, ChatRowMenu(), patch(), remove(), ChatRowWorkspace, Kebab(), PinIcon(), FeedbackWidget() (+19 more)

### Community 107 - "import_guest_conversation"
Cohesion: 0.20
Nodes (11): GuestRequest, GuestTurn, import_guest_conversation(), ImportRequest, ImportResult, ImportTurn, AsyncSession, BaseModel (+3 more)

### Community 108 - "prompt_builder.py"
Cohesion: 0.29
Nodes (9): embed_text(), build_context_block(), Numbered context the model cites with [n] markers. Documents come first and…, AsyncSession, UUID, Top-k pgvector similarity search over the workspace's processed documents. Runs…, retrieve_chunks(), RetrievedChunk (+1 more)

### Community 109 - "StartChat.tsx"
Cohesion: 0.35
Nodes (8): Conversation, StartChat(), go(), Workspace, Rabbit(), ThinkingIndicator(), lastWorkspaceId(), rememberWorkspace()

### Community 112 - "guest_chat"
Cohesion: 0.24
Nodes (10): _address(), guest_budget(), guest_chat(), _limit_reached(), EventSourceResponse, get, Request, UUID (+2 more)

### Community 115 - "e0f1a2b3c4d5_legal_mode.py"
Cohesion: 0.83
Nodes (3): downgrade(), _swap(), upgrade()

### Community 126 - "memory_service.py"
Cohesion: 0.36
Nodes (8): get_memory_summary(), AsyncSession, UUID, Regenerates the rolling summary from everything older than the short-term…, rebuild_memory_summary(), UUID, _rebuild(), rebuild_memory_task()

### Community 128 - "TestKeepingTheDemoConversation"
Cohesion: 0.36
Nodes (3): `POST /guest/import` - the promise made at the sign-up wall. The transcript…, TestKeepingTheDemoConversation, _uuid_of()

### Community 130 - "documents.py"
Cohesion: 0.47
Nodes (7): AttachmentHitOut, AttachmentSearchOut, DocumentDetailOut, DocumentOut, DocumentUploadOut, BaseModel, One passage inside an attachment that matched a search.

### Community 140 - "_content_blocks"
Cohesion: 0.33
Nodes (4): _content_blocks(), §12.2: images ride along as vision context for this turn only. The frontend…, Attachments. The frontend sends data URIs; this API wants media type and…, TestContentBlocks

### Community 141 - "TourOverlay"
Cohesion: 0.39
Nodes (7): resolveVisibleTarget(), TourOverlay(), placeCallout(), tick(), layoutViewport(), toLayoutRect(), uiZoom()

### Community 142 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 143 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, dictionary-en, dictionary-en-gb, next, nspell, posthog-js, react, react-dom

### Community 144 - "search_history"
Cohesion: 0.29
Nodes (6): AsyncSession, get, User, UUID, search_history(), ImportedHistory

### Community 145 - "_TextOnly"
Cohesion: 0.29
Nodes (3): _html_text(), _TextOnly, HTMLParser

### Community 146 - "pytest"
Cohesion: 0.33
Nodes (6): _clear_rate_limits(), _dispose_pools_between_tests(), Return every pooled connection before the test's event loop closes. asyncpg and…, Rate limiting is infrastructure these tests run through, not the thing under…, fixture, pytest

### Community 147 - "HealthStatus.tsx"
Cohesion: 0.33
Nodes (4): DependencyStatus, HealthResponse, LoadState, BACKEND_ROOT_URL

### Community 148 - "get_validation"
Cohesion: 0.40
Nodes (5): get_validation(), AsyncSession, get, User, UUID

### Community 149 - "Document"
Cohesion: 0.70
Nodes (3): Document, render_docx(), TestRenderDocx

### Community 150 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 154 - "_worth_retrying"
Cohesion: 0.67
Nodes (3): BaseException, Retry transient failures only. A 4xx other than 429 is the API telling us the…, _worth_retrying()

## Knowledge Gaps
- **210 isolated node(s):** `graphify`, `Workflow: graphify`, `1. New Project Setup (One-Time)`, `AnalyticsEvent`, `AnalyticsProps` (+205 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 852 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `build_system_instructions()` connect `build_system_instructions` to `test_learning_role.py`, `send_message`, `_flat`, `prompt_builder.py`, `api/chat.py`, `guest.py`, `guest_chat`, `clean_names`, `test_prompts.py`, `_flat`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `event_stream()` connect `event_stream` to `models/__init__.py`, `api/chat.py`, `anthropic_client.py`, `test_anthropic_client.py`, `web_research.py`, `send_message`, `compute_claim_score`, `get_profile`, `extract_claims`, `compute_message_score`, `rescore_after_reconciliation`, `test_learning_role.py`, `clean_output`, `CruxSplitter`, `test_scoring.py`, `claim_parser.py`, `ClaimTagStripper`, `test_claim_parser.py`, `split_leading_sentence`, `Message`, `dataclasses`, `build_conversation_input`, `prompt_builder.py`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `tour.tsx`, `authErrorMessage`, `MessageInput.tsx`, `apiFetch`, `LandingPage.tsx`, `guestHandoff.ts`, `HealthStatus.tsx`, `ChatView.tsx`, `cx`, `package.json`, `InstallAppButton.tsx`, `MessageList.tsx`, `previewAccess.ts`, `CitationPopover.tsx`, `AdminDashboard.tsx`, `theme.tsx`, `AvatarPanel.tsx`, `LearningRoleCard.tsx`, `analytics.ts`, `privacy/page.tsx`, `consent.ts`, `track`, `StartChat.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `send_message()` (e.g. with `ClaimOut` and `EvidenceOut`) actually correct?**
  _`send_message()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `graphify`, `Workflow: graphify`, `1. New Project Setup (One-Time)` to the rest of the system?**
  _210 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `authErrorMessage` be split into smaller, more focused modules?**
  _Cohesion score 0.07246376811594203 - nodes in this community are weakly interconnected._
- **Should `parse_export` be split into smaller, more focused modules?**
  _Cohesion score 0.09759759759759759 - nodes in this community are weakly interconnected._