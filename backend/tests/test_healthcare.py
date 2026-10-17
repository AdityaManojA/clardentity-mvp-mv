"""Healthcare's privacy standard, and the safety floor under every mode.

Each test is one promise the product makes on screen - "asks before it
answers", "not saved here", "never used to build your profile", "you can
withdraw this" - tested against the thing that would break it. The
regulation table is replaced with one these tests control, so they are about
what the product does with a jurisdiction's rules, not about any one
country's. Needs a database (and Redis for the demo); skipped without them.
"""

import json
import uuid

import httpx
import pytest
from sqlalchemy import delete, select

from app.api import healthcare as healthcare_api
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.main import app
from app.models import Conversation, Message, User, Workspace, WorkspaceMember
from app.services import regulations, safety

API = "/api/v1"

HEALTH = {
    "profiles": {
        "baseline": {
            "name": "your location",
            "consent_age": 18,
            "storage": "persist",
            "laws": [{"name": "Baseline law"}],
            "healthcare_rules": ["Never diagnose."],
        },
        "XP": {"name": "Persistland", "laws": [{"name": "Persist Act", "url": "https://example.org/pa"}]},
        "XT": {
            "name": "Transientland",
            "storage": "transient",
            "storage_reason": "Health data may not be stored abroad.",
            "consent_age": 21,
        },
        "XU": {"name": "Unavailableland", "storage": "unavailable", "storage_reason": "Not offered."},
    }
}
EMERGENCY = {
    "XP": {"country": "Persistland", "emergency": "911", "ambulance": "911",
           "crisis_line": {"name": "Persist Lifeline", "number": "988", "hours": "24/7"}, "poison": ""},
    "XT": {"country": "Transientland", "emergency": "999", "ambulance": "998",
           "crisis_line": {}, "poison": ""},
}


@pytest.fixture(autouse=True)
def table(monkeypatch):
    monkeypatch.setattr(regulations, "_health", lambda: HEALTH)
    monkeypatch.setattr(regulations, "_emergency", lambda: EMERGENCY)


def client() -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t")


async def _account(country: str = "XP", *, consented: bool = False):
    """A user in `country` with one workspace and two conversations (one
    temporary). Returns (headers, user_id, kept_id, temporary_id)."""
    email = f"health-{uuid.uuid4().hex[:8]}@example.com"
    password = "health-password-123"
    try:
        async with AsyncSessionLocal() as db:
            user = User(
                email=email,
                password_hash=hash_password(password),
                location_country=country,
                health_consent={"version": healthcare_api.CONSENT_VERSION, "at": "x"} if consented else None,
            )
            db.add(user)
            await db.flush()
            ws = Workspace(owner_id=user.id, name="t")
            db.add(ws)
            await db.flush()
            db.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role="owner"))
            kept = Conversation(workspace_id=ws.id, title="t")
            temp = Conversation(workspace_id=ws.id, title="t", temporary=True)
            db.add_all([kept, temp])
            await db.commit()
            ids = (user.id, kept.id, temp.id)
    except Exception as exc:  # noqa: BLE001
        if "connect" not in str(exc).lower() and "database" not in str(exc).lower():
            raise
        pytest.skip("no database available")
    async with client() as c:
        login = await c.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['access_token']}"}, *ids


async def _cleanup(user_id: uuid.UUID) -> None:
    async with AsyncSessionLocal() as db:
        ws_ids = select(Workspace.id).where(Workspace.owner_id == user_id)
        convo_ids = select(Conversation.id).where(Conversation.workspace_id.in_(ws_ids))
        await db.execute(delete(Message).where(Message.conversation_id.in_(convo_ids)))
        await db.execute(delete(Conversation).where(Conversation.workspace_id.in_(ws_ids)))
        await db.execute(delete(WorkspaceMember).where(WorkspaceMember.user_id == user_id))
        await db.execute(delete(Workspace).where(Workspace.owner_id == user_id))
        await db.execute(delete(User).where(User.id == user_id))
        await db.commit()


