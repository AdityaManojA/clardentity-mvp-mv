import { test as base, expect, type Page, type Route } from "@playwright/test";

/* Shared by web.spec.ts (T-nodes) and mobile.spec.ts (M-nodes).
 *
 * Default: the backend is mocked at the network layer, so the suite runs with
 * only `next dev` and never touches a real account. E2E_LIVE=1 drops the mock
 * and signs in with E2E_EMAIL / E2E_PASSWORD against whatever backend
 * NEXT_PUBLIC_API_URL points at. */

export const LIVE = process.env.E2E_LIVE === "1";
export const API = process.env.E2E_API_URL ?? "http://localhost:8000";
export const CREDS = {
  email: process.env.E2E_EMAIL ?? "e2e@clardentity.test",
  password: process.env.E2E_PASSWORD ?? "e2e-password",
};

// localStorage keys, from lib/auth.tsx, lib/consent.ts, lib/tour.tsx
export const KEYS = {
  access: "clardentity_access_token",
  refresh: "clardentity_refresh_token",
  consent: "clardentity-consent",
  tour: "clardentity-tour",
};

// Selectors: same as web unless noted. The mobile shell differs only in the
// drawer controls (AppShell.tsx) - the desktop sidebar is `hidden lg:flex`.
export const sel = {
  email: "#email",
  password: "#password",
  loginSubmit: 'button[type="submit"]:has-text("Log in")',
  openNav: 'button[aria-label="Open navigation"]', // mobile only (lg:hidden)
  closeNav: 'aside button[aria-label="Close navigation"]', // mobile only
  navBackdrop: 'div.fixed.inset-0 > button[aria-label="Close navigation"]', // mobile only
  newChatMobile: 'header button[aria-label="New chat"]', // mobile only
  accountMenu: 'button[aria-haspopup="menu"][data-tour="nav-profile"]',
  logout: '[role="menuitem"]:has-text("Log out")',
  wsCreate: 'button:has-text("Create")',
  wsName: 'input[aria-label="New workspace name"]',
  wsSubmit: 'form button[type="submit"]',
  errorBanner: ".border-band-low-border",
  header: "header",
};

type MockOpts = { failWorkspaces?: boolean; extraWorkspaces?: number };

/** Minimal backend: auth, workspaces, bootstrap, conversations. Everything
 *  else answers 404 so an unexpected call shows up in the trace. */
export async function mockApi(page: Page, opts: MockOpts = {}) {
  const user = {
    id: "u1",
    email: CREDS.email,
    display_name: "E2E User",
    onboarding_completed_at: "2026-01-01T00:00:00Z",
    is_admin: false,
  };
  const workspaces = [
    { id: "w1", name: "Personal", role: "owner", created_at: "2026-09-01T10:00:00Z" },
    { id: "w2", name: "A workspace with a deliberately long name to test truncation", role: "owner", created_at: "2026-09-02T10:00:00Z" },
  ];
  for (let i = 0; i < (opts.extraWorkspaces ?? 0); i++)
    workspaces.push({ id: `x${i}`, name: `Workspace ${i + 3}`, role: "owner", created_at: "2026-09-03T10:00:00Z" });
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const authed = !!req.headers()["authorization"];
    const m = req.method();

    if (path === "/health") return json(route, { status: "ok" });
    if (path === "/auth/login" && m === "POST") {
      const body = req.postDataJSON() as { email: string; password: string };
      if (body.email !== CREDS.email || body.password !== CREDS.password)
        return json(route, { detail: "Incorrect email or password" }, 401);
      return json(route, { access_token: "e2e-access", refresh_token: "e2e-refresh" });
    }
    if (path === "/auth/refresh") return json(route, { access_token: "e2e-access", refresh_token: "e2e-refresh" });
    if (path === "/auth/me") return authed ? json(route, user) : json(route, { detail: "Not authenticated" }, 401);
    if (!authed) return json(route, { detail: "Not authenticated" }, 401);

    if (path === "/workspaces" && opts.failWorkspaces) return route.abort("internetdisconnected");
    if (path === "/workspaces" && m === "GET") return json(route, workspaces);
    if (path === "/workspaces" && m === "POST") {
      const { name } = req.postDataJSON() as { name: string };
      const ws = { id: `w${workspaces.length + 1}`, name, role: "owner", created_at: new Date().toISOString() };
      workspaces.unshift(ws);
      return json(route, ws, 201);
    }
    if (path === "/bootstrap") return json(route, { active_workspace_id: "w1", conversation_id: "c1" });
    if (path === "/chat/conversations" && m === "GET") return json(route, []);
    if (path === "/chat/conversations" && m === "POST") return json(route, { id: "c2" }, 201);
    return json(route, { detail: `not mocked: ${m} ${path}` }, 404);
  });
}

/** Consent decided and both tours done, so no banner or coachmark sits over
 *  the page. `signedIn` also pre-seeds tokens (skips the login form). */
export async function seedStorage(page: Page, { signedIn = false } = {}) {
  await page.addInitScript(
    ({ KEYS, signedIn }) => {
      localStorage.setItem(KEYS.consent, "denied");
      localStorage.setItem(
        KEYS.tour,
        JSON.stringify({ active: null, stepIndex: 0, done: { workspace: true, chat: true } }),
      );
      if (signedIn && !sessionStorage.getItem("e2e-seeded")) {
        localStorage.setItem(KEYS.access, "e2e-access");
        localStorage.setItem(KEYS.refresh, "e2e-refresh");
        sessionStorage.setItem("e2e-seeded", "1"); // seed once, so logout sticks
      }
    },
    { KEYS, signedIn },
  );
}

/** Tap on touch projects, click elsewhere - one spec body for both. */
export async function press(page: Page, selector: string) {
  const loc = page.locator(selector).first();
  if (await page.evaluate(() => navigator.maxTouchPoints > 0)) await loc.tap();
  else await loc.click();
}

type Fixtures = { app: Page; signedIn: Page };

export const test = base.extend<Fixtures>({
  // Signed out, mocked (unless LIVE), overlays suppressed.
  app: async ({ page }, provide) => {
    if (!LIVE) await mockApi(page);
    await seedStorage(page);
    await provide(page);
  },
  // Signed in. Mocked: tokens pre-seeded. LIVE: through the real form.
  signedIn: async ({ page }, provide) => {
    if (!LIVE) await mockApi(page);
    await seedStorage(page, { signedIn: !LIVE });
    if (LIVE) await login(page);
    await provide(page);
  },
});

export async function login(page: Page) {
  await page.goto("/login");
  await page.fill(sel.email, CREDS.email);
  await page.fill(sel.password, CREDS.password);
  await press(page, sel.loginSubmit);
  // Post-login landing is /start -> /chat/:id (StartChat), not /dashboard.
  await page.waitForURL(/\/(start|chat\/)/);
}

export { expect };
