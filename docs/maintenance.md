# Maintenance Checklist

This document collects the operational notes for keeping the wallpaper automation healthy. The README stays focused on what the project is; this file is for upkeep.

## Daily Wallpaper Output

- `output/` is generated locally by render commands but is ignored on `main`.
- `npm run render` generates today's wallpaper, the next 7 days, archived output images, discarded draft candidates, and `output/render-summary.json`.
- The gold payday marker ends after July 25, 2026; later 25th days use the ordinary past/today/future styling.
- `data/theme-history.json` tracks recent motif choices so generated wallpapers avoid repeating the same visual language too often. It is ignored on `main` and persisted on `generated-wallpapers`.
- Current and archived wallpaper output is kept on the `generated-wallpapers` branch, which should be configured as the GitHub Pages publishing branch.

## Holiday Cache

- `data/holiday-cache.js` is refreshed as a rolling future holiday window.
- Holiday data currently comes from Nager.Date, OpenHolidays, and curated cultural observances.
- Run this for the normal refresh path:

```bash
npm run refresh-holidays
```

- To generate a future temporary cache for content review:

```bash
npm run refresh-holidays -- --date YYYY-MM-DD --output ./tmp-cache.js --strict-providers
```

## Holiday Content Database

- `data/holiday-content.js` stores structured holiday names, display types, and short Chinese descriptions.
- Use gaps output to find entries that need better copy:

```bash
npm run content:gaps -- --limit 50
```

- Use `--legacy-only` when migrating old intro entries.
- Use `--cache ./tmp-cache.js` after generating a future window.

## Validation

Run these before treating a change as stable:

```bash
npm test
node --check theme-engine.js
node --check theme-ranking-rules.js
node --check theme-selector.js
node --check refresh-holiday-data.js
node --check holiday-cache-builder.js
node --check render.js
npm run content:validate
npm run content:gaps:check
git diff --check
```

`npm run content:validate` checks for empty fields, TODO text, uncovered legacy intro keys, and risky duplicate lookup keys.

`npm run content:gaps:check` is the opt-in strict maintenance gate for the current holiday cache. It fails if provider data is missing, uncovered, or still relying on legacy intros.

Local rendering uses Puppeteer's cached Chrome. If the local cache is missing or corrupted, run `npx puppeteer browsers install chrome`, or set `PUPPETEER_CACHE_DIR` to a clean cache directory. To use a manually installed browser, set `PUPPETEER_EXECUTABLE_PATH` explicitly.

## Coverage Scans

Use this when preparing the next batch of holiday descriptions:

```bash
npm run content:scan -- --start YYYY-MM-DD --windows 4 --report-json holiday-content-coverage.json
```

The scan writes ignored temporary files and reports missing or legacy-only content without overwriting the production cache.

## GitHub Actions

- The daily generation workflow should install Puppeteer's pinned Chrome before rendering.
- The content scan workflow validates the content database, scans future provider windows, and uploads text, JSON, and JS stub artifacts for the next content batch.
- Temporary caches from scans should not be committed.

## Theme Rules

- Chinese solar terms are intentionally not used as wallpaper themes.
- Fallback themes should stay available until holiday coverage is good enough to cover every date naturally.
- `theme-engine.js` owns theme creation and turns fixed/cache/fallback entries into normalized theme candidates.
- `theme-ranking-rules.js` owns shared ranking metadata and tuning knobs: holiday families, popularity/scope tiers, fixed-holiday source metadata, score breakdown helpers, motif substitution safety, and Lab/DeltaE-style gradient similarity.
- `theme-selector.js` owns daily candidate ranking and selection flow, using the shared ranking rules to balance motif freshness, mainstream holiday boosts, recent country/cultural-cluster diversity, holiday-family freshness, and recent background-color diversity.
- `theme-palettes.js` owns theme colors, cultural palettes, and monthly fallback moods.
- `theme-motifs.js` owns motif tags, seasonal motif copy, and fallback motif rotation.
- `theme-renderers.js` owns the shared canvas background, caption, and low-level drawing helpers.
- `motif-renderers.js` owns the large motif dispatcher and main motif drawing functions.
- `ornament-renderers.js` owns semantic ornaments, cultural overlays, and signature glyphs.
- `calendar-layout.js` owns the year calendar model: date math, month geometry, day states, payday markers, and progress placement.
- `calendar-renderer.js` owns drawing that year calendar model onto canvas.
- New motifs should be wired in `theme-motifs.js`, `motif-renderers.js`, and `refresh-holiday-data.js`, then added to fallback rotation if they are suitable for ordinary days.

Daily, test, and refresh workflows use `content:gaps:render`: content gaps and
legacy-only entries are reported without failing, while unavailable provider data
and uncovered cache ranges remain fatal. Full-cache reports run separately.
Use `content:gaps:render -- --fail-on-gaps` for a strict render-window audit.