async def _say(conversation_id: uuid.UUID, text: str, mode: str) -> None:
    async with AsyncSessionLocal() as db:
        db.add(Message(conversation_id=conversation_id, role="user", content=text, mode_used=mode))
        await db.commit()


class TestConsent:
    async def test_it_says_what_will_happen_where_the_person_is(self):
        headers, user_id, *_ = await _account("XT")
        try:
            async with client() as c:
                state = (await c.get(f"{API}/healthcare/consent", headers=headers)).json()
            assert state["given"] is False
            assert state["jurisdiction"] == {"code": "XT", "name": "Transientland"}
            assert state["storage"] == "transient" and state["available"] is True
            assert state["consent_age"] == 21
            assert any("temporary chat" in p for p in state["points"])
            assert any("call 999" in p for p in state["points"]), "the emergency number is the local one"
            assert [law["name"] for law in state["laws"]] == ["Baseline law"]
        finally:
            await _cleanup(user_id)

    async def test_it_is_explicit_current_and_recorded(self):
        headers, user_id, *_ = await _account("XP")
        try:
            async with client() as c:
                no_age = await c.post(
                    f"{API}/healthcare/consent",
                    json={"version": healthcare_api.CONSENT_VERSION, "age_confirmed": False},
                    headers=headers,
                )
                assert no_age.status_code == 400
                stale = await c.post(
                    f"{API}/healthcare/consent", json={"version": "2020-01-01", "age_confirmed": True},
                    headers=headers,
                )
                assert stale.status_code == 409
                given = await c.post(
                    f"{API}/healthcare/consent",
                    json={"version": healthcare_api.CONSENT_VERSION, "age_confirmed": True},
                    headers=headers,
                )
                assert given.status_code == 200 and given.json()["given"] is True
            async with AsyncSessionLocal() as db:
                user = await db.get(User, user_id)
                assert user.health_consent["version"] == healthcare_api.CONSENT_VERSION
                assert user.health_consent["jurisdiction"] == "XP"
                assert user.health_consent["age_confirmed"] is True
        finally:
            await _cleanup(user_id)

    async def test_a_new_consent_text_asks_again(self, monkeypatch):
        headers, user_id, *_ = await _account("XP", consented=True)
        try:
            monkeypatch.setattr(healthcare_api, "CONSENT_VERSION", "2099-01-01")
            async with client() as c:
                state = (await c.get(f"{API}/healthcare/consent", headers=headers)).json()
            assert state["given"] is False
        finally:
            await _cleanup(user_id)

    async def test_not_offered_where_it_is_not_allowed(self):
        headers, user_id, *_ = await _account("XU")
        try:
            async with client() as c:
                state = (await c.get(f"{API}/healthcare/consent", headers=headers)).json()
                assert state["available"] is False
                res = await c.post(
                    f"{API}/healthcare/consent",
                    json={"version": healthcare_api.CONSENT_VERSION, "age_confirmed": True},
                    headers=headers,
                )
            assert res.status_code == 403
        finally:
            await _cleanup(user_id)


