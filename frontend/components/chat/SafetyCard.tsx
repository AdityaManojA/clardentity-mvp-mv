"use client";

import type { SafetyCardData, SafetyResource } from "@/lib/sse";

/* The support card, above an answer the safety screen flagged (backend
 * services/safety). The numbers come from the server's verified table for
 * where the person is - never from the model - so they are right even if the
 * prose beside them is not. Each one is a tap-to-call link, because the
 * person reading this may not be in a state to copy a number.
 *
 * Two registers: a crisis ("you don't have to face this alone", danger
 * number first) and a concern (support is there if wanted, no alarm). */

function countryName(code: string | null): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(undefined, { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function Call({ resource }: { resource: SafetyResource }) {
  return (
    <a
      href={`tel:${resource.number.replace(/[^\d+*#]/g, "")}`}
      className="tap-target inline-flex min-w-0 flex-col rounded-xl border border-brand-border bg-surface-raised px-3 py-2 text-left transition-colors hover:bg-surface-hover"
    >
      <span className="text-base font-semibold tabular-nums text-brand">{resource.number}</span>
      <span className="text-xs leading-snug text-ink-secondary">
        {resource.label}
        {resource.hours ? ` · ${resource.hours}` : ""}
      </span>
    </a>
  );
}

export function SafetyCard({ card }: { card: SafetyCardData }) {
  const crisis = card.level === "crisis";
  // The number to say first. Where the ambulance has its own number - Japan's
  // 119 beside the police's 110, Brazil's 192 beside 190 - a medical
  // emergency or someone who may hurt themselves needs the ambulance, not
  // the police; harm from someone else keeps the general number.
  const medical = ["suicide_or_self_harm", "medical_emergency", "someone_else_at_risk", "distress"].includes(
    card.kind,
  );
  const emergency =
    (medical && card.resources.find((r) => r.kind === "ambulance")) ||
    card.resources.find((r) => r.kind === "emergency");
  const hasCrisisLine = card.resources.some((r) => r.kind === "crisis");
  // In a crisis the danger number leads; otherwise the crisis line does,
  // because "call emergency services" to someone who is low reads as alarm.
  const ordered = crisis
    ? [...card.resources].sort((a, b) => Number(b === emergency) - Number(a === emergency))
    : [...card.resources].sort((a, b) => Number(b.kind === "crisis") - Number(a.kind === "crisis"));
  const where = countryName(card.country);

  return (
    <section
      role="region"
      aria-label="Support"
      data-safety={card.level}
      className="rounded-2xl border border-brand-border bg-brand-soft px-4 py-3.5 animate-[fade-in_0.3s_ease]"
    >
      <p className="text-sm font-semibold text-ink">
        {crisis ? "You don't have to face this alone." : "Support is here if you want it."}
      </p>
      <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">
        {crisis
          ? emergency
            ? `If you might act on these thoughts or you're in danger, call ${emergency.number} now. Talking to someone helps, at any hour.`
            : "If you might act on these thoughts or you're in danger, call your local emergency number now."
          : "Free, confidential support - you can reach out any time."}
      </p>
      {ordered.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {ordered.map((r) => (
            <Call key={`${r.kind}-${r.number}`} resource={r} />
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-ink-muted">
        {!hasCrisisLine && (
          <>
            <a
              href={card.fallback_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand underline underline-offset-2"
            >
              Find a free helpline near you
            </a>
            {where ? " · " : ""}
          </>
        )}
        {where ? `Numbers for ${where}` : null}
      </p>
    </section>
  );
}
