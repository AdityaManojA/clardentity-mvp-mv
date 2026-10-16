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

from app.services.user_location import get_located_user
from app.db.session import get_db
from app.models import Conversation, Message, User, WorkspaceMember
from app.services.regulations import HealthProfile, crisis_resources, profile_for

router = APIRouter(prefix="/healthcare", tags=["healthcare"])

#: Bump when the consent text changes in substance; everyone is asked again.
#: 2026-10-17: names the processors and where each one is, says withdrawing
#: deletes, and gives the grievance and complaint routes (India's SPDI Rules
#: r.5 and DPDP Rule 3 ask for all of it).
CONSENT_VERSION = "2026-10-17"

#: Where grievances go - published in the privacy policy as well.
CONTACT = "hello@clardentity.ai"

#: The languages the consent card can be read in, beyond English. India's
#: DPDP Act s.5(3) asks that the notice be available in English or any
#: Eighth Schedule language; Hindi first.
NOTICE_LANGUAGES = {"IN": ("en", "hi")}

#: What the consent is for, recorded with it.
PURPOSES = ("answering your Healthcare questions", "keeping the Healthcare chats you choose to keep")


def _copy_en(profile: HealthProfile, emergency: str | None, demo: bool = False) -> dict:
    complaints = profile.complaints_to or "your data protection authority"
    if demo:
        where = (
            "Our AI providers, Anthropic and OpenAI, process it in the United States, "
            "through our servers in Singapore."
        )
        storage = (
            "In this demo nothing is kept: the conversation lives in your browser, ends "
            "when you close it, and is not carried into an account if you sign up."
        )
    elif profile.storage == "transient":
        where = (
            "Our AI providers, Anthropic and OpenAI, process it in the United States, "
            "through our servers in Singapore."
        )
        storage = (
            f"In {profile.place}, Healthcare chats are not saved: each one runs as a "
            "temporary chat and is deleted when you leave it."
            + (f" ({profile.storage_reason})" if profile.storage_reason else "")
        )
    else:
        where = (
            "Our AI providers, Anthropic and OpenAI, process it in the United States; "
            "our servers are in Singapore, and the Healthcare chats you keep are stored "
            "in our database in South Korea."
        )
        storage = (
            "Healthcare chats stay in your history until you delete them. Withdrawing "
            "consent stops Healthcare and deletes them."
        )
    return {
        "eyebrow": "Before Healthcare answers",
        "title": f"Your health information, under the rules for {profile.place}",
        "points": [
            "What you type and attach in Healthcare - symptoms, test results, medicines, "
            "anything you share - is used only to answer you.",
            where,
            storage,
            "Never used to build your profile, for advertising or to train AI models, and "
            "our analytics never record what you asked.",
            "You can withdraw this in Settings at any time, ask to see or delete your data, "
            f"or raise a concern with us at {CONTACT}. If we don't resolve it, you can "
            f"complain to {complaints}.",
            "Healthcare gives general health information, not diagnosis or treatment, and it "
            "can be wrong."
            + (f" In an emergency, call {emergency}." if emergency
               else " In an emergency, call your local emergency number."),
        ],
        "given_under": "Given under",
        "age_label": (
            f"I am {profile.consent_age} or older, and I agree to Healthcare using my "
            "health information as described."
        ),
        "agree": "I agree",
        "decline": "Not now",
        "footer": "You can withdraw this any time in Settings.",
    }


