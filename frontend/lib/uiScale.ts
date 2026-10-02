/* The interface is drawn at four fifths on anything wider than a phone - see
 * the --ui-zoom block in globals.css for why.
 *
 * That is a CSS zoom on the root, which leaves one seam for scripts to fall
 * into: `getBoundingClientRect()` answers in screen pixels, while an inline
 * `top`/`left` is read in the zoomed layout's own pixels and multiplied by the
 * factor on the way to the screen. Measure something and put a panel where it
 * is, and the panel lands a quarter of the way further down the page than the
 * thing it is pointing at.
 *
 * So anything that measures and then positions converts once, here.
 */

/** What the root is zoomed to right now: 0.8 above the phone breakpoint, 1 on
 *  a phone, and 1 anywhere the property is missing or nonsense. */
export function uiZoom(): number {
  if (typeof document === "undefined") return 1;
  const raw = getComputedStyle(document.documentElement).zoom;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/** A measured rectangle, in the pixels an inline style is written in. */
export function toLayoutRect(rect: DOMRect): {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
} {
  const z = uiZoom();
  return {
    top: rect.top / z,
    left: rect.left / z,
    width: rect.width / z,
    height: rect.height / z,
    bottom: rect.bottom / z,
    right: rect.right / z,
  };
}

/** The window, in the same pixels - what to clamp a panel against. */
export function layoutViewport(): { width: number; height: number } {
  const z = uiZoom();
  return { width: window.innerWidth / z, height: window.innerHeight / z };
}
