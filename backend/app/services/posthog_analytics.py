"""Product analytics, read back from PostHog for the admin panel.

Where the numbers live, and why they stay there. Two stores answer two
different questions:

- Our own database holds everything the server did - every account, every
  question, mode, token and piece of feedback - for everyone, consent or not.
  The admin overview reads that, and it is the authority on usage and cost.
- PostHog holds what only the browser sees - the visitor demo's funnel, the
  gates people skip, locked companions tapped, tours - and only for visitors
  who allowed analytics. The privacy policy says it lives in PostHog's EU
  region for up to a year, so it is read from there rather than copied here:
  a second copy would be a second place to honour consent withdrawal and
  retention, and a second processor the policy does not name.

Everything here is read-only by construction: PostHog's query endpoint runs
HogQL, which has no statements that write. Answers are cached in Redis for a
few minutes, because the endpoint allows three queries at a time per project
and an admin pressing Refresh should not spend them.

Nothing PostHog holds carries content (see frontend/lib/analytics.ts), so the
catalogue below is the whole of what can be asked: event names and the
enumerated properties each one carries.
"""

import hashlib
import json
import logging
from dataclasses import dataclass

import httpx
import redis.asyncio as redis

from app.core.config import settings

logger = logging.getLogger("clardentity.posthog")

_redis = redis.from_url(settings.redis_url)

CACHE_SECONDS = 300
_TIMEOUT_SECONDS = 25

#: Every event the app sends, with the properties it carries. Kept in step
#: with the AnalyticsEvent union in frontend/lib/analytics.ts; this is what
#: the admin panel's "ask for a view" is told it may query.
EVENT_CATALOG: dict[str, str] = {
    "app_opened": "a visit began; viewport ('phone'|'tablet'|'desktop'), installed (bool)",
    "$pageview": "a screen was shown; pattern (route pattern such as '/chat/[id]', never the URL)",
    "signed_in": "a signed-in session was identified (distinct_id is then the account id)",
    "question_asked": "a question was sent in the app; mode, attachments (count), documents (count), follow_up (bool), smart_switching (bool)",
    "gist_shown": "the answer's gist appeared; mode, after (seconds bucket)",
    "answer_shown": "the full answer arrived; mode, after (seconds bucket)",
    "answer_failed": "an answer failed; mode, after",
    "stream_dropped": "the connection dropped mid-answer",
    "mode_picked": "a companion was picked by hand; mode",
    "model_picked": "a Co-Creative model was picked; mode, model",
    "learning_role_set": "Learning role chosen; role ('student'|'teacher')",
    "mode_switched_automatically": "smart switching moved a question; from, to",
    "mode_switch_reverted": "the user went back after a switch; to, via",
    "quick_answer_tapped": "Quick answer pressed while waiting; mode",
    "attachment_added": "a file was attached; kind, extension, size_kb, via ('picker'|'paste'|'drop')",
    "document_uploaded": "a workspace document was uploaded; extension, size_kb",
    "voice_recorded": "dictation used; words (count)",
    "call_started": "a live call started",
    "completion_accepted": "a suggested completion was accepted; words",
    "gate_shown": "a question about the question appeared before answering; kind ('context'|'refine'|'options'|'mode'), mode, suggested",
    "locked_mode_tapped": "a paid companion was tapped while locked; mode, via",
    "plans_opened": "the plans dialog was opened; via",
    "preview_opened": "preview access to the paid companions was turned on",
    "feedback_given": "'Was this helpful?' answered; rating",
    "answer_regenerated": "an answer was regenerated; mode",
    "counterfactual_flipped": "Devil's Draft was flipped",
    "answer_listened": "an answer was played aloud",
    "conversation_exported": "a conversation was exported",
    "chat_renamed": "a chat was renamed",
    "chat_pinned": "a chat was pinned or unpinned; pinned (bool)",
    "chat_moved": "a chat was moved to another workspace",
    "chat_deleted": "a chat was deleted",
    "tour_started": "a guided tour started; tour, replayed (bool)",
    "tour_finished": "a guided tour ended; tour, outcome, at_step",
    "accent_picked": "accent colour changed; accent",
    "theme_picked": "light/dark changed; theme",
    "consent_choice": "the analytics banner was answered; choice",
    "guest_demo_opened": "the visitor demo on the landing page was opened; mode",
    "guest_demo_asked": "a visitor asked the demo a question; mode",
    "guest_demo_mode_picked": "a visitor picked a companion in the demo; mode",
    "guest_demo_mode_switched": "the demo moved a visitor's question to another companion; from, to",
    "guest_demo_gated": "a visitor reached for an account-only control in the demo; feature",
    "guest_demo_limit": "a visitor used up the demo's allowance",
    "guest_demo_new_chat": "a visitor started a new demo chat",
    "guest_demo_signup_clicked": "a visitor clicked through to sign up from the demo; from",
}

