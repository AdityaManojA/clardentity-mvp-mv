"use client";

import { useSyncExternalStore } from "react";

/* Consent for product analytics.
 *
 * The sign-in tokens are strictly necessary - without them the app cannot
 * work - so they need no permission. Analytics are not necessary, so they
 * wait to be asked for: nothing is sent, and the SDK is not even downloaded,
 * until someone says yes. Declining is a real answer that is remembered, not
 * a banner that reappears until it wears you down.
 */

const STORAGE_KEY = "clardentity-consent";

export type Consent = "granted" | "denied" | "unset";

let snapshot: Consent | null = null;
const listeners = new Set<() => void>();

function read(): Consent {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    // Private mode, or storage blocked. Treated as not having been asked -
    // which means analytics stay off, the safe reading.
    return "unset";
  }
}

function getSnapshot(): Consent {
  if (snapshot === null) snapshot = read();
  return snapshot;
}

export function setConsent(next: Exclude<Consent, "unset">) {
  snapshot = next;
  // Recorded through the analytics module itself, which means "granted" is
  // counted and "denied" is not - the only honest arrangement, and the
  // reason the acceptance rate has to be read as a floor rather than a rate.
  void import("@/lib/analytics").then((m) =>
    m.track("consent_choice", { choice: next }),
  );
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // The choice holds for this page at least; the banner will ask again on
    // the next visit, which is the honest outcome of unwritable storage.
  }
  listeners.forEach((fn) => fn());
}

/** For the "change your mind" link: forget the answer and ask again. */
export function resetConsent() {
  snapshot = "unset";
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to undo */
  }
  listeners.forEach((fn) => fn());
}

/** Read outside React - the analytics module checks this before every send. */
export function consentGranted(): boolean {
  return getSnapshot() === "granted";
}

export function useConsent(): Consent {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    getSnapshot,
    // Server render: assume not asked, so no banner flashes before hydration
    // decides whether it is needed.
    () => "unset",
  );
}
