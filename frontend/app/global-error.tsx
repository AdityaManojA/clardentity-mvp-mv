"use client";

import "./globals.css";
import { FullScreenError } from "@/components/system/FullScreenError";

/* The last resort: the root layout itself failed, so this replaces it and
 * has to bring its own <html> and <body> (and stylesheet). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <FullScreenError onRetry={reset} />
      </body>
    </html>
  );
}