def _copy_hi(profile: HealthProfile, emergency: str | None, demo: bool = False) -> dict:
    """The same notice in Hindi - India only, so the place is always India."""
    if demo:
        where = (
            "हमारे AI प्रदाता, Anthropic और OpenAI, इसे अमेरिका में प्रोसेस करते हैं, "
            "सिंगापुर में हमारे सर्वरों के ज़रिए।"
        )
        storage = (
            "इस डेमो में कुछ भी सहेजा नहीं जाता: बातचीत सिर्फ़ आपके ब्राउज़र में रहती है, "
            "उसे बंद करते ही ख़त्म हो जाती है, और साइन अप करने पर आपके अकाउंट में नहीं जाती।"
        )
    elif profile.storage == "transient":
        where = (
            "हमारे AI प्रदाता, Anthropic और OpenAI, इसे अमेरिका में प्रोसेस करते हैं, "
            "सिंगापुर में हमारे सर्वरों के ज़रिए।"
        )
        storage = (
            "भारत में Healthcare चैट सहेजी नहीं जातीं: हर चैट अस्थायी होती है और "
            "आपके उसे छोड़ते ही मिट जाती है।"
        )
    else:
        where = (
            "हमारे AI प्रदाता, Anthropic और OpenAI, इसे अमेरिका में प्रोसेस करते हैं; "
            "हमारे सर्वर सिंगापुर में हैं, और आप जो Healthcare चैट रखते हैं वे दक्षिण "
            "कोरिया में हमारे डेटाबेस में सहेजी जाती हैं।"
        )
        storage = (
            "Healthcare चैट आपकी हिस्ट्री में तब तक रहती हैं जब तक आप उन्हें मिटा न दें। "
            "सहमति वापस लेने पर Healthcare बंद हो जाता है और वे चैट मिट जाती हैं।"
        )
    return {
        "eyebrow": "Healthcare जवाब देने से पहले",
        "title": "आपकी स्वास्थ्य जानकारी, भारत के नियमों के तहत",
        "points": [
            "Healthcare में आप जो लिखते या जोड़ते हैं - लक्षण, जाँच के नतीजे, दवाइयाँ, "
            "या और कुछ भी - उसका इस्तेमाल सिर्फ़ आपको जवाब देने के लिए होता है।",
            where,
            storage,
            "इसका इस्तेमाल कभी आपकी प्रोफ़ाइल बनाने, विज्ञापन या AI मॉडल को प्रशिक्षित "
            "करने के लिए नहीं होता, और हमारे एनालिटिक्स कभी दर्ज नहीं करते कि आपने क्या पूछा।",
            "आप कभी भी सेटिंग्स में यह सहमति वापस ले सकते हैं, अपना डेटा देखने या मिटाने "
            f"को कह सकते हैं, या {CONTACT} पर हमसे शिकायत कर सकते हैं। अगर हम उसे हल न "
            "करें, तो आप भारत के डेटा संरक्षण बोर्ड (Data Protection Board of India) से "
            "शिकायत कर सकते हैं।",
            "Healthcare सामान्य स्वास्थ्य जानकारी देता है, निदान या इलाज नहीं, और यह "
            "ग़लत भी हो सकता है।"
            + (f" आपातकाल में {emergency} पर कॉल करें।" if emergency
               else " आपातकाल में अपने स्थानीय आपातकालीन नंबर पर कॉल करें।"),
        ],
        "given_under": "लागू कानून:",
        "age_label": (
            f"मेरी उम्र {profile.consent_age} साल या उससे ज़्यादा है, और मैं सहमत हूँ कि "
            "Healthcare ऊपर बताए अनुसार मेरी स्वास्थ्य जानकारी का इस्तेमाल करे।"
        ),
        "agree": "मैं सहमत हूँ",
        "decline": "अभी नहीं",
        "footer": "आप इसे कभी भी सेटिंग्स में वापस ले सकते हैं।",
    }


_COPY = {"en": _copy_en, "hi": _copy_hi}


def notice_languages(country: str | None) -> tuple[str, ...]:
    return NOTICE_LANGUAGES.get((country or "").upper(), ("en",))


def consent_points(profile: HealthProfile, emergency: str | None) -> list[str]:
    """The plain-language terms in English, built from the profile so the
    card says exactly what the server will do."""
    return _copy_en(profile, emergency)["points"]


def consent_state(
    country: str | None, subdivision: str | None, given: dict | None = None, *, demo: bool = False
) -> dict:
    """The consent card's contents for a location - shared by the app and the
    visitor demo, so both ask for exactly the same thing."""
    profile = profile_for(country, subdivision)
    resources = crisis_resources(country, subdivision)
    emergency = resources.number("emergency")
    given = given or {}
    current = given.get("version") == CONSENT_VERSION
    languages = notice_languages(country)
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
        "points": _copy_en(profile, emergency, demo)["points"],
        "languages": list(languages),
        "copy": {lang: _COPY[lang](profile, emergency, demo) for lang in languages},
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
    #: The language the notice was read in, recorded with the consent.
    language: str = "en"


class WithdrawIn(BaseModel):
    #: Ignored since 2026-10-16 and kept so an older client still works:
    #: withdrawing always deletes. India's DPDP Act (s.6(6), s.8(7)) and GDPR
    #: Art. 17(1)(b) both expect data held on consent to be erased when the
    #: consent goes, and "withdraw but keep" was a choice the law does not
    #: really offer.
    delete_conversations: bool = True


@router.get("/consent")
async def get_consent(current_user: User = Depends(get_located_user)) -> dict:
    return _state(current_user)


@router.post("/consent")
async def give_consent(
    payload: ConsentIn,
    current_user: User = Depends(get_located_user),
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
    # The record India's DPDP Act s.6(10) puts the burden of proof on: what
    # was agreed to, when, where, in which language and for what.
    user.health_consent = {
        "version": CONSENT_VERSION,
        "at": datetime.now(UTC).isoformat(),
        "jurisdiction": profile.jurisdiction,
        "consent_age": profile.consent_age,
        "age_confirmed": True,
        "language": payload.language
        if payload.language in notice_languages(current_user.location_country)
        else "en",
        "purposes": list(PURPOSES),
    }
    await db.commit()
    await db.refresh(user)
    return _state(user)


@router.post("/consent/withdraw")
async def withdraw_consent(
    payload: WithdrawIn | None = None,
    current_user: User = Depends(get_located_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    user = await db.get(User, current_user.id)
    user.health_consent = None
    # Every chat with a Healthcare message in it, whole: a conversation is one
    # thread, and cutting the health turns out of the middle would leave the
    # rest answering nothing.
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
