/**
 * Closing-Pinned Auto-Allow (CPAA) — epic #1083 Sprint 2 (#1086).
 *
 * Policy spec: docs/investigations/closing-period-promote-policy-2026-06-03.md
 * §4 (field classes + rules), §5 (closing-pinned detection), §8 (test scope).
 *
 * Layer 1 (structural): the field-classification registry must be exhaustive
 * against DistrictRankingSchema.shape — an unclassified schema field fails
 * here (fail-closed, R20/L150 spirit).
 * Layer 2 (consequential, L150): the closing-2026-05-31 fixture tests assert
 * the OUTPUT of the classification — a mis-classified field (e.g. a counter
 * labelled derived) flips the fixture verdicts, so a wrong label fails loudly
 * even though the registry stays exhaustive.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DistrictRankingSchema,
  validateAllDistrictsRankings,
  type AllDistrictsRankingsData,
  type DistrictRanking,
} from '@toastmasters/shared-contracts'
import {
  digestDate,
  diffSnapshots,
  evaluateClosingAutoAllow,
  evaluatePromote,
  FIELD_CLASSIFICATION,
  isClosingPinned,
  type DateDigest,
  type FieldClass,
} from '../SnapshotValueDiff.js'

describe('FIELD_CLASSIFICATION registry (#1086)', () => {
  it('classifies every DistrictRankingSchema field exactly once (exhaustive)', () => {
    const schemaFields = Object.keys(DistrictRankingSchema.shape).sort()
    const classifiedFields = Object.keys(FIELD_CLASSIFICATION).sort()
    expect(classifiedFields).toEqual(schemaFields)
  })

  it('matches the decision-doc §4 class table exactly', () => {
    const byClass = (cls: FieldClass) =>
      Object.entries(FIELD_CLASSIFICATION)
        .filter(([, v]) => v === cls)
        .map(([k]) => k)
        .sort()

    expect(byClass('counter')).toEqual(
      [
        'paidClubs',
        'activeClubs',
        'totalPayments',
        'newPayments',
        'aprilPayments',
        'octoberPayments',
        'latePayments',
        'charterPayments',
        'distinguishedClubs',
        'selectDistinguished',
        'presidentsDistinguished',
        'smedleyDistinguished',
        'clubsWith20PlusMembers',
        'newCharteredClubs',
      ].sort()
    )
    expect(byClass('base')).toEqual(['paidClubBase', 'paymentBase'])
    expect(byClass('identity')).toEqual([
      'districtId',
      'districtName',
      'region',
    ])
    expect(byClass('planBoolean')).toEqual(
      [
        'dspSubmitted',
        'trainingMet',
        'marketAnalysisSubmitted',
        'communicationPlanSubmitted',
        'regionAdvisorVisitMet',
      ].sort()
    )
    expect(byClass('derived')).toEqual(
      [
        'clubGrowthPercent',
        'paymentGrowthPercent',
        'distinguishedPercent',
        'clubsRank',
        'paymentsRank',
        'distinguishedRank',
        'overallRank',
        'aggregateScore',
      ].sort()
    )
  })
})

describe('isClosingPinned (#1086, decision doc §5)', () => {
  it('detects the live 2026-05-31 signature (month-end, As-of advanced, gap ≤ 31d)', () => {
    expect(isClosingPinned('2026-05-31', '2026-06-02')).toBe(true)
  })

  it('detects the December cross-year signature via ISO-string comparison', () => {
    expect(isClosingPinned('2025-12-31', '2026-01-15')).toBe(true)
  })

  it('rejects a non-month-end date even when the As-of advanced', () => {
    expect(isClosingPinned('2026-05-30', '2026-06-02')).toBe(false)
  })

  it('rejects when sourceCsvDate equals the snapshot date (signature absent)', () => {
    expect(isClosingPinned('2026-05-31', '2026-05-31')).toBe(false)
  })

  it('rejects when sourceCsvDate precedes the snapshot date', () => {
    expect(isClosingPinned('2026-05-31', '2026-05-29')).toBe(false)
  })

  it('rejects a gap beyond 31 days; accepts the 31-day boundary', () => {
    expect(isClosingPinned('2026-05-31', '2026-07-02')).toBe(false) // 32 days
    expect(isClosingPinned('2026-05-31', '2026-07-01')).toBe(true) // 31 days
  })

  it('rejects a missing sourceCsvDate (fail-closed)', () => {
    expect(isClosingPinned('2026-05-31', undefined)).toBe(false)
  })

  it('handles February month-end including leap years', () => {
    expect(isClosingPinned('2026-02-28', '2026-03-05')).toBe(true)
    expect(isClosingPinned('2024-02-28', '2024-03-05')).toBe(false) // leap year: not month-end
    expect(isClosingPinned('2024-02-29', '2024-03-05')).toBe(true)
  })

  it('rejects malformed date strings (fail-closed)', () => {
    expect(isClosingPinned('not-a-date', '2026-06-02')).toBe(false)
    expect(isClosingPinned('2026-05-31', 'garbage')).toBe(false)
  })
})

/* ────────────────────────────────────────────────────────────────────────────
 * evaluateClosingAutoAllow — synthetic-edge + real-fixture coverage.
 * Fixture: the captured 2026-05-31 staging/prod pair (see fixtures README) —
 * the L150 consequential layer: a mis-classified field flips these verdicts.
 * ──────────────────────────────────────────────────────────────────────── */

