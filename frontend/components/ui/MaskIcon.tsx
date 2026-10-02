import { cx } from "@/components/ui/primitives";

/** One of the design's own marks, drawn in the colour of whatever it sits in.
 *
 *  The SVGs that came out of Figma carry the colour they were drawn with
 *  baked into every path - #5F5551 for the sidebar, #6B5C60 for the mode
 *  rail. Dropped into an <img> that is the end of it: they stay that colour
 *  when the card is selected, and they disappear entirely in dark mode, where
 *  a near-black mark sits on a near-black surface.
 *
 *  So the file is used as a mask and the colour comes from `currentColor`
 *  instead. The mark then follows the text beside it everywhere - hover,
 *  selection, both themes - without a second copy of the asset per state.
 */
export function MaskIcon({
  src,
  className,
  size,
}: {
  src: string;
  className?: string;
  /** Drawn size in px; the mask is scaled to fit it. Leave it out and give
   *  the box its size in `className` instead - which is the only way to draw
   *  one of these that isn't square. */
  size?: number;
}) {
  const mask = `url(${src}) center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      className={cx("block shrink-0", className)}
      // The paint is inline, not a `bg-current` class: this build of Tailwind
      // doesn't emit that one, and a mask over a transparent background is an
      // icon nobody can see.
      style={{
        ...(size === undefined ? null : { width: size, height: size }),
        backgroundColor: "currentColor",
        mask,
        WebkitMask: mask,
      }}
    />
  );
}
