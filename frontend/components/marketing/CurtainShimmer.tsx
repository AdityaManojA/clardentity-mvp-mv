"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

/* Light running along the curtain under the cursor.
 *
 * The effect is the asset, not a drawing of it: a second copy of the same
 * curtain image, brightened and a little more saturated, laid in exactly the
 * same place as the first and then masked down to almost nothing. What shows
 * through is a soft horizontal pool of light following the pointer, cut into
 * vertical bands so it reads as individual pleats catching it rather than a
 * spotlight sliding across a flat picture. The colour is whatever the
 * photograph already has there - crimson in the folds, near-black at the
 * edges - which is why it sits in the page rather than on top of it.
 *
 * PLEAT is measured from the picture rather than guessed: a column-brightness
 * profile of the band the design actually shows, autocorrelated, has its
 * strongest repeat at 1.709% of the image's width - about fifty pleats across
 * the stage. The bands line up with the real folds because that is where the
 * number came from.
 */
const PLEAT = 1.709; // % of the image's width, one fold to the next
const LIT = 0.62; // how much of each pleat catches the light
const REACH = 16; // % of the image's width the pool spans either side

/* The burgundy, sampled from the curtain itself rather than picked: the mean
 * of every lit-fabric pixel in the band the design shows is #A72341, and the
 * folds that face the light average #D74564. Every pleat is lit in exactly
 * these, so the shimmer is one shade across the whole stage.
 *
 * Brightening a copy of the photograph was the first attempt and was wrong
 * twice over: brightness() walks the colour toward white, so the crimson came
 * back pink, and the picture is not evenly lit, so each pleat lit to a
 * different shade depending on what was behind it. */
const BURGUNDY = "#a72341";
const BURGUNDY_LIT = "#d74564";

export function CurtainShimmer({
  style,
}: {
  /** The base image's geometry, so the light lands exactly on the curtain. */
  style: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    // The stage is this element's parent: it is the thing with a size and
    // the thing the pointer is actually over.
    const stage = node?.parentElement;
    if (!node || !stage || reducedMotion) return;

    let frame = 0;
    let pending: number | null = null;

    /* Written straight to the element's own custom properties rather than
       held in React state: this fires on every pointer move, and a page-wide
       re-render per mouse position is a lot of work to move a gradient. */
    const paint = () => {
      frame = 0;
      if (pending === null) return;
      node.style.setProperty("--shimmer-x", `${pending}%`);
    };

    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      pending = ((event.clientX - rect.left) / rect.width) * 100;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onEnter = (event: PointerEvent) => {
      onMove(event);
      node.style.setProperty("--shimmer-on", "1");
    };

    const onLeave = () => {
      node.style.setProperty("--shimmer-on", "0");
    };

    // Pointer events rather than mouse: a finger on a touchscreen gets the
    // same light where it taps, which is a small delight and costs nothing.
    stage.addEventListener("pointerenter", onEnter);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointercancel", onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      stage.removeEventListener("pointerenter", onEnter);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointercancel", onLeave);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  /* Two masks, intersected. The radial one is the pool of light around the
     pointer; the repeating one is the pleats. Where both are opaque, the
     brightened copy shows - so the light only ever appears on a fold, and
     only near the cursor. */
  const mask = [
    `radial-gradient(${REACH}% 120% at var(--shimmer-x, 50%) 50%, #000 0%, rgba(0,0,0,0.55) 45%, transparent 78%)`,
    `repeating-linear-gradient(90deg, #000 0 ${(PLEAT * LIT).toFixed(3)}%, transparent ${(PLEAT * LIT).toFixed(3)}% ${PLEAT}%)`,
  ].join(", ");

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="landing-shimmer pointer-events-none absolute"
      style={{
        ...style,
        maskImage: mask,
        WebkitMaskImage: mask,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
      }}
    >
      {/* One flat burgundy, the curtain's own, rather than a brightened copy
          of it - so pleat forty looks exactly like pleat one. The gradient
          across each band is the single shade going from its lit value at
          the fold's edge to its base value in the hollow, which is the
          shading a real pleat has; `screen` lets it sit into the fabric as
          light rather than over it as paint. */}
      <span
        className="block h-full w-full"
        style={{
          backgroundImage: `linear-gradient(90deg, ${BURGUNDY_LIT} 0%, ${BURGUNDY} 70%, ${BURGUNDY} 100%)`,
          backgroundSize: `${PLEAT}% 100%`,
          mixBlendMode: "screen",
        }}
      />
    </span>
  );
}
