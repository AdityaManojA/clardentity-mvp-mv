"""Long-lived user profile: an evolving personality.md plus the role
classification behind it.

Built by inference from the user's own conversations and uploaded documents,
plus whatever they chose to say at first run. The first-run questions are
open-ended and every one can be skipped: they are treated as evidence for the
same inference, not as a form that fills fields directly, so someone who skips
them straight through still gets a profile that grows from real usage - the
original "start immediately and let it learn you over time" goal is intact,
it just also has a head start when the person wants to give it one.

Two rules the rest of the code depends on:
  * A profile the user has edited is never overwritten by inference
    (`user_edited`). A correction that silently reverts is worse than no
    profile at all.
  * Inferred roles are validated against the taxonomy before they are stored,
    so a hallucinated role or a contradictory pair like brother+sister cannot
    reach the profile.
"""

import logging
import uuid

import re
import uuid
from dataclasses import dataclass

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Document, Message, UserProfile, WorkspaceMember
from app.services import stated_facts, taxonomy

logger = logging.getLogger("clardentity.profile")
from app.services.anthropic_client import cached, generate_structured
from app.services.output_cleanup import clean_output

# Enough of the user's own words to characterise them without sending an
# unbounded history to the model on every rebuild.
_MESSAGE_WINDOW = 60
_MESSAGE_CHARS = 12000

# Rebuild only after this many new user messages, so a long conversation
# doesn't trigger a profile rebuild on every turn.
REBUILD_EVERY_N_MESSAGES = 8


@dataclass
class InferredProfile:
    personality_md: str
    aspects: list[dict]
    roles: list[dict]


_INSTRUCTIONS = (
    "You maintain a durable profile of one person, written for that person to read.\n\n"
    "From their own messages and document titles, infer:\n"
    "1. A short markdown profile covering: how they tend to think and decide, the "
    "subjects and domains they return to, their apparent context and constraints, and "
    "how they seem to prefer information delivered. Write it in the second person "
    "(\"You tend to...\"). Be specific to the evidence and brief - a few short sections, "
    "no filler. If the evidence is thin, say so plainly and keep it short rather than "
    "padding with generic statements.\n"
    "2. Which of the life roles below they occupy, based only on what the evidence "
    "actually shows.\n\n"
    "Rules that matter:\n"
    "- Infer only what the evidence supports. Do not guess at gender, age, nationality, "
    "religion, health, or family structure that is not evidenced. An empty roles list is "
    "a correct answer when nothing is clearly indicated.\n"
    "- Never state a sensitive attribute as fact on weak evidence; omit it instead.\n"
    "- For each role, give a short `evidence` phrase quoting or paraphrasing what "
    "indicated it, so the person can check your reasoning.\n\n"
    "Respond with ONLY a JSON object, no markdown fencing:\n"
    '{"personality_md": "...", "roles": [{"role_id": "...", '
    '"qualifiers": {"qualifier_id": ["value"]}, "evidence": "..."}]}\n\n'
    "ROLES:\n"
)


async def gather_evidence(db: AsyncSession, user_id: uuid.UUID) -> tuple[str, int]:
    """The user's own words plus their document titles, and how many of their
    messages exist in total (used to decide when a rebuild is due).
    """
    workspace_ids = (
        select(WorkspaceMember.workspace_id)
        .where(WorkspaceMember.user_id == user_id)
        .scalar_subquery()
    )
    conversation_ids = (
        select(Conversation.id)
        .where(Conversation.workspace_id.in_(workspace_ids))
        .scalar_subquery()
    )

    total = await db.scalar(
        select(func.count())
        .select_from(Message)
        .where(Message.conversation_id.in_(conversation_ids), Message.role == "user")
    )

    rows = await db.execute(
        select(Message.content)
        .where(Message.conversation_id.in_(conversation_ids), Message.role == "user")
        .order_by(desc(Message.created_at))
        .limit(_MESSAGE_WINDOW)
    )
    messages = [c for (c,) in rows.all() if c]

    doc_rows = await db.execute(
        select(Document.filename).where(Document.workspace_id.in_(workspace_ids)).limit(40)
    )
    filenames = [f for (f,) in doc_rows.all() if f]

    parts = []
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))

    # What they told us directly at first run comes first: it is the one part
    # of the evidence they wrote *about themselves*, on purpose, rather than
    # something they happened to ask.
    raw_answers = (profile.onboarding_answers or []) if profile is not None else []
    answered = [
        a for a in raw_answers if isinstance(a, dict) and str(a.get("answer") or "").strip()
    ]
    if answered:
        qa = "\n".join(
            f"Q: {str(a.get('question') or '').strip()}\nA: {str(a.get('answer') or '').strip()}"
            for a in answered
        )
        parts.append(f"WHAT THEY TOLD US ABOUT THEMSELVES WHEN THEY JOINED:\n{qa[:_MESSAGE_CHARS]}")

    # History imported from another assistant, if any. Usually much older than
    # anything here and reads as the backstory.
    if profile is not None and profile.imported_context:
        parts.append(
            f"THEIR EARLIER MESSAGES, IMPORTED FROM {profile.imported_source or 'another assistant'}:\n"
            + profile.imported_context[:_MESSAGE_CHARS]
        )

    if messages:
        # Oldest first reads as a trajectory rather than a reverse-chronological dump.
        joined = "\n".join(f"- {m}" for m in reversed(messages))
        parts.append(f"THEIR MESSAGES:\n{joined[:_MESSAGE_CHARS]}")
    if filenames:
        parts.append("DOCUMENTS THEY UPLOADED:\n" + "\n".join(f"- {f}" for f in filenames))

    return ("\n\n".join(parts), total or 0)


