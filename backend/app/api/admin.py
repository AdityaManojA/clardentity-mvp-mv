import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.admin_dashboard import require_admin
from app.db.session import get_db
from app.models import User
from app.schemas.admin import AdminSettingsOut, AdminSettingUpdate
from app.services.admin_settings_service import DEFAULTS, get_all_settings, get_setting, set_setting

logger = logging.getLogger("clardentity.admin")

router = APIRouter(prefix="/admin", tags=["admin"])

# Global settings - the answer model, scoring weights, feature flags - so
# administrators only (ADMIN_EMAILS), the same check the dashboard uses. Until
# 2026-10-17 these were gated on sign-in alone: any registered account could
# switch web search or verification off for everyone.


@router.get("/settings", response_model=AdminSettingsOut)
async def get_settings(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminSettingsOut:
    return AdminSettingsOut(settings=await get_all_settings(db))


@router.put("/settings", response_model=AdminSettingsOut)
async def update_setting(
    payload: AdminSettingUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminSettingsOut:
    if payload.key not in DEFAULTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown setting key: {payload.key}"
        )

    old_value = await get_setting(db, payload.key)
    await set_setting(db, payload.key, payload.value)

    # §14 Audit: config changes logged with actor + timestamp + diff (the
    # timestamp comes from the log record itself).
    logger.info(
        "admin setting changed",
        extra={
            "actor_id": str(current_user.id),
            "actor_email": current_user.email,
            "key": payload.key,
            "old_value": old_value,
            "new_value": payload.value,
        },
    )

    return AdminSettingsOut(settings=await get_all_settings(db))
