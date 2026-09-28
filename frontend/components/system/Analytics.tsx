"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { identify, resetIdentity, routePattern, track, trackPageView } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";

/** Mounted once, under the providers. Sends the session-level events - the
 *  app opening, who is signed in (by account id; never an email), and which
 *  screen is on - and nothing at all when no analytics key is configured. */
export function Analytics() {
  const pathname = usePathname();
  const { user } = useAuth();
  const opened = useRef(false);
  const identified = useRef<string | null>(null);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    track("app_opened", {
      // Enough to tell a phone from a desktop, which is the one split that
      // changes what the screens have to do. Not a fingerprint.
      viewport: window.innerWidth < 640 ? "phone" : window.innerWidth < 1024 ? "tablet" : "desktop",
      installed: window.matchMedia("(display-mode: standalone)").matches,
    });
  }, []);

  useEffect(() => {
    trackPageView(routePattern(pathname));
  }, [pathname]);

  useEffect(() => {
    if (user && identified.current !== user.id) {
      identified.current = user.id;
      identify(user.id);
      track("signed_in");
    } else if (!user && identified.current) {
      identified.current = null;
      resetIdentity();
    }
  }, [user]);

  return null;
}
