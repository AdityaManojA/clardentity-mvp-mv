"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cx } from "@/components/ui/primitives";

/* Scroll-in reveal, the way a marketing page does it: a thing is nowhere,
 * then it is there, and you never catch it arriving.
 *
 * One observer per element rather than a shared one at the page level - each
 * piece has its own threshold and its own delay, and a single observer with
 * a map of callbacks is more machinery than nine elements justify.
 *
 * Once revealed, it stays revealed. Re-hiding on scroll-up is a thing pages
 * do and nobody likes: scrolling back should show you what you just read,
 * not replay it.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
  id,
}: {
  children: ReactNode;
  as?: ElementType;
  /** Milliseconds behind the element's own entrance, for staggering a row. */
  delay?: number;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  // Always false to begin with. Deriving it from `typeof
  // IntersectionObserver` looks like a tidy way to handle a browser without
  // one, and is wrong: that check also runs on the server, where there is no
  // such global either, so every section shipped already-revealed and
  // nothing ever animated.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No observer in this browser: show everything on the next frame. The
    // failure mode of this component must be a page you can read.
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      // Fires a little before the element's top edge arrives, so the motion
      // is finishing as it reaches a comfortable reading position rather
      // than starting there.
      // On the phone layout, later - a fifth of the way up the screen - so
      // it plays where it's being looked at instead of at the very edge.
      {
        threshold: 0.08,
        rootMargin: window.matchMedia("(max-width: 1023.98px)").matches ? "0px 0px -20% 0px" : "0px 0px -8% 0px",
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      className={cx("landing-reveal", className)}
      data-visible={visible ? "true" : "false"}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
