# Year Calendar Wallpaper

An automated year-calendar wallpaper generator for iPhone Air. The project builds a dark illustrated calendar wallpaper every day and picks the most visually interesting holiday or cultural observance for that date.

GitHub Actions handles the routine work: refreshing the rolling holiday cache, rendering today's wallpaper, generating the next 7 days, and keeping wallpaper output plus motif history in the generated archive branch.

## How It Works

The daily theme comes from a ranked list of candidates:

- public holidays from Nager.Date
- holidays from OpenHolidays
- curated cultural and international observances
- seasonal fallback themes when no suitable holiday is available

Holiday names, display labels, and short Chinese descriptions are stored in the local content database so the rendered text stays consistent and readable.

The visual system uses reusable motif rules instead of hand-drawing every holiday. Each theme selects a motif, palette, and semantic ornaments, then renders the final PNG through the canvas-based wallpaper renderer.

## Automation

- `refresh-holidays` keeps `data/holiday-cache.js` updated as a rolling future window.
- `render` creates `output/today.png`, archives the next 7 days, and saves discarded candidate drafts.
- Generated image output is ignored on `main`.
- Current and archived wallpaper output, render summaries, discarded drafts, and motif history are kept on the `generated-wallpapers` branch, which is the GitHub Pages publishing branch.

## Local Commands

```bash
npm test
npm run refresh-holidays
npm run render
npm run content:validate
npm run content:gaps:check
```

Useful content-maintenance commands:

```bash
npm run content:gaps -- --limit 50
npm run content:scan -- --start YYYY-MM-DD --windows 4 --report-json holiday-content-coverage.json
```

For the maintainer-oriented checklist, see [docs/maintenance.md](docs/maintenance.md).

### Content Coverage Windows

Daily generation strictly checks today through today + 7 days, inclusive (8 dates).
`render-window.js` defines the lookahead shared by rendering and coverage checking.
The workflow pins one Shanghai calendar date for both steps. Cache refresh retains
its 90-day horizon and 14-day refresh threshold, with the render lookahead as a minimum.

```bash
# Strict check for the render window; omit --date to use today in Shanghai.
npm run content:gaps:render -- --date 2026-09-17
# General inclusive date-range check.
npm run content:gaps:check -- --start-date 2026-09-17 --end-date 2026-09-24
# Report gaps across the complete cache without failing on content gaps.
npm run content:gaps
# Strict full-cache check remains available for content maintenance.
npm run content:gaps:check
```

The daily workflow also reports full-cache gaps. Provider-data failures remain
fatal; a holiday-free render window is valid when the complete cache has provider
data. Requested ranges outside the cache fail instead of checking partial data.
Invalid dates, reversed ranges, and combining `--render-window` with explicit
date bounds are rejected. A single explicit bound defaults the other to the
cache boundary. `--date` is only accepted with `--render-window`.

## Notes

Chinese solar terms are intentionally not used as wallpaper themes. The project focuses on holidays, cultural observances, and fallback seasonal moods.
