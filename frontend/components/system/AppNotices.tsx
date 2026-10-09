"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth";
import { isFirstRun, welcomeBackFor } from "@/lib/greeting";
import {
  importStashedTranscript,
  importedServerSnapshot,
  importedSnapshot,
  markImportAnnounced,
  subscribeImported,
} from "@/lib/guestHandoff";

/* The two things the app says to you on arrival, in one strip above
 * everything else.
 *
 * They are together because they can happen in the same second - someone
 * who tried the landing demo, signed up, and is now here for the first
 * time - and two separately-positioned floating cards would overlap. One
 * strip stacks them.
 */

export function AppNotices() {
  return (
    <div
      // Below the topbar, not over it. Centred at the very top it sat across
      // the breadcrumb, and the saved-conversation notice stays until it is
      // dismissed - so it would have covered the trail back to the workspace
      // for as long as the user ignored it.
      className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center gap-2 px-4"
      style={{ top: "calc(var(--topbar-height) + 12px)" }}
    >
      <WelcomeBack />
      <SavedFromDemo />
    </div>
  );
}

/** Shown once per time the app is opened.
 *
 *  Per *opening*, not per page: sessionStorage is scoped to the tab and
 *  survives navigation within it, so moving between chats does not re-greet
 *  anyone, and closing the app and coming back does. That is the behaviour
 *  asked for - "when they open the desktop view/app view" - and it is the
 *  one thing a render-count or a timestamp would get wrong.
 */
const SEEN_KEY = "clardentity.greetedThisSession";
const VISIBLE_MS = 4500;

/** Whether this tab has been greeted yet, answered once and then
 *  remembered.
 *
 *  Cached in the module rather than re-read, because the read has a side
 *  effect - it also writes the flag - and React renders a component twice
 *  in development. Without the cache the second render would be told the
 *  tab had already been greeted, by the first render, and nobody would ever
 *  see it.
 */
let claimed: boolean | undefined;

function claimTheGreeting(): boolean {
  if (claimed !== undefined) return claimed;
  try {
    const seen = window.sessionStorage.getItem(SEEN_KEY);
    claimed = !seen;
    if (!seen) window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Private window: greet on every load rather than never. Erring
    // towards the friendly failure.
    claimed = true;
  }
  return claimed;
}

function subscribe(): () => void {
  return () => {};
}

function WelcomeBack() {
  const { user } = useAuth();
  // A brand-new account is being welcomed properly on /welcome; saying
  // "welcome back" to someone who has never been here is the kind of detail
  // that makes an app feel automated.
  //
  // "Has finished onboarding" was the wrong test for that, because finishing
  // onboarding is the last thing a brand-new account does before arriving
  // here - the gate was open for precisely the person it was meant to stop.
  // How long ago it finished is the test that works.
  const eligible = !!user && !isFirstRun(user.onboarding_completed_at);
  const show = useSyncExternalStore(
    subscribe,
    () => eligible && claimTheGreeting(),
    () => false,
  );
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!show) return;
    // setState in the timer's callback, not in the effect body - the body
    // running setState is what the lint forbids, and what turns a changing
    // dependency into a render loop.
    const timer = setTimeout(() => setHidden(true), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [show]);

  const text = show && !hidden ? welcomeBackFor(user?.display_name) : null;
  if (!text) return null;
  return (
    <div
      role="status"
      className="pointer-events-auto rounded-full border border-hairline bg-surface-raised px-4 py-2 text-sm text-ink shadow-lg animate-[fade-in_0.3s_ease]"
    >
      {text}
    </div>
  );
}

/** The demo conversation, now that there is an account to put it in.
 *
 *  The import runs here rather than at the moment of signing up, because
 *  this is the first component that is certainly mounted with a token in
 *  hand however the account was reached - the register form, Google, or
 *  coming back tomorrow and signing in. It is a localStorage read when
 *  there is nothing waiting, which is almost always.
 */
function SavedFromDemo() {
  const { user } = useAuth();
  // Read from the store rather than from the promise: on the sign-up path
  // the shell mounts and unmounts around /welcome and /start, and awaiting
  // the import inside an effect made "was the user told" depend on which
  // side of a redirect the response landed. It landed on the wrong side,
  // three times, in production.
  const saved = useSyncExternalStore(
    subscribeImported,
    importedSnapshot,
    importedServerSnapshot,
  );

  useEffect(() => {
    // Starting it is all this does now; the store carries the answer.
    if (user) void importStashedTranscript();
  }, [user]);

  if (!saved) return null;
  return (
    <div
      role="status"
      className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-brand-border bg-brand-soft px-4 py-2.5 text-sm text-ink shadow-lg animate-[fade-in_0.3s_ease]"
    >
      <span>
        Your demo conversation is saved
        <span className="text-ink-muted"> · {saved.message_count} messages</span>
      </span>
      <Link
        href={`/chat/${saved.conversation_id}`}
        onClick={markImportAnnounced}
        className="font-medium text-brand hover:underline"
      >
        Open it
      </Link>
      <button
        type="button"
        onClick={markImportAnnounced}
        aria-label="Dismiss"
        className="ml-auto flex size-6 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" aria-hidden="true" className="size-3.5">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
