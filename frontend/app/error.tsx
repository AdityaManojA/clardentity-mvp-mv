"use client";

import { FullScreenError } from "@/components/system/FullScreenError";

/* Anything that throws past the in-page boundaries (components/system/
 * ErrorBoundaries.tsx) - the shell itself, a sign-in page - lands here
 * instead of a blank screen. */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <FullScreenError onRetry={reset} />;
}
