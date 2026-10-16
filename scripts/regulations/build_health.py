#!/usr/bin/env python3
"""Build backend/app/data/regulations/health.json from the profile files.

    python3 scripts/regulations/build_health.py

The profiles live one region per file in backend/app/data/regulations/
profiles/ - each distilled from cited research into the shape
services/regulations.py reads (see docs/modes/healthcare.md). `_global.json`
holds the baseline and the places our AI providers do not serve, and wins
over a regional file for the same code: whether the service can be offered
at all is not something a privacy profile can override.

Territories with their own ISO code are not given profiles of their own;
they are held to the country they belong to (PARENTS below), with their own
name on top.

Every profile is checked before anything is written, and the build fails
rather than shipping a table with a phone number in a rule, an unknown
storage policy, or a non-persist decision nobody is asked to review.
"""

from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = ROOT / "backend" / "app" / "data" / "regulations"
AS_OF = "2026-10-16"

PARENTS = {
    **dict.fromkeys(["PR", "GU", "VI", "AS", "MP", "UM"], "US"),
    **dict.fromkeys(["GP", "MQ", "GF", "RE", "YT", "MF", "BL", "PM", "NC", "PF", "WF", "TF"], "FR"),
    **dict.fromkeys(["GG", "JE", "IM", "GI", "KY", "BM", "VG", "TC", "AI", "MS", "FK", "SH", "PN", "IO", "GS"], "GB"),
    **dict.fromkeys(["AW", "CW", "SX", "BQ"], "NL"),
    **dict.fromkeys(["FO", "GL"], "DK"),
    "AX": "FI",
    **dict.fromkeys(["SJ", "BV"], "NO"),
    **dict.fromkeys(["CC", "CX", "NF", "HM"], "AU"),
    **dict.fromkeys(["CK", "NU", "TK"], "NZ"),
}

KEYS = {"name", "health_data", "consent_age", "storage", "storage_reason", "laws", "healthcare_rules",
        "guidance_rules", "regulator", "confidence", "needs_review", "as_of", "sources", "notes"}
PHONE = re.compile(r"(?i)(?:\b(?:call|dial|ring|phone|text|contact)\s+(?:on\s+)?\+?\d{2,})|"
                   r"(?:(?<![\w./])\+?\d(?:[\s-]?\d){5,}(?![\w/]))")


def check(code: str, p: dict) -> list[str]:
    errors = []

    def err(message: str) -> None:
        errors.append(f"{code}: {message}")

    if not re.fullmatch(r"[A-Z]{2}(-[A-Z0-9]{1,3})?|EU|baseline", code):
        err("key must be ISO 3166-1 alpha-2, XX-SUB, EU or baseline")
    if KEYS - set(p) or set(p) - KEYS:
        err(f"keys: missing {sorted(KEYS - set(p))} unknown {sorted(set(p) - KEYS)}")
        return errors
    if p["health_data"] not in ("special_category", "sensitive", "personal"):
        err("health_data")
    if not isinstance(p["consent_age"], int) or not 18 <= p["consent_age"] <= 21:
        err("consent_age must be an int 18-21")
    if p["storage"] not in ("persist", "transient", "unavailable"):
        err("storage")
    if p["storage"] != "persist" and (not p["storage_reason"] or not p["needs_review"]):
        err("a non-persist decision needs a storage_reason and needs_review")
    if p["confidence"] not in ("high", "medium", "low"):
        err("confidence")
    if p["confidence"] == "low" and not p["needs_review"]:
        err("low confidence must need review")
    if len(p["laws"]) > 4 or any(not isinstance(x, dict) or not x.get("name") for x in p["laws"]):
        err("laws: at most 4, each with a name")
    for field, cap in (("healthcare_rules", 4), ("guidance_rules", 3)):
        if len(p[field]) > cap:
            err(f"{field}: at most {cap}")
        for rule in p[field]:
            if len(rule) > 240:
                err(f"{field}: rule over 240 chars")
            if PHONE.search(rule):
                err(f"{field}: a phone number in a rule - numbers come only from emergency.json")
    if len(p["sources"]) > 6:
        err("sources: at most 6")
    if p["as_of"] != AS_OF:
        err(f"as_of must be {AS_OF}")
    return errors


def main() -> int:
    profiles: dict[str, dict] = {}
    origin: dict[str, str] = {}
    files = sorted((DATA / "profiles").glob("*.json"), key=lambda f: (f.name == "_global.json", f.name))
    for path in files:
        for code, profile in json.loads(path.read_text(encoding="utf-8")).items():
            if code in profiles and path.name != "_global.json":
                print(f"duplicate {code} in {path.name} and {origin[code]}", file=sys.stderr)
                return 1
            if code in profiles:
                # A vendor or sanctions bar on top of a researched profile:
                # it decides availability, and the research stays for the
                # day the place can be served.
                kept = profiles[code]
                profile = {
                    **kept,
                    "storage": profile["storage"],
                    "storage_reason": profile["storage_reason"],
                    "needs_review": True,
                    "sources": list(dict.fromkeys(profile["sources"] + kept["sources"]))[:6],
                    "notes": f"{profile['notes']} {kept['notes']}".strip(),
                }
            profiles[code] = profile
            origin[code] = path.name

    errors = [e for code, p in profiles.items() for e in check(code, p)]
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    emergency = json.loads((DATA / "emergency.json").read_text(encoding="utf-8"))
    for code, parent in PARENTS.items():
        if parent not in profiles:
            print(f"territory {code}: parent {parent} has no profile", file=sys.stderr)
            return 1
        if code not in profiles:
            # Only the name: everything else comes from the parent's layers.
            profiles[code] = {"name": emergency.get(code, {}).get("country") or code}

    countries = [c for c in emergency if len(c) == 2]
    specific = [c for c in countries if c in profiles and c not in PARENTS]
    out = {
        "as_of": AS_OF,
        "about": "Generated by scripts/regulations/build_health.py from profiles/*.json - edit those, not this.",
        "parents": PARENTS,
        "profiles": dict(sorted(profiles.items(), key=lambda kv: (kv[0] != "baseline", kv[0] != "EU", kv[0]))),
    }
    (DATA / "health.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    storage = {s: sorted(c for c, p in profiles.items() if p.get("storage") == s) for s in ("transient", "unavailable")}
    review = sorted(c for c, p in profiles.items() if p.get("needs_review"))
    baseline_only = sorted(c for c in countries if c not in profiles and c not in PARENTS)
    print(f"{len(profiles)} profiles: {len(specific)} countries researched, {len(PARENTS)} territories under "
          f"their country, {len(baseline_only)} on the baseline alone: {' '.join(baseline_only)}")
    print(f"transient: {' '.join(storage['transient'])}")
    print(f"unavailable: {' '.join(storage['unavailable'])}")
    print(f"needs review: {len(review)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
