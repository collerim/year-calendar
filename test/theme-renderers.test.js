import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const rendererSource = fs.readFileSync(new URL("../theme-renderers.js", import.meta.url), "utf8");
const holidayCacheSource = fs.readFileSync(new URL("../data/holiday-cache.js", import.meta.url), "utf8");

function loadRenderer() {
  const context = vm.createContext({
    countryNameZh: (source) => source.zhName || source.countryName || "当地",
    holidayTypeLabelFromSource: () => "公众节日",
    hasTag: () => false
  });
  vm.runInContext(rendererSource, context, { filename: "theme-renderers.js" });
  return context;
}

function loadHolidayCache() {
  const context = vm.createContext({});
  context.window = context;
  vm.runInContext(holidayCacheSource, context, { filename: "data/holiday-cache.js" });
  return context.YearCalendarHolidayCache;
}

test("country meta line prefixes valid country names with emoji flags", () => {
  const renderer = loadRenderer();

  assert.equal(
    renderer.themeMetaLine({
      source: {
        countryCode: "US",
        countryName: "United States",
        zhName: "美国"
      }
    }),
    "🇺🇸 美国 · 公众节日"
  );
});

test("country meta line skips flags for international observances", () => {
  const renderer = loadRenderer();

  assert.equal(
    renderer.themeMetaLine({
      source: {
        countryCode: "INTL",
        countryName: "International",
        zhName: "国际"
      }
    }),
    "国际 · 公众节日"
  );
});

test("all current cached country codes can render emoji flags", () => {
  const renderer = loadRenderer();
  const cache = loadHolidayCache();
  const codes = new Set();

  for (const themes of Object.values(cache.days || {})) {
    for (const theme of themes) {
      const code = theme.source?.countryCode;
      if (code) codes.add(code);
    }
  }

  const nonCountryCodes = [...codes].filter((code) => !/^[A-Z]{2}$/.test(code)).sort();
  assert.deepEqual(nonCountryCodes, ["INTL"]);

  for (const code of codes) {
    if (code === "INTL") continue;
    assert.equal(Array.from(renderer.countryFlagEmoji(code)).length, 2, code);
  }
});
