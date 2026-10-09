"use client";

import { useState } from "react";

import { COGNITIVE_MODES } from "@/lib/modes";
import { saveCompanionNames, useCompanionNames } from "@/lib/companionNames";
import { MaskIcon } from "@/components/ui/MaskIcon";
import { cx } from "@/components/ui/primitives";

/* Name your companion, per mode.
 *
 * One name each rather than one overall: the modes behave differently enough
 * that people think of them separately, and naming them separately is what
 * makes "this suits Nick" mean something in the mode nudge.
 *
 * Blank is a real answer, not an incomplete form - an unnamed mode goes by its
 * own label, which is what the row shows as "(Default)".
 *
 * The design draws this as a read-only table with a pencil on each row rather
 * than eight open text boxes, and that is the right shape: seven of the eight
 * rows are almost never touched, and a page of empty inputs asks to be filled
 * in. A row becomes a field only when its pencil is used, and commits on
 * Enter or on leaving it.
 */

const MAX = 24;

export function CompanionNames() {
  const saved = useCompanionNames();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  function open(mode: string) {
    setState("idle");
    setDraft(saved[mode] ?? "");
    setEditing(mode);
  }

  async function commit(mode: string) {
    const value = draft.trim();
    setEditing(null);
    if (value === (saved[mode] ?? "")) return;

    // The store takes the whole set, so the untouched rows are sent back as
    // they are and only this one changes.
    const next: Record<string, string> = {};
    for (const m of COGNITIVE_MODES) {
      const current = m.value === mode ? value : saved[m.value] ?? "";
      if (current) next[m.value] = current;
    }
    setState("saving");
    try {
      await saveCompanionNames(next);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <ul className="max-w-[569px] space-y-5">
        {COGNITIVE_MODES.map((mode) => {
          const name = saved[mode.value] ?? "";
          const isEditing = editing === mode.value;
          return (
            // Rows at least a finger apart on a touch screen, so each pencil's tap
            // area is its own rather than shared with the row above.
            <li key={mode.value} className="flex items-center gap-4 pointer-coarse:min-h-[calc(44px/var(--ui-zoom))]">
              <span className="flex w-[200px] shrink-0 items-center gap-2 text-sm leading-[normal] text-ink">
                <MaskIcon src={mode.icon} size={24} />
                <span className="truncate">{mode.label}</span>
              </span>

              <span className="flex min-w-0 flex-1 items-center gap-2">
                {isEditing ? (
                  <input
                    autoFocus
                    value={draft}
                    maxLength={MAX}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => void commit(mode.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void commit(mode.value);
                      }
                      if (e.key === "Escape") setEditing(null);
                    }}
                    aria-label={`Name for ${mode.label}`}
                    data-field="bare"
                    className="min-w-0 flex-1 border-b border-brand-border bg-transparent pb-0.5 text-sm leading-[normal] text-ink placeholder:text-ink-muted"
                    placeholder={`${mode.label} (Default)`}
                  />
                ) : (
                  <span
                    className={cx(
                      "min-w-0 flex-1 truncate text-sm leading-[normal]",
                      name ? "text-ink" : "text-ink-secondary",
                    )}
                  >
                    {name || `${mode.label} (Default)`}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => (isEditing ? commit(mode.value) : open(mode.value))}
                  title={name ? `Rename ${mode.label}` : `Name ${mode.label}`}
                  aria-label={name ? `Rename ${mode.label}` : `Name ${mode.label}`}
                  className="tap-area shrink-0 rounded p-0.5 text-ink-secondary transition-colors hover:text-brand"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="block size-6"
                  >
                    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
                    <path d="M13.5 6.5l4 4" />
                  </svg>
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      {state === "error" && (
        <p className="mt-4 text-sm leading-[normal] text-band-low">
          Could not save that name. Try again.
        </p>
      )}
    </div>
  );
}