class TestTheServerHoldsTheLock:
    """A lock that lives only in the client is not one: each refusal comes
    before anything is saved or any model is called."""

    async def _send(self, headers, convo_id, mode="healthcare"):
        async with client() as c:
            return await c.post(
                f"{API}/chat/{convo_id}/messages",
                json={"content": "What does a high LDL mean?", "mode": mode},
                headers=headers,
            )

    async def _saved(self, convo_id) -> int:
        async with AsyncSessionLocal() as db:
            return len((await db.execute(select(Message.id).where(Message.conversation_id == convo_id))).all())

    async def test_no_consent_no_answer(self):
        headers, user_id, kept, _ = await _account("XP")
        try:
            res = await self._send(headers, kept)
            assert res.status_code == 428
            assert await self._saved(kept) == 0
        finally:
            await _cleanup(user_id)

    async def test_unavailable_is_refused_even_with_consent(self):
        headers, user_id, kept, temp = await _account("XU", consented=True)
        try:
            assert (await self._send(headers, kept)).status_code == 403
            assert (await self._send(headers, temp)).status_code == 403
        finally:
            await _cleanup(user_id)

    async def test_transient_places_only_answer_in_a_temporary_chat(self):
        headers, user_id, kept, temp = await _account("XT", consented=True)
        try:
            res = await self._send(headers, kept)
            assert res.status_code == 409
            assert await self._saved(kept) == 0
            async with AsyncSessionLocal() as db:
                user = await db.get(User, user_id)
                temporary = await db.get(Conversation, temp)
                from app.api.chat import _require_healthcare_ready

                _require_healthcare_ready("healthcare", user, temporary)  # does not raise
        finally:
            await _cleanup(user_id)

    def test_other_modes_are_untouched(self):
        from app.api.chat import _require_healthcare_ready

        user = User(email="x@example.com", password_hash="x", location_country="XU")
        kept = Conversation(title="t", temporary=False)
        for mode in ("knowing", "guidance", "decision"):
            _require_healthcare_ready(mode, user, kept)  # does not raise

    async def test_a_call_transcript_is_health_information_too(self):
        headers, user_id, kept, _ = await _account("XT", consented=True)
        try:
            async with client() as c:
                res = await c.post(
                    f"{API}/chat/{kept}/call-transcript",
                    json={"mode": "healthcare", "turns": [{"role": "user", "content": "My chest hurts"}]},
                    headers=headers,
                )
            assert res.status_code == 409, res.text
            assert await self._saved(kept) == 0
        finally:
            await _cleanup(user_id)


class TestWithdrawing:
    async def test_it_stops_healthcare_and_can_take_the_chats_with_it(self):
        headers, user_id, kept, temp = await _account("XP", consented=True)
        try:
            async with AsyncSessionLocal() as db:
                ws_id = (await db.get(Conversation, kept)).workspace_id
                other = Conversation(workspace_id=ws_id, title="other")
                db.add(other)
                await db.commit()
                other_id = other.id
            await _say(kept, "My knee hurts after running", "healthcare")
            await _say(kept, "Also, what is the capital of Peru?", "knowing")
            await _say(other_id, "Plan my week", "decision")

            async with client() as c:
                res = await c.post(
                    f"{API}/healthcare/consent/withdraw",
                    json={"delete_conversations": True},
                    headers=headers,
                )
            assert res.status_code == 200
            body = res.json()
            assert body["given"] is False and body["deleted_conversations"] == 1
            async with AsyncSessionLocal() as db:
                assert await db.get(Conversation, kept) is None, "the whole chat goes, not just the turn"
                assert await db.get(Conversation, other_id) is not None
                assert (await db.get(User, user_id)).health_consent is None
            assert (await TestTheServerHoldsTheLock()._send(headers, temp)).status_code == 428
        finally:
            await _cleanup(user_id)

    async def test_withdrawing_always_deletes_even_when_an_old_client_says_not_to(self):
        # India's DPDP Act s.8(7) and GDPR Art. 17(1)(b): data held on consent
        # goes when the consent does. Clients before 2026-10-16 sent this flag.
        headers, user_id, kept, _ = await _account("XP", consented=True)
        try:
            await _say(kept, "My knee hurts", "healthcare")
            async with client() as c:
                res = await c.post(
                    f"{API}/healthcare/consent/withdraw", json={"delete_conversations": False}, headers=headers
                )
                bare = await c.post(f"{API}/healthcare/consent/withdraw", headers=headers)
            assert res.json()["deleted_conversations"] == 1
            assert bare.status_code == 200, "a body is not required"
            async with AsyncSessionLocal() as db:
                assert await db.get(Conversation, kept) is None
        finally:
            await _cleanup(user_id)


class TestNeverForProfiling:
    async def test_health_messages_are_not_evidence(self):
        from app.services.profile_service import gather_evidence

        headers, user_id, kept, _ = await _account("XP", consented=True)
        try:
            await _say(kept, "I was diagnosed with diabetes last year", "healthcare")
            await _say(kept, "I work as a structural engineer in Kochi", "knowing")
            async with AsyncSessionLocal() as db:
                evidence, total = await gather_evidence(db, user_id)
            assert "structural engineer" in evidence
            assert "diabetes" not in evidence
            assert total == 1
        finally:
            await _cleanup(user_id)