const FIXTURE_DIR = fileURLToPath(
  new URL('./fixtures/closing-2026-05-31/', import.meta.url)
)

function loadFixture(name: string): AllDistrictsRankingsData {
  const parsed = validateAllDistrictsRankings(
    JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'))
  )
  if (!parsed.success || !parsed.data) {
    throw new Error(`fixture ${name} failed schema validation: ${parsed.error}`)
  }
  return parsed.data
}

/** The 5 genuine-reversal districts captured in the fixture (doc §3b). */
const REVERSAL_DISTRICTS = ['114', '88', '128', '44', '50']

function syntheticDistrict(
  overrides: Partial<DistrictRanking> = {}
): DistrictRanking {
  return {
    districtId: '61',
    districtName: 'District 61',
    region: 'Region 7',
    paidClubs: 100,
    paidClubBase: 98,
    clubGrowthPercent: 2.04,
    totalPayments: 5000,
    paymentBase: 4800,
    paymentGrowthPercent: 4.17,
    activeClubs: 95,
    distinguishedClubs: 30,
    selectDistinguished: 10,
    presidentsDistinguished: 5,
    distinguishedPercent: 30,
    clubsRank: 3,
    paymentsRank: 4,
    distinguishedRank: 2,
    aggregateScore: 88.5,
    overallRank: 3,
    ...overrides,
  }
}

function syntheticRankings(
  districts: DistrictRanking[],
  sourceCsvDate: string
): AllDistrictsRankingsData {
  return {
    metadata: {
      snapshotId: '2026-05-31',
      calculatedAt: '2026-06-03T00:00:00.000Z',
      schemaVersion: '1.0.0',
      calculationVersion: '1.0.0',
      rankingVersion: '1.0.0',
      sourceCsvDate,
      csvFetchedAt: '2026-06-03T00:00:00.000Z',
      totalDistricts: districts.length,
      fromCache: false,
    },
    rankings: districts,
  }
}

/** Digest pair for one synthetic district: prod baseline vs staging override. */
function syntheticPair(
  stagingOverrides: Partial<DistrictRanking>,
  prodOverrides: Partial<DistrictRanking> = {},
  {
    date = '2026-05-31',
    stagingSourceCsvDate = '2026-06-02',
    prodSourceCsvDate = '2026-05-31',
  } = {}
): [DateDigest, DateDigest] {
  return [
    digestDate(
      date,
      syntheticRankings(
        [syntheticDistrict(stagingOverrides)],
        stagingSourceCsvDate
      )
    ),
    digestDate(
      date,
      syntheticRankings([syntheticDistrict(prodOverrides)], prodSourceCsvDate)
    ),
  ]
}

