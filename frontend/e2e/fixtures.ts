import { test as base, expect, type Locator, type Page, type Request, type Route } from "@playwright/test";

/* Shared by every spec.
 *
 * Default: the backend is mocked at the network layer (mockApi), so the suite
 * runs with only `next dev` and never touches a real account or an LLM.
 * Real-backend tests live in live.spec.ts, tagged @live, and use the saved
 * sessions from auth.setup.ts. E2E_LIVE=1 is the older escape hatch that runs
 * the mocked specs against a real backend through the login form. */

export const LIVE = process.env.E2E_LIVE === "1";
export const API = process.env.E2E_API_URL ?? "http://localhost:8000";
export const CREDS = {
  email: process.env.E2E_USER_EMAIL ?? process.env.E2E_EMAIL ?? "e2e@clardentity.test",
  password: process.env.E2E_USER_PASSWORD ?? process.env.E2E_PASSWORD ?? "e2e-password",
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
  drawer: '[data-testid="nav-drawer"]', // mobile only
  closeNav: '[data-testid="nav-drawer"] button[aria-label="Close navigation"]', // mobile only
  navBackdrop: 'div.fixed.inset-0 > button[aria-label="Close navigation"]', // mobile only
  newChatMobile: 'header button[aria-label="New chat"]', // mobile only
  accountMenu: 'button[aria-haspopup="menu"][data-tour="nav-profile"]',
  logout: '[role="menuitem"]:has-text("Log out")',
  wsCreate: 'button:has-text("Create")',
  wsName: 'input[aria-label="New workspace name"]',
  wsSubmit: 'form button[type="submit"]',
  errorBanner: ".border-band-low-border",
  header: "header",
  // chat
  composer: 'textarea[data-tour="composer-input"]',
  send: 'button[aria-label="Ask"]',
  messageList: '[data-testid="message-list"]',
  message: '[data-testid="message"]',
  modeRail: '[role="radiogroup"][aria-label="Cognitive mode"]',
  carouselNav: 'nav[aria-label="Modes in this chat"]',
};

/* ------------------------------------------------------------ factories -- */

export type Msg = Record<string, unknown> & { id: string; role: string; content: string; mode_used: string };

// Strictly increasing timestamps, as the server writes them: the client orders
// and picks branches by them, and identical ones made a new turn lose to an old one.
let clock = Date.parse("2026-10-01T10:00:00Z");
const stamp = () => new Date((clock += 60_000)).toISOString();

export function msg(id: string, role: "user" | "assistant", content: string, mode = "knowing", parent: string | null = null): Msg {
  return {
    id, role, content, mode_used: mode, reasoning_lens: null,
    confidence_score: role === "assistant" ? 0.82 : null,
    confidence_band: role === "assistant" ? "high" : null,
    avatar_expression: null, avatar_gesture: null,
    created_at: stamp(),
    counterfactual_content: null, crux_text: null, clarifier: null, guidance: null,
    decision_review: null, thinking_review: null, generated_image: null, feedback: null,
    parent_id: parent, sibling_index: 0, sibling_count: 1, sibling_ids: [id], claims: [],
  };
}

/** A conversation of `turns` question/answer pairs, chained parent->child. */
export function thread(turns: number, mode = "knowing", prefix = "t"): Msg[] {
  const out: Msg[] = [];
  let parent: string | null = null;
  for (let i = 0; i < turns; i++) {
    const q = msg(`${prefix}q${i}`, "user", `Question ${i + 1} in ${mode}?`, mode, parent);
    const a = msg(`${prefix}a${i}`, "assistant", `Answer ${i + 1}. ${"Some supporting detail. ".repeat(8)}`, mode, q.id);
    out.push(q, a);
    parent = a.id;
  }
  return out;
}

/** The chat stream, framed exactly as sse-starlette sends it: CRLF. */
export function sseBody(frames: [event: string, data: unknown][]) {
  return frames.map(([e, d]) => `event: ${e}\r\ndata: ${JSON.stringify(d)}\r\n\r\n`).join("");
}

/* ------------------------------------------------------------- the mock -- */

type Reply = { status?: number; body?: unknown; sse?: string; abort?: boolean };
type Handler = (req: Request, url: URL) => Reply | undefined | Promise<Reply | undefined>;

