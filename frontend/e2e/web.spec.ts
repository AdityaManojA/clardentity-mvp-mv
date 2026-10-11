/* Desktop T-nodes: only the ones the mobile suite depends on
 * (T01 T03 T05 T07 T09 T12 T13). Same selectors as mobile.spec.ts. */
import { test, expect, sel, login, mockApi, seedStorage, KEYS, LIVE } from "./fixtures";

test("T01 desktop render @T01", async ({ app: page }) => {
  await page.goto("/login");
  await expect(page.locator(sel.email)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("T03 login -> /chat @T03 @critical", async ({ app: page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/(start|chat\/)/);
});

test("T05 workspace list renders cards @T05 @critical", async ({ signedIn: page }) => {
  await page.goto("/workspace");
  await expect(page.getByRole("heading", { name: "Workspaces" })).toBeVisible();
  await expect(page.locator('a[href^="/workspace/"]').first()).toBeVisible();
});

test("T07 create workspace form @T07", async ({ signedIn: page }) => {
  await page.goto("/workspace");
  await page.click(sel.wsCreate);
  await expect(page.locator(sel.wsSubmit)).toBeDisabled(); // empty name = invalid
  await page.fill(sel.wsName, "T07 workspace");
  await page.click(sel.wsSubmit);
  await expect(page.getByText("T07 workspace")).toBeVisible();
});

test("T09 sidebar nav @T09", async ({ signedIn: page }) => {
  await page.goto("/workspace");
  await expect(page.locator(sel.openNav)).toBeHidden(); // drawer trigger is mobile-only
  const sidebar = page.locator("aside").first();
  await expect(sidebar).toBeVisible();
  // mouse: the drawn size, no touch enlargement (48px row x 0.85 zoom)
  const row = (await sidebar.getByRole("link", { name: "Search" }).boundingBox())!;
  expect(Math.round(row.height)).toBe(41);
  await sidebar.getByRole("link", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/search|\/workspace/);
});

test("T12 network error shows message @T12", async ({ page }) => {
  test.skip(LIVE, "uses the network mock");
  await mockApi(page, { failWorkspaces: true });
  await seedStorage(page, { signedIn: true });
  await page.goto("/workspace");
  await expect(page.locator(sel.errorBanner).first()).toBeVisible();
  await expect(page.locator(sel.header)).toBeVisible();
});

test("T13 logout clears session @T13 @critical", async ({ signedIn: page }) => {
  await page.goto("/workspace");
  await page.click(sel.accountMenu);
  await page.click(sel.logout);
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 }); // first visit compiles /login in dev
  const tokens = await page.evaluate((k) => [localStorage.getItem(k.access), localStorage.getItem(k.refresh)], KEYS);
  expect(tokens).toEqual([null, null]);
});

test.describe("desktop keeps the drawn design, even with a touch screen", () => {
  test.use({ hasTouch: true, viewport: { width: 1280, height: 800 } });

  test("T14 phone-only changes stay off desktop @T14", async ({ signedIn: page }) => {
    await page.goto("/workspace");
    await expect(page.getByRole("heading", { name: "Workspaces" })).toBeVisible({ timeout: 30_000 });
    const m = await page.evaluate(() => {
      const theme = document.querySelector('button[aria-label="Toggle light and dark theme"]')!.getBoundingClientRect();
      const row = [...document.querySelectorAll("aside a")].find((a) => a.textContent?.includes("Search"))!.getBoundingClientRect();
      const muted = getComputedStyle(document.documentElement).getPropertyValue("--text-muted").trim();
      return { themeH: Math.round(theme.height), rowH: Math.round(row.height), muted };
    });
    expect(m.themeH, "header icon keeps its drawn size").toBeLessThan(30);
    expect(m.rowH, "sidebar row keeps its drawn 48px x 0.85").toBe(41);
    expect(m.muted, "muted text keeps the drawn colour").toBe("#9e8e93");
    await expect(page.getByTestId("offline-notice")).toHaveCount(0);
  });
});

test("T15 desktop curtain stays dark until hovered (no sweep, no tilt) @T15", async ({ app: page }) => {
  await page.goto("/");
  await expect(page.locator(".landing-shimmer")).toBeAttached({ timeout: 30_000 });
  await page.waitForTimeout(1_500);
  const lit = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>(".landing-shimmer > span")].some((p) => Number(p.style.opacity || 0) > 0.02));
  expect(lit).toBe(false);
});

test("T16 desktop curtain lights up and ripples under the mouse @T16", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".landing-shimmer")).toBeAttached({ timeout: 30_000 });
  const stage = page.locator(".landing-shimmer").locator("..");
  const b = (await stage.boundingBox())!;
  for (let i = 0; i < 12; i++) {
    await page.mouse.move(b.x + b.width * (0.3 + i * 0.03), b.y + b.height * 0.3);
    await page.waitForTimeout(50);
  }
  const lit = () => page.evaluate(() => Math.max(0, ...[...document.querySelectorAll<HTMLElement>(".landing-shimmer > span")].map((p) => Number(p.style.opacity || 0))));
  await expect.poll(lit, { message: "hover lights the curtain" }).toBeGreaterThan(0.3);
  // and it goes dark again once the mouse leaves
  await page.mouse.move(5, 5);
  await expect.poll(lit, { message: "dark after the mouse leaves", timeout: 4_000 }).toBeLessThan(0.05);
});
