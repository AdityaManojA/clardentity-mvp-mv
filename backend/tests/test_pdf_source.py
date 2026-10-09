"""Fetching a PDF that a web search turned up.

Two things to pin. The first is the point of the feature: a table in the
document comes back as rows rather than as the run of numbers a search
engine's text-layer excerpt gives.

The second is the reason this code is written the long way round. The URL
arrives from a search engine, so fetching it is a server-side request
driven by content nobody here wrote - the classic way to make a backend
knock on doors inside its own network. Those tests matter more than the
first one.
"""

import pytest

from app.services import pdf_source
from app.services.pdf_source import RefusedURL, looks_like_pdf, tables_from, vet


class TestItWillNotKnockOnInternalDoors:
    def test_only_https(self):
        for url in (
            "http://example.com/a.pdf",
            "file:///etc/passwd",
            "gopher://example.com/a.pdf",
            "ftp://example.com/a.pdf",
            "",
        ):
            with pytest.raises(RefusedURL):
                vet(url)

    def test_private_and_loopback_addresses_are_refused(self, monkeypatch):
        # Resolution is stubbed because the point is the decision, not DNS.
        def resolves_to(address):
            return lambda host, port: [(2, 1, 6, "", (address, 0))]

        for address in (
            "127.0.0.1",        # loopback
            "10.0.0.5",         # private
            "192.168.1.1",      # private
            "172.16.0.9",       # private
            "169.254.169.254",  # the cloud metadata endpoint
            "0.0.0.0",          # unspecified
            "224.0.0.1",        # multicast
        ):
            monkeypatch.setattr(pdf_source.socket, "getaddrinfo", resolves_to(address))
            with pytest.raises(RefusedURL):
                vet("https://anything.example/a.pdf")

    def test_one_public_answer_does_not_excuse_a_private_one(self, monkeypatch):
        # A name that returns both is a deliberate way past a check that
        # looks only at the first address.
        def split_horizon(host, port):
            return [
                (2, 1, 6, "", ("93.184.216.34", 0)),
                (2, 1, 6, "", ("10.1.2.3", 0)),
            ]

        monkeypatch.setattr(pdf_source.socket, "getaddrinfo", split_horizon)
        with pytest.raises(RefusedURL):
            vet("https://split.example/a.pdf")

    def test_a_public_address_is_allowed(self, monkeypatch):
        monkeypatch.setattr(
            pdf_source.socket,
            "getaddrinfo",
            lambda host, port: [(2, 1, 6, "", ("93.184.216.34", 0))],
        )
        assert vet("https://example.com/prices.pdf").endswith("prices.pdf")

    def test_a_name_that_does_not_resolve_is_refused(self, monkeypatch):
        import socket as real_socket

        def fails(host, port):
            raise real_socket.gaierror("nope")

        monkeypatch.setattr(pdf_source.socket, "getaddrinfo", fails)
        with pytest.raises(RefusedURL):
            vet("https://nowhere.example/a.pdf")


class TestWhichResultsAreWorthFetching:
    def test_only_things_that_look_like_a_pdf(self):
        assert looks_like_pdf("https://bevco.kerala.gov.in/price-list.pdf")
        assert looks_like_pdf("https://x.example/A/B/LIST.PDF")
        assert not looks_like_pdf("https://x.example/prices")
        assert not looks_like_pdf("https://x.example/prices.html")
        assert not looks_like_pdf("not a url at all")


