import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, String, false, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

COGNITIVE_MODES = (
    "rapid",
    "knowing",
    "thinking",
    "decision",
    "learning",
    "creative",
    # Mentoring and Reflect & Relieve, merged on 2026-10-16: one companion
    # for goals and for how you are doing (see prompt_builder).
    "guidance",
    # Health information and navigation, under the regulation suite in
    # services/regulations.
    "healthcare",
    "legal",
)

#: Mode values that no longer exist, and what a stored or remembered one now
#: means. Read wherever a mode arrives from somewhere older than this code -
#: a visitor's saved demo conversation, a browser's remembered choice.
LEGACY_MODES = {"mentoring": "guidance", "therapy": "guidance"}


def current_mode(value: str | None) -> str | None:
    """A mode value as it is today."""
    if value is None:
        return None
    return LEGACY_MODES.get(value, value)


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (
        CheckConstraint(
            f"default_mode IN {COGNITIVE_MODES}", name="ck_conversations_default_mode"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    # Convenience pre-fill only (SRS §7.2) - every message still carries its own
    # explicit `mode_used`; this is never used as an automatic fallback.
    default_mode: Mapped[str | None] = mapped_column(String, nullable=True)
    # The tip of the branch currently shown. Walking `parent_id` back from
    # here (see app/services/message_tree.py) is "the conversation" a user
    # sees - editing or regenerating moves this pointer to a new sibling
    # rather than deleting the rows after it. Null only for a conversation
    # with no messages yet. SET NULL rather than CASCADE: a message being
    # deleted shouldn't take the whole conversation row down with it.
    active_leaf_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True
    )
    # Set when the user pins the chat. A timestamp rather than a flag so
    # several pinned chats keep an order of their own (most recently pinned
    # first) instead of falling back on activity, which is the thing pinning
    # exists to override.
    pinned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # A temporary chat: out of the recents list, search and the profile (it
    # neither reads it nor feeds it), and deleted when its owner leaves it -
    # see app/services/temporary_chats.py for when that is.
    temporary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
        # Disambiguates against active_leaf_id, the other FK now linking
        # these two tables - this relationship is only ever "every message in
        # this conversation", never "the one message active_leaf_id points
        # to".
        foreign_keys="Message.conversation_id",
    )
