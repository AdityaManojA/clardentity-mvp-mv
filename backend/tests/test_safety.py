"""The safety screen (services/safety): every message, every mode.

The model is faked - these test what the product does with its judgement,
and what happens when there is none. The numbers on a support card must come
from the regulation table and nowhere else, so that is tested against a
table we control.
"""

import json

import pytest

from app.services import regulations, safety

pytestmark = pytest.mark.real_safety


@pytest.fixture
def table(monkeypatch):
    emergency = {
        "IN": {
            "country": "India",
            "emergency": "112",
            "ambulance": "108",
            "crisis_line": {"name": "Tele-MANAS", "number": "14416", "hours": "24/7"},
            "poison": "",
        },
        "ZZ": {"country": "Nowhere", "emergency": "", "ambulance": "", "crisis_line": {}, "poison": ""},
    }
    monkeypatch.setattr(regulations, "_emergency", lambda: emergency)
    return emergency


def _model_says(monkeypatch, result=None, exc: Exception | None = None):
    calls = []

    async def fake(**kwargs):
        calls.append(kwargs)
        if exc:
            raise exc
        return result

    monkeypatch.setattr(safety, "generate_structured", fake)
    return calls


class TestAssess:
    async def test_the_model_decides(self, monkeypatch):
        _model_says(monkeypatch, {"level": "crisis", "kind": "suicide_or_self_harm"})
        got = await safety.assess("I've decided tonight is the night")
        assert (got.level, got.kind, got.by) == ("crisis", "suicide_or_self_harm", "model")

    async def test_ordinary_messages_are_none(self, monkeypatch):
        _model_says(monkeypatch, {"level": "none", "kind": "none"})
        assert await safety.assess("What's the capital of Kerala?") == safety.NONE

    async def test_the_backstop_answers_when_the_model_cannot(self, monkeypatch):
        _model_says(monkeypatch, exc=RuntimeError("provider down"))
        got = await safety.assess("I want to kill myself")
        assert (got.level, got.by) == ("crisis", "lexical")
        assert (await safety.assess("What's the weather like?")) == safety.NONE

    async def test_a_crisis_phrase_the_model_waved_through_is_still_a_concern(self, monkeypatch):
        _model_says(monkeypatch, {"level": "none", "kind": "none"})
        got = await safety.assess("honestly I want to end my life")
        assert got.level == "concern" and got.by == "lexical"

    async def test_talking_about_the_subject_is_not_a_crisis_for_the_backstop(self, monkeypatch):
        _model_says(monkeypatch, exc=RuntimeError("down"))
        got = await safety.assess("What is the suicide rate in Japan, per the latest research?")
        assert got.level == "concern", "about the subject, not from inside it: a check-in at most"

    async def test_it_reads_the_conversation_for_context(self, monkeypatch):
        calls = _model_says(monkeypatch, {"level": "concern", "kind": "distress"})
        await safety.assess("and tonight it's worse", [("user", "I haven't slept in days"), ("assistant", "...")])
        assert "I haven't slept in days" in calls[0]["input_text"]

    @pytest.mark.parametrize(
        "phrase",
        [
            "आत्महत्या", "ख़ुदकुशी", "मैं मर जाना चाहता हूँ", "अब जीना नहीं चाहती",
            "আত্মহত্যা", "ఆత్మహత్య", "ಆತ್ಮಹತ್ಯೆ", "આત્મહત્યા", "ਖੁਦਕੁਸ਼ੀ", "ଆତ୍ମହତ୍ୟା",
            "ആത്മഹത്യ", "தற்கொலை", "خودکشی", "انتحار",
            "main mar jaana chahta hoon", "ab jeena nahi chahti", "suicide kar lunga", "khudkushi",
        ],
    )
    def test_the_backstop_reads_our_users_languages(self, phrase):
        assert safety.lexical(f"... {phrase} ...").flagged

    @pytest.mark.parametrize("phrase", ["mar gaya yaar, kitna kaam hai", "is exam ne maar diya", "marna hai kya"])
    def test_everyday_hinglish_is_not_a_crisis(self, phrase):
        assert not safety.lexical(phrase).flagged


