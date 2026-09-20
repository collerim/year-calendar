import { parseDateKey } from "./render-window.js";

export function updateBacklog(previous, reports, observedOn) {
  parseDateKey(observedOn);
  if (previous.version !== 1 || !Array.isArray(previous.entries)) throw new Error("Unsupported backlog format");
  if (!reports.length || reports.some(report => report.providers.status !== "complete")) {
    const reasons = reports.flatMap(report => [...(report.providers.issues || []), ...(report.providers.warnings || [])]);
    throw new Error(`Backlog unchanged: complete provider data is required for every window. ${reasons.join("; ")}`);
  }
  const entries = new Map(previous.entries.map(entry => [entry.key, { ...entry }]));
  const observations = new Map();
  // Missing outranks legacy, which outranks covered, if provider aliases disagree.
  for (const [field, status, priority] of [["covered", "resolved", 0], ["legacyOnly", "legacy-only", 1], ["gaps", "missing", 2]]) {
    for (const report of reports) {
      for (const item of report[field]) {
        const old = observations.get(item.key);
        observations.set(item.key, {
          ...item,
          title: [old?.title, item.title].filter(Boolean).sort()[0],
          status: old && old.priority > priority ? old.status : status,
          priority: Math.max(priority, old?.priority ?? 0),
          providers: union(old?.providers, item.providers),
          countries: union(old?.countries, item.countries),
          dates: union(old?.dates, item.dates)
        });
      }
    }
  }
  for (const [key, item] of observations) {
    const old = entries.get(key);
    if (!old && item.status === "resolved") continue;
    if (old && observedOn < old.lastSeen) throw new Error(`Observation predates lastSeen for ${key}`);
    const entry = {
      key, title: item.title,
      countries: union(old?.countries, item.countries),
      providers: union(old?.providers, item.providers),
      firstSeen: old?.firstSeen || observedOn,
      lastSeen: observedOn,
      dates: union(old?.dates, item.dates),
      status: item.status
    };
    if (item.status === "resolved") entry.resolvedOn = old?.resolvedOn || observedOn;
    entries.set(key, entry);
  }
  return { version: 1, entries: [...entries.values()].sort((a, b) => a.key.localeCompare(b.key)) };
}

function union(left = [], right = []) {
  return [...new Set([...left, ...right])].sort();
}
