"use client";

import { useState, type FormEvent } from "react";
import { Badge, Button, Input, Spinner } from "@/components/ui/primitives";

/* The profile as a list of separate facts rather than one document.
 *
 * A Markdown blob was readable but not correctable: fixing one wrong sentence
 * meant editing a whole document, and the moment you did, the old `user_edited`
 * latch froze the entire profile against future inference - one correction
 * cost you every future improvement. Aspects are individually removable and
 * individually addable, so a wrong one can be deleted on its own and anything
 * you write yourself survives the next rebuild.
 */

export type Aspect = {
  id: string;
  label: string;
  value: string;
  source: "inferred" | "user";
};

/* Starting points, not a schema. The list exists because "add an aspect" with
   an empty box is a harder question than it looks - these name the kinds of
   thing worth recording. Anything else can be typed. */
const SUGGESTED_LABELS = [
  "Work",
  "Studying",
  "Current focus",
  "How I like explanations",
  "Decisions I'm weighing",
  "Tools I use",
  "Constraints",
  "Things to avoid",
];

const CUSTOM = "__custom__";

export function AspectList({
  aspects,
  onAdd,
  onRemove,
  busy,
  adding,
  onAddingChange,
}: {
  aspects: Aspect[];
  onAdd: (label: string, value: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  busy?: boolean;
  /** The design puts "Add Aspect" in the section header, so the form it
   *  opens is controlled from outside this list. */
  adding?: boolean;
  onAddingChange?: (open: boolean) => void;
}) {
  const [label, setLabel] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const usingCustom = label === CUSTOM;
  const resolvedLabel = usingCustom ? customLabel.trim() : label;
  const canSubmit = Boolean(resolvedLabel && value.trim()) && !saving && !busy;

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onAdd(resolvedLabel, value.trim());
      setLabel("");
      setCustomLabel("");
      setValue("");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await onRemove(id);
    } finally {
      setRemovingId(null);
    }
  }

  // A label already in the list would be an edit, not a new entry, so it is
  // dropped from the menu rather than offered twice.
  const taken = new Set(aspects.map((a) => a.label.toLowerCase()));
  const available = SUGGESTED_LABELS.filter((l) => !taken.has(l.toLowerCase()));

  return (
    <div>
      {aspects.length === 0 && !adding ? (
        <p className="text-sm leading-[normal] text-ink-secondary">
          Nothing here yet. This fills in as you use Clardentity, and Add
          Aspect puts in anything you want it to know from the start.
        </p>
      ) : (
        // The design's rows: the fact's name, the fact underneath, and the
        // cross that removes it at the right end of the first line.
        <ul className="space-y-5">
          {aspects.map((aspect) => (
            <li key={aspect.id}>
              <div className="flex items-start gap-3">
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm font-medium leading-[normal] text-ink">
                  {aspect.label}
                  {aspect.source === "user" && <Badge tone="brand">yours</Badge>}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(aspect.id)}
                  disabled={removingId === aspect.id}
                  aria-label={`Remove ${aspect.label}`}
                  title="Remove"
                  className="tap-area shrink-0 rounded p-0.5 text-ink-secondary transition-colors hover:text-band-low"
                >
                  {removingId === aspect.id ? (
                    <Spinner className="size-5" />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      aria-hidden="true"
                      className="block size-6"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-sm leading-[normal] text-ink-secondary">
                {aspect.value}
              </p>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <form
          onSubmit={handleAdd}
          className="mt-8 flex flex-wrap items-center gap-2 rounded-[12px] border border-hairline p-4"
        >
          <select
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            aria-label="Aspect"
            className="h-10 rounded-lg border border-hairline-strong bg-surface px-2 text-sm text-ink transition-colors hover:border-brand-border focus:border-brand"
          >
            <option value="">What kind of thing?</option>
            {available.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={CUSTOM}>Something else…</option>
          </select>

          {usingCustom && (
            <Input
              value={customLabel}
              onChange={(event) => setCustomLabel(event.target.value)}
              placeholder="Label"
              aria-label="Custom aspect label"
              className="w-36"
            />
          )}

          {label && (
            <>
              <Input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="What should it know?"
                aria-label="Aspect value"
                className="min-w-48 flex-1"
              />
              <Button type="submit" variant="primary" disabled={!canSubmit}>
                {saving ? <Spinner className="h-4 w-4" /> : "Add"}
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={() => onAddingChange?.(false)}
            className="text-sm text-ink-secondary transition-colors hover:text-ink"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
