# Graph Report - clardentity-mvp-mv  (2026-10-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2768 nodes · 7018 edges · 140 communities (110 shown, 30 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 261 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f4a06d5c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- track
- ChatView.tsx
- parse_export
- MessageInput.tsx
- models/__init__.py
- taxonomy.py
- generate_structured
- apiFetch
- document_ingestion.py
- guest_demo.py
- cx
- client
- api/chat.py
- api/auth.py
- react
- _accent_instructions
- anthropic_client.py
- memory_service.py
- GuestDemo.tsx
- openai_client.py
- apiClient.ts
- AppShell.tsx
- package.json
- ProfileView.tsx
- sqlalchemy_dialects
- test_anthropic_client.py
- MessageList.tsx
- get_conversation_for_user
- image_generation.py
- research_claim
- test_message_tree.py
- primitives.tsx
- api/admin_dashboard.py
- documents.py
- preview_access.py
- _serialize
- send_message
- security.py
- previewAccess.ts
- api/admin.py
- confirm_password_reset
- CitationPopover.tsx
- AdminDashboard.tsx
- compute_claim_score
- _Response
- health.py
- workspaces.py
- profile_service.py
- clean_names
- clean_output
- test_prompts.py
- sse.ts
- compilerOptions
- services/__init__.py
- _flat
- backend_client.py
- evaluators.py
- run.py
- check_rate_limit
- BackendClient
- markdown.tsx
- extract_claims
- compute_message_score
- rescore_after_reconciliation
- _validate_clarifying_options
- ConfidenceBadge.tsx
- test_learning_role.py
- model_router.py
- is_resolvable
- _validate_context_question
- test_output_cleanup.py
- event_stream
- CruxSplitter
- api/profile.py
- test_scoring.py
- fake
- middleware.py
- schemas/auth.py
- model_catalog.py
- _build_suggestions
- test_guidance.py
- build_system_instructions
- claim_parser.py
- ClaimTagStripper
- test_claim_parser.py
- split_leading_sentence
- env.py
- dataclasses
- export_service.py
- privacy/page.tsx
- LiveCall
- _serialize_active_path
- rebuild_memory
- _CircuitBreaker
- _portable_schema
- compute_avatar_cue
- TestIdentity
- complete
- logging_config.py
- password_fingerprint
- build_conversation_input
- needs_live_data
- TestCruxSplitter
- judge.py
- _flat
- DecisionReview.tsx
- FeedbackWidget
- veracity_tier
- _reject_placeholders
- TestGuidanceSeesTheConversation
- nspell
- _tidy
- _round_queries
- TestFallbackToolTranslation
- TestRoutes
- e0f1a2b3c4d5_legal_mode.py
- delete_me
- Settings
- ResearchResult
- deploy-backend.sh
- resolve_login
- start.sh
- postcss.config.mjs

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
- `ingest_document_task()` --references--> `task()`  [EXTRACTED]
  backend/app/workers/ingest_document.py → evals/run.py
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

## Communities (140 total, 30 thin omitted)

### Community 0 - "track"
Cohesion: 0.05
Nodes (76): frontend_app_globals, geistMono, geistSans, metadata, outfit, RootLayout(), viewport, LearningRoleCard() (+68 more)

### Community 1 - "ChatView.tsx"
Cohesion: 0.05
Nodes (55): handleSubmit(), handleSubmit(), handleSubmit(), Arm(), ARM_ANGLES, AvatarExpression, AvatarGesture, AvatarPanel() (+47 more)

### Community 2 - "parse_export"
Cohesion: 0.05
Nodes (40): Refuse anything that is not one plain read. Checked here rather than trusted to…, _vet(), admin_emails(), is_admin(), User, _clean(), ImportedHistory, _looks_like() (+32 more)

### Community 3 - "MessageInput.tsx"
Cohesion: 0.06
Nodes (52): attachmentProblem(), DOCUMENT_ACCEPT, DOCUMENT_EXTENSIONS, fileExtension(), LEGACY_EXTENSIONS, MessageInput(), acceptGhost(), handleChange() (+44 more)

