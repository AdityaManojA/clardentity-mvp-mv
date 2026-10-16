"""Healthcare's consent: asked before the first health conversation, under
the rules of where the person is, recorded, and withdrawable.

Health information is special-category or sensitive data almost everywhere
(GDPR Art. 9, India's DPDP Act, UAE and Saudi PDPLs, Washington's My Health
My Data Act...), and the common denominator is explicit, separate,
withdrawable consent before it is processed. So Healthcare does nothing until
this has been given, the text it was given against is recorded with it, and a
new text version asks again.

What is said here comes from the regulation suite (services/regulations), not
from the client, so the consent card and the rules the chat route enforces
can never disagree.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Conversation, Message, User, WorkspaceMember
from app.services.regulations import HealthProfile, crisis_resources, profile_for

router = APIRouter(prefix="/healthcare", tags=["healthcare"])

#: Bump when the consent text changes in substance; everyone is asked again.
CONSENT_VERSION = "2026-10-16"


def consent_points(profile: HealthProfile, emergency: str | None) -> list[str]:
    """The plain-language terms, built from the profile so the card says
    exactly what the server will do."""
    points = [
        "What you ask and share in Healthcare is used only to answer you.",
        "It is processed by our AI providers on servers in the United States.",
    ]
    if profile.storage == "transient":
        points.append(
            f"In {profile.place}, Healthcare chats are not saved: each one runs as a "
            "temporary chat and is deleted when you leave it."
            + (f" ({profile.storage_reason})" if profile.storage_reason else "")
        )
    else:
        points.append(
            "Healthcare chats are kept in your history until you delete them. "
            "Withdrawing consent stops Healthcare, and you can delete those chats with it."
        )
    points.append(
        "Never used to build your profile, never for advertising, and our "
        "analytics never record what you asked."
    )
    points.append(
        "Healthcare gives general health information, not diagnosis or treatment."
        + (f" In an emergency, call {emergency}." if emergency else " In an emergency, call your local emergency number.")
    )
    return points


def consent_state(
    country: str | None, subdivision: str | None, given: dict | None = None
) -> dict:
    """The consent card's contents for a location - shared by the app and the
    visitor demo, so both ask for exactly the same thing."""
    profile = profile_for(country, subdivision)
    resources = crisis_resources(country, subdivision)
    given = given or {}
    current = given.get("version") == CONSENT_VERSION
    return {
        "version": CONSENT_VERSION,
        "given": bool(given) and current,
        "given_at": given.get("at") if current else None,
        "jurisdiction": {"code": profile.jurisdiction, "name": profile.place},
        "storage": profile.storage,
        "available": profile.storage != "unavailable",
        "storage_reason": profile.storage_reason,
        "consent_age": profile.consent_age,
        "laws": [
            {"name": law.name, "citation": law.citation, "url": law.url} for law in profile.laws[:4]
        ],
        "points": consent_points(profile, resources.number("emergency")),
    }


def _state(user: User) -> dict:
    return consent_state(user.location_country, user.location_subdivision, user.health_consent)


def needs_consent(user: User) -> bool:
    given = user.health_consent or {}
    return given.get("version") != CONSENT_VERSION


class ConsentIn(BaseModel):
    version: str
    #: "I am at least {consent_age}" - the card asks; without it, no consent.
    age_confirmed: bool


class WithdrawIn(BaseModel):
    #: Also delete every chat with a Healthcare message in it - the whole
    #: chat, because a conversation is one thread and cutting the health
    #: turns out of the middle would leave the rest answering nothing.
    delete_conversations: bool = False


@router.get("/consent")
async def get_consent(current_user: User = Depends(get_current_user)) -> dict:
    return _state(current_user)


@router.post("/consent")
async def give_consent(
    payload: ConsentIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    profile = profile_for(current_user.location_country, current_user.location_subdivision)
    if profile.storage == "unavailable":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Healthcare isn't available in {profile.place}.",
        )
    if payload.version != CONSENT_VERSION:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The consent text has changed - please read it again.",
        )
    if not payload.age_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Healthcare is for people aged {profile.consent_age} or over.",
        )
    user = await db.get(User, current_user.id)
    user.health_consent = {
        "version": CONSENT_VERSION,
        "at": datetime.now(UTC).isoformat(),
        "jurisdiction": profile.jurisdiction,
        "consent_age": profile.consent_age,
        "age_confirmed": True,
    }
    await db.commit()
    await db.refresh(user)
    return _state(user)


@router.post("/consent/withdraw")
async def withdraw_consent(
    payload: WithdrawIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    user = await db.get(User, current_user.id)
    user.health_consent = None
    deleted = 0
    if payload.delete_conversations:
        workspace_ids = select(WorkspaceMember.workspace_id).where(
            WorkspaceMember.user_id == current_user.id
        )
        with_health = select(Message.conversation_id).where(Message.mode_used == "healthcare")
        result = await db.execute(
            delete(Conversation)
            .where(
                Conversation.workspace_id.in_(workspace_ids),
                Conversation.id.in_(with_health),
            )
            .returning(Conversation.id)
        )
        deleted = len(result.all())
    await db.commit()
    await db.refresh(user)
    return {**_state(user), "deleted_conversations": deleted}
