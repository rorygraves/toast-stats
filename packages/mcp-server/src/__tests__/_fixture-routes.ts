/**
 * The canonical CDN-path → committed-fixture-filename map shared across the
 * mcp-server test suites. Both the in-process fixture `fetch` stub
 * ({@link makeFixtureFetch}) and the offline stdio smoke's localhost HTTP server
 * route off this single source so the two transports can't drift.
 */
export const FIXTURE_ROUTES: Record<string, string> = {
  '/v1/latest.json': 'latest.json',
  '/v1/dates.json': 'dates.json',
  '/config/district-snapshot-index.json': 'district-snapshot-index.json',
  '/config/club-index.json': 'club-index.json',
  '/v1/rankings.json': 'v1-rankings.json',
  '/snapshots/2026-05-31/all-districts-rankings.json':
    'dated-all-districts-rankings.json',
  '/snapshots/2026-05-31/district_61.json': 'district-snapshot.json',
  '/time-series/district_61/2025-2026.json': 'time-series.json',
}
