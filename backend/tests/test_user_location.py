"""Where a signed-in user is, and that it reaches the things that depend on it.

Until 2026-10-16 sign-in read the proxy's address instead of the user's, so
no account in production had a country: Healthcare fell back to the generic
rules and a support card had no local numbers. These pin the forwarded
address, the on-demand lookup, and that India's rules and numbers arrive.
Needs a database; skipped without one.
"""

import uuid

import httpx
import pytest
from sqlalchemy import delete, select

from app.core.client_ip import client_ip
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.main import app
from app.models import User, Workspace, WorkspaceMember
from app.services import user_location

API = "/api/v1"
INDIA = {"label": "Kochi, Kerala, India", "country": "IN", "subdivision": "IN-KL", "timezone": "Asia/Kolkata"}


class _Req:
    def __init__(self, headers=None, host="10.0.0.7"):
        self.headers = headers or {}
        self.client = type("C", (), {"host": host})()


def test_the_forwarded_address_wins_over_the_proxy():
    assert client_ip(_Req({"x-forwarded-for": "49.37.1.2, 10.0.0.7"})) == "49.37.1.2"
    assert client_ip(_Req()) == "10.0.0.7"


@pytest.fixture
async def unlocated(monkeypatch):
    seen = []

    async def lookup(ip):
        seen.append(ip)
        return INDIA if ip == "49.37.1.2" else None

    monkeypatch.setattr(user_location, "resolve_cached", lookup)
    email = f"loc-{uuid.uuid4().hex[:8]}@example.com"
    try:
        async with AsyncSessionLocal() as db:
            user = User(email=email, password_hash=hash_password("loc-password-123"))
            db.add(user)
            await db.flush()
            ws = Workspace(owner_id=user.id, name="t")
            db.add(ws)
            await db.flush()
            db.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role="owner"))
            await db.commit()
            user_id = user.id
    except Exception as exc:  # noqa: BLE001
        if "connect" not in str(exc).lower() and "database" not in str(exc).lower():
            raise
        pytest.skip("no database available")
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as c:
        login = await c.post(f"{API}/auth/login", json={"email": email, "password": "loc-password-123"})
    yield {"Authorization": f"Bearer {login.json()['access_token']}"}, user_id, seen
    async with AsyncSessionLocal() as db:
        await db.execute(delete(WorkspaceMember).where(WorkspaceMember.user_id == user_id))
        await db.execute(delete(Workspace).where(Workspace.owner_id == user_id))
        await db.execute(delete(User).where(User.id == user_id))
        await db.commit()


async def test_healthcare_finds_india_from_the_forwarded_address(unlocated):
    headers, user_id, seen = unlocated
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as c:
        state = (
            await c.get(
                f"{API}/healthcare/consent",
                headers={**headers, "X-Forwarded-For": "49.37.1.2, 10.0.0.7"},
            )
        ).json()
    assert state["jurisdiction"] == {"code": "IN", "name": "India"}
    assert any("call 112" in p for p in state["points"])
    assert seen == ["49.37.1.2"], "the user's address, not the proxy's"
    async with AsyncSessionLocal() as db:
        user = await db.scalar(select(User).where(User.id == user_id))
    assert (user.location_country, user.location_subdivision) == ("IN", "IN-KL"), "and it is kept"


async def test_a_known_location_is_not_looked_up_again(unlocated):
    headers, _, seen = unlocated
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as c:
        for _ in range(2):
            await c.get(f"{API}/healthcare/consent", headers={**headers, "X-Forwarded-For": "49.37.1.2"})
    assert seen == ["49.37.1.2"]


async def test_nowhere_to_look_up_is_not_an_error(unlocated):
    headers, _, seen = unlocated
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as c:
        res = await c.get(f"{API}/healthcare/consent", headers=headers)
    assert res.status_code == 200 and res.json()["jurisdiction"]["code"] == "baseline"


async def test_when_the_lookup_fails_the_time_zone_names_the_country(unlocated):
    # ipapi.co's free tier rate-limits; Chrome still reports Asia/Calcutta.
    headers, user_id, seen = unlocated
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as c:
        state = (
            await c.get(
                f"{API}/healthcare/consent",
                headers={**headers, "X-Forwarded-For": "203.0.113.9", "X-Client-Timezone": "Asia/Calcutta"},
            )
        ).json()
    assert state["jurisdiction"]["code"] == "IN"
    assert any("call 112" in p for p in state["points"])
    async with AsyncSessionLocal() as db:
        user = await db.scalar(select(User).where(User.id == user_id))
    assert user.location_country == "IN" and user.location_label == "India"
    assert user.location_updated_at is None, "left for the next refresh to replace with the finer answer"


async def test_a_made_up_time_zone_names_nothing(unlocated):
    headers, _, _ = unlocated
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as c:
        state = (
            await c.get(f"{API}/healthcare/consent", headers={**headers, "X-Client-Timezone": "Mars/Olympus"})
        ).json()
    assert state["jurisdiction"]["code"] == "baseline"


async def test_the_demo_falls_back_to_the_time_zone_too(monkeypatch):
    from app.services import geolocation
    from app.services.guest_demo import visitor_location

    async def nothing(ip):
        return None

    monkeypatch.setattr(geolocation, "resolve_cached", nothing)
    assert await visitor_location("203.0.113.9", "Asia/Kolkata") == ("IN", None)
    assert await visitor_location("203.0.113.9", None) == (None, None)
