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
        assert key.endswith(".png")

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
