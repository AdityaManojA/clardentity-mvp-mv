"use client";

import { useOnline } from "@/lib/useOnline";

/** A quiet pill under the top bar while the device has no network. Nothing
 *  on the page is taken away - what's loaded stays readable - it only says
 *  that what you do now won't reach the server, before an action fails and
 *  says it louder. Goes away by itself when the connection comes back. */
export function OfflineNotice() {
  const online = useOnline();
  return (
    <div
      role="status"
      aria-live="polite"
      // phone layout only
      className="pointer-events-none fixed inset-x-0 top-[calc(var(--topbar-height)+8px)] z-30 flex justify-center px-4 lg:hidden"
    >
      {!online && (
        <p
          data-testid="offline-notice"
          className="rounded-full border border-hairline-strong bg-surface-raised px-4 py-2 text-sm text-ink shadow-sm"
        >
          You&apos;re offline. Nothing new will be saved until you reconnect.
        </p>
      )}
    </div>
  );
}
