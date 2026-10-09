"""One call between signing in and seeing a chat.

Getting into the app used to be a chain: who am I, which workspaces do I
have, what is in that workspace, and sometimes make me a chat. Each is a
round trip to a container that may have been asleep, each waits on the one
before it because it needs an id from it, and the user watches an empty
shell for the sum of them. Measured at roughly 783ms apiece on the free
tier, which is most of a second each and all of it sequential.

None of it needs to be sequential on the server, where the ids are already
in hand. This does the whole chain in one request against one connection
and answers with everything the shell and the entry route need.

POST rather than GET because it can create: an account with no workspace
gets one, and an entry with no empty chat to reuse gets a fresh one. That
is the same thing the client did before, moved rather than invented.
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Conversation, Message, User, Workspace, WorkspaceMember
from app.schemas.auth import UserPublic
from app.schemas.workspace import WorkspaceOut

router = APIRouter(prefix="/bootstrap", tags=["bootstrap"])


class BootstrapRequest(BaseModel):
    #: The workspace the client was last in. A hint, not an instruction: it
    #: is used when the account still has it, and quietly ignored otherwise
    #: (deleted, left, or belonging to somebody else).
    workspace_id: uuid.UUID | None = None


class BootstrapResult(BaseModel):
    user: UserPublic
    workspaces: list[WorkspaceOut]
    active_workspace_id: uuid.UUID
    #: An empty chat to land in - reused if one was lying about, created if
    #: not. Empty means nothing has been asked in it yet.
    conversation_id: uuid.UUID
    #: True when the chat above was made by this call, which the client uses
    #: to decide whether its cached list is stale.
    conversation_created: bool


@router.post("", response_model=BootstrapResult)
async def bootstrap(
    payload: BootstrapRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BootstrapResult:
    """Everything needed to open the app, in one round trip."""
    rows = await db.execute(
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == current_user.id)
        .order_by(Workspace.created_at)
    )
    workspaces = [
        WorkspaceOut(id=w.id, name=w.name, role=role, created_at=w.created_at)
        for w, role in rows.all()
    ]

    if not workspaces:
        # Registration makes one, so this is a repair rather than the normal
        # path - an account that lost its last workspace still has to be
        # able to open the app.
        workspace = Workspace(owner_id=current_user.id, name="My workspace")
        db.add(workspace)
        await db.flush()
        db.add(
            WorkspaceMember(
                workspace_id=workspace.id, user_id=current_user.id, role="owner"
            )
        )
        await db.flush()
        workspaces = [
            WorkspaceOut(
                id=workspace.id, name=workspace.name, role="owner",
                created_at=workspace.created_at,
            )
        ]

    remembered = next((w for w in workspaces if w.id == payload.workspace_id), None)
    active = remembered or workspaces[0]

    # An empty chat left from last time, rather than stacking another
    # "Untitled chat" on the list at every sign-in. Empty is a null title,
    # which is only ever set from the first question asked in a chat.
    last_activity = (
        select(func.max(Message.created_at))
        .where(Message.conversation_id == Conversation.id)
        .correlate(Conversation)
        .scalar_subquery()
    )
    reusable = (
        await db.execute(
            select(Conversation)
            .where(
                Conversation.workspace_id == active.id,
                Conversation.title.is_(None),
            )
            .order_by(func.coalesce(last_activity, Conversation.created_at).desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    created = False
    if reusable is None:
        reusable = Conversation(workspace_id=active.id, title=None, default_mode=None)
        db.add(reusable)
        created = True

    await db.commit()
    await db.refresh(reusable)

    return BootstrapResult(
        # .of rather than model_validate: the admin flag is computed on the
        # way out, and validating straight off the row silently returns
        # is_admin=False for an administrator.
        user=UserPublic.of(current_user),
        workspaces=workspaces,
        active_workspace_id=active.id,
        conversation_id=reusable.id,
        conversation_created=created,
    )
