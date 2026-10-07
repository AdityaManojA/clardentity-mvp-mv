"""Catching what someone says about themselves, and what it does to a profile.

The extraction itself needs a model, so what is pinned here is the cheap gate
in front of it and the merge behind it - the two places where a mistake is
silent: a pre-filter that skips a real statement loses the fact, and a merge
that overwrites the wrong thing loses something the user typed on purpose.
"""

from types import SimpleNamespace

from app.services.profile_service import profile_prompt_block
from app.services.stated_facts import SOURCE, looks_like_self_talk, merge


class TestTheCheapGate:
    def test_it_catches_someone_talking_about_themselves(self):
        for message in [
            "I am from Thrissur, Kerala",
            "I'm a civil engineer",
            "My sister lives in Bangalore",
            "I work at a hospital",
            "I study at IIM Kozhikode",
            "we live in Kochi now",
        ]:
            assert looks_like_self_talk(message), message

    def test_it_skips_questions_about_the_world(self):
        # The large majority of turns. Each one skipped is a model call not
        # made, which is the only reason the gate exists.
        for message in [
            "What is the capital of France?",
            "Explain photosynthesis",
            "Compare Python and Go for a first language",
            "",
        ]:
            assert not looks_like_self_talk(message), message


class TestMerge:
    def test_a_new_fact_is_added_as_stated(self):
        out = merge([], [{"label": "Hometown", "value": "Thrissur, Kerala"}])
        assert len(out) == 1
        assert out[0]["label"] == "Hometown"
        assert out[0]["source"] == SOURCE
        assert out[0]["id"]

    def test_restating_updates_rather_than_duplicates(self):
        # Moving city should change where they live, not leave the profile
        # holding two answers to the same question.
        out = merge([], [{"label": "Hometown", "value": "Thrissur"}])
        out = merge(out, [{"label": "hometown", "value": "Kochi"}])
        assert len(out) == 1
        assert out[0]["value"] == "Kochi"

    def test_it_never_overwrites_what_the_user_typed_themselves(self):
        # They went out of their way to put this in the profile editor. A
        # sentence said in passing must not silently undo it.
        typed = [{"id": "1", "label": "Home", "value": "Thrissur", "source": "user"}]
        out = merge(typed, [{"label": "Home", "value": "somewhere else"}])
        assert out == typed

    def test_inferred_aspects_are_left_alone(self):
        inferred = [{"id": "1", "label": "Home", "value": "guessed", "source": "inferred"}]
        out = merge(inferred, [{"label": "Home", "value": "Thrissur"}])
        # The inference stays and the statement is added beside it; the prompt
        # block ranks first-hand above inferred, so the stated one wins where
        # it matters.
        assert len(out) == 2
        assert any(a["source"] == SOURCE and a["value"] == "Thrissur" for a in out)


class TestItReachesThePrompt:
    def test_a_stated_fact_alone_produces_a_block(self):
        # The bug this whole path existed to fix: aspects were stored, shown
        # in the editor, and never sent anywhere, so a profile without
        # generated prose said nothing to the model at all.
        profile = SimpleNamespace(
            personality_md=None,
            aspects=[{"label": "Hometown", "value": "Thrissur, Kerala", "source": SOURCE}],
            roles=[],
        )
        block = profile_prompt_block(profile)
        assert block is not None
        assert "Thrissur, Kerala" in block

    def test_first_hand_facts_are_marked_as_theirs(self):
        profile = SimpleNamespace(
            personality_md=None,
            aspects=[
                {"label": "Home", "value": "Thrissur", "source": SOURCE},
                {"label": "Mood", "value": "probably an optimist", "source": "inferred"},
            ],
            roles=[],
        )
        block = profile_prompt_block(profile)
        assert "told you about themselves" in block
        assert "inferred about them" in block

    def test_an_empty_profile_still_sends_nothing(self):
        assert profile_prompt_block(SimpleNamespace(personality_md=None, aspects=[], roles=[])) is None