describe('digestDate CPAA pass-through (#1086)', () => {
  it('carries the parsed district rows and sourceCsvDate', () => {
    const data = syntheticRankings([syntheticDistrict()], '2026-06-02')
    const digest = digestDate('2026-05-31', data)
    expect(digest.sourceCsvDate).toBe('2026-06-02')
    expect(digest.districts?.['61']?.paidClubs).toBe(100)
  })
})

describe('evaluateClosingAutoAllow — fixture (2026-05-31 pair)', () => {
  const stagingData = loadFixture('staging-all-districts-rankings.json')
  const prodData = loadFixture('prod-all-districts-rankings.json')
  const stagingDigest = digestDate('2026-05-31', stagingData)
  const prodDigest = digestDate('2026-05-31', prodData)

  it('auto-allows the as-is pair — genuine reversals are routine reconciliation (#1092)', () => {
    // Under #1086 this pair BLOCKED, naming the 5 reversal districts; the
    // operator decision (#1092) is that per-unit decreases are legitimate
    // during closing. Direction-agnostic: the pair now auto-allows with the
    // reversal districts carried in the delta provenance.
    const res = evaluateClosingAutoAllow(stagingDigest, prodDigest)
    expect(res.allowed).toBe(true)
    expect(res.reasons).toEqual([])
    const decreaseIds = new Set(
      res.deltas.filter(d => d.delta < 0).map(d => d.districtId)
    )
    for (const id of REVERSAL_DISTRICTS) {
      expect(decreaseIds.has(id), `expected a decrease delta for D${id}`).toBe(
        true
      )
    }
    // Every move (either direction) sits inside the symmetric magnitude cap.
    for (const d of res.deltas) {
      expect(Math.abs(d.delta)).toBeLessThanOrEqual(Math.max(50, 0.1 * d.prod))
    }
  })

  it('auto-allows the monotone subset too (19 movers, 78 derived-only)', () => {
    const prodRowById = new Map(prodData.rankings.map(r => [r.districtId, r]))
    const patched: AllDistrictsRankingsData = {
      ...stagingData,
      rankings: stagingData.rankings.map(r =>
        REVERSAL_DISTRICTS.includes(r.districtId)
          ? (prodRowById.get(r.districtId) ?? r)
          : r
      ),
    }
    const res = evaluateClosingAutoAllow(
      digestDate('2026-05-31', patched),
      prodDigest
    )
    expect(res.allowed).toBe(true)
    expect(res.reasons).toEqual([])
    const moverIds = new Set(res.deltas.map(d => d.districtId))
    expect(moverIds.size).toBe(19)
    expect(res.derivedOnlyDistricts).toHaveLength(78)
    // Provenance is monotone and capped by construction.
    for (const d of res.deltas) {
      expect(d.delta).toBeGreaterThan(0)
      expect(d.delta).toBeLessThanOrEqual(Math.max(50, 0.1 * d.prod))
    }
  })
})

