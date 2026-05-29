/**
 * Lighthouse CDN fixture validity guard (#915, epic #917 Sprint 4 — V10).
 *
 * The Lighthouse CI gate (`lighthouse-ci.yml` + `lighthouserc.js`) is decoupled
 * from network reachability by serving these committed fixtures from
 * `scripts/lighthouse-cdn-server.mjs` instead of the live CDN — so a CDN flake
 * can no longer push the `/` page into an error state and red the CLS budget on
 * luck (deep-dive §3 V10; Lesson 125).
 *
 * That decoupling is only sound while the fixtures stay schema-valid: if a
 * pipeline/contract change drifts the real CDN shape away from these files, the
 * served page would render an unintended terminal state mid-Lighthouse-run and
 * the gate would silently measure the wrong layout. This guard makes that drift
 * break loudly here (a fast unit test) instead of silently in the gate.
 *
 * The typed imports below are themselves a compile-time contract: `tsc`
 * (run by `build:frontend` in CI) fails if a fixture's shape stops satisfying
 * the CDN response interface. The runtime assertions cover the bits tsc can't
 * see (non-empty rankings, ISO-ish dates, the date the page actually loads).
 */
import { describe, it, expect } from 'vitest'
import type {
  CdnRankingsData,
  CdnManifest,
  CdnDatesIndex,
} from '../services/cdn'

import rankings from '../../lighthouse/cdn-fixtures/v1/rankings.json'
import manifest from '../../lighthouse/cdn-fixtures/v1/latest.json'
import dates from '../../lighthouse/cdn-fixtures/v1/dates.json'

// Compile-time contract: a fixture that drifts from the CDN response shape
// fails `tsc` here before it can ever reach the served Lighthouse build.
const typedRankings: CdnRankingsData = rankings
const typedManifest: CdnManifest = manifest
const typedDates: CdnDatesIndex = dates

describe('Lighthouse CDN fixtures (#915 V10)', () => {
  it('rankings fixture has enough rows for a representative loaded-state layout', () => {
    // The point of the fixture is that `/` reaches the LOADED state, not a
    // collapsed error/empty card — so the CLS budget measures the real table.
    expect(typedRankings.rankings.length).toBeGreaterThanOrEqual(10)
  })

  it('every rankings row carries the fields the table renders', () => {
    for (const row of typedRankings.rankings) {
      expect(typeof row.districtId).toBe('string')
      expect(row.districtId.length).toBeGreaterThan(0)
      expect(typeof row.districtName).toBe('string')
      expect(typeof row.overallRank).toBe('number')
      expect(typeof row.aggregateScore).toBe('number')
      expect(typeof row.paidClubs).toBe('number')
      expect(typeof row.totalPayments).toBe('number')
      expect(typeof row.distinguishedClubs).toBe('number')
    }
  })

  it('overall ranks are unique and dense from 1 (a real rankings payload)', () => {
    const ranks = typedRankings.rankings
      .map(r => r.overallRank)
      .sort((a, b) => a - b)
    expect(new Set(ranks).size).toBe(ranks.length)
    expect(ranks[0]).toBe(1)
  })

  it('manifest + dates point at the same snapshot date the rankings carry', () => {
    expect(typedManifest.latestSnapshotDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(typedRankings.date).toBe(typedManifest.latestSnapshotDate)
    expect(typedDates.dates).toContain(typedManifest.latestSnapshotDate)
    expect(typedDates.count).toBe(typedDates.dates.length)
  })
})
