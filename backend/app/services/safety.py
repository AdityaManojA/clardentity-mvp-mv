"""Is the person at risk? Read on every message, in every mode.

Until 2026-10-16 the product's whole response to someone in crisis was one
sentence in the Reflect & Relieve prompt. Nothing noticed a crisis in any
other mode, nothing told the person who to call where they are, and the
pre-answer gates could answer "I don't want to be here any more" with "what
matters more to you?". This is the floor every mode now stands on:

- `assess` reads the message (with a little of the conversation) and says
  how worried to be - `none`, `concern` or `crisis` - and about what.
- The chat routes then skip every gate for a message that is not `none`, put
  `prompt_block` in front of the model, send the `card` (numbers from the
  verified table in services/regulations, never from the model), and for a
  crisis ship the reply without claim checking - no confidence badge belongs
  next to a crisis line.

The check is a small, fast model call run alongside the other pre-answer
work, so it adds no wait to an ordinary turn. If it fails or runs long, a
lexical backstop decides instead: missing a crisis is the expensive error
here, and a phrase list is a better fallback than silence.

Standard: docs/modes/guidance.md (Safety). Tests: tests/test_safety.py.
"""

import asyncio
import logging
import re
from dataclasses import asdict, dataclass

from app.services.anthropic_client import generate_structured
from app.services.regulations import CrisisResources, crisis_resources

logger = logging.getLogger("clardentity.safety")

LEVELS = ("none", "concern", "crisis")
KINDS = (
    "none",
    "suicide_or_self_harm",
    "harm_to_others",
    "abuse_or_violence",
    "medical_emergency",
    "someone_else_at_risk",
    "distress",
)

#: Long enough for the small model on a bad day, short enough that the
#: answer is not held up by a check that has stopped answering.
_TIMEOUT_SECONDS = 6.0


@dataclass(frozen=True)
class Assessment:
    level: str = "none"
    kind: str = "none"
    #: Which check decided: "model", "lexical" (the backstop) or "none".
    by: str = "none"

    @property
    def flagged(self) -> bool:
        return self.level != "none"

    @property
    def crisis(self) -> bool:
        return self.level == "crisis"


NONE = Assessment()

_INSTRUCTIONS = (
    "You screen one message sent to an AI assistant for signs that the person - "
    "or someone they describe - is at risk. You do not answer it. Judge the "
    "NEWEST message, using the conversation before it only to understand it.\n\n"
    "level:\n"
    "- crisis: current danger. Suicidal thoughts with any intent, plan, means or "
    "timeframe; self-harm happening now or about to; a stated intent to hurt "
    "someone; being hurt, threatened or trapped by someone right now; a "
    "medical emergency happening now (overdose, poisoning, can't breathe, chest "
    "pain, stroke signs, heavy bleeding); a child in danger.\n"
    "- concern: real distress or risk without immediacy. Passive wishes to be "
    "dead or to disappear, hopelessness, past self-harm, ongoing abuse they are "
    "not in danger from this minute, worrying symptoms that are not an "
    "emergency, someone else they fear for.\n"
    "- none: everything else - including questions ABOUT these subjects asked "
    "for study, work, writing, statistics, news or curiosity ('what is the "
    "suicide rate in Japan', 'write a story where a character...'), ordinary "
    "stress, and figures of speech ('this exam is killing me', 'I could die of "
    "embarrassment').\n\n"
    "kind: suicide_or_self_harm, harm_to_others, abuse_or_violence, "
    "medical_emergency, someone_else_at_risk (they fear for another person), "
    "distress (concern without a more specific kind), or none.\n"
    "When it is genuinely unclear whether a message is a figure of speech or "
    "real, choose concern over none - a gentle check-in costs little; missing "
    "someone costs a great deal. Messages may be in any language, including "
    "Indian languages and Hinglish (Hindi written in Latin letters, e.g. 'mar "
    "jaana chahta hoon' - I want to die)."
)

_SCHEMA = {
    "type": "object",
    "properties": {
        "level": {"type": "string", "enum": list(LEVELS)},
        "kind": {"type": "string", "enum": list(KINDS)},
    },
    "required": ["level", "kind"],
    "additionalProperties": False,
}

