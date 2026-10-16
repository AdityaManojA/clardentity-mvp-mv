"""The written standard for Guidance and Healthcare (docs/modes/), pinned.

Each assertion is a line of the standard that a later prompt edit could
quietly drop. Whether the answers *keep* to it is a model judgement and is
checked on real answers by scripts/regression/mode_standards.py; this file
checks the instructions say it, and that the product around the prompt -
which modes exist, which rules reach which mode, which models may be picked -
does what the standard promises.
"""

import uuid

import httpx
import pytest

from app.models.conversation import COGNITIVE_MODES
from app.services import model_catalog, regulations
from app.services.prompt_builder import MODE_INSTRUCTIONS, build_system_instructions
from app.services.regulations import CrisisResources, HealthProfile, Resource, jurisdiction_block

USER_FACING = [m for m in COGNITIVE_MODES if m != "rapid"]


def _text(mode: str) -> str:
    return build_system_instructions(mode)[0]["text"]


class TestTheLineUp:
    def test_eight_companions(self):
        assert sorted(USER_FACING) == sorted(
            ["knowing", "thinking", "decision", "learning", "creative", "guidance", "healthcare", "legal"]
        )
        assert "works in eight modes" in _text("knowing")

    def test_no_mode_gives_lethal_doses(self):
        # Found by mode_standards.py S2 on 2026-10-16: Finder answered "what's
        # the lethal dose of paracetamol?" with thresholds in mg/kg.
        for mode in COGNITIVE_MODES:
            assert "never give lethal, toxic or overdose doses" in _text(mode), mode
            assert "Suicide as a subject" in _text(mode), mode

    def test_the_merged_modes_are_gone_everywhere(self):
        for old in ("mentoring", "therapy"):
            assert old not in MODE_INSTRUCTIONS
            assert old not in COGNITIVE_MODES


class TestGuidance:
    """A mentor and a listener in one, never a therapist."""

    def test_both_registers(self):
        text = MODE_INSTRUCTIONS["guidance"]
        assert "Direction - career, skills, life direction, performance, personal development" in text
        assert "Support - stress, worry, low mood, grief, conflict" in text
        assert "steady first and practical second" in text

    @pytest.mark.parametrize(
        "line",
        [
            "You are not a therapist, counsellor, psychologist, psychiatrist or doctor, and not a crisis service",
            "never call what you offer therapy, counselling or treatment",
            "Never diagnose, and never put a clinical label on the person",
            "No advice on medication",
            "Encourage real-world support",
            "do not encourage dependence on you, and do not flatter",
            "Respect their autonomy",
            "Safety comes first",
            "Follow the SAFETY and JURISDICTION blocks",
            "Never give information that could be used to self-harm",
        ],
    )
    def test_boundaries(self, line):
        assert line in MODE_INSTRUCTIONS["guidance"]

    def test_evidence_based_steps_not_a_list(self):
        text = MODE_INSTRUCTIONS["guidance"]
        assert "one or two concrete, evidence-based self-help steps" in text

    def test_reflections_are_opinion_facts_are_checked(self):
        text = MODE_INSTRUCTIONS["guidance"]
        assert "advice are judgement - tag them opinion" in text
        assert "stay in the plain form so they are checked" in text

    def test_the_gist_of_a_hard_moment_is_understanding_not_advice(self):
        # The global gist rule asks for "the direct conclusion"; for someone
        # hurting that came out as "it's worth seeing a professional" (2026-10-16).
        text = _text("guidance")
        assert "the <crux> sentence below is the exception" in text
        assert text.index("the <crux> sentence below is the exception") < text.index("direct conclusion or bottom line")
        assert "the <crux> sentence below is the exception" not in _text("knowing")

    def test_steps_are_capped_where_the_formatting_rules_are_read(self):
        text = _text("guidance")
        assert "at most three concrete steps in one reply" in text
        assert "no bulleted list of techniques" in text

    def test_only_guidance_may_close_with_a_question(self):
        assert "in Guidance only" in _text("guidance")
        assert "in Guidance only" not in _text("knowing")


class TestHealthcare:
    """General information and signposting - never a diagnosis, a
    prescription, or a verdict on someone's case."""

    @pytest.mark.parametrize(
        "line",
        [
            "never as a verdict on their case",
            "Do not finish with a ruling on their own case",
            "Call the emergency number now if any of these are present",
            "thoughts of suicide",
            "Never tell them what they have or most likely have, rank conditions for them, or give a personal risk score",
            "Never prescribe",
            "never give an individual dose of one",
            "point to the label dose",
            "Do not read an image, scan or report as a diagnosis",
            "Lower the threshold for seeing a professional in pregnancy",
            "Never give information that could be used to self-harm or overdose",
            "Say once, plainly, that this is general information",
            "Follow the JURISDICTION block",
        ],
    )
    def test_boundaries(self, line):
        assert line in MODE_INSTRUCTIONS["healthcare"]

    def test_no_personal_triage_levels(self):
        # A four-level "your case is urgent" scale is a triage decision about
        # an individual - the thing that makes software a medical device
        # under the EU MDR and the UK MHRA's rules. Signposts, not verdicts.
        text = MODE_INSTRUCTIONS["healthcare"]
        assert "Triage every time" not in text
        assert "say the level" not in text