_SCHEMA = {
    "type": "object",
    "properties": {
        "personality_md": {
            "type": "string",
            "description": "The profile itself, as plain prose.",
        },
        "aspects": {
            "type": "array",
            "description": (
                "The same picture broken into separate, individually correctable "
                "facts. One short label and one short value each."
            ),
            "items": {
                "type": "object",
                "properties": {
                    "label": {
                        "type": "string",
                        "description": "Two or three words, e.g. 'Work', 'How they read', 'Current focus'.",
                    },
                    "value": {"type": "string", "description": "One sentence."},
                },
                "required": ["label", "value"],
                "additionalProperties": False,
            },
        },
        "roles": {
            "type": "array",
            "description": "Roles from the role taxonomy that this person occupies.",
            "items": {
                "type": "object",
                "properties": {
                    "role_id": {"type": "string"},
                    "qualifier": {"type": ["string", "null"]},
                    "confidence": {"type": ["number", "null"], "description": "0.0-1.0."},
                    "evidence": {"type": ["string", "null"]},
                },
                "required": ["role_id", "qualifier", "confidence", "evidence"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["personality_md", "aspects", "roles"],
    "additionalProperties": False,
}


async def infer_profile(evidence: str) -> InferredProfile | None:
    """Never raises - a failed inference simply leaves the existing profile alone."""
    if not evidence.strip():
        return None

    try:
        parsed = await generate_structured(
            instructions=cached(_INSTRUCTIONS + taxonomy.role_vocabulary()),
            input_text=evidence,
            schema=_SCHEMA,
            schema_name="user_profile",
        )
    except Exception:
        return None

    personality = parsed.get("personality_md")
    if not isinstance(personality, str) or not personality.strip():
        return None

    roles: list[dict] = []
    seen: set[str] = set()
    for entry in parsed.get("roles") or []:
        if not isinstance(entry, dict):
            continue
        role_id = entry.get("role_id")
        role = taxonomy.get_role(role_id)
        # Anything outside the taxonomy is dropped rather than stored.
        if role is None or role.id in seen:
            continue
        seen.add(role.id)
        roles.append(
            {
                "role_id": role.id,
                "qualifiers": taxonomy.validate_role_selection(
                    role.id, entry.get("qualifiers") or {}
                ),
                "evidence": str(entry.get("evidence") or "")[:300],
            }
        )

    aspects: list[dict] = []
    seen_labels: set[str] = set()
    for entry in parsed.get("aspects") or []:
        if not isinstance(entry, dict):
            continue
        label = clean_output(str(entry.get("label") or ""))[:40]
        value = clean_output(str(entry.get("value") or ""))[:400]
        key = label.lower()
        if not label or not value or key in seen_labels:
            continue
        seen_labels.add(key)
        aspects.append(
            {"id": str(uuid.uuid4()), "label": label, "value": value, "source": "inferred"}
        )

    return InferredProfile(
        personality_md=personality.strip(), aspects=aspects, roles=roles
    )


async def get_profile(db: AsyncSession, user_id: uuid.UUID) -> UserProfile | None:
    return await db.get(UserProfile, user_id)


async def should_rebuild(db: AsyncSession, user_id: uuid.UUID) -> bool:
    profile = await get_profile(db, user_id)
    if profile is not None and profile.user_edited:
        return False
    _, total = await gather_evidence(db, user_id)
    if total == 0:
        return False
    last = profile.messages_at_last_build if profile else 0
    return (total - last) >= REBUILD_EVERY_N_MESSAGES


async def rebuild_profile(db: AsyncSession, user_id: uuid.UUID) -> UserProfile | None:
    """Regenerate and persist. A hand-edited profile is left untouched."""
    profile = await get_profile(db, user_id)
    if profile is not None and profile.user_edited:
        return profile

    evidence, total = await gather_evidence(db, user_id)
    inferred = await infer_profile(evidence)
    if inferred is None:
        return profile

    if profile is None:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    profile.personality_md = inferred.personality_md
    # Anything the user added or edited themselves survives a rebuild -
    # inference replaces only what inference produced. That is the whole
    # reason aspects exist: the old all-or-nothing `user_edited` latch meant
    # one correction froze the entire profile forever.
    # Survives a rebuild: what they typed into the editor, and what they said
    # outright in a conversation. Inference replaces only what inference
    # produced - a sentence like "I'm from Thrissur" is not a guess waiting to
    # be improved on.
    kept = [a for a in (profile.aspects or []) if a.get("source") in {"user", "stated"}]
    profile.aspects = kept + inferred.aspects
    profile.roles = inferred.roles
    profile.messages_at_last_build = total
    await db.commit()
    await db.refresh(profile)
    return profile


def profile_prompt_block(profile: UserProfile | None) -> str | None:
    """Compact profile context for the generation prompt.

    Deliberately framed as background that may be stale or wrong, so the model
    adapts tone and framing to the person without treating inferences about
    them as established fact.
    """
    if profile is None:
        return None

    lines = [
        "ABOUT THIS USER (accumulated from earlier sessions; background only - it may "
        "be incomplete or out of date, so never assert it back to them as fact and "
        "never let it override what they say now):"
    ]

    if profile.personality_md:
        lines.append(profile.personality_md.strip()[:1500])

    # The separate facts, which until now were stored and shown in the profile
    # editor and then never sent anywhere. That made "Add Aspect" a button that
    # wrote to a column nothing read, and it meant anything captured as a fact
    # only reached an answer if it happened to survive into the generated prose
    # on the next rebuild - which is up to eight messages away.
    #
    # The ones the user wrote themselves lead and are marked as such: an
    # inference may be wrong, but something they typed about themselves is the
    # best evidence there is, and the model should weigh it that way.
    aspects = [
        a
        for a in (profile.aspects or [])
        if str(a.get("label") or "").strip() and str(a.get("value") or "").strip()
    ]
    firsthand = {"user", "stated"}
    stated = [a for a in aspects if a.get("source") in firsthand]
    inferred = [a for a in aspects if a.get("source") not in firsthand]
    if stated:
        lines.append(
            "Things they have told you about themselves (their own words - treat as "
            "correct unless they say otherwise):\n"
            + "\n".join(f"- {a['label']}: {a['value']}" for a in stated[:40])
        )
    if inferred:
        lines.append(
            "Things inferred about them (lower confidence):\n"
            + "\n".join(f"- {a['label']}: {a['value']}" for a in inferred[:40])
        )

    labels = []
    for entry in profile.roles or []:
        role = taxonomy.get_role(entry.get("role_id"))
        if role is None:
            continue
        quals = [v for values in (entry.get("qualifiers") or {}).values() for v in values]
        labels.append(f"{role.label} ({', '.join(quals)})" if quals else role.label)
    if labels:
        lines.append("Life roles they appear to occupy: " + "; ".join(labels))

    # Nothing but the heading means nothing worth sending.
    if len(lines) == 1:
        return None
    return "\n\n".join(lines)


async def capture_stated_facts(db: AsyncSession, user_id: uuid.UUID, message: str) -> list[dict]:
    """Fold anything the user just said about themselves into their profile.

    Called once per turn, after the answer has gone out, so the cost is a
    small model call on a request nobody is waiting on. The periodic rebuild
    still does the heavier inference; this exists so that "I'm from Thrissur"
    is known in the next conversation rather than eight messages later.

    Never raises: a fact missed is a fact learned next time, and no part of
    this is worth failing a turn over.
    """
    try:
        facts = await stated_facts.extract(message)
        if not facts:
            return []
        profile = await get_profile(db, user_id)
        if profile is None:
            profile = UserProfile(user_id=user_id)
            db.add(profile)
        profile.aspects = stated_facts.merge(profile.aspects, facts)
        await db.commit()
        return facts
    except Exception:  # noqa: BLE001
        logger.warning("could not capture stated facts", exc_info=True)
        return []
