import { useSyncExternalStore } from "react";

/* The phone layout: below the lg breakpoint, where the shell is a drawer.
 * The same line globals.css draws for phone-only styles (max-width 1023.98px)
 * - for the few phone-only behaviours that live in script rather than CSS. */
const QUERY = "(max-width: 1023.98px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function usePhoneLayout(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
