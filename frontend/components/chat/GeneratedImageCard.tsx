"use client";

import { API_BASE_URL } from "@/lib/apiClient";
import type { GeneratedImage } from "@/lib/sse";

/* A picture made during a Co-Creative turn.
 *
 * Shown as part of the answer rather than as an attachment, because it is
 * the answer - "draw me a logo" was not a request for a paragraph with a
 * file clipped to it.
 *
 * No caption. When someone asks for a picture they get a picture - the
 * essay that used to come with it was the thing being complained about, and
 * a line of prose under the frame is the same answer in miniature. The
 * prompt is still there as the alt text and on hover, so the question "why
 * this picture?" is one pointer away and screen readers are unaffected.
 */
export function GeneratedImageCard({ image }: { image: GeneratedImage }) {
  // Served by id straight from the API: an <img> cannot carry an
  // Authorization header, so the uuid in the path is the capability.
  // WebP, because the PNG the model returns is 2.4MB and spent several
  // seconds as a blank square - long enough to read as no image at all.
  const src = `${API_BASE_URL}/images/${image.owner}/${image.id}.webp`;

  return (
    <figure className="mb-2.5 w-fit overflow-hidden rounded-xl border border-hairline bg-surface">
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
          title={image.prompt}
          width={1024}
          height={1024}
          loading="eager"
          className="block aspect-square w-full max-w-[420px] object-cover"
        />
      </a>
    </figure>
  );
}

/** The square the picture will land in, held while it is being made.
 *
 *  Generating one takes fifteen to twenty seconds, which is longer than the
 *  answer beside it takes to write - so without this the reply looks
 *  finished, and the image arriving afterwards looks like it was never
 *  coming. Reserving the space also stops the answer jumping when it lands.
 */
export function GeneratedImagePlaceholder() {
  return (
    <figure className="mb-2.5 overflow-hidden rounded-xl border border-hairline bg-surface">
      <div className="flex aspect-square w-full max-w-[420px] items-center justify-center bg-surface-muted">
        <span className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="size-2 animate-pulse rounded-full bg-brand" />
          Making the image…
        </span>
      </div>
    </figure>
  );
}
