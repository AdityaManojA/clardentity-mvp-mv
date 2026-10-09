import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.admin_dashboard import router as admin_dashboard_router
from app.api.audio import router as audio_router
from app.api.compose import router as compose_router
from app.api.auth import router as auth_router
from app.api.biases import router as biases_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.guest import router as guest_router
from app.api.images import router as images_router
from app.api.health import router as health_router
from app.api.history import router as history_router
from app.api.bootstrap import router as bootstrap_router
from app.api.pro import router as pro_router
from app.api.profile import router as profile_router
from app.api.realtime import router as realtime_router
from app.api.memory import router as memory_router
from app.api.validation import router as validation_router
from app.api.workspaces import router as workspaces_router
from app.core.config import settings
from app.core.logging_config import configure_logging
from app.core.middleware import CorrelationIdMiddleware
from app.db.session import AsyncSessionLocal
from app.services.admin_access import ensure_bootstrap_admin

configure_logging()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Boot work that must happen once per process. Seeding the administrator
    is safe to run in every instance: it creates the account only when it is
    missing, and two containers racing resolve to one row on the email's
    unique index."""
    try:
        async with AsyncSessionLocal() as db:
            await ensure_bootstrap_admin(db)
    except Exception:  # noqa: BLE001 - an un-seeded admin must not stop serving
        logging.getLogger("clardentity.admin").warning(
            "bootstrap admin not created", exc_info=True
        )
    yield


app = FastAPI(title="Clardentity API", lifespan=lifespan)

app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

app.include_router(health_router)
app.include_router(admin_dashboard_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(workspaces_router, prefix=API_PREFIX)
app.include_router(chat_router, prefix=API_PREFIX)
app.include_router(documents_router, prefix=API_PREFIX)
app.include_router(images_router, prefix=API_PREFIX)
app.include_router(guest_router, prefix=API_PREFIX)
app.include_router(history_router, prefix=API_PREFIX)
app.include_router(biases_router, prefix=API_PREFIX)
app.include_router(profile_router, prefix=API_PREFIX)
app.include_router(memory_router, prefix=API_PREFIX)
app.include_router(validation_router, prefix=API_PREFIX)
app.include_router(admin_router, prefix=API_PREFIX)
app.include_router(audio_router, prefix=API_PREFIX)
app.include_router(compose_router, prefix=API_PREFIX)
app.include_router(realtime_router, prefix=API_PREFIX)
app.include_router(pro_router, prefix=API_PREFIX)
app.include_router(bootstrap_router, prefix=API_PREFIX)
