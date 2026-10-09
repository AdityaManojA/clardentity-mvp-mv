import uuid
from datetime import datetime

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


class DynamicQueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)


class DynamicQueryResult(BaseModel):
    question: str
    sql: str
    explanation: str
    chart: str
    label_column: str | None = None
    value_column: str | None = None
    columns: list[str]
    rows: list[list]
