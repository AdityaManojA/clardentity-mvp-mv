"use client";

import { useState } from "react";
import type { HealthConsentCopy, HealthConsentState } from "@/lib/sse";
import { cx } from "@/components/ui/primitives";

/* Healthcare asks before it answers.
 *
 * Health information is special-category or sensitive data almost everywhere
 * the product is used, and the common denominator of those laws is explicit,
 * separate, informed consent before it is processed - so this card stands
 * between someone picking Healthcare and their first question being read.
 * Every line on it comes from the server (backend api/healthcare): the
 * jurisdiction, what is collected and why, who processes it and where, what
 * happens to the conversation, how to withdraw and where to complain, the
 * laws it is given under and the age it needs. The age box is not
 * decoration: below that age the person cannot consent alone.
 *
 * Where the notice exists in more than one language (Hindi in India, as the
 * DPDP Act asks), it can be read in either, and the one it was agreed in is
 * recorded with the consent.
 *
 * Used by the app (consent kept on the account) and the landing demo (kept
 * for the browser session) alike. */

const LANGUAGE_NAMES: Record<string, string> = { en: "English", hi: "हिन्दी" };
/** The word before the last law in the list. */
const AND: Record<string, string> = { en: " and ", hi: " और " };

/** The English text, for a server that predates `copy`. */
function fallbackCopy(state: HealthConsentState): HealthConsentCopy {
  return {
    eyebrow: "Before Healthcare answers",
    title: `Your health information, under the rules for ${state.jurisdiction.name}`,
    points: state.points,
    given_under: "Given under",
    age_label: `I am ${state.consent_age} or older, and I agree to Healthcare using my health information as described.`,
    agree: "I agree",
    decline: "Not now",
    footer: "You can withdraw this any time in Settings.",
  };
}

export function HealthConsentCard({
  state,
  onAgree,
  onDecline,
  busy = false,
  error,
}: {
  state: HealthConsentState;
  /** Called with the language the notice was read in. */
  onAgree: (language: string) => void;
  onDecline: () => void;
  busy?: boolean;
  error?: string | null;
}) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const languages = state.languages?.length ? state.languages : ["en"];
  const [language, setLanguage] = useState(languages[0]);
  const copy = state.copy?.[language] ?? fallbackCopy(state);

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
      lang={language}
      className="rounded-2xl border border-brand-border bg-surface px-4 py-4 animate-[fade-in_0.25s_ease]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-brand">{copy.eyebrow}</p>
        {languages.length > 1 && (
          <div role="group" aria-label="Language" className="flex shrink-0 gap-1">
            {languages.map((code) => (
              <button
                key={code}
                type="button"
                lang={code}
                aria-pressed={code === language}
                onClick={() => setLanguage(code)}
                className={cx(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                  code === language
                    ? "border-brand-border bg-brand-soft text-ink"
                    : "border-hairline text-ink-secondary hover:bg-surface-hover hover:text-ink",
                )}
              >
                {LANGUAGE_NAMES[code] ?? code}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mt-1 text-sm font-semibold text-ink">{copy.title}</p>
      <ul className="mt-2 space-y-1.5">
        {copy.points.map((point) => (
          <li key={point} className="flex gap-2 text-xs leading-relaxed text-ink-secondary">
            <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-ink-muted" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      {state.laws.length > 0 && (
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          {copy.given_under}{" "}
          {state.laws.map((law, i) => (
            <span key={law.name} lang="en">
              {i > 0 && (i === state.laws.length - 1 ? (AND[language] ?? " and ") : ", ")}
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
        <span>{copy.age_label}</span>
      </label>
      {error && <p className="mt-2 text-xs text-band-low">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onAgree(language)}
          disabled={!ageConfirmed || busy}
          className={cx(
            "rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {busy ? "…" : copy.agree}
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={busy}
          className="rounded-full border border-hairline px-4 py-1.5 text-sm text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
        >
          {copy.decline}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-muted">{copy.footer}</p>
    </section>
  );
}
