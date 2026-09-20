import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Exercise the real render entry point and file validation with a deterministic browser double.
function render({ covered = false, providerFailed = false, browserFailed = false, invalidOutput = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "render-health-"));
  try {
    for (const file of ["render.js", "render-window.js", "holiday-coverage.js"]) {
      fs.copyFileSync(new URL(`../${file}`, import.meta.url), path.join(dir, file));
    }
    fs.mkdirSync(path.join(dir, "data"));
    fs.mkdirSync(path.join(dir, "node_modules/puppeteer"), { recursive: true });
    fs.writeFileSync(path.join(dir, "package.json"), '{"type":"module"}');
    fs.writeFileSync(path.join(dir, "node_modules/puppeteer/package.json"), '{"type":"module","main":"index.js"}');
    fs.writeFileSync(path.join(dir, "node_modules/puppeteer/index.js"), `
      export default { async launch() {
        if (${browserFailed}) throw new Error("Browser launch failed");
        return { async close() {}, async newPage() { return {
          async setDefaultTimeout() {}, async setViewport() {}, async goto() {},
          async waitForSelector() {}, async waitForFunction() {},
          async $eval() { const png = Buffer.alloc(${invalidOutput ? 24 : 210000});
            png.write("\\x89PNG\\r\\n\\x1a\\n", "binary"); png.writeUInt32BE(2340,16); png.writeUInt32BE(5064,20);
            return "data:image/png;base64," + png.toString("base64"); },
          async evaluate() { return { selectedTheme: {title:"Unseen day", motif:"fireworks", contentSource:"generic"}, selectedRank:0, candidates:[{rank:0}] }; }
        }; } };
      } };
    `);
    const days = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`2026-09-${20 + i}`, [{ title: "Unseen day", source: { provider: "Nager.Date", countryCode: "US" } }]]));
    const cache = { window: { start: "2026-09-20", end: "2026-09-27" }, days,
      sourceStats: { nagerRequests: 1, nagerSuccessfulRequests: providerFailed ? 0 : 1, openHolidaysRequests: 1, openHolidaysSuccessfulRequests: 1 } };
    fs.writeFileSync(path.join(dir, "data/holiday-cache.js"), `window.YearCalendarHolidayCache = ${JSON.stringify(cache)};`);
    fs.writeFileSync(path.join(dir, "data/holiday-content.js"), `globalThis.YearCalendarHolidayContent = ${JSON.stringify({ entries: covered ? [{ keys: ["Unseen day"], description: "Copy" }] : [] })};`);
    fs.writeFileSync(path.join(dir, "data/holiday-intros.js"), 'globalThis.YearCalendarHolidayIntros = {};');
    const result = spawnSync(process.execPath, ["render.js", "--date", "2026-09-20"], { cwd: dir, encoding: "utf8", env: { ...process.env, PUPPETEER_EXECUTABLE_PATH: "", THEME_HISTORY_FILE: path.join(dir, "history.json") } });
    return { result, summary: JSON.parse(fs.readFileSync(path.join(dir, "output/render-summary.json"))) };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test("successful render summary preserves consumers and reports complete/degraded content", () => {
  for (const covered of [true, false]) {
    const { result, summary } = render({ covered });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(summary.generated.length, 8);
    assert.equal(summary.health.render.status, "complete");
    assert.equal(summary.health.providers.status, "complete");
    assert.equal(summary.health.contentCoverage.status, covered ? "complete" : "degraded");
    assert.equal(summary.generated[0].contentSource, "generic");
  }
});

test("browser/output failures and provider failures have distinct diagnostics", () => {
  for (const options of [{ browserFailed: true }, { invalidOutput: true }, { providerFailed: true }]) {
    const { result, summary } = render(options);
    assert.notEqual(result.status, 0);
    assert.equal(summary.health.render.status, "failed");
    assert.equal(summary.health.providers.status, options.providerFailed ? "failed" : "complete");
    assert.ok(summary.health.render.error);
  }
});
