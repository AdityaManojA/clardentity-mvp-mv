"""Serving a generated image back to the page that asked for it.

Deliberately unauthenticated, which deserves an explanation. These URLs go
into an `<img>` tag, and an `<img>` cannot carry an Authorization header -
the alternatives are fetching every image as a blob in JavaScript (no
browser caching, and a broken image on every history load until the fetch
lands) or making the URL itself the capability. This takes the second, the
way presigned object-store URLs do: the id is a uuid4, so a URL cannot be
guessed and the route has nothing to enumerate.

What it is NOT is a way to reach anyone else's image. The path carries the
owner, the object key is built from it, and nothing here reads a database -
there is no query that could return the wrong row because there is no query.
"""

import uuid

from fastapi import APIRouter, HTTPException, Response, status

from app.services.image_generation import storage_key
from app.services.storage import download_file

router = APIRouter(prefix="/images", tags=["images"])


@router.get("/{owner_id}/{image_id}.png")
async def read_generated_image(owner_id: uuid.UUID, image_id: uuid.UUID) -> Response:
    try:
        data = download_file(storage_key(owner_id, image_id))
    except Exception as exc:  # noqa: BLE001 - any storage miss is a 404
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found"
        ) from exc
    return Response(
        content=data,
        media_type="image/png",
        headers={
            # The bytes behind a given id never change, so this can be cached
            # hard. `private` keeps it out of shared caches.
            "Cache-Control": "private, max-age=31536000, immutable",
        },
    )
