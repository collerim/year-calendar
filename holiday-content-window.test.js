import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { renderWindow, RENDER_LOOKAHEAD_DAYS } from "./render-window.js";

function run(days, args = [], stats) {
  const dir = mkdtempSync(path.join(tmpdir(), "holiday-window-"));
  const file = path.join(dir, "cache.cjs");
  const allDays = {};
  for (let offset = 0; offset <= 90; offset++) {
    const date = new Date(Date.UTC(2026, 8, 17 + offset)).toISOString().slice(0, 10);
    allDays[date] = days[date] || [];
  }
  writeFileSync(file, `globalThis.YearCalendarHolidayCache = ${JSON.stringify({
    window: { start: "2026-09-17", end: "2026-12-16" }, days: allDays, sourceStats: stats
  })};`);
  try {
    return spawnSync(process.execPath, ["list-holiday-content-gaps.js", "--cache", file, ...args], { encoding: "utf8" });
  } finally { rmSync(dir, { recursive: true }); }
}
const theme = (title) => ({ title, source: { provider: "Nager.Date", countryCode: "ZZ" } });
const strict = ["--render-window", "--date", "2026-09-17", "--fail-on-gaps", "--require-provider-data"];

test("shared render window handles month, year and leap-day boundaries", () => {
  assert.equal(RENDER_LOOKAHEAD_DAYS, 7);
  for (const [start, end] of [["2026-09-28", "2026-10-05"], ["2026-12-28", "2027-01-04"], ["2028-02-25", "2028-03-03"]]) {
    assert.deepEqual(renderWindow(start), { start, end });
  }
});

test("daily coverage excludes distant gaps but full audit reports them", () => {
  const days = { "2026-09-17": [theme("Independence Day")], "2026-12-16": [theme("Unknown future holiday")] };
  const daily = run(days, strict);
  assert.equal(daily.status, 0, daily.stderr);
  assert.match(daily.stdout, /2026-09-17 -> 2026-09-24/);
  const audit = run(days);
  assert.equal(audit.status, 0);
  assert.match(audit.stdout, /Unknown future holiday/);
  assert.equal(run(days, ["--fail-on-gaps"]).status, 1);
});

test("render window includes both endpoints and excludes following day", () => {
  for (const date of ["2026-09-17", "2026-09-24", "2026-09-25"]) {
    assert.equal(run({ [date]: [theme("Unknown holiday")] }, strict).status, date === "2026-09-25" ? 0 : 1);
  }
});

test("explicit date range filters both boundaries", () => {
  const days = { "2026-09-17": [theme("Unknown holiday")], "2026-09-18": [theme("Independence Day")], "2026-09-19": [theme("Unknown holiday")] };
  assert.equal(run(days, ["--start-date", "2026-09-18", "--end-date", "2026-09-18", "--fail-on-gaps"]).status, 0);
});

test("invalid, reversed and uncovered ranges fail", () => {
  for (const args of [["--start-date", "2026-02-30"], ["--start-date"], ["--start-date", "2026-09-20", "--end-date", "2026-09-19"], ["--render-window", "--date", "2026-12-15"], ["--render-window", "--start-date", "2026-09-17"]]) {
    assert.notEqual(run({}, args).status, 0, args.join(" "));
  }
});

test("provider absence and total provider failure remain fatal", () => {
  assert.equal(run({}, strict).status, 1);
  assert.equal(run({ "2026-12-16": [theme("Independence Day")] }, strict, { nagerRequests: 5, nagerSuccessfulRequests: 0 }).status, 1);
});

const dailyArgs = JSON.parse(readFileSync(new URL("./package.json", import.meta.url))).scripts["content:gaps:render"].split(" ").slice(2);
test("daily command reports unknown content without blocking and retains strict provider checks", () => {
  const args = [...dailyArgs, "--date", "2026-09-17"];
  const missing = run({ "2026-09-17": [theme("Unknown holiday")] }, args);
  assert.equal(missing.status, 0, missing.stderr);
  assert.match(missing.stdout, /Unknown holiday/);
  assert.equal(run({}, args).status, 1);
  assert.equal(run({ "2026-09-17": [theme("Unknown holiday")] }, args, { nagerSuccessfulRequests: 0 }).status, 1);
  assert.equal(run({ "2026-09-17": [theme("Independence Day")] }, args).status, 0);
});
