/* Remaining screens on mobile (M16-M22): register, password reset, profile,
 * settings, documents, search, admin. Each: renders at 375x812 with no
 * sideways scroll, primary actions have a 44px tap area, happy path, and at
 * least one error path. Mocked backend; the reset email is never sent - the
 * token is put straight in the URL, as the link in the email would. */
import type { Page } from "@playwright/test";
import { test, expect, sel, signIn, press, horizontalOverflow, expectTappable, CREDS } from "./fixtures";

test.describe.configure({ timeout: 60_000 }); // first visit compiles each route in dev

async function noSideScroll(page: Page) {
  expect(await horizontalOverflow(page), `side-scroll on ${new URL(page.url()).pathname}`).toBeLessThanOrEqual(0);
}

test.describe("signed out", () => {
  test("M16 register: validates, signs up, shows a taken email @M16", async ({ app: page }) => {
    await page.goto("/register");
    const submit = page.getByRole("button", { name: "Sign up" });
    await expect(submit).toBeVisible({ timeout: 30_000 });
    await noSideScroll(page);
    await expectTappable(submit, "Sign up");

    // native validation: short password and no terms -> nothing is sent
    let posted = 0;
    page.on("request", (r) => { if (r.url().endsWith("/auth/register") && r.method() === "POST") posted++; });
    await page.locator("#email").fill("new-user@example.com");
    await page.locator("#password").fill("short");
    await press(page, 'button:has-text("Sign up")');
    expect(await page.locator("#password").evaluate((el: HTMLInputElement) => el.validity.tooShort)).toBe(true);
    expect(posted).toBe(0);

    // error path: an address that's already registered
    await page.locator("#password").fill("long-enough-pw");
    await page.getByRole("checkbox").check();
    await page.locator("#email").fill("taken@example.com");
    await press(page, 'button:has-text("Sign up")');
    await expect(page.locator(sel.errorBanner)).toContainText("already exists");

    // happy path
    await page.locator("#displayName").fill("New User");
    await page.locator("#email").fill("new-user@example.com");
    await press(page, 'button:has-text("Sign up")');
    await page.waitForURL(/\/(start|chat\/|welcome)/);
  });

  test("M17 forgot + reset password: request, mismatch, expired link, success @M17", async ({ app: page }) => {
    await page.goto("/forgot-password");
    const send = page.getByRole("button", { name: "Send reset link" });
    await expect(send).toBeVisible({ timeout: 30_000 });
    await noSideScroll(page);
    await expectTappable(send, "Send reset link");
    await page.locator("#email").fill(CREDS.email);
    await press(page, 'button:has-text("Send reset link")');
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

    // a link clipped by the mail client
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "This link is incomplete" })).toBeVisible({ timeout: 30_000 });

    // expired token -> server error shown
    await page.goto("/reset-password?token=expired");
    const save = page.getByRole("button", { name: "Save and sign in" });
    await page.locator("#password").fill("new-password-1");
    await page.locator("#confirm").fill("new-password-2");
    await expect(page.getByText("These two don't match yet.")).toBeVisible();
    await expect(save).toBeDisabled();
    await page.locator("#confirm").fill("new-password-1");
    await expect(save).toBeEnabled();
    await expectTappable(save, "Save and sign in");
    await press(page, 'button:has-text("Save and sign in")');
    await expect(page.locator(sel.errorBanner)).toContainText("expired");

    // valid token -> signed in
    await page.goto("/reset-password?token=good");
    await page.locator("#password").fill("new-password-1");
    await page.locator("#confirm").fill("new-password-1");
    await press(page, 'button:has-text("Save and sign in")');
    await page.waitForURL(/\/(start|chat\/)/);
  });
});

