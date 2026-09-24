import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { analyzeHolidayCoverage } from "./holiday-coverage.js";
import { updateBacklog } from "./holiday-content-backlog.js";
import { renderWindow } from "./render-window.js";

globalThis.window = globalThis;
const args = process.argv.slice(2);
function value(flag, fallback) {
  const index = args.indexOf(flag);
  if (index < 0) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return args[index + 1];
}
const file = value("--backlog", "data/holiday-content-backlog.json");
const observedOn = value("--date", renderWindow().start);
const reportJson = value("--report-json");
const meaningfulOnly = args.includes("--meaningful-only");
const cacheDir = value("--cache-dir");
if (cacheDir && args.includes("--cache")) throw new Error("Use --cache or --cache-dir, not both");
const cacheFiles = cacheDir
  ? fs.readdirSync(cacheDir).filter(name => /^holiday-cache-.*\.js$/.test(name)).sort().map(name => path.join(cacheDir, name))
  : [value("--cache", "data/holiday-cache.js")];
await import("./data/holiday-content.js");
await import("./data/holiday-intros.js");
const reports = [];
for (const cacheFile of cacheFiles) {
  delete globalThis.YearCalendarHolidayCache;
  await import(pathToFileURL(path.resolve(cacheFile)).href);
  const cache = globalThis.YearCalendarHolidayCache;
  if (!cache) throw new Error(`Missing holiday cache: ${cacheFile}`);
  reports.push(analyzeHolidayCoverage(cache, globalThis.YearCalendarHolidayContent, globalThis.YearCalendarHolidayIntros));
}
const previous = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { version: 1, entries: [] };
const next = updateBacklog(previous, reports, observedOn);
const serialized = `${JSON.stringify(next, null, 2)}\n`;
if (reportJson) {
  fs.mkdirSync(path.dirname(reportJson), { recursive: true });
  fs.writeFileSync(reportJson, serialized);
}
const materialEntries = (backlog) => backlog.entries.map(({ lastSeen, ...entry }) => entry);
const observationOnly = meaningfulOnly && JSON.stringify(materialEntries(previous)) === JSON.stringify(materialEntries(next));
if (!observationOnly && (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== serialized)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, serialized);
  fs.renameSync(`${file}.tmp`, file);
}
const counts = Object.fromEntries(["missing", "legacy-only", "resolved"].map(status => [status, next.entries.filter(entry => entry.status === status).length]));
console.log(`Content backlog: ${JSON.stringify(counts)} (${file}${observationOnly ? "; observation-only changes were not persisted" : ""})`);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Holiday content backlog\n\n${Object.entries(counts).map(([status, count]) => `- ${status}: ${count}`).join("\n")}\n\nSee \`${file}\` in the repository or workflow artifact.\n`);
}