HOGQL_NOTE = (
    "events(event, distinct_id, timestamp, properties.<name>) - one row per event.\n"
    "distinct_id is the account's UUID for a signed-in visitor (the same id as users.id "
    "in the database), otherwise an anonymous id. Every row comes from a visitor who "
    "allowed analytics; nothing holds what anyone wrote.\n"
    "Events and their properties:\n"
    + "\n".join(f"- {name}: {meaning}" for name, meaning in EVENT_CATALOG.items())
)


class AnalyticsUnavailable(Exception):
    """PostHog could not answer - not connected, refused, rate-limited or down.
    The message is meant for the admin reading the panel."""


def configured() -> bool:
    return bool(settings.posthog_project_id and settings.posthog_query_key)


async def run_hogql(query: str, *, name: str) -> tuple[list[str], list[list]]:
    """Run one HogQL query and return (columns, rows). Cached by query text."""
    if not configured():
        raise AnalyticsUnavailable("Analytics is not connected (no PostHog query key on the server).")

    cache_key = "posthog:query:" + hashlib.sha256(query.encode()).hexdigest()
    try:
        cached = await _redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            return data["columns"], data["rows"]
    except Exception:  # noqa: BLE001 - a cache that is down is a slower page, not an error
        logger.warning("analytics cache unavailable on read", exc_info=True)

    url = f"{settings.posthog_api_host.rstrip('/')}/api/projects/{settings.posthog_project_id}/query/"
    body = {"query": {"kind": "HogQLQuery", "query": query}, "name": f"clardentity admin: {name}"[:120]}
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
            res = await client.post(
                url, json=body, headers={"Authorization": f"Bearer {settings.posthog_query_key}"}
            )
    except httpx.HTTPError as exc:
        raise AnalyticsUnavailable("PostHog could not be reached just now.") from exc

    if res.status_code in (401, 403):
        raise AnalyticsUnavailable(
            "PostHog refused the query key - it may have been revoked, or lack Query: Read on this project."
        )
    if res.status_code == 429:
        raise AnalyticsUnavailable("PostHog's query allowance for this hour is used up; try again shortly.")
    if res.status_code >= 400:
        detail = ""
        try:
            detail = str(res.json().get("detail") or "")
        except ValueError:
            pass
        raise AnalyticsUnavailable(f"PostHog could not run that query{': ' + detail[:200] if detail else ''}.")

    data = res.json()
    columns = [str(c) for c in (data.get("columns") or [])]
    rows = [list(r) for r in (data.get("results") or [])]
    try:
        await _redis.set(cache_key, json.dumps({"columns": columns, "rows": rows}, default=str), ex=CACHE_SECONDS)
    except Exception:  # noqa: BLE001
        logger.warning("analytics cache unavailable on write", exc_info=True)
    return columns, rows


# --------------------------------------------------------------- overview --

#: The one property worth breaking each event down by on the overview.
_DETAIL_OF = {
    "gate_shown": "kind",
    "guest_demo_gated": "feature",
    "feedback_given": "rating",
    "plans_opened": "via",
    "consent_choice": "choice",
    "app_opened": "viewport",
    "mode_picked": "mode",
    "question_asked": "mode",
    "guest_demo_asked": "mode",
    "locked_mode_tapped": "mode",
    "answer_failed": "mode",
}

