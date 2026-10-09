# Graph Report - clardentity-mvp-mv  (2026-10-09)

## Corpus Check
- 312 files · ~340,765 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: (none) 5, .ini 2, .aff 2)

## Summary
- 2781 nodes · 7030 edges · 155 communities (134 shown, 21 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 265 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4048d3f8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- tour.tsx
- ChatView.tsx
- parse_export
- MessageInput.tsx
- models/__init__.py
- taxonomy.py
- thinking_review.py
- react
- office_export.py
- guest.py
- cx
- client
- api/chat.py
- deps.py
- usePrefersReducedMotion
- _accent_instructions
- anthropic_client.py
- refresh_location.py
- guestHandoff.ts
- openai_client.py
- auth.tsx
- AppShell.tsx
- package.json
- InstallAppButton.tsx
- sqlalchemy
- test_anthropic_client.py
- MessageList.tsx
- get_conversation_for_user
- image_generation.py
- web_research.py
- test_message_tree.py
- profile_prompt_block
- api/admin_dashboard.py
- documents.py
- preview_access.py
- _serialize
- send_message
- security.py
- previewAccess.ts
- tts
- check_rate_limit
- CitationPopover.tsx
- AdminDashboard.tsx
- compute_claim_score
- _Response
- document_ingestion.py
- workspaces.py
- profile_service.py
- clean_names
- strip_opinion_preface
- test_prompts.py
- _ingest_attachments
- compilerOptions
- services/__init__.py
- _flat
- backend_client.py
- evaluators.py
- run.py
- theme.tsx
- BackendClient
- apiFetch
- extract_claims
- test_scoring.py
- rescore_after_reconciliation
- _validate_clarifying_options
- SourcesFooter.tsx
- test_learning_role.py
- model_router.py
- geolocation.py
- _validate_context_question
- verification_agent.py
- event_stream
- CruxSplitter
- api/profile.py
- build_scored_evidence
- fake
- track
- api/auth.py
- model_catalog.py
- _build_suggestions
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
- clean_output
- cached
- decision_classifier.py
- _CircuitBreaker
- _portable_schema
- search_planner.py
- TestIdentity
- complete
- env.py
- app/layout.tsx
- build_conversation_input
- TestSearchPlanner
- sse.ts
- judge.py
- _flat
- consent.ts
- GuestDemo.tsx
- api/biases.py
- prompt_builder.py
- storage_key
- nspell
- infer_profile
- autocorrect.ts
- api/memory.py
- TestRoutes
- e0f1a2b3c4d5_legal_mode.py
- guidance.py
- _vet
- cleanMessageText
- ConfidenceBadge.tsx
- MessageBubble
- .test_rejected_seed_falls_through_to_a_search
- markdown.tsx
- rebuild_memory_summary
- wanted_image
- DecisionReview.tsx
- deploy-backend.sh
- MessageActions
- start.sh
- postcss.config.mjs
- veracity_tier
- TourOverlay.tsx
- devDependencies
- dependencies
- TestGuidanceSeesTheConversation
- stated_facts.py
- pytest
- eslint.config.mjs
- sync-upstream.sh
- upload_document
- scripts
- _worth_retrying
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
- `How it works` --references--> `main()`  [INFERRED]
  .github/SYNC_UPSTREAM.md → evals/run.py
- `One-time setup` --references--> `main()`  [INFERRED]
  .github/SYNC_UPSTREAM.md → evals/run.py
- `Limitations` --references--> `main()`  [INFERRED]
  .github/SYNC_UPSTREAM.md → evals/run.py
- `Upstream sync` --references--> `main()`  [INFERRED]
  .github/SYNC_UPSTREAM.md → evals/run.py
- `rebuild_memory_task()` --references--> `task()`  [EXTRACTED]
  backend/app/workers/rebuild_memory.py → evals/run.py

## Import Cycles
- None detected.

## Communities (155 total, 21 thin omitted)

### Community 0 - "tour.tsx"
Cohesion: 0.19
Nodes (19): finish(), advanceTour(), endTour(), getServerTourSnapshot(), getTourSnapshot(), IDLE_STATE, readStoredState(), resetTours() (+11 more)

### Community 1 - "ChatView.tsx"
Cohesion: 0.05
Nodes (53): Arm(), ARM_ANGLES, AvatarExpression, AvatarGesture, AvatarPanel(), AvatarState, EXPRESSION_EYEBROW_ROTATION, IDLE_CYCLE (+45 more)

### Community 2 - "parse_export"
Cohesion: 0.09
Nodes (25): _clean(), ImportedHistory, _looks_like(), _parse_chatgpt(), _parse_claude(), parse_export(), _parse_gemini(), ValueError (+17 more)

### Community 3 - "MessageInput.tsx"
Cohesion: 0.09
Nodes (35): attachmentProblem(), DOCUMENT_ACCEPT, DOCUMENT_EXTENSIONS, fileExtension(), LEGACY_EXTENSIONS, MessageInput(), acceptGhost(), handleChange() (+27 more)

### Community 4 - "models/__init__.py"
Cohesion: 0.11
Nodes (34): hash_password(), AdminSetting, Base, Conversation, DocumentChunk, ConversationMemory, AudioTranscript, Citation (+26 more)

### Community 5 - "taxonomy.py"
Cohesion: 0.16
Nodes (24): _alias_keys(), all_biases(), Bias, bias_categories(), bias_category_for_decision(), _bias_data(), BiasCategory, describe_bias() (+16 more)

### Community 6 - "thinking_review.py"
Cohesion: 0.47
Nodes (5): _build_instructions(), What Thinking mode shows instead of evidence. Claims and citations are the…, {"sound": [...], "biased": [...]} or None. Never raises., review_thinking(), _text()

### Community 7 - "react"
Cohesion: 0.06
Nodes (60): handleSubmit(), handleSubmit(), handleSubmit(), handleSubmit(), ChatPage(), PageProps, ProfilePage(), SettingsPage() (+52 more)

### Community 8 - "office_export.py"
Cohesion: 0.17
Nodes (14): build_outline(), export_file(), Turning a Creative-mode answer into an actual file. The chat model already…, Returns (file_bytes, filename). Exceptions propagate as-is - the caller…, render_pptx(), render_xlsx(), _safe_filename(), The renderers only - build_outline needs a real model call, so it's exercised… (+6 more)

### Community 9 - "guest.py"
Cohesion: 0.09
Nodes (36): _address(), guest_budget(), guest_chat(), GuestRequest, GuestTurn, import_guest_conversation(), ImportRequest, ImportResult (+28 more)

### Community 10 - "cx"
Cohesion: 0.10
Nodes (40): ForgotPasswordPage(), LoginPage(), RegisterPage(), ResetPasswordForm(), ResetPasswordPage(), LegalLayout(), QUESTIONS, WelcomePage() (+32 more)

### Community 11 - "client"
Cohesion: 0.06
Nodes (23): AsyncClient, client(), parametrize, Two devices hold two refresh tokens for one account. Refreshing on one must not…, A chat can be re-filed under another workspace the user belongs to, and only…, An account cannot be created without accepting, and what was accepted is…, The other two edits on the chat menu. Needs a database., Register -> not yet onboarded -> answer the welcome questions -> stamped,… (+15 more)

### Community 12 - "api/chat.py"
Cohesion: 0.17
Nodes (21): ActiveLeafIn, CallTranscript, CallTurn, ClaimOut, ConversationCreate, ConversationUpdate, EvidenceOut, ExportFileIn (+13 more)

### Community 13 - "deps.py"
Cohesion: 0.08
Nodes (47): Any, get_settings(), AsyncSession, get, put, User, update_setting(), Help with the message before it is sent: inline completion. As the user types,… (+39 more)

### Community 14 - "usePrefersReducedMotion"
Cohesion: 0.27
Nodes (9): ModeSwitchToast(), HeroComposer(), HeroMode, Phase, QUESTION_BY_MODE, shuffle(), getSnapshot(), subscribe() (+1 more)

### Community 15 - "_accent_instructions"
Cohesion: 0.16
Nodes (15): _accent_instructions(), CallContext, _clean(), create_realtime_session(), AsyncSession, BaseModel, post, User (+7 more)

### Community 16 - "anthropic_client.py"
Cohesion: 0.12
Nodes (32): _base_kwargs(), _claude_generate_structured(), _claude_generate_text(), _claude_stream_generation(), _create_message(), DeltaEvent, DoneEvent, _drop_temperature() (+24 more)

### Community 17 - "refresh_location.py"
Cohesion: 0.10
Nodes (24): asyncio, _celery_redis_url(), kombu refuses a `rediss://` URL that doesn't spell out `ssl_cert_reqs`, raising…, email_enabled(), password_reset_html(), Transactional email via Resend. Deliberately a no-op when `RESEND_API_KEY` is…, Returns True if the provider accepted it. Never raises., send_email() (+16 more)

### Community 18 - "guestHandoff.ts"
Cohesion: 0.16
Nodes (22): AppNotices(), claimTheGreeting(), SavedFromDemo(), subscribe(), WelcomeBack(), firstNameOf(), Greeting, greetingFor() (+14 more)

### Community 19 - "openai_client.py"
Cohesion: 0.10
Nodes (33): _build_input(), _create_embeddings(), _create_response(), _create_speech(), _create_transcription(), DeltaEvent, DoneEvent, embed_texts() (+25 more)

### Community 20 - "auth.tsx"
Cohesion: 0.06
Nodes (43): handlePlayAudio(), ExportFileMenu(), download(), DependencyStatus, HealthResponse, LoadState, AudioRecorder(), startRecording() (+35 more)

### Community 21 - "AppShell.tsx"
Cohesion: 0.08
Nodes (28): StartPage(), Conversation, StartChat(), go(), Workspace, Rabbit(), ThinkingIndicator(), AccountMenu() (+20 more)

### Community 22 - "package.json"
Cohesion: 0.17
Nodes (11): name, private, version, dictionary-en, dictionary-en-gb, tailwindcss, @tailwindcss/postcss, @types/node (+3 more)

### Community 23 - "InstallAppButton.tsx"
Cohesion: 0.28
Nodes (5): BeforeInstallPromptEvent, Environment, getEnvironment(), InstallAppButton(), subscribeNever()

### Community 24 - "sqlalchemy"
Cohesion: 0.03
Nodes (3): pgvector_sqlalchemy, sqlalchemy, sqlalchemy_dialects

### Community 25 - "test_anthropic_client.py"
Cohesion: 0.09
Nodes (18): CircuitBreakerOpenError, _content_blocks(), is_provider_unavailable_error(), RuntimeError, §12.2: images ride along as vision context for this turn only. The frontend…, _supports_effort(), _FakeAPIError, Exception (+10 more)

### Community 26 - "MessageList.tsx"
Cohesion: 0.17
Nodes (14): GeneratedImageCard(), GeneratedImagePlaceholder(), ChevronIcon(), Exchange, findEvidenceForMarker(), ForkSwitcher(), formatMessageTime(), parseUserMessage() (+6 more)

### Community 27 - "get_conversation_for_user"
Cohesion: 0.14
Nodes (38): _all_messages(), _conversation_out(), create_conversation(), delete_conversation(), delete_message(), devils_advocate(), export_conversation(), export_file() (+30 more)

### Community 28 - "image_generation.py"
Cohesion: 0.15
Nodes (17): _check_database(), _check_redis(), _check_storage(), health_check(), get, get, UUID, Serving a generated image back to the page that asked for it. Deliberately… (+9 more)

### Community 29 - "web_research.py"
Cohesion: 0.10
Nodes (27): gather_context(), _keyword_query(), _merge_sources(), Web research with a supervisor that doesn't take the first answer. Used when…, What the loop settled on, and how it got there., One Tavily query. Empty on any failure - the caller has other queries in flight…, The claim boiled down to its content words - names, numbers, terms - which is…, The queries one round fires at once - the branches of the search. The first… (+19 more)

### Community 30 - "test_message_tree.py"
Cohesion: 0.11
Nodes (18): active_path(), descendants(), latest_leaf(), UUID, The active branch of a conversation - forking's replacement for a flat message…, Descend from `from_id`, always taking the most recently created child, until…, Root-to-leaf order. `messages` must be every row for the conversation the leaf…, Every message sharing `of`'s parent (or every root message of the same… (+10 more)

### Community 31 - "profile_prompt_block"
Cohesion: 0.15
Nodes (10): profile_prompt_block(), Compact profile context for the generation prompt. Deliberately framed as…, looks_like_self_talk(), merge(), Fold newly stated facts into the aspect list. Matched on the label, case-…, Whether this message is worth asking the model about at all., Catching what someone says about themselves, and what it does to a profile. The…, TestItReachesThePrompt (+2 more)

### Community 32 - "api/admin_dashboard.py"
Cohesion: 0.11
Nodes (28): dynamic_query(), _jsonable(), overview(), AsyncSession, get, post, User, The administrator's view: who is signed up, and what they are costing. Read-… (+20 more)

### Community 33 - "documents.py"
Cohesion: 0.12
Nodes (30): AsyncSession, UUID, require_workspace_member(), delete_document(), _excerpt_around(), get_document(), list_documents(), AsyncSession (+22 more)

### Community 34 - "preview_access.py"
Cohesion: 0.11
Nodes (26): close_preview(), open_preview(), _preview_status(), AsyncSession, delete, get, post, User (+18 more)

### Community 35 - "_serialize"
Cohesion: 0.15
Nodes (25): add_aspect(), clear_profile(), complete_onboarding(), import_history(), AsyncSession, delete, post, put (+17 more)

### Community 36 - "send_message"
Cohesion: 0.11
Nodes (15): _derive_title(), EventSourceResponse, A short label for a conversation, from its opening message. Deliberately not an…, send_message(), mark(), _prefetch(), InvalidModeError, InvalidReasoningLensError (+7 more)

### Community 37 - "security.py"
Cohesion: 0.13
Nodes (20): create_access_token(), create_password_reset_token(), create_refresh_token(), decode_token(), InvalidTokenError, password_fingerprint(), Exception, UUID (+12 more)

### Community 38 - "previewAccess.ts"
Cohesion: 0.13
Nodes (20): LockIcon(), Model, ModelPicker(), MODELS, Tile, TILES, UpgradeDialog(), togglePreview() (+12 more)

### Community 39 - "tts"
Cohesion: 0.33
Nodes (7): AsyncSession, post, UploadFile, User, transcribe(), tts(), StreamingResponse

### Community 40 - "check_rate_limit"
Cohesion: 0.23
Nodes (23): _client_ip(), confirm_password_reset(), ensure_workspace(), _issue_tokens(), login(), oauth_google(), provision_new_user(), AsyncSession (+15 more)

### Community 41 - "CitationPopover.tsx"
Cohesion: 0.27
Nodes (11): CitationPopover(), credibilityPhrase(), ExternalLinkIcon(), factualEvidence(), hostOf(), relevancePhrase(), SUPPORT_BANDS, supportPhrase() (+3 more)

### Community 42 - "AdminDashboard.tsx"
Cohesion: 0.18
Nodes (18): AdminPage(), metadata, AdminDashboard(), Bucket, Card(), Flag(), Overview, QueryResult (+10 more)

### Community 43 - "compute_claim_score"
Cohesion: 0.21
Nodes (6): compute_claim_score(), claim_score = 100 * (0.7*support + 0.3*relevance) of whichever evidence item…, ev(), Web sources gathered before generation carry no credibility judgement - the…, TestClaimScore, TestUnmeasuredRelevance

### Community 44 - "_Response"
Cohesion: 0.08
Nodes (12): ASGIApp, CorrelationIdMiddleware, Request, Accepts an inbound X-Request-ID (useful if a frontend/proxy already assigns…, _body(), _Client, Where a search looks, and how recent it is willing to be. No network. What…, Captures the body instead of sending it. (+4 more)

### Community 45 - "document_ingestion.py"
Cohesion: 0.13
Nodes (16): build_chunks(), chunk_text(), _decode(), extract_pages(), _html_text(), UUID, Returns (page_number, text) pairs. page_number is 1-indexed for PDFs and slide…, Extract, chunk and embed one file: the rows to insert, not yet added to any… (+8 more)

### Community 46 - "workspaces.py"
Cohesion: 0.27
Nodes (17): create_workspace(), delete_workspace(), _get_membership(), get_workspace(), list_workspaces(), AsyncSession, delete, get (+9 more)

### Community 47 - "profile_service.py"
Cohesion: 0.25
Nodes (16): A long-lived, evolving picture of one user. Built by inference from their own…, UserProfile, capture_stated_facts(), gather_evidence(), get_profile(), AsyncSession, UUID, Long-lived user profile: an evolving personality.md plus the 25-role… (+8 more)

### Community 48 - "clean_names"
Cohesion: 0.17
Nodes (8): clean_names(), name_for(), What the user calls their companion, per mode. One name per cognitive mode,…, Whatever came in, reduced to names we will actually show. Unknown modes are…, parametrize, Naming your companion. A display label the user chose, so the guards are about…, TestCleanNames, TestNameFor

### Community 49 - "strip_opinion_preface"
Cohesion: 0.33
Nodes (3): strip_opinion_preface(), Belt-and-suspenders for prompt_builder's opinion-framing instruction - the…, TestOpinionPreface

### Community 50 - "test_prompts.py"
Cohesion: 0.22
Nodes (3): What we tell the model. These are string assertions rather than model calls:…, TestModes, TestTaxonomy

### Community 51 - "_ingest_attachments"
Cohesion: 0.14
Nodes (12): _ingest_attachments(), A document attached to a message becomes a workspace document - stored,…, file_type_of(), None when the type can be read; otherwise the sentence to show., unsupported_reason(), _docx(), _pptx(), parametrize (+4 more)

### Community 52 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 53 - "services/__init__.py"
Cohesion: 0.16
Nodes (9): _looks_like_silence(), §12.1: forwards recorded/uploaded audio to OpenAI's speech-to-text endpoint.…, transcribe_audio(), parametrize, The two things a raw speech-to-text result can't be trusted on, and how…, TestLooksLikeSilence, TestTranscribeAudioReportsRatherThanGuesses, fake_call() (+1 more)

### Community 54 - "_flat"
Cohesion: 0.13
Nodes (9): Guidance for choosing *how* to reason. Never shown to the user., thinking_framework_block(), _flat(), The client's Thinking Framework Matrix, as embedded. Its thesis is that one-…, `build_system_instructions` returns Anthropic content blocks now, not a string…, The rule survived the Thinking Framework Matrix; only its wording moved. These…, TestNoSelfLabelling, TestReasoningLensStaysHidden (+1 more)

### Community 55 - "backend_client.py"
Cohesion: 0.15
Nodes (12): BackendTurnError, _parse_sse(), RuntimeError, A thin client that talks to Clardentity exactly the way the real frontend does:…, One real turn, waiting for the whole SSE stream. `mode_confirmed` and…, The HTTP request succeeded (200, SSE headers sent) but the turn itself failed…, Every event the server sent, in order, plus the raw text for anything an…, SSEResult (+4 more)

### Community 56 - "evaluators.py"
Cohesion: 0.13
Nodes (12): ev_identity_no_vendor_leak(), ev_llm_judge_rubric(), ev_no_bias_watch_prose(), ev_no_self_labeling_in_prose(), ev_plain_text_no_markdown(), ev_uncited_claims_score_low(), Deterministic checks, plus the one generic hook into the LLM judge. Signature…, A structural invariant, checked on every case that returns claims, not just the… (+4 more)

### Community 57 - "run.py"
Cohesion: 0.12
Nodes (21): argparse, collections, dotenv, The cases, and what each one is actually checking. Every case here traces back…, Create the dataset if it doesn't exist, then upsert every case by its stable…, sync_dataset(), build_task(), main() (+13 more)

### Community 58 - "theme.tsx"
Cohesion: 0.21
Nodes (16): Appearance(), Accent, accentApplies(), ACCENTS, AccentScope(), announce(), applyAccent(), applyTheme() (+8 more)

### Community 59 - "BackendClient"
Cohesion: 0.18
Nodes (6): BackendClient, _random_password(), Up to three attempts on a 5xx, with backoff. Measured directly against…, Reuse a cached eval account, or create one. Never touches a real user's account…, One workspace named "Evals", reused across runs rather than created fresh each…, Only ever sets one mode's name, on an account that exists solely to run evals -…

### Community 60 - "apiFetch"
Cohesion: 0.13
Nodes (17): PageProps, WorkspacePage(), Action, ChatRowMenu(), patch(), remove(), ChatRowWorkspace, Kebab() (+9 more)

### Community 61 - "extract_claims"
Cohesion: 0.16
Nodes (7): extract_claims(), Parses <claim id="n">...</claim> blocks out of the model's raw output. Recovers…, §9.1 step 2: critiques the draft and may request one revision pass. Returns…, reflect_and_revise(), extract_claims used to be a block-matching regex: one unclosed tag anywhere…, TestExtractClaims, TestExtractClaimsRecovery

### Community 62 - "test_scoring.py"
Cohesion: 0.22
Nodes (10): compute_message_score(), MessageScore, §9.3 weights and band cutoffs, overridable via /admin (§11.8/FR14). These field…, §9.3: message-level rollup + distortion penalty/band cap., ScoredClaim, ScoringWeights, Claim and message scoring. The regression these guard against is the one that…, Nothing in it claimed to be a fact, so there is nothing to verify - and "Needs… (+2 more)

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
Cohesion: 0.36
Nodes (3): instructions(), Who the user is when they are learning, and what it does to the prompt. No…, TestWhatItDoesToThePrompt

### Community 67 - "model_router.py"
Cohesion: 0.22
Nodes (12): Google and xAI, for the model picker in Learning and Co-Creative. Written…, Grok. xAI speaks the OpenAI chat-completions wire format, so this is that shape…, One `data:` line's JSON, or None for everything else in the frame., Gemini, over generativelanguage's SSE endpoint., _sse_payloads(), stream_google(), stream_xai(), Send one generation to whichever provider the chosen model belongs to. Only… (+4 more)

### Community 68 - "geolocation.py"
Cohesion: 0.17
Nodes (9): is_resolvable(), location_prompt_line(), Coarse location from the address a user signs in from. Why at all: "what's the…, False for anything a lookup can't say anything useful about., One line of background, hedged on purpose. Stated as where they *appear* to be…, Sign-in location. No network here - the lookup is verified by hand against a…, TestPromptLine, TestResolvableFilter (+1 more)

### Community 69 - "_validate_context_question"
Cohesion: 0.19
Nodes (4): Drop anything that is not one plain open question. The guards are cheap and the…, _validate_context_question(), The "why" asked before answering. The judgement itself is the model's; these…, TestContextQuestionGuards

### Community 70 - "verification_agent.py"
Cohesion: 0.13
Nodes (14): Making the model's output look like what the UI actually renders. The chat…, Em/en dashes to spaced hyphens. Existing hyphens are left alone., HTML and unrendered Markdown out; the rendered set normalised., replace_dashes(), strip_markup(), ClaimVerification, §9.1 step 3 / §9.4: entailment + support scoring per cited evidence item, plus…, Blind second-level review for a gray_area claim. Never raises - falls back to… (+6 more)

### Community 71 - "event_stream"
Cohesion: 0.15
Nodes (9): _in_background(), _no_text(), A generation that produces nothing, for a turn whose answer is a picture.…, The new name if it lands within `wait_seconds` (written to the row here, sent…, event_stream(), metered_stream(), _settle_title(), _store_title() (+1 more)

### Community 72 - "CruxSplitter"
Cohesion: 0.17
Nodes (6): CruxSplitter, Streaming counterpart of extract_crux. The crux is the first thing the model…, Returns (crux_text_if_it_just_resolved, text_to_pass_downstream)., Anything still held when the stream ends (e.g. an unclosed crux)., The streaming twin of extract_crux: the crux is announced once, as its own…, TestCruxSplitter

### Community 73 - "api/profile.py"
Cohesion: 0.21
Nodes (16): list_roles(), get, The 25-role framework, for rendering the profile editor., LearningRoleRequest, OnboardingAnswerIn, OnboardingRequest, ProfileAspectIn, ProfileAspectOut (+8 more)

### Community 74 - "build_scored_evidence"
Cohesion: 0.46
Nodes (4): build_scored_evidence(), `markers` are the 1-indexed CONTEXT positions a claim cited. Markers…, EvidenceVerification, TestEvidenceAssembly

### Community 75 - "fake"
Cohesion: 0.26
Nodes (6): The reviewer's judgement isn't testable here; its guards are, and each one…, TestDecisionReviewGuards, fake(), fake(), fake(), fake()

### Community 76 - "track"
Cohesion: 0.13
Nodes (31): FeedbackWidget(), save(), submitComment(), toggleRating(), MessageFeedback, ThumbIcon(), LearningRoleCard(), choose() (+23 more)

### Community 77 - "api/auth.py"
Cohesion: 0.17
Nodes (20): delete_me(), me(), delete, get, Delete the signed-in account and everything it owns. Irreversible. Two foreign…, The address to look up for what was typed in the email field. An address is…, resolve_login(), AuthResponse (+12 more)

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
Cohesion: 0.27
Nodes (8): fit_gist(), _is_partial_close(), _is_partial_open(), ParsedClaim, Returns (gist, overflow): the first sentence of `text`, tag- and citation-free,…, Non-streaming version of the same stripping, for text we already have in full…, _split_result(), strip_claim_tags()

### Community 83 - "ClaimTagStripper"
Cohesion: 0.24
Nodes (4): ClaimTagStripper, Incrementally strips <claim id="n"> / </claim> tags from a stream of text…, TestStreamingStripperWithOpinionTag, TestClaimTagStripper

### Community 84 - "test_claim_parser.py"
Cohesion: 0.19
Nodes (6): extract_crux(), Pulls a leading <crux>...</crux> block off the front of raw text. Returns…, Claim tag parsing, including the opinion attribute. <claim id="n"…, The gist is one sentence, however much the model hands over as the crux., TestExtractCrux, TestGistLength

### Community 85 - "split_leading_sentence"
Cohesion: 0.29
Nodes (4): Fallback for an answer that opens with no <crux> block: peel the opening…, split_leading_sentence(), Rapid mode's fallback when the model skipped the <crux> wrapper: the first…, TestSplitLeadingSentence

### Community 86 - "trim_history"
Cohesion: 0.15
Nodes (8): The conversation so far, cut to something that cannot be abused. Oldest turns…, trim_history(), The landing page's try-it-here allowance. The counters themselves need Redis,…, `POST /guest/import` - the promise made at the sign-up wall. The transcript…, TestHistoryIsNotAnOpenDoor, TestKeepingTheDemoConversation, TestTheAllowance, _uuid_of()

### Community 87 - "token_meter.py"
Cohesion: 0.22
Nodes (8): stream(), current(), meter(), What a turn cost, in tokens. `messages.token_usage` has existed since the first…, Open a meter for the duration of one turn. Nested meters are not a thing here;…, TurnUsage, contextlib, contextvars

### Community 88 - "export_service.py"
Cohesion: 0.42
Nodes (9): MessageOut, build_markdown_export(), build_pdf_export(), _exported_at(), _line(), _message_header(), _pdf_safe(), FPDF (+1 more)

### Community 89 - "privacy/page.tsx"
Cohesion: 0.42
Nodes (7): LegalPage(), Section(), Table(), metadata, PrivacyPage(), metadata, TermsPage()

### Community 90 - "clean_output"
Cohesion: 0.16
Nodes (11): _store_counterfactual(), _build_instructions(), Judging the options the user brought, not the ones we would have picked.…, Returns the review stored on the message, or None when there was no menu of…, review_decisions(), _text(), clean_output(), Removes the model's own evidential-status asides from the prose. (+3 more)

### Community 91 - "cached"
Cohesion: 0.18
Nodes (12): cached(), name_conversation(), A name for a conversation, from its first exchange. The sidebar used to show…, Never raises: on any failure the caller keeps `fallback` (the derived…, _tidy(), _bias_note(), generate_counterfactual(), The same answer with the guardrails off. The bias taxonomy is used here as an… (+4 more)

### Community 92 - "decision_classifier.py"
Cohesion: 0.20
Nodes (14): _classify(), build_bias_guidance(), _build_instructions(), classify_decision(), DecisionClassification, Classify what kind of decision a turn is about, so bias screening can be scoped…, Never raises - an unusable answer means "no domain", which simply leaves bias…, Prompt fragment naming the biases that most commonly distort this kind of… (+6 more)

### Community 93 - "_CircuitBreaker"
Cohesion: 0.14
Nodes (7): _CircuitBreaker, _CircuitBreaker, CircuitBreakerOpenError, RuntimeError, The model returned something that isn't the requested object., §14 resilience: short-circuits calls after repeated failures instead of letting…, StructuredOutputError

### Community 94 - "_portable_schema"
Cohesion: 0.33
Nodes (4): _portable_schema(), Rewrite nullable enums into the form this API's validator accepts. `{"type":…, Nullable enums. `{"type": ["string","null"], "enum": [...]}` is valid JSON…, TestPortableSchema

### Community 95 - "search_planner.py"
Cohesion: 0.15
Nodes (12): _plan(), AvatarCue, compute_avatar_cue(), §8.4: two independent signals combine once confidence scoring completes. A…, needs_live_data(), plan_searches(), What to look up on the web before answering. One search with the question as…, Never raises: on any failure the plan is the message itself, which is what the… (+4 more)

### Community 96 - "TestIdentity"
Cohesion: 0.22
Nodes (3): Which AI should I use" is answered as itself, in every mode - including…, The rule is about not volunteering. Asked directly, it answers - and it never…, TestIdentity

### Community 97 - "complete"
Cohesion: 0.17
Nodes (11): complete(), CompleteOut, CompleteRequest, BaseModel, post, Request, User, The new part only. The model returns the whole sentence, typed part included,… (+3 more)

### Community 98 - "env.py"
Cohesion: 0.11
Nodes (17): do_run_migrations(), Run migrations in 'online' mode., Run migrations in 'offline' mode. This configures the context with just a URL…, In this scenario we need to create an Engine and associate a connection with…, run_async_migrations(), run_migrations_offline(), run_migrations_online(), configure_logging() (+9 more)

### Community 99 - "app/layout.tsx"
Cohesion: 0.22
Nodes (9): frontend_app_globals, geistMono, geistSans, metadata, outfit, RootLayout(), viewport, THEME_INIT_SCRIPT (+1 more)

### Community 100 - "build_conversation_input"
Cohesion: 0.43
Nodes (4): build_conversation_input(), `history` is the verbatim short-term window (oldest-first); anything older than…, The clarifying question has to reach the model, or the answer to it is a non-…, TestClarifierInHistory

### Community 102 - "sse.ts"
Cohesion: 0.16
Nodes (15): networkErrorMessage(), ChatFinalEvent, ChatStatus, ChatStreamHandlers, ClarifyingOptionsSuggestion, ContextQuestion, Guidance, handleRawEvent() (+7 more)

### Community 103 - "judge.py"
Cohesion: 0.50
Nodes (4): Anthropic, _client(), An LLM judge, separate from the product it is grading. Deterministic checks…, os

### Community 104 - "_flat"
Cohesion: 0.38
Nodes (3): _flat(), `build_system_instructions` returns cache-annotated content blocks, not a…, TestPromptWiring

### Community 105 - "consent.ts"
Cohesion: 0.30
Nodes (9): ConsentBanner(), Consent, consentGranted(), getSnapshot(), listeners, read(), setConsent(), useConsent() (+1 more)

### Community 106 - "GuestDemo.tsx"
Cohesion: 0.07
Nodes (39): Home(), CruxCard(), MessageList(), StreamingMessage, frontend_components_chat_modeselector_cognitivemode, ModeSelector(), CurtainShimmer(), asMessage() (+31 more)

### Community 107 - "api/biases.py"
Cohesion: 0.36
Nodes (12): get_bias(), list_biases(), list_categories(), list_decision_categories(), get, User, _to_out(), BiasCategoryOut (+4 more)

### Community 108 - "prompt_builder.py"
Cohesion: 0.18
Nodes (13): embed_text(), build_context_block(), Numbered context the model cites with [n] markers. Documents come first and…, AsyncSession, UUID, Top-k pgvector similarity search over the workspace's processed documents. Runs…, retrieve_chunks(), RetrievedChunk (+5 more)

### Community 109 - "storage_key"
Cohesion: 0.20
Nodes (9): generate(), UUID, Generate one image, store it, and return what the client needs. Returns `{"id",…, Where one generated image lives. The owner is part of the key, so the serving…, The picture, ten times smaller. The image models hand back a PNG, which at…, storage_key(), _to_webp(), The Co-Creative picture path, minus the network. The two things worth pinning… (+1 more)

### Community 111 - "infer_profile"
Cohesion: 0.21
Nodes (13): infer_profile(), InferredProfile, Never raises - a failed inference simply leaves the existing profile alone., all_roles(), get_role(), The role list as prompt text, for inferring which roles a user occupies., Drop anything outside the taxonomy and enforce exclusivity. Inference is an LLM…, A facet of a role. `exclusive` qualifiers admit exactly one value (a sibling is… (+5 more)

### Community 112 - "autocorrect.ts"
Cohesion: 0.21
Nodes (11): warm(), correctionFor(), editDistance(), fetchText(), Fix, loadSpeller(), matchCase(), NSpell (+3 more)

### Community 113 - "api/memory.py"
Cohesion: 0.31
Nodes (9): get_memory(), AsyncSession, get, post, User, UUID, rebuild_memory(), MemoryOut (+1 more)

### Community 115 - "e0f1a2b3c4d5_legal_mode.py"
Cohesion: 0.83
Nodes (3): downgrade(), _swap(), upgrade()

### Community 116 - "guidance.py"
Cohesion: 0.25
Nodes (7): _history_block(), propose_guidance(), Three judgements about the question, made before the answer exists. All are…, Drop rewrites that ask the user to fill in a blank. "I want to get better at…, Returns the guidance object stored on the message, or None. `history` is the…, _reject_placeholders(), TestPlaceholderRejection

### Community 117 - "_vet"
Cohesion: 0.31
Nodes (5): Refuse anything that is not one plain read. Checked here rather than trusted to…, _vet(), parametrize, The model is told to write one read-only SELECT. This is what happens when it…, TestQueryGate

### Community 119 - "cleanMessageText"
Cohesion: 0.24
Nodes (8): copy(), renderBody(), renderCitations(), renderTextWithCitations(), cleanMessageText(), ENTITIES, MARKDOWN_SPANS, PRECACHE

### Community 120 - "ConfidenceBadge.tsx"
Cohesion: 0.22
Nodes (6): BAND_DOTS, BAND_MEANING, BAND_STYLES, ConfidenceBadge(), TIER_LABELS, Claim

### Community 121 - "MessageBubble"
Cohesion: 0.33
Nodes (8): GuidanceCard(), MessageBubble(), comparableText(), FlipButton(), FlipIcon(), ResponseFlip(), useCounterfactual(), toggle()

### Community 124 - ".test_rejected_seed_falls_through_to_a_search"
Cohesion: 0.32
Nodes (4): A pre-answer search that arrived late seeds the per-claim research: the seed is…, TestSeededResearch, fake_search(), fake_supervise()

### Community 125 - "markdown.tsx"
Cohesion: 0.39
Nodes (7): Block, InlineSegment, isTableLine(), renderInline(), splitBlocks(), splitCells(), splitInline()

### Community 126 - "rebuild_memory_summary"
Cohesion: 0.33
Nodes (8): get_memory_summary(), AsyncSession, UUID, Regenerates the rolling summary from everything older than the short-term…, rebuild_memory_summary(), UUID, _rebuild(), rebuild_memory_task()

### Community 127 - "wanted_image"
Cohesion: 0.29
Nodes (6): ImageRequest, What the user asked for, when they asked for a picture., What picture this message is asking for, or None if it is not. Never raises: an…, _schema(), wanted_image(), TestIntent

### Community 128 - "DecisionReview.tsx"
Cohesion: 0.48
Nodes (6): Chip(), DecisionReview(), Heading(), Tick(), Warn(), DecisionReviewData

### Community 130 - "MessageActions"
Cohesion: 0.48
Nodes (7): ActionIcon(), CopyIcon(), MessageActions(), PencilIcon(), RedoIcon(), TickIcon(), TrashIcon()

### Community 140 - "veracity_tier"
Cohesion: 0.47
Nodes (3): 0 fabricated, 21-40 distorted, 41-80 gray_area, 81-99 probable_fact, 100…, veracity_tier(), TestVeracityTiers

### Community 141 - "TourOverlay.tsx"
Cohesion: 0.28
Nodes (10): Pos, Rect, resolveVisibleTarget(), TourOverlay(), placeCallout(), tick(), layoutViewport(), toLayoutRect() (+2 more)

### Community 142 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 143 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, dictionary-en, dictionary-en-gb, next, nspell, posthog-js, react, react-dom

### Community 145 - "stated_facts.py"
Cohesion: 0.50
Nodes (4): extract(), Catching what someone tells you about themselves, when they tell you. The…, Durable facts stated in one message. Never raises - a capture that fails is a…, _schema()

### Community 146 - "pytest"
Cohesion: 0.15
Nodes (11): _clear_rate_limits(), _dispose_pools_between_tests(), Return every pooled connection before the test's event loop closes. asyncpg and…, Rate limiting is infrastructure these tests run through, not the thing under…, _BrokenRedis, The rate limiter's own dependency going down should not take the product with…, test_a_redis_error_lets_the_request_through(), test_a_working_redis_still_enforces_the_limit() (+3 more)

### Community 147 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 149 - "upload_document"
Cohesion: 0.36
Nodes (6): post, UploadFile, upload_document(), Document, render_docx(), TestRenderDocx

### Community 150 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 154 - "_worth_retrying"
Cohesion: 0.67
Nodes (3): BaseException, Retry transient failures only. A 4xx other than 429 is the API telling us the…, _worth_retrying()

## Knowledge Gaps
- **212 isolated node(s):** `Testing safely`, `sync-upstream.sh script`, `TourState`, `TourStatus`, `TourStep` (+207 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 856 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `cx` to `DecisionReview.tsx`, `ChatView.tsx`, `MessageActions`, `MessageInput.tsx`, `react`, `TourOverlay.tsx`, `auth.tsx`, `AppShell.tsx`, `InstallAppButton.tsx`, `MessageList.tsx`, `previewAccess.ts`, `CitationPopover.tsx`, `AdminDashboard.tsx`, `theme.tsx`, `apiFetch`, `track`, `GuestDemo.tsx`, `cleanMessageText`, `ConfidenceBadge.tsx`, `MessageBubble`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `tour.tsx`, `ChatView.tsx`, `MessageInput.tsx`, `cx`, `TourOverlay.tsx`, `usePrefersReducedMotion`, `guestHandoff.ts`, `auth.tsx`, `AppShell.tsx`, `package.json`, `InstallAppButton.tsx`, `MessageList.tsx`, `previewAccess.ts`, `CitationPopover.tsx`, `AdminDashboard.tsx`, `theme.tsx`, `apiFetch`, `track`, `privacy/page.tsx`, `consent.ts`, `GuestDemo.tsx`, `ConfidenceBadge.tsx`, `MessageBubble`, `markdown.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `clean_output()` connect `clean_output` to `_serialize`, `verification_agent.py`, `event_stream`, `office_export.py`, `guest.py`, `api/profile.py`, `thinking_review.py`, `api/chat.py`, `profile_service.py`, `test_guidance.py`, `strip_opinion_preface`, `infer_profile`, `guidance.py`, `upload_document`, `token_meter.py`, `get_conversation_for_user`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `send_message()` (e.g. with `ClaimOut` and `EvidenceOut`) actually correct?**
  _`send_message()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Testing safely`, `sync-upstream.sh script`, `TourState` to the rest of the system?**
  _212 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ChatView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.046620046620046623 - nodes in this community are weakly interconnected._
- **Should `parse_export` be split into smaller, more focused modules?**
  _Cohesion score 0.08846153846153847 - nodes in this community are weakly interconnected._