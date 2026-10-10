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


class TestPicturesMadeFromPictures:
    """Image + text -> image.

    Until 2026-10-10 an attached picture only ever reached the text model, as
    something to describe: the intent check was told that anything about an
    attached image was "no", and a follow-up like "now make it night-time"
    redrew the scene from a sentence. Edits now go to the image model with
    the source pictures as references.
    """

    def test_the_judge_is_told_what_there_is_to_work_from(self):
        from app.services.image_generation import _with_sources

        assert _with_sources("make it pop", 0, False) == "make it pop"
        assert "2 images are attached" in _with_sources("merge these", 2, False)
        assert "1 image is attached" in _with_sources("put this on a mug", 1, False)
        assert "produced earlier" in _with_sources("now at night", 0, True)

    def test_an_edit_with_nothing_to_edit_is_drawn_from_the_prompt(self, monkeypatch):
        from app.services import image_generation

        async def says_edit(**kwargs):
            return {
                "wants_image": True,
                "prompt": "a fox at night",
                "image_is_whole_request": True,
                "uses_existing_images": True,
            }

        monkeypatch.setattr(image_generation, "generate_structured", says_edit)
        nothing = asyncio.run(image_generation.wanted_image("make it night-time"))
        assert nothing is not None and nothing.edit is False
        something = asyncio.run(
            image_generation.wanted_image("make it night-time", has_previous_image=True)
        )
        assert something is not None and something.edit is True

    def test_the_turns_own_attachments_are_the_references(self):
        import base64
        from types import SimpleNamespace

        from app.services.image_generation import MAX_REFERENCE_IMAGES, reference_images

        png = base64.b64encode(b"\x89PNG fake").decode()
        attachments = [
            SimpleNamespace(type="image", data=f"data:image/webp;base64,{png}", mime_type="image/png"),
            SimpleNamespace(type="image", data=png, mime_type="image/jpeg"),
            # A document is never a picture to draw from.
            SimpleNamespace(type="document", data=png, mime_type="application/pdf"),
        ]
        refs = reference_images(attachments, {"owner": "x", "id": "y"})
        # The data-URI header wins over the declared type, and the previous
        # picture is not read when the turn brought its own.
        assert refs == [(b"\x89PNG fake", "image/webp"), (b"\x89PNG fake", "image/jpeg")]

        many = [SimpleNamespace(type="image", data=png, mime_type="image/png")] * 20
        assert len(reference_images(many, None)) == MAX_REFERENCE_IMAGES

    def test_without_attachments_it_edits_the_last_picture_drawn(self, monkeypatch):
        from app.services import image_generation

        asked: list[str] = []

        def fake_download(key):
            asked.append(key)
            if key.endswith(".webp"):
                return b"webp bytes"
            raise FileNotFoundError(key)

        monkeypatch.setattr(image_generation, "download_file", fake_download)
        refs = image_generation.reference_images([], {"owner": "owner-1", "id": "img-1"})
        assert refs == [(b"webp bytes", "image/webp")]
        assert asked == ["generated/owner-1/img-1.webp"]
        # Nothing to read back is not an error - the picture is drawn from
        # the prompt instead.
        monkeypatch.setattr(
            image_generation, "download_file", lambda key: (_ for _ in ()).throw(KeyError(key))
        )
        assert image_generation.reference_images([], {"owner": "o", "id": "i"}) == []