describe('evaluateClosingAutoAllow — edges (decision doc §8.3)', () => {
  it('allows a monotone within-cap counter move on a pinned date', () => {
    const [s, p] = syntheticPair({ totalPayments: 5050 })
    const res = evaluateClosingAutoAllow(s, p)
    expect(res.allowed).toBe(true)
    expect(res.deltas).toEqual([
      {
        districtId: '61',
        field: 'totalPayments',
        prod: 5000,
        staging: 5050,
        delta: 50,
      },
    ])
  })

  it('allows a small-base spike within the absolute floor of 50', () => {
    // charterPayments 160→186 (+26): 10% cap would be 16, floor 50 covers it.
    const [s, p] = syntheticPair(
      { charterPayments: 186 },
      { charterPayments: 160 }
    )
    expect(evaluateClosingAutoAllow(s, p).allowed).toBe(true)
  })

  it('blocks when the signature is absent (sourceCsvDate == date)', () => {
    const [s, p] = syntheticPair(
      { totalPayments: 5050 },
      {},
      { stagingSourceCsvDate: '2026-05-31' }
    )
    const res = evaluateClosingAutoAllow(s, p)
    expect(res.allowed).toBe(false)
    expect(res.reasons.join(' ')).toMatch(/closing-pinned/i)
  })

  it('blocks a changed non-month-end date even with an advanced As-of', () => {
    const [s, p] = syntheticPair(
      { totalPayments: 5050 },
      {},
      {
        date: '2026-05-30',
      }
    )
    expect(evaluateClosingAutoAllow(s, p).allowed).toBe(false)
  })

  it('detects the December cross-year signature', () => {
    const [s, p] = syntheticPair(
      { totalPayments: 5050 },
      {},
      {
        date: '2025-12-31',
        stagingSourceCsvDate: '2026-01-10',
        prodSourceCsvDate: '2025-12-31',
      }
    )
    expect(evaluateClosingAutoAllow(s, p).allowed).toBe(true)
  })

  it('blocks a counter exceeding the max(50, 10%) cap', () => {
    // Δ +600 on prod 5000: cap is max(50, 500) = 500.
    const [s, p] = syntheticPair({ totalPayments: 5600 })
    const res = evaluateClosingAutoAllow(s, p)
    expect(res.allowed).toBe(false)
    expect(res.reasons.join(' ')).toMatch(/cap/i)
  })

  it('allows a counter decrease within the cap — direction-agnostic (#1092)', () => {
    const [s, p] = syntheticPair({ totalPayments: 4999 })
    const res = evaluateClosingAutoAllow(s, p)
    expect(res.allowed).toBe(true)
    expect(res.deltas).toEqual([
      {
        districtId: '61',
        field: 'totalPayments',
        prod: 5000,
        staging: 4999,
        delta: -1,
      },
    ])
  })

  it('blocks an implausible-magnitude decrease (symmetric cap, #1092)', () => {
    // Δ −600 on prod 5000: symmetric cap is max(50, 500) = 500. A per-unit
    // reconciliation never moves this much — a collapse is a regression.
    const [s, p] = syntheticPair({ totalPayments: 4400 })
    const res = evaluateClosingAutoAllow(s, p)
    expect(res.allowed).toBe(false)
    expect(res.reasons.join(' ')).toMatch(/cap/i)
  })

  it('blocks a counter collapsing to zero on a large base (#1092)', () => {
    const [s, p] = syntheticPair({ totalPayments: 0 })
    const res = evaluateClosingAutoAllow(s, p)
    expect(res.allowed).toBe(false)
    expect(res.reasons.join(' ')).toMatch(/cap/i)
  })

  it('blocks base drift (paymentBase moved)', () => {
    const [s, p] = syntheticPair({ paymentBase: 4801 })
    const res = evaluateClosingAutoAllow(s, p)
    expect(res.allowed).toBe(false)
    expect(res.reasons.join(' ')).toMatch(/base/i)
  })

  it('blocks identity drift (districtName changed)', () => {
    const [s, p] = syntheticPair({ districtName: 'District 61 Renamed' })
    expect(evaluateClosingAutoAllow(s, p).allowed).toBe(false)
  })

  it('allows a plan boolean false→true but blocks true→false', () => {
    const [allowS, allowP] = syntheticPair(
      { dspSubmitted: true },
      { dspSubmitted: false }
    )
    expect(evaluateClosingAutoAllow(allowS, allowP).allowed).toBe(true)

    const [blockS, blockP] = syntheticPair(
      { trainingMet: false },
      { trainingMet: true }
    )
    const res = evaluateClosingAutoAllow(blockS, blockP)
    expect(res.allowed).toBe(false)
    expect(res.reasons.join(' ')).toMatch(/trainingMet/)
  })

  it('blocks an optionality transition (field appears on one side only)', () => {
    const [s, p] = syntheticPair({ smedleyDistinguished: 2 }, {})
    const res = evaluateClosingAutoAllow(s, p)
    expect(res.allowed).toBe(false)
    expect(res.reasons.join(' ')).toMatch(/smedleyDistinguished/)
  })

  it('blocks an unclassified changed field (fail-closed)', () => {
    const withUnknown = (v: number) =>
      ({
        ...syntheticDistrict(),
        mysteryField: v,
      }) as unknown as DistrictRanking
    const s = digestDate(
      '2026-05-31',
      syntheticRankings([withUnknown(2)], '2026-06-02')
    )
    const p = digestDate(
      '2026-05-31',
      syntheticRankings([withUnknown(1)], '2026-05-31')
    )
    const res = evaluateClosingAutoAllow(s, p)
    expect(res.allowed).toBe(false)
    expect(res.reasons.join(' ')).toMatch(/mysteryField/)
  })

  it('blocks when the district set differs on the changed date', () => {
    const extra = syntheticDistrict({ districtId: '99' })
    const s = digestDate(
      '2026-05-31',
      syntheticRankings([syntheticDistrict(), extra], '2026-06-02')
    )
    const p = digestDate(
      '2026-05-31',
      syntheticRankings(
        [syntheticDistrict({ totalPayments: 4900 })],
        '2026-05-31'
      )
    )
    const res = evaluateClosingAutoAllow(s, p)
    expect(res.allowed).toBe(false)
    expect(res.reasons.join(' ')).toMatch(/99/)
  })

  it('fails closed when digests lack the parsed rows (hand-built digests)', () => {
    const [s, p] = syntheticPair({ totalPayments: 5050 })
    const stripped: DateDigest = {
      date: s.date,
      totalDistricts: s.totalDistricts,
      districtDigests: s.districtDigests,
      combined: s.combined,
    }
    expect(evaluateClosingAutoAllow(stripped, p).allowed).toBe(false)
  })
})

