import test from "node:test";
import assert from "node:assert/strict";
import { updateBacklog } from "../holiday-content-backlog.js";
const empty = { version: 1, entries: [] };
const holiday = { key: "us|unseen day", title: "Unseen day", countries: ["US"], providers: ["Nager.Date"], dates: ["2026-09-20"] };
const report = (gaps = [], covered = [], legacyOnly = []) => ({ providers: { status: "complete" }, gaps, covered, legacyOnly });

test("backlog deduplicates repeated sightings, resolves observed coverage and reopens", () => {
  const first = updateBacklog(empty, [report([holiday])], "2026-09-20");
  assert.equal(first.entries.length, 1);
  assert.deepEqual(updateBacklog(first, [report([holiday, holiday])], "2026-09-20"), first);
  const again = updateBacklog(first, [report([holiday])], "2026-09-21");
  assert.equal(again.entries[0].firstSeen, "2026-09-20");
  assert.equal(again.entries[0].lastSeen, "2026-09-21");
  const legacy = updateBacklog(again, [report([], [], [holiday])], "2026-09-22");
  assert.equal(legacy.entries[0].status, "legacy-only");
  const resolved = updateBacklog(legacy, [report([], [holiday])], "2026-09-23");
  assert.equal(resolved.entries[0].status, "resolved");
  assert.equal(resolved.entries[0].resolvedOn, "2026-09-23");
  const reopened = updateBacklog(resolved, [report([holiday])], "2026-09-24");
  assert.equal(reopened.entries[0].status, "missing");
  assert.equal(reopened.entries[0].resolvedOn, undefined);
});

test("outages cannot update backlog and absent holidays cannot imply resolution", () => {
  const first = updateBacklog(empty, [report([holiday])], "2026-09-20");
  for (const status of ["failed", "degraded"]) {
    assert.throws(() => updateBacklog(first, [{ ...report(), providers: { status } }], "2026-09-21"), /complete provider data/);
  }
  assert.deepEqual(updateBacklog(first, [report()], "2026-09-21"), first);
  assert.throws(() => updateBacklog(first, [report([holiday])], "2026-09-19"), /predates/);
});

test("new gaps and combined provider observations are deterministic across API ordering", () => {
  const other = { ...holiday, key: "gb|another day", title: "Another day", countries: ["GB"] };
  const alias = { ...holiday, providers: ["OpenHolidays"], dates: ["2026-09-21"] };
  const forward = updateBacklog(empty, [report([holiday, other]), report([alias])], "2026-09-20");
  const reversed = updateBacklog(empty, [report([alias]), report([other, holiday])], "2026-09-20");
  assert.deepEqual(forward, reversed);
  assert.equal(forward.entries.length, 2);
  assert.deepEqual(forward.entries[1].providers, ["Nager.Date", "OpenHolidays"]);
  assert.deepEqual(forward.entries[1].dates, ["2026-09-20", "2026-09-21"]);
  assert.equal(updateBacklog(empty, [report([holiday], [alias])], "2026-09-20").entries[0].status, "missing");
});

test("CLI updates atomically and preserves saved backlog during provider outages", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const { spawnSync } = await import("node:child_process");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "content-backlog-"));
  const cacheFile = path.join(dir, "cache.cjs");
  const backlogFile = path.join(dir, "backlog.json");
  const cache = {
    window: { start: "2026-09-20", end: "2026-09-20" },
    sourceStats: { nagerRequests: 1, nagerSuccessfulRequests: 1, openHolidaysRequests: 1, openHolidaysSuccessfulRequests: 1 },
    days: { "2026-09-20": [{ title: "Unseen backlog holiday", source: { provider: "Nager.Date", countryCode: "US" } }] }
  };
  const reportFile = path.join(dir, "observation.json");
  const run = (date = "2026-09-20", options = []) => spawnSync(process.execPath,
    ["update-holiday-content-backlog.js", "--cache", cacheFile, "--backlog", backlogFile, "--date", date, ...options],
    { encoding: "utf8" });
  const writeCache = () => fs.writeFileSync(cacheFile, `globalThis.YearCalendarHolidayCache = ${JSON.stringify(cache)};`);
  try {
    writeCache();
    assert.equal(run().status, 0);
    const saved = fs.readFileSync(backlogFile, "utf8");
    assert.equal(JSON.parse(saved).entries.length, 1);
    assert.equal(run().status, 0);
    assert.equal(fs.readFileSync(backlogFile, "utf8"), saved);
    assert.equal(run("2026-09-21", ["--meaningful-only", "--report-json", reportFile]).status, 0);
    assert.equal(fs.readFileSync(backlogFile, "utf8"), saved);
    assert.equal(JSON.parse(fs.readFileSync(reportFile, "utf8")).entries[0].lastSeen, "2026-09-21");
    cache.days["2026-09-20"].push({ title: "Another unseen holiday", source: { provider: "Nager.Date", countryCode: "US" } });
    writeCache();
    assert.equal(run("2026-09-22", ["--meaningful-only", "--report-json", reportFile]).status, 0);
    const changed = fs.readFileSync(backlogFile, "utf8");
    assert.equal(JSON.parse(changed).entries.length, 2);
    cache.sourceStats.nagerSuccessfulRequests = 0;
    writeCache();
    assert.notEqual(run().status, 0);
    assert.equal(fs.readFileSync(backlogFile, "utf8"), changed);
    assert.equal(fs.existsSync(`${backlogFile}.tmp`), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