# The backstop's phrase list. Deliberately short and unambiguous: it only
# decides when the model could not, and a false alarm here costs a check-in.
# English plus the languages most of our users write in.
_CRISIS_PATTERNS = [
    r"\b(kill|hang|hurt) myself\b",
    r"\bend (it all|my life)\b",
    r"\b(want|going|plan(ning)?) to die\b",
    r"\bsuicid(e|al)\b",
    r"\bno reason to live\b",
    r"\boverdos(e|ed|ing)\b",
    r"\bcut(ting)? myself\b",
    r"\bself[- ]harm",
    # India, where most of our users are: the word for suicide in each of
    # the major scripts, Hindi phrases for wanting to die, and the same in
    # Hinglish - Hindi typed in Latin letters, which is how a lot of it is
    # actually written.
    r"आत्महत्या",          # Hindi, Marathi: suicide
    r"ख़ुदकुशी|खुदकुशी",     # Hindi: suicide
    r"मर जाना चाहता|मर जाना चाहती|मरना चाहता|मरना चाहती",  # Hindi: want to die
    r"जीना नहीं चाहता|जीना नहीं चाहती",  # Hindi: don't want to live
    r"আত্মহত্যা",          # Bengali: suicide
    r"ఆత్మహత్య",           # Telugu: suicide
    r"ಆತ್ಮಹತ್ಯೆ",           # Kannada: suicide
    r"આત્મહત્યા",          # Gujarati: suicide
    r"ਖੁਦਕੁਸ਼ੀ|ਆਤਮਹੱਤਿਆ",    # Punjabi: suicide
    r"ଆତ୍ମହତ୍ୟା",          # Odia: suicide
    r"ആത്മഹത്യ",           # Malayalam: suicide
    r"தற்கொலை",            # Tamil: suicide
    r"خودکشی",              # Urdu: suicide
    r"انتحار",              # Arabic: suicide
    r"\b(khud ?kushi|aatma?hatya|atmahatya)\b",  # Hinglish: suicide
    r"\b(marna|mar jaana|mar jana) chaht[ai] (hu|hoon|hun)\b",  # Hinglish: want to die
    r"\bjeena nahi chaht[ai]\b",  # Hinglish: don't want to live
    r"\bsuicide kar (lu|lun|lunga|lungi|loon)\b",  # Hinglish: I'll kill myself
]
_CRISIS_RE = re.compile("|".join(_CRISIS_PATTERNS), re.IGNORECASE)
# What the model would call none even when the words are there.
_DISCUSSION_RE = re.compile(
    r"\b(rate|rates|statistic|statistics|research|essay|story|novel|character|"
    r"history of|article|paper|prevention (programme|program|strategies))\b",
    re.IGNORECASE,
)


def lexical(message: str) -> Assessment:
    """The backstop: a phrase match, softened when the message reads as
    being about the subject rather than from inside it."""
    if not _CRISIS_RE.search(message or ""):
        return NONE
    level = "concern" if _DISCUSSION_RE.search(message) else "crisis"
    return Assessment(level=level, kind="suicide_or_self_harm", by="lexical")


async def assess(message: str, history: list[tuple[str, str]] | None = None) -> Assessment:
    """How worried to be about this message. Never raises."""
    convo = "\n".join(
        f"{'User' if role == 'user' else 'Assistant'}: {(text or '')[:400]}"
        for role, text in (history or [])[-4:]
    )
    input_text = (f"CONVERSATION SO FAR:\n{convo}\n\n" if convo else "") + f"NEWEST MESSAGE:\n{message}"
    try:
        result = await asyncio.wait_for(
            generate_structured(
                instructions=_INSTRUCTIONS,
                input_text=input_text,
                schema=_SCHEMA,
                schema_name="safety_screen",
                fast=True,
            ),
            timeout=_TIMEOUT_SECONDS,
        )
    except Exception:  # noqa: BLE001 - the backstop decides instead
        logger.warning("safety screen unavailable; using the lexical backstop", exc_info=True)
        return lexical(message)
    level = result.get("level") if result.get("level") in LEVELS else "none"
    kind = result.get("kind") if result.get("kind") in KINDS else "none"
    if level == "none":
        # The model is the primary judge, but a crisis phrase it waved
        # through is worth a second look - it does occasionally read a plain
        # statement as a figure of speech.
        backstop = lexical(message)
        if backstop.crisis:
            return Assessment(level="concern", kind=backstop.kind, by="lexical")
        return NONE
    return Assessment(level=level, kind=kind if kind != "none" else "distress", by="model")


_KIND_WORDS = {
    "suicide_or_self_harm": "thoughts of suicide or self-harm",
    "harm_to_others": "a risk of harming someone else",
    "abuse_or_violence": "being harmed, threatened or unsafe",
    "medical_emergency": "a medical emergency",
    "someone_else_at_risk": "fear for someone else's safety",
    "distress": "significant distress",
}


