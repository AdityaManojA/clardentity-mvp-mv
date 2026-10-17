import asyncio

from app.core.celery_app import celery_app
from app.db.session import WorkerSessionLocal
from app.services.temporary_chats import sweep_idle


@celery_app.task(name="sweep_temporary_chats")
def sweep_temporary_chats_task() -> None:
    asyncio.run(_sweep())


async def _sweep() -> None:
    async with WorkerSessionLocal() as db:
        await sweep_idle(db)
