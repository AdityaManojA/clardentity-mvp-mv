"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { cx } from "@/components/ui/primitives";

/* The account card's menu.
 *
 * The foot of the sidebar used to be a card you clicked to reach the profile
 * with a log-out icon bolted to its right - a door-with-an-arrow glyph that
 * means "exit" to people who already know it means exit. Everything the
 * account can do now lives behind the card itself: where you are, what the
 * app does, and the way out, named in words.
 *
 * It opens upwards because the card is the last thing in the sidebar, and
 * grows from that corner rather than fading in the middle of the screen - a
 * menu should look like it came from the thing you pressed.
 */

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-5 shrink-0">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-5 shrink-0">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-5 shrink-0">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

/* Mounted with the route as its key, so a navigation by any other means -
 * the back button, a link elsewhere in the shell - takes the open menu with
 * it. Closing it in an effect would be a setState the render could have done
 * by simply not existing. */
export function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = user?.display_name || "Signed in";
  const initial = (user?.display_name || user?.email || "?").slice(0, 1).toUpperCase();

  const item =
    "flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-hover";

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  return (
    <div ref={wrapRef} className="relative">
      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Account"
          // Anchored to the card and grown from its bottom-left corner, so it
          // reads as having come out of the thing that was pressed.
          className="account-menu absolute bottom-full left-0 z-40 mb-2 w-[calc(100%-0.5rem)] min-w-[200px] rounded-[12px] border border-hairline bg-surface-raised p-1.5 shadow-xl"
        >
          <p className="truncate px-2.5 pb-1.5 pt-1 text-xs text-ink-muted" title={user?.email}>
            {user?.email}
          </p>
          <div className="my-1 border-t border-hairline" />
          <button type="button" role="menuitem" className={item} onClick={() => go("/profile")}>
            <PersonIcon />
            Profile
          </button>
          <button type="button" role="menuitem" className={item} onClick={() => go("/settings")}>
            <GearIcon />
            Settings
          </button>
          <div className="my-1 border-t border-hairline" />
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false);
              logout();
              // replace, so Back after signing out does not return to the app
              // shell with no session behind it - which only bounces straight
              // here again.
              router.replace("/login");
            }}
          >
            <LeaveIcon />
            Log out
          </button>
        </div>
      )}

      <button
        type="button"
        data-tour="nav-profile"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-w-0 items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-surface-hover"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-medium text-white">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink">{name}</span>
          <span className="block truncate text-xs text-ink-muted">{user?.email}</span>
        </span>
        <Chevron open={open} />
      </button>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cx(
        "size-4 shrink-0 text-ink-muted transition-transform duration-200",
        open && "rotate-180",
      )}
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}
