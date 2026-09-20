process.env.TZ = "Asia/Shanghai";

import puppeteer from "puppeteer";
import fs from "fs";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";
import { analyzeHolidayCoverage } from "./holiday-coverage.js";
import { RENDER_LOOKAHEAD_DAYS as LOOKAHEAD_DAYS, renderWindow } from "./render-window.js";

const OUTPUT_ROOT = "output";
const DRAFT_ROOT = "drafts";
const DATA_ROOT = "data";
const THEME_HISTORY_FILE = process.env.THEME_HISTORY_FILE || path.join(DATA_ROOT, "theme-history.json");
const TODAY_OUTPUT = path.join(OUTPUT_ROOT, "today.png");
const RENDER_SUMMARY_FILE = path.join(OUTPUT_ROOT, "render-summary.json");
const HTML_ENTRY = path.resolve("index.html");
const HTML_URL = pathToFileURL(HTML_ENTRY).href;
const PUPPETEER_PROFILE = path.join(os.tmpdir(), "year-calendar-puppeteer-profile");
const DIVERSITY_LOOKBACK_DAYS = 10;
const HISTORY_KEEP_DAYS = 45;
const VIEWPORT = {
  width: 1170,
  height: 2532,
  deviceScaleFactor: 2
};
const EXPECTED_PNG = {
  width: VIEWPORT.width * VIEWPORT.deviceScaleFactor,
  height: VIEWPORT.height * VIEWPORT.deviceScaleFactor,
  minBytes: 200000
};
function browserExecutablePath() {
  const explicitPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (explicitPath) {
    if (!fs.existsSync(explicitPath)) {
      throw new Error(`PUPPETEER_EXECUTABLE_PATH does not exist: ${explicitPath}`);
    }
    return explicitPath;
  }
  return null;
}

function parseArgs(argv) {
  const options = {
    force: argv.includes("--force"),
    date: null
  };

  const dateIndex = argv.indexOf("--date");
  if (dateIndex !== -1) {
    options.date = argv[dateIndex + 1];
  }

  return options;
}

function dateFromKey(key) {
  const match = key?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function pathPartsForDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return {
    year,
    month,
    day,
    yearFolder: `${year}`,
    monthFolder: `${year}.${month}`,
    fileName: `${year}.${month}.${day}.png`
  };
}

function archivePathForDate(date) {
  const parts = pathPartsForDate(date);
  return path.join(OUTPUT_ROOT, parts.yearFolder, parts.monthFolder, parts.fileName);
}

function draftFolderForDate(date) {
  const parts = pathPartsForDate(date);
  return path.join(DRAFT_ROOT, parts.yearFolder, parts.monthFolder, `${parts.year}.${parts.month}.${parts.day}`);
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "theme";
}