def prompt_block(assessment: Assessment, resources: CrisisResources) -> str | None:
    """What the model is told when a message is flagged. None when it is not."""
    if not assessment.flagged:
        return None
    numbers = resources.prompt_lines() or (
        "- No verified number for their location: tell them to call their local "
        "emergency number, and that findahelpline.com lists free, confidential "
        "helplines by country."
    )
    about = _KIND_WORDS.get(assessment.kind, "significant distress")
    if assessment.crisis and assessment.kind == "medical_emergency":
        # Someone with chest pain needs one instruction, not a conversation.
        return (
            "SAFETY - this comes before everything else in this answer. The "
            "message describes what may be a medical emergency happening now.\n"
            "- The first sentence tells them to call for an ambulance now, with the "
            "number, exactly as written here - never invent, alter or add a number:\n"
            f"{numbers}\n"
            "  Where an ambulance number is listed separately, that is the one.\n"
            "- Then at most three short lines on what to do while they wait (stop "
            "and sit or lie down, unlock the door, do not drive themselves, have "
            "someone stay with them) - general first-aid steps only, no "
            "medicines and no doses.\n"
            "- Nothing else: no explanation of causes, no list of possibilities, no "
            "questions before the instruction. Everything else can wait until they "
            "are safe."
        )
    if assessment.crisis:
        return (
            f"SAFETY - this comes before everything else in this answer. The "
            f"message suggests {about}, possibly right now.\n"
            "Respond to the person first and the question second:\n"
            "- Open with care in plain words: say what you heard, and ask directly "
            "whether they are safe right now. Where suicide is possible, asking "
            "about it directly is right - it does not put the idea there.\n"
            "- Give these numbers exactly as written - never invent, alter or add "
            "a number:\n"
            f"{numbers}\n"
            "  Where an ambulance number is listed separately, it is the one for a "
            "medical emergency or self-harm; the general emergency number may be "
            "the police.\n"
            "- Urge them to contact someone now - one of those numbers, or a person "
            "they trust who can be with them - and to put distance between "
            "themselves and anything they could use to hurt themselves.\n"
            "- Stay with them: keep the conversation open, do not end it, do not "
            "lecture, do not change the subject, no lists of tips.\n"
            "- Never give information about methods, doses, lethality or how to "
            "hide harm - no thresholds or amounts, not even as general facts.\n"
            "- If the danger comes from someone else, their immediate safety and "
            "the numbers come first.\n"
            "Write it short and human: a crux of one warm sentence, then a few "
            "short paragraphs. No claim tags and no citation markers in this "
            "answer - it is not fact-checked, it is a person being looked after."
        )
    return (
        f"SAFETY - the message suggests {about}. Begin with them, not with advice: "
        "acknowledge in plain words how they seem to be doing. Then answer what they "
        "asked, check in gently, and mention - once, without alarm - that support is "
        "there if they want it:\n"
        f"{numbers}\n"
        "Give those numbers exactly as written; never invent or alter one. Never "
        "give information that could be used to self-harm: no lethal, toxic or "
        "overdose doses, thresholds or amounts, and no methods or means - not even "
        "as general facts or medical reference. If that is what was asked, say "
        "plainly that you won't share it, and ask how they are."
    )


def card(assessment: Assessment, resources: CrisisResources) -> dict | None:
    """The support card the client shows above the answer: the same verified
    numbers the model was given, so they are right even if the prose is not.
    Stored on the assistant's message so it is still there on reload."""
    if not assessment.flagged:
        return None
    return {
        "level": assessment.level,
        "kind": assessment.kind,
        "country": resources.country,
        "resources": [asdict(r) for r in resources.entries],
        "fallback_url": "https://findahelpline.com",
    }


#: The formatting rules a crisis reply is written to, in place of the claim
#: rulebook - nothing in it is scored, so the markup would only be noise.
CRISIS_FORMATTING_RULES = (
    "Before anything else, write ONE warm sentence - at most 30 words - wrapped as "
    "<crux>...</crux>; the reader sees it on its own. Then at most three short, "
    "plain paragraphs - this is read by someone who may need to act now, so "
    "nothing in it may stand between them and the call. No claim tags, no citation markers, no headings, no tables. "
    "Use hyphens, never em dashes. If you list the numbers, use hyphen bullets."
)


def call_block(resources: CrisisResources) -> str:
    """The floor for a live voice call, which runs without the per-turn
    screen: what to do if the caller turns out to be in danger, with the
    numbers to say."""
    numbers = resources.prompt_lines() or (
        "- No verified number for their location: tell them to call their local "
        "emergency number."
    )
    return (
        "If at any point the caller seems to be in danger - thinking of ending "
        "their life or hurting themselves, being hurt by someone, or a medical "
        "emergency - stop everything else. Say what you heard, ask plainly whether "
        "they are safe right now, and give them the number to call, exactly as "
        "written here and never another:\n"
        f"{numbers}\n"
        "Where an ambulance number is listed separately, it is the one for a "
        "medical emergency or self-harm. "
        "Stay with them on the call, keep it calm and short, and never give "
        "information about methods or doses. You are an AI, not a therapist, "
        "doctor or crisis service, and if they ask, say so."
    )


def for_turn(country: str | None, subdivision: str | None = None) -> CrisisResources:
    """The numbers for where the person is (re-exported for the routes)."""
    return crisis_resources(country, subdivision)
