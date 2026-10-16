"use client";

import { useEffect, useState } from "react";
import { authErrorMessage } from "@/lib/auth";
import { fetchHealthConsent, withdrawHealthConsent } from "@/lib/healthConsent";
import type { HealthConsentState } from "@/lib/sse";

/* Where Healthcare's consent can be read and taken back. Withdrawing is as
 * easy as giving was, which GDPR Art. 7(3) and India's DPDP Act s.6(4) both
 * ask for - and it deletes every chat with a Healthcare message in it, which
 * both also expect of data held on consent (DPDP s.8(7), GDPR Art. 17(1)(b)).
 * Deleting cannot be undone, so the button asks once more. */
export function HealthcareConsent() {
  const [state, setState] = useState<HealthConsentState | null>(null);
  const [confirming, setConfirming] = useState(false);
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
      const next = await withdrawHealthConsent();
      setState(next);
      setConfirming(false);
      setNote(
        `Consent withdrawn, and ${next.deleted_conversations} chat${next.deleted_conversations === 1 ? "" : "s"} with Healthcare messages deleted. Healthcare will ask again before it answers.`,
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
      {state.given && !confirming && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="tap-area flex h-[42px] items-center rounded-[34px] border border-hairline-strong px-[21px] text-sm text-ink transition-colors hover:bg-surface-hover"
        >
          Withdraw consent
        </button>
      )}
      {state.given && confirming && (
        <div className="space-y-2 rounded-xl border border-hairline px-3 py-3">
          <p className="text-ink">
            Withdrawing deletes every chat that has a Healthcare message in it. This can&apos;t be undone.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void withdraw()}
              disabled={busy}
              className="tap-area flex h-[38px] items-center rounded-[34px] border border-band-low-border bg-surface px-[18px] text-sm font-medium text-band-low transition-colors hover:bg-band-low-bg disabled:opacity-50"
            >
              {busy ? "Withdrawing…" : "Withdraw and delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="tap-area flex h-[38px] items-center rounded-[34px] border border-hairline px-[18px] text-sm text-ink-secondary transition-colors hover:bg-surface-hover"
            >
              Keep consent
            </button>
          </div>
        </div>
      )}
      {note && <p className="text-xs text-ink-secondary">{note}</p>}
    </div>
  );
}