function getBaseDate(options) {
  if (options.date) {
    const parsed = dateFromKey(options.date);
    if (!parsed) {
      throw new Error(`Invalid --date value: ${options.date}`);
    }
    return parsed;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function readThemeHistory() {
  if (!fs.existsSync(THEME_HISTORY_FILE)) {
    return { version: 1, updatedAt: null, days: {} };
  }

  try {
    const data = JSON.parse(fs.readFileSync(THEME_HISTORY_FILE, "utf8"));
    return {
      version: 1,
      updatedAt: data.updatedAt || null,
      days: data.days && typeof data.days === "object" ? data.days : {}
    };
  } catch {
    return { version: 1, updatedAt: null, days: {} };
  }
}

function recentThemeEntriesForDate(history, date) {
  const entries = [];
  for (let offset = DIVERSITY_LOOKBACK_DAYS; offset >= 1; offset--) {
    const entry = history.days[dateKey(addDays(date, -offset))];
    if (entry) entries.push(entry);
  }
  return entries;
}

function rememberTheme(history, date, theme) {
  history.days[dateKey(date)] = {
    title: theme.title,
    motif: theme.motif,
    gradient: Array.isArray(theme.gradient) ? theme.gradient : [],
    accent: theme.accent || "",
    secondary: theme.secondary || "",
    holidayFamily: theme.holidayFamily || "",
    popularityTier: theme.popularityTier || "",
    scopeTier: theme.scopeTier || "",
    tags: theme.tags || [],
    source: theme.source ? {
      provider: theme.source.provider || "",
      countryCode: theme.source.countryCode || "",
      countryName: theme.source.countryName || "",
      typeLabels: Array.isArray(theme.source.typeLabels) ? theme.source.typeLabels : [],
      nationwide: theme.source.nationwide,
      subdivisions: Array.isArray(theme.source.subdivisions) ? theme.source.subdivisions : []
    } : null
  };
}

function trimThemeHistory(history, baseDate) {
  const minDate = addDays(baseDate, -HISTORY_KEEP_DAYS);
  const maxDate = addDays(baseDate, LOOKAHEAD_DAYS);
  for (const key of Object.keys(history.days)) {
    const date = dateFromKey(key);
    if (!date || date < minDate || date > maxDate) {
      delete history.days[key];
    }
  }
  history.updatedAt = new Date().toISOString();
}

function writeThemeHistory(history, baseDate) {
  trimThemeHistory(history, baseDate);
  fs.mkdirSync(path.dirname(THEME_HISTORY_FILE), { recursive: true });
  fs.writeFileSync(THEME_HISTORY_FILE, `${JSON.stringify(history, null, 2)}\n`);
}

function readPngSize(filePath) {
  const header = Buffer.alloc(24);
  const fd = fs.openSync(filePath, "r");
  try {
    fs.readSync(fd, header, 0, header.length, 0);
  } finally {
    fs.closeSync(fd);
  }

  if (header.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${filePath} is not a PNG file`);
  }

  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20)
  };
}

function assertWallpaperOutput(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} was not created: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  if (stats.size < EXPECTED_PNG.minBytes) {
    throw new Error(`${label} is unexpectedly small: ${stats.size} bytes`);
  }

  const size = readPngSize(filePath);
  if (size.width !== EXPECTED_PNG.width || size.height !== EXPECTED_PNG.height) {
    throw new Error(`${label} has wrong dimensions: ${size.width}x${size.height}, expected ${EXPECTED_PNG.width}x${EXPECTED_PNG.height}`);
  }
}

function assertRenderInfo(info, label) {
  if (!info || typeof info !== "object") {
    throw new Error(`${label} render info is missing`);
  }
  if (!info.selectedTheme || typeof info.selectedTheme !== "object") {
    throw new Error(`${label} selected theme is missing`);
  }
  if (!Array.isArray(info.candidates) || info.candidates.length === 0) {
    throw new Error(`${label} render candidates are missing`);
  }
  if (!Number.isInteger(info.selectedRank)) {
    throw new Error(`${label} selected rank is invalid`);
  }
  if (!info.candidates.some((candidate) => candidate.rank === info.selectedRank)) {
    throw new Error(`${label} selected rank is not present in candidates`);
  }
}

async function writeDebugScreenshot(page, date, reason) {
  const debugPath = path.join("debug-render", `${dateKey(date)}-${slug(reason)}.png`);
  try {
    fs.mkdirSync(path.dirname(debugPath), { recursive: true });
    await page.screenshot({ path: debugPath, fullPage: false });
    console.error(`Debug screenshot saved: ${debugPath}`);
  } catch (error) {
    console.error(`Could not save debug screenshot: ${error.message}`);
  }
}

async function renderWallpaper(page, date, themeRank, outputPath, avoidMotifs = [], recentThemes = []) {
  const key = dateKey(date);
  const params = new URLSearchParams({
    date: key,
    themeRank: String(themeRank)
  });
  if (avoidMotifs.length > 0) {
    params.set("avoidMotifs", avoidMotifs.join(","));
  }
  if (recentThemes.length > 0) {
    params.set("recentThemes", JSON.stringify(recentThemes));
  }
  const url = `${HTML_URL}?${params.toString()}`;

  try {
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    await page.waitForSelector("img", { timeout: 15000 });
    await page.waitForFunction(() => {
      const img = document.querySelector("img");
      return Boolean(img && img.complete && img.naturalWidth > 0);
    }, { timeout: 15000 });
  } catch (error) {
    await writeDebugScreenshot(page, date, "render-timeout");
    throw error;
  }

  const dataUrl = await page.$eval("img", (img, expected) => {
    const canvas = document.createElement("canvas");
    canvas.width = expected.width;
    canvas.height = expected.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, expected.width, expected.height);
    return canvas.toDataURL("image/png");
  }, EXPECTED_PNG);
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) {
    throw new Error(`Rendered ${key} wallpaper did not expose a PNG data URL`);
  }
  const buffer = Buffer.from(match[1], "base64");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  assertWallpaperOutput(outputPath, `${key} wallpaper`);

  const info = await page.evaluate(() => window.__YEAR_CALENDAR_RENDER_INFO);
  try {
    assertRenderInfo(info, `${key} wallpaper`);
  } catch (error) {
    await writeDebugScreenshot(page, date, "render-info");
    throw error;
  }
  return info;
}

async function renderDiscardedCandidates(page, date, info, options, avoidMotifs, recentThemes) {
  const discarded = info.candidates.filter((candidate) => candidate.rank !== info.selectedRank);
  if (discarded.length === 0) return;

  const folder = draftFolderForDate(date);
  fs.mkdirSync(folder, { recursive: true });

  for (const candidate of discarded) {
    const fileName = `rank-${String(candidate.rank + 1).padStart(2, "0")}-${slug(candidate.theme.title)}.png`;
    const outputPath = path.join(folder, fileName);
    if (!options.force && fs.existsSync(outputPath)) continue;
    await renderWallpaper(page, date, candidate.rank, outputPath, avoidMotifs, recentThemes);
  }
}

function datesToEnsure(baseDate) {
  return Array.from({ length: LOOKAHEAD_DAYS + 1 }, (_, index) => addDays(baseDate, index));
}

function isSameDate(left, right) {
  return dateKey(left) === dateKey(right);
}

const options = parseArgs(process.argv.slice(2));
const baseDate = getBaseDate(options);
const dates = datesToEnsure(baseDate);

fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
fs.mkdirSync(PUPPETEER_PROFILE, { recursive: true });

let browser;
let coverage;
try {
  globalThis.window = globalThis;
  await import("./data/holiday-cache.js");
  await import("./data/holiday-content.js");
  await import("./data/holiday-intros.js");
  coverage = analyzeHolidayCoverage(globalThis.YearCalendarHolidayCache || {}, globalThis.YearCalendarHolidayContent || {}, globalThis.YearCalendarHolidayIntros || {}, renderWindow(dateKey(baseDate)));
  if (coverage.providers.status === "failed") throw new Error(coverage.providers.issues.join("; "));
  const executablePath = browserExecutablePath();
  browser = await puppeteer.launch({
    ...(executablePath ? { executablePath } : {}),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-crash-reporter",
      "--disable-crashpad",
      `--user-data-dir=${PUPPETEER_PROFILE}`
    ]
  });

  const generated = [];
  const skipped = [];
  const themeHistory = readThemeHistory();

  try {
    const page = await browser.newPage();
    await page.setDefaultTimeout(15000);
    await page.setViewport(VIEWPORT);

    for (const date of dates) {
      const archivePath = archivePathForDate(date);
      const shouldRender = options.force || isSameDate(date, baseDate) || !fs.existsSync(archivePath);

      if (!shouldRender) {
        assertWallpaperOutput(archivePath, `${dateKey(date)} existing wallpaper`);
        skipped.push(dateKey(date));
        continue;
      }

      const recentThemes = recentThemeEntriesForDate(themeHistory, date);
      const avoidMotifs = recentThemes.map((entry) => entry.motif).filter(Boolean);
      const info = await renderWallpaper(page, date, 0, archivePath, avoidMotifs, recentThemes);
      await renderDiscardedCandidates(page, date, info, options, avoidMotifs, recentThemes);
      rememberTheme(themeHistory, date, info.selectedTheme);
      generated.push({
        date: dateKey(date),
        output: archivePath,
        selectedTheme: info.selectedTheme.title,
        selectedMotif: info.selectedTheme.motif,
        contentSource: info.selectedTheme.contentSource,
        selectedScoreBreakdown: info.candidates.find((candidate) => candidate.rank === info.selectedRank)?.scoreBreakdown || null,
        discardedCount: info.candidates.length - 1
      });
    }
  } finally {
    await browser.close();
  }

  const todayArchive = archivePathForDate(baseDate);
  if (fs.existsSync(todayArchive)) {
    fs.copyFileSync(todayArchive, TODAY_OUTPUT);
  }

  writeThemeHistory(themeHistory, baseDate);
  assertWallpaperOutput(TODAY_OUTPUT, "today wallpaper");

  const renderSummary = {
    generatedAt: new Date().toISOString(),
    baseDate: dateKey(baseDate),
    ensuredThrough: dateKey(addDays(baseDate, LOOKAHEAD_DAYS)),
    today: TODAY_OUTPUT,
    generated,
    skipped,
    health: { render: { status: "complete" }, providers: coverage.providers, contentCoverage: coverage.contentCoverage },
    contentGaps: coverage.gaps,
    legacyOnly: coverage.legacyOnly
  };
  fs.writeFileSync(RENDER_SUMMARY_FILE, `${JSON.stringify(renderSummary, null, 2)}\n`);

  console.log("Wallpaper generation complete:");
  console.log(`   base date: ${dateKey(baseDate)}`);
  console.log(`   ensured through: ${dateKey(addDays(baseDate, LOOKAHEAD_DAYS))}`);
  console.log(`   generated: ${generated.length}`);
  for (const item of generated) {
    console.log(`   -> ${item.date}: ${item.selectedTheme} / ${item.selectedMotif} (${item.discardedCount} discarded)`);
  }
  console.log(`   skipped existing: ${skipped.length}`);
  console.log(`   today: ${TODAY_OUTPUT}`);

} catch (error) {
  fs.writeFileSync(RENDER_SUMMARY_FILE, `${JSON.stringify({
    generatedAt: new Date().toISOString(), baseDate: dateKey(baseDate),
    health: {
      render: { status: "failed", error: error.message },
      providers: coverage?.providers || { status: "failed", issues: [error.message] },
      contentCoverage: coverage?.contentCoverage || { status: "failed" }
    }
  }, null, 2)}\n`);
  throw error;
}