class TestTheDemo:
    async def test_health_turns_stay_in_the_demo(self, monkeypatch):
        from app.api import guest as guest_api

        async def fake_name(question, gist, fallback):
            return "t"

        monkeypatch.setattr(guest_api, "name_conversation", fake_name)
        headers, user_id, *_ = await _account("XP")
        try:
            async with client() as c:
                only_health = await c.post(
                    f"{API}/guest/import",
                    headers=headers,
                    json={"mode": "healthcare", "turns": [
                        {"role": "user", "content": "Is 140/90 high?"},
                        {"role": "assistant", "content": "It is in the high range."},
                    ]},
                )
                assert only_health.status_code == 422
                mixed = await c.post(
                    f"{API}/guest/import",
                    headers=headers,
                    json={"mode": "knowing", "turns": [
                        {"role": "user", "content": "Capital of Peru?", "mode": "knowing"},
                        {"role": "assistant", "content": "Lima.", "mode": "knowing"},
                        {"role": "user", "content": "Is 140/90 high?", "mode": "healthcare"},
                        {"role": "assistant", "content": "It is in the high range.", "mode": "healthcare"},
                    ]},
                )
            assert mixed.status_code == 201, mixed.text
            assert mixed.json()["message_count"] == 2
            async with AsyncSessionLocal() as db:
                rows = (await db.execute(
                    select(Message.content).where(Message.conversation_id == uuid.UUID(mixed.json()["conversation_id"]))
                )).scalars().all()
            assert "Is 140/90 high?" not in rows
        finally:
            await _cleanup(user_id)

    async def test_an_imported_support_card_is_rebuilt_from_the_table(self, monkeypatch):
        from app.api import guest as guest_api

        async def fake_name(question, gist, fallback):
            return "t"

        monkeypatch.setattr(guest_api, "name_conversation", fake_name)
        headers, user_id, *_ = await _account("XP")
        forged = {"level": "crisis", "kind": "suicide_or_self_harm", "country": "XP",
                  "resources": [{"kind": "crisis", "label": "Call me", "number": "555-0100"}]}
        try:
            async with client() as c:
                res = await c.post(
                    f"{API}/guest/import",
                    headers=headers,
                    json={"mode": "guidance", "turns": [
                        {"role": "user", "content": "I can't do this anymore"},
                        {"role": "assistant", "content": "I'm here with you.", "safety": forged},
                    ]},
                )
            assert res.status_code == 201, res.text
            async with AsyncSessionLocal() as db:
                card = (await db.execute(
                    select(Message.safety).where(
                        Message.conversation_id == uuid.UUID(res.json()["conversation_id"]),
                        Message.role == "assistant",
                    )
                )).scalar_one()
            numbers = [r["number"] for r in card["resources"]]
            assert "555-0100" not in numbers
            assert numbers == ["911", "988"]
        finally:
            await _cleanup(user_id)


