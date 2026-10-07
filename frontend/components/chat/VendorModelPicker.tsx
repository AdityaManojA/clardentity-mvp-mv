"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cx } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";
import {
  getChoice,
  getModels,
  getServerSnapshot,
  loadModels,
  setChoice,
  subscribe,
  type PickableModel,
} from "@/lib/pickableModels";

/* Pick the model by name - Learning and Co-Creative only.
 *
 * Everywhere else the composer shows `ModelPicker`, which names tiers by
 * capability because the identity rules forbid naming the model. These two
 * modes are the deliberate exception: here the user is picking a tool rather
 * than consulting a companion, so the real names are shown and the system
 * prompt is relaxed to match. A product that refuses to say which model it is
 * while a dropdown three inches away names it isn't protecting anything.
 *
 * Grouped by vendor, the way Cursor does it, because the vendor is most of
 * what the name means to someone choosing. "Auto" leads and is the default:
 * the point is to allow a choice, not to require one.
 */

export function VendorModelPicker({ mode, disabled }: { mode: string; disabled?: boolean }) {
  const version = useSyncExternalStore(subscribe, () => getModels(), getServerSnapshot);
  const models = version ?? [];
  const chosen = useSyncExternalStore(
    subscribe,
    () => getChoice(mode),
    getServerSnapshot,
  );
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadModels(mode);
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Nothing configured on this deployment: say nothing rather than show an
  // empty menu.
  if (!models.length) return null;

  const current = models.find((m) => m.id === chosen);
  const byVendor = models.reduce<Record<string, PickableModel[]>>((acc, m) => {
    (acc[m.vendor] ??= []).push(m);
    return acc;
  }, {});

  function choose(id: string | null) {
    setChoice(mode, id);
    setOpen(false);
    track("model_picked", { mode, model: id ?? "auto" });
  }

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Choose which model answers in this mode"
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="max-w-[9rem] truncate">{current ? current.label : "Auto"}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className={cx("size-3.5 transition-transform", open && "rotate-180")}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Model"
          className="account-menu absolute bottom-full right-0 z-40 mb-2 max-h-[22rem] w-[19rem] overflow-y-auto rounded-[12px] border border-hairline bg-surface-raised p-1.5 shadow-xl"
        >
          <Row
            label="Auto"
            blurb="Clardentity picks for each question."
            selected={!chosen}
            onClick={() => choose(null)}
          />
          {Object.entries(byVendor).map(([vendor, entries]) => (
            <div key={vendor}>
              <p className="px-2.5 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                {vendor}
              </p>
              {entries.map((m) => (
                <Row
                  key={m.id}
                  label={m.label}
                  blurb={m.blurb}
                  selected={chosen === m.id}
                  onClick={() => choose(m.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  blurb,
  selected,
  onClick,
}: {
  label: string;
  blurb: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onClick}
      className={cx(
        "flex w-full flex-col items-start rounded-[8px] px-2.5 py-1.5 text-left transition-colors hover:bg-surface-hover",
        selected && "bg-surface-hover",
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="truncate text-sm text-ink">{label}</span>
        {selected && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            className="size-4 shrink-0 text-brand">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <span className="text-xs leading-snug text-ink-muted">{blurb}</span>
    </button>
  );
}
