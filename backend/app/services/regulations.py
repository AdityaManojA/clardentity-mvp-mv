"""The regulation suite: which rules a health or support conversation is held
to, by where the person is.

Two tables, both data rather than code, both researched and cited:

- `data/regulations/emergency.json` - for every ISO 3166-1 country and
  territory: the emergency and ambulance numbers, a national crisis line and
  poison control where one is verified. A wrong crisis number given to a
  person in danger is the worst failure this file can have, so an unverified
  entry is left empty and the product falls back to "call your local
  emergency number" plus findahelpline.com rather than guessing.
- `data/regulations/health.json` - what the law asks of a consumer AI health
  assistant hosted in the US: how health data is classified, what consent is
  needed and from what age, whether Healthcare conversations may be stored
  (`persist`), only processed (`transient` - kept out of storage entirely,
  the temporary-chat machinery), or not offered (`unavailable`), what the
  model must and must not do there, and the sources.

A profile is resolved in layers - the global baseline, then a region (the
EU/EEA share one), then the country a territory belongs to, then the
country, then a state or province - each layer overriding only what it sets
(rules, laws and sources add up instead). Every country therefore resolves to something:
where nothing specific is on file the baseline applies, and the baseline is
written to the strict end of the range (explicit consent, adults only).

This is product compliance engineering, not legal advice: each profile
carries its sources, a confidence and an as-of date, and `needs_review`
marks the ones counsel should look at first. See docs/modes/healthcare.md.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

_DATA = Path(__file__).resolve().parent.parent / "data" / "regulations"

#: EU and EEA members share the "EU" layer before their national one.
EU_EEA = {
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
    "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
    "SE", "IS", "LI", "NO",
}

#: Parts of the EU that have their own ISO code: the outermost regions and
#: Åland. GDPR applies there as in the rest of the Union.
EU_TERRITORIES = {"GP", "MQ", "GF", "RE", "YT", "MF", "AX"}

STORAGE_POLICIES = ("persist", "transient", "unavailable")

#: Place names that take "the" in running English.
_TAKES_THE = re.compile(
    r"^(United |Netherlands$|Philippines$|Bahamas$|Gambia$|Maldives$|Comoros$|Seychelles$|"
    r"Czech Republic$|Dominican Republic$|Central African Republic$|Marshall Islands$|"
    r"Solomon Islands$|Democratic Republic|Republic of|Holy See|Vatican$|Faroe|Cayman|"
    r"Falkland|Virgin Islands|Turks and Caicos|Cook Islands|Northern Mariana|Canary)"
)


@dataclass(frozen=True)
class Resource:
    """One number to call. `kind`: emergency | ambulance | crisis | poison."""

    kind: str
    label: str
    number: str
    hours: str = ""


@dataclass(frozen=True)
class CrisisResources:
    country: str | None
    entries: tuple[Resource, ...] = ()

    def number(self, kind: str) -> str | None:
        return next((r.number for r in self.entries if r.kind == kind), None)

    def prompt_lines(self) -> str:
        return "\n".join(
            f"- {r.label}: {r.number}" + (f" ({r.hours})" if r.hours else "")
            for r in self.entries
        )


@dataclass(frozen=True)
class Law:
    name: str
    citation: str = ""
    url: str = ""


@dataclass(frozen=True)
class HealthProfile:
    jurisdiction: str
    name: str
    #: How the law files health data: "special_category" (GDPR-style),
    #: "sensitive", or "personal".
    health_data: str = "sensitive"
    #: Explicit, separate, withdrawable consent before the first health
    #: conversation.
    explicit_consent: bool = True
    #: Below this age the person may not consent alone; the product asks
    #: them to confirm they are at least this old.
    consent_age: int = 18
    storage: str = "persist"
    storage_reason: str = ""
    #: Tell the person at the start that they are talking to an AI.
    ai_disclosure: bool = True
    laws: tuple[Law, ...] = ()
    #: Jurisdiction-specific rules for the model in Healthcare.
    healthcare_rules: tuple[str, ...] = ()
    #: Jurisdiction-specific rules for the model in Guidance.
    guidance_rules: tuple[str, ...] = ()
    regulator: str = ""
    confidence: str = "medium"
    needs_review: bool = False
    as_of: str = ""
    sources: tuple[str, ...] = ()
    #: The layers this was resolved from, most general first.
    layers: tuple[str, ...] = field(default_factory=tuple)

    @property
    def place(self) -> str:
        """The name as it reads mid-sentence: "in the United States", "under
        the rules for the Netherlands", but "in India"."""
        return f"the {self.name}" if _TAKES_THE.match(self.name) else self.name


# ----------------------------------------------------------------- loading --


@lru_cache(maxsize=1)
def _emergency() -> dict:
    path = _DATA / "emergency.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


@lru_cache(maxsize=1)
def _health() -> dict:
    path = _DATA / "health.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def _norm(code: str | None) -> str | None:
    return code.strip().upper() if code and code.strip() else None