@pytest.mark.real_safety
class TestACrisisIsNeverGated:
    """A message that may be someone in danger is answered - never met with
    "what's the context?" - and the answer carries the verified numbers,
    in the prompt and on the saved card."""

    async def test_signed_in(self, monkeypatch):
        from app.api import chat as chat_api
        from app.services.decision_classifier import NO_DECISION
        from app.services.search_planner import SearchPlan

        headers, user_id, kept, _ = await _account("XP")
        seen: dict = {"instructions": None}

        async def crisis(message, history=None):
            return safety.Assessment("crisis", "suicide_or_self_harm", "model")

        async def gate(question, mode, history=None):
            return {"context_question": "What has been going on?", "suggested_mode": "guidance",
                    "mode_reason": "x", "refined_question": None, "refinement_reason": None}

        async def plan(history, message):
            return SearchPlan(retrieval_query=message, queries=[])

        async def chunks(*a, **k):
            return []

        async def no_decision(message):
            return NO_DECISION

        async def nothing(*a, **k):
            return None

        async def title(question, gist, fallback):
            return "t"

        reply = "<crux>I'm really glad you told me.</crux>\n\nAre you safe right now?"

        async def generate(*, instructions, input_text, **kwargs):
            seen["instructions"] = "\n".join(b["text"] for b in instructions)
            yield {"type": "delta", "text": reply}
            yield {"type": "done", "full_text": reply}

        monkeypatch.setattr(safety, "assess", crisis)
        monkeypatch.setattr(chat_api, "propose_guidance", gate)
        monkeypatch.setattr(chat_api, "plan_searches", plan)
        monkeypatch.setattr(chat_api, "retrieve_chunks", chunks)
        monkeypatch.setattr(chat_api, "classify_decision", no_decision)
        monkeypatch.setattr(chat_api, "wanted_image", nothing)
        monkeypatch.setattr(chat_api, "name_conversation", title)
        monkeypatch.setattr(chat_api, "capture_stated_facts", nothing)
        monkeypatch.setattr(chat_api, "stream_generation", generate)
        try:
            async with client() as c:
                res = await c.post(
                    f"{API}/chat/{kept}/messages",
                    json={"content": "I don't want to be here anymore", "mode": "knowing"},
                    headers=headers,
                )
            body = res.text
            assert "context_question" not in body and "mode_suggestion" not in body
            assert "event: safety" in body
            assert seen["instructions"] and "SAFETY - this comes before everything else" in seen["instructions"]
            assert "- Persist Lifeline: 988 (24/7)" in seen["instructions"]
            async with AsyncSessionLocal() as db:
                card = (await db.execute(
                    select(Message.safety).where(Message.conversation_id == kept, Message.role == "assistant")
                )).scalar_one()
            assert card["level"] == "crisis"
            assert [r["number"] for r in card["resources"]] == ["911", "988"]
        finally:
            await _cleanup(user_id)


    async def test_signed_in_a_picture_request_in_crisis_gets_words(self, monkeypatch):
        """Co-Creative: a picture-only request wrote no answer at all, so a
        person in crisis got the support card above an empty reply, and the
        picture (never collected on the crisis path) was lost."""
        from datetime import UTC, datetime

        from app.api import chat as chat_api
        from app.services.decision_classifier import NO_DECISION
        from app.services.image_generation import ImageRequest
        from app.services.search_planner import SearchPlan

        headers, user_id, kept, _ = await _account("XP")
        async with AsyncSessionLocal() as db:
            user = await db.get(User, user_id)
            user.preview_unlocked_at = datetime.now(UTC)
            await db.commit()
        seen: dict = {"instructions": None}
        drawn: list[str] = []

        async def crisis(message, history=None):
            return safety.Assessment("crisis", "suicide_or_self_harm", "model")

        async def gate(question, mode, history=None):
            return None

        async def plan(history, message):
            return SearchPlan(retrieval_query=message, queries=[])

        async def chunks(*a, **k):
            return []

        async def no_decision(message):
            return NO_DECISION

        async def wants(message, history=None, **sources):
            return ImageRequest(prompt="a dark empty room", only=True)

        async def draw(prompt, owner, references=None):
            drawn.append(prompt)
            return {"id": str(uuid.uuid4()), "owner": str(owner), "prompt": prompt}

        async def nothing(*a, **k):
            return None

        async def title(question, gist, fallback):
            return "t"

        reply = "<crux>I'm really glad you told me.</crux>\n\nAre you safe right now?"

        async def generate(*, instructions, input_text, **kwargs):
            seen["instructions"] = "\n".join(b["text"] for b in instructions)
            yield {"type": "delta", "text": reply}
            yield {"type": "done", "full_text": reply}

        monkeypatch.setattr(safety, "assess", crisis)
        monkeypatch.setattr(chat_api, "propose_guidance", gate)
        monkeypatch.setattr(chat_api, "plan_searches", plan)
        monkeypatch.setattr(chat_api, "retrieve_chunks", chunks)
        monkeypatch.setattr(chat_api, "classify_decision", no_decision)
        monkeypatch.setattr(chat_api, "wanted_image", wants)
        monkeypatch.setattr(chat_api, "generate_image", draw)
        monkeypatch.setattr(chat_api, "name_conversation", title)
        monkeypatch.setattr(chat_api, "capture_stated_facts", nothing)
        monkeypatch.setattr(chat_api, "stream_generation", generate)
        try:
            async with client() as c:
                res = await c.post(
                    f"{API}/chat/{kept}/messages",
                    json={"content": "draw how I feel, I don't want to be here anymore", "mode": "creative"},
                    headers=headers,
                )
            assert res.status_code == 200, res.text
            assert drawn == [], "a picture was made for someone in crisis"
            assert seen["instructions"] and "SAFETY - this comes before everything else" in seen["instructions"]
            async with AsyncSessionLocal() as db:
                answer = (await db.execute(
                    select(Message).where(Message.conversation_id == kept, Message.role == "assistant")
                )).scalar_one()
            assert answer.content and "safe right now" in answer.content
        finally:
            await _cleanup(user_id)