export type MockOpts = {
  failWorkspaces?: boolean;
  extraWorkspaces?: number;
  admin?: boolean;
  messages?: Msg[];
  documents?: { id: string; filename: string; file_type: string | null; status: string; created_at: string }[];
  /** Per-test overrides, keyed "METHOD /path" (path without /api/v1, no query). Checked first. */
  handlers?: Record<string, Handler>;
};

/** Minimal backend for every screen the suite visits. Anything not handled
 *  answers 404 so an unexpected call shows up in the trace. */
export async function mockApi(page: Page, opts: MockOpts = {}) {
  const user = {
    id: "u1", email: CREDS.email, display_name: "E2E User",
    onboarding_completed_at: "2026-01-01T00:00:00Z", is_admin: !!opts.admin,
  };
  const workspaces = [
    { id: "w1", name: "Personal", role: "owner", created_at: "2026-09-01T10:00:00Z" },
    { id: "w2", name: "A workspace with a deliberately long name to test truncation", role: "owner", created_at: "2026-09-02T10:00:00Z" },
  ];
  for (let i = 0; i < (opts.extraWorkspaces ?? 0); i++)
    workspaces.push({ id: `x${i}`, name: `Workspace ${i + 3}`, role: "owner", created_at: "2026-09-03T10:00:00Z" });
  const messages: Msg[] = [...(opts.messages ?? [])];
  const documents = [...(opts.documents ?? [])];
  let seq = 0;

  const tokens = { access_token: "e2e-access", refresh_token: "e2e-refresh" };
  // The app (:3000/:3100) calling the API (:8000) is cross-origin. Chromium
  // lets a mocked response skip CORS; WebKit enforces it, preflight included,
  // so every reply carries the headers the real backend would.
  const cors = (req: Request) => ({
    "access-control-allow-origin": req.headers()["origin"] ?? "*",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  });
  const send = (route: Route, r: Reply) => {
    const headers = cors(route.request());
    if (r.abort) return route.abort("internetdisconnected");
    if (r.status === 204) return route.fulfill({ status: 204, headers });
    if (r.sse !== undefined)
      return route.fulfill({ status: r.status ?? 200, headers, contentType: "text/event-stream", body: r.sse });
    return route.fulfill({ status: r.status ?? 200, headers, contentType: "application/json", body: JSON.stringify(r.body ?? {}) });
  };

  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const m = req.method();
    const q = url.searchParams;
    const authed = !!req.headers()["authorization"];
    const body = () => (req.postData() ? (req.postDataJSON() as Record<string, unknown>) : {});
    const reply = (b: unknown, status = 200) => send(route, { body: b, status });

    if (m === "OPTIONS") return send(route, { status: 204 });

    const custom = opts.handlers?.[`${m} ${path}`];
    if (custom) {
      const r = await custom(req, url);
      if (r) return send(route, r);
    }

    // --- signed out ---
    if (path === "/health") return reply({ status: "ok" });
    if (path === "/auth/login" && m === "POST") {
      const b = body() as { email: string; password: string };
      if (b.email !== CREDS.email || b.password !== CREDS.password) return reply({ detail: "Incorrect email or password" }, 401);
      return reply(tokens);
    }
    if (path === "/auth/register" && m === "POST") {
      const b = body() as { email: string; display_name?: string; accepted_terms: boolean };
      if (b.email.startsWith("taken")) return reply({ detail: "An account with this email already exists." }, 400);
      return reply({ ...tokens, user: { ...user, email: b.email, display_name: b.display_name ?? null } }, 201);
    }
    if (path === "/auth/password-reset/request") return reply({}, 202);
    if (path === "/auth/password-reset/confirm") {
      const b = body() as { token: string };
      if (b.token === "expired") return reply({ detail: "This reset link has expired. Request a new one." }, 400);
      return reply(tokens);
    }
    if (path === "/auth/refresh") return reply(tokens);
    if (path === "/auth/me" && m === "GET") return authed ? reply(user) : reply({ detail: "Not authenticated" }, 401);
    if (!authed) return reply({ detail: "Not authenticated" }, 401);

    // --- shell ---
    if (path === "/workspaces" && opts.failWorkspaces) return route.abort("internetdisconnected");
    if (path === "/workspaces" && m === "GET") return reply(workspaces);
    if (path === "/workspaces" && m === "POST") {
      const ws = { id: `w${workspaces.length + 1}`, name: String(body().name), role: "owner", created_at: new Date().toISOString() };
      workspaces.unshift(ws);
      return reply(ws, 201);
    }
    const wsMatch = path.match(/^\/workspaces\/([^/]+)$/);
    if (wsMatch && m === "GET") {
      const ws = workspaces.find((w) => w.id === wsMatch[1]);
      return ws ? reply({ id: ws.id, name: ws.name }) : reply({ detail: "Workspace not found" }, 404);
    }
    if (path === "/bootstrap") return reply({ user, workspaces, active_workspace_id: "w1", conversation_id: "c1", conversation_created: false });
    if (path === "/chat/conversations" && m === "GET") return reply([]);
    if (path === "/chat/conversations" && m === "POST") return reply({ id: "c2" }, 201);
    if (path === "/pro/preview" && m === "GET")
      return reply({ unlocked: false, modes: ["creative", "mentoring", "therapy", "legal"], daily_limit: 20, used_today: 0, remaining_today: 20 });
    if (path === "/profile" && m === "GET")
      return reply({ personality_md: null, aspects: [], roles: [], user_edited: false, updated_at: null, companion_names: {}, learning_role: null });
    if (path === "/compose/complete") return reply({ completion: "" });

    // --- chat ---
    const conv = path.match(/^\/chat\/conversations\/([^/]+)$/);
    if (conv && m === "GET") return reply({ id: conv[1], title: "E2E chat", default_mode: "knowing", workspace_id: "w1" });
    const thread_ = path.match(/^\/chat\/([^/]+)\/messages$/);
    if (thread_ && m === "GET") return reply(messages);
    if (thread_ && m === "POST") {
      const b = body() as { content: string; mode: string };
      const parent = messages.at(-1)?.id ?? null;
      const u = msg(`u${++seq}`, "user", b.content, b.mode, parent);
      const answerText = `Mock answer to: ${b.content}`;
      const a = msg(`a${seq}`, "assistant", answerText, b.mode, u.id);
      messages.push(u, a);
      return send(route, {
        sse: sseBody([
          ["status", { phase: "thinking", label: "Thinking" }],
          ["crux", { text: "The short answer." }],
          ["delta", { text: "Mock answer " }],
          ["delta", { text: `to: ${b.content}` }],
          ["answer", { message: a, user_message: u }],
          ["final", { message: a, claims: [], confidence: { score: 0.82, band: "high" }, avatar_cue: null, counterfactual_content: null, research_notes: [] }],
        ]),
      });
    }

    // --- documents & search ---
    if (path === "/documents" && m === "GET") return reply(documents);
    if (path === "/documents/upload" && m === "POST") {
      const name = (req.postData() ?? "").match(/filename="([^"]+)"/)?.[1] ?? "upload.txt";
      documents.unshift({ id: `d${++seq}`, filename: name, file_type: name.split(".").pop() ?? null, status: "processed", created_at: new Date().toISOString() });
      return reply({ id: `d${seq}` }, 201);
    }
    const doc = path.match(/^\/documents\/([^/]+)$/);
    if (doc && m === "DELETE") {
      const i = documents.findIndex((d) => d.id === doc[1]);
      if (i >= 0) documents.splice(i, 1);
      return send(route, { status: 204 });
    }
    if (path === "/documents/search") {
      const term = q.get("q") ?? "";
      const hits = term.toLowerCase().includes("budget")
        ? [{ document_id: "d1", filename: "plan.pdf", chunk_index: 0, page_number: 2, excerpt: "The budget for Q4 is fixed.", cited_here: false }]
        : [];
      return reply({ query: term, total: hits.length, hits });
    }
    if (path === "/history/search") {
      const term = q.get("q") ?? "";
      if (!/budget/i.test(term)) return reply([]);
      return reply([{ message_id: "m1", conversation_id: "c1", conversation_title: "Planning", role: "user", content: `We discussed the ${term} last week.`, mode_used: "knowing", created_at: "2026-10-01T10:00:00Z", rank: 1 }]);
    }

    // --- admin ---
    if (path === "/admin/overview") {
      if (!opts.admin) return reply({ detail: "Not Found" }, 404);
      return reply({
        generated_at: "2026-10-09T10:00:00Z", window_days: 30, user_count: 2, active_user_count: 1,
        conversation_count: 3, answer_count: 5, turns_without_usage: 0, input_tokens: 1200, output_tokens: 3400, total_tokens: 4600,
        users: [{ id: "u1", email: CREDS.email, display_name: "E2E User", created_at: "2026-09-01T10:00:00Z", last_active_at: "2026-10-08T10:00:00Z", location: null, accepted_terms: true, onboarded: true, preview_unlocked: false, questions_asked: 5, answers: 5, input_tokens: 1200, output_tokens: 3400, total_tokens: 4600 }],
        by_day: [{ label: "2026-10-08", tokens: 4600 }], by_mode: [{ label: "knowing", tokens: 4600 }], by_model: [],
      });
    }

    return reply({ detail: `not mocked: ${m} ${path}` }, 404);
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

