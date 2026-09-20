import { parseDateKey } from "./render-window.js";

export function analyzeHolidayCoverage(cache, content, intros, requestedRange) {
  const issues = [];
  const range = requestedRange || cache.window;
  parseDateKey(range.start);
  parseDateKey(range.end);
  if (range.start > range.end) throw new Error("Start date must not be after end date.");
  if (range.start < cache.window?.start || range.end > cache.window?.end || !cache.window?.start || !cache.window?.end) {
    issues.push("Requested date range is not covered by the holiday cache.");
  }
  if (!cache.days || typeof cache.days !== "object" || Array.isArray(cache.days)) issues.push("Invalid cache days");
  for (const [key, themes] of Object.entries(cache.days || {})) {
    if (!Array.isArray(themes)) issues.push(`Invalid cache candidates: ${key}`);
  }
  const isProvider = (theme) => ["Nager.Date", "OpenHolidays"].includes(theme.source?.provider);
  const hasProviderData = Object.values(cache.days || {}).some((themes) => Array.isArray(themes) && themes.some(isProvider));

  const entries = Array.isArray(content.entries) ? content.entries : [];
  const introKeys = new Set(Object.keys(intros).map(normalizeKey));
  const gaps = new Map();
  const covered = new Map();
  const legacyOnly = new Map();
  let providerHolidayCount = 0;
  let coveredByContent = 0;
  let coveredByLegacyIntro = 0;

  for (const [date, themes] of Object.entries(cache.days || {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (date < range.start || date > range.end) continue;
    if (!Array.isArray(themes)) continue;
    for (const theme of themes) {
      if (!["Nager.Date", "OpenHolidays"].includes(theme.source?.provider)) continue;
      providerHolidayCount += 1;

      const keys = holidayLookupKeys(theme);
      if (holidayContentFor(keys, entries)) {
        coveredByContent += 1;
        addHolidaySummary(covered, theme, date);
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


  const failedProviders = ["nager", "openHolidays"].filter(name => cache.sourceStats?.[`${name}SuccessfulRequests`] === 0);
  if (!hasProviderData) issues.push("No Nager.Date/OpenHolidays provider candidates found in the selected cache.");
  if (failedProviders.length) issues.push(`Provider data unavailable: ${failedProviders.join(", ")} had no successful requests.`);
  const warnings = [...(cache.errors || [])];
  for (const name of ["nager", "openHolidays"]) {
    const requests = cache.sourceStats?.[`${name}Requests`];
    const success = cache.sourceStats?.[`${name}SuccessfulRequests`];
    if (!Number.isFinite(requests) || !Number.isFinite(success)) warnings.push(`${name}: request statistics unavailable`);
    else if (success < requests) warnings.push(`${name}: ${success}/${requests} successful requests`);
  }
  return {
    range, providerHolidayCount, coveredByContent, coveredByLegacyIntro,
    providers: { status: issues.length ? "failed" : warnings.length ? "degraded" : "complete", issues, warnings, sourceStats: cache.sourceStats || null, generatedAt: cache.generatedAt || null },
    contentCoverage: { status: issues.length ? "failed" : gaps.size || legacyOnly.size ? "degraded" : "complete", missingCount: gaps.size, legacyOnlyCount: legacyOnly.size },
    gaps: summaries(gaps), legacyOnly: summaries(legacyOnly), covered: summaries(covered)
  };
}

function summaries(map) {
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, summary]) => ({
    key, title: summary.title,
    ...Object.fromEntries(Object.entries(summary).filter(([name]) => name !== "title").map(([name, values]) => [name, [...values].sort()]))
  }));
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
  summary.title = [summary.title, theme.title].sort()[0];
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

function holidayContentFor(keys, entries) {
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
