"use client";

import { useAuth, useHasStoredSession } from "@/lib/auth";
import { LandingPage } from "@/components/marketing/LandingPage";

export default function Home() {
  // Deliberately not gated on `loading`. This is a public page, so signed-out
  // is the right default: gating the calls to action on an auth check meant
  // the server-rendered HTML shipped with no way in at all, and a visitor
  // with a stale token sat looking at a landing page with no entry point
  // until the auth request came back - up to a minute on a cold backend.
  const { user } = useAuth();
  // A stored token counts as signed in straight away; /auth/me only ever
  // downgrades it (by clearing the token) if it turns out to be dead.
  const hasStoredSession = useHasStoredSession();

  return <LandingPage signedIn={Boolean(user) || hasStoredSession} />;
}
