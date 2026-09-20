globalThis.window = globalThis;

import fs from "node:fs";
import { analyzeHolidayCoverage } from "./holiday-coverage.js";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseDateKey, renderWindow } from "./render-window.js";

const options = parseArgs(process.argv.slice(2));

await import(cacheImportUrl(options.cache));
await import("./data/holiday-content.js");
await import("./data/holiday-intros.js");

const cache = globalThis.YearCalendarHolidayCache || {};
const report = analyzeHolidayCoverage(cache, globalThis.YearCalendarHolidayContent || {}, globalThis.YearCalendarHolidayIntros || {},
  options.renderWindow ? renderWindow(options.date) : { start: options.startDate || cache.window?.start, end: options.endDate || cache.window?.end });
const { range, providerHolidayCount, coveredByContent, coveredByLegacyIntro } = report;
const gaps = new Map(report.gaps.map(item => [item.key, item]));
const legacyOnly = new Map(report.legacyOnly.map(item => [item.key, item]));
if (options.reportJson) {
  fs.mkdirSync(path.dirname(options.reportJson), { recursive: true });
  fs.writeFileSync(options.reportJson, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(`Provider health: ${report.providers.status}; content health: ${report.contentCoverage.status}`);
for (const warning of report.providers.warnings) console.warn(`Provider warning: ${warning}`);
const list = [...(options.legacyOnly ? legacyOnly : gaps).values()];
console.log(`Holiday content coverage for ${range.start} -> ${range.end} (inclusive)`);
console.log(`Provider candidates: ${providerHolidayCount}`);
console.log(`Covered by structured content: ${coveredByContent}`);
console.log(`Covered by legacy intros: ${coveredByLegacyIntro}`);
console.log(`Uncovered unique titles: ${gaps.size}`);
console.log(`Legacy-only unique titles: ${legacyOnly.size}`);
if (cache.sourceStats) {
  console.log(`Nager successful requests: ${cache.sourceStats.nagerSuccessfulRequests}/${cache.sourceStats.nagerRequests}`);
  console.log(`OpenHolidays successful requests: ${cache.sourceStats.openHolidaysSuccessfulRequests}/${cache.sourceStats.openHolidaysRequests}`);
}
console.log("");

for (const [index, gap] of list.slice(0, options.limit).entries()) {
  console.log(`${index + 1}. ${gap.title}`);
  console.log(`   countries: ${joinSet(gap.countries)}`);
  console.log(`   providers: ${joinSet(gap.providers)}`);
  console.log(`   dates: ${joinSet(gap.dates, 6)}`);
  console.log(`   local: ${joinSet(gap.localNames, 4)}`);
  console.log(`   types: ${joinSet(gap.typeLabels, 4)}`);
}

if (report.providers.issues.length && (options.requireProviderData || report.providers.issues.some(issue => /cache/.test(issue)))) {
  for (const issue of report.providers.issues) console.error(issue);
  process.exit(1);
}

if (options.failOnGaps && (gaps.size || legacyOnly.size)) {
  console.error(`Holiday content coverage failed: ${gaps.size} uncovered title(s), ${legacyOnly.size} legacy-only title(s).`);
  process.exit(1);
}

function parseArgs(args) {
  function dateArg(flag) {
    const index = args.indexOf(flag);
    if (index < 0) return undefined;
    const value = args[index + 1];
    parseDateKey(value);
    return value;
  }
  const startDate = dateArg("--start-date");
  const endDate = dateArg("--end-date");
  const date = dateArg("--date");
  const useRenderWindow = args.includes("--render-window");
  if (useRenderWindow && (startDate || endDate)) throw new Error("--render-window cannot be combined with explicit date bounds.");
  if (date && !useRenderWindow) throw new Error("--date requires --render-window.");
  const limitIndex = args.indexOf("--limit");
  const limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) : 50;
  const cacheIndex = args.indexOf("--cache");
  return {
    startDate, endDate, date, renderWindow: useRenderWindow,
    reportJson: args.includes("--report-json") ? args[args.indexOf("--report-json") + 1] : null,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 50,
    legacyOnly: args.includes("--legacy-only"),
    cache: cacheIndex >= 0 ? args[cacheIndex + 1] : "./data/holiday-cache.js",
    failOnGaps: args.includes("--fail-on-gaps"),
    requireProviderData: args.includes("--require-provider-data")
  };
}

function cacheImportUrl(cachePath) {
  if (/^(file:|https?:)/.test(cachePath)) return cachePath;
  return pathToFileURL(path.resolve(cachePath)).href;
}

function joinSet(values, limit = Infinity) {
  const items = [...values].slice(0, limit);
  return items.length ? items.join(", ") : "-";
}
