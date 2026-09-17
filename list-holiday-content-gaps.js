globalThis.window = globalThis;

import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseDateKey, renderWindow } from "./render-window.js";

const options = parseArgs(process.argv.slice(2));

await import(cacheImportUrl(options.cache));
await import("./data/holiday-content.js");
await import("./data/holiday-intros.js");

const cache = globalThis.YearCalendarHolidayCache || {};
const content = globalThis.YearCalendarHolidayContent || {};
const intros = globalThis.YearCalendarHolidayIntros || {};
const range = options.renderWindow ? renderWindow(options.date) : {
  start: options.startDate || cache.window?.start,
  end: options.endDate || cache.window?.end
};
parseDateKey(range.start);
parseDateKey(range.end);
if (range.start > range.end) throw new Error("Start date must not be after end date.");
if (range.start < cache.window?.start || range.end > cache.window?.end || !cache.window?.start || !cache.window?.end) {
  throw new Error("Requested date range is not covered by the holiday cache.");
}
const isProvider = (theme) => ["Nager.Date", "OpenHolidays"].includes(theme.source?.provider);
const hasProviderData = Object.values(cache.days || {}).some((themes) => themes.some(isProvider));

const entries = Array.isArray(content.entries) ? content.entries : [];
const introKeys = new Set(Object.keys(intros).map(normalizeKey));
const gaps = new Map();
const legacyOnly = new Map();
let providerHolidayCount = 0;
let coveredByContent = 0;
let coveredByLegacyIntro = 0;

for (const [date, themes] of Object.entries(cache.days || {}).sort(([a], [b]) => a.localeCompare(b))) {
  if (date < range.start || date > range.end) continue;
  for (const theme of themes) {
    if (!["Nager.Date", "OpenHolidays"].includes(theme.source?.provider)) continue;
    providerHolidayCount += 1;

    const keys = holidayLookupKeys(theme);
    if (holidayContentFor(keys)) {
      coveredByContent += 1;
      continue;
    }
    if (keys.some((key) => intros[key] || introKeys.has(normalizeKey(key)))) {
      coveredByLegacyIntro += 1;
      addHolidaySummary(legacyOnly, theme, date);
      continue;
    }

    addHolidaySummary(gaps, theme, date);
  }
}

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

const failedProviders = ["nager", "openHolidays"].filter((name) =>
  cache.sourceStats?.[`${name}SuccessfulRequests`] === 0
);
if (options.requireProviderData && (!hasProviderData || failedProviders.length)) {
  console.error(failedProviders.length
    ? `Provider data unavailable: ${failedProviders.join(", ")} had no successful requests.`
    : "No Nager.Date/OpenHolidays provider candidates found in the selected cache.");
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

function addHolidaySummary(target, theme, date) {
  const id = normalizeKey(`${theme.source?.countryCode || ""}|${theme.title}`);
  if (!target.has(id)) {
    target.set(id, {
      title: theme.title,
      providers: new Set(),
      countries: new Set(),
      dates: new Set(),
      localNames: new Set(),
      typeLabels: new Set()
    });
  }
  const summary = target.get(id);
  summary.providers.add(theme.source.provider);
  if (theme.source.countryCode) summary.countries.add(theme.source.countryCode);
  if (theme.source.localName && theme.source.localName !== theme.title) summary.localNames.add(theme.source.localName);
  for (const label of theme.source.typeLabels || []) summary.typeLabels.add(label);
  summary.dates.add(date);
}

function holidayLookupKeys(theme) {
  const source = theme.source || {};
  return [
    source.countryCode ? `${source.countryCode}|${theme.title}` : "",
    source.countryCode && source.localName ? `${source.countryCode}|${source.localName}` : "",
    theme.title,
    source.localName || ""
  ].filter(Boolean);
}

function holidayContentKeys(entry) {
  return Array.isArray(entry.keys) ? entry.keys.filter(Boolean) : [];
}

function holidayContentFor(keys) {
  const countryScopedKeys = keys.filter(isCountryScopedHolidayKey);
  const countryLookup = new Set(countryScopedKeys.map(normalizeKey));
  const countryMatch = entries.find((entry) => holidayContentKeys(entry).some((key) => countryLookup.has(normalizeKey(key))));
  if (countryMatch) return countryMatch;

  const genericLookup = new Set(keys.filter((key) => !isCountryScopedHolidayKey(key)).map(normalizeKey));
  return entries.find((entry) => {
    const entryKeys = holidayContentKeys(entry);
    if (entryKeys.some(isCountryScopedHolidayKey)) return false;
    return entryKeys.some((key) => genericLookup.has(normalizeKey(key)));
  }) || null;
}

function isCountryScopedHolidayKey(key) {
  return /^[A-Z]{2}\|/.test(key);
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ").trim();
}

function joinSet(values, limit = Infinity) {
  const items = [...values].slice(0, limit);
  return items.length ? items.join(", ") : "-";
}