describe('evaluatePromote CPAA wiring (#1086)', () => {
  /** Two-sided single-date digest sets around the synthetic district. */
  function promoteCase(
    stagingOverrides: Partial<DistrictRanking>,
    {
      date = '2026-05-31',
      stagingSourceCsvDate = '2026-06-02',
    }: { date?: string; stagingSourceCsvDate?: string } = {}
  ) {
    const staging = [
      digestDate(
        date,
        syntheticRankings(
          [syntheticDistrict(stagingOverrides)],
          stagingSourceCsvDate
        )
      ),
    ]
    const prod = [
      digestDate(date, syntheticRankings([syntheticDistrict()], date)),
    ]
    return { report: diffSnapshots(staging, prod), digests: { staging, prod } }
  }

  it('auto-allows a closing-pinned within-cap changed date (promote, no review)', () => {
    const { report, digests } = promoteCase({ totalPayments: 5050 })
    const decision = evaluatePromote(report, {}, digests)
    expect(decision.promote).toBe(true)
    expect(decision.requiresReview).toBe(false)
    expect(decision.autoAllowed).toBe('closing-reconciliation')
    expect(decision.closingDeltas).toEqual([
      {
        date: '2026-05-31',
        districtId: '61',
        field: 'totalPayments',
        prod: 5000,
        staging: 5050,
        delta: 50,
      },
    ])
    expect(decision.reasons.join(' ')).toMatch(/auto-allow/i)
  })

  it('auto-allows a closing-pinned decrease (direction-agnostic, #1092)', () => {
    const { report, digests } = promoteCase({ totalPayments: 4999 })
    const decision = evaluatePromote(report, {}, digests)
    expect(decision.promote).toBe(true)
    expect(decision.requiresReview).toBe(false)
    expect(decision.autoAllowed).toBe('closing-reconciliation')
    expect(decision.closingDeltas).toEqual([
      {
        date: '2026-05-31',
        districtId: '61',
        field: 'totalPayments',
        prod: 5000,
        staging: 4999,
        delta: -1,
      },
    ])
  })

  it('keeps blocking when CPAA finds a cap breach, surfacing the violation', () => {
    const { report, digests } = promoteCase({ totalPayments: 4400 }) // Δ −600
    const decision = evaluatePromote(report, {}, digests)
    expect(decision.promote).toBe(false)
    expect(decision.requiresReview).toBe(true)
    expect(decision.autoAllowed).toBeUndefined()
    expect(decision.reasons.join(' ')).toMatch(/cap/i)
  })

  it('blocks when ANY changed date lacks the closing signature, even if another passes', () => {
    const pinnedStaging = digestDate(
      '2026-05-31',
      syntheticRankings(
        [syntheticDistrict({ totalPayments: 5050 })],
        '2026-06-02'
      )
    )
    const pinnedProd = digestDate(
      '2026-05-31',
      syntheticRankings([syntheticDistrict()], '2026-05-31')
    )
    // Mid-month historical date whose values changed — a re-derive of history.
    const histStaging = digestDate(
      '2026-05-15',
      syntheticRankings(
        [syntheticDistrict({ totalPayments: 4600 })],
        '2026-05-15'
      )
    )
    const histProd = digestDate(
      '2026-05-15',
      syntheticRankings(
        [syntheticDistrict({ totalPayments: 4500 })],
        '2026-05-15'
      )
    )
    const digests = {
      staging: [pinnedStaging, histStaging],
      prod: [pinnedProd, histProd],
    }
    const report = diffSnapshots(digests.staging, digests.prod)
    const decision = evaluatePromote(report, {}, digests)
    expect(decision.promote).toBe(false)
    expect(decision.autoAllowed).toBeUndefined()
    expect(decision.reasons.join(' ')).toMatch(/2026-05-15/)
  })

  it('still blocks a subtractive change even when changed dates are closing-allowed', () => {
    const { digests } = promoteCase({ totalPayments: 5050 })
    const extraProdDate = digestDate(
      '2026-04-30',
      syntheticRankings([syntheticDistrict()], '2026-04-30')
    )
    const report = diffSnapshots(digests.staging, [
      ...digests.prod,
      extraProdDate,
    ])
    const decision = evaluatePromote(
      report,
      {},
      {
        staging: digests.staging,
        prod: [...digests.prod, extraProdDate],
      }
    )
    expect(decision.promote).toBe(false)
    expect(decision.reasons.join(' ')).toMatch(/subtractive/i)
  })

  it('fails closed to operator review when no digests are provided (legacy path)', () => {
    const { report } = promoteCase({ totalPayments: 5050 })
    const decision = evaluatePromote(report)
    expect(decision.promote).toBe(false)
    expect(decision.requiresReview).toBe(true)
    expect(decision.autoAllowed).toBeUndefined()
  })

  it('keeps allowValueChanges semantics byte-for-byte (no autoAllowed tag)', () => {
    const { report, digests } = promoteCase({ totalPayments: 4999 })
    const decision = evaluatePromote(
      report,
      { allowValueChanges: true },
      digests
    )
    expect(decision.promote).toBe(true)
    expect(decision.requiresReview).toBe(true)
    expect(decision.autoAllowed).toBeUndefined()
  })
})

