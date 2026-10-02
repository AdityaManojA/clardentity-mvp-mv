"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

export type Theme = "light" | "dark";
export type Accent = "burgundy" | "indigo" | "teal" | "plum";

const STORAGE_KEY = "clardentity-theme";
const ACCENT_KEY = "clardentity-accent";
/* Where lib/auth keeps the session. Read as a string here rather than through
   useAuth: the init script below runs before any of it has loaded, and the two
   have to agree on the rule. */
const TOKEN_KEY = "clardentity_access_token";
/* The marketing page, and the one route an accent does not reach unless the
   person asking for it is signed in. */
const LANDING_PATH = "/";

/** The accents, in the order the picker shows them. `swatch` is the accent
 *  itself - what the dot in the picker is painted with. */
export const ACCENTS: Array<{ value: Accent; label: string; swatch: string }> = [
  { value: "burgundy", label: "Burgundy", swatch: "#6b2d5c" },
  { value: "indigo", label: "Indigo", swatch: "#2d3561" },
  { value: "teal", label: "Teal", swatch: "#0d7c7b" },
  { value: "plum", label: "Plum Velvet", swatch: "#4b2f64" },
];

/* Runs before first paint, inlined into <head>. Without it the page renders
   once with the light tokens and then swaps, which on a dark-mode machine is a
   full-screen white flash on every fresh document load.

   Kept in sync by hand with applyTheme() below - it has to be a plain string
   because it executes before any bundle has loaded. */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    var accent = localStorage.getItem(${JSON.stringify(ACCENT_KEY)});
    var signedIn = !!localStorage.getItem(${JSON.stringify(TOKEN_KEY)});
    var onLanding = location.pathname === ${JSON.stringify(LANDING_PATH)};
    if (accent && accent !== "burgundy" && (!onLanding || signedIn)) {
      document.documentElement.dataset.accent = accent;
    } else {
      delete document.documentElement.dataset.accent;
    }
  } catch (e) {}
})();
`;

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  // Drives the native bits CSS variables can't reach: form controls, the
  // scrollbar gutter, and the canvas behind an over-scroll bounce.
  document.documentElement.style.colorScheme = theme;
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Flip the theme and remember the choice.
 *
 *  Deliberately not React state: the <html> attribute set by the init script
 *  is already the single source of truth, and mirroring it into a hook would
 *  mean the server renders one value, hydration renders another, and the
 *  toggle flickers on every page load. Nothing re-renders here - the CSS
 *  keyed on [data-theme] does all the work.
 */
export function toggleTheme() {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
  announce();
}

/* ---------------------------------------------------------------------
   The accent.

   Burgundy is the one the product was designed in and stays the default, so
   it is the absence of the attribute rather than a value of it - which also
   means an account that never opens the picker renders exactly the CSS it
   always did.

   The marketing page is the exception the client asked for: a visitor who has
   never signed in sees it in burgundy whatever a stale key in their browser
   says, and it only takes someone's accent once they are signed in. That rule
   lives in two places because it has to run in two: here, and as a string in
   the init script above, before any of this has loaded.
   --------------------------------------------------------------------- */

function accentApplies(accent: string | null, pathname: string): boolean {
  if (!accent || accent === "burgundy") return false;
  if (pathname !== LANDING_PATH) return true;
  try {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  } catch {
    return false;
  }
}

function applyAccent(pathname: string) {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(ACCENT_KEY);
  } catch {
    // A browser with storage blocked gets the default, which is the design.
  }
  if (accentApplies(stored, pathname)) {
    document.documentElement.dataset.accent = stored as string;
  } else {
    delete document.documentElement.dataset.accent;
  }
}

export function currentAccent(): Accent {
  const stored = document.documentElement.dataset.accent;
  return ACCENTS.some((a) => a.value === stored) ? (stored as Accent) : "burgundy";
}

/** What the picker should show as selected - the choice, not what is on
 *  screen. On the landing page signed out those differ, and the picker is
 *  never on the landing page anyway. */
export function storedAccent(): Accent {
  try {
    const stored = localStorage.getItem(ACCENT_KEY);
    return ACCENTS.some((a) => a.value === stored) ? (stored as Accent) : "burgundy";
  } catch {
    return "burgundy";
  }
}

/* The <html> attributes are the store; this is how React subscribes to it.
   An event rather than polling, because the three things that write it - the
   picker, the topbar toggle and the route rule - all go through here. */
const APPEARANCE_EVENT = "clardentity:appearance";

function announce() {
  window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT));
}

export function setAccent(accent: Accent) {
  localStorage.setItem(ACCENT_KEY, accent);
  applyAccent(window.location.pathname);
  announce();
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  announce();
}

/** The current choice, as "<accent>:<theme>" - one string so the snapshot is
 *  referentially stable between renders. Server-rendered as the design's own
 *  defaults, which is what an account that has never touched it has. */
export function useAppearance(): { accent: Accent; theme: Theme } {
  const snapshot = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(APPEARANCE_EVENT, onChange);
      return () => window.removeEventListener(APPEARANCE_EVENT, onChange);
    },
    () => `${storedAccent()}:${currentTheme()}`,
    () => "burgundy:light",
  );
  const [accent, theme] = snapshot.split(":");
  return { accent: accent as Accent, theme: theme as Theme };
}

/** Re-runs the accent rule on every route change, because the rule depends on
 *  the route: the init script settled it for the document that loaded, and a
 *  click from the app to the marketing page never loads another one. */
export function AccentScope() {
  const pathname = usePathname();
  useEffect(() => {
    applyAccent(pathname ?? window.location.pathname);
  }, [pathname]);
  return null;
}

/** Keeps the app following the OS until the user picks a side themselves. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange(e: MediaQueryListEvent) {
      if (localStorage.getItem(STORAGE_KEY)) return;
      applyTheme(e.matches ? "dark" : "light");
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return <>{children}</>;
}
