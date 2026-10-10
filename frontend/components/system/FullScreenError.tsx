"use client";

import { AvatarPanel } from "@/components/avatar/AvatarPanel";

/* The screen for when the app itself has fallen over - the shell, the menu,
 * the page all at once - so there is nothing left to keep. Used by
 * app/error.tsx and app/global-error.tsx.
 *
 * Phone layout: the companion, a sentence that doesn't blame anyone, Reload
 * first and a way back to the start. Desktop shows the plain line Next.js
 * always showed there, so the desktop app is unchanged. */
export function FullScreenError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[calc(var(--app-vh)*100)] items-center justify-center bg-canvas px-6 text-center">
      <div data-testid="app-error" className="flex max-w-xs flex-col items-center lg:hidden">
        <AvatarPanel state="idle" gesture="none" expression="concerned" className="h-28 w-28" />
        <h1 className="mt-4 text-lg font-medium text-ink">Something tripped me up</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">
          Nothing you did. Your chats are saved - reloading usually sorts it.
        </p>
        <button
          type="button"
          // A full reload, not just a re-render: whatever broke the whole app
          // is best cleared by starting it fresh.
          onClick={() => {
            onRetry();
            window.location.reload();
          }}
          className="tap-area mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white"
        >
          Reload
        </button>
        {/* far enough below Reload that the two tap areas don't overlap */}
        <a href="/start" className="tap-area mt-6 text-sm text-ink-muted underline underline-offset-2">
          Back to start
        </a>
      </div>
      <p className="hidden text-sm text-ink lg:block">Application error: a client-side exception has occurred.</p>
    </div>
  );
}
