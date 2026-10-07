"""Send one generation to whichever provider the chosen model belongs to.

Only reached when the user picked a model in Learning or Co-Creative. Every
other turn goes through `anthropic_client.stream_generation`, which has its
own OpenAI fallback - that fallback is deliberately not applied here. If
somebody asked for Grok, silently answering as Claude would be worse than
saying the model is unavailable.
"""

from collections.abc import AsyncIterator

from app.services import extra_providers
from app.services.anthropic_client import flatten_instructions
from app.services.anthropic_client import stream_generation as stream_anthropic
from app.services.model_catalog import SelectableModel
from app.services.openai_client import stream_generation as stream_openai


async def stream_for(
    model: SelectableModel,
    *,
    instructions: str | list[dict],
    input_text: str,
    input_images: list[str] | None = None,
) -> AsyncIterator[dict]:
    if model.provider == "anthropic":
        async for event in stream_anthropic(
            instructions=instructions,
            input_text=input_text,
            model=model.model_id,
            input_images=input_images,
        ):
            yield event
        return

    # Everything past here takes a plain string: the cache-breakpoint block
    # list is Anthropic's shape.
    flat = flatten_instructions(instructions)

    if model.provider == "openai":
        async for event in stream_openai(
            instructions=flat,
            input_text=input_text,
            model=model.model_id,
            input_images=input_images,
        ):
            yield event
        return

    if model.provider == "google":
        async for event in extra_providers.stream_google(
            instructions=flat, input_text=input_text, model=model.model_id
        ):
            yield event
        return

    if model.provider == "xai":
        async for event in extra_providers.stream_xai(
            instructions=flat, input_text=input_text, model=model.model_id
        ):
            yield event
        return

    raise RuntimeError(f"No client for provider {model.provider!r}")
