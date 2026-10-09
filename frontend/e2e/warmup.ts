/* Local runs only: request every route the suite visits once before any test
 * starts, so the dev server compiles them up front. Otherwise the first test
 * to reach a route waits on its compile - seconds, under parallel load more
 * than an assertion's timeout - and fails for a reason that isn't the app.
 * CI tests a production build (playwright.config), which has nothing to warm. */
const ROUTES = [
  "/login", "/register", "/forgot-password", "/reset-password", "/start", "/welcome",
  "/workspace", "/workspace/w1", "/workspace/w1/search", "/workspace/w1/documents",
  "/chat/c1", "/profile", "/settings", "/admin",
];

export default async function warmup() {
  if (process.env.CI || process.env.E2E_NO_WARMUP) return;
  const base = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;
  // sequential: parallel requests make the dev server compile everything at once
  for (const route of ROUTES) await fetch(base + route).catch(() => undefined);
}
