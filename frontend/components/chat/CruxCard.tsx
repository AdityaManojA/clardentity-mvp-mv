"use client";

import { MaskIcon } from "@/components/ui/MaskIcon";
import { renderInline } from "@/lib/markdown";
import { cleanMessageText } from "@/lib/text";

/** The model's own one-sentence bottom line - the first and, for most
 *  readers, the only thing they read of an answer. Not itself collapsible:
 *  it's the summary the fold exists to sit under, so it has to already be
 *  visible for the fold to make sense. No heading, either; the frame does the
 *  work of saying "this is the content" (a gradient hairline, a brand-tinted
 *  glow, larger type and a single sheen pass when it arrives), and a label on
 *  top of it read as a second title competing with the mode. */
export function CruxCard({ text }: { text: string }) {
  return (
    <div className="gist-card mb-2.5">
      <div className="gist-card-inner px-3.5 py-3">
        {/* Parked off-canvas (and never animated) under prefers-reduced-motion
            - see globals.css. */}
        <span aria-hidden="true" className="gist-sheen" />
        <div className="flex items-start gap-2.5">
          {/* The mark, not a spark. A four-point sparkle is the glyph every
              other assistant puts next to generated text, so on the one line
              of an answer most people actually read it said "an AI wrote
              this" in someone else's handwriting. The five dots say whose
              this is. Painted through a mask so it follows the accent. */}
          <span className="mt-[3px] flex shrink-0 text-brand">
            <MaskIcon
              src="/ui/logo-dots.svg"
              // 23.0292 x 22.2755 in the file; height drives it and the width
              // keeps that ratio, since the mark is not square.
              style={{ height: 16, width: 16.54 }}
            />
          </span>
          <p className="text-xl font-semibold leading-snug tracking-[-0.01em] text-ink">
            {renderInline(cleanMessageText(text), "crux")}
          </p>
        </div>
      </div>
    </div>
  );
}
