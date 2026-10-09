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
  await expect(page).toHaveURL(/\/login/);
  const tokens = await page.evaluate((k) => [localStorage.getItem(k.access), localStorage.getItem(k.refresh)], KEYS);
  expect(tokens).toEqual([null, null]);
});
