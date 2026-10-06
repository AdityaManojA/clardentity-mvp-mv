"""who the user is when they are learning: student, teacher, or just visiting

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-10-07
"""

import sqlalchemy as sa
from alembic import op

revision = "c4d5e6f7a8b9"
down_revision = "b3c4d5e6f7a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_profiles", sa.Column("learning_role", sa.String(length=16), nullable=True)
    )
    # NULL means "not asked yet", which is what the prompt reads as "assume
    # nothing". Backfilling a default would be a guess about every existing
    # account, and the one thing this column exists to avoid is guessing.


def downgrade() -> None:
    op.drop_column("user_profiles", "learning_role")
