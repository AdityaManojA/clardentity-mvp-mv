"""Live call: ephemeral credentials for the browser's WebRTC session.

The browser talks to OpenAI's realtime endpoint directly - audio has to go
peer-to-peer or the latency makes it a walkie-talkie - which means something
has to authenticate from the client. That something is never our API key. This
endpoint mints a short-lived client secret scoped to a single session, so the
worst case for a leaked token is somebody else's minutes on one call, not our
account.

The call is deliberately outside the claim-scoring pipeline. Retrieval,
verification and per-claim scoring take seconds, which is fine behind a
streaming answer and fatal between conversational turns. What the caller gets
instead is the companion's voice and judgement without the citations - so the
instructions below tell it to be explicit about uncertainty rather than
implying a rigour the call is not doing.
"""

import logging
import re

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.rate_limit import check_rate_limit
from app.db.session import get_db
from app.models import User
from app.services.profile_service import get_profile, profile_prompt_block
from app.services.prompt_builder import IDENTITY

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/realtime", tags=["realtime"])

_CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets"

_CALL_INSTRUCTIONS = (
    f"{IDENTITY}\n\n"
    "You are on a live voice call with the user. This is speech, not writing:\n"
    "- Keep turns short. Two or three sentences, then let them back in. Nobody "
    "wants a paragraph read aloud at them.\n"
    "- Talk the way people talk - contractions, plain words, no headings, no "
    "bullet points, no numbered lists, no markdown. None of that survives being "
    "spoken.\n"
    "- Never read out URLs, citation markers or file names.\n"
    "- On this call you are answering from your own knowledge, without checking "
    "the user's documents or searching the web. So when something is uncertain, "
    "outside what you know, or the sort of claim that deserves a source, say so "
    "plainly and suggest they ask in the chat where you can cite it. Do not "
    "invent specifics - numbers, dates, quotes, studies - to sound fluent.\n"
    "- If they interrupt you, stop and listen."
)

# BCP-47 and IANA zone names, loosely: letters, digits, hyphens, underscores
# and slashes. Anything else is not a locale and is not going into a prompt.
_TAG = re.compile(r"^[A-Za-z0-9_/+-]{2,64}$")


class CallContext(BaseModel):
    """What the browser knows about where it is. All optional - a call must
    start without it."""

    timezone: str | None = Field(default=None, max_length=64)
    languages: list[str] = Field(default_factory=list, max_length=6)


def _clean(values: list[str]) -> list[str]:
    out: list[str] = []
    for value in values:
        tag = (value or "").strip()
        if _TAG.match(tag) and tag not in out:
            out.append(tag)
    return out


def _accent_instructions(user: User, context: CallContext) -> str | None:
    """Tell the voice where it is speaking from.

    The realtime voices are trained overwhelmingly on American English, and
    left alone they carry that accent into every other language - which is
    why Clardentity speaking Malayalam sounded like an American speaking
    Malayalam rather than like someone from Kerala. The model will follow an
    instruction about accent; it just has to be given one.

    Three signals, best first. What the device says, because that is the
    user's own setting and names the language and the region together
    ("ml-IN"). Then its timezone. Then the place we inferred from the address
    they signed in from, which is stored already and is the weakest of the
    three - a VPN or a mobile carrier makes it confidently wrong.
    """
    languages = _clean(context.languages)
    timezone = context.timezone if context.timezone and _TAG.match(context.timezone) else None
    # The IP-derived location, from the same background refresh the chat uses.
    place = user.location_label
    zone = timezone or user.location_timezone

    facts: list[str] = []
    if languages:
        facts.append(
            "their device is set to these languages, most preferred first: "
            + ", ".join(languages)
        )
    if place:
        facts.append(f"they appear to be in {place}")
    if zone:
        facts.append(f"their clock is on {zone}")
    if not facts:
        return None

    return (
        "\n\nWhere they are, and how to sound:\n"
        f"- As far as we can tell, {'; '.join(facts)}. Every part of that is "
        "inferred and may be wrong - never assert it back to them, and drop it "
        "the moment they say otherwise.\n"
        "- Speak with the accent of that place. If they speak to you in a "
        "regional language, answer in it the way someone from that region "
        "speaks it - their rhythm, their stress, their vowels, the words they "
        "would actually use - not with an American or British accent laid over "
        "it. The same goes for English: use the local variety of it rather than "
        "a neutral American one.\n"
        "- Follow them if they switch language or mix two together mid-sentence, "
        "which is normal in most of the world. Match what they are doing rather "
        "than correcting it.\n"
        "- This is about accent and wording only. It must not change what you "
        "think is true, what you are willing to say, or how carefully you hedge."
    )


@router.post("/session", status_code=status.HTTP_201_CREATED)
async def create_realtime_session(
    context: CallContext | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """A single-use client secret for one call.

    Rate limited per user rather than per IP: this is the expensive endpoint in
    the app, and the thing worth limiting is one account opening calls in a
    loop, not an office sharing an address.
    """
    await check_rate_limit(
        f"realtime:session:{current_user.id}", max_requests=20, window_seconds=3600
    )

    accent = _accent_instructions(current_user, context or CallContext())

    # Who it is talking to. The call used to carry the mode instructions and
    # the accent and nothing else, so a companion that knew where someone
    # lived in text had never heard of them on the phone - the one surface
    # where "do you remember me?" is the obvious first question.
    profile = profile_prompt_block(await get_profile(db, current_user.id))

    payload = {
        "session": {
            "type": "realtime",
            "model": settings.openai_realtime_model,
            "instructions": _CALL_INSTRUCTIONS
            + (accent or "")
            + (f"\n\n{profile}" if profile else ""),
            "output_modalities": ["audio"],
            "audio": {
                "input": {
                    # Semantic VAD decides the user has finished a *thought*
                    # rather than merely gone quiet, which is the difference
                    # between being interrupted mid-sentence and being heard.
                    "turn_detection": {"type": "semantic_vad"},
                    # Off by default, which is why saved calls were one-sided:
                    # without it the API never emits
                    # conversation.item.input_audio_transcription.completed,
                    # so the model heard the user perfectly and we had no text
                    # for anything they said.
                    "transcription": {"model": settings.openai_stt_model},
                },
                "output": {"voice": settings.openai_realtime_voice},
            },
        }
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                _CLIENT_SECRETS_URL,
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                    # Lets OpenAI attribute abuse to one account without us
                    # handing over an email address.
                    "OpenAI-Safety-Identifier": str(current_user.id),
                },
                json=payload,
            )
    except Exception:
        logger.exception("realtime session request failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not start the call. Try again in a moment.",
        ) from None

    if response.status_code >= 400:
        # The upstream body can name the model and the account; it goes to our
        # logs, never to the caller.
        logger.warning(
            "realtime session rejected",
            extra={"status": response.status_code, "body": response.text[:400]},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not start the call. Try again in a moment.",
        )

    data = response.json()
    # Response shape has moved around across revisions of this API; accept the
    # documented `value` and the older top-level `client_secret.value`.
    secret = data.get("value") or (data.get("client_secret") or {}).get("value")
    if not secret:
        logger.error("realtime session returned no client secret", extra={"keys": list(data)})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not start the call. Try again in a moment.",
        )

    # Only the ephemeral secret and what the browser needs to dial. The model
    # name is deliberately not returned - the client has no use for it, and the
    # identity rules say we do not publish it.
    return {"client_secret": secret, "expires_at": data.get("expires_at")}
