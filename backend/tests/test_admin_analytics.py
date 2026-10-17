"""The admin panel's analytics (PostHog) and pinned views.

PostHog itself is never called here: its query endpoint is replaced with a
fake that records what it was asked, so these test our side of the contract -
what is sent, what is cached, how failures read, and what an admin can pin.
The pinned-view tests need a database and skip without one.
"""

import uuid

import httpx
import pytest
from fastapi import HTTPException

from app.api.admin_dashboard import _vet_hogql, _with_accounts
from app.core import config
from app.main import app
from app.services import posthog_analytics

API = "/api/v1"


def client() -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t")


@pytest.fixture
def connected(monkeypatch):
    monkeypatch.setattr(config.settings, "posthog_project_id", "304688")
    monkeypatch.setattr(config.settings, "posthog_query_key", "phx_test")
    monkeypatch.setattr(config.settings, "posthog_api_host", "https://eu.posthog.com")


@pytest.fixture
def fake_posthog(monkeypatch, connected):
    """Answers every query with `reply` and records each request."""
    calls: list[dict] = []
    state = {"status": 200, "reply": {"columns": ["n"], "results": [[7]]}}

    async def post(self, url, json=None, headers=None, **_):
        calls.append({"url": url, "json": json, "headers": headers})
        return httpx.Response(state["status"], json=state["reply"], request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    return calls, state


async def _clear_cache():
    try:
        keys = [k async for k in posthog_analytics._redis.scan_iter("posthog:query:*")]
        if keys:
            await posthog_analytics._redis.delete(*keys)
    except Exception:
        pass


class TestHogQLGate:
    def test_a_plain_select_over_events_passes(self):
        q = "SELECT event, count() FROM events WHERE timestamp >= now() - INTERVAL 7 DAY GROUP BY event"
        assert _vet_hogql(q + ";") == q

    @pytest.mark.parametrize(
        "query",
        [
            "SELECT 1; SELECT 2",
            "DELETE FROM events",
            "SELECT * FROM query_log",
            "SELECT * FROM system.tables",
            "SELECT * FROM events JOIN cohort_people ON 1 = 1",
        ],
    )
    def test_anything_else_is_refused(self, query):
        with pytest.raises(HTTPException):
            _vet_hogql(query)


class TestQueryClient:
    async def test_not_connected_says_so(self, monkeypatch):
        monkeypatch.setattr(config.settings, "posthog_query_key", None)
        with pytest.raises(posthog_analytics.AnalyticsUnavailable, match="not connected"):
            await posthog_analytics.run_hogql("SELECT 1 FROM events", name="t")

    async def test_it_asks_the_eu_project_with_the_key_and_caches(self, fake_posthog):
        calls, _ = fake_posthog
        await _clear_cache()
        query = f"SELECT count() FROM events WHERE event = 'x{uuid.uuid4().hex}'"
        first = await posthog_analytics.run_hogql(query, name="count")
        second = await posthog_analytics.run_hogql(query, name="count")
        assert first == second == (["n"], [[7]])
        assert len(calls) == 1, "the second ask should have come from the cache"
        assert calls[0]["url"] == "https://eu.posthog.com/api/projects/304688/query/"
        assert calls[0]["headers"]["Authorization"] == "Bearer phx_test"
        assert calls[0]["json"]["query"] == {"kind": "HogQLQuery", "query": query}

    @pytest.mark.parametrize(
        "status,words",
        [(401, "refused the query key"), (403, "refused the query key"), (429, "allowance"), (400, "could not run")],
    )
    async def test_failures_read_as_sentences(self, fake_posthog, status, words):
        _, state = fake_posthog
        state["status"] = status
        state["reply"] = {"detail": "nope"}
        await _clear_cache()
        with pytest.raises(posthog_analytics.AnalyticsUnavailable, match=words):
            await posthog_analytics.run_hogql(f"SELECT {uuid.uuid4().int % 1000} FROM events", name="t")


class TestOverview:
    async def test_it_assembles_the_views_from_four_queries(self, monkeypatch, connected):
        answers = {
            "totals": [[120, 30, 4]],
            "daily": [["2026-10-12", 10, 5, 8], ["2026-10-13", 20, 7, 9]],
            "events by detail": [
                ["guest_demo_opened", "", 40, 25],
                ["guest_demo_asked", "knowing", 30, 18],
                ["guest_demo_asked", "decision", 10, 6],
                ["guest_demo_limit", "", 5, 3],
                ["guest_demo_signup_clicked", "", 2, 2],
                ["gate_shown", "context", 9, 7],
                ["gate_shown", "refine", 3, 3],
                ["guest_demo_gated", "attach", 6, 5],
            ],
            # One visitor asked in both companions: 18 + 6 people by mode, but
            # 22 people asked.
            "people by event": [
                ["guest_demo_opened", 25],
                ["guest_demo_asked", 22],
                ["guest_demo_limit", 3],
                ["guest_demo_signup_clicked", 2],
            ],
        }
        asked: list[str] = []

        async def fake(query, *, name):
            asked.append(query)
            key = next(k for k in answers if name.startswith(k))
            return [], answers[key]

        monkeypatch.setattr(posthog_analytics, "run_hogql", fake)
        view = await posthog_analytics.overview(30)

        assert (view.events, view.visitors, view.signed_in_visitors) == (120, 30, 4)
        assert [d["visitors"] for d in view.by_day] == [10, 20]
        # Distinct visitors per step, not the sum of a breakdown.
        assert posthog_analytics.demo_funnel(view) == [
            {"label": "Opened the demo", "value": 25},
            {"label": "Asked a question", "value": 22},
            {"label": "Used the allowance", "value": 3},
            {"label": "Clicked sign up", "value": 2},
        ]
        assert view.series("gate_shown") == [
            {"label": "context", "value": 9},
            {"label": "refine", "value": 3},
        ]
        assert all("INTERVAL 30 DAY" in q for q in asked)


class TestAccounts:
    async def test_account_ids_are_shown_with_their_email(self):
        from sqlalchemy import delete

        from app.db.session import AsyncSessionLocal
        from app.models import User

        user_id = uuid.uuid4()
        email = f"acct-{user_id.hex[:8]}@example.com"
        try:
            async with AsyncSessionLocal() as db:
                db.add(User(id=user_id, email=email, password_hash="x"))
                await db.commit()
        except Exception:
            pytest.skip("no database available")
        try:
            columns, rows, label = await _with_accounts(
                ["distinct_id", "events"],
                [[str(user_id), 12], ["anon-abc", 3]],
                "distinct_id",
            )
            assert columns == ["distinct_id", "distinct_id_account", "events"]
            assert rows == [[str(user_id), email, 12], ["anon-abc", None, 3]]
            assert label == "distinct_id_account"
        finally:
            async with AsyncSessionLocal() as db:
                await db.execute(delete(User).where(User.id == user_id))
                await db.commit()


class TestAdminRoutes:
    async def _admin(self, c, monkeypatch) -> dict:
        email = f"admin-{uuid.uuid4().hex[:8]}@example.com"
        reg = await c.post(
            f"{API}/auth/register",
            json={"email": email, "password": "admin-password-123", "display_name": "Ad", "accepted_terms": True},
        )
        if reg.status_code >= 500:
            pytest.skip("no database available")
        monkeypatch.setattr(config.settings, "admin_emails", email)
        return {"Authorization": f"Bearer {reg.json()['access_token']}"}

    async def test_analytics_not_connected_is_a_state_not_an_error(self, monkeypatch):
        monkeypatch.setattr(config.settings, "posthog_query_key", None)
        async with client() as c:
            h = await self._admin(c, monkeypatch)
            try:
                res = await c.get(f"{API}/admin/analytics", headers=h)
                assert res.status_code == 200
                assert res.json()["configured"] is False
                refused = await c.post(f"{API}/admin/query", json={"question": "demo funnel", "source": "analytics"}, headers=h)
                assert refused.status_code == 400
            finally:
                await c.delete(f"{API}/auth/me", headers=h)

    async def test_a_pinned_view_is_rerun_live_and_can_be_unpinned(self, monkeypatch):
        async with client() as c:
            h = await self._admin(c, monkeypatch)
            try:
                pinned = await c.post(
                    f"{API}/admin/views",
                    json={
                        "title": "Accounts",
                        "source": "database",
                        "query": "SELECT count(*) AS accounts FROM users",
                        "chart": "table",
                    },
                    headers=h,
                )
                assert pinned.status_code == 201, pinned.text
                view = pinned.json()
                listed = (await c.get(f"{API}/admin/views", headers=h)).json()
                assert view["id"] in [v["id"] for v in listed]

                ran = await c.get(f"{API}/admin/views/{view['id']}/result", headers=h)
                assert ran.status_code == 200, ran.text
                assert ran.json()["columns"] == ["accounts"]
                assert ran.json()["rows"][0][0] >= 1

                gone = await c.delete(f"{API}/admin/views/{view['id']}", headers=h)
                assert gone.status_code == 204
            finally:
                await c.delete(f"{API}/auth/me", headers=h)

    @pytest.mark.parametrize(
        "source,query",
        [
            ("database", "DELETE FROM users"),
            ("database", "SELECT content FROM messages"),
            ("analytics", "SELECT * FROM query_log"),
        ],
    )
    async def test_pinning_checks_the_query_like_asking_does(self, monkeypatch, source, query):
        async with client() as c:
            h = await self._admin(c, monkeypatch)
            res = None
            try:
                res = await c.post(
                    f"{API}/admin/views",
                    json={"title": "Nope", "source": source, "query": query},
                    headers=h,
                )
                assert res.status_code == 400, res.text
            finally:
                # Even when the check under test is broken and the pin went
                # through - which is when this test fails - leave no tile behind.
                if res is not None and res.status_code == 201:
                    await c.delete(f"{API}/admin/views/{res.json()['id']}", headers=h)
                await c.delete(f"{API}/auth/me", headers=h)

    async def test_none_of_it_answers_a_non_admin(self, monkeypatch):
        async with client() as c:
            reg = await c.post(
                f"{API}/auth/register",
                json={
                    "email": f"plain-{uuid.uuid4().hex[:8]}@example.com",
                    "password": "plain-password-123",
                    "display_name": "P",
                    "accepted_terms": True,
                },
            )
            if reg.status_code >= 500:
                pytest.skip("no database available")
            h = {"Authorization": f"Bearer {reg.json()['access_token']}"}
            monkeypatch.setattr(config.settings, "admin_emails", "someone-else@example.com")
            try:
                for method, path in (
                    ("get", "/admin/analytics"),
                    ("get", "/admin/views"),
                    ("post", "/admin/views"),
                ):
                    res = await getattr(c, method)(f"{API}{path}", headers=h, **({"json": {}} if method == "post" else {}))
                    assert res.status_code == 404, f"{path} answered {res.status_code}"
            finally:
                await c.delete(f"{API}/auth/me", headers=h)
