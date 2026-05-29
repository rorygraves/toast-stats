# Lighthouse CDN fixtures (#915, epic #917 Sprint 4 — V10)

Committed, offline snapshot of the CDN responses the landing page `/` fetches on
cold load. `scripts/lighthouse-cdn-server.mjs` serves these alongside the built
SPA so the Lighthouse CI gate (`lighthouserc.js` + `.github/workflows/lighthouse-ci.yml`)
measures CLS against a **deterministic LOADED state** instead of whatever
terminal state a flaky live-CDN fetch happened to produce (Lesson 125, deep-dive
§3 V10).

## What `/` fetches on cold load (all covered here)

| Path                                            | Fixture                                        | Role                                       |
| ----------------------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| `/config/district-snapshot-index.json`          | `config/district-snapshot-index.json`          | snapshot-date index                        |
| `/v1/rankings.json`                             | `v1/rankings.json`                             | the rankings table — the loaded-state gate |
| `/v1/latest.json`                               | `v1/latest.json`                               | manifest (latest snapshot date)            |
| `/snapshots/2025-11-22/competitive-awards.json` | `snapshots/2025-11-22/competitive-awards.json` | above-the-fold awards section              |

`v1/dates.json` backs the date selector. The fixture-validity guard
(`frontend/src/__tests__/lighthouse-cdn-fixtures.test.ts`) asserts these stay
schema-valid so drift breaks loudly in CI, not silently mid-gate.

## Intentionally-empty snapshot index — do not "populate to make it realistic"

`district-snapshot-index.json` is `{}` **on purpose**. An empty index keeps the
page's effective rankings date `undefined`, so the rankings query stays on
`fetchCdnRankings()` → `/v1/rankings.json` (fixtured) and never takes the
per-date path `fetchCdnRankingsForDate()` → `/snapshots/<date>/all-districts-rankings.json`,
which has **no fixture and would 404**. Adding a date here flips the page onto
that unfixtured path. If you ever need it populated, add the matching
`all-districts-rankings.json` fixture too.

## Running the gate locally

The served app only reads these fixtures if the build points at the fixture
server's origin:

```bash
VITE_CDN_BASE_URL=http://localhost:4173 npm run build:frontend
npx lhci autorun   # lighthouserc.js starts scripts/lighthouse-cdn-server.mjs
```

A default-built `dist/` (no env var) fetches the real prod CDN and ignores these
fixtures. CI sets the env var on the build step.

## Regenerating

The fixtures are plain data, safe to hand-edit; keep them schema-valid (the
guard test will tell you if not). The date `2025-11-22` is arbitrary but must
match across `rankings.json`, `latest.json`, `dates.json`, and the
`snapshots/<date>/` directory name.
