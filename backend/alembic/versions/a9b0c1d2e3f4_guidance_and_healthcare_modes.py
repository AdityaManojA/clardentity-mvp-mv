"""guidance and healthcare modes: Mentoring and Reflect & Relieve merged into
Guidance, and Healthcare added

Every message and chat that was in either old mode moves to Guidance - the
merged companion is what both now are. Names users gave the two old modes are
dropped rather than guessed between: there is no telling whether "Coach" or
"Calm" should be what Guidance answers to.

Revision ID: a9b0c1d2e3f4
Revises: f8a9b0c1d2e3
Create Date: 2026-10-16
"""

from alembic import op

revision = "a9b0c1d2e3f4"
down_revision = "f8a9b0c1d2e3"
branch_labels = None
depends_on = None

_OLD_MODES = (
    "('rapid', 'knowing', 'thinking', 'decision', 'learning', 'mentoring', 'therapy', "
    "'creative', 'legal')"
)
_NEW_MODES = (
    "('rapid', 'knowing', 'thinking', 'decision', 'learning', 'creative', 'guidance', "
    "'healthcare', 'legal')"
)


def _drop() -> None:
    op.drop_constraint("ck_conversations_default_mode", "conversations", type_="check")
    op.drop_constraint("ck_messages_mode_used", "messages", type_="check")


def _create(modes: str) -> None:
    op.create_check_constraint(
        "ck_conversations_default_mode", "conversations", f"default_mode IN {modes}"
    )
    op.create_check_constraint("ck_messages_mode_used", "messages", f"mode_used IN {modes}")


def upgrade() -> None:
    _drop()
    op.execute("UPDATE messages SET mode_used = 'guidance' WHERE mode_used IN ('mentoring', 'therapy')")
    op.execute(
        "UPDATE conversations SET default_mode = 'guidance' "
        "WHERE default_mode IN ('mentoring', 'therapy')"
    )
    op.execute(
        "UPDATE users SET companion_names = companion_names - 'mentoring' - 'therapy' "
        "WHERE companion_names ?| array['mentoring', 'therapy']"
    )
    _create(_NEW_MODES)


def downgrade() -> None:
    # Best effort: Guidance goes back to Mentoring, and Healthcare - which had
    # no predecessor - to Finder, the mode that answered health questions
    # before it existed.
    _drop()
    op.execute("UPDATE messages SET mode_used = 'mentoring' WHERE mode_used = 'guidance'")
    op.execute("UPDATE messages SET mode_used = 'knowing' WHERE mode_used = 'healthcare'")
    op.execute("UPDATE conversations SET default_mode = 'mentoring' WHERE default_mode = 'guidance'")
    op.execute("UPDATE conversations SET default_mode = 'knowing' WHERE default_mode = 'healthcare'")
    _create(_OLD_MODES)