class TestTheDemoAsksFirst:
    async def _ask(self, **body):
        payload = {"session_id": str(uuid.uuid4()), "history": [], **body}
        async with client() as c:
            return await c.post(f"{API}/guest/chat", json=payload)

    async def _redis(self):
        from app.services.guest_demo import _redis

        try:
            await _redis.ping()
        except Exception:  # noqa: BLE001
            pytest.skip("no redis available")

    async def test_consent_card_before_any_model_call(self, monkeypatch):
        from app.api import guest as guest_api

        await self._redis()
        called = []

        async def where(address, timezone=None):
            return "XT", None

        async def guidance(*a, **k):
            called.append("gate")

        monkeypatch.setattr(guest_api, "visitor_location", where)
        monkeypatch.setattr(guest_api, "propose_guidance", guidance)
        res = await self._ask(message="What does a high LDL mean?", mode="healthcare")
        assert "event: health_consent" in res.text
        data = next(
            json.loads(line[len("data: "):]) for line in res.text.splitlines()
            if line.startswith("data: ") and "jurisdiction" in line
        )
        assert data["jurisdiction"]["name"] == "Transientland"
        assert called == []

    async def test_unavailable_is_said_not_answered(self, monkeypatch):
        from app.api import guest as guest_api

        await self._redis()

        async def where(address, timezone=None):
            return "XU", None

        monkeypatch.setattr(guest_api, "visitor_location", where)
        res = await self._ask(
            message="What does a high LDL mean?", mode="healthcare",
            health_consent=healthcare_api.CONSENT_VERSION,
        )
        assert "isn't available in Unavailableland" in res.text
        assert "event: health_consent" not in res.text


class TestLegacyModes:
    async def test_old_tabs_sending_old_modes_get_guidance(self):
        headers, user_id, kept, _ = await _account("XP")
        try:
            async with client() as c:
                res = await c.post(
                    f"{API}/chat/{kept}/call-transcript",
                    json={"mode": "therapy", "turns": [{"role": "user", "content": "Hello"}]},
                    headers=headers,
                )
            assert res.status_code == 201, res.text
            async with AsyncSessionLocal() as db:
                modes = (await db.execute(
                    select(Message.mode_used).where(Message.conversation_id == kept)
                )).scalars().all()
            assert set(modes) == {"guidance"}
        finally:
            await _cleanup(user_id)

    def test_the_mapping(self):
        from app.models.conversation import COGNITIVE_MODES, current_mode

        assert current_mode("mentoring") == current_mode("therapy") == "guidance"
        assert current_mode("healthcare") == "healthcare" and current_mode(None) is None
        assert "mentoring" not in COGNITIVE_MODES and "therapy" not in COGNITIVE_MODES
        assert {"guidance", "healthcare"} <= set(COGNITIVE_MODES)

