"use client";

import { useState } from "react";
import type { HealthConsentState } from "@/lib/sse";
import { cx } from "@/components/ui/primitives";

/* Healthcare asks before it answers.
 *
 * Health information is special-category or sensitive data almost everywhere
 * the product is used, and the common denominator of those laws is explicit,
 * separate, informed consent before it is processed - so this card stands
 * between someone picking Healthcare and their first question being read.
 * Every line on it comes from the server (backend api/healthcare): the
 * jurisdiction, what happens to the conversation there, the laws it is
 * given under and the age it needs. The age box is not decoration: below
 * that age the person cannot consent alone, and the card says so.
 *
 * Used by the app (consent kept on the account) and the landing demo (kept
 * for the browser session) alike. */

export function HealthConsentCard({
  state,
  onAgree,
  onDecline,
  busy = false,
  error,
}: {
  state: HealthConsentState;
  onAgree: () => void;
  onDecline: () => void;
  busy?: boolean;
  error?: string | null;
}) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  if (!state.available) {
    return (
      <section
        role="region"
        aria-label="Healthcare"
        className="rounded-2xl border border-hairline bg-surface px-4 py-3.5"
      >
        <p className="text-sm font-semibold text-ink">
          Healthcare isn&apos;t available in {state.jurisdiction.name}.
        </p>
        {state.storage_reason && (
          <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{state.storage_reason}</p>
        )}
        <button
          type="button"
          onClick={onDecline}
          className="mt-3 rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
        >
          Choose another companion
        </button>
      </section>
    );
  }

  return (
    <section
      role="region"
      aria-label="Healthcare consent"
      className="rounded-2xl border border-brand-border bg-surface px-4 py-4 animate-[fade-in_0.25s_ease]"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-brand">Before Healthcare answers</p>
      <p className="mt-1 text-sm font-semibold text-ink">
        Your health information, under the rules for {state.jurisdiction.name}
      </p>
      <ul className="mt-2 space-y-1.5">
        {state.points.map((point) => (
          <li key={point} className="flex gap-2 text-xs leading-relaxed text-ink-secondary">
            <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-ink-muted" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      {state.laws.length > 0 && (
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          Given under{" "}
          {state.laws.map((law, i) => (
            <span key={law.name}>
              {i > 0 && (i === state.laws.length - 1 ? " and " : ", ")}
              {law.url ? (
                <a
                  href={law.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-ink"
                >
                  {law.name}
                </a>
              ) : (
                law.name
              )}
            </span>
          ))}
          .
        </p>
      )}
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={ageConfirmed}
          onChange={(e) => setAgeConfirmed(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
        />
        <span>I am {state.consent_age} or older, and I agree to Healthcare using my health information as described.</span>
      </label>
      {error && <p className="mt-2 text-xs text-band-low">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAgree}
          disabled={!ageConfirmed || busy}
          className={cx(
            "rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {busy ? "Saving…" : "I agree"}
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={busy}
          className="rounded-full border border-hairline px-4 py-1.5 text-sm text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
        >
          Not now
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-muted">You can withdraw this any time in Settings.</p>
    </section>
  );
}
