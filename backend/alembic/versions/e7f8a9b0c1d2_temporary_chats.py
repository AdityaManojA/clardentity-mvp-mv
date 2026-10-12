"""temporary chats: a chat kept out of history and the profile, and the files
attached inside one

A temporary conversation is left out of the recents list, search, the
profile's evidence and the empty-chat reuse at sign-in, and is deleted when
its owner leaves it (or a day later, whichever comes first). A document
attached inside one belongs to it rather than to the workspace: the column is
null for every ordinary upload, and set only for those, so they go when the
chat goes.

Revision ID: e7f8a9b0c1d2
Revises: d5e6f7a8b9c0
Create Date: 2026-10-12
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "e7f8a9b0c1d2"
down_revision = "d5e6f7a8b9c0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "conversations",
        sa.Column("temporary", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "documents",
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("conversations.id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.create_index("ix_documents_conversation_id", "documents", ["conversation_id"])
    # The sweep's only question is "which temporary chats are there", asked
    # on every entry to the app; the answer is a handful of rows in a table
    # of every chat ever had, so a partial index keeps it from scanning.
    op.create_index(
        "ix_conversations_temporary",
        "conversations",
        ["created_at"],
        postgresql_where=sa.text("temporary"),
    )


def downgrade() -> None:
    op.drop_index("ix_conversations_temporary", table_name="conversations")
    op.drop_index("ix_documents_conversation_id", table_name="documents")
    op.drop_column("documents", "conversation_id")
    op.drop_column("conversations", "temporary")
