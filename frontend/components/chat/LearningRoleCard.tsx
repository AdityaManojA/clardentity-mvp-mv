"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";
import {
  getLearningRole,
  getServerLearningRole,
  loadLearningRole,
  setLearningRole,
  subscribe,
  type LearningRole,
} from "@/lib/learningRole";
import { cx } from "@/components/ui/primitives";

/* Asked once, the first time someone opens Learning mode.
 *
 * Learning is the one mode where the same question wants a different answer
 * depending on who is asking. "Explain the Krebs cycle" from a student is a
 * request to understand it; from a teacher it is a request for the order to
 * introduce it in and the misconceptions to expect; from someone browsing it
 * is neither. Inference could work this out eventually, but not from the
 * first message - which is exactly the one where getting it wrong is most
 * obvious.
 *
 * Three buttons rather than a text box, because the answer steers the system
 * prompt. A closed set is a setting; free text would be user input reaching
 * the instructions. (`ContextQuestionCard` is the open-text sibling, for
 * questions where a menu would be grotesque.)
 *
 * It appears above the composer rather than in the thread: it is a question
 * about the person, not a turn in the conversation, and it should not still
 * be sitting there when they scroll back through what they asked.
 */

const OPTIONS: { value: LearningRole; label: string; blurb: string }[] = [
  { value: "student", label: "A student", blurb: "Teach me the material" },
  { value: "teacher", label: "A teacher", blurb: "Help me put it across" },
  { value: "visiting", label: "Just visiting", blurb: "I'm curious, that's all" },
];

export function LearningRoleCard() {
  const role = useSyncExternalStore(subscribe, getLearningRole, getServerLearningRole);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadLearningRole();
  }, []);

  async function choose(value: LearningRole) {
    setBusy(true);
    track("learning_role_set", { role: value });
    await setLearningRole(value);
    setBusy(false);
  }

  // Not looked yet, or already answered: nothing to show.
  if (role !== null) return null;

  return (
    <div className="mt-2 rounded-xl border border-hairline bg-surface-muted p-3.5">
      <p className="text-sm leading-relaxed text-ink">
        Before we start - are you learning this yourself, or teaching it to someone else?
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={busy}
            onClick={() => choose(option.value)}
            className={cx(
              "flex min-w-0 flex-col items-start rounded-lg border border-hairline bg-surface px-3 py-2 text-left",
              "transition-colors hover:border-brand-border hover:bg-surface-hover",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <span className="text-sm font-medium text-ink">{option.label}</span>
            <span className="text-xs text-ink-muted">{option.blurb}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Changes how explanations are pitched. You can change it later in Settings.
      </p>
    </div>
  );
}
