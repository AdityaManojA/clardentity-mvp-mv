import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/system/ThemeToggle";

/* Legal pages sit outside the app shell: they have to be readable by someone
   who has not signed up yet - that is the entire point of showing them at the
   sign-up form - so no RequireAuth, no sidebar, just the document. */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">
            Clardentity
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="text-ink-secondary transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="text-ink-secondary transition-colors hover:text-ink">
              Terms
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>
    </div>
  );
}
