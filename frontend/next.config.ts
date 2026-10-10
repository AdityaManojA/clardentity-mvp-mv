import type { NextConfig } from "next";

/* The browser's half of the security model.
 *
 * Until 2026-10-10 the app was served with HSTS and nothing else: no
 * Content-Security-Policy, nothing stopping it being framed, no nosniff, no
 * referrer or permissions policy. That matters more here than on most sites
 * because the session lives in localStorage - any script that runs on this
 * origin can read the tokens - so the policy below is the second wall
 * behind "never render untrusted HTML" (and the renderer never does: answers
 * are React-escaped text with no links).
 *
 * Without nonces, deliberately. Nonces need every page rendered per request,
 * and this app's pages are static shells that fetch their data in the
 * browser; making them dynamic to earn 'strict-dynamic' would cost every
 * visitor a server render. So inline scripts stay allowed (Next's own RSC
 * bootstrap is inline), and the policy does its work on *where* things may
 * come from and go to: scripts only from here, Google's sign-in and
 * PostHog; requests only to our API and the services the app actually
 * calls; no plugins; no framing; no foreign form targets.
 *
 * Every origin below is one the code really talks to - see the grep in the
 * regression skill's security checks before adding one.
 */

const isDev = process.env.NODE_ENV === "development";

/** The API's origin, from the same variable the client uses to reach it. */
function apiOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1` : null) ??
    "http://localhost:8000/api/v1";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:8000";
  }
}

const API = apiOrigin();
const GOOGLE = "https://accounts.google.com";
// posthog-js is bundled, but fetches its remote config and assets from the
// regional assets host, and sends to the ingestion host - both *.posthog.com.
const POSTHOG = "https://*.posthog.com";
// A live call posts its SDP offer here; the media itself is WebRTC, which
// connect-src does not govern.
const OPENAI = "https://api.openai.com";
// Test builds only: the Playwright suite streams one answer from a local
// server on a random port (e2e M39) and sets this for its own build. Nothing
// in production sets it, so the deployed policy is unchanged.
const EXTRA_CONNECT = process.env.CSP_EXTRA_CONNECT_SRC
  ? ` ${process.env.CSP_EXTRA_CONNECT_SRC}`
  : "";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${GOOGLE} ${POSTHOG}`,
  `style-src 'self' 'unsafe-inline' ${GOOGLE}`,
  // Generated pictures are served by the API; data: and blob: cover
  // attachment previews and the canvas the composer draws thumbnails on.
  `img-src 'self' data: blob: ${API} https://*.googleusercontent.com`,
  "font-src 'self' data:",
  // Spoken answers are played from blob: URLs.
  `media-src 'self' blob: ${API}`,
  `connect-src 'self' ${API} ${POSTHOG} ${OPENAI} ${GOOGLE}${isDev ? " ws: wss:" : ""}${EXTRA_CONNECT}`,
  `frame-src ${GOOGLE}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Only where the API itself is https - a production build pointed at a
  // local http API (how the regression run serves it) must still reach it.
  ...(isDev || API.startsWith("http:") ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // frame-ancestors above is the modern form; this is for browsers that
  // predate it.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // A full URL can carry a conversation id; other sites get the origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The microphone is used (dictation and live calls); nothing else is.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  // Isolates this window from pages it opens, while still letting Google's
  // sign-in popup report back.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