/** Mocked + seeded + signed in, with options - for tests that need more than the fixture. */
export async function signIn(page: Page, opts: MockOpts = {}) {
  await mockApi(page, opts);
  await seedStorage(page, { signedIn: true });
}

/** Tap on touch projects, click elsewhere - one spec body for both. */
export async function press(page: Page, selector: string) {
  const loc = page.locator(selector).first();
  if (await page.evaluate(() => navigator.maxTouchPoints > 0)) await loc.tap();
  else await loc.click();
}

/** Side-scroll on the page or inside <main> (the shell's own scroll box). */
export async function horizontalOverflow(page: Page) {
  return page.evaluate(() =>
    Math.max(
      ...[document.documentElement, document.querySelector("main")]
        .filter((e): e is HTMLElement => !!e)
        .map((e) => e.scrollWidth - e.clientWidth),
    ),
  );
}

/** Visible buttons/links in `scope` smaller than 44x44 screen px. */
export async function smallTargets(page: Page, scope: string) {
  const out: string[] = [];
  for (const el of await page.locator(`${scope} :is(button, a[href], input[type="checkbox"]):visible`).all()) {
    const b = await el.boundingBox();
    if (b && (Math.round(b.width) < 44 || Math.round(b.height) < 44)) {
      const name = (await el.getAttribute("aria-label")) ?? (await el.innerText().catch(() => "")).trim().slice(0, 30);
      out.push(`"${name}" ${Math.round(b.width)}x${Math.round(b.height)}`);
    }
  }
  return out;
}

