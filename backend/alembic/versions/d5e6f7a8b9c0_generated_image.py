"""a picture made during a Co-Creative turn, pointed at from the message

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-10-07
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "d5e6f7a8b9c0"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "messages",
        sa.Column("generated_image", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    # The bytes live in object storage; this is only the pointer, so dropping
    # the column would orphan images rather than delete them.


def downgrade() -> None:
    op.drop_column("messages", "generated_image")
