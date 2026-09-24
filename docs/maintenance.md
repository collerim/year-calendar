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

## Health diagnostics

- Provider `complete` means the cache records successful requests for both providers.
  Partial requests, cache errors, or unavailable request statistics produce `degraded`
  with reasons. Zero successful responses from either provider, absent provider data,
  uncovered ranges, or malformed cache candidate lists produce `failed` and block the daily check.
  `generatedAt` and source statistics describe the cache, not a live API probe.
- Content `degraded` means uncovered country/title identities or legacy-only entries;
  counts and sorted details are available in coverage JSON and the render summary.
  Content `failed` means provider/cache integrity prevented a trustworthy assessment,
  not proof of missing copy. No holiday within a valid window is not a content failure.
- Render `complete` is written after validating PNG output (including reused archives).
  Browser, output, and preflight errors write `failed` plus the error to the current
  render summary. Failures before rendering are reported by the failing workflow step;
  refresh exceptions also write `debug-action/provider-refresh.json`.
- `contentSource: generic` includes the renderer's existing heuristic/provider-metadata
  descriptions and supplied fallback copy when structured/legacy copy is unavailable.
  This metadata does not change captions, descriptions, ranking, or visual output.
- Refresh behavior remains conservative: a sufficiently covering existing cache is
  reused without fetching; attempted strict refresh failures still fail operationally.
  No new outage-to-stale-cache policy or unbounded cache age exception is introduced.

## Persistent content backlog

The versioned `data/holiday-content-backlog.json` is the durable maintenance list;
artifacts are convenient snapshots, not its only storage. No Issues automation is used.

```bash
npm run content:backlog
# Fold all successfully fetched future scan caches into the same backlog.
npm run content:backlog -- --cache-dir tmp/holiday-content-scan
# Isolated inspection of a particular cache; observation date defaults to Shanghai today.
npm run content:backlog -- --cache ./tmp-cache.js --backlog tmp/backlog.json --date 2026-09-20
```

- Identity is normalized country code plus provider title, matching coverage tooling.
  Multiple providers and occurrences merge into sorted arrays. New titles or country
  changes are new identities; no fuzzy matching guesses that holidays are equivalent.
- `firstSeen` and `lastSeen` are dates on which an entry was observed by maintenance,
  including covered observations. `dates` retains known occurrence dates. Scheduled
  runs use `--meaningful-only`: a change to `lastSeen` alone goes into
  `tmp/holiday-content-observation.json` and the uploaded artifact, while the tracked
  backlog remains unchanged. Its `lastSeen` is therefore the most recent observation
  persisted with a material change. Manual runs without that flag still persist every
  observation. Repeating the same observation is byte-stable; changing API order
  does not change output.
- Status is `missing`, `legacy-only`, or `resolved`. Only an observed structured match
  resolves a tracked entry; absent holidays remain unchanged as windows roll forward.
  Resolved entries keep `resolvedOn`, and missing content on a later observation reopens
  them. If aliases disagree, missing/legacy status takes precedence over resolution.
- Every input cache must have complete provider statistics and valid coverage before
  any write. Partial/failed providers leave the previous file untouched and fail the
  maintenance task; this is not interpreted as a new content gap or a resolution.
  Writes use a temporary file followed by rename. Old observation dates are rejected.
- `Maintain Holiday Content Backlog` runs independently each day, refreshes the cache
  when needed, and commits the backlog only for new gaps, status changes, or other
  material changes. Scan runs update it after a successful
  audit. Their shared concurrency group serializes backlog writers. Their failures
  are visible in Actions and do not gate wallpaper rendering.
- Clear stale files from a manually reused scan directory before using `--cache-dir`;
  every matching `holiday-cache-*.js` is assessed, including previously scanned windows.
  A holiday newly covered outside all retained windows remains open until observed
  again; use an older scan cache to verify and resolve it sooner.
- Coverage reflects the provider candidates retained by the existing cache builder,
  not a new claim that every raw provider response is retained. Strict maintenance
  audits and content validation remain separate from rendering availability.