_DEMO_FUNNEL = (
    ("guest_demo_opened", "Opened the demo"),
    ("guest_demo_asked", "Asked a question"),
    ("guest_demo_limit", "Used the allowance"),
    ("guest_demo_signup_clicked", "Clicked sign up"),
)


@dataclass
class Overview:
    visitors: int
    signed_in_visitors: int
    events: int
    by_day: list[dict]
    by_event: dict[str, dict[str, tuple[int, int]]]  # event -> detail -> (events, people)
    # Distinct visitors per event, counted once however many details they hit:
    # summing people across a breakdown counts someone who asked in two
    # companions twice.
    people_by_event: dict[str, int]

    def series(self, event: str, *, people: bool = False) -> list[dict]:
        """One event broken down by its detail property, biggest first."""
        buckets = self.by_event.get(event, {})
        rows = [
            {"label": detail or "(none)", "value": (p if people else n)}
            for detail, (n, p) in buckets.items()
        ]
        return sorted(rows, key=lambda r: r["value"], reverse=True)

    def total(self, event: str, *, people: bool = False) -> int:
        if people:
            return self.people_by_event.get(event, 0)
        return sum(n for n, _ in self.by_event.get(event, {}).values())


def _window(days: int) -> str:
    return f"timestamp >= now() - INTERVAL {int(days)} DAY"


async def overview(days: int) -> Overview:
    """Four queries: totals, a daily series, every event by its detail, and
    distinct visitors per event."""
    where = _window(days)
    detail_expr = "multiIf(" + ", ".join(
        f"event = '{event}', toString(properties.{prop})" for event, prop in _DETAIL_OF.items()
    ) + ", '')"

    _, totals = await run_hogql(
        f"SELECT count(), count(DISTINCT distinct_id), "
        f"count(DISTINCT if(event = 'signed_in', distinct_id, NULL)) "
        f"FROM events WHERE {where}",
        name=f"totals {days}d",
    )
    _, daily = await run_hogql(
        f"SELECT toDate(timestamp) AS day, count(DISTINCT distinct_id) AS visitors, "
        f"countIf(event = 'question_asked') AS questions, "
        f"countIf(event = 'guest_demo_asked') AS demo_questions "
        f"FROM events WHERE {where} GROUP BY day ORDER BY day",
        name=f"daily {days}d",
    )
    _, grouped = await run_hogql(
        f"SELECT event, {detail_expr} AS detail, count() AS n, count(DISTINCT distinct_id) AS people "
        f"FROM events WHERE {where} GROUP BY event, detail ORDER BY n DESC LIMIT 2000",
        name=f"events by detail {days}d",
    )

    _, per_event = await run_hogql(
        f"SELECT event, count(DISTINCT distinct_id) AS people FROM events WHERE {where} "
        f"GROUP BY event LIMIT 500",
        name=f"people by event {days}d",
    )

    total_row = totals[0] if totals else [0, 0, 0]
    by_event: dict[str, dict[str, tuple[int, int]]] = {}
    for event, detail, n, people in grouped:
        by_event.setdefault(str(event), {})[str(detail or "")] = (int(n or 0), int(people or 0))
    return Overview(
        events=int(total_row[0] or 0),
        visitors=int(total_row[1] or 0),
        signed_in_visitors=int(total_row[2] or 0),
        by_day=[
            {
                "label": str(day)[:10],
                "visitors": int(v or 0),
                "questions": int(q or 0),
                "demo_questions": int(dq or 0),
            }
            for day, v, q, dq in daily
        ],
        by_event=by_event,
        people_by_event={str(event): int(n or 0) for event, n in per_event},
    )


def demo_funnel(view: Overview) -> list[dict]:
    """Visitors who reached each demo step in the window - not a strict
    ordered funnel, which is what PostHog's own funnels are for."""
    return [{"label": label, "value": view.total(event, people=True)} for event, label in _DEMO_FUNNEL]
