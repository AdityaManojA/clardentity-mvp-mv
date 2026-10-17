"""A signed-in user's location, filled in when a request needs it.

Location is normally resolved out of band at sign-in (workers/
refresh_location). But a request that depends on where someone is -
Healthcare's rules, the crisis numbers on a support card, a live call's
safety floor - cannot wait for that and must not fall back to "your local
emergency number" when one lookup would give the real one. So when the
country is missing, it is looked up now (cached a day) and stored.
"""

from datetime import UTC, datetime

from fastapi import Depends, Request
from sqlalchemy import update

from app.api.deps import get_current_user
from app.core.client_ip import client_ip, client_timezone
from app.db.session import AsyncSessionLocal
from app.models import User
from app.services.geolocation import country_from_timezone, resolve_cached
from app.services.regulations import _emergency


async def ensure_location(user: User, request: Request) -> None:
    if user.location_country:
        return
    located = await resolve_cached(client_ip(request))
    if located and located.get("country"):
        values = {
            "location_label": located.get("label"),
            "location_country": located["country"],
            "location_subdivision": located.get("subdivision"),
            "location_timezone": located.get("timezone"),
            "location_updated_at": datetime.now(UTC),
        }
    else:
        # The address could not be looked up: the browser's time zone still
        # names the country. Left without a timestamp, so the next refresh
        # replaces it with the finer answer when the lookup works again.
        timezone = client_timezone(request)
        country = country_from_timezone(timezone)
        if not country:
            return
        values = {
            "location_label": (_emergency().get(country) or {}).get("country") or country,
            "location_country": country,
            "location_subdivision": None,
            "location_timezone": timezone,
            "location_updated_at": None,
        }
    # Its own session: the request's is about to be used for the turn, and
    # the location must stick even if that turn fails.
    async with AsyncSessionLocal() as db:
        await db.execute(update(User).where(User.id == user.id).values(**values))
        await db.commit()
    for key, value in values.items():
        setattr(user, key, value)


async def get_located_user(request: Request, user: User = Depends(get_current_user)) -> User:
    """`get_current_user`, with a country wherever one can be found."""
    await ensure_location(user, request)
    return user
