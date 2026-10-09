/* @live: the mobile flows against a real backend and model, using the
 * sessions saved by auth.setup.ts. Each run makes its own workspace named
 * e2e-<runId> and deletes it afterwards, so nothing depends on leftovers and
 * nothing is left behind. Skips cleanly when the secrets aren't set (and on
 * fork PRs, which don't receive them). These spend real model tokens. */
import fs from "node:fs";
import { request, type APIRequestContext } from "@playwright/test";
import { ADMIN_STATE, USER_STATE } from "./auth-paths";
import { test, expect, sel, press, swipeCarousel } from "./fixtures";

const API = process.env.E2E_LIVE_API_URL ?? "https://clardentity-backend.onrender.com/api/v1";
const RUN = `e2e-${process.env.GITHUB_RUN_ID ?? Date.now()}`;
const has = (f: string) => fs.existsSync(f);

/** The saved session's access token, for setting up and tearing down via the API. */
function tokenFrom(file: string) {
  const state = JSON.parse(fs.readFileSync(file, "utf8")) as { origins: { localStorage: { name: string; value: string }[] }[] };
  return state.origins.flatMap((o) => o.localStorage).find((e) => e.name === "clardentity_access_token")?.value;
}

test.describe.configure({ mode: "serial", timeout: 180_000 }); // cold starts + real answers

test.describe("live user @live", () => {
  test.use({ storageState: has(USER_STATE) ? USER_STATE : undefined });
  let api: APIRequestContext;
  let workspaceId = "";
  let conversationId = "";

  test.beforeAll(async () => {
    test.skip(!has(USER_STATE), "no live user session (secrets not set)");
    api = await request.newContext({ baseURL: API, extraHTTPHeaders: { Authorization: `Bearer ${tokenFrom(USER_STATE)}` } });
    const ws = await api.post("workspaces", { data: { name: RUN } });
    expect(ws.ok(), await ws.text()).toBe(true);
    workspaceId = (await ws.json()).id;
    const conv = await api.post("chat/conversations", { data: { workspace_id: workspaceId, default_mode: "knowing", title: RUN } });
    expect(conv.ok(), await conv.text()).toBe(true);
    conversationId = (await conv.json()).id;
  });

  test.afterAll(async () => {
    if (api && workspaceId) await api.delete(`workspaces/${workspaceId}`); // cascades to the chat
    await api?.dispose();
  });

  test("L1 chat send on a phone gets a real answer @live @critical", async ({ page }) => {
    await page.goto(`/chat/${conversationId}`);
    const box = page.locator(sel.composer);
    await expect(box).toBeEditable({ timeout: 60_000 });
    await box.tap();
    await box.fill("Reply with one word: pong");
    await press(page, sel.send);
    await expect(page.locator(`${sel.message}[data-role="user"]`).last()).toContainText("pong");
    // a gate card (refined question, mode suggestion...) is a valid outcome too
    await expect(
      page.locator(`${sel.message}[data-role="assistant"]`).or(page.getByRole("button", { name: /Ask as|Keep|Answer without/ })).first(),
    ).toBeVisible({ timeout: 150_000 });
  });

  test("M10b-live carousel swipe on a real multi-mode chat @live", async ({ page }) => {
    const chat = process.env.E2E_CAROUSEL_CHAT;
    test.skip(!chat, "E2E_CAROUSEL_CHAT (a conversation answered in 2+ modes) not set");
    await page.goto(`/chat/${chat}`);
    await page.getByRole("button", { pressed: false }).filter({ hasNotText: "Single thread" }).first().tap({ timeout: 60_000 });
    const nav = page.locator(sel.carouselNav);
    const before = await nav.innerText();
    await swipeCarousel(page, -160);
    await expect(nav).not.toHaveText(before);
  });
});

test.describe("live admin @live", () => {
  test.use({ storageState: has(ADMIN_STATE) ? ADMIN_STATE : undefined });
  test("L2 admin dashboard opens for the admin account @live", async ({ page }) => {
    test.skip(!has(ADMIN_STATE), "no live admin session (secrets not set)");
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin", exact: true })).toBeVisible({ timeout: 90_000 });
  });
});

test.describe("live refusal @live", () => {
  test.use({ storageState: has(USER_STATE) ? USER_STATE : undefined });
  test("L3 admin dashboard refuses the ordinary account @live", async ({ page }) => {
    test.skip(!has(USER_STATE), "no live user session (secrets not set)");
    await page.goto("/admin");
    await expect(page.getByText("This account cannot open the dashboard.")).toBeVisible({ timeout: 90_000 });
  });
});
