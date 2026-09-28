"use client";

import Link from "next/link";
import { setConsent, useConsent } from "@/lib/consent";

/* The analytics consent banner.
 *
 * Two buttons of equal weight. A banner where "accept" is a filled button
 * and "decline" is grey six-point text is a dark pattern with a legal
 * opinion attached, and this product's whole pitch is that it does not do
 * that sort of thing. Declining is one tap, is remembered, and costs the
 * user nothing.
 *
 * It only appears when there is something to consent to: no analytics key
 * configured means no banner at all, which is also what local development
 * and CI see.
 */
export function ConsentBanner() {
  const consent = useConsent();
  const configured = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

  if (!configured || consent !== "unset") return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      // Above the composer, below a modal. Fixed to the bottom on a phone,
      // a card in the corner on a desktop - either way it never covers the
      // thing someone came here to type into.
      className="fixed inset-x-0 bottom-0 z-40 p-3 sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-sm sm:p-0"
    >
      <div className="rounded-xl border border-hairline bg-surface-raised p-4 shadow-2xl">
        <p className="text-sm font-medium text-ink">Help us see what works?</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
          We&apos;d like to count which features get used and where people get stuck. Never your
          questions, your answers, your files or your email - those stay out of it entirely.
          Signing in works either way.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className="flex-1 rounded-full border border-brand-border bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-white"
          >
            Allow
          </button>
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className="flex-1 rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
          >
            No thanks
          </button>
        </div>
        <p className="mt-2.5 text-[11px] text-ink-muted">
          <Link href="/privacy" className="hover:underline">
            What we collect
          </Link>
          {" · "}
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}
