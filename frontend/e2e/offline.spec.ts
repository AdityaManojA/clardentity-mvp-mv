/* Losing the network after the app has loaded (M23). context.setOffline flips
 * navigator.onLine and fires the offline/online events; the mock is told to
 * fail requests the same way a dead network would.
 *
 * Not covered, by design: reloading while offline. public/sw.js never serves
 * navigations (only content-addressed /_next/static), so an offline reload is
 * the browser's own error page - see TECHNICAL_GUIDE §8. */
import { test, expect, sel, signIn, thread } from "./fixtures";

test.describe.configure({ timeout: 60_000 });

test("M23 offline after load: notice, content kept, actions fail clearly, recovers @M23", async ({ page, context }) => {
  let offline = false;
  const dead = () => (offline ? { abort: true } : undefined);
  await signIn(page, { messages: thread(2), handlers: { "POST /workspaces": dead, "GET /workspaces": dead } });

  await page.goto("/workspace");
  const cards = page.locator('a[href^="/workspace/w"]');
  await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  const notice = page.getByTestId("offline-notice");
  await expect(notice).toHaveCount(0);

  offline = true;
  await context.setOffline(true);
  await expect(notice).toBeVisible(); // told, not a white screen
  await expect(cards.first()).toBeVisible(); // what was loaded stays
  await expect(page.locator(sel.openNav)).toBeVisible();

  // an action that needs the network fails with a message, the page survives
  await page.getByRole("button", { name: "Create" }).tap();
  await page.locator(sel.wsName).fill("Made offline");
  await page.locator(sel.wsSubmit).tap();
  await expect(page.locator(sel.errorBanner).first()).toContainText("Couldn't reach the server");
  await expect(cards.first()).toBeVisible();

  // back online: the notice goes on its own, no refresh, and the retry works
  offline = false;
  await context.setOffline(false);
  await expect(notice).toHaveCount(0);
  await page.locator(sel.wsSubmit).tap();
  await expect(page.getByText("Made offline")).toBeVisible();
});

test("M23b chat composer waits while offline, keeps the draft @M23", async ({ page, context }) => {
  await signIn(page, { messages: thread(2) });
  await page.goto("/chat/c1");
  const box = page.locator(sel.composer);
  await expect(box).toBeEditable({ timeout: 30_000 });
  await box.fill("Typed before the tunnel");

  await context.setOffline(true);
  await expect(page.getByTestId("offline-notice")).toBeVisible();
  await expect(box).toBeDisabled();
  await expect(box).toHaveAttribute("placeholder", /offline/);
  await expect(box).toHaveValue("Typed before the tunnel"); // nothing lost
  await expect(page.locator(sel.message).first()).toBeVisible(); // history stays readable

  await context.setOffline(false);
  await expect(box).toBeEditable();
  await expect(page.locator(sel.send)).toBeEnabled();
});