def _layer_keys(country: str | None, subdivision: str | None) -> list[str]:
    keys = ["baseline"]
    if country in EU_EEA or country in EU_TERRITORIES:
        keys.append("EU")
    # A territory with its own ISO code (Puerto Rico, Réunion, Guernsey...)
    # is held to the country it belongs to, then to anything of its own.
    parent = ((_health().get("parents") or {}).get(country or "") or "").upper() or None
    if parent and parent != country:
        keys.append(parent)
    if country:
        keys.append(country)
    if subdivision and country and subdivision.startswith(country + "-"):
        keys.append(subdivision)
    return keys


def profile_for(country: str | None, subdivision: str | None = None) -> HealthProfile:
    """The rules for where the person is - always something, never raises."""
    country, subdivision = _norm(country), _norm(subdivision)
    data = _health()
    merged: dict = {}
    used: list[str] = []
    for key in _layer_keys(country, subdivision):
        layer = (data.get("profiles") or {}).get(key)
        if not layer:
            continue
        used.append(key)
        for k, v in layer.items():
            if k in ("healthcare_rules", "guidance_rules"):
                # Rules accumulate down the layers; a country adds to the
                # baseline rather than replacing it.
                merged[k] = list(merged.get(k, [])) + list(v or [])
            elif k in ("laws", "sources"):
                # So do laws and sources, most specific first: the consent
                # card names the first few, and in Washington the law that
                # matters is the My Health My Data Act, not the FTC Act.
                merged[k] = list(v or []) + list(merged.get(k, []))
            else:
                merged[k] = v
    storage = merged.get("storage", "persist")
    return HealthProfile(
        jurisdiction=subdivision if subdivision and subdivision in used else (country or "baseline"),
        name=merged.get("name") or (country or "Unknown location"),
        health_data=merged.get("health_data", "sensitive"),
        explicit_consent=bool(merged.get("explicit_consent", True)),
        consent_age=int(merged.get("consent_age", 18)),
        storage=storage if storage in STORAGE_POLICIES else "persist",
        storage_reason=merged.get("storage_reason", ""),
        ai_disclosure=bool(merged.get("ai_disclosure", True)),
        laws=tuple(
            Law(name=law.get("name", ""), citation=law.get("citation", ""), url=law.get("url", ""))
            for law in merged.get("laws", [])
            if isinstance(law, dict) and law.get("name")
        ),
        healthcare_rules=tuple(dict.fromkeys(merged.get("healthcare_rules", []))),
        guidance_rules=tuple(dict.fromkeys(merged.get("guidance_rules", []))),
        regulator=merged.get("regulator", ""),
        confidence=merged.get("confidence", "medium"),
        needs_review=bool(merged.get("needs_review", False)),
        as_of=merged.get("as_of", ""),
        sources=tuple(dict.fromkeys(merged.get("sources", []))),
        layers=tuple(used),
    )


def crisis_resources(country: str | None, subdivision: str | None = None) -> CrisisResources:
    """The verified numbers for this country, in the order to try them."""
    country = _norm(country)
    entry = _emergency().get(country or "") or {}
    entries: list[Resource] = []
    emergency = (entry.get("emergency") or "").strip()
    ambulance = (entry.get("ambulance") or "").strip()
    crisis = entry.get("crisis_line") or {}
    poison = (entry.get("poison") or "").strip()
    if emergency:
        entries.append(Resource("emergency", "Emergency services", emergency))
    if ambulance and ambulance != emergency:
        entries.append(Resource("ambulance", "Ambulance", ambulance))
    if isinstance(crisis, dict) and (crisis.get("number") or "").strip():
        entries.append(
            Resource(
                "crisis",
                crisis.get("name") or "Crisis line",
                crisis["number"].strip(),
                (crisis.get("hours") or "").strip(),
            )
        )
    if poison:
        entries.append(Resource("poison", "Poison control", poison))
    return CrisisResources(country=country, entries=tuple(entries))


def jurisdiction_block(mode: str, profile: HealthProfile, resources: CrisisResources) -> str | None:
    """What the model is told about where the person is, for the modes whose
    rules depend on it. None for every other mode."""
    if mode not in ("healthcare", "guidance"):
        return None
    lines = [f"JURISDICTION - the user appears to be in {profile.place} (from their connection)."]
    numbers = resources.prompt_lines()
    lines.append(
        "Numbers for where they are - use exactly these, never another:\n" + numbers
        if numbers
        else "No verified local numbers are on file for their location: say 'your local "
        "emergency number', and point to findahelpline.com for helplines."
    )
    rules = profile.healthcare_rules if mode == "healthcare" else profile.guidance_rules
    if rules:
        lines.append("Rules that apply there:\n" + "\n".join(f"- {r}" for r in rules))
    if mode == "healthcare":
        lines.append(
            "Use the medicine names, units and care pathways of that country, and say "
            "so if something is prescription-only there."
        )
    return "\n".join(lines)


def coverage() -> dict:
    """How complete the two tables are - for tests and the docs."""
    emergency = _emergency()
    profiles = (_health().get("profiles") or {})
    return {
        "emergency_entries": len(emergency),
        "with_emergency_number": sum(1 for v in emergency.values() if (v.get("emergency") or "").strip()),
        "with_crisis_line": sum(
            1 for v in emergency.values() if ((v.get("crisis_line") or {}).get("number") or "").strip()
        ),
        "health_profiles": len(profiles),
    }
