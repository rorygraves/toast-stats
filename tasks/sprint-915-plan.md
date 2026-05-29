# Sprint 4 (#915) — Harden Lighthouse/CLS & external-dependency gates

Epic #917. Scope handed down by Sprint 1 deep-dive
(`docs/investigations/test-flakiness-deep-dive-2026-05-28.md` §6):

## Deliverables

### V10 — Decouple the Lighthouse CLS gate from CDN reachability

`lighthouse-ci.yml` builds the frontend with **no** `VITE_CDN_BASE_URL`, so the
localhost preview fetches the live prod CDN (`cdn.taverns.red`) during the
3-run Lighthouse pass. A CDN flake → the `/` page renders the error state →
CLS measured against a non-loaded layout → gate fails on luck (a real 0.206 was
caught once, #825/L125). The gate is correct; its **input is non-deterministic**.

Fix: serve **committed offline CDN fixtures** so the page reaches the loaded
state deterministically with zero network dependency.

- `frontend/lighthouse/cdn-fixtures/` — schema-valid `v1/rankings.json` (+
  `v1/latest.json`, `v1/dates.json`, `config/district-snapshot-index.json`,
  a `snapshots/<date>/competitive-awards.json`). Enough rankings rows for a
  representative loaded-state height.
- `scripts/lighthouse-cdn-server.mjs` — static server on :4173 that serves
  `frontend/dist` for the app and the fixtures under the CDN paths; logs
  `ready` for `startServerReadyPattern`.
- `lighthouserc.js` — `startServerCommand` → the node server.
- `.github/workflows/lighthouse-ci.yml` — build step sets
  `VITE_CDN_BASE_URL=http://localhost:4173` so the app fetches fixtures
  same-origin (offline).
- Guard: a vitest fixture-validity test (typed import + runtime field check)
  so a schema drift breaks loudly, not silently mid-Lighthouse-run.

### V9 (L125) — error/empty-state CLS coverage

The renderShell refactor (#826/#488/#861) already wraps loading + both error
branches in the same `.districts-page-root > .districts-page` shell with the
hero-search skeleton + KPI strip reserved. But only the **loading** slot is
tested (`DistrictsPage.responsive.test.tsx:237`). Add error + no-snapshot tests
asserting the same reserved slots + KPI demotion, so a CDN flake can't render an
unverified terminal state.

## Out of scope

- V11 (L81 perf-deferral guards) — already live & correct, keep.
- Sprint 5 lock-in (stress sentinel, rules/lessons, zero-flake proof).

## Verification

- V10 live proof: the PR's own Lighthouse CI job runs green deterministically.
- V9 live proof: Playwright on the PR preview drives the error state (abort the
  CDN request) and asserts KPI-strip / hero-skeleton bounding boxes don't shift
  (Lesson 134 — bounding box, not toBeVisible). Both engines.
