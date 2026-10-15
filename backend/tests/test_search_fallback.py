"""When Tavily refuses the account, searches go elsewhere.

On 2026-10-15 the Tavily plan was over its monthly credits: every search
answered 432, came back empty, and - because the key was still set - nothing
fell back to the model's own search tool, so Finder answers had nothing to
check their claims against. No network here: Tavily is a fake that answers
with a status, and the fallback search is a fake that records being asked.
"""

import pytest

import app.services.web_research as wr


@pytest.fixture(autouse=True)
def _fresh_breaker(monkeypatch):
    monkeypatch.setattr(wr.settings, "tavily_api_key", "test-key")
    monkeypatch.setattr(wr, "_tavily_set_aside_until", 0.0)


def _tavily_answering(monkeypatch, status: int) -> dict:
    calls = {"n": 0}

    class _Response:
        status_code = status

        def raise_for_status(self):
            if status >= 400:
                raise RuntimeError(f"HTTP {status}")

        def json(self):
            return {"results": [{"url": "https://example.org/a", "title": "A", "content": "A passage."}]}

    class _Client:
        def __init__(self, *_, **__):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return False

        async def post(self, *_args, **_kwargs):
            calls["n"] += 1
            return _Response()

    monkeypatch.setattr(wr.httpx, "AsyncClient", _Client)
    return calls


def _fallback_answering(monkeypatch) -> list[str]:
    asked: list[str] = []

    async def fake_round(claim, guidance, max_uses=wr.RESEARCH_SEARCHES):
        asked.append(claim)
        return [wr.WebSource(url="https://fallback.example/b", title="B", excerpt="B passage.")]

    monkeypatch.setattr(wr, "_search_round", fake_round)
    return asked


class TestBreaker:
    @pytest.mark.parametrize("status", [401, 403, 429, 432, 433])
    async def test_an_account_refusal_sets_tavily_aside(self, monkeypatch, status):
        _tavily_answering(monkeypatch, status)
        assert wr.tavily_available()
        assert await wr._tavily_search("q") == []
        assert not wr.tavily_available()

    async def test_a_failed_query_does_not(self, monkeypatch):
        _tavily_answering(monkeypatch, 500)
        assert await wr._tavily_search("q") == []
        assert wr.tavily_available(), "a server error is one bad query, not a dead account"

    async def test_it_comes_back_after_the_cooldown(self, monkeypatch):
        _tavily_answering(monkeypatch, 432)
        await wr._tavily_search("q")
        assert not wr.tavily_available()
        monkeypatch.setattr(wr, "_tavily_set_aside_until", 0.0)
        assert wr.tavily_available()


class TestFallback:
    async def test_context_search_falls_back_in_the_same_turn(self, monkeypatch):
        _tavily_answering(monkeypatch, 432)
        asked = _fallback_answering(monkeypatch)
        sources = await wr.gather_context(["deepest point in the ocean"])
        assert [s.url for s in sources] == ["https://fallback.example/b"]
        assert asked == ["deepest point in the ocean"]

    async def test_claim_research_falls_back_and_stays_off_tavily(self, monkeypatch):
        tavily = _tavily_answering(monkeypatch, 432)
        asked = _fallback_answering(monkeypatch)

        async def supervise(_claim, sources):
            return {"verdict": "accept", "sources": [{"url": s.url, "score": 0.9} for s in sources]}

        monkeypatch.setattr(wr, "_supervise", supervise)
        result = await wr.research_claim("The Mariana Trench is about 11 km deep.")
        assert asked, "the claim was never searched after Tavily refused"
        assert any(s.url == "https://fallback.example/b" for s in result.sources)
        tried = tavily["n"]
        await wr.research_claim("Everest is 8,849 m tall.")
        assert tavily["n"] == tried, "Tavily was asked again inside its cooldown"

    async def test_a_working_tavily_is_still_used(self, monkeypatch):
        _tavily_answering(monkeypatch, 200)
        asked = _fallback_answering(monkeypatch)
        sources = await wr.gather_context(["anything"])
        assert [s.url for s in sources] == ["https://example.org/a"]
        assert asked == []
