"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth";
import { greetingFor } from "@/lib/greeting";

/* What an empty chat says.
 *
 * The greeting reads the clock, and the clock is not the same on the server
 * as in the browser: rendering "Good evening" in one timezone and "Good
 * morning" in another is a hydration mismatch, which React resolves by
 * throwing the markup away and warning about it.
 *
 * useSyncExternalStore is the sanctioned way to say "this value only exists
 * on the client" - the server snapshot is null, the client snapshot is the
 * greeting, and React swaps them at hydration without complaint. An effect
 * writing state would do the same job and is what this was first written
 * as; the lint forbids it, and is right to, because the same shape with a
 * dependency that changes identity is an infinite render loop.
 *
 * It also makes the first paint empty, which is the kinder order anyway: a
 * greeting that fades in reads as the room noticing you walked in, and one
 * that is simply already there reads as a heading.
 */

/** Nothing pushes a new greeting, so there is nothing to subscribe to. The
 *  value is re-read on every render, which is when the name can change. */
function subscribe(): () => void {
  return () => {};
}

export function ChatGreeting() {
  const { user } = useAuth();
  const name = user?.display_name ?? null;
  const text = useSyncExternalStore(
    subscribe,
    // Object.is on two equal strings is true, so recomputing here is free
    // and never retriggers a render.
    () => greetingFor(name).text,
    () => null,
  );

  if (!text) return null;
  return (
    <div className="animate-[fade-in_0.4s_ease] text-center">
      <p
        // Large and quiet. It is the only thing on the screen above the
        // composer, so it can afford the size, and it must not look like a
        // question waiting to be answered.
        className="text-2xl font-medium text-ink-secondary sm:text-3xl"
      >
        {text}
      </p>
      {/* The invitation under the greeting. The greeting says the app
          noticed you; this says what it is for. Quieter and smaller, so the
          pair reads as one thought rather than two headings. */}
      <p className="mt-2 text-sm text-ink-muted sm:text-base">
        Let&apos;s accomplish something today.
      </p>
    </div>
  );
}
