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
import { DistrictRankingSchema } from '@toastmasters/shared-contracts'
import {
  FIELD_CLASSIFICATION,
  isClosingPinned,
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
