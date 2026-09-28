"""What a turn cost, in tokens.

`messages.token_usage` has existed since the first schema and nothing ever
wrote to it, so "how much are we spending, and on whom" had no answer at all.
The number that matters is not the generation alone: one answer also pays for
the search plan, the gates, the crux, a verification call per claim, research
on unsupported ones, the reviews and the counterfactual. Counting only the
visible call would have under-reported a Decision turn by more than half.

So the meter is a context variable rather than a return value. Every model
call adds what it used to whatever turn is in scope; the chat route opens one
around a turn and writes the total onto the assistant's message. Calls made
outside a turn (a Celery job, a script) find no meter and cost nothing to
report - the accounting is opt-in by the caller, not bolted onto the client.
"""

from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field


@dataclass
class TurnUsage:
    input_tokens: int = 0
    output_tokens: int = 0
    calls: int = 0
    #: Per-model totals, so a dashboard can separate the flagship writing an
    #: answer from the small model that planned its searches.
    by_model: dict[str, dict[str, int]] = field(default_factory=dict)

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens

    def as_dict(self) -> dict:
        return {
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
            "calls": self.calls,
            "by_model": self.by_model,
        }


_current: ContextVar[TurnUsage | None] = ContextVar("clardentity_turn_usage", default=None)


@contextmanager
def meter():
    """Open a meter for the duration of one turn. Nested meters are not a
    thing here; the innermost wins, which is what a background task started
    inside a turn should want."""
    usage = TurnUsage()
    token = _current.set(usage)
    try:
        yield usage
    finally:
        _current.reset(token)


def record(model: str | None, input_tokens: int, output_tokens: int) -> None:
    """Called by the model clients. Silent when no meter is open."""
    usage = _current.get()
    if usage is None:
        return
    usage.input_tokens += int(input_tokens or 0)
    usage.output_tokens += int(output_tokens or 0)
    usage.calls += 1
    key = model or "unknown"
    bucket = usage.by_model.setdefault(key, {"input_tokens": 0, "output_tokens": 0, "calls": 0})
    bucket["input_tokens"] += int(input_tokens or 0)
    bucket["output_tokens"] += int(output_tokens or 0)
    bucket["calls"] += 1


def current() -> TurnUsage | None:
    return _current.get()