class TestWhatIsSaid:
    def test_crisis_block_carries_exact_numbers_and_forbids_inventing_them(self, table):
        resources = safety.for_turn("IN")
        block = safety.prompt_block(safety.Assessment("crisis", "suicide_or_self_harm"), resources)
        assert "- Emergency services: 112" in block
        assert "- Tele-MANAS: 14416 (24/7)" in block
        assert "never invent" in block
        assert "methods, doses" in block

    def test_the_ambulance_is_named_for_a_medical_crisis(self, table):
        # Japan's 110 is the police and 119 the ambulance; Brazil's 190 and 192.
        block = safety.prompt_block(safety.Assessment("crisis", "suicide_or_self_harm"), safety.for_turn("IN"))
        assert "ambulance number is listed separately, it is the one for a medical emergency" in block

    def test_a_live_call_carries_the_same_numbers(self, table):
        block = safety.call_block(safety.for_turn("IN"))
        assert "- Tele-MANAS: 14416 (24/7)" in block and "never another" in block
        assert "not a therapist, doctor or crisis service" in block
        assert "call their local emergency number" in safety.call_block(safety.for_turn("ZZ"))

    def test_a_medical_emergency_is_one_instruction(self, table):
        block = safety.prompt_block(safety.Assessment("crisis", "medical_emergency"), safety.for_turn("IN"))
        assert "call for an ambulance now" in block and "- Ambulance: 108" in block
        assert "no medicines and no doses" in block
        assert "ask directly whether they are safe" not in block, "not the self-harm template"

    def test_concern_block_is_gentle(self, table):
        block = safety.prompt_block(safety.Assessment("concern", "distress"), safety.for_turn("IN"))
        assert block.startswith("SAFETY - the message suggests significant distress")
        assert "Begin with them, not with advice" in block
        assert "without alarm" in block

    def test_nothing_when_not_flagged(self, table):
        assert safety.prompt_block(safety.NONE, safety.for_turn("IN")) is None
        assert safety.card(safety.NONE, safety.for_turn("IN")) is None

    def test_unknown_place_falls_back_to_finding_a_helpline(self, table):
        block = safety.prompt_block(safety.Assessment("crisis", "suicide_or_self_harm"), safety.for_turn("ZZ"))
        assert "findahelpline.com" in block
        card = safety.card(safety.Assessment("crisis", "suicide_or_self_harm"), safety.for_turn(None))
        assert card["resources"] == [] and card["fallback_url"] == "https://findahelpline.com"

    def test_the_card_has_only_table_numbers(self, table):
        card = safety.card(safety.Assessment("crisis", "suicide_or_self_harm"), safety.for_turn("in"))
        assert json.loads(json.dumps(card)) == card
        assert [(r["kind"], r["number"]) for r in card["resources"]] == [
            ("emergency", "112"),
            ("ambulance", "108"),
            ("crisis", "14416"),
        ]
        assert card["country"] == "IN"


class TestCrisisFormatting:
    def test_a_crisis_reply_is_not_written_for_claim_checking(self):
        from app.services.prompt_builder import build_system_instructions

        text = build_system_instructions("knowing", crisis=True)[0]["text"]
        assert safety.CRISIS_FORMATTING_RULES in text
        assert "Tag every claim" not in text

    def test_safety_block_leads_the_variable_part(self):
        from app.services.prompt_builder import build_system_instructions

        blocks = build_system_instructions(
            "guidance", profile_block="PROFILE", safety_block="SAFETY - x", jurisdiction_block="JURISDICTION - y"
        )
        variable = blocks[1]["text"]
        assert variable.index("SAFETY") < variable.index("JURISDICTION") < variable.index("PROFILE")
