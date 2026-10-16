"""The address a request really came from.

Behind Render the socket peer is the platform's proxy - a private address -
so `request.client.host` is the same for every user and says nothing about
where any of them are. The forwarded header carries the real one. Until
2026-10-16 sign-in read the peer, every lookup was skipped as "private", and
no signed-in user anywhere had a location: no local rules, no local crisis
numbers. The demo read the header and was right all along.

The header is spoofable, which is fine for what it is used for here - a
coarse "which country's rules apply" that a VPN changes anyway, and rate
limits that also have a global ceiling.
"""

from fastapi import Request


def client_timezone(request: Request) -> str | None:
    """The IANA time zone the browser reports (sent by the client on every
    API call), or None. Only ever used to name a country when the address
    cannot; anything that is not a zone in the table is ignored."""
    value = (request.headers.get("x-client-timezone") or "").strip()
    return value if 0 < len(value) <= 64 else None


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
