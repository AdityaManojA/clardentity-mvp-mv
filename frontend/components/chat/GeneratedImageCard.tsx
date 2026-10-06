"use client";

import { API_BASE_URL } from "@/lib/apiClient";
import type { GeneratedImage } from "@/lib/sse";

/* A picture made during a Co-Creative turn.
 *
 * Shown as part of the answer rather than as an attachment, because it is
 * the answer - "draw me a logo" was not a request for a paragraph with a
 * file clipped to it.
 *
 * The prompt underneath is not decoration. What reaches the image model is
 * rewritten from the conversation, not copied from the message, so the only
 * way to know why you got this picture rather than another one is to see the
 * sentence it was actually drawn from. It doubles as the alt text.
 */
export function GeneratedImageCard({ image }: { image: GeneratedImage }) {
  // Served by id straight from the API: an <img> cannot carry an
  // Authorization header, so the uuid in the path is the capability.
  const src = `${API_BASE_URL}/images/${image.owner}/${image.id}.png`;

  return (
    <figure className="mb-2.5 overflow-hidden rounded-xl border border-hairline bg-surface">
      <a href={src} target="_blank" rel="noreferrer" className="block">
        {/* Square by construction - the model is asked for 1024x1024 - so the
            box can reserve its space before the bytes land and the answer
            below it does not jump when they do. */}
        {/* A plain <img>, not next/image. These come from our own API at a
            uuid path that exists only for this one user, so there is nothing
            for the optimiser to cache across visitors - it would bill a
            transformation per image for no reuse, and need the API host in
            remotePatterns to do it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={image.prompt}
          width={1024}
          height={1024}
          loading="lazy"
          className="block aspect-square w-full max-w-[420px] object-cover"
        />
      </a>
      <figcaption className="px-3.5 py-2 text-xs leading-relaxed text-ink-muted">
        {image.prompt}
      </figcaption>
    </figure>
  );
}
