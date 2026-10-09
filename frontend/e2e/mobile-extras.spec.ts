/* Phone layout, second batch (M32-M47): the error screens, the rest of the
 * Mv.md checklist, and the routes/components the graphify coverage map found
 * untested (/welcome, /privacy, /terms, the consent banner, feedback). */
import http from "node:http";
import type { AddressInfo } from "node:net";
import type { Page } from "@playwright/test";
import { test, expect, sel, signIn, mockApi, seedStorage, hideDevOverlay, press, thread, sseBody, horizontalOverflow, tapArea, API, KEYS } from "./fixtures";

test.describe.configure({ timeout: 60_000 });

async function openChat(page: Page) {
  await page.goto("/chat/c1");
  await expect(page.locator(sel.composer)).toBeEditable({ timeout: 30_000 });
}

test.describe("error screens", () => {
  test("M32 one broken answer: inline box, rest of the chat works, report flow @M32", async ({ page, browserName }) => {
    const t = thread(2);
    (t[3] as Record<string, unknown>).claims = null; // bad data from the server: this answer throws
    const sent: string[] = [];
    // PostHog drops events from automated browsers (navigator.webdriver);
    // look like a person's phone so the report is actually sent here.
    await page.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
    await signIn(page, { messages: t, onAnalytics: (req) => sent.push(new URL(req.url()).pathname) });
    await openChat(page);

    const box = page.getByTestId("part-error");
    await expect(box).toHaveCount(1);
    await expect(box).toContainText("This answer couldn't be shown.");
    await expect(page.locator(`${sel.message}[data-role="assistant"]`).first()).toContainText("Answer 1"); // the rest renders
    await expect(page.locator(sel.composer)).toBeEditable(); // and the chat still works
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

    // the report link is small; the sheet asks first, sends, and only then
    // shows a reference (the test server's analytics host is the mock)
    await box.getByRole("button", { name: "Report" }).tap();
    const sheet = page.getByRole("dialog", { name: "Report this error" });
    await expect(sheet).toContainText("Send a report?");
    await expect(sheet).toContainText("not your messages");
    await expect(page.getByTestId("error-ref")).toHaveCount(0); // no reference before sending
    await sheet.getByRole("button", { name: "Send report" }).tap();
    await expect(sheet).toContainText("Report sent");
    await expect(page.getByTestId("error-ref")).toHaveText(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
    // Delivery is checked on WebKit: PostHog's bot filter also reads Chrome's
    // brand list, which says "HeadlessChrome" under test (never on a phone).
    if (browserName === "webkit")
      await expect.poll(() => sent.some((p) => /\/(e|i\/v0\/e|batch)\/?$/.test(p) || p.includes("/e/")), { timeout: 10_000 }).toBe(true);
    await sheet.getByRole("button", { name: "Done" }).tap();
    await expect(sheet).toHaveCount(0);

    // Try again remounts the part (same bad data, so the box comes back)
    await box.getByRole("button", { name: "Try again" }).tap();
    await expect(page.getByTestId("part-error")).toContainText("This answer couldn't be shown.");
  });

  test("M33 broken page: page-level box, menu still works @M33", async ({ page }) => {
    await signIn(page, {
      handlers: { "GET /profile": () => ({ body: { aspects: "not-a-list", roles: [], personality_md: null, user_edited: false, updated_at: null, companion_names: {} } }) },
    });
    await page.goto("/profile");
    const box = page.getByTestId("part-error");
    await expect(box).toContainText("This page didn't load.", { timeout: 30_000 });
    await expect(box).toContainText("Your chats are safe");
    await expectTapOk(box.getByRole("button", { name: "Try again" }));
    await press(page, sel.openNav); // the shell survived
    await expect(page.locator(sel.drawer)).toBeVisible();
  });

  test("M34 whole app broken: full-screen companion page @M34", async ({ page }) => {
    // the shell itself throws (its workspace list isn't a list)
    await signIn(page, { handlers: { "GET /workspaces": () => ({ body: { not: "a list" } }) } });
    await page.goto("/workspace");
    const screen = page.getByTestId("app-error");
    await expect(screen).toBeVisible({ timeout: 30_000 });
    await expect(screen).toContainText("Something tripped me up");
    await expect(screen).toContainText("Nothing you did");
    await expectTapOk(screen.getByRole("button", { name: "Reload" }));
    await expect(screen.getByRole("link", { name: "Back to start" })).toHaveAttribute("href", "/start");
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("M35 broken recent-chats list: just that list gives way @M35", async ({ page }) => {
    await signIn(page, {
      handlers: { "GET /chat/conversations": () => ({ body: [{ id: "r1", title: { bad: "title" }, created_at: "2026-10-01T10:00:00Z" }] }) },
    });
    await page.goto("/workspace/w1");
    await press(page, sel.openNav);
    const drawer = page.locator(sel.drawer);
    await expect(drawer.getByTestId("part-error")).toContainText("Recent chats couldn't be shown.", { timeout: 30_000 });
    await expect(drawer.getByRole("link", { name: "Search" })).toBeVisible(); // the rest of the menu works
  });

  test("M36 broken question card: just the card gives way @M36", async ({ page }) => {
    await signIn(page, {
      messages: thread(1),
      handlers: { "POST /chat/c1/messages": () => ({ sse: sseBody([["clarifying_options", { question: "Which one?", options: null }]]) }) },
    });
    await openChat(page);
    await page.locator(sel.composer).fill("help with my budget");
    await press(page, sel.send);
    await expect(page.getByTestId("part-error")).toContainText("This question couldn't be shown.");
    await expect(page.locator(sel.composer)).toBeVisible();
  });
});

async function expectTapOk(loc: ReturnType<Page["locator"]>) {
  const a = await tapArea(loc);
  expect(Math.min(a.w, a.h), `tap area ${a.w}x${a.h}`).toBeGreaterThanOrEqual(44);
}

test.describe("checklist items", () => {
  test("M37 menu open: the page behind it doesn't scroll @M37", async ({ page }) => {
    await signIn(page, { extraWorkspaces: 12 });
    await page.goto("/workspace");
    await expect(page.locator('a[href^="/workspace/x11"]')).toBeAttached({ timeout: 30_000 });
    const overflow = () => page.locator("main").evaluate((m) => getComputedStyle(m).overflowY);
    expect(await overflow()).toBe("auto");
    await press(page, sel.openNav);
    await expect.poll(overflow).toBe("hidden");
    await page.locator(sel.closeNav).tap();
    await expect.poll(overflow).toBe("auto");
  });

  test("M38 draft survives a refresh, cleared once sent @M38", async ({ page }) => {
    await signIn(page, { messages: thread(1) });
    await openChat(page);
    await page.locator(sel.composer).fill("half-written thought about the budget");
    await page.reload();
    await expect(page.locator(sel.composer)).toHaveValue("half-written thought about the budget", { timeout: 30_000 });
    await press(page, sel.send);
    await expect(page.locator(`${sel.message}[data-role="assistant"]`).last()).toContainText("half-written thought");
    await page.reload();
    await expect(page.locator(sel.composer)).toBeEditable({ timeout: 30_000 });
    await expect(page.locator(sel.composer)).toHaveValue("");
  });

  test("M39 named progress while an answer is on its way @M39", async ({ page }) => {
    // A real streaming server for this one: the mock answers in one piece,
    // and the point here is what shows *between* the frames.
    const server = http.createServer((req, res) => {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "access-control-allow-origin": req.headers.origin ?? "*",
        "access-control-allow-headers": "authorization, content-type",
      });
      if (req.method === "OPTIONS") return res.end();
      res.write(sseBody([["status", { phase: "searching", label: "Searching" }]]));
      setTimeout(() => res.write(sseBody([["status", { phase: "validating", label: "Validating" }]])), 1500);
      setTimeout(() => res.end(), 4000);
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const port = (server.address() as AddressInfo).port;
    try {
      await signIn(page, { messages: thread(1) });
      await page.route(`${API}/api/v1/chat/c1/messages`, (route) =>
        route.request().method() === "POST" ? route.continue({ url: `http://127.0.0.1:${port}/stream` }) : route.fallback(),
      );
      await openChat(page);
      await page.locator(sel.composer).fill("what changed this year?");
      await press(page, sel.send);
      await expect(page.getByText("Searching the web")).toBeVisible();
      await expect(page.getByText("Checking the claims")).toBeVisible({ timeout: 5_000 });
    } finally {
      server.close();
    }
  });

  test("M40 small fields render at 16px (no iOS zoom on focus); taps have no delay @M40", async ({ app: page }) => {
    await page.goto("/login");
    await page.locator(sel.email).waitFor({ timeout: 30_000 });
    const m = await page.evaluate(() => {
      const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      const email = document.querySelector<HTMLInputElement>("#email")!;
      const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      return { rendered: parseFloat(getComputedStyle(email).fontSize) * zoom, touch: getComputedStyle(btn).touchAction };
    });
    expect(m.rendered).toBeGreaterThanOrEqual(15.9);
    expect(m.touch).toBe("manipulation");
  });

  test("M41 phone edges: viewport-fit, keyboard resize, safe-area hooks; drawer keeps its swipe @M41", async ({ signedIn: page }) => {
    await page.goto("/workspace");
    await expect(page.locator(sel.openNav)).toBeVisible({ timeout: 30_000 });
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toContain("viewport-fit=cover");
    expect(viewport).toContain("interactive-widget=resizes-content");
    await expect(page.locator('header[data-safe="top"]')).toHaveCount(1);
    await press(page, sel.openNav);
    // the base-layer touch-action rule must not override the drawer's pan-y
    expect(await page.locator(sel.drawer).getByRole("link", { name: "Search" }).evaluate((a) => getComputedStyle(a).touchAction)).toBe("pan-y");
  });

  test("M42 chat icon buttons have a 44px tap area on touch @M42", async ({ page }) => {
    await signIn(page, { messages: thread(1) });
    await openChat(page);
    const small: string[] = [];
    for (const name of ["Attach a file or image", "Record a voice message", "Regenerate this answer", "Mark this answer helpful", "Mark this answer not helpful"]) {
      const el = page.getByRole("button", { name }).first();
      if (!(await el.count())) continue;
      const b = (await el.boundingBox())!;
      if (Math.round(b.width) < 44 || Math.round(b.height) < 44) small.push(`${name} ${Math.round(b.width)}x${Math.round(b.height)}`);
    }
    expect(small, small.join("\n")).toEqual([]);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("M43 daily preview limit (402) is explained in the chat, which stays usable @M43", async ({ page }) => {
    await signIn(page, {
      messages: thread(1),
      handlers: { "POST /chat/c1/messages": () => ({ status: 402, body: { detail: "You've used today's preview messages. They reset at midnight." } }) },
    });
    await openChat(page);
    await page.locator(sel.composer).fill("one more");
    await press(page, sel.send);
    await expect(page.getByText("You've used today's preview messages.")).toBeVisible();
    await expect(page.locator(sel.composer)).toBeEditable();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("M44 feedback buttons work by tap @M44", async ({ page }) => {
    let rated = "";
    await signIn(page, {
      messages: thread(1),
      handlers: { "PUT /chat/c1/messages/ta0/feedback": (req) => { rated = String((req.postDataJSON() as { rating: string }).rating); return undefined; } },
    });
    await openChat(page);
    await page.getByRole("button", { name: "Mark this answer helpful" }).first().tap();
    await expect.poll(() => rated).toBe("up");
  });
});

test.describe("routes the graph found untested", () => {
  test("M45 /welcome on a phone: questions, progress, finish @M45", async ({ page }) => {
    await mockApi(page, { onboarded: false });
    await seedStorage(page, { signedIn: true });
    await page.goto("/welcome");
    const box = page.getByRole("textbox").first();
    await expect(box).toBeVisible({ timeout: 30_000 });
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    await expect(page.getByRole("list", { name: "Progress" })).toBeVisible();
    await box.fill("Planning a career change");
    await expectTapOk(page.getByRole("button", { name: "Continue" }));
    await page.getByRole("button", { name: "Continue" }).tap();
    await page.getByRole("button", { name: "Continue" }).tap();
    await page.getByRole("button", { name: "Finish" }).tap();
    await page.waitForURL(/\/(start|chat\/)/, { timeout: 30_000 });
  });

  for (const path of ["/privacy", "/terms"]) {
    test(`M46 ${path} reads on a phone @M46`, async ({ app: page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible({ timeout: 30_000 });
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      const font = await page.locator("main p, article p, p").first().evaluate((p) => parseFloat(getComputedStyle(p).fontSize));
      expect(font).toBeGreaterThanOrEqual(12);
    });
  }

  test("M47 consent banner on a first visit: fits, tappable, remembers @M47", async ({ page }) => {
    await mockApi(page);
    await hideDevOverlay(page);
    // a first-time visitor - once, so the reload below sees what they chose
    await page.addInitScript((k) => {
      if (sessionStorage.getItem("e2e-fresh")) return;
      localStorage.removeItem(k.consent);
      sessionStorage.setItem("e2e-fresh", "1");
    }, KEYS);
    await page.goto("/login");
    const banner = page.getByRole("dialog", { name: "Analytics consent" });
    await expect(banner).toBeVisible({ timeout: 30_000 });
    const b = (await banner.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(376);
    const buttons = banner.getByRole("button");
    await expectTapOk(buttons.first());
    await expectTapOk(buttons.nth(1));
    await buttons.nth(1).tap();
    await expect(banner).toHaveCount(0);
    await page.reload();
    await expect(page.locator(sel.email)).toBeVisible({ timeout: 30_000 });
    await expect(banner).toHaveCount(0);
  });
});
