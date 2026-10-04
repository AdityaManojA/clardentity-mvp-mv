"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useHasStoredSession } from "@/lib/auth";

/** Sends someone who is already signed in into the app instead of showing
 *  them a sign-in form.
 *
 *  The reason this is needed at all is the back button. Signing in used to
 *  `push` the next page, which left the form in the history, so one press of
 *  Back after signing in put the login screen in front of someone whose
 *  session was perfectly intact - and a login screen is indistinguishable
 *  from having been logged out. The `replace` at the sign-in points is the
 *  real fix; this covers everything else that can land on the form with a
 *  session in hand: a bookmark, a deep link, a restored tab, the browser's
 *  back-forward cache.
 *
 *  It decides from the stored token rather than waiting for /auth/me, so
 *  there is nothing to see while it makes its mind up. A token that turns
 *  out to be dead costs one bounce: the app sends them straight back here,
 *  by which point it has been cleared and the form is the right answer.
 */
export function RedirectIfSignedIn() {
  const hasSession = useHasStoredSession();
  const router = useRouter();
  // One redirect per mount. StrictMode runs this twice in development, and
  // two identical replace() calls leave the router with a navigation it
  // never commits - the page stays put with the URL unchanged.
  const sent = useRef(false);

  useEffect(() => {
    if (!hasSession || sent.current) return;
    sent.current = true;
    router.replace("/start");
  }, [hasSession, router]);

  return null;
}
