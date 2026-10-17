"""Temporary chats: what goes with one, and when.

A temporary chat is an ordinary conversation in every way the chat itself can
see - it streams, checks claims, forks and regenerates like any other, which
is why it is stored like any other. What makes it temporary is everything
around it: it is left out of the recents list, search and the reuse of an
empty chat at sign-in; it neither reads nor feeds the profile; and it is
deleted when its owner leaves it.

"Leaves it" is the client's to say - it deletes the chat as it navigates away
(AppShell). A tab that is simply closed says nothing, so what is left over is
swept here once it has been idle for a day. There is no scheduler to run the
sweep, so it rides on traffic instead: every entry to the app (/bootstrap)
queues it as a background task, and starting a temporary chat runs it for
that user. Nobody can reach a stale one in the meantime: it is in no list,
and only its owner can open it by its URL.

Deleting one takes the files attached inside it (rows by cascade, stored
copies here) and the pictures drawn in it, since a chat that promises to be
gone should not leave its uploads behind in the workspace or in storage.
"""

import asyncio
import logging
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Document, Message, WorkspaceMember
from app.services.image_generation import storage_key as image_storage_key
from app.services.storage import delete_file

logger = logging.getLogger("clardentity.temporary_chats")

#: How long an abandoned temporary chat may sit before it is swept.
IDLE_LIMIT = timedelta(hours=24)

# The serving route tries both; a delete of a key that was never written is a
# no-op, so both are deleted rather than the extension being recorded.
_IMAGE_EXTENSIONS = ("webp", "png")


async def discard(db: AsyncSession, conversation: Conversation) -> None:
    """Delete a conversation along with what was attached and drawn in it.

    The stored copies are collected before the rows go and removed after the
    commit: storage being down must not leave a chat that was meant to be
    gone sitting in the database, and an orphaned file is the lesser failure.
    """
    document_keys = (
        await db.execute(
            select(Document.storage_path).where(
                Document.conversation_id == conversation.id,
                Document.storage_path.is_not(None),
            )
        )
    ).scalars().all()
    images = (
        await db.execute(
            select(Message.generated_image).where(
                Message.conversation_id == conversation.id,
                Message.generated_image.is_not(None),
            )
        )
    ).scalars().all()
    image_keys = [
        image_storage_key(image["owner"], image["id"], ext)
        for image in images
        if isinstance(image, dict) and image.get("owner") and image.get("id")
        for ext in _IMAGE_EXTENSIONS
    ]

    await db.delete(conversation)
    await db.commit()

    for key in [*document_keys, *image_keys]:
        try:
            await asyncio.to_thread(delete_file, key)
        except Exception:  # noqa: BLE001 - see the docstring
            logger.warning("stored copy %s of a temporary chat was not deleted", key, exc_info=True)


async def sweep_idle(db: AsyncSession, user_id: uuid.UUID | None = None) -> int:
    """Delete temporary chats that have been idle past the limit - this
    user's, or everyone's when no user is given. Returns how many went."""
    last_activity = (
        select(func.max(Message.created_at))
        .where(Message.conversation_id == Conversation.id)
        .correlate(Conversation)
        .scalar_subquery()
    )
    cutoff = datetime.now(UTC) - IDLE_LIMIT
    conditions = [
        Conversation.temporary.is_(True),
        func.coalesce(last_activity, Conversation.created_at) < cutoff,
    ]
    if user_id is not None:
        conditions.append(
            Conversation.workspace_id.in_(
                select(WorkspaceMember.workspace_id)
                .where(WorkspaceMember.user_id == user_id)
                .scalar_subquery()
            )
        )
    stale = (await db.execute(select(Conversation).where(*conditions))).scalars().all()
    for conversation in stale:
        await discard(db, conversation)
    return len(stale)
