/* Automated accessibility scan (axe-core, WCAG 2.0/2.1 A + AA) on the mobile
 * layouts: login, workspaces, and the open navigation drawer. Fails on
 * serious/critical violations; minor/moderate ones are reported in the test's
 * annotations (and the HTML report) without failing. Automated rules catch
 * roughly a third of WCAG issues - this is a floor, not an audit. */
import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";
import { test, expect, sel, press } from "./fixtures";

test.describe.configure({ timeout: 60_000 });

async function scan(page: Page, info: TestInfo, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  // grouped by rule, with the offending selectors
  const report = violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => n.target.join(" ")).slice(0, 8),
  }));
  await info.attach("axe-violations.json", { body: JSON.stringify(report, null, 2), contentType: "application/json" });
  for (const v of report.filter((r) => r.impact !== "serious" && r.impact !== "critical"))
    info.annotations.push({ type: `a11y ${v.impact}`, description: `${v.rule}: ${v.help} -> ${v.nodes.join(" | ")}` });
  const blocking = report.filter((r) => r.impact === "serious" || r.impact === "critical");
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

test("A11Y-1 login @a11y", async ({ app: page }, info) => {
  await page.goto("/login");
  await page.locator(sel.email).waitFor({ timeout: 30_000 });
  await scan(page, info);
});

test("A11Y-2 workspaces @a11y", async ({ signedIn: page }, info) => {
  await page.goto("/workspace");
  await expect(page.locator('a[href^="/workspace/w"]').first()).toBeVisible({ timeout: 30_000 });
  await scan(page, info);
});

test("A11Y-3 navigation drawer open @a11y", async ({ signedIn: page }, info) => {
  await page.goto("/workspace");
  await press(page, sel.openNav);
  await expect(page.locator(sel.drawer)).toBeVisible();
  await page.waitForTimeout(300);
  await scan(page, info, sel.drawer);
});
