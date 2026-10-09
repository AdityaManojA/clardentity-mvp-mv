// Writes the E2E result to the GitHub job summary: totals, then every failed
// and flaky test with its checklist ID, project and first error line, and a
// link to the run's artifacts (HTML report, traces, videos). Flaky = failed,
// then passed on retry: listed on its own so it is looked into, not accepted.
import fs from "node:fs";

const file = "test-results/results.json";
const out = process.env.GITHUB_STEP_SUMMARY;
const runUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
const write = (s) => (out ? fs.appendFileSync(out, s + "\n") : console.log(s));

if (!fs.existsSync(file)) {
  write(`### E2E\nNo results file - the run stopped before tests reported. See the [job log](${runUrl}).`);
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(file, "utf8"));
const rows = [];
const walk = (suite, trail) => {
  for (const spec of suite.specs ?? [])
    for (const t of spec.tests) rows.push({ title: [...trail, spec.title].filter(Boolean).join(" › "), project: t.projectName, status: t.status, results: t.results });
  for (const s of suite.suites ?? []) walk(s, [...trail, s.title]);
};
for (const s of report.suites) walk(s, []);

const id = (title) => (title.match(/@(?:[MTL]\d+b?|A11Y|visual)\b/g) ?? []).join(" ");
const firstError = (r) => (r.results.find((x) => x.error)?.error?.message ?? "").replace(/\u001b\[[0-9;]*m/g, "").split("\n")[0].slice(0, 160);
const by = (s) => rows.filter((r) => r.status === s);
const failed = by("unexpected");
const flaky = by("flaky");

write(`### E2E: ${failed.length ? "❌ failed" : "✅ passed"}`);
write(`${by("expected").length} passed · ${failed.length} failed · ${flaky.length} flaky · ${by("skipped").length} skipped`);
if (failed.length) {
  write("\n**Failed**\n\n| ID | Test | Project | First error |\n|---|---|---|---|");
  for (const r of failed) write(`| ${id(r.title)} | ${r.title.replace(/\|/g, "/")} | ${r.project} | ${firstError(r).replace(/\|/g, "/")} |`);
}
if (flaky.length) {
  write("\n**Flaky** (passed on retry - needs a root cause)\n\n| ID | Test | Project |\n|---|---|---|");
  for (const r of flaky) write(`| ${id(r.title)} | ${r.title.replace(/\|/g, "/")} | ${r.project} |`);
}
if (failed.length || flaky.length) write(`\nReport, traces and videos: **playwright-report** and **test-results** artifacts on [this run](${runUrl}#artifacts).`);
