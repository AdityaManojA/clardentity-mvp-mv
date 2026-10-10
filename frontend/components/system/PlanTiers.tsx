"use client";

import { useState } from "react";
import { cx } from "@/components/ui/primitives";

/* The Clar tiers, as plans.
 *
 * These used to be a chip on the composer - "Auto · Free" with Clar Pro, Max
 * and Ultra in a menu above it - in every mode. That made a plan look like a
 * per-message setting, which it is not: you do not choose a deeper reasoner
 * for one question and a cheaper one for the next, you are on a plan. So
 * they live under Upgrade in the account menu now, next to Profile and
 * Settings, which is where an account's plan belongs.
 *
 * Named by capability rather than by vendor, for the reasons that were on
 * the old picker and still hold: vendor names on the tiers announce the
 * whole vendor set, contradict the identity rules the backend enforces, and
 * turn published API prices into a public cost sheet. Clar is Clardentity's
 * own model family, so the tiers describe what you get.
 *
 * The free tier is "Clar Basic" rather than "Auto": as a plan it needs a
 * name of its own, and "Auto" described routing, not what you have. The
 * "PRO" pill that sat on every paid row is gone too - three rows each
 * labelled Pro, one of which is called Pro, said nothing.
 */

export type PlanTier = {
  id: string;
  label: string;
  blurb: string;
  detail: string;
  /** Not open to this account yet - the row opens the plans dialog. */
  locked: boolean;
};

export const PLAN_TIERS: PlanTier[] = [
  {
    id: "clar-basic",
    label: "Clar Basic",
    blurb: "Clardentity picks for each question.",
    detail:
      "Routes every question to whichever Clar model suits it, so simple questions stay fast and hard ones get the depth they need. Your plan today, and the right one for most work.",
    locked: false,
  },
  {
    id: "clar-pro",
    label: "Clar Pro",
    blurb: "For advanced, specialist work.",
    detail:
      "Holds longer chains of reasoning than Clar Basic and stays precise on technical and domain-specific questions. For work where the answer has to be right in the details, not just broadly correct.",
    locked: true,
  },
  {
    id: "clar-max",
    label: "Clar Max",
    blurb: "Wider context, deeper checking.",
    detail:
      "Reads further into your attachments, searches more widely, and pushes each claim through more verification before it reaches you. For research, long documents, and questions with a lot of ground to cover.",
    locked: true,
  },
  {
    id: "clar-ultra",
    label: "Clar Ultra",
    blurb: "Our most intelligent reasoner.",
    detail:
      "The most capable Clar tier, for problems where getting it right matters more than getting it quickly: ambiguous tradeoffs, novel analysis, and decisions you only make once.",
    locked: true,
  },
];

/** A gem, not a padlock: a locked tier is a plan you can move to, and the
 *  same mark sits on the Upgrade item, so the two read as the same thing. */
export function GemIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cx("shrink-0 text-brand", className ?? "h-3 w-3")}
    >
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M2 9h20M9 3l3 18M15 3l-3 18" />
    </svg>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className="h-3.5 w-3.5 text-brand">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** The four rows. A locked row calls `onLocked` with its name, which the
 *  account menu turns into the plans dialog; the current plan just says so. */
export function PlanTiers({ onLocked }: { onLocked: (label: string) => void }) {
  // Which row the pointer or keyboard focus is on, so the side card can
  // describe it. Null hides the card.
  const [hovered, setHovered] = useState<string | null>(null);
  const described = PLAN_TIERS.find((t) => t.id === hovered) ?? null;

  return (
    <div className="relative" onMouseLeave={() => setHovered(null)}>
      {PLAN_TIERS.map((tier) => (
        <button
          key={tier.id}
          type="button"
          role="menuitem"
          onMouseEnter={() => setHovered(tier.id)}
          onFocus={() => setHovered(tier.id)}
          onClick={() => {
            if (tier.locked) onLocked(tier.label);
          }}
          aria-current={tier.locked ? undefined : "true"}
          className={cx(
            "flex w-full items-start gap-2 rounded-[8px] px-2.5 py-2 text-left transition-colors",
            "hover:bg-surface-hover",
            !tier.locked && "cursor-default",
          )}
        >
          <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            {tier.locked ? <GemIcon /> : <Check />}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-ink">{tier.label}</span>
              {!tier.locked && <span className="text-xs text-ink-muted">Your plan</span>}
            </span>
            <span
              className={cx(
                "mt-0.5 block text-xs leading-relaxed",
                tier.locked ? "text-ink-muted" : "text-ink-secondary",
              )}
            >
              {tier.blurb}
            </span>
          </span>
        </button>
      ))}

      {/* Beside the list rather than over it, so the row being read about
          stays visible. The menu lives in the left sidebar, so there is room
          to its right on any screen wide enough to show the sidebar beside
          the chat; narrower than that, the one-line blurb is enough. */}
      {described && (
        <div
          role="tooltip"
          className="absolute bottom-0 left-full z-50 ml-3 hidden w-60 rounded-xl border border-hairline bg-surface-raised p-3 shadow-xl lg:block"
        >
          <p className="text-xs font-semibold text-ink">{described.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{described.detail}</p>
        </div>
      )}
    </div>
  );
}
