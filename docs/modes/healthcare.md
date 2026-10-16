# Healthcare - the standard

Healthcare is the eighth companion (2026-10-16). It helps people understand
their health and get to the right care: symptoms and conditions and how they
are usually assessed, tests and results in general terms, medicines in
general terms, self-care that is generally safe, and how to prepare for an
appointment.

It is held to three standards: **what it says** (general information and
signposting, never a diagnosis or a prescription), **what happens to what
people tell it** (consent first, under the rules of where they are), and
**the safety floor** every mode shares.

## 1. What it says

The prompt is `MODE_INSTRUCTIONS["healthcare"]` in
`backend/app/services/prompt_builder.py`.

**When to get care - signposts, not verdicts.** When symptoms are described,
the answer says first when to get care, as general signposts the person
applies to themselves:

- **Call the emergency number now** if any of these are present: chest pain or
  pressure; signs of stroke; severe difficulty breathing; severe bleeding;
  swelling of the face or throat after an exposure; a sudden, severe
  headache; confusion, fainting or unresponsiveness; a seizure; thoughts of
  suicide; suspected poisoning or overdose (with the poison-control number
  where one is on file).
- Then which signs mean a doctor today, which mean an appointment, what is
  generally safe to manage at home, and for how long.

It never ends with a ruling on the person's own case ("in your case, waiting
is fine"). This replaced an earlier four-level triage scale ("Emergency /
Urgent / Soon / Self-care - say the level"): a personal triage decision is a
clinician's, and software that makes one is a regulated **medical device**
under the EU MDR (MDCG 2019-11), the UK MHRA's rules, Swiss MedDO and
Australia's TGA rules, and is reserved to doctors in Japan, Korea and Taiwan.

**Boundaries - in every reply:**

- An AI giving general health information - not a doctor; does not examine,
  diagnose or treat.
- Never tells someone what they have or most likely have, never ranks
  conditions for them, never gives a personal risk score. It explains what
  can cause symptoms like these in general, what tells them apart, and what
  a clinician would check.
- Never prescribes; never advises starting, stopping or changing a
  prescription medicine or its dose; never gives an individual dose. For
  over-the-counter medicines: the label dose and local guidance, and who
  should check with a pharmacist first.
- Does not read an image, scan or report as a diagnosis - explains the terms
  and what to ask the clinician who ordered it.
- Lower threshold for seeing a professional in pregnancy, infants and young
  children, older adults, and serious long-term conditions.
- Never gives information that could be used to self-harm or overdose.
- Says once, at the end, that this is general information and not a
  substitute for a clinician who can examine them.

**Sources:** national health services and clinical guidance first (WHO,
health ministries, NHS, CDC, NICE, national formularies, medical-society
guidelines), saying when guidance differs between countries. Claims are
checked like any other companion's.

## 2. What happens to what people tell it

Health information is special-category or sensitive data almost everywhere.
The common denominator of those laws is **explicit, separate, informed,
withdrawable consent before processing**, so that is the global floor.

| | |
|---|---|
| **Consent first** | Healthcare does nothing until the person has agreed on the consent card: where they are, what happens to their conversation there, the laws it is given under, and an age box. Recorded with the time, the jurisdiction and the text version (`CONSENT_VERSION` in `backend/app/api/healthcare.py`); a new version asks again. |
| **Adults only** | 18, or the local age of majority where it is higher (19 in Korea and Algeria, 20 in Thailand, 21 in Bahrain and Kuwait). |
| **Withdrawable** | Settings → Healthcare. Optionally deletes every chat with a Healthcare message in it (the whole chat - a conversation is one thread). |
| **Stored, temporary, or not offered** | Per jurisdiction (`storage`): `persist` - kept in history; `transient` - Healthcare runs only as a temporary chat, deleted when left (where health data may not be stored abroad, or storing it needs a regulator permit we do not hold); `unavailable` - not offered (US sanctions, no AI-provider support, or no lawful route to process health data abroad at all). |
| **Never profiled** | Healthcare messages are never evidence for the profile; stated-fact capture never records health, emotional, sexual-life, religious or harm data in any mode. |
| **Never in analytics** | Events record Guidance and Healthcare only as `"sensitive"`. |
| **Demo** | Consent is held for the browser session; demo Healthcare turns are never carried into an account at sign-up. |
| **Enforced on the server** | 428 without consent, 409 for a kept chat where only temporary is allowed, 403 where unavailable - on new messages, regenerations and live-call transcripts alike. |

