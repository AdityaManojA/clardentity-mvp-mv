"use client";

import { useEffect, useState } from "react";
import { authErrorMessage } from "@/lib/auth";
import { fetchHealthConsent, withdrawHealthConsent } from "@/lib/healthConsent";
import type { HealthConsentState } from "@/lib/sse";

/* Where Healthcare's consent can be read and taken back. Withdrawing is as
 * easy as giving was - one tap - which is what GDPR Art. 7(3) and most of
 * its relatives ask for, and the option to delete every chat with a
 * Healthcare message in it goes with it. */
export function HealthcareConsent() {
  const [state, setState] = useState<HealthConsentState | null>(null);
  const [alsoDelete, setAlsoDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHealthConsent()
      .then((s) => {
        if (!cancelled) setState(s);
      })
      .catch(() => {
        if (!cancelled) setNote("Couldn't load your Healthcare consent just now.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function withdraw() {
    setBusy(true);
    setNote(null);
    try {
      const next = await withdrawHealthConsent(alsoDelete);
      setState(next);
      setNote(
        alsoDelete
          ? `Consent withdrawn, and ${next.deleted_conversations} chat${next.deleted_conversations === 1 ? "" : "s"} with Healthcare messages deleted.`
          : "Consent withdrawn. Healthcare will ask again before it answers.",
      );
    } catch (err) {
      setNote(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!state) return note ? <p className="text-sm text-ink-secondary">{note}</p> : null;

  return (
    <div className="space-y-3 text-sm text-ink">
      <p className="text-ink-secondary">
        {state.given && state.given_at
          ? `Given on ${new Date(state.given_at).toLocaleDateString()} under the rules for ${state.jurisdiction.name}.`
          : `Not given. Healthcare asks before it answers, under the rules for ${state.jurisdiction.name}.`}
        {state.storage === "transient" &&
          " There, Healthcare chats are never saved - each one is temporary."}
      </p>
      {state.given && (
        <>
          <label className="flex items-start gap-2 text-ink-secondary">
            <input
              type="checkbox"
              checked={alsoDelete}
              onChange={(e) => setAlsoDelete(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            <span>Also delete every chat that has a Healthcare message in it</span>
          </label>
          <button
            type="button"
            onClick={() => void withdraw()}
            disabled={busy}
            className="tap-area flex h-[42px] items-center rounded-[34px] border border-hairline-strong px-[21px] text-sm text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            {busy ? "Withdrawing…" : "Withdraw consent"}
          </button>
        </>
      )}
      {note && <p className="text-xs text-ink-secondary">{note}</p>}
    </div>
  );
}
