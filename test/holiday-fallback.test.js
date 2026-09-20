import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function engine() {
  const context = vm.createContext({});
  vm.runInContext("globalThis.window = globalThis", context);
  for (const file of ["theme-palettes.js", "theme-motifs.js", "theme-ranking-rules.js", "theme-engine.js", "theme-selector.js"]) {
    vm.runInContext(fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), context);
  }
  return context;
}

test("unknown provider holiday retains generic description and selectable candidate", () => {
  const context = engine();
  vm.runInContext(`YearCalendarHolidayCache = { days: { "2026-09-17": [{
    title: "Unseen holiday", caption: "Holiday", motif: "fireworks",
    gradient: ["#111111", "#222222"], accent: "#ffffff", secondary: "#aaaaaa",
    source: { provider: "Nager.Date", countryCode: "US", typeLabels: ["Public"] }
  }] } };`, context);
  const themes = vm.runInContext("candidateThemesForDate(new Date(2026, 8, 17))", context);
  const holiday = themes.find(theme => theme.title === "Unseen holiday");
  assert.match(holiday.description, /Unseen holiday是美国/);
});

test("no holiday candidates still produces seasonal themes", () => {
  const context = engine();
  const themes = vm.runInContext("candidateThemesForDate(new Date(2026, 8, 17))", context);
  assert.ok(themes.length > 0);
  assert.ok(themes.every(theme => theme.description && theme.tags.includes("month-mood")));
});
