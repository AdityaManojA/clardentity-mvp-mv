/* Signs the live test accounts in once and saves their sessions for the
 * `live` project (live.spec.ts). Credentials come only from the environment -
 * locally from your shell, in CI from repository secrets:
 *
 *   E2E_LIVE_BASE_URL     the deployed frontend to test (e.g. a staging URL)
 *   E2E_USER_EMAIL / E2E_USER_PASSWORD     an ordinary account
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD   an account on the backend's admin list
 *
 * Missing values skip the login (and every @live test after it) with a
 * reason; they never fail the run. Sessions land in playwright/.auth/, which
 * is gitignored - they hold real refresh tokens. Never use the shared
 * clardentity@test.com account here (TECHNICAL_GUIDE §3). */
import fs from "node:fs";
import { test as setup, expect } from "@playwright/test";
import { KEYS } from "./fixtures";
import { ADMIN_STATE, AUTH_DIR, USER_STATE } from "./auth-paths";

const accounts = [
  { name: "user", email: process.env.E2E_USER_EMAIL, password: process.env.E2E_USER_PASSWORD, file: USER_STATE },
  { name: "admin", email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD, file: ADMIN_STATE },
];

for (const acct of accounts) {
  setup(`sign in the ${acct.name} test account`, async ({ page }) => {
    setup.skip(!process.env.E2E_LIVE_BASE_URL, "E2E_LIVE_BASE_URL not set - live tests skipped");
    setup.skip(!acct.email || !acct.password, `${acct.name} test-account secrets not set - its live tests are skipped`);
    fs.mkdirSync(AUTH_DIR, { recursive: true });

    await page.goto("/login");
    await page.locator("#email").fill(acct.email!);
    await page.locator("#password").fill(acct.password!);
    await page.getByRole("button", { name: "Log in" }).click();
    // a fresh account lands on /welcome; finish onboarding once by hand (see Mv.md)
    await page.waitForURL(/\/(start|chat\/|welcome)/, { timeout: 60_000 });
    expect(page.url(), `${acct.name} account still needs onboarding - sign in once and answer the welcome questions`).not.toContain("/welcome");

    // no consent banner or coachmarks over the pages under test
    await page.evaluate((k) => {
      localStorage.setItem(k.consent, "denied");
      localStorage.setItem(k.tour, JSON.stringify({ active: null, stepIndex: 0, done: { workspace: true, chat: true } }));
    }, KEYS);
    await page.context().storageState({ path: acct.file });
  });
}
