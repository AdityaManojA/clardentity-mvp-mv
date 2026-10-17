"""How a place's rules are resolved (services/regulations).

Against a table these tests control: the shipped tables are checked in
test_mode_standards.py::TestTheShippedTables. What matters here is the
layering - baseline, then the EU, then the country, then the state - and
that it can never fail open.
"""

import pytest

from app.services import regulations

HEALTH = {
    "profiles": {
        "baseline": {
            "name": "your location",
            "consent_age": 18,
            "laws": [{"name": "Baseline"}],
            "healthcare_rules": ["Global rule."],
            "sources": ["https://example.org/base"],
        },
        "EU": {
            "health_data": "special_category",
            "laws": [{"name": "GDPR", "url": "https://eur-lex.europa.eu/eli/reg/2016/679/oj"}],
            "healthcare_rules": ["EU rule."],
        },
        "DE": {"name": "Germany", "consent_age": 18, "healthcare_rules": ["German rule.", "EU rule."]},
        "US": {"name": "United States", "laws": [{"name": "FTC Act s.5"}]},
        "US-WA": {
            "name": "Washington",
            "laws": [{"name": "My Health My Data Act"}],
            "healthcare_rules": ["Washington rule."],
        },
        "XB": {"name": "Brokenland", "storage": "nonsense", "laws": ["not a dict", {"citation": "no name"}]},
        "AE": {"name": "United Arab Emirates", "storage": "transient", "storage_reason": "Kept in the UAE."},
        "FR": {"name": "France", "storage": "transient", "storage_reason": "HDS hosting."},
        "PR": {"name": "Puerto Rico"},
    },
    "parents": {"PR": "US", "RE": "FR", "GU": "us"},
}
EMERGENCY = {
    "IN": {
        "emergency": "112", "ambulance": "108",
        "crisis_line": {"name": "Tele-MANAS", "number": "14416", "hours": "24/7"}, "poison": "",
    },
    "US": {"emergency": "911", "ambulance": "911", "crisis_line": {"name": "988 Lifeline", "number": "988"}, "poison": "1-800-222-1222"},
}


@pytest.fixture(autouse=True)
def table(monkeypatch):
    monkeypatch.setattr(regulations, "_health", lambda: HEALTH)
    monkeypatch.setattr(regulations, "_emergency", lambda: EMERGENCY)


class TestLayers:
    def test_an_eu_state_gets_baseline_then_eu_then_its_own(self):
        p = regulations.profile_for("de")
        assert p.layers == ("baseline", "EU", "DE")
        assert p.name == "Germany" and p.health_data == "special_category"
        assert p.healthcare_rules == ("Global rule.", "EU rule.", "German rule."), "accumulated, de-duplicated"
        assert [law.name for law in p.laws] == ["GDPR", "Baseline"], "most specific first"

    def test_a_state_adds_to_its_country(self):
        p = regulations.profile_for("US", "US-WA")
        assert p.layers == ("baseline", "US", "US-WA")
        assert p.jurisdiction == "US-WA" and p.name == "Washington"
        assert [law.name for law in p.laws] == ["My Health My Data Act", "FTC Act s.5", "Baseline"]
        assert p.healthcare_rules[-1] == "Washington rule."

    def test_a_state_of_another_country_is_ignored(self):
        p = regulations.profile_for("US", "CA-QC")
        assert p.layers == ("baseline", "US") and p.jurisdiction == "US"

    def test_a_state_with_nothing_on_file_is_the_country(self):
        p = regulations.profile_for("US", "US-TX")
        assert p.jurisdiction == "US" and p.name == "United States"

    def test_storage_reason_is_carried(self):
        p = regulations.profile_for("AE")
        assert p.storage == "transient" and p.storage_reason == "Kept in the UAE."


class TestTerritories:
    def test_a_territory_is_held_to_its_country(self):
        p = regulations.profile_for("PR")
        assert p.layers == ("baseline", "US", "PR") and p.name == "Puerto Rico"
        assert [law.name for law in p.laws] == ["FTC Act s.5", "Baseline"]

    def test_an_eu_outermost_region_gets_the_eu_layer_and_its_country(self):
        p = regulations.profile_for("RE")
        assert p.layers == ("baseline", "EU", "FR")
        assert p.storage == "transient" and p.health_data == "special_category"

    def test_a_territory_with_nothing_of_its_own(self):
        p = regulations.profile_for("GU")
        assert p.layers == ("baseline", "US") and p.jurisdiction == "GU"


class TestNeverFailsOpen:
    def test_unknown_place_is_the_strict_baseline(self):
        for country in (None, "", "  ", "ZZ"):
            p = regulations.profile_for(country)
            assert p.explicit_consent and p.consent_age == 18 and p.storage == "persist"
            assert p.layers == ("baseline",)

    def test_a_malformed_entry_degrades_safely(self):
        p = regulations.profile_for("XB")
        assert p.storage == "persist", "an unknown storage value is not a licence to do anything"
        assert [law.name for law in p.laws] == ["Baseline"]

    def test_no_tables_at_all(self, monkeypatch):
        monkeypatch.setattr(regulations, "_health", lambda: {})
        monkeypatch.setattr(regulations, "_emergency", lambda: {})
        p = regulations.profile_for("IN")
        assert p.storage == "persist" and p.explicit_consent and p.consent_age == 18
        assert regulations.crisis_resources("IN").entries == ()


class TestNumbers:
    def test_in_order_with_duplicates_dropped(self):
        r = regulations.crisis_resources("us")
        assert [(e.kind, e.number) for e in r.entries] == [
            ("emergency", "911"),
            ("crisis", "988"),
            ("poison", "1-800-222-1222"),
        ], "an ambulance number the same as the emergency number is said once"

    def test_prompt_lines(self):
        assert regulations.crisis_resources("IN").prompt_lines() == (
            "- Emergency services: 112\n- Ambulance: 108\n- Tele-MANAS: 14416 (24/7)"
        )

    def test_coverage(self):
        c = regulations.coverage()
        assert c == {"emergency_entries": 2, "with_emergency_number": 2, "with_crisis_line": 2, "health_profiles": 9}
