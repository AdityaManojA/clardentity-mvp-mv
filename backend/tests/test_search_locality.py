"""Where a search looks, and how recent it is willing to be.

No network. What these pin down is that the two settings reach the request
body at all - they were simply never sent, which is why a question about a
Kerala price list competed with the global web and a question about this
week's news came back with newspaper front pages.
"""

import app.services.web_research as wr


class _Response:
    def __init__(self, captured):
        self._captured = captured

    def raise_for_status(self):
        return None

    def json(self):
        return {"results": []}


class _Client:
    """Captures the body instead of sending it."""

    captured: dict = {}

    def __init__(self, *_, **__):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return False

    async def post(self, _url, json=None, headers=None):
        _Client.captured = json or {}
        return _Response(_Client.captured)


async def _body(monkeypatch, **kwargs) -> dict:
    monkeypatch.setattr(wr.settings, "tavily_api_key", "test-key")
    monkeypatch.setattr(wr.httpx, "AsyncClient", _Client)
    await wr._tavily_search("a query", **kwargs)
    return _Client.captured


class TestCountryBias:
    async def test_absent_by_default(self, monkeypatch):
        assert "country" not in await _body(monkeypatch)

    async def test_sent_when_known(self, monkeypatch):
        assert (await _body(monkeypatch, country="india"))["country"] == "india"

    def test_codes_map_to_names_tavily_takes(self):
        assert wr.country_name("IN") == "india"
        assert wr.country_name("in") == "india"

    def test_unknown_code_means_no_bias(self):
        # Better a global search than a rejected request or a wrong country.
        for code in (None, "", "zz", "xx1"):
            assert wr.country_name(code) is None


class TestNewsIndex:
    async def test_general_search_by_default(self, monkeypatch):
        body = await _body(monkeypatch)
        assert "topic" not in body
        assert "days" not in body

    async def test_news_switches_index_and_window(self, monkeypatch):
        body = await _body(monkeypatch, news=True)
        assert body["topic"] == "news"
        # Wide enough for "this week", narrow enough to keep last year's
        # version of the same story out.
        assert body["days"] == 14