### The regulation suite

`backend/app/services/regulations.py` resolves the rules for where someone
is, in layers - **baseline → EU (for EU/EEA states and the outermost
regions) → the country a territory belongs to → the country → a state or
province** - each overriding only what it sets, while rules, laws and
sources add up (laws most specific first, so the consent card names the
Washington My Health My Data Act before the FTC Act).

Every place resolves to something. Where nothing specific is on file the
baseline applies, and the baseline is the strict end of the range: explicit
consent, adults only, general information only.

The data:

- `backend/app/data/regulations/profiles/*.json` - one file per region, each
  profile distilled from cited research: how health data is classified, the
  consent age, the storage decision and why, up to four laws, model rules for
  Healthcare and for Guidance, the regulator, sources, confidence, an as-of
  date, `needs_review`, and notes for counsel. `_global.json` holds the
  baseline and the places our AI providers do not serve, and overrides any
  regional storage decision.
- `backend/app/data/regulations/health.json` - built from those by
  `python3 scripts/regulations/build_health.py`, which refuses to write a
  table with a phone number in a rule, an unknown storage policy, or a
  non-persist decision nobody is asked to review.
- `backend/app/data/regulations/emergency.json` - for every ISO 3166-1 code:
  emergency, ambulance, a national crisis line and poison control where
  verified. **A wrong crisis number given to someone in danger is the worst
  failure this file can have**, so an unverified line is left empty and the
  product says "your local emergency number" and links findahelpline.com.
  Numbers reach people only from this table - never from the model.

The model sees a JURISDICTION block (Guidance and Healthcare only): where the
person appears to be, the numbers to use and no others, and the rules for
that place - for example "do not tell the person they are likely to have a
particular disease" in Japan, "AI platforms may not counsel patients" in
India, "do not call this 'pomoc psychologiczna'" in Poland.

**This is product compliance engineering, not legal advice.** Each profile
says how confident it is and what is uncertain; `needs_review` marks the
ones counsel should read first.

## 3. The safety floor

Shared with every mode - see `docs/modes/guidance.md#safety`. In Healthcare
it matters twice: a medical emergency is one of the kinds the screen looks
for, and the support card's numbers come from the same table as the
consent card's.

## How it is tested

| What | Where |
|---|---|
| The prompt says every line of this standard | `backend/tests/test_mode_standards.py::TestHealthcare` |
| Consent: explicit, current, recorded, withdrawable; 428 / 409 / 403 on every path | `backend/tests/test_healthcare.py` |
| Never profiled; demo health turns not imported; support cards rebuilt from the table | `test_healthcare.py::TestNeverForProfiling`, `TestTheDemo` |
| Layering, territories, never failing open | `backend/tests/test_regulations.py` |
| The shipped tables: every country resolves, EU states inherit the EU layer, numbers are numbers, no phone numbers in rules | `test_mode_standards.py::TestTheShippedTables` |
| Real answers keep to the standard (H1-H5), judged per criterion | `scripts/regression/mode_standards.py` |
| Smoke rows | `HEALTH-CONSENT`, `DEMO-HEALTH-CONSENT`, `APP-SAFETY-CARD` in `scripts/regression/smoke.py` |
| Matrix rows | E10-E14, B14, L9, L10 in `.claude/skills/regression/MATRIX.md` |