class TestTheTableComesBackAsRows:
    def _column_ordered_pdf(self) -> bytes:
        fpdf = pytest.importorskip("fpdf", reason="fpdf2 builds the fixture")
        rows = [
            ("Brand", "Volume", "Price"),
            ("Jawan Rum", "750 ml", "640"),
            ("Old Monk", "750 ml", "780"),
        ]
        pdf = fpdf.FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", size=11)
        # Column by column, which is how the text layer gets scrambled.
        for column, (x, width) in enumerate(((10, 70), (80, 40), (120, 30))):
            for index, row in enumerate(rows):
                pdf.set_xy(x, 20 + index * 8)
                pdf.cell(width, 8, row[column], border=1)
        return bytes(pdf.output())

    def test_rows_keep_their_columns(self):
        text = tables_from(self._column_ordered_pdf())
        assert "Jawan Rum | 750 ml | 640" in text
        assert "Old Monk | 750 ml | 780" in text

    def test_a_pdf_with_no_table_yields_nothing_rather_than_noise(self):
        fpdf = pytest.importorskip("fpdf")
        pdf = fpdf.FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", size=12)
        pdf.cell(0, 10, "A sentence with no table in it.")
        # Empty, so the caller keeps the search engine's own excerpt rather
        # than replacing it with nothing.
        assert tables_from(bytes(pdf.output())) == ""


class TestFailureKeepsTheOriginalExcerpt:
    async def test_a_refused_address_returns_none(self, monkeypatch):
        monkeypatch.setattr(
            pdf_source.socket,
            "getaddrinfo",
            lambda host, port: [(2, 1, 6, "", ("127.0.0.1", 0))],
        )
        assert await pdf_source.table_excerpt("https://evil.example/a.pdf", 500) is None

    async def test_a_fetch_that_blows_up_returns_none(self, monkeypatch):
        async def explode(url):
            raise RuntimeError("network on fire")

        monkeypatch.setattr(pdf_source, "_read", explode)
        assert await pdf_source.table_excerpt("https://example.com/a.pdf", 500) is None


class TestTheSearchResultsGetTheBetterExcerpt:
    """The wiring: a PDF result in a search gets its tables read, and
    everything else is left exactly as the search engine returned it."""

    def _sources(self):
        from app.services.web_research import WebSource

        return [
            WebSource(
                url="https://bevco.example/price-list.pdf",
                title="Price list",
                excerpt="Price 640 780 210 Jawan Old Honey",
                publisher="bevco.example",
                date=None,
            ),
            WebSource(
                url="https://news.example/story",
                title="A story",
                excerpt="Prices rose this week.",
                publisher="news.example",
                date=None,
            ),
        ]

    async def test_the_pdf_excerpt_is_replaced_and_the_html_one_is_not(self, monkeypatch):
        from app.services import web_research

        async def fake_excerpt(url, limit):
            assert url.endswith(".pdf"), "only the pdf should be fetched"
            return "Jawan Rum | 750 ml | 640\nOld Monk | 750 ml | 780"

        monkeypatch.setattr(web_research.pdf_source, "table_excerpt", fake_excerpt)
        out = await web_research._read_any_pdf_tables(self._sources())

        assert "Jawan Rum | 750 ml | 640" in out[0].excerpt
        assert out[0].url == "https://bevco.example/price-list.pdf"
        assert out[0].title == "Price list", "only the excerpt changes"
        assert out[1].excerpt == "Prices rose this week.", "the html result is untouched"

    async def test_a_pdf_with_no_tables_keeps_what_the_search_gave_us(self, monkeypatch):
        from app.services import web_research

        async def nothing(url, limit):
            return None

        monkeypatch.setattr(web_research.pdf_source, "table_excerpt", nothing)
        out = await web_research._read_any_pdf_tables(self._sources())
        assert out[0].excerpt == "Price 640 780 210 Jawan Old Honey"

    async def test_one_exploding_fetch_does_not_lose_the_results(self, monkeypatch):
        from app.services import web_research

        async def explode(url, limit):
            raise RuntimeError("off a cliff")

        monkeypatch.setattr(web_research.pdf_source, "table_excerpt", explode)
        out = await web_research._read_any_pdf_tables(self._sources())
        # Both sources still there, both with their original excerpts: a
        # failed improvement must never cost the answer its evidence.
        assert len(out) == 2
        assert out[0].excerpt == "Price 640 780 210 Jawan Old Honey"
