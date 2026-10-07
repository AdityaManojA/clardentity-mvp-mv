"""The models a user may pick from, in the two modes where picking is theirs.

Everywhere else Clardentity chooses, and says nothing about what it chose:
the identity rules forbid naming the model, the vendor or the version, and
the composer's own picker is named by capability (Auto, Clar Pro, Clar Max)
for that reason.

Learning and Co-Creative are the exception, by decision. In those two the
user is picking a tool rather than consulting a companion - "write this with
Opus" is a reasonable thing to want from a co-writer and a strange thing to
want from a mode that is supposed to be a single consistent voice - so the
real names are shown there and the identity rule is relaxed to match. A
product that refuses to name its model while a dropdown three inches away
names it is not protecting anything; it is just contradicting itself.

Availability is by key. A model whose provider has no API key configured is
not listed, so the picker never offers something that fails when chosen -
which is how Google and xAI sat here before their keys arrived.
"""

from dataclasses import dataclass

from app.core.config import settings

#: Only these two modes let the user choose. Named here rather than in the
#: API so the list and the rule that governs it stay together.
PICKABLE_MODES = frozenset({"learning", "creative"})


@dataclass(frozen=True)
class SelectableModel:
    #: Our stable id, sent by the client and stored on the message.
    id: str
    label: str
    vendor: str
    #: Which client talks to it.
    provider: str
    #: The vendor's own id, which is the thing that changes.
    model_id: str
    blurb: str


def _catalog() -> list[SelectableModel]:
    return [
        SelectableModel(
            id="claude-opus-5-5",
            label="Claude Opus 5.5",
            vendor="Anthropic",
            provider="anthropic",
            model_id="claude-opus-5-5",
            blurb="Deepest reasoning. Slower, and worth it on hard problems.",
        ),
        SelectableModel(
            id="claude-sonnet-5-5",
            label="Claude Sonnet 5.5",
            vendor="Anthropic",
            provider="anthropic",
            model_id="claude-sonnet-5-5",
            blurb="Quick and capable. A good default for everyday work.",
        ),
        SelectableModel(
            id="claude-fable-5-1",
            label="Claude Fable 5.1",
            vendor="Anthropic",
            provider="anthropic",
            model_id="claude-fable-5-1",
            blurb="The most capable, and the most expensive. For the hardest asks.",
        ),
        SelectableModel(
            id="claude-haiku-4-5",
            label="Claude Haiku 4.5",
            vendor="Anthropic",
            provider="anthropic",
            model_id="claude-haiku-4-5",
            blurb="Fastest. Best when you want an answer more than a considered one.",
        ),
        SelectableModel(
            id="gpt-5-6-sol",
            label="GPT-5.6 Sol",
            vendor="OpenAI",
            provider="openai",
            model_id="gpt-5.6-sol",
            blurb="Strong general reasoning with a different grain to Claude's.",
        ),
        SelectableModel(
            id="gpt-5-6-terra",
            label="GPT-5.6 Terra",
            vendor="OpenAI",
            provider="openai",
            model_id="gpt-5.6-terra",
            blurb="Steadier and more literal. Good for structure and long drafts.",
        ),
        SelectableModel(
            id="gpt-5-4-mini",
            label="GPT-5.4 mini",
            vendor="OpenAI",
            provider="openai",
            model_id="gpt-5.4-mini",
            blurb="Light and fast, for drafting and iteration.",
        ),
        SelectableModel(
            id="gemini-pro",
            label="Gemini 3 Pro",
            vendor="Google",
            provider="google",
            model_id=settings.google_model,
            blurb="Long context and strong multimodal reading.",
        ),
        SelectableModel(
            id="gemini-flash",
            label="Gemini 3 Flash",
            vendor="Google",
            provider="google",
            model_id=settings.google_fast_model,
            blurb="Google's quick one, for fast turnaround.",
        ),
        SelectableModel(
            id="grok",
            label="Grok 4.7",
            vendor="xAI",
            provider="xai",
            model_id=settings.xai_model,
            blurb="Direct and informal, with a willingness to commit to an answer.",
        ),
    ]


def _has_key(provider: str) -> bool:
    return bool(
        {
            "anthropic": settings.anthropic_api_key,
            "openai": settings.openai_api_key,
            "google": settings.google_api_key,
            "xai": settings.xai_api_key,
        }.get(provider)
    )


def available() -> list[SelectableModel]:
    """Everything this deployment can actually route to, in picker order."""
    return [m for m in _catalog() if _has_key(m.provider)]


def get(model_id: str | None) -> SelectableModel | None:
    """One model by our id, or None - which means "let Clardentity choose",
    and is also what an unknown or unavailable id degrades to. A picker entry
    that has gone away must not fail the turn."""
    if not model_id:
        return None
    for model in available():
        if model.id == model_id:
            return model
    return None


def allows_picking(mode: str) -> bool:
    return mode in PICKABLE_MODES
