"use client";

import { ACCENTS, setAccent, setTheme, useAppearance } from "@/lib/theme";
import { track } from "@/lib/analytics";
import { cx } from "@/components/ui/primitives";

/* Light or dark, and which accent.
 *
 * Both are subscribed to rather than held here: the <html> attributes are the
 * source of truth everywhere else in the app, and the topbar's own toggle
 * writes one of them from somewhere else entirely. A copy in state would go
 * stale the moment it was used.
 */
export function Appearance() {
  const { accent, theme } = useAppearance();

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-4 text-sm text-ink-secondary">Colour</p>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((option) => {
            const selected = accent === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setAccent(option.value);
                  track("accent_picked", { accent: option.value });
                }}
                className={cx(
                  "flex items-center gap-2 rounded-[34px] border py-2 pl-2 pr-4 text-sm leading-[normal] transition-colors",
                  selected
                    ? "border-brand-border bg-brand-soft text-ink"
                    : "border-hairline-strong text-ink-secondary hover:bg-surface-hover hover:text-ink",
                )}
              >
                {/* The accent itself, not a token: this dot has to show what
                    you would be switching to, so it cannot follow the theme
                    that is currently on. */}
                <span
                  aria-hidden="true"
                  className="size-6 shrink-0 rounded-full"
                  style={{ background: option.swatch }}
                />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-4 text-sm text-ink-secondary">Light or dark</p>
        <div className="flex flex-wrap gap-3">
          {(["light", "dark"] as const).map((option) => {
            const selected = theme === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setTheme(option);
                  track("theme_picked", { theme: option });
                }}
                className={cx(
                  "rounded-[34px] border px-4 py-2 text-sm leading-[normal] capitalize transition-colors",
                  selected
                    ? "border-brand-border bg-brand-soft text-ink"
                    : "border-hairline-strong text-ink-secondary hover:bg-surface-hover hover:text-ink",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