/** The area a finger can actually hit, in screen px: probes out from the
 *  centre with elementFromPoint until something else is on top. Counts
 *  pseudo-element hit areas, and stops at a neighbour that overlaps. */
export async function tapArea(loc: Locator) {
  // centred, as a reader would have it - "if needed" parks the element on a
  // scroll box's edge, where its reach is clipped by the scroller
  await loc.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest" }));
  return loc.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const hits = (dx: number, dy: number) => {
      const h = document.elementFromPoint(cx + dx, cy + dy);
      return !!h && (h === el || el.contains(h));
    };
    const reach = (sx: number, sy: number) => {
      let d = 0;
      while (d < 60 && hits(sx * (d + 1), sy * (d + 1))) d++;
      return d;
    };
    return { w: reach(-1, 0) + reach(1, 0) + 1, h: reach(0, -1) + reach(0, 1) + 1 };
  });
}

/** min 44 by default; 36 for rows stacked edge to edge (recents, answer options) */
export async function expectTappable(loc: Locator, what: string, min = 44) {
  const a = await tapArea(loc);
  expect.soft(Math.min(a.w, a.h), `${what}: tap area ${a.w}x${a.h}`).toBeGreaterThanOrEqual(min);
}

/** A horizontal finger drag on the carousel, as the pointer events the
 *  component listens for (ModeCarousel onPointerDown/Move/Up, pointerType
 *  touch). Dispatched in the page, so it runs in WebKit too. */
export async function swipeCarousel(page: Page, dx: number) {
  await page.locator(".carousel-viewport").evaluate(async (el, dx) => {
    const r = el.getBoundingClientRect();
    const y = r.top + Math.min(200, r.height / 2);
    const x0 = r.left + r.width / 2;
    const fire = (type: string, x: number) =>
      el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: "touch", pointerId: 7, isPrimary: true, clientX: x, clientY: y }));
    fire("pointerdown", x0);
    for (let i = 1; i <= 10; i++) {
      fire("pointermove", x0 + (dx * i) / 10);
      await new Promise((res) => requestAnimationFrame(res));
    }
    fire("pointerup", x0 + dx);
  }, dx);
  await page.waitForTimeout(350); // the 300ms track transition
}

export const isWebKit = (browserName: string) => browserName === "webkit";

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
