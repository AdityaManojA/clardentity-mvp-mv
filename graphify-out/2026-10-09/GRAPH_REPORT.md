# Graph Report - clardentity-mvp-mv  (2026-10-09)

## Corpus Check
- 332 files · ~362,233 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 5, .ini 2, .css 2)

## Summary
- 2936 nodes · 7301 edges · 161 communities (126 shown, 35 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 271 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e67e2131`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- tour.tsx
- cx
- parse_export
- test_api_contract.py
- models/__init__.py
- taxonomy.py
- Message
- pickableModels.ts
- thinking_review.py
- guest_demo.py
- next
- client
- api/chat.py
- guest.py
- fixtures.ts
- _accent_instructions
- anthropic_client.py
- documents.py
- guestHandoff.ts
- openai_client.py
- auth.tsx
- AppShell.tsx
- package.json
- apiFetch
- sqlalchemy_dialects
- test_anthropic_client.py
- LiveCall
- get_conversation_for_user
- sse.ts
- web_research.py
- test_message_tree.py
- test_ingestion.py
- api/admin_dashboard.py
- upload_document
- _preview_status
- api/profile.py
- send_message
- api/auth.py
- previewAccess.ts
- Clardentity — technical guide
- LearningRoleCard.tsx
- is_resolvable
- AdminDashboard.tsx
- compute_claim_score
- test_search_locality.py
- AdminSettings.tsx
- workspaces.py
- document_ingestion.py
- health.py
- GuestDemo.tsx
- markdown.tsx
- app/layout.tsx
- compilerOptions
- MessageInput
- _flat
- backend_client.py
- evaluators.py
- run.py
- theme.tsx
- BackendClient
- tts
- extract_claims
- compute_message_score
- rescore_after_reconciliation
- _validate_clarifying_options
- SourcesFooter.tsx
- storage_key
- office_export.py
- ConfidenceBadge.tsx
- _validate_context_question
- clean_output
- event_stream
- CruxSplitter
- prompt_builder.py
- test_scoring.py
- fake
- track
- model_catalog.py
- decision_review.py
- test_guidance.py
- build_system_instructions
- devDependencies
- ClaimTagStripper
- extract_crux
- claim_parser.py
- DecisionReview.tsx
- admin_settings_service.py
- export_service.py
- privacy/page.tsx
- Graphify + Antigravity Project Workflow & Setup Guide
- react
- MessageBubble
- _CircuitBreaker
- _portable_schema
- compute_avatar_cue
- TestIdentity
- complete
- middleware.py
- services/__init__.py
- _Response
- TestSearchPlanner
- Mv: project checklist
- model_router.py
- ChatRowMenu.tsx
- consent.ts
- get_validation
- strip_opinion_preface
- test_prompts.py
- FeedbackWidget
- nspell
- autocorrect.ts
- TestRoutes
- e0f1a2b3c4d5_legal_mode.py
- scripts
- token_meter.py
- _content_blocks
- 4. Mobile production readiness
- MessageList.tsx
- dependencies
- image_generation.py
- deploy-backend.sh
- TestFallbackToolTranslation
- start.sh
- postcss.config.mjs
- judge.py
- CitationPopover.tsx
- InstallAppButton.tsx
- CorrelationIdMiddleware
- search_history
- _vet
- sync-upstream.sh
- preflight-stub.mjs
- test_rate_limit.py
- _TextOnly
- _clear_rate_limits
- images.py
- Document
- useTouchKeyboard.ts
- rules/graphify.md
- workflows/graphify.md
- Settings
- warmup.ts

## God Nodes (most connected - your core abstractions)
1. `cx()` - 96 edges
2. `react` - 78 edges
3. `apiFetch()` - 66 edges
4. `authErrorMessage()` - 61 edges
5. `send_message()` - 60 edges
6. `track()` - 46 edges
7. `event_stream()` - 45 edges
8. `ChatView()` - 44 edges
9. `Spinner()` - 36 edges
10. `generate_structured()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `1. Upstream sync` --references--> `main()`  [INFERRED]
  Better_docs/Mv.md → evals/run.py
- `10. Setup steps (Aditya)` --references--> `main()`  [INFERRED]
  Better_docs/Mv.md → evals/run.py
- `Clardentity — technical guide` --references--> `main()`  [INFERRED]
  Better_docs/TECHNICAL_GUIDE.md → evals/run.py
- `How it works` --references--> `main()`  [INFERRED]
  .github/SYNC_UPSTREAM.md → evals/run.py
- `Limitations` --references--> `main()`  [INFERRED]
  .github/SYNC_UPSTREAM.md → evals/run.py

## Import Cycles
- None detected.

## Communities (161 total, 35 thin omitted)

### Community 0 - "tour.tsx"
Cohesion: 0.22
Nodes (17): advanceTour(), endTour(), getServerTourSnapshot(), getTourSnapshot(), IDLE_STATE, readStoredState(), setTourState(), startTour() (+9 more)

### Community 1 - "cx"
Cohesion: 0.05
Nodes (56): Arm(), ARM_ANGLES, AvatarExpression, AvatarGesture, AvatarPanel(), AvatarState, EXPRESSION_EYEBROW_ROTATION, IDLE_CYCLE (+48 more)

### Community 2 - "parse_export"
Cohesion: 0.09
Nodes (24): _clean(), ImportedHistory, _looks_like(), _parse_chatgpt(), _parse_claude(), parse_export(), _parse_gemini(), ValueError (+16 more)

### Community 3 - "test_api_contract.py"
Cohesion: 0.07
Nodes (31): The new part only. The model returns the whole sentence, typed part included,…, _tidy(), create_access_token(), create_password_reset_token(), create_refresh_token(), password_fingerprint(), UUID, A short, non-reversible marker for "the password as it is right now". Carried… (+23 more)

### Community 4 - "models/__init__.py"
Cohesion: 0.11
Nodes (30): do_run_migrations(), Run migrations in 'online' mode., Run migrations in 'offline' mode. This configures the context with just a URL…, In this scenario we need to create an Engine and associate a connection with…, run_async_migrations(), run_migrations_offline(), run_migrations_online(), hash_password() (+22 more)

### Community 5 - "taxonomy.py"
Cohesion: 0.06
Nodes (67): get_bias(), list_biases(), list_categories(), list_decision_categories(), get, User, _to_out(), _classify() (+59 more)

### Community 6 - "Message"
Cohesion: 0.19
Nodes (12): The path a user actually sees, each message annotated with where it sits among…, _plan(), _serialize_active_path(), _serialize_message(), Message, needs_rewriting(), optimize_query(), §5.2 step 3 / reconciliation note: ambiguity detection and query rewriting… (+4 more)

### Community 7 - "pickableModels.ts"
Cohesion: 0.22
Nodes (15): Row(), VendorModelPicker(), choose(), choices, emit(), getChoice(), getModels(), getServerSnapshot() (+7 more)

### Community 8 - "thinking_review.py"
Cohesion: 0.47
Nodes (5): _build_instructions(), What Thinking mode shows instead of evidence. Claims and citations are the…, {"sound": [...], "biased": [...]} or None. Never raises., review_thinking(), _text()

### Community 9 - "guest_demo.py"
Cohesion: 0.05
Nodes (43): _address(), guest_budget(), guest_chat(), GuestRequest, GuestTurn, import_guest_conversation(), ImportRequest, ImportResult (+35 more)

### Community 10 - "next"
Cohesion: 0.18
Nodes (25): ForgotPasswordPage(), LoginPage(), RegisterPage(), ResetPasswordForm(), ResetPasswordPage(), LegalLayout(), QUESTIONS, WelcomePage() (+17 more)

### Community 11 - "client"
Cohesion: 0.06
Nodes (23): AsyncClient, client(), parametrize, Two devices hold two refresh tokens for one account. Refreshing on one must not…, A chat can be re-filed under another workspace the user belongs to, and only…, An account cannot be created without accepting, and what was accepted is…, The other two edits on the chat menu. Needs a database., Register -> not yet onboarded -> answer the welcome questions -> stamped,… (+15 more)

### Community 12 - "api/chat.py"
Cohesion: 0.13
Nodes (27): _in_background(), The new name if it lands within `wait_seconds` (written to the row here, sent…, _settle_title(), _store_counterfactual(), _store_title(), ActiveLeafIn, CallTranscript, CallTurn (+19 more)

### Community 13 - "guest.py"
Cohesion: 0.10
Nodes (37): Help with the message before it is sent: inline completion. As the user types,…, get_current_user(), User, The try-it-here box on the landing page. A visitor with no account can ask the…, get_memory(), AsyncSession, get, post (+29 more)

### Community 14 - "fixtures.ts"
Cohesion: 0.06
Nodes (50): ADMIN_STATE, AUTH_DIR, USER_STATE, accounts, openChat(), failed, flaky, report (+42 more)

### Community 15 - "_accent_instructions"
Cohesion: 0.08
Nodes (26): _accent_instructions(), CallContext, _clean(), create_realtime_session(), AsyncSession, BaseModel, post, User (+18 more)

### Community 16 - "anthropic_client.py"
Cohesion: 0.09
Nodes (39): _base_kwargs(), _claude_generate_structured(), _claude_generate_text(), _claude_stream_generation(), _create_message(), DeltaEvent, DoneEvent, _drop_temperature() (+31 more)

### Community 17 - "documents.py"
Cohesion: 0.07
Nodes (41): asyncio, _celery_redis_url(), kombu refuses a `rediss://` URL that doesn't spell out `ssl_cert_reqs`, raising…, ConversationMemory, AttachmentHitOut, AttachmentSearchOut, DocumentDetailOut, DocumentOut (+33 more)

### Community 18 - "guestHandoff.ts"
Cohesion: 0.16
Nodes (22): AppNotices(), claimTheGreeting(), SavedFromDemo(), subscribe(), WelcomeBack(), firstNameOf(), Greeting, greetingFor() (+14 more)

### Community 19 - "openai_client.py"
Cohesion: 0.10
Nodes (35): _build_input(), _create_embeddings(), _create_response(), _create_speech(), _create_transcription(), DeltaEvent, DoneEvent, embed_texts() (+27 more)

### Community 20 - "auth.tsx"
Cohesion: 0.06
Nodes (46): handlePlayAudio(), ExportFileMenu(), download(), FORMATS, upload(), DependencyStatus, HealthResponse, LoadState (+38 more)

### Community 21 - "AppShell.tsx"
Cohesion: 0.07
Nodes (32): Conversation, StartChat(), go(), Workspace, AccountMenu(), Chevron(), GearIcon(), LeaveIcon() (+24 more)

### Community 22 - "package.json"
Cohesion: 0.12
Nodes (15): eslintConfig, name, private, version, @axe-core/playwright, dictionary-en, dictionary-en-gb, eslint (+7 more)

### Community 23 - "apiFetch"
Cohesion: 0.08
Nodes (44): handleSubmit(), handleSubmit(), handleSubmit(), handleSubmit(), ProfilePage(), PageProps, WorkspaceDocumentsPage(), handleSave() (+36 more)

### Community 25 - "test_anthropic_client.py"
Cohesion: 0.13
Nodes (13): CircuitBreakerOpenError, is_provider_unavailable_error(), RuntimeError, _supports_effort(), _FakeAPIError, Exception, The provider-shim behaviour, which is where a migration hides its bugs. The…, Stands in for anthropic/openai SDK exceptions, both of which carry a… (+5 more)

### Community 27 - "get_conversation_for_user"
Cohesion: 0.13
Nodes (39): _all_messages(), _conversation_out(), create_conversation(), delete_conversation(), delete_message(), devils_advocate(), export_conversation(), export_file() (+31 more)

### Community 28 - "sse.ts"
Cohesion: 0.13
Nodes (14): GuidanceCard(), ThinkingReview(), ChatFinalEvent, ChatStatus, ChatStreamHandlers, ClarifyingOptionsSuggestion, ContextQuestion, GeneratedImage (+6 more)

### Community 29 - "web_research.py"
Cohesion: 0.08
Nodes (32): gather_context(), _keyword_query(), _merge_sources(), Web research with a supervisor that doesn't take the first answer. Used when…, What the loop settled on, and how it got there., One Tavily query. Empty on any failure - the caller has other queries in flight…, The claim boiled down to its content words - names, numbers, terms - which is…, The queries one round fires at once - the branches of the search. The first… (+24 more)

### Community 30 - "test_message_tree.py"
Cohesion: 0.11
Nodes (18): active_path(), descendants(), latest_leaf(), UUID, The active branch of a conversation - forking's replacement for a flat message…, Descend from `from_id`, always taking the most recently created child, until…, Root-to-leaf order. `messages` must be every row for the conversation the leaf…, Every message sharing `of`'s parent (or every root message of the same… (+10 more)

### Community 31 - "test_ingestion.py"
Cohesion: 0.16
Nodes (10): file_type_of(), None when the type can be read; otherwise the sentence to show., unsupported_reason(), _docx(), _pptx(), parametrize, Every document type the composer and the uploader accept is readable., TestExtractPages (+2 more)

### Community 32 - "api/admin_dashboard.py"
Cohesion: 0.13
Nodes (24): dynamic_query(), _jsonable(), overview(), AsyncSession, get, post, User, The administrator's view: who is signed up, and what they are costing. Read-… (+16 more)

### Community 33 - "upload_document"
Cohesion: 0.23
Nodes (15): delete_document(), _excerpt_around(), get_document(), list_documents(), AsyncSession, delete, get, post (+7 more)

### Community 34 - "_preview_status"
Cohesion: 0.17
Nodes (17): close_preview(), open_preview(), _preview_status(), AsyncSession, delete, get, post, User (+9 more)

### Community 35 - "api/profile.py"
Cohesion: 0.05
Nodes (68): add_aspect(), clear_profile(), complete_onboarding(), import_history(), list_roles(), AsyncSession, delete, get (+60 more)

### Community 36 - "send_message"
Cohesion: 0.09
Nodes (26): _derive_title(), EventSourceResponse, A short label for a conversation, from its opening message. Deliberately not an…, send_message(), mark(), _prefetch(), get_memory_summary(), AsyncSession (+18 more)

### Community 37 - "api/auth.py"
Cohesion: 0.11
Nodes (48): _client_ip(), confirm_password_reset(), delete_me(), ensure_workspace(), _issue_tokens(), login(), me(), oauth_google() (+40 more)

### Community 38 - "previewAccess.ts"
Cohesion: 0.13
Nodes (20): LockIcon(), Model, ModelPicker(), MODELS, Tile, TILES, UpgradeDialog(), togglePreview() (+12 more)

### Community 39 - "Clardentity — technical guide"
Cohesion: 0.07
Nodes (29): 10. File map, 11. Conventions, 1. What the product is, 2. Topology, 3. Running it locally, 4. The HTTP API, 5. The streaming protocol — read this twice, 6. Data model (+21 more)

### Community 40 - "LearningRoleCard.tsx"
Cohesion: 0.30
Nodes (12): LearningRoleCard(), choose(), OPTIONS, emit(), getLearningRole(), getServerLearningRole(), Known, LearningRole (+4 more)

### Community 41 - "is_resolvable"
Cohesion: 0.20
Nodes (7): is_resolvable(), location_prompt_line(), False for anything a lookup can't say anything useful about., One line of background, hedged on purpose. Stated as where they *appear* to be…, Sign-in location. No network here - the lookup is verified by hand against a…, TestPromptLine, TestResolvableFilter

### Community 42 - "AdminDashboard.tsx"
Cohesion: 0.21
Nodes (16): AdminDashboard(), Bucket, Card(), Flag(), Overview, QueryResult, shortDate(), Stat() (+8 more)

### Community 43 - "compute_claim_score"
Cohesion: 0.21
Nodes (6): compute_claim_score(), claim_score = 100 * (0.7*support + 0.3*relevance) of whichever evidence item…, ev(), Web sources gathered before generation carry no credibility judgement - the…, TestClaimScore, TestUnmeasuredRelevance

### Community 44 - "test_search_locality.py"
Cohesion: 0.25
Nodes (4): _body(), Where a search looks, and how recent it is willing to be. No network. What…, TestCountryBias, TestNewsIndex

### Community 45 - "AdminSettings.tsx"
Cohesion: 0.15
Nodes (10): AdminSettings(), AvatarGestureMap, FeatureFlags, FLAG_LABELS, GESTURE_OPTIONS, MODES, ScoringWeights, Settings (+2 more)

### Community 46 - "workspaces.py"
Cohesion: 0.27
Nodes (17): create_workspace(), delete_workspace(), _get_membership(), get_workspace(), list_workspaces(), AsyncSession, delete, get (+9 more)

### Community 47 - "document_ingestion.py"
Cohesion: 0.21
Nodes (13): build_chunks(), chunk_text(), _decode(), extract_pages(), UUID, Returns (page_number, text) pairs. page_number is 1-indexed for PDFs and slide…, Extract, chunk and embed one file: the rows to insert, not yet added to any…, _rtf_text() (+5 more)

### Community 48 - "health.py"
Cohesion: 0.24
Nodes (11): _check_database(), _check_redis(), _check_storage(), health_check(), get, delete_file(), get_s3_client(), upload_file() (+3 more)

### Community 49 - "GuestDemo.tsx"
Cohesion: 0.07
Nodes (41): Home(), StreamingMessage, frontend_components_chat_modeselector_cognitivemode, ModeSelector(), asMessage(), GATE_COPY, GuestDemo(), Phase (+33 more)

### Community 50 - "markdown.tsx"
Cohesion: 0.18
Nodes (16): CruxCard(), findEvidenceForMarker(), renderBody(), renderCitations(), renderMarkers(), renderTextWithCitations(), Block, InlineSegment (+8 more)

### Community 51 - "app/layout.tsx"
Cohesion: 0.20
Nodes (11): frontend_app_globals, geistMono, geistSans, metadata, outfit, RootLayout(), viewport, AccentScope() (+3 more)

### Community 52 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 53 - "MessageInput"
Cohesion: 0.26
Nodes (11): attachmentProblem(), fileExtension(), MessageInput(), acceptGhost(), handleChange(), handleFilesSelected(), handleKeyDown(), handleSend() (+3 more)

### Community 54 - "_flat"
Cohesion: 0.13
Nodes (9): Guidance for choosing *how* to reason. Never shown to the user., thinking_framework_block(), _flat(), The client's Thinking Framework Matrix, as embedded. Its thesis is that one-…, `build_system_instructions` returns Anthropic content blocks now, not a string…, The rule survived the Thinking Framework Matrix; only its wording moved. These…, TestNoSelfLabelling, TestReasoningLensStaysHidden (+1 more)

### Community 55 - "backend_client.py"
Cohesion: 0.15
Nodes (12): BackendTurnError, _parse_sse(), RuntimeError, A thin client that talks to Clardentity exactly the way the real frontend does:…, One real turn, waiting for the whole SSE stream. `mode_confirmed` and…, The HTTP request succeeded (200, SSE headers sent) but the turn itself failed…, Every event the server sent, in order, plus the raw text for anything an…, SSEResult (+4 more)

### Community 56 - "evaluators.py"
Cohesion: 0.14
Nodes (10): ev_identity_no_vendor_leak(), ev_llm_judge_rubric(), ev_no_bias_watch_prose(), ev_no_self_labeling_in_prose(), ev_plain_text_no_markdown(), ev_uncited_claims_score_low(), Deterministic checks, plus the one generic hook into the LLM judge. Signature…, A structural invariant, checked on every case that returns claims, not just the… (+2 more)

### Community 57 - "run.py"
Cohesion: 0.11
Nodes (22): argparse, collections, dotenv, The cases, and what each one is actually checking. Every case here traces back…, Create the dataset if it doesn't exist, then upsert every case by its stable…, sync_dataset(), build_task(), main() (+14 more)

### Community 58 - "theme.tsx"
Cohesion: 0.24
Nodes (14): Appearance(), Accent, accentApplies(), ACCENTS, announce(), applyAccent(), applyTheme(), currentTheme() (+6 more)

### Community 59 - "BackendClient"
Cohesion: 0.18
Nodes (6): BackendClient, _random_password(), Up to three attempts on a 5xx, with backoff. Measured directly against…, Reuse a cached eval account, or create one. Never touches a real user's account…, One workspace named "Evals", reused across runs rather than created fresh each…, Only ever sets one mode's name, on an account that exists solely to run evals -…

### Community 60 - "tts"
Cohesion: 0.24
Nodes (10): AsyncSession, post, UploadFile, User, transcribe(), tts(), BaseModel, TranscribeOut (+2 more)

### Community 61 - "extract_claims"
Cohesion: 0.18
Nodes (6): extract_claims(), Parses <claim id="n">...</claim> blocks out of the model's raw output. Recovers…, Claim tag parsing, including the opinion attribute. <claim id="n"…, extract_claims used to be a block-matching regex: one unclosed tag anywhere…, TestExtractClaims, TestExtractClaimsRecovery

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

### Community 66 - "storage_key"
Cohesion: 0.25
Nodes (5): Where one generated image lives. The owner is part of the key, so the serving…, storage_key(), The Co-Creative picture path, minus the network. The two things worth pinning…, TestIntent, TestStorageKey

### Community 67 - "office_export.py"
Cohesion: 0.17
Nodes (14): build_outline(), export_file(), Turning a Creative-mode answer into an actual file. The chat model already…, Returns (file_bytes, filename). Exceptions propagate as-is - the caller…, render_pptx(), render_xlsx(), _safe_filename(), The renderers only - build_outline needs a real model call, so it's exercised… (+6 more)

### Community 68 - "ConfidenceBadge.tsx"
Cohesion: 0.22
Nodes (6): BAND_DOTS, BAND_MEANING, BAND_STYLES, ConfidenceBadge(), TIER_LABELS, Claim

### Community 69 - "_validate_context_question"
Cohesion: 0.19
Nodes (4): Drop anything that is not one plain open question. The guards are cheap and the…, _validate_context_question(), The "why" asked before answering. The judgement itself is the model's; these…, TestContextQuestionGuards

### Community 70 - "clean_output"
Cohesion: 0.13
Nodes (13): clean_output(), Making the model's output look like what the UI actually renders. The chat…, Removes the model's own evidential-status asides from the prose., Everything, in the order the passes expect., Em/en dashes to spaced hyphens. Existing hyphens are left alone., HTML and unrendered Markdown out; the rendered set normalised., replace_dashes(), strip_markup() (+5 more)

### Community 71 - "event_stream"
Cohesion: 0.10
Nodes (19): _no_text(), A generation that produces nothing, for a turn whose answer is a picture.…, event_stream(), metered_stream(), cached(), name_conversation(), A name for a conversation, from its first exchange. The sidebar used to show…, Never raises: on any failure the caller keeps `fallback` (the derived… (+11 more)

### Community 72 - "CruxSplitter"
Cohesion: 0.17
Nodes (6): CruxSplitter, Streaming counterpart of extract_crux. The crux is the first thing the model…, Returns (crux_text_if_it_just_resolved, text_to_pass_downstream)., Anything still held when the stream ends (e.g. an unclosed crux)., The streaming twin of extract_crux: the crux is announced once, as its own…, TestCruxSplitter

### Community 73 - "prompt_builder.py"
Cohesion: 0.29
Nodes (9): embed_text(), build_context_block(), Numbered context the model cites with [n] markers. Documents come first and…, AsyncSession, UUID, Top-k pgvector similarity search over the workspace's processed documents. Runs…, retrieve_chunks(), RetrievedChunk (+1 more)

### Community 74 - "test_scoring.py"
Cohesion: 0.19
Nodes (10): build_scored_evidence(), MessageScore, 0 fabricated, 21-40 distorted, 41-80 gray_area, 81-99 probable_fact, 100…, `markers` are the 1-indexed CONTEXT positions a claim cited. Markers…, veracity_tier(), EvidenceVerification, Claim and message scoring. The regression these guard against is the one that…, TestEvidenceAssembly (+2 more)

### Community 75 - "fake"
Cohesion: 0.16
Nodes (8): The gates judge a follow-up against the whole thread, not the newest line alone…, The reviewer's judgement isn't testable here; its guards are, and each one…, TestDecisionReviewGuards, fake(), fake(), fake(), fake(), TestGuidanceSeesTheConversation

### Community 76 - "track"
Cohesion: 0.33
Nodes (13): Analytics(), analyticsEnabled(), AnalyticsEvent, AnalyticsProps, getClient(), identify(), on(), resetIdentity() (+5 more)

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
Cohesion: 0.16
Nodes (7): build_system_instructions(), Returns Anthropic content blocks, not a string - the split is the point.…, _flat(), `build_system_instructions` returns cache-annotated content blocks, not a…, TestPromptWiring, The split that makes caching possible: content byte-identical for every user in…, TestPromptCaching

### Community 82 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, @axe-core/playwright, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/postcss, @types/node (+3 more)

### Community 83 - "ClaimTagStripper"
Cohesion: 0.24
Nodes (4): ClaimTagStripper, Incrementally strips <claim id="n"> / </claim> tags from a stream of text…, TestStreamingStripperWithOpinionTag, TestClaimTagStripper

### Community 84 - "extract_crux"
Cohesion: 0.21
Nodes (5): extract_crux(), Pulls a leading <crux>...</crux> block off the front of raw text. Returns…, The gist is one sentence, however much the model hands over as the crux., TestExtractCrux, TestGistLength

### Community 85 - "claim_parser.py"
Cohesion: 0.15
Nodes (12): fit_gist(), _is_partial_close(), _is_partial_open(), ParsedClaim, Returns (gist, overflow): the first sentence of `text`, tag- and citation-free,…, Fallback for an answer that opens with no <crux> block: peel the opening…, Non-streaming version of the same stripping, for text we already have in full…, split_leading_sentence() (+4 more)

### Community 86 - "DecisionReview.tsx"
Cohesion: 0.48
Nodes (6): Chip(), DecisionReview(), Heading(), Tick(), Warn(), DecisionReviewData

### Community 87 - "admin_settings_service.py"
Cohesion: 0.21
Nodes (15): Any, get_settings(), AsyncSession, get, put, User, update_setting(), AdminSetting (+7 more)

### Community 88 - "export_service.py"
Cohesion: 0.42
Nodes (9): MessageOut, build_markdown_export(), build_pdf_export(), _exported_at(), _line(), _message_header(), _pdf_safe(), FPDF (+1 more)

### Community 89 - "privacy/page.tsx"
Cohesion: 0.42
Nodes (7): LegalPage(), Section(), Table(), metadata, PrivacyPage(), metadata, TermsPage()

### Community 91 - "react"
Cohesion: 0.09
Nodes (33): AdminPage(), metadata, ChatPage(), PageProps, SettingsPage(), StartPage(), PageProps, WorkspacePage() (+25 more)

### Community 92 - "MessageBubble"
Cohesion: 0.13
Nodes (14): ClarifierCard(), GeneratedImageCard(), GeneratedImagePlaceholder(), formatMessageTime(), MessageBubble(), MessageList(), comparableText(), FlipButton() (+6 more)

### Community 93 - "_CircuitBreaker"
Cohesion: 0.13
Nodes (7): _CircuitBreaker, _CircuitBreaker, CircuitBreakerOpenError, RuntimeError, The model returned something that isn't the requested object., §14 resilience: short-circuits calls after repeated failures instead of letting…, StructuredOutputError

### Community 94 - "_portable_schema"
Cohesion: 0.33
Nodes (4): _portable_schema(), Rewrite nullable enums into the form this API's validator accepts. `{"type":…, Nullable enums. `{"type": ["string","null"], "enum": [...]}` is valid JSON…, TestPortableSchema

### Community 95 - "compute_avatar_cue"
Cohesion: 0.22
Nodes (5): AvatarCue, compute_avatar_cue(), §8.4: two independent signals combine once confidence scoring completes. A…, The fastest useful answer: a real mode everywhere a mode is checked, with its…, TestRapidMode

### Community 96 - "TestIdentity"
Cohesion: 0.22
Nodes (3): Which AI should I use" is answered as itself, in every mode - including…, The rule is about not volunteering. Asked directly, it answers - and it never…, TestIdentity

### Community 97 - "complete"
Cohesion: 0.29
Nodes (8): complete(), CompleteOut, CompleteRequest, BaseModel, post, Request, User, Empty completion, never an error, whenever nothing sensible can be offered -…

### Community 98 - "middleware.py"
Cohesion: 0.40
Nodes (4): starlette_middleware_base, starlette_requests, starlette_responses, starlette_types

### Community 99 - "services/__init__.py"
Cohesion: 0.17
Nodes (6): _looks_like_silence(), parametrize, The two things a raw speech-to-text result can't be trusted on, and how…, TestLooksLikeSilence, TestTranscribeAudioReportsRatherThanGuesses, fake_call()

### Community 100 - "_Response"
Cohesion: 0.20
Nodes (3): _Client, Captures the body instead of sending it., _Response

### Community 102 - "Mv: project checklist"
Cohesion: 0.18
Nodes (10): 10. Setup steps (Aditya), 1. Upstream sync, 2. Mobile testing, 3. App improvements (mobile), 5. Decisions, 6. From the technical guide, 7. Code knowledge graph, 8. Test matrix (M12 onwards) (+2 more)

### Community 103 - "model_router.py"
Cohesion: 0.22
Nodes (12): Google and xAI, for the model picker in Learning and Co-Creative. Written…, Grok. xAI speaks the OpenAI chat-completions wire format, so this is that shape…, One `data:` line's JSON, or None for everything else in the frame., Gemini, over generativelanguage's SSE endpoint., _sse_payloads(), stream_google(), stream_xai(), Send one generation to whichever provider the chosen model belongs to. Only… (+4 more)

### Community 104 - "ChatRowMenu.tsx"
Cohesion: 0.24
Nodes (7): Action, ChatRowMenu(), patch(), remove(), ChatRowWorkspace, Kebab(), PinIcon()

### Community 105 - "consent.ts"
Cohesion: 0.30
Nodes (9): ConsentBanner(), Consent, consentGranted(), getSnapshot(), listeners, read(), setConsent(), useConsent() (+1 more)

### Community 106 - "get_validation"
Cohesion: 0.40
Nodes (5): get_validation(), AsyncSession, get, User, UUID

### Community 107 - "strip_opinion_preface"
Cohesion: 0.33
Nodes (3): strip_opinion_preface(), Belt-and-suspenders for prompt_builder's opinion-framing instruction - the…, TestOpinionPreface

### Community 108 - "test_prompts.py"
Cohesion: 0.12
Nodes (11): build_conversation_input(), `history` is the verbatim short-term window (oldest-first); anything older than…, decision_tree_block(), monitoring_block(), The client's Thinking Framework Matrix, as prompt guidance. The matrix's own…, Matrix section 8's last two fields. The monitoring question and the escalation…, What we tell the model. These are string assertions rather than model calls:…, The clarifying question has to reach the model, or the answer to it is a non-… (+3 more)

### Community 109 - "FeedbackWidget"
Cohesion: 0.38
Nodes (6): FeedbackWidget(), save(), submitComment(), toggleRating(), copy(), PRECACHE

### Community 112 - "autocorrect.ts"
Cohesion: 0.19
Nodes (12): warm(), autocorrectSupported(), correctionFor(), editDistance(), fetchText(), Fix, loadSpeller(), matchCase() (+4 more)

### Community 115 - "e0f1a2b3c4d5_legal_mode.py"
Cohesion: 0.83
Nodes (3): downgrade(), _swap(), upgrade()

### Community 116 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, test:e2e, test:e2e:ci, test:e2e:mobile (+1 more)

### Community 117 - "token_meter.py"
Cohesion: 0.22
Nodes (8): stream(), current(), meter(), What a turn cost, in tokens. `messages.token_usage` has existed since the first…, Open a meter for the duration of one turn. Nested meters are not a thing here;…, TurnUsage, contextlib, contextvars

### Community 119 - "_content_blocks"
Cohesion: 0.29
Nodes (5): _content_blocks(), §12.2: images ride along as vision context for this turn only. The frontend…, parametrize, Attachments. The frontend sends data URIs; this API wants media type and…, TestContentBlocks

### Community 120 - "4. Mobile production readiness"
Cohesion: 0.25
Nodes (8): 4.1 Viewport, safe areas & app shell, 4.2 Composer & on-screen keyboard, 4.3 Chat feed, citations & question cards, 4.4 Touch targets & ergonomics, 4.5 Media, audio & uploads, 4.6 Installable app (PWA) & connection drops, 4.7 Browser & device test matrix, 4. Mobile production readiness

### Community 125 - "MessageList.tsx"
Cohesion: 0.26
Nodes (13): ActionIcon(), ChevronIcon(), CopyIcon(), Exchange, ForkSwitcher(), MessageActions(), parseUserMessage(), PencilIcon() (+5 more)

### Community 126 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, dictionary-en, dictionary-en-gb, next, nspell, posthog-js, react, react-dom

### Community 127 - "image_generation.py"
Cohesion: 0.19
Nodes (13): generate(), ImageRequest, UUID, Making a picture, in Co-Creative mode only. Co-Creative is the mode whose…, Generate one image, store it, and return what the client needs. Returns `{"id",…, The picture, ten times smaller. The image models hand back a PNG, which at…, What the user asked for, when they asked for a picture., What picture this message is asking for, or None if it is not. Never raises: an… (+5 more)

### Community 140 - "judge.py"
Cohesion: 0.38
Nodes (6): Anthropic, _client(), judge(), An LLM judge, separate from the product it is grading. Deterministic checks…, Returns {"pass": bool, "reason": str}. Never raises past this function - a…, os

### Community 141 - "CitationPopover.tsx"
Cohesion: 0.10
Nodes (31): CitationPopover(), credibilityPhrase(), ExternalLinkIcon(), factualEvidence(), hostOf(), relevancePhrase(), SUPPORT_BANDS, supportPhrase() (+23 more)

### Community 142 - "InstallAppButton.tsx"
Cohesion: 0.28
Nodes (5): BeforeInstallPromptEvent, Environment, getEnvironment(), InstallAppButton(), subscribeNever()

### Community 143 - "CorrelationIdMiddleware"
Cohesion: 0.29
Nodes (5): ASGIApp, CorrelationIdMiddleware, Request, Accepts an inbound X-Request-ID (useful if a frontend/proxy already assigns…, BaseHTTPMiddleware

### Community 144 - "search_history"
Cohesion: 0.29
Nodes (7): AsyncSession, get, User, UUID, search_history(), BaseModel, SearchResultOut

### Community 146 - "_vet"
Cohesion: 0.31
Nodes (5): Refuse anything that is not one plain read. Checked here rather than trusted to…, _vet(), parametrize, The model is told to write one read-only SELECT. This is what happens when it…, TestQueryGate

### Community 151 - "test_rate_limit.py"
Cohesion: 0.29
Nodes (5): _BrokenRedis, The rate limiter's own dependency going down should not take the product with…, test_a_redis_error_lets_the_request_through(), test_a_working_redis_still_enforces_the_limit(), redis

### Community 152 - "_TextOnly"
Cohesion: 0.29
Nodes (3): _html_text(), _TextOnly, HTMLParser

### Community 153 - "_clear_rate_limits"
Cohesion: 0.40
Nodes (5): _clear_rate_limits(), _dispose_pools_between_tests(), Return every pooled connection before the test's event loop closes. asyncpg and…, Rate limiting is infrastructure these tests run through, not the thing under…, fixture

### Community 154 - "images.py"
Cohesion: 0.47
Nodes (5): get, UUID, Serving a generated image back to the page that asked for it. Deliberately…, read_generated_image(), download_file()

### Community 155 - "Document"
Cohesion: 0.70
Nodes (3): Document, render_docx(), TestRenderDocx

### Community 156 - "useTouchKeyboard.ts"
Cohesion: 0.83
Nodes (3): getSnapshot(), subscribe(), useTouchKeyboard()

## Knowledge Gaps
- **273 isolated node(s):** `2. Mobile testing`, `3. App improvements (mobile)`, `4.1 Viewport, safe areas & app shell`, `4.2 Composer & on-screen keyboard`, `4.3 Chat feed, citations & question cards` (+268 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 941 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `tour.tsx`, `cx`, `pickableModels.ts`, `next`, `CitationPopover.tsx`, `InstallAppButton.tsx`, `guestHandoff.ts`, `auth.tsx`, `AppShell.tsx`, `package.json`, `apiFetch`, `useTouchKeyboard.ts`, `previewAccess.ts`, `LearningRoleCard.tsx`, `AdminDashboard.tsx`, `AdminSettings.tsx`, `GuestDemo.tsx`, `markdown.tsx`, `theme.tsx`, `ConfidenceBadge.tsx`, `track`, `privacy/page.tsx`, `ChatRowMenu.tsx`, `consent.ts`, `MessageList.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `main()` connect `run.py` to `BackendClient`, `Mv: project checklist`, `Clardentity — technical guide`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `latest_leaf()` connect `test_message_tree.py` to `get_conversation_for_user`, `api/chat.py`, `Message`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `send_message()` (e.g. with `ClaimOut` and `EvidenceOut`) actually correct?**
  _`send_message()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `2. Mobile testing`, `3. App improvements (mobile)`, `4.1 Viewport, safe areas & app shell` to the rest of the system?**
  _273 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cx` be split into smaller, more focused modules?**
  _Cohesion score 0.051929824561403506 - nodes in this community are weakly interconnected._
- **Should `parse_export` be split into smaller, more focused modules?**
  _Cohesion score 0.09176788124156546 - nodes in this community are weakly interconnected._