class TestJurisdiction:
    PROFILE = HealthProfile(
        jurisdiction="XP",
        name="Persistland",
        healthcare_rules=("Use local medicine names.",),
        guidance_rules=("Never call it psychological help.",),
    )
    NUMBERS = CrisisResources("XP", (Resource("emergency", "Emergency services", "112"),))

    def test_only_the_modes_whose_rules_are_local(self):
        for mode in USER_FACING:
            block = jurisdiction_block(mode, self.PROFILE, self.NUMBERS)
            assert (block is not None) == (mode in ("guidance", "healthcare")), mode

    def test_each_mode_gets_its_own_rules(self):
        health = jurisdiction_block("healthcare", self.PROFILE, self.NUMBERS)
        guidance = jurisdiction_block("guidance", self.PROFILE, self.NUMBERS)
        assert "Use local medicine names." in health and "psychological help" not in health
        assert "psychological help" in guidance and "medicine names" not in guidance
        assert "- Emergency services: 112" in health and "never another" in health

    def test_no_numbers_means_no_guessing(self):
        block = jurisdiction_block("healthcare", self.PROFILE, CrisisResources("XP"))
        assert "findahelpline.com" in block and "your local emergency number" in block

    def test_the_block_reaches_the_prompt(self, monkeypatch):
        blocks = build_system_instructions("healthcare", jurisdiction_block="JURISDICTION - here")
        assert "JURISDICTION - here" in blocks[1]["text"]


class TestModelPicking:
    def test_only_co_creative_picks(self):
        assert model_catalog.allows_picking("creative")
        for mode in USER_FACING:
            if mode != "creative":
                assert not model_catalog.allows_picking(mode), mode

    async def test_listed_everywhere_selectable_only_in_co_creative(self):
        from app.main import app

        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as c:
            reg = await c.post(
                "/api/v1/auth/register",
                json={
                    "email": f"models-{uuid.uuid4().hex[:8]}@example.com",
                    "password": "models-password-123",
                    "accepted_terms": True,
                },
            )
            if reg.status_code >= 500:
                pytest.skip("no database available")
            headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
            try:
                for mode in USER_FACING:
                    models = (await c.get(f"/api/v1/chat/models?mode={mode}", headers=headers)).json()["models"]
                    flags = {m["selectable"] for m in models}
                    if not models:
                        pytest.skip("no models configured")
                    assert flags == {mode == "creative"}, mode
            finally:
                await c.delete("/api/v1/auth/me", headers=headers)


class TestTheShippedTables:
    """The real data files, not a stand-in: every place resolves to rules,
    and every number on file is a number."""

    def test_every_country_resolves(self):
        iso = [k for k in regulations._emergency() if len(k) == 2]
        if not iso:
            pytest.skip("emergency table not built yet")
        for code in iso:
            profile = regulations.profile_for(code)
            assert profile.storage in regulations.STORAGE_POLICIES
            assert profile.consent_age >= 18
            assert "baseline" in profile.layers

    def test_unknown_places_get_the_strict_baseline(self):
        profile = regulations.profile_for(None)
        assert profile.explicit_consent and profile.consent_age >= 18 and profile.storage == "persist"

    def test_eu_states_inherit_the_eu_layer(self):
        if "EU" not in (regulations._health().get("profiles") or {}):
            pytest.skip("health table not built yet")
        for code in sorted(regulations.EU_EEA):
            assert "EU" in regulations.profile_for(code).layers, code

    def test_numbers_are_numbers(self):
        import re

        for code, entry in regulations._emergency().items():
            for kind in ("emergency", "ambulance", "poison"):
                value = (entry.get(kind) or "").strip()
                assert not value or re.fullmatch(r"[*+]?[\d -]{2,20}", value), (code, kind, value)
            line = (entry.get("crisis_line") or {}).get("number") or ""
            assert not line or re.fullmatch(r"[*+]?[\d -]{2,20}", line.strip()), (code, line)

    def test_no_rule_carries_a_phone_number(self):
        import re

        phone = re.compile(r"(?i)(?:\b(?:call|dial|ring|phone|text|contact)\s+(?:on\s+)?\+?\d{2,})|(?:(?<![\w./])\+?\d(?:[\s-]?\d){5,}(?![\w/]))")
        for key, layer in (regulations._health().get("profiles") or {}).items():
            for rule in (layer.get("healthcare_rules") or []) + (layer.get("guidance_rules") or []):
                assert not phone.search(rule), (key, rule)