### Community 4 - "models/__init__.py"
Cohesion: 0.09
Nodes (32): hash_password(), Base, Conversation, Document, DocumentChunk, AudioTranscript, Message, ProInterest (+24 more)

### Community 5 - "taxonomy.py"
Cohesion: 0.07
Nodes (56): get_bias(), list_biases(), list_categories(), list_decision_categories(), get, User, _to_out(), _classify() (+48 more)

### Community 6 - "generate_structured"
Cohesion: 0.06
Nodes (51): _plan(), cached(), generate_structured(), A call whose answer is an object, not prose. Every internal step that needs a…, name_conversation(), A name for a conversation, from its first exchange. The sidebar used to show…, Never raises: on any failure the caller keeps `fallback` (the derived…, _tidy() (+43 more)

### Community 7 - "apiFetch"
Cohesion: 0.07
Nodes (45): handleSubmit(), ChatPage(), PageProps, PageProps, WorkspaceDocumentsPage(), PageProps, WorkspacePage(), PageProps (+37 more)

### Community 8 - "document_ingestion.py"
Cohesion: 0.05
Nodes (39): chunk_text(), _decode(), extract_pages(), _html_text(), UUID, Returns (page_number, text) pairs. page_number is 1-indexed for PDFs and slide…, None when the type can be read; otherwise the sentence to show., _rtf_text() (+31 more)

### Community 9 - "guest_demo.py"
Cohesion: 0.05
Nodes (43): _address(), guest_budget(), guest_chat(), GuestRequest, GuestTurn, import_guest_conversation(), ImportRequest, ImportResult (+35 more)

### Community 10 - "cx"
Cohesion: 0.11
Nodes (42): ForgotPasswordPage(), LoginPage(), RegisterPage(), ResetPasswordForm(), ResetPasswordPage(), LegalLayout(), QUESTIONS, WelcomePage() (+34 more)

### Community 11 - "client"
Cohesion: 0.06
Nodes (23): AsyncClient, client(), parametrize, Two devices hold two refresh tokens for one account. Refreshing on one must not…, A chat can be re-filed under another workspace the user belongs to, and only…, An account cannot be created without accepting, and what was accepted is…, The other two edits on the chat menu. Needs a database., Register -> not yet onboarded -> answer the welcome questions -> stamped,… (+15 more)

### Community 12 - "api/chat.py"
Cohesion: 0.08
Nodes (43): _ingest_attachments(), A document attached to a message becomes a workspace document - stored,…, _serialize_message(), get_validation(), AsyncSession, get, User, UUID (+35 more)

### Community 13 - "api/auth.py"
Cohesion: 0.12
Nodes (29): Help with the message before it is sent: inline completion. As the user types,…, get_current_user(), User, The try-it-here box on the landing page. A visitor with no account can ask the…, Interest in the paid tier. The locked model rows in the composer are the only…, Live call: ephemeral credentials for the browser's WebRTC session. The browser…, get_db(), AsyncSession (+21 more)

### Community 14 - "react"
Cohesion: 0.09
Nodes (35): Home(), ModeSelector(), ModeSwitchToast(), CurtainShimmer(), HeroComposer(), HeroMode, Phase, QUESTION_BY_MODE (+27 more)

### Community 15 - "_accent_instructions"
Cohesion: 0.08
Nodes (26): _accent_instructions(), CallContext, _clean(), create_realtime_session(), AsyncSession, BaseModel, post, User (+18 more)

### Community 16 - "anthropic_client.py"
Cohesion: 0.08
Nodes (40): _base_kwargs(), _claude_generate_structured(), _claude_generate_text(), _claude_stream_generation(), _create_message(), DeltaEvent, DoneEvent, _drop_temperature() (+32 more)

### Community 17 - "memory_service.py"
Cohesion: 0.08
Nodes (34): asyncio, _celery_redis_url(), kombu refuses a `rediss://` URL that doesn't spell out `ssl_cert_reqs`, raising…, ConversationMemory, email_enabled(), password_reset_html(), Transactional email via Resend. Deliberately a no-op when `RESEND_API_KEY` is…, Returns True if the provider accepted it. Never raises. (+26 more)

### Community 18 - "GuestDemo.tsx"
Cohesion: 0.09
Nodes (35): MessageList(), StreamingMessage, frontend_components_chat_modeselector_cognitivemode, asMessage(), GATE_COPY, GuestDemo(), Phase, AppNotices() (+27 more)

### Community 19 - "openai_client.py"
Cohesion: 0.08
Nodes (39): _build_input(), CircuitBreakerOpenError, _create_embeddings(), _create_response(), _create_speech(), _create_transcription(), DeltaEvent, DoneEvent (+31 more)

### Community 20 - "apiClient.ts"
Cohesion: 0.07
Nodes (30): handlePlayAudio(), ExportFileMenu(), download(), FORMATS, MessageFeedback, ThumbIcon(), upload(), DependencyStatus (+22 more)

### Community 21 - "AppShell.tsx"
Cohesion: 0.09
Nodes (26): StartPage(), Conversation, StartChat(), go(), Workspace, AccountMenu(), Chevron(), GearIcon() (+18 more)

### Community 22 - "package.json"
Cohesion: 0.05
Nodes (37): eslintConfig, dependencies, dictionary-en, dictionary-en-gb, next, nspell, posthog-js, react (+29 more)

### Community 23 - "ProfileView.tsx"
Cohesion: 0.09
Nodes (24): ProfilePage(), SettingsPage(), Aspect, AspectList(), SUGGESTED_LABELS, DeleteAccount(), handleDelete(), ImportHistory() (+16 more)

### Community 25 - "test_anthropic_client.py"
Cohesion: 0.09
Nodes (17): CircuitBreakerOpenError, _content_blocks(), is_provider_unavailable_error(), RuntimeError, §12.2: images ride along as vision context for this turn only. The frontend…, _FakeAPIError, Exception, parametrize (+9 more)

### Community 26 - "MessageList.tsx"
Cohesion: 0.11
Nodes (29): ClarifierCard(), GeneratedImageCard(), GeneratedImagePlaceholder(), ActionIcon(), ChevronIcon(), CopyIcon(), Exchange, findEvidenceForMarker() (+21 more)

### Community 27 - "get_conversation_for_user"
Cohesion: 0.16
Nodes (32): _all_messages(), _conversation_out(), create_conversation(), delete_conversation(), delete_message(), devils_advocate(), export_conversation(), export_file() (+24 more)

### Community 28 - "image_generation.py"
Cohesion: 0.10
Nodes (23): get, UUID, Serving a generated image back to the page that asked for it. Deliberately…, read_generated_image(), generate(), ImageRequest, UUID, Making a picture, in Co-Creative mode only. Co-Creative is the mode whose… (+15 more)

### Community 29 - "research_claim"
Cohesion: 0.12
Nodes (20): gather_context(), _merge_sources(), One Tavily query. Empty on any failure - the caller has other queries in flight…, Interleave the branches' results so each angle gets a fair share of the cap,…, One search round, scored, for use as *context* before generating. Runs…, Search, judge, and keep going until it's good enough or it clearly won't be.…, research_claim(), _search_round() (+12 more)

### Community 30 - "test_message_tree.py"
Cohesion: 0.14
Nodes (14): active_path(), descendants(), latest_leaf(), UUID, Descend from `from_id`, always taking the most recently created child, until…, Root-to-leaf order. `messages` must be every row for the conversation the leaf…, Where a new message attaches: the client's explicit override if it sent one,…, Every message in the subtree rooted at `from_id`, not including `from_id`… (+6 more)

### Community 31 - "primitives.tsx"
Cohesion: 0.09
Nodes (20): AdminSettings(), handleSave(), AvatarGestureMap, FeatureFlags, FLAG_LABELS, GESTURE_OPTIONS, MODES, ScoringWeights (+12 more)

### Community 32 - "api/admin_dashboard.py"
Cohesion: 0.12
Nodes (25): dynamic_query(), _jsonable(), overview(), AsyncSession, get, post, User, The administrator's view: who is signed up, and what they are costing. Read-… (+17 more)

### Community 33 - "documents.py"
Cohesion: 0.17
Nodes (25): AsyncSession, UUID, require_workspace_member(), delete_document(), _excerpt_around(), get_document(), list_documents(), AsyncSession (+17 more)

### Community 34 - "preview_access.py"
Cohesion: 0.11
Nodes (26): close_preview(), open_preview(), _preview_status(), AsyncSession, delete, get, post, User (+18 more)

### Community 35 - "_serialize"
Cohesion: 0.14
Nodes (26): add_aspect(), clear_profile(), complete_onboarding(), import_history(), AsyncSession, delete, get, post (+18 more)

### Community 36 - "send_message"
Cohesion: 0.11
Nodes (17): _derive_title(), EventSourceResponse, Write a finished call into the conversation. Saved unscored and said so plainly…, A short label for a conversation, from its opening message. Deliberately not an…, save_call_transcript(), send_message(), mark(), _prefetch() (+9 more)

### Community 37 - "security.py"
Cohesion: 0.16
Nodes (17): create_access_token(), create_password_reset_token(), create_refresh_token(), decode_token(), InvalidTokenError, Exception, UUID, TokenType (+9 more)

### Community 38 - "previewAccess.ts"
Cohesion: 0.15
Nodes (19): Model, MODELS, Tile, TILES, UpgradeDialog(), togglePreview(), closePreviewAccess(), emit() (+11 more)

### Community 39 - "api/admin.py"
Cohesion: 0.17
Nodes (17): Any, get_settings(), AsyncSession, get, put, User, update_setting(), AdminSetting (+9 more)

### Community 40 - "confirm_password_reset"
Cohesion: 0.23
Nodes (23): _client_ip(), confirm_password_reset(), ensure_workspace(), _issue_tokens(), login(), oauth_google(), provision_new_user(), AsyncSession (+15 more)

### Community 41 - "CitationPopover.tsx"
Cohesion: 0.17
Nodes (19): CitationPopover(), credibilityPhrase(), ExternalLinkIcon(), factualEvidence(), hostOf(), relevancePhrase(), SUPPORT_BANDS, supportPhrase() (+11 more)

### Community 42 - "AdminDashboard.tsx"
Cohesion: 0.18
Nodes (18): AdminPage(), metadata, AdminDashboard(), Bucket, Card(), Flag(), Overview, QueryResult (+10 more)

### Community 43 - "compute_claim_score"
Cohesion: 0.21
Nodes (6): compute_claim_score(), claim_score = 100 * (0.7*support + 0.3*relevance) of whichever evidence item…, ev(), Web sources gathered before generation carry no credibility judgement - the…, TestClaimScore, TestUnmeasuredRelevance

### Community 44 - "_Response"
Cohesion: 0.12
Nodes (7): _body(), _Client, Where a search looks, and how recent it is willing to be. No network. What…, Captures the body instead of sending it., _Response, TestCountryBias, TestNewsIndex

### Community 45 - "health.py"
Cohesion: 0.18
Nodes (16): _check_database(), _check_redis(), _check_storage(), health_check(), get, build_chunks(), Extract, chunk and embed one file: the rows to insert, not yet added to any…, delete_file() (+8 more)

### Community 46 - "workspaces.py"
Cohesion: 0.27
Nodes (17): create_workspace(), delete_workspace(), _get_membership(), get_workspace(), list_workspaces(), AsyncSession, delete, get (+9 more)

### Community 47 - "profile_service.py"
Cohesion: 0.23
Nodes (17): A long-lived, evolving picture of one user. Built by inference from their own…, UserProfile, capture_stated_facts(), gather_evidence(), get_profile(), InferredProfile, AsyncSession, UUID (+9 more)

### Community 48 - "clean_names"
Cohesion: 0.17
Nodes (8): clean_names(), name_for(), What the user calls their companion, per mode. One name per cognitive mode,…, Whatever came in, reduced to names we will actually show. Unknown modes are…, parametrize, Naming your companion. A display label the user chose, so the guards are about…, TestCleanNames, TestNameFor

### Community 49 - "clean_output"
Cohesion: 0.16
Nodes (8): clean_output(), Removes the model's own evidential-status asides from the prose., Everything, in the order the passes expect., strip_opinion_preface(), strip_self_labels(), Belt-and-suspenders for prompt_builder's opinion-framing instruction - the…, TestOpinionPreface, TestSelfLabels

### Community 50 - "test_prompts.py"
Cohesion: 0.13
Nodes (9): decision_tree_block(), monitoring_block(), The client's Thinking Framework Matrix, as prompt guidance. The matrix's own…, Guidance for choosing *how* to reason. Never shown to the user., Matrix section 8's last two fields. The monitoring question and the escalation…, thinking_framework_block(), What we tell the model. These are string assertions rather than model calls:…, TestModes (+1 more)

### Community 51 - "sse.ts"
Cohesion: 0.12
Nodes (16): GuidanceCard(), ThinkingReview(), ChatFinalEvent, ChatStatus, ChatStreamHandlers, ClarifyingOptionsSuggestion, ContextQuestion, Evidence (+8 more)

### Community 52 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 53 - "services/__init__.py"
Cohesion: 0.17
Nodes (8): _looks_like_silence(), §12.1: forwards recorded/uploaded audio to OpenAI's speech-to-text endpoint.…, transcribe_audio(), parametrize, The two things a raw speech-to-text result can't be trusted on, and how…, TestLooksLikeSilence, TestTranscribeAudioReportsRatherThanGuesses, fake_call()

### Community 54 - "_flat"
Cohesion: 0.16
Nodes (7): _flat(), The client's Thinking Framework Matrix, as embedded. Its thesis is that one-…, `build_system_instructions` returns Anthropic content blocks now, not a string…, The rule survived the Thinking Framework Matrix; only its wording moved. These…, TestNoSelfLabelling, TestReasoningLensStaysHidden, TestThinkingFramework

### Community 55 - "backend_client.py"
Cohesion: 0.15
Nodes (12): BackendTurnError, _parse_sse(), RuntimeError, _random_password(), A thin client that talks to Clardentity exactly the way the real frontend does:…, One real turn, waiting for the whole SSE stream. `mode_confirmed` and…, The HTTP request succeeded (200, SSE headers sent) but the turn itself failed…, Every event the server sent, in order, plus the raw text for anything an… (+4 more)

### Community 56 - "evaluators.py"
Cohesion: 0.14
Nodes (10): ev_identity_no_vendor_leak(), ev_llm_judge_rubric(), ev_no_bias_watch_prose(), ev_no_self_labeling_in_prose(), ev_plain_text_no_markdown(), ev_uncited_claims_score_low(), Deterministic checks, plus the one generic hook into the LLM judge. Signature…, A structural invariant, checked on every case that returns claims, not just the… (+2 more)

### Community 57 - "run.py"
Cohesion: 0.16
Nodes (15): argparse, collections, dotenv, The cases, and what each one is actually checking. Every case here traces back…, Create the dataset if it doesn't exist, then upsert every case by its stable…, sync_dataset(), build_task(), main() (+7 more)

### Community 58 - "check_rate_limit"
Cohesion: 0.15
Nodes (14): AsyncSession, post, UploadFile, User, transcribe(), tts(), check_rate_limit(), §14/§15: rate limiting on /auth and /chat to mitigate abuse. Fixed window… (+6 more)

### Community 59 - "BackendClient"
Cohesion: 0.20
Nodes (5): BackendClient, Up to three attempts on a 5xx, with backoff. Measured directly against…, Reuse a cached eval account, or create one. Never touches a real user's account…, One workspace named "Evals", reused across runs rather than created fresh each…, Only ever sets one mode's name, on an account that exists solely to run evals -…

### Community 60 - "markdown.tsx"
Cohesion: 0.21
Nodes (14): CruxCard(), renderBody(), renderCitations(), renderTextWithCitations(), Block, InlineSegment, isTableLine(), renderInline() (+6 more)

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

### Community 65 - "ConfidenceBadge.tsx"
Cohesion: 0.16
Nodes (12): BAND_DOTS, BAND_MEANING, BAND_STYLES, ConfidenceBadge(), TIER_LABELS, collectSources(), DocIcon(), GlobeIcon() (+4 more)

### Community 66 - "test_learning_role.py"
Cohesion: 0.23
Nodes (7): LearningRoleRequest, Who the user is when they are learning. A closed set, because it steers the…, instructions(), parametrize, Who the user is when they are learning, and what it does to the prompt. No…, TestTheClosedSet, TestWhatItDoesToThePrompt

### Community 67 - "model_router.py"
Cohesion: 0.19
Nodes (13): flatten_instructions(), The fallback provider's Responses API takes a plain string; Claude's…, Google and xAI, for the model picker in Learning and Co-Creative. Written…, Grok. xAI speaks the OpenAI chat-completions wire format, so this is that shape…, One `data:` line's JSON, or None for everything else in the frame., Gemini, over generativelanguage's SSE endpoint., _sse_payloads(), stream_google() (+5 more)

### Community 68 - "is_resolvable"
Cohesion: 0.20
Nodes (7): is_resolvable(), location_prompt_line(), False for anything a lookup can't say anything useful about., One line of background, hedged on purpose. Stated as where they *appear* to be…, Sign-in location. No network here - the lookup is verified by hand against a…, TestPromptLine, TestResolvableFilter

### Community 69 - "_validate_context_question"
Cohesion: 0.19
Nodes (4): Drop anything that is not one plain open question. The guards are cheap and the…, _validate_context_question(), The "why" asked before answering. The judgement itself is the model's; these…, TestContextQuestionGuards

### Community 70 - "test_output_cleanup.py"
Cohesion: 0.20
Nodes (7): Em/en dashes to spaced hyphens. Existing hyphens are left alone., HTML and unrendered Markdown out; the rendered set normalised., replace_dashes(), strip_markup(), Output cleanup. Two of these encode bugs that shipped to production: the dash…, TestDashes, TestMarkup

### Community 71 - "event_stream"
Cohesion: 0.15
Nodes (9): _in_background(), _no_text(), A generation that produces nothing, for a turn whose answer is a picture.…, The new name if it lands within `wait_seconds` (written to the row here, sent…, event_stream(), metered_stream(), _settle_title(), _store_counterfactual() (+1 more)

### Community 72 - "CruxSplitter"
Cohesion: 0.16
Nodes (6): CruxSplitter, Streaming counterpart of extract_crux. The crux is the first thing the model…, Returns (crux_text_if_it_just_resolved, text_to_pass_downstream)., Anything still held when the stream ends (e.g. an unclosed crux)., The gist is one sentence, however much the model hands over as the crux., TestGistLength

### Community 73 - "api/profile.py"
Cohesion: 0.36
Nodes (11): list_roles(), The 25-role framework, for rendering the profile editor., OnboardingAnswerIn, OnboardingRequest, ProfileAspectIn, ProfileAspectOut, ProfileRoleOut, ProfileUpdate (+3 more)

### Community 74 - "test_scoring.py"
Cohesion: 0.29
Nodes (7): build_scored_evidence(), MessageScore, `markers` are the 1-indexed CONTEXT positions a claim cited. Markers…, EvidenceVerification, Claim and message scoring. The regression these guard against is the one that…, TestEvidenceAssembly, math

### Community 75 - "fake"
Cohesion: 0.26
Nodes (6): The reviewer's judgement isn't testable here; its guards are, and each one…, TestDecisionReviewGuards, fake(), fake(), fake(), fake()

### Community 76 - "middleware.py"
Cohesion: 0.17
Nodes (9): ASGIApp, CorrelationIdMiddleware, Request, Accepts an inbound X-Request-ID (useful if a frontend/proxy already assigns…, BaseHTTPMiddleware, starlette_middleware_base, starlette_requests, starlette_responses (+1 more)

### Community 77 - "schemas/auth.py"
Cohesion: 0.27
Nodes (10): me(), get, GoogleOAuthRequest, LoginRequest, PasswordResetConfirm, PasswordResetRequest, BaseModel, RefreshRequest (+2 more)

### Community 78 - "model_catalog.py"
Cohesion: 0.27
Nodes (11): list_models(), The models a user may pick from in this mode. Empty in every mode but Learning…, allows_picking(), available(), _catalog(), get(), _has_key(), The models a user may pick from, in the two modes where picking is theirs.… (+3 more)

### Community 79 - "_build_suggestions"
Cohesion: 0.35
Nodes (4): _build_suggestions(), One sound decision beside the wrong calls people actually make. The set only…, One sound decision beside the wrong calls. These guards exist because the…, TestDecisionSuggestionSet

### Community 80 - "test_guidance.py"
Cohesion: 0.23
Nodes (6): _clip(), Trim to a word boundary, never mid-word. A hard slice produced suggestions…, The two per-turn nudges. The model's judgement isn't testable here; what is…, The rule behind the 'it asks several questions' feedback: fast, misspelled…, TestClip, TestTyposAreNotAmbiguity

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

### Community 86 - "env.py"
Cohesion: 0.24
Nodes (9): do_run_migrations(), Run migrations in 'online' mode., Run migrations in 'offline' mode. This configures the context with just a URL…, In this scenario we need to create an Engine and associate a connection with…, run_async_migrations(), run_migrations_offline(), run_migrations_online(), Connection (+1 more)

### Community 87 - "dataclasses"
Cohesion: 0.24
Nodes (7): stream(), current(), meter(), What a turn cost, in tokens. `messages.token_usage` has existed since the first…, Open a meter for the duration of one turn. Nested meters are not a thing here;…, TurnUsage, dataclasses

### Community 88 - "export_service.py"
Cohesion: 0.42
Nodes (9): MessageOut, build_markdown_export(), build_pdf_export(), _exported_at(), _line(), _message_header(), _pdf_safe(), FPDF (+1 more)

### Community 89 - "privacy/page.tsx"
Cohesion: 0.42
Nodes (7): LegalPage(), Section(), Table(), metadata, PrivacyPage(), metadata, TermsPage()

### Community 91 - "_serialize_active_path"
Cohesion: 0.28
Nodes (6): Conversation, The path a user actually sees, each message annotated with where it sits among…, _serialize_active_path(), Every message sharing `of`'s parent (or every root message of the same…, siblings(), TestSiblings

### Community 92 - "rebuild_memory"
Cohesion: 0.31
Nodes (9): get_memory(), AsyncSession, get, post, User, UUID, rebuild_memory(), MemoryOut (+1 more)

### Community 93 - "_CircuitBreaker"
Cohesion: 0.22
Nodes (3): _CircuitBreaker, _CircuitBreaker, §14 resilience: short-circuits calls after repeated failures instead of letting…

### Community 94 - "_portable_schema"
Cohesion: 0.33
Nodes (4): _portable_schema(), Rewrite nullable enums into the form this API's validator accepts. `{"type":…, Nullable enums. `{"type": ["string","null"], "enum": [...]}` is valid JSON…, TestPortableSchema

### Community 95 - "compute_avatar_cue"
Cohesion: 0.25
Nodes (5): AvatarCue, compute_avatar_cue(), §8.4: two independent signals combine once confidence scoring completes. A…, The fastest useful answer: a real mode everywhere a mode is checked, with its…, TestRapidMode

### Community 96 - "TestIdentity"
Cohesion: 0.22
Nodes (3): Which AI should I use" is answered as itself, in every mode - including…, The rule is about not volunteering. Asked directly, it answers - and it never…, TestIdentity

### Community 97 - "complete"
Cohesion: 0.29
Nodes (8): complete(), CompleteOut, CompleteRequest, BaseModel, post, Request, User, Empty completion, never an error, whenever nothing sensible can be offered -…

### Community 98 - "logging_config.py"
Cohesion: 0.29
Nodes (6): configure_logging(), _CorrelationIdFilter, §14 Observability: structured logging + request tracing via a correlation ID…, contextvars, LogRecord, sys

### Community 99 - "password_fingerprint"
Cohesion: 0.39
Nodes (3): password_fingerprint(), A short, non-reversible marker for "the password as it is right now". Carried…, TestResetSingleUse

### Community 100 - "build_conversation_input"
Cohesion: 0.43
Nodes (4): build_conversation_input(), `history` is the verbatim short-term window (oldest-first); anything older than…, The clarifying question has to reach the model, or the answer to it is a non-…, TestClarifierInHistory

### Community 101 - "needs_live_data"
Cohesion: 0.25
Nodes (3): needs_live_data(), Which questions the quick answer searches for, and what a plan looks like when…, TestSearchPlanner

### Community 103 - "judge.py"
Cohesion: 0.38
Nodes (6): Anthropic, _client(), judge(), An LLM judge, separate from the product it is grading. Deterministic checks…, Returns {"pass": bool, "reason": str}. Never raises past this function - a…, os

### Community 104 - "_flat"
Cohesion: 0.38
Nodes (3): _flat(), `build_system_instructions` returns cache-annotated content blocks, not a…, TestPromptWiring

### Community 105 - "DecisionReview.tsx"
Cohesion: 0.48
Nodes (6): Chip(), DecisionReview(), Heading(), Tick(), Warn(), DecisionReviewData

### Community 106 - "FeedbackWidget"
Cohesion: 0.38
Nodes (6): FeedbackWidget(), save(), submitComment(), toggleRating(), copy(), PRECACHE

### Community 107 - "veracity_tier"
Cohesion: 0.47
Nodes (3): 0 fabricated, 21-40 distorted, 41-80 gray_area, 81-99 probable_fact, 100…, veracity_tier(), TestVeracityTiers

### Community 108 - "_reject_placeholders"
Cohesion: 0.47
Nodes (3): Drop rewrites that ask the user to fill in a blank. "I want to get better at…, _reject_placeholders(), TestPlaceholderRejection

### Community 111 - "_tidy"
Cohesion: 0.40
Nodes (3): The new part only. The model returns the whole sentence, typed part included,…, _tidy(), TestCompleteRoute

### Community 112 - "_round_queries"
Cohesion: 0.40
Nodes (4): _keyword_query(), The claim boiled down to its content words - names, numbers, terms - which is…, The queries one round fires at once - the branches of the search. The first…, _round_queries()

### Community 115 - "e0f1a2b3c4d5_legal_mode.py"
Cohesion: 0.83
Nodes (3): downgrade(), _swap(), upgrade()

### Community 126 - "delete_me"
Cohesion: 0.67
Nodes (3): delete_me(), delete, Delete the signed-in account and everything it owns. Irreversible. Two foreign…

## Knowledge Gaps
- **207 isolated node(s):** `AnalyticsEvent`, `AnalyticsProps`, `Consent`, `Known`, `Accent` (+202 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 848 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `send_message()` connect `send_message` to `models/__init__.py`, `taxonomy.py`, `generate_structured`, `api/chat.py`, `_accent_instructions`, `memory_service.py`, `get_conversation_for_user`, `image_generation.py`, `research_claim`, `test_message_tree.py`, `preview_access.py`, `api/admin.py`, `profile_service.py`, `clean_names`, `check_rate_limit`, `compute_message_score`, `is_resolvable`, `event_stream`, `CruxSplitter`, `model_catalog.py`, `build_system_instructions`, `ClaimTagStripper`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `build_system_instructions()` connect `build_system_instructions` to `test_learning_role.py`, `send_message`, `_flat`, `guest_demo.py`, `api/chat.py`, `api/auth.py`, `clean_names`, `test_prompts.py`, `_flat`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `CruxSplitter` connect `CruxSplitter` to `send_message`, `TestCruxSplitter`, `event_stream`, `api/chat.py`, `claim_parser.py`, `test_claim_parser.py`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `send_message()` (e.g. with `ClaimOut` and `EvidenceOut`) actually correct?**
  _`send_message()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AnalyticsEvent`, `AnalyticsProps`, `Consent` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `track` be split into smaller, more focused modules?**
  _Cohesion score 0.05030643513789581 - nodes in this community are weakly interconnected._
- **Should `ChatView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.051106639839034206 - nodes in this community are weakly interconnected._