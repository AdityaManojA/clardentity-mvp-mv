"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

/* The question in the hero composer, typing itself out and changing its
 * mind. The design puts one question in that box; a page that shows a
 * different one every few seconds says the thing the box is actually for -
 * that you can ask it anything - without a line of copy explaining it.
 *
 * The questions are chosen to span the companions rather than to be clever:
 * one factual, one decision, one that is really about how to think, one for
 * learning, one legal. Someone who watches the whole loop has seen the
 * product's range.
 */
const QUESTIONS = [
  // The design's own question goes first, so the first paint is the design.
  "Are we alone in this universe?",
  "Should I take the job in Singapore or stay?",
  "What does my tenancy agreement actually oblige me to do?",
  "Explain the Krebs cycle for a Class 10 student.",
  "Why did India get independence in 1947?",
  "Help me think through whether to go back to study.",
];

const TYPE_MS = 55; // per character, while typing
const DELETE_MS = 28; // per character, while clearing - faster, as typing is
const HOLD_MS = 2200; // how long a finished question sits there
const BETWEEN_MS = 420; // pause on an empty box before the next one starts

type Phase = "typing" | "holding" | "deleting";

export function TypedQuestions({ className }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(QUESTIONS[0].length);
  const [phase, setPhase] = useState<Phase>("holding");
  useEffect(() => {
    if (reducedMotion) return;
    const question = QUESTIONS[index];

    if (phase === "typing") {
      if (length >= question.length) {
        const t = setTimeout(() => setPhase("holding"), HOLD_MS);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setLength((n) => n + 1), TYPE_MS);
      return () => clearTimeout(t);
    }

    if (phase === "holding") {
      const t = setTimeout(() => setPhase("deleting"), HOLD_MS);
      return () => clearTimeout(t);
    }

    if (length <= 0) {
      const t = setTimeout(() => {
        setIndex((i) => (i + 1) % QUESTIONS.length);
        setPhase("typing");
      }, BETWEEN_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLength((n) => n - 1), DELETE_MS);
    return () => clearTimeout(t);
  }, [reducedMotion, phase, length, index]);

  const text = reducedMotion ? QUESTIONS[0] : QUESTIONS[index].slice(0, length);

  return (
    <span className={className}>
      {text}
      {!reducedMotion && (
        // Blinks only while the line sits finished; steady while characters
        // are moving, which is how a caret behaves in a real text box.
        <span className="landing-caret" data-blinking={phase === "holding" ? "true" : "false"} />
      )}
    </span>
  );
}
