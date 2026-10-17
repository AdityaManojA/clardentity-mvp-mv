import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AdminUserRow(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str | None
    created_at: datetime
    last_active_at: datetime | None
    location: str | None
    accepted_terms: bool
    onboarded: bool
    preview_unlocked: bool
    questions_asked: int
    answers: int
    input_tokens: int
    output_tokens: int
    total_tokens: int


class UsageBucket(BaseModel):
    label: str
    tokens: int


class AdminOverview(BaseModel):
    generated_at: datetime
    window_days: int
    user_count: int
    active_user_count: int
    conversation_count: int
    answer_count: int
    #: Answers written before token metering existed, or by a path that did
    #: not record it. Reported rather than hidden: the totals below are a
    #: floor, and this number says by how much.
    turns_without_usage: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    users: list[AdminUserRow]
    by_day: list[UsageBucket]
    by_mode: list[UsageBucket]
    #: Per model, which is the breakdown that maps to money. The turn meter
    #: has always recorded it - every call a turn makes, under the model
    #: that served it - and nothing read it back until the picker made the
    #: spread matter: a turn on the cheapest model and the same turn on the
    #: dearest differ by more than an order of magnitude, and by_mode cannot
    #: see that because both are the same mode.
    by_model: list[UsageBucket]


Source = Literal["database", "analytics"]


class DynamicQueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    #: Where the answer comes from: our database (accounts, usage, cost - for
    #: everyone), PostHog's analytics (what visitors did in the browser - for
    #: those who allowed it), or "auto" to let the question decide.
    source: Literal["auto", "database", "analytics"] = "auto"


class DynamicQueryResult(BaseModel):
    question: str
    #: The query that ran: SQL against the database, HogQL against PostHog.
    sql: str
    explanation: str
    chart: str
    label_column: str | None = None
    value_column: str | None = None
    columns: list[str]
    rows: list[list]
    source: Source = "database"


class AdminViewCreate(BaseModel):
    """Pin a view that has just been answered. The query is checked again here
    and on every run - this endpoint is not trusted to be fed only by the
    dashboard's own answers."""

    title: str = Field(min_length=1, max_length=120)
    source: Source
    query: str = Field(min_length=1, max_length=4000)
    chart: Literal["table", "bar", "pie", "line"] = "table"
    label_column: str | None = None
    value_column: str | None = None
    explanation: str | None = Field(default=None, max_length=500)


class AdminViewOut(BaseModel):
    id: uuid.UUID
    title: str
    source: Source
    query: str
    chart: str
    label_column: str | None = None
    value_column: str | None = None
    explanation: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalyticsSlice(BaseModel):
    label: str
    value: int


class AnalyticsDay(BaseModel):
    label: str
    visitors: int
    questions: int
    demo_questions: int


class AnalyticsOverview(BaseModel):
    """What visitors did in the browser, from PostHog - only those who allowed
    analytics, which the panel says next to every number."""

    configured: bool
    #: Set when PostHog is connected but could not answer.
    error: str | None = None
    window_days: int
    generated_at: datetime
    visitors: int = 0
    signed_in_visitors: int = 0
    events: int = 0
    by_day: list[AnalyticsDay] = []
    demo_funnel: list[AnalyticsSlice] = []
    demo_gated: list[AnalyticsSlice] = []
    modes_picked: list[AnalyticsSlice] = []
    questions_by_mode: list[AnalyticsSlice] = []
    gates: list[AnalyticsSlice] = []
    locked_modes: list[AnalyticsSlice] = []
    upgrade_interest: list[AnalyticsSlice] = []
    feedback: list[AnalyticsSlice] = []
    devices: list[AnalyticsSlice] = []
    problems: list[AnalyticsSlice] = []
