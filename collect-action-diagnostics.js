import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const outputDir = "debug-action";
fs.mkdirSync(outputDir, { recursive: true });

const summary = {
  generatedAt: new Date().toISOString(),
  platform: {
    node: process.version,
    platform: process.platform,
    release: os.release()
  },
  gitHub: {
    workflow: process.env.GITHUB_WORKFLOW || "",
    job: process.env.GITHUB_JOB || "",
    runId: process.env.GITHUB_RUN_ID || "",
    ref: process.env.GITHUB_REF || "",
    sha: process.env.GITHUB_SHA || ""
  },
  files: {
    output: listFiles("output", 80),
    drafts: listFiles("drafts", 80),
    debugRender: listFiles("debug-render", 80),
    holidayContentScan: listFiles(path.join("tmp", "holiday-content-scan"), 40)
  },
  holidayCache: readCacheSummary(path.join("data", "holiday-cache.js")),
  themeHistory: readJsonSummary(path.join("data", "theme-history.json"))
};

fs.writeFileSync(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
copyIfExists(path.join("data", "holiday-cache.js"), path.join(outputDir, "holiday-cache.js"));
copyIfExists(path.join("data", "theme-history.json"), path.join(outputDir, "theme-history.json"));
copyIfExists(path.join("output", "render-summary.json"), path.join(outputDir, "render-summary.json"));
copyIfExists("tmp/render-coverage.json", path.join(outputDir, "render-coverage.json"));
copyIfExists("index.html", path.join(outputDir, "index.html"));
copyIfExists("package.json", path.join(outputDir, "package.json"));
copyIfExists("holiday-content-coverage.txt", path.join(outputDir, "holiday-content-coverage.txt"));
copyIfExists("holiday-content-coverage.json", path.join(outputDir, "holiday-content-coverage.json"));

console.log(`Action diagnostics written to ${outputDir}`);

function readCacheSummary(filePath) {
  if (!fs.existsSync(filePath)) return { exists: false };
  try {
    const text = fs.readFileSync(filePath, "utf8");
    const match = text.match(/window\.YearCalendarHolidayCache\s*=\s*(\{[\s\S]*\});?\s*$/);
    if (!match) return { exists: true, readable: false };
    const cache = JSON.parse(match[1]);
    const days = cache.days && typeof cache.days === "object" ? Object.keys(cache.days) : [];
    return {
      exists: true,
      readable: true,
      generatedAt: cache.generatedAt || null,
      window: cache.window || null,
      coverage: cache.coverage || null,
      sourceStats: cache.sourceStats || null,
      dayCount: days.length,
      firstDay: days[0] || null,
      lastDay: days[days.length - 1] || null,
      errorCount: Array.isArray(cache.errors) ? cache.errors.length : 0,
      errorSamples: Array.isArray(cache.errors) ? cache.errors.slice(0, 12) : []
    };
  } catch (error) {
    return { exists: true, readable: false, error: error.message };
  }
}

function readJsonSummary(filePath) {
  if (!fs.existsSync(filePath)) return { exists: false };
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      exists: true,
      keys: Object.keys(data),
      updatedAt: data.updatedAt || null,
      dayCount: data.days && typeof data.days === "object" ? Object.keys(data.days).length : null
    };
  } catch (error) {
    return { exists: true, readable: false, error: error.message };
  }
}

function listFiles(root, limit) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  walk(root, files, limit);
  return files;
}

function walk(current, files, limit) {
  if (files.length >= limit) return;
  const entries = fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (files.length >= limit) break;
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files, limit);
    } else {
      const stats = fs.statSync(fullPath);
      files.push({ path: fullPath, bytes: stats.size });
    }
  }
}

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}