describe('evaluateClosingAutoAllow — absolute-floor cap boundary (review nit)', () => {
  // On a small base (prod 100, 10% = 10) the cap resolves to the absolute
  // floor of 50: Δ +50 is the last allowed step, Δ +51 blocks.
  it('allows Δ = 50 and blocks Δ = 51 when the cap is the absolute floor', () => {
    const [allowS, allowP] = syntheticPair({ paidClubs: 150 }) // prod 100, Δ +50
    expect(evaluateClosingAutoAllow(allowS, allowP).allowed).toBe(true)

    const [blockS, blockP] = syntheticPair({ paidClubs: 151 }) // prod 100, Δ +51
    const res = evaluateClosingAutoAllow(blockS, blockP)
    expect(res.allowed).toBe(false)
    expect(res.reasons.join(' ')).toMatch(/cap/i)
  })

  it('applies the same boundary on the decrease side (Δ −50 allows, Δ −51 blocks) (#1092)', () => {
    const [allowS, allowP] = syntheticPair({ paidClubs: 50 }) // prod 100, Δ −50
    expect(evaluateClosingAutoAllow(allowS, allowP).allowed).toBe(true)

    const [blockS, blockP] = syntheticPair({ paidClubs: 49 }) // prod 100, Δ −51
    const res = evaluateClosingAutoAllow(blockS, blockP)
    expect(res.allowed).toBe(false)
    expect(res.reasons.join(' ')).toMatch(/cap/i)
  })
})
