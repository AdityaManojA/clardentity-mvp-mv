"""Catching what someone tells you about themselves, when they tell you.

The profile is rebuilt by inference every eight user messages, which is the
right cadence for working out what somebody is like and the wrong one for
"I'm from Thrissur". A fact stated outright is not an inference waiting to
accumulate evidence - it is already true, and the next conversation should
know it. Before this, it sat unused until the eighth message after it, and a
new chat opened knowing nothing.

Two gates in front of the model, because this runs on every turn:

A pattern check first, which is free. Most messages are questions about the
world and say nothing about the person, and there is no point paying a model
to tell us that. Only a message that looks like someone talking about
themselves gets as far as the second gate.

Then the small model, asked for a short list of durable facts. Durable is the
whole test: where they live, what they do, who is in their family, what they
are studying - not what they want right now, which is the question itself and
belongs to the conversation rather than the person.
"""

import logging
import re
import uuid

from app.services.anthropic_client import generate_structured

logger = logging.getLogger("clardentity.stated_facts")

#: How many stated facts one person may accumulate. Past this, the oldest go -
#: a profile is a picture, not a log.
MAX_STATED = 40

#: The marker on an aspect that came from something they said in a chat, as
#: distinct from "user" (typed into the profile editor) and "inferred". Kept
#: separate so a rebuild can preserve both kinds of first-hand statement while
#: still replacing everything inference produced.
SOURCE = "stated"

#: Cheap pre-filter. Deliberately generous - a false positive costs one small
#: model call, a false negative loses a fact - but it still skips the large
#: majority of turns, which are questions about the world.
_SELF_TALK = re.compile(
    r"\b(i\s?am|i'm|im|my|mine|i\s+live|i\s+work|i\s+study|i\s+have|i\s+was|"
    r"i\s+grew\s+up|i\s+moved|we\s+live|call\s+me|me\s+and\s+my)\b",
    re.IGNORECASE,
)

_INSTRUCTIONS = (
    "Extract durable facts the user has just stated about THEMSELVES.\n\n"
    "Durable means it would still be true next month and is about the person: "
    "where they live or are from, their work or study, their family, their "
    "background, long-running situations, stable preferences.\n\n"
    "Not durable, and never extract: what they want right now, the question "
    "they are asking, a hypothetical, something they are considering, "
    "something about another person, or anything they did not say about "
    "themselves. If someone asks 'should I move to Berlin', they do not live "
    "in Berlin.\n\n"
    "Each fact gets a short label (one or two words, like 'Home', 'Work', "
    "'Studying', 'Family') and a short value in their own terms. Return an "
    "empty list when there is nothing durable, which is the common case."
)


def _schema() -> dict:
    return {
        "type": "object",
        "properties": {
            # No maxItems: Anthropic's structured output rejects the whole
            # request with "For 'array' type, property 'maxItems' is not
            # supported". The cap is applied to the parsed list instead.
            "facts": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "label": {"type": "string", "maxLength": 40},
                        "value": {"type": "string", "maxLength": 200},
                    },
                    "required": ["label", "value"],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["facts"],
        "additionalProperties": False,
    }


def looks_like_self_talk(message: str) -> bool:
    """Whether this message is worth asking the model about at all."""
    return bool(message and _SELF_TALK.search(message))


async def extract(message: str) -> list[dict]:
    """Durable facts stated in one message. Never raises - a capture that
    fails is a fact learned later rather than a turn that breaks."""
    if not looks_like_self_talk(message):
        return []
    try:
        result = await generate_structured(
            instructions=_INSTRUCTIONS,
            input_text=message,
            schema=_schema(),
            schema_name="stated_facts",
            fast=True,
        )
    except Exception:  # noqa: BLE001
        logger.warning("stated-fact extraction failed", exc_info=True)
        return []

    facts = []
    for fact in result.get("facts") or []:
        label = str(fact.get("label") or "").strip()
        value = str(fact.get("value") or "").strip()
        if label and value:
            facts.append({"label": label, "value": value})
    return facts[:6]


def merge(existing: list | None, facts: list[dict]) -> list[dict]:
    """Fold newly stated facts into the aspect list.

    Matched on the label, case-insensitively, so moving city updates "Home"
    rather than leaving the profile holding two of them. Facts the user typed
    into the profile editor themselves are never overwritten: they went out of
    their way to put them there, and something said in passing should not
    silently undo that.
    """
    aspects = list(existing or [])
    protected = {
        str(a.get("label") or "").strip().lower()
        for a in aspects
        if a.get("source") == "user"
    }

    for fact in facts:
        key = fact["label"].strip().lower()
        if key in protected:
            continue
        for aspect in aspects:
            if (
                str(aspect.get("label") or "").strip().lower() == key
                and aspect.get("source") == SOURCE
            ):
                aspect["value"] = fact["value"]
                break
        else:
            aspects.append(
                {
                    "id": str(uuid.uuid4()),
                    "label": fact["label"],
                    "value": fact["value"],
                    "source": SOURCE,
                }
            )

    stated = [a for a in aspects if a.get("source") == SOURCE]
    if len(stated) > MAX_STATED:
        drop = {id(a) for a in stated[: len(stated) - MAX_STATED]}
        aspects = [a for a in aspects if id(a) not in drop]
    return aspects
