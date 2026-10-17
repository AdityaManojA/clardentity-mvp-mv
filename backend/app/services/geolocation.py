"""Coarse location from the address a user signs in from.

Why at all: "what's the weather", "is this legal", "what time do shops shut"
are all region-dependent, and asking every user to fill in a location field is
a form nobody completes. The IP already says roughly where they are.

Deliberately coarse. City, region, country and timezone - the granularity of
"which country's rules apply", not "where do they live". Nothing finer is
stored, no coordinates, no ISP, no postal code, and the raw IP is never
persisted. It is offered to the model as background that may be wrong,
because it frequently is: VPNs, mobile carriers routing through another state,
and people travelling all produce a confident, wrong answer.
"""

import ipaddress
from functools import lru_cache
import logging

import httpx

logger = logging.getLogger(__name__)

# HTTPS on the free tier and no API key. The timeout is short and every
# failure is swallowed - this is a nice-to-have attached to a sign-in, and a
# slow third party must never be something the user waits behind.
_ENDPOINT = "https://ipapi.co/{ip}/json/"
_TIMEOUT_SECONDS = 4.0


def is_resolvable(ip: str | None) -> bool:
    """False for anything a lookup can't say anything useful about."""
    if not ip:
        return False
    try:
        parsed = ipaddress.ip_address(ip)
    except ValueError:
        return False
    # Localhost and LAN addresses are what every developer machine and a good
    # number of misconfigured proxies report.
    return not (
        parsed.is_private
        or parsed.is_loopback
        or parsed.is_reserved
        or parsed.is_link_local
        or parsed.is_multicast
    )


async def resolve(ip: str) -> dict | None:
    """{"label", "country", "subdivision", "timezone"} or None. Never raises."""
    if not is_resolvable(ip):
        return None

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
            response = await client.get(
                _ENDPOINT.format(ip=ip), headers={"User-Agent": "Clardentity/1.0"}
            )
        if response.status_code != 200:
            return None
        data = response.json()
    except Exception:
        logger.info("geolocation lookup failed", exc_info=True)
        return None

    # The free tier signals quota and bad input with a 200 and an error body.
    if data.get("error"):
        return None

    parts = [data.get("city"), data.get("region"), data.get("country_name")]
    label = ", ".join(p for p in parts if p)
    if not label:
        return None

    country = (data.get("country_code") or "")[:2].upper() or None
    region = (data.get("region_code") or "").strip().upper()
    # ISO 3166-2: "US-WA", "CA-QC". Several US states and Canadian provinces
    # set their own rules for health data and AI support tools.
    subdivision = (
        f"{country}-{region}" if country and region.isalnum() and len(region) <= 3 else None
    )
    return {
        "label": label[:120],
        "country": country,
        "subdivision": subdivision,
        "timezone": (data.get("timezone") or "")[:64] or None,
    }


def country_from_timezone(timezone: str | None) -> str | None:
    """The country a browser's IANA time zone belongs to - "Asia/Kolkata" and
    the "Asia/Calcutta" Chrome still reports are both India. The fallback
    when the address lookup cannot answer (the free tier rate-limits, and a
    VPN hides the address anyway): first-party, instant, and right for the
    one question it is asked, which country's rules and numbers apply."""
    if not timezone:
        return None
    return _timezones().get(timezone.strip())


@lru_cache(maxsize=1)
def _timezones() -> dict[str, str]:
    import json
    from pathlib import Path

    path = Path(__file__).resolve().parent.parent / "data" / "timezones.json"
    return json.loads(path.read_text(encoding="utf-8"))


async def resolve_cached(ip: str | None) -> dict | None:
    """`resolve`, remembered for a day under a hash of the address - the
    address itself is never stored. For the lookups a request has to wait
    for (a signed-in user with no location yet, a visitor in the demo), so a
    conversation pays for one lookup, not one per message."""
    import hashlib
    import json

    from app.core.rate_limit import _redis

    if not is_resolvable(ip):
        return None
    key = "geo:" + hashlib.sha256(ip.encode()).hexdigest()[:32]
    try:
        cached = await _redis.get(key)
        if cached:
            return json.loads(cached) or None
    except Exception:  # noqa: BLE001 - a cache miss is a lookup, not an error
        logger.info("location cache unavailable", exc_info=True)
    located = await resolve(ip)
    try:
        await _redis.set(key, json.dumps(located or {}), ex=86400)
    except Exception:  # noqa: BLE001
        pass
    return located


def location_prompt_line(label: str | None, timezone: str | None) -> str | None:
    """One line of background, hedged on purpose.

    Stated as where they *appear* to be signing in from rather than where they
    are, so the model uses it for defaults - units, jurisdiction, season - and
    still believes the user over it when they say otherwise.
    """
    if not label:
        return None
    line = f"They appear to be signing in from {label}"
    if timezone:
        line += f" (timezone {timezone})"
    return (
        line + ". Use this only to pick sensible regional defaults - units, currency, "
        "season, which country's rules are likely relevant. It is inferred from a "
        "network address, so it is often wrong: never assert it back to them, and "
        "drop it immediately if they say otherwise."
    )
