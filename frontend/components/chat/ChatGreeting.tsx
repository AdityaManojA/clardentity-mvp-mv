"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth";
import { greetingFor, invitationFor, isFirstRun } from "@/lib/greeting";

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

export function ChatGreeting({ seed }: { seed?: string | null }) {
  const { user } = useAuth();
  const name = user?.display_name ?? null;
  // Someone who signed up a minute ago is not coming back, and the night
  // band is the one that would tell them they were.
  const firstRun = isFirstRun(user?.onboarding_completed_at);
  const text = useSyncExternalStore(
    subscribe,
    // Object.is on two equal strings is true, so recomputing here is free
    // and never retriggers a render.
    () => greetingFor(name, { firstRun }).text,
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
          pair reads as one thought rather than two headings. One of twenty,
          per chat - some run to two lines, hence the measure. */}
      <p className="mx-auto mt-2 max-w-md text-balance text-sm text-ink-muted sm:text-base">
        {invitationFor(seed)}
      </p>
    </div>
  );
}

/** What an empty temporary chat says instead of the greeting: what the
 *  header's dashed bubble did, in the words the chat is held to. The server
 *  keeps every one of these promises (app/services/temporary_chats.py). */
export function TemporaryChatIntro() {
  return (
    <div className="animate-[fade-in_0.4s_ease] text-center">
      <p className="text-2xl font-medium text-ink-secondary sm:text-3xl">Temporary chat</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted sm:text-base">
        This chat won&apos;t appear in your history or shape your profile, and it&apos;s
        deleted when you leave it.
      </p>
    </div>
  );
}

/** The line Guidance and Healthcare open with, under the greeting: that this
 *  is an AI, and what it is not. Said once, plainly, before anything is
 *  asked - which is what California's companion-chatbot law (SB 243) and
 *  the EU AI Act's transparency duty ask for, and what anyone would want to
 *  know before telling a machine about their health or their worst week. */
export const MODE_DISCLOSURE: Record<string, string> = {
  guidance:
    "Guidance is an AI companion - not a therapist, counsellor or crisis service. If you're in danger, call your local emergency number.",
  healthcare:
    "Healthcare is an AI giving general health information - not a doctor or a diagnosis, it can be wrong, and it is not for emergencies.",
};

export function ModeDisclosure({ mode, className }: { mode: string | null; className?: string }) {
  const text = mode ? MODE_DISCLOSURE[mode] : undefined;
  if (!text) return null;
  return (
    <p className={className ?? "mx-auto mt-3 max-w-md text-balance text-center text-xs text-ink-muted"}>
      {text}
    </p>
  );
}