test.describe("signed in", () => {
  test("M18 profile: renders, adds an aspect, shows a load error @M18", async ({ page }) => {
    const profile = { personality_md: null, aspects: [] as unknown[], roles: [], user_edited: false, updated_at: null, companion_names: {}, learning_role: null };
    await signIn(page, {
      handlers: {
        "POST /profile/aspects": (req) => {
          const b = req.postDataJSON() as { label: string; value: string };
          profile.aspects.push({ id: "asp1", label: b.label, value: b.value, source: "user" });
          return { body: profile };
        },
      },
    });
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Learned Profile Facts" })).toBeVisible({ timeout: 30_000 });
    await noSideScroll(page);
    const add = page.getByRole("button", { name: "Add Aspect" });
    await expectTappable(add, "Add Aspect");
    await add.tap();
    await page.getByRole("combobox", { name: "Aspect" }).selectOption({ label: "Work" });
    await page.getByRole("textbox", { name: "Aspect value" }).fill("Product designer");
    await noSideScroll(page); // the open form wraps rather than widening the page
    await page.getByRole("button", { name: "Add", exact: true }).tap();
    await expect(page.getByText("Product designer")).toBeVisible();
    await expectTappable(page.getByRole("button", { name: "Remove Work" }), "Remove Work");
  });

  test("M18b profile load error @M18", async ({ page }) => {
    await signIn(page, { handlers: { "GET /profile": () => ({ status: 500, body: { detail: "Profile service is unavailable." } }) } });
    await page.goto("/profile");
    await expect(page.locator(sel.errorBanner).first()).toContainText("unavailable", { timeout: 30_000 });
    await expect(page.locator(sel.openNav)).toBeVisible(); // shell intact
  });

  test("M19 settings: renders, renames a companion, shows a save failure @M19", async ({ page }) => {
    let fail = false;
    await signIn(page, {
      handlers: {
        "PUT /profile": (req) => (fail ? { status: 500, body: { detail: "nope" } } : { body: req.postDataJSON() }),
      },
    });
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible({ timeout: 30_000 });
    await noSideScroll(page);
    await expectTappable(page.getByRole("button", { name: "See plans" }), "See plans");
    await expectTappable(page.getByRole("button", { name: "Delete Account" }), "Delete Account");

    const rename = page.getByRole("button", { name: "Name Finder" });
    await expectTappable(rename, "Name Finder");
    await rename.tap();
    await page.getByRole("textbox", { name: "Name for Finder" }).fill("Ada");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Rename Finder" })).toBeVisible();
    await expect(page.getByText("Ada", { exact: true })).toBeVisible();

    fail = true;
    await page.getByRole("button", { name: "Name Thought coach" }).tap();
    await page.getByRole("textbox", { name: "Name for Thought coach" }).fill("Sage");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Could not save that name. Try again.")).toBeVisible();
    await noSideScroll(page);
  });

  test("M20 documents: upload, delete, search, upload error @M20", async ({ page }) => {
    let rejectNext = false;
    await signIn(page, {
      handlers: {
        "POST /documents/upload": () => (rejectNext ? { status: 413, body: { detail: "That file is over the 25 MB limit." } } : undefined),
      },
    });
    await page.goto("/workspace/w1/documents");
    await expect(page.getByRole("heading", { name: "Attachments", exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Nothing attached yet.")).toBeVisible();
    await noSideScroll(page);
    const upload = page.getByRole("button", { name: "Upload" });
    await expectTappable(upload, "Upload");

    const file = { name: "quarterly-plan-with-a-long-file-name.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 e2e") };
    await page.locator('input[type="file"][aria-label="Upload a document"]').setInputFiles(file);
    const tile = page.locator("li", { hasText: "quarterly-plan" });
    await expect(tile).toBeVisible();
    await noSideScroll(page);

    // on a touch screen the delete control has to be visible without hover
    const del = page.getByRole("button", { name: `Delete ${file.name}` });
    await expect(del).toBeVisible();
    expect(Number(await del.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.5);
    await expectTappable(del, "Delete document");
    await del.tap();
    await expect(tile).toHaveCount(0);

    rejectNext = true;
    await page.locator('input[type="file"][aria-label="Upload a document"]').setInputFiles({ ...file, name: "huge.pdf" });
    await expect(page.getByText("over the 25 MB limit")).toBeVisible();

    // attachment search: hit, empty, special characters
    const box = page.getByRole("searchbox", { name: "Search attachments" });
    await box.fill("budget");
    await page.getByRole("button", { name: "Search", exact: true }).tap();
    await expect(page.getByText("1 passage")).toBeVisible();
    await box.fill(`<b>"50%" & 'x'</b>`);
    await page.getByRole("button", { name: "Search", exact: true }).tap();
    // shown as text, not markup, and the page survives it
    await expect(page.locator("p.border-dashed")).toContainText(`<b>"50%" & 'x'</b>`);
    await expect(page.locator("b", { hasText: "50%" })).toHaveCount(0);
    await noSideScroll(page);
  });

  test("M21 search history: results, empty state, special characters @M21", async ({ page }) => {
    const queries: string[] = [];
    await signIn(page, {
      handlers: { "GET /history/search": (_req, url) => { queries.push(url.searchParams.get("q") ?? ""); return undefined; } },
    });
    await page.goto("/workspace/w1/search");
    const box = page.getByRole("searchbox", { name: "Search chat history" });
    await expect(box).toBeVisible({ timeout: 30_000 });
    await noSideScroll(page);
    const go = page.getByRole("button", { name: "Search", exact: true });
    await expectTappable(go, "Search");

    await box.fill("budget");
    await go.tap();
    const hit = page.getByRole("link", { name: /Planning/ });
    await expect(hit).toBeVisible();
    await expect(hit).toHaveAttribute("href", "/chat/c1");
    await expectTappable(hit, "Search result");

    await box.fill("nothing like this");
    await box.press("Enter");
    await expect(page.getByText("Nothing said in this workspace matches that.")).toBeVisible();

    const special = `50% & <script>"x"</script> #tag ?q=1`;
    await box.fill(special);
    await go.tap();
    await expect(page.getByText("Nothing said in this workspace matches that.")).toBeVisible();
    expect(queries.at(-1)).toBe(special); // encoded on the way out, intact at the server
    await noSideScroll(page);
  });

  test("M22 admin: dashboard for an admin, refusal for everyone else @M22", async ({ page }) => {
    await signIn(page, { admin: true });
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin", exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Registered")).toBeVisible();
    await noSideScroll(page); // the users table scrolls inside its own box
    await expectTappable(page.getByRole("button", { name: "Refresh" }), "Refresh");
    await press(page, sel.openNav);
    await expect(page.locator(sel.drawer).getByRole("link", { name: "Admin" })).toBeVisible();
  });

  test("M22b admin refused for a normal user @M22", async ({ signedIn: page }) => {
    await page.goto("/admin");
    await expect(page.getByText("This account cannot open the dashboard.")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(`Signed in as ${CREDS.email}`)).toBeVisible();
    await press(page, sel.openNav);
    await expect(page.locator(sel.drawer).getByRole("link", { name: "Admin" })).toHaveCount(0);
  });
});
