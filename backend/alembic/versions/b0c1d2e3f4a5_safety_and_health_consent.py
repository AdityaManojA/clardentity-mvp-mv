"""safety cards, state/province location, and Healthcare consent

Revision ID: b0c1d2e3f4a5
Revises: a9b0c1d2e3f4
Create Date: 2026-10-16
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "b0c1d2e3f4a5"
down_revision = "a9b0c1d2e3f4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("safety", postgresql.JSONB(), nullable=True))
    op.add_column("users", sa.Column("location_subdivision", sa.String(8), nullable=True))
    op.add_column("users", sa.Column("health_consent", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "health_consent")
    op.drop_column("users", "location_subdivision")
    op.drop_column("messages", "safety")
