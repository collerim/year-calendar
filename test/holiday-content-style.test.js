import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

await import("../data/holiday-content.js");
await import("../holiday-intro-rules.js");

const entries = globalThis.YearCalendarHolidayContent.entries;
const fallbackSource = fs.readFileSync(new URL("../holiday-intro-rules.js", import.meta.url), "utf8");

// The wallpaper draws one description line at 23px and shrinks it to fit
// 1040px, so 45 full-width characters is the budget that keeps the text at
// full size. Half-width characters count as half.
function displayWidth(text) {
  const FULL_WIDTH = /[\u1100-\u115f\u2e80-\ua4cf\ua960-\ua97f\uac00-\ud7ff\uf900-\ufaff\ufe10-\ufe19\ufe30-\ufe6f\uff00-\uff60\uffe0-\uffe6]/;
  return [...text].reduce((total, char) => total + (FULL_WIDTH.test(char) ? 1 : 0.5), 0);
}

const FILLER = /这类|通常|一般来说|常伴随|提醒人们|往往/;

test("every holiday description fits the 45-character wallpaper budget", () => {
  const over = entries
    .filter((entry) => displayWidth(entry.description) > 45)
    .map((entry) => `${entry.title} (${displayWidth(entry.description)})`);
  assert.deepEqual(over, []);
});

test("no holiday description uses a filler phrase", () => {
  assert.deepEqual(entries.filter((entry) => FILLER.test(entry.description)).map((entry) => entry.title), []);
});

test("no holiday description repeats a foreign name the title line already shows", () => {
  assert.deepEqual(entries.filter((entry) => /[A-Za-z]{2,}/.test(entry.description)).map((entry) => entry.title), []);
});

test("no two holiday entries share one description", () => {
  const seen = new Map();
  const duplicates = [];
  for (const entry of entries) {
    if (seen.has(entry.description)) duplicates.push(`${seen.get(entry.description)} / ${entry.title}`);
    else seen.set(entry.description, entry.title);
  }
  assert.deepEqual(duplicates, []);
});

test("no holiday description reuses a fallback template sentence", () => {
  assert.deepEqual(entries.filter((entry) => fallbackSource.includes(entry.description)).map((entry) => entry.title), []);
});
