"""Google and xAI, for the model picker in Learning and Co-Creative.

Written against each vendor's HTTP streaming endpoint rather than their
SDKs, deliberately. Both are a few dozen lines this way, neither adds a
dependency to a deploy whose other two providers are already pinned, and the
shapes they have to produce - this project's delta/done events, and the
token meter behind them - are ours rather than theirs.

Neither had an API key when it was written. That is why every vendor id is a
setting rather than a constant, and why `model_catalog` hides a provider
whose key is missing instead of offering it and failing at the moment
somebody picks it. When the keys arrive, the first thing to check is that
the ids in settings are the ones the account can actually call - that is the
step that caught `dall-e-3` not existing on the image account.

Both of those checks earned their keep on the day the keys landed, and so
did a third nobody planned: the token meter read zero. Both vendors are
thinking models, and neither counts the thinking the way OpenAI's Responses
API does, where `output_tokens` already includes it. Gemini reports
`thoughtsTokenCount` beside `candidatesTokenCount`; xAI reports
`reasoning_tokens` inside `completion_tokens_details` and excludes it from
`completion_tokens`. One Grok answer measured 62 completion tokens against
522 reasoning tokens - counting only the former under-reports the bill by
roughly nine tenths. xAI also omits the usage block from a stream entirely
unless `stream_options.include_usage` asks for it, which is how this was
reading zero rather than merely low.
"""

import json
import logging
from collections.abc import AsyncIterator

import httpx

from app.core.config import settings
from app.services.token_meter import record

logger = logging.getLogger("clardentity.providers")

_TIMEOUT = httpx.Timeout(connect=10.0, read=300.0, write=30.0, pool=10.0)


def _sse_payloads(line: str) -> str | None:
    """One `data:` line's JSON, or None for everything else in the frame."""
    if not line.startswith("data:"):
        return None
    payload = line[5:].strip()
    return None if not payload or payload == "[DONE]" else payload


async def stream_google(
    *, instructions: str, input_text: str, model: str
) -> AsyncIterator[dict]:
    """Gemini, over generativelanguage's SSE endpoint."""
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}"
        ":streamGenerateContent?alt=sse"
    )
    body: dict = {
        "contents": [{"role": "user", "parts": [{"text": input_text}]}],
        "systemInstruction": {"parts": [{"text": instructions}]},
    }
    # Left alone, Flash spent 654 thought tokens on a three-sentence answer
    # and 13s before the first one. Note "thinkingLevel" is accepted and then
    # silently ignored on this model - the budget is the field that bites.
    if settings.google_thinking_budget > 0:
        body["generationConfig"] = {
            "thinkingConfig": {"thinkingBudget": settings.google_thinking_budget}
        }
    full, prompt_tokens, output_tokens = "", 0, 0

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        async with client.stream(
            "POST", url, json=body, headers={"x-goog-api-key": settings.google_api_key}
        ) as response:
            if response.status_code != 200:
                detail = (await response.aread()).decode()[:300]
                raise RuntimeError(f"Gemini refused the request: {response.status_code} {detail}")
            async for line in response.aiter_lines():
                payload = _sse_payloads(line)
                if payload is None:
                    continue
                try:
                    chunk = json.loads(payload)
                except json.JSONDecodeError:
                    continue
                for candidate in chunk.get("candidates") or []:
                    for part in (candidate.get("content") or {}).get("parts") or []:
                        text = part.get("text")
                        if text:
                            full += text
                            yield {"type": "delta", "text": text}
                usage = chunk.get("usageMetadata") or {}
                # Sent on the last chunk; earlier ones repeat the prompt count.
                prompt_tokens = usage.get("promptTokenCount", prompt_tokens)
                # Thinking is billed and is not inside candidatesTokenCount:
                # a three-sentence answer measured 92 against 654 thought
                # tokens, so the visible count is the small half.
                if "candidatesTokenCount" in usage or "thoughtsTokenCount" in usage:
                    output_tokens = usage.get("candidatesTokenCount", 0) + usage.get(
                        "thoughtsTokenCount", 0
                    )

    record(model, prompt_tokens, output_tokens)
    yield {
        "type": "done",
        "full_text": full,
        "input_tokens": prompt_tokens,
        "output_tokens": output_tokens,
    }


async def stream_xai(*, instructions: str, input_text: str, model: str) -> AsyncIterator[dict]:
    """Grok. xAI speaks the OpenAI chat-completions wire format, so this is
    that shape pointed at a different host - not the Responses API the
    OpenAI client here uses, which xAI does not implement."""
    body: dict = {
        "model": model,
        "stream": True,
        # Without this xAI streams no usage block at all, so every Grok turn
        # recorded 0/0 - a silent accounting hole rather than a visible error.
        "stream_options": {"include_usage": True},
        "messages": [
            {"role": "system", "content": instructions},
            {"role": "user", "content": input_text},
        ],
    }
    # 93s to the first token without this, which is not a chat experience.
    if settings.xai_reasoning_effort:
        body["reasoning_effort"] = settings.xai_reasoning_effort
    full, prompt_tokens, output_tokens = "", 0, 0

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        async with client.stream(
            "POST",
            f"{settings.xai_base_url.rstrip('/')}/chat/completions",
            json=body,
            headers={"Authorization": f"Bearer {settings.xai_api_key}"},
        ) as response:
            if response.status_code != 200:
                detail = (await response.aread()).decode()[:300]
                raise RuntimeError(f"xAI refused the request: {response.status_code} {detail}")
            async for line in response.aiter_lines():
                payload = _sse_payloads(line)
                if payload is None:
                    continue
                try:
                    chunk = json.loads(payload)
                except json.JSONDecodeError:
                    continue
                for choice in chunk.get("choices") or []:
                    text = (choice.get("delta") or {}).get("content")
                    if text:
                        full += text
                        yield {"type": "delta", "text": text}
                usage = chunk.get("usage") or {}
                if usage:
                    prompt_tokens = usage.get("prompt_tokens", prompt_tokens)
                    # completion_tokens excludes reasoning here, unlike
                    # OpenAI's Responses API where output_tokens contains it.
                    reasoning = (usage.get("completion_tokens_details") or {}).get(
                        "reasoning_tokens", 0
                    )
                    output_tokens = usage.get("completion_tokens", 0) + reasoning

    record(model, prompt_tokens, output_tokens)
    yield {
        "type": "done",
        "full_text": full,
        "input_tokens": prompt_tokens,
        "output_tokens": output_tokens,
    }
