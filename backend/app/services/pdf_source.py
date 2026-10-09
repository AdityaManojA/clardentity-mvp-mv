"""Reading a PDF that a web search turned up.

Search engines summarise a PDF the way they summarise a page: they pull its
text layer. For a document whose substance is a table - a price list, a
tariff schedule, a results sheet - that produces a run of numbers detached
from the things they are the price of, and a search excerpt made of it says
nothing. Kerala alcohol prices are the case that raised this: Bevco
publishes them as PDF tables.

So when a result is a PDF, it is worth fetching the file and reading its
tables properly. The cost is one request and a second or two; the gain is
an excerpt where a figure still sits beside its label.

Fetching a URL that arrived from a search engine is a server-side request
driven by content nobody here wrote, which is the classic way to make a
backend knock on doors inside its own network. Everything below exists to
make that specific thing not work:

  - https only, so no file:// and no gopher:// curiosities
  - every resolved address checked, and anything private, loopback,
    link-local, multicast or reserved refused
  - redirects followed by hand, each hop checked the same way, because a
    public URL that 302s to 169.254.169.254 is the whole attack
  - a byte ceiling enforced while streaming, not after
  - a short timeout, since this sits inside a turn somebody is waiting on
"""

import asyncio
import io
import ipaddress
import logging
import socket
from urllib.parse import urlparse

import httpx
import pdfplumber

logger = logging.getLogger("clardentity.pdf_source")

#: A liquor price list is a few hundred KB. Ten megabytes is far more than
#: any document worth quoting in a chat answer and small enough that a
#: hostile link cannot fill a 512MB container.
MAX_BYTES = 10 * 1024 * 1024
#: Inside a turn the user is watching, so this is a budget rather than a
#: patience test. A document that will not arrive in this long is one we do
#: without.
TIMEOUT_SECONDS = 12.0
MAX_REDIRECTS = 3
#: Table detection walks the ruling lines on a page. Enough pages to cover
#: a price list, few enough that a thousand-page annual report does not
#: hold the turn open.
MAX_PAGES = 12


class RefusedURL(Exception):
    """The address is not one this server will fetch."""


def _check_host(host: str | None) -> list[str]:
    """Every address this hostname resolves to, or refuse.

    All of them, not the first: a name that returns one public address and
    one private one is a deliberate way through a check that only looks at
    the first answer.
    """
    if not host:
        raise RefusedURL("no host")
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror as exc:
        raise RefusedURL(f"cannot resolve {host}") from exc

    addresses = sorted({info[4][0] for info in infos})
    for address in addresses:
        try:
            ip = ipaddress.ip_address(address)
        except ValueError as exc:
            raise RefusedURL(f"unreadable address for {host}") from exc
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise RefusedURL(f"{host} resolves to {ip}, which is not public")
    return addresses


def vet(url: str) -> str:
    """The URL, if this server will fetch it. Raises RefusedURL otherwise."""
    try:
        parsed = urlparse(url)
    except ValueError as exc:
        raise RefusedURL("unparseable url") from exc
    # http is excluded as well as the exotic schemes: a plaintext fetch of a
    # document we are about to quote can be rewritten in flight by anyone
    # on the path, and there is no reason to accept that for a nicety.
    if parsed.scheme != "https":
        raise RefusedURL(f"scheme {parsed.scheme or 'none'} is not allowed")
    _check_host(parsed.hostname)
    return url


def looks_like_pdf(url: str) -> bool:
    """Cheap pre-filter, so a page of HTML is not fetched twice.

    Only a hint - the content type decides - but it keeps the fetch off
    every result in a search and onto the ones that might repay it.
    """
    try:
        path = (urlparse(url).path or "").lower()
    except ValueError:
        return False
    return path.endswith(".pdf")


async def _read(url: str) -> bytes:
    """The bytes, with every hop vetted and the ceiling enforced as it streams."""
    seen = 0
    current = vet(url)
    async with httpx.AsyncClient(
        timeout=TIMEOUT_SECONDS, follow_redirects=False
    ) as client:
        while True:
            async with client.stream("GET", current) as response:
                if response.status_code in (301, 302, 303, 307, 308):
                    seen += 1
                    if seen > MAX_REDIRECTS:
                        raise RefusedURL("too many redirects")
                    location = response.headers.get("location")
                    if not location:
                        raise RefusedURL("redirect with nowhere to go")
                    # Vetted again from scratch: the point of following
                    # these by hand is that the destination gets the same
                    # scrutiny as the address we were given.
                    current = vet(str(response.url.join(location)))
                    continue

                response.raise_for_status()
                kind = (response.headers.get("content-type") or "").split(";")[0].strip()
                if kind and kind not in ("application/pdf", "application/octet-stream"):
                    raise RefusedURL(f"not a pdf ({kind})")

                body = bytearray()
                async for chunk in response.aiter_bytes():
                    body.extend(chunk)
                    if len(body) > MAX_BYTES:
                        raise RefusedURL("larger than the ceiling")
                return bytes(body)


def tables_from(file_bytes: bytes, max_pages: int = MAX_PAGES) -> str:
    """Every table in the document, laid out as ' | '-separated rows.

    Synchronous and CPU-bound, so callers run it off the event loop.
    """
    from app.services.document_ingestion import _sheet_text

    rendered: list[str] = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages[:max_pages]:
            for table in page.extract_tables() or []:
                laid_out = _sheet_text(table)
                # One row is a text box mistaken for a table; it adds noise
                # and no structure.
                if laid_out and laid_out.count("\n") >= 1:
                    rendered.append(laid_out)
    return "\n\n".join(rendered).strip()


async def table_excerpt(url: str, limit: int) -> str | None:
    """The tables in the PDF at `url`, or None.

    Never raises. This is an improvement on an excerpt that already exists,
    so every way it can fail - refused address, timeout, not really a PDF,
    no tables in it - means "keep the one the search gave us".
    """
    try:
        raw = await _read(url)
    except RefusedURL as exc:
        logger.info("not fetching %s: %s", url, exc)
        return None
    except Exception:  # noqa: BLE001
        logger.info("could not fetch %s", url, exc_info=True)
        return None

    try:
        text = await asyncio.to_thread(tables_from, raw)
    except Exception:  # noqa: BLE001
        logger.info("could not read tables from %s", url, exc_info=True)
        return None

    return text[:limit] if text else None
