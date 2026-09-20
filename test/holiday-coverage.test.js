import test from "node:test";
import assert from "node:assert/strict";
import { analyzeHolidayCoverage } from "../holiday-coverage.js";

const theme = { title: "Unseen day", source: { provider: "Nager.Date", countryCode: "US" } };
const stats = { nagerRequests: 2, nagerSuccessfulRequests: 2, openHolidaysRequests: 1, openHolidaysSuccessfulRequests: 1 };
const cache = { window: { start: "2026-09-17", end: "2026-09-17" }, days: { "2026-09-17": [theme] }, sourceStats: stats };
const content = { entries: [{ keys: ["US|Unseen day"], description: "Copy" }] };

test("provider health and content completeness are independent", () => {
  const missing = analyzeHolidayCoverage(cache, {}, {});
  assert.equal(missing.providers.status, "complete");
  assert.equal(missing.contentCoverage.status, "degraded");
  assert.equal(missing.contentCoverage.missingCount, 1);
  assert.equal(missing.gaps[0].key, "us|unseen day");
  const complete = analyzeHolidayCoverage(cache, content, {});
  assert.equal(complete.contentCoverage.status, "complete");
  const legacy = analyzeHolidayCoverage(cache, {}, { "Unseen day": "Old copy" });
  assert.equal(legacy.contentCoverage.status, "degraded");
  assert.equal(legacy.contentCoverage.legacyOnlyCount, 1);
});

test("partial provider data is visible and total failure is not mistaken for completeness", () => {
  const partial = analyzeHolidayCoverage({ ...cache, sourceStats: { ...stats, nagerSuccessfulRequests: 1 } }, content, {});
  assert.equal(partial.providers.status, "degraded");
  assert.match(partial.providers.warnings[0], /1\/2/);
  const failed = analyzeHolidayCoverage({ ...cache, sourceStats: { ...stats, openHolidaysSuccessfulRequests: 0 } }, content, {});
  assert.equal(failed.providers.status, "failed");
  assert.equal(failed.contentCoverage.status, "failed");
  assert.match(failed.providers.issues[0], /openHolidays/);
});

test("cache window bounds remain strict while absent holiday dates are valid", () => {
  const outside = analyzeHolidayCoverage(cache, {}, {}, { start: "2026-09-17", end: "2026-09-18" });
  assert.equal(outside.providers.status, "failed");
  assert.ok(outside.providers.issues.some(issue => /not covered/.test(issue)));
  const sparse = analyzeHolidayCoverage({ ...cache, window: { ...cache.window, end: "2026-09-18" } }, {}, {}, { start: "2026-09-18", end: "2026-09-18" });
  assert.equal(sparse.providers.status, "complete");
  assert.equal(sparse.contentCoverage.status, "complete");
  const malformed = analyzeHolidayCoverage({ ...cache, days: { "2026-09-17": null } }, {}, {});
  assert.equal(malformed.providers.status, "failed");
});
