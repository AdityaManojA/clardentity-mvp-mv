import { defineConfig, devices } from "@playwright/test";

/* Projects
 *   web            Desktop Chrome - the T-nodes the mobile suite depends on
 *   mobile-chrome  Pixel 7 (Chromium), touch
 *   mobile-safari  iPhone 14 (WebKit), touch. WebKit emulation is NOT real iOS
 *                  Safari: no virtual keyboard, safe areas or momentum scroll.
 *   setup          logs the live test accounts in once (auth.setup.ts)
 *   live           @live specs against a real backend, using setup's sessions
 *
 * Both mobile projects are pinned to 375x812 so every M-test measures the same
 * width; the device descriptor still supplies engine, UA, touch and DPR.
 * The app is responsive - no separate mobile route.
 *
 * Tags: @Mxx/@Txx (checklist IDs), @critical (regression path), @live (real
 * backend), @visual (screenshot baselines - only run with E2E_VISUAL=1, inside
 * the CI Docker image, see .github/workflows/e2e.yml). */

const CI = !!process.env.CI;
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const LIVE_URL = process.env.E2E_LIVE_BASE_URL;
const PHONE = { width: 375, height: 812 };
const MOBILE_SPECS = /(mobile|chat|screens|a11y|offline|visual)\.spec\.ts/;
const skipTags = process.env.E2E_VISUAL === "1" ? /@live/ : /@live|@visual/;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/warmup.ts", // compiles routes up front on local dev runs
  fullyParallel: true,
  // One dev server serves every worker; past ~4 it spends the run compiling
  // routes and page loads time out. Not an app problem, so capped here.
  workers: CI ? 2 : 4,
  retries: CI ? 2 : 0,
  reporter: CI
    ? [
        ["list"],
        ["html", { open: "never" }],
        ["junit", { outputFile: "test-results/junit.xml" }],
        ["json", { outputFile: "test-results/results.json" }], // read by e2e/ci-summary.mjs
      ]
    : [["list"], ["html", { open: "never" }]],
  expect: {
    // ~1% of pixels: absorbs sub-pixel anti-aliasing between runs of the same
    // image, still catches a moved button, a wrapped line or a missing icon
    // (each changes far more than 1% of a 375x812 frame's pixels).
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
  },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // The app's service worker (public/sw.js) would sit between the page and
    // the network; requests it handles never reach page.route(), which in
    // WebKit meant the API mock saw nothing. offline.spec.ts opts back in.
    serviceWorkers: "block",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { baseURL: LIVE_URL ?? BASE_URL } },
    { name: "web", testMatch: /web\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-chrome",
      testMatch: MOBILE_SPECS,
      grepInvert: skipTags,
      use: { ...devices["Pixel 7"], viewport: PHONE, hasTouch: true },
    },
    {
      name: "mobile-safari",
      testMatch: MOBILE_SPECS,
      grepInvert: skipTags,
      use: { ...devices["iPhone 14"], viewport: PHONE, hasTouch: true },
    },
    {
      name: "live",
      testMatch: /live\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], viewport: PHONE, hasTouch: true, baseURL: LIVE_URL ?? BASE_URL },
    },
  ],
  // Reuse a running dev server; otherwise start one (skipped when E2E_BASE_URL
  // points elsewhere). The preflight stub answers CORS OPTIONS on the API port
  // for the mocked suite - see e2e/preflight-stub.mjs; a real backend already
  // on the port is reused instead.
  webServer: [
    ...(process.env.E2E_BASE_URL
      ? []
      : [
          {
            // CI tests a production build: no compile-on-first-visit (which
            // timed a cold route out under parallel load) and no dev overlay.
            // Locally, dev for fast iteration.
            command: CI ? `npm run build && npx next start -p ${PORT}` : `npx next dev -p ${PORT}`,
            url: BASE_URL,
            reuseExistingServer: !CI,
            timeout: CI ? 600_000 : 180_000,
          },
        ]),
    { command: "node e2e/preflight-stub.mjs", port: 8000, reuseExistingServer: true, timeout: 10_000 },
  ],
});
