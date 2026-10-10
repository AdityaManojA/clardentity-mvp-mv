"use client";

import { Component, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { makeErrorRef, sendErrorReport } from "@/lib/errorReport";
import { cx } from "@/components/ui/primitives";

/* When one part of a screen throws, only that part gives way.
 *
 * Phone layout only. The design for this is a quiet inline box where the
 * part was - "Try again" first, and a small "Report" link that opens a sheet
 * and only shows a reference once a report has actually gone. On desktop
 * these boundaries step aside: the error carries on up exactly as it always
 * did, so nothing about the desktop app changes.
 *
 * `variant="part"` is a single piece (an answer, a question card, a chart,
 * the recent-chats list); `variant="page"` sits around a whole page inside
 * the shell, so the menu and top bar stay usable. */

const PHONE_QUERY = "(max-width: 1023.98px)";
const isPhone = () => typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches;

type Props = {
  /** Which part this is, for the report - never shown, never user text. */
  where: string;
  /** What the person reads when it fails. */
  label: string;
  variant?: "part" | "page";
  children: ReactNode;
};

export class ErrorBoundary extends Component<Props, { error: Error | null; attempt: number }> {
  state = { error: null as Error | null, attempt: 0 };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  retry = () => this.setState((s) => ({ error: null, attempt: s.attempt + 1 }));

  render() {
    const { error, attempt } = this.state;
    if (!error) return <ErrorAttempt key={attempt}>{this.props.children}</ErrorAttempt>;
    // Desktop keeps its behaviour: the error continues to the next boundary
    // up, and from there to the app's own error screen.
    if (!isPhone()) throw error;
    return <InlineError error={error} where={this.props.where} label={this.props.label} variant={this.props.variant ?? "part"} onRetry={this.retry} />;
  }
}

/** Keyed by attempt, so "Try again" remounts the part from scratch rather
 *  than re-rendering whatever half-state it threw from. */
function ErrorAttempt({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function InlineError({
  error,
  where,
  label,
  variant,
  onRetry,
}: {
  error: Error;
  where: string;
  label: string;
  variant: "part" | "page";
  onRetry: () => void;
}) {
  const [sheet, setSheet] = useState(false);
  return (
    <div
      role="alert"
      data-testid="part-error"
      className={cx(
        "rounded-xl border border-dashed border-hairline-strong text-sm text-ink-secondary",
        variant === "page" ? "mx-5 my-10 p-5 text-center" : "my-2 p-3",
      )}
    >
      <p className={cx("flex items-center gap-2", variant === "page" && "justify-center text-base text-ink")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="size-4 shrink-0">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5M12 16.5h.01" />
        </svg>
        {label}
      </p>
      {variant === "page" && <p className="mt-1 text-sm text-ink-muted">Your chats are safe. Try again, or use the menu.</p>}
      <div className={cx("mt-2.5 flex items-center gap-3", variant === "page" && "mt-4 justify-center")}>
        <button
          type="button"
          onClick={onRetry}
          className="tap-area rounded-full border border-hairline-strong px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface-hover"
        >
          Try again
        </button>
        {/* Deliberately small: most people only want the retry. */}
        <button
          type="button"
          onClick={() => setSheet(true)}
          className={cx("tap-area text-xs text-ink-muted underline underline-offset-2", variant === "part" && "ml-auto")}
        >
          Report
        </button>
      </div>
      {sheet && <ReportSheet error={error} where={where} onClose={() => setSheet(false)} />}
    </div>
  );
}

/** Ask, send, and only then show the reference. */
function ReportSheet({ error, where, onClose }: { error: Error; where: string; onClose: () => void }) {
  const [state, setState] = useState<"ask" | "sending" | "sent" | "unsent">("ask");
  const [ref] = useState(makeErrorRef);
  const [copied, setCopied] = useState(false);

  async function send() {
    setState("sending");
    setState((await sendErrorReport(ref, where, error)) ? "sent" : "unsent");
  }

  // Portalled to <body>: the part that failed can sit inside a transformed
  // element (the answer card's flip, the list's fade-in), and position:fixed
  // inside a transform is fixed to that element - the sheet was clipped into
  // the message list and its buttons couldn't be reached.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={state === "sending" ? undefined : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Report this error"
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-2xl border-t border-hairline-strong bg-surface-raised p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-left text-sm text-ink-secondary"
      >
        {state === "ask" || state === "sending" ? (
          <>
            <p className="text-base font-medium text-ink">Send a report?</p>
            <p className="mt-1">We&apos;ll get the technical details of this error - not your messages.</p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={send}
                disabled={state === "sending"}
                className="tap-area rounded-full bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {state === "sending" ? "Sending…" : "Send report"}
              </button>
              <button type="button" onClick={onClose} disabled={state === "sending"} className="tap-area rounded-full px-4 py-2 text-sm">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {state === "sent" ? (
              <>
                <p className="text-base font-medium text-ink">Report sent</p>
                <p className="mt-1">If you contact support, quote this reference:</p>
                <div className="mt-3 flex items-center gap-3">
                  <code data-testid="error-ref" className="rounded-md bg-surface-sunken px-2.5 py-1 font-mono text-sm text-ink">
                    {ref}
                  </code>
                  <button
                    type="button"
                    className="tap-area text-xs text-ink-muted underline underline-offset-2"
                    onClick={() => {
                      void navigator.clipboard?.writeText(ref).then(() => setCopied(true), () => undefined);
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </>
            ) : (
              // Nothing reached us, so there's no reference worth quoting.
              <>
                <p className="text-base font-medium text-ink">Couldn&apos;t send the report</p>
                <p className="mt-1">Nothing was sent. Try again later, or tell support what you were doing when this happened.</p>
              </>
            )}
            <button type="button" onClick={onClose} className="tap-area mt-4 rounded-full border border-hairline-strong px-4 py-2 text-sm text-ink">
              Done
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
