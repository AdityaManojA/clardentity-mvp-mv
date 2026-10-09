import { defineConfig, devices } from "@playwright/test";

// Two projects share one set of fixtures (e2e/fixtures.ts):
//   web    - desktop T-nodes (e2e/web.spec.ts), the upstream deps of the mobile suite
//   mobile - Pixel 5 emulation pinned to 375x812, touch on (e2e/mobile.spec.ts)
// Nodes are tagged @T03 / @M04 / @critical so the regression loop can --grep them.
// The app is responsive - no separate mobile route; mobile = same URLs at 375w.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "web", testMatch: /web\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } },
    },
  ],
  // Reuse a running dev server; otherwise start one. Skipped when E2E_BASE_URL
  // points somewhere else (staging).
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx next dev -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
