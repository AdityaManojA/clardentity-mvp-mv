"""The administrator's view: who is signed up, and what they are costing.

Read-only, and gated on an explicit list of addresses in configuration
(services/admin_access) rather than on being signed in, because every
response here contains other people's email addresses.
"""

import logging
import re
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import AsyncSessionLocal, get_db
from app.models import Conversation, Message, User, Workspace
from app.schemas.admin_dashboard import (
    AdminOverview,
    AdminUserRow,
    DynamicQueryRequest,
    DynamicQueryResult,
    UsageBucket,
)
from app.services.admin_access import is_admin
from app.services.anthropic_client import generate_structured

logger = logging.getLogger("clardentity.admin")

router = APIRouter(prefix="/admin", tags=["admin"])


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not is_admin(current_user):
        # 404 rather than 403: an endpoint that answers "you are not allowed"
        # has confirmed it exists, which is a map for anyone probing.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return current_user


def _tokens(usage: dict | None) -> tuple[int, int]:
    if not usage:
        return 0, 0
    return int(usage.get("input_tokens") or 0), int(usage.get("output_tokens") or 0)


@router.get("/overview", response_model=AdminOverview)
async def overview(
    days: int = Query(30, ge=1, le=365),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminOverview:
    """Everything the dashboard needs in one round trip: the roster, the
    totals, the per-user split that draws the pie, and a daily series.

    Token usage is read from messages.token_usage, which the chat route
    writes per turn (services/token_meter). Turns answered before that was
    added carry no usage and count as zero - visible in the "turns without a
    usage record" figure rather than quietly smeared across the rest.
    """
    since = datetime.now(UTC) - timedelta(days=days)

    users = (await db.execute(select(User).order_by(User.created_at.desc()))).scalars().all()

    # One pass over assistant messages, joined back to the account that owns
    # the workspace the conversation lives in.
    rows = (
        await db.execute(
            select(
                Workspace.owner_id,
                Message.token_usage,
                Message.created_at,
                Message.mode_used,
            )
            .select_from(Message)
            .join(Conversation, Conversation.id == Message.conversation_id)
            .join(Workspace, Workspace.id == Conversation.workspace_id)
            .where(Message.role == "assistant")
        )
    ).all()

    per_user: dict[uuid.UUID, dict] = {}
    per_day: dict[str, int] = {}
    per_mode: dict[str, int] = {}
    total_in = total_out = 0
    unmetered = 0

    for owner_id, usage, created_at, mode in rows:
        tin, tout = _tokens(usage)
        if not usage:
            unmetered += 1
        total_in += tin
        total_out += tout
        bucket = per_user.setdefault(owner_id, {"input": 0, "output": 0, "turns": 0})
        bucket["input"] += tin
        bucket["output"] += tout
        bucket["turns"] += 1
        if created_at and created_at >= since:
            day = created_at.strftime("%Y-%m-%d")
            per_day[day] = per_day.get(day, 0) + tin + tout
        if mode:
            per_mode[mode] = per_mode.get(mode, 0) + tin + tout

    # Questions asked, counted separately so a user with no answers yet still
    # shows their activity.
    asked = dict(
        (
            await db.execute(
                select(Workspace.owner_id, func.count(Message.id))
                .select_from(Message)
                .join(Conversation, Conversation.id == Message.conversation_id)
                .join(Workspace, Workspace.id == Conversation.workspace_id)
                .where(Message.role == "user")
                .group_by(Workspace.owner_id)
            )
        ).all()
    )
    last_seen = dict(
        (
            await db.execute(
                select(Workspace.owner_id, func.max(Message.created_at))
                .select_from(Message)
                .join(Conversation, Conversation.id == Message.conversation_id)
                .join(Workspace, Workspace.id == Conversation.workspace_id)
                .group_by(Workspace.owner_id)
            )
        ).all()
    )

    roster = []
    for u in users:
        bucket = per_user.get(u.id, {"input": 0, "output": 0, "turns": 0})
        roster.append(
            AdminUserRow(
                id=u.id,
                email=u.email,
                display_name=u.display_name,
                created_at=u.created_at,
                last_active_at=last_seen.get(u.id),
                location=u.location_label,
                accepted_terms=u.terms_accepted_at is not None,
                onboarded=u.onboarding_completed_at is not None,
                preview_unlocked=u.preview_unlocked_at is not None,
                questions_asked=int(asked.get(u.id, 0)),
                answers=bucket["turns"],
                input_tokens=bucket["input"],
                output_tokens=bucket["output"],
                total_tokens=bucket["input"] + bucket["output"],
            )
        )

    return AdminOverview(
        generated_at=datetime.now(UTC),
        window_days=days,
        user_count=len(users),
        active_user_count=sum(1 for r in roster if r.answers > 0),
        conversation_count=int(await db.scalar(select(func.count(Conversation.id))) or 0),
        answer_count=len(rows),
        turns_without_usage=unmetered,
        input_tokens=total_in,
        output_tokens=total_out,
        total_tokens=total_in + total_out,
        users=roster,
        by_day=[UsageBucket(label=d, tokens=t) for d, t in sorted(per_day.items())],
        by_mode=[
            UsageBucket(label=m, tokens=t)
            for m, t in sorted(per_mode.items(), key=lambda kv: -kv[1])
        ],
    )


# ---------------------------------------------------------------------------
# The dynamic view: a question in English, answered from the database.
#
# WrenAI does this as a service of its own; running it would mean another
# deployment, another vector store and another thing to keep upright for a
# feature used by one person. The same job here is one model call and a hard
# gate: the model may only write a single read-only SELECT over an allowed
# set of tables, the statement is checked before it runs, and it runs under a
# read-only transaction with a row cap. The model's opinion is a suggestion;
# the gate is what makes it safe.
# ---------------------------------------------------------------------------

# Tables the question may touch. Deliberately excludes messages.content,
# documents and chunks - an administrator asking a question about usage has
# no business reading what people wrote, and a view that could would be the
# opposite of what the privacy notice promises.
_ALLOWED_TABLES = {
    "users",
    "workspaces",
    "conversations",
    "messages",
    "message_claims",
    "documents",
    "pro_interest",
}
_FORBIDDEN_COLUMNS = {
    "content",
    "password_hash",
    "transcript",
    "claim_text",
    "excerpt",
    "title",
    "filename",
}
_SCHEMA_NOTE = """
users(id, email, display_name, created_at, location_label, location_country,
      onboarding_completed_at, terms_accepted_at, preview_unlocked_at)
workspaces(id, owner_id -> users.id, name, created_at)
conversations(id, workspace_id -> workspaces.id, title, default_mode,
              pinned_at, created_at)
messages(id, conversation_id -> conversations.id, role ('user'|'assistant'),
         mode_used, confidence_score, confidence_band, token_usage (jsonb with
         input_tokens, output_tokens, total_tokens, calls, by_model),
         feedback (jsonb with rating), created_at)
message_claims(id, message_id -> messages.id, claim_score, entailment_label,
               distortion_flag, created_at)
documents(id, workspace_id -> workspaces.id, file_type, status, created_at)
pro_interest(id, user_id -> users.id, requested_model, created_at)
"""

_SQL_SCHEMA = {
    "type": "object",
    "properties": {
        "sql": {"type": "string"},
        "chart": {"type": "string", "enum": ["table", "bar", "pie", "line"]},
        "label_column": {"type": "string"},
        "value_column": {"type": "string"},
        "explanation": {"type": "string"},
    },
    "required": ["sql", "chart", "explanation"],
    "additionalProperties": False,
}

_STATEMENT_SPLIT = re.compile(r";\s*\S")
_WRITE_WORDS = re.compile(
    r"\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|"
    r"vacuum|comment|call|do|merge|set|begin|commit|rollback)\b",
    re.I,
)


def _vet(sql: str) -> str:
    """Refuse anything that is not one plain read. Checked here rather than
    trusted to the prompt: a model told to write only SELECTs will still,
    occasionally, write something else, and this is a database with everyone's
    data in it."""
    statement = sql.strip().rstrip(";").strip()
    if not statement:
        raise HTTPException(status_code=400, detail="No query was produced")
    if _STATEMENT_SPLIT.search(sql.strip()):
        raise HTTPException(status_code=400, detail="Only one statement at a time")
    if not re.match(r"^(select|with)\b", statement, re.I):
        raise HTTPException(status_code=400, detail="Only SELECT queries are allowed")
    if _WRITE_WORDS.search(statement):
        raise HTTPException(status_code=400, detail="That query would change data")
    lowered = statement.lower()
    for column in _FORBIDDEN_COLUMNS:
        if re.search(rf"\b{column}\b", lowered):
            raise HTTPException(
                status_code=400,
                detail=f"The dashboard does not read {column} - it holds what people wrote",
            )
    # Names a CTE defines are references to the query's own intermediate
    # results, not to tables, so they are allowed alongside the real ones.
    defined = set(re.findall(r"\b([a-z_][a-z0-9_]*)\s+as\s*\(", lowered))
    for table in re.findall(r"\b(?:from|join)\s+([a-z_][a-z0-9_]*)", lowered):
        if table not in _ALLOWED_TABLES and table not in defined:
            raise HTTPException(status_code=400, detail=f"Table {table} is not available here")
    return statement


@router.post("/query", response_model=DynamicQueryResult)
async def dynamic_query(
    payload: DynamicQueryRequest,
    _: User = Depends(require_admin),
) -> DynamicQueryResult:
    """Ask for a view in English; get rows and a chart suggestion back."""
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Ask a question first")

    plan = await generate_structured(
        instructions=(
            "You write one read-only PostgreSQL query answering the "
            "administrator's question about their own product's usage.\n"
            f"The only tables and columns available are:\n{_SCHEMA_NOTE}\n"
            "Rules: a single SELECT (a leading WITH is fine); never any "
            "statement that writes; never read message content, claim text, "
            "document filenames, conversation titles or password hashes - "
            "those hold what users wrote and are off limits; always alias "
            "computed columns readably; add LIMIT 200 unless the question is "
            "an aggregate that returns fewer rows. Token usage lives in "
            "messages.token_usage as jsonb - read it with "
            "(token_usage->>'total_tokens')::bigint and coalesce it to 0.\n"
            "Pick the chart that suits the answer: pie for a share of a "
            "whole, bar for a comparison across categories, line for a series "
            "over time, table otherwise. Name the label and value columns for "
            "the chart. Explain in one sentence what the query returns."
        ),
        input_text=question,
        schema=_SQL_SCHEMA,
        schema_name="dashboard_query",
        fast=False,
    )

    statement = _vet(plan.get("sql", ""))

    # A separate session set read-only for the duration, so even a query that
    # slipped past the checks above cannot write. The statement timeout stops
    # a careless cross join taking the instance with it.
    async with AsyncSessionLocal() as db:
        try:
            await db.execute(text("SET LOCAL transaction_read_only = on"))
            await db.execute(text("SET LOCAL statement_timeout = '10s'"))
            result = await db.execute(text(statement))
            columns = list(result.keys())
            rows = [list(r) for r in result.fetchmany(500)]
        except HTTPException:
            raise
        except Exception as exc:  # noqa: BLE001 - the query is user-shaped input
            logger.info("dashboard query failed: %s", exc)
            raise HTTPException(
                status_code=400, detail=f"That query did not run: {str(exc)[:200]}"
            ) from exc
        finally:
            await db.rollback()

    return DynamicQueryResult(
        question=question,
        sql=statement,
        explanation=plan.get("explanation", ""),
        chart=plan.get("chart", "table"),
        label_column=plan.get("label_column"),
        value_column=plan.get("value_column"),
        columns=columns,
        rows=[[_jsonable(v) for v in row] for row in rows],
    )


def _jsonable(value):
    if isinstance(value, (datetime,)):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)
