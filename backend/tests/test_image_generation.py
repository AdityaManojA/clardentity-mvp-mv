"""The Co-Creative picture path, minus the network.

The two things worth pinning down without spending money on an image: that
nothing is attempted for an empty message, and that the storage key is scoped
to its owner - the serving route proves ownership by constructing that key
rather than by querying anything, so if the owner ever stops being part of
it, every generated image becomes reachable from any account.
"""

import asyncio
import uuid

from app.services.image_generation import storage_key, wanted_image


class TestStorageKey:
    def test_the_owner_is_part_of_the_key(self):
        owner = uuid.uuid4()
        image = uuid.uuid4()
        key = storage_key(owner, image)
        assert str(owner) in key
        assert str(image) in key
        # WebP by default: the same picture is a tenth of the PNG's size, and
        # the PNG's 2.4MB was most of why a working image read as a missing
        # one.
        assert key.endswith(".webp")

    def test_png_is_still_addressable(self):
        # Images written before the switch are still stored, and the serving
        # route falls back to them.
        owner, image = uuid.uuid4(), uuid.uuid4()
        assert storage_key(owner, image, "png").endswith(".png")

    def test_two_owners_never_collide_on_one_image_id(self):
        image = uuid.uuid4()
        assert storage_key(uuid.uuid4(), image) != storage_key(uuid.uuid4(), image)

    def test_it_accepts_strings_as_well_as_uuids(self):
        owner, image = uuid.uuid4(), uuid.uuid4()
        assert storage_key(str(owner), str(image)) == storage_key(owner, image)


class TestIntent:
    def test_an_empty_message_asks_nothing_of_the_model(self):
        # Guarded before the call, so this needs no network: a blank message
        # must not cost an intent check, let alone an image.
        assert asyncio.run(wanted_image("")) is None
        assert asyncio.run(wanted_image("   \n  ")) is None


class TestCoCreativeNeverDeniesIt:
    """The mode that can draw must never say it cannot.

    Reported from production: Co-Creative answered a request about an image
    of Kerala with "I can only generate text, not actual images", and
    offered a prompt to paste into some other tool. That sentence is false
    here, and it was false because the only place the product ever told the
    model it could draw was the block added once a picture was *already*
    being generated - so on any turn where the intent check said no, the
    model fell back on what it believes about itself.
    """

    def test_the_mode_says_it_can_make_images(self):
        from app.services.prompt_builder import MODE_INSTRUCTIONS

        creative = MODE_INSTRUCTIONS["creative"]
        assert "images" in creative
        assert "You can produce images in this mode" in creative

    def test_the_mode_forbids_the_sentence_that_was_reported(self):
        from app.services.prompt_builder import MODE_INSTRUCTIONS

        creative = MODE_INSTRUCTIONS["creative"].lower()
        for forbidden in ("cannot make an image", "can only generate text"):
            assert forbidden in creative, (
                f"the instruction no longer names {forbidden!r}, which is the "
                "exact wording a user was given"
            )

    def test_it_is_in_the_instructions_every_creative_turn_gets(self):
        from app.services.prompt_builder import build_system_instructions

        # Not just when a picture is being made - that was the bug.
        blocks = build_system_instructions("creative", making_image=False)
        text = " ".join(
            part.get("text", "") for part in blocks if isinstance(part, dict)
        )
        assert "You can produce images in this mode" in text

    def test_other_modes_are_not_told_they_can_draw(self):
        from app.services.prompt_builder import MODE_INSTRUCTIONS

        # Only Co-Creative generates images, so only Co-Creative may promise
        # one. Telling Finder it can draw would create the opposite bug.
        for mode, text in MODE_INSTRUCTIONS.items():
            if mode == "creative":
                continue
            assert "You can produce images in this mode" not in text, mode


class TestTheIntentCheckCanReadTheConversation:
    """A follow-up is a follow-up.

    The instructions have always asked it to resolve "anything the
    conversation makes clear", and it was never given a conversation.
    """

    def test_history_is_folded_into_what_the_judge_sees(self):
        from app.services.image_generation import _with_history

        out = _with_history(
            "now make it an image",
            [("user", "Describe the Kerala backwaters"),
             ("assistant", "A network of lagoons and canals.")],
        )
        assert "Describe the Kerala backwaters" in out
        assert "A network of lagoons and canals." in out
        assert out.rstrip().endswith("now make it an image")

    def test_no_history_is_just_the_message(self):
        from app.services.image_generation import _with_history

        assert _with_history("draw a fox", None) == "draw a fox"
        assert _with_history("draw a fox", []) == "draw a fox"
        # Blank turns carry nothing and must not produce an empty preamble.
        assert _with_history("draw a fox", [("user", "   ")]) == "draw a fox"

    def test_a_long_thread_does_not_become_the_prompt(self):
        from app.services.image_generation import _HISTORY_TURNS, _with_history

        history = [("user", f"turn {i}") for i in range(50)]
        out = _with_history("draw it", history)
        assert out.count("User:") == _HISTORY_TURNS
        assert "turn 49" in out and "turn 0" not in out
