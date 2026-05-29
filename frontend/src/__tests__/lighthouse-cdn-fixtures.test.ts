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
 * break loudly here (a fast unit test that runs in CI — ci.yml frontend vitest)
 * instead of silently in the gate.
 *
 * NOTE on enforcement surface: the typed imports below are a compile-time
 * contract, but `build:frontend`'s `tsc` uses `tsconfig.json`, which EXCLUDES
 * the test directories — so the prod build does not type-check this file (only
 * the non-CI `typecheck:test` does). The load-bearing CI guard is therefore the
 * *runtime* assertions: esbuild strips the types without checking them, so every
 * required field a drift could touch is asserted explicitly below.
 */
import { describe, it, expect } from 'vitest'
import type {
  CdnRankingsData,
  CdnManifest,
  CdnDatesIndex,
  CompetitiveAwardStandings,
} from '../services/cdn'

import rankings from '../../lighthouse/cdn-fixtures/v1/rankings.json'
import manifest from '../../lighthouse/cdn-fixtures/v1/latest.json'
import dates from '../../lighthouse/cdn-fixtures/v1/dates.json'
import awards from '../../lighthouse/cdn-fixtures/snapshots/2025-11-22/competitive-awards.json'

// Compile-time contract (enforced by `typecheck:test`, not the prod build):
// a fixture that drifts from the CDN response shape fails `tsc` here.
const typedRankings: CdnRankingsData = rankings
const typedManifest: CdnManifest = manifest
const typedDates: CdnDatesIndex = dates
const typedAwards: CompetitiveAwardStandings = awards

// Every required field of a rankings row, with its runtime type. Drift in ANY
// of these (rename, removal, type change in the pipeline) must red the gate —
// so they're asserted at runtime, not just by the types tsc may not check.
const RANKINGS_ROW_FIELDS: Record<string, 'string' | 'number'> = {
  districtId: 'string',
  districtName: 'string',
  region: 'string',
  paidClubs: 'number',
  paidClubBase: 'number',
  clubGrowthPercent: 'number',
  totalPayments: 'number',
  paymentBase: 'number',
  paymentGrowthPercent: 'number',
  activeClubs: 'number',
  distinguishedClubs: 'number',
  selectDistinguished: 'number',
  presidentsDistinguished: 'number',
  distinguishedPercent: 'number',
  clubsRank: 'number',
  paymentsRank: 'number',
  distinguishedRank: 'number',
  aggregateScore: 'number',
  overallRank: 'number',
}

describe('Lighthouse CDN fixtures (#915 V10)', () => {
  it('rankings fixture has enough rows for a representative loaded-state layout', () => {
    // The point of the fixture is that `/` reaches the LOADED state, not a
    // collapsed error/empty card — so the CLS budget measures the real table.
    expect(typedRankings.rankings.length).toBeGreaterThanOrEqual(10)
  })

  it('every rankings row carries every field the CDN contract requires', () => {
    for (const row of typedRankings.rankings) {
      for (const [field, type] of Object.entries(RANKINGS_ROW_FIELDS)) {
        expect(
          typeof (row as unknown as Record<string, unknown>)[field],
          `rankings row ${row.overallRank} field "${field}"`
        ).toBe(type)
      }
      expect(row.districtId.length).toBeGreaterThan(0)
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

  it('competitive-awards fixture is a structurally-valid standings payload', () => {
    // AwardsRaceSection is null-safe today, but a malformed fixture would throw
    // the moment a consumer tightens an access — re-opening the exact flake
    // class V10 closes. Assert the required structure so it can't rot.
    expect(typedAwards.metadata.snapshotId).toBe(
      typedManifest.latestSnapshotDate
    )
    expect(typeof typedAwards.metadata.calculatedAt).toBe('string')
    expect(typeof typedAwards.metadata.totalDistricts).toBe('number')
    expect(Array.isArray(typedAwards.extensionAward)).toBe(true)
    expect(Array.isArray(typedAwards.twentyPlusAward)).toBe(true)
    expect(Array.isArray(typedAwards.retentionAward)).toBe(true)
    expect(typeof typedAwards.byDistrict).toBe('object')
  })
})
