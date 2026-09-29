# The ten-layer learning model vs. what Clardentity is today

Audited against the code on 29 September 2026, not against memory: every
"have" below is a file you can open, and every "missing" was checked by
searching the repository for it.

Scores are coverage of that layer's listed capabilities, rounded honestly
rather than generously.

| # | Layer | Coverage | Short verdict |
|---|---|---|---|
| 1 | Input & Knowledge | **~90%** | Effectively done |
| 2 | Understanding | **~50%** | Text is strong, visuals absent |
| 3 | Practice | **~5%** | Not built. Actively disabled |
| 4 | Assessment | **~10%** | Assesses itself, never the learner |
| 5 | Diagnosis | **~15%** | Diagnoses answers, not understanding |
| 6 | Adaptation | **~25%** | Knows the person, not their progress |
| 7 | Communication Skills | **~35%** | Can speak; measures nothing |
| 8 | Application | **~15%** | Makes artefacts, runs no projects |
| 9 | Collaboration | **~10%** | Schema exists, no way to use it |
| 10 | Learning Intelligence | **~40%** | Strong memory, no competency model |

## Layer by layer

### 1. Input & Knowledge — ~90%, effectively done
**Have.** Multiformat ingestion (PDF, Word, Excel, PowerPoint, txt, md, csv,
tsv, json, xml, html, rtf, plus images as vision input) via
`document_ingestion.py`; source-grounded answering through pgvector retrieval
over the workspace (`retrieval.py`); citable live search through Tavily with
per-claim `[n]` markers (`web_research.py`); cross-source synthesis - uploaded
documents and web results share one numbered context block and a single claim
can cite several (`prompt_builder.build_context_block`).

**Missing.** Video and audio files as sources; pulling a URL or a YouTube
lecture in by link rather than by upload.

### 2. Understanding — ~50%
**Have.** Summaries (the gist on every answer); explanations pitched to a
named board and year in Learning mode; several representations of a kind -
prose, tables, bullets, spoken audio, and export to Word, PowerPoint and Excel.

**Missing.** Concept maps and diagrams of any sort: nothing in the product
draws. Prerequisite mapping - it cannot say "you need X before this makes
sense", because it has no model of what you already know (see layer 5).

### 3. Practice — ~5%, the largest gap
**Have.** Nothing. The only mention of a quiz in the codebase is the
instruction forbidding one: Learning mode is told *"Do not end with a quiz
question - checking understanding is handled outside your answer"*
(`prompt_builder.py`). That was a deliberate choice, and this layer is the
bill for it.

**Missing.** Quizzes, flashcards, active recall, interleaving, simulations,
roleplay. All of it. There is no question bank, no attempt record, no
scheduler, no notion of an item to practise.

### 4. Assessment — ~10%
**Have.** A verification pipeline that marks work rigorously - claim
extraction, per-claim evidence checking, a confidence band. It marks
*Clardentity's own answers*. Not one part of it looks at anything the user
wrote.

**Missing.** Automated marking of a learner's work, exam simulation, mastery
assessment, evaluation of a learner's reasoning. Turning the existing marking
machinery around to point at the user is the single cheapest large win on this
list - the hard part (evidence-checked judgement with citations) already
exists and is the thing competitors do worst.

### 5. Diagnosis — ~15%
**Have.** A 200-plus entry cognitive-bias taxonomy (`biases.json`), distortion
flagging per claim, and confidence calibration - all aimed at the answer.
Thought coach examines how a problem should be thought about.

**Missing.** Knowledge-gap mapping, misconception detection, an error
taxonomy, calibration of the *learner's* confidence. Nothing records what a
person got wrong, so nothing can notice a pattern in it.

### 6. Adaptation — ~25%
**Have.** A long-lived user profile inferred from their own conversations,
with editable aspects and a 25-role classification (`profile_service.py`);
per-conversation rolling memory (`memory_service.py`); curriculum pitching
when a board and year are given; automatic mode switching.

**Missing.** Personalised pathways, difficulty calibration that moves with
performance, spaced repetition, forgetting prediction. The system knows who
you are. It does not know what you have learned, because nothing measures it.

### 7. Communication Skills — ~35%
**Have.** Voice input with Whisper transcription and language detection; TTS
playback of any answer; a live WebRTC voice call that saves back into the
chat (`realtime.py`).

**Missing.** Pronunciation scoring, fluency tracking, speaking-habit analysis
(filler words, pace, hedging), practice with humans. The audio is transcribed
and then thrown away - `audio_transcripts` keeps the text and the duration,
and nothing analyses the speech itself.

### 8. Application — ~15%
**Have.** Co-Creative mode produces real artefacts, exportable as Word,
PowerPoint and Excel.

**Missing.** Projects with stages, virtual labs, workplace simulations,
real-world task briefs, portfolios. There is no object in the schema that
represents a piece of work in progress over time.

### 9. Collaboration — ~10%
**Have.** `workspace_members` with owner/member roles, and retrieval already
scoped per workspace - the data model was built for sharing.

**Missing, and notable.** There is no endpoint that adds a member. The table
can only ever contain the owner, so every workspace is single-player in
practice. Peer learning, peer review and teacher tools are all absent. This is
the cheapest gap to close by far: the schema, the permission checks and the
per-workspace scoping already exist, and an invite flow is the missing piece.

### 10. Learning Intelligence — ~40%
**Have.** The strongest thing here is privacy-controlled memory, which is
genuinely built: the profile is visible, individual facts can be edited or
deleted, inference stops overwriting once corrected, the whole profile can be
deleted, conversations export, and the account deletes with everything in it.
Learning analytics exist in the administrator's sense (usage, tokens, modes).

**Missing.** A personal knowledge graph, a competency map, learner-facing
analytics, and explanations for recommendations - there are no
recommendations to explain.

## What this means

Six of the ten layers assume something Clardentity has never had: **a record
of the learner's own performance over time**. Practice, assessment,
diagnosis, adaptation, application and learning intelligence all read from it.
Today the system stores what was asked and what was answered, never what the
person understood.

That is one missing foundation, not six missing features. A `learner_state`
model - items practised, attempts, outcomes, mastery estimates - is the
prerequisite for half this table, and everything above it gets much cheaper
once it exists.

Ranked by value per unit of work:

1. **Workspace invitations** (layer 9) - days. The schema is already there.
2. **Turn the verification pipeline on the learner** (layer 4) - weeks. Mark
   an answer the user submits, with evidence, the way it already marks its
   own. Nothing else on the market grades with citations.
3. **The learner-state model, then practice** (layers 3, 5, 6) - the real
   build. Quizzes and flashcards are easy; the scheduler and the mastery
   estimate behind them are the work.
4. **Speech analysis** (layer 7) - moderate. The audio already passes through
   the server; it is currently discarded after transcription.
5. **Diagrams and concept maps** (layer 2) - moderate, and the most visible
   to a user on day one.

Layers 8 and 9 beyond invitations - projects, labs, portfolios, peer review -
are a different product shape (a learning platform, rather than a companion
that checks its own work). Worth deciding deliberately rather than drifting
into.
