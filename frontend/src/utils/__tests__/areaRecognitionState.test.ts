/**
 * Tests for snapshot-date-aware area recognition gating (#832).
 *
 * Source-of-truth for area Distinguished/Select/President's recognition
 * with the qualifying club-visit requirement enforced as either:
 *   - Confirmed       (visits met)
 *   - Provisional     (visits unmet but deadline has not passed)
 *   - Not Distinguished (visits unmet AND deadline has passed → hard fail)
 *
 * Deadlines per Toastmasters District Recognition Program manual (item 1490 p.10):
 *   - R1: ≥75% of area's club base visited by Nov 30 of the program year start
 *   - R2: ≥75% by May 31 of the program year end
 *
 * Reference date is the snapshot's `asOfDate`, not wall-clock (so historical
 * snapshots gate correctly).
 */
import { describe, it, expect } from 'vitest'
import {
  deriveAreaRecognitionState,
  getAreaVisitDeadlines,
  type AreaRecognitionInput,
} from '../areaRecognitionState'

function input(
  overrides: Partial<AreaRecognitionInput> = {}
): AreaRecognitionInput {
  return {
    // Default: an area that earns Distinguished on metrics (50% of 10 = 5)
    clubBase: 10,
    paidClubs: 10,
    distinguishedClubs: 5,
    firstRoundVisitMet: true,
    secondRoundVisitMet: true,
    snapshotDate: '2026-06-15', // post both deadlines
    ...overrides,
  }
}

describe('getAreaVisitDeadlines (program-year anchoring)', () => {
  it('anchors deadlines to the snapshot date program year (Aug 2026 → PY 2026-2027)', () => {
    expect(getAreaVisitDeadlines('2026-08-15')).toEqual({
      r1: '2026-11-30',
      r2: '2027-05-31',
    })
  })

  it('anchors deadlines correctly for Jan snapshot (PY 2025-2026 still active)', () => {
    expect(getAreaVisitDeadlines('2026-01-15')).toEqual({
      r1: '2025-11-30',
      r2: '2026-05-31',
    })
  })

  it('handles July 1 program-year boundary (Jul 1 = new PY start)', () => {
    expect(getAreaVisitDeadlines('2026-07-01')).toEqual({
      r1: '2026-11-30',
      r2: '2027-05-31',
    })
  })

  it('handles June 30 as last day of prior PY', () => {
    expect(getAreaVisitDeadlines('2026-06-30')).toEqual({
      r1: '2025-11-30',
      r2: '2026-05-31',
    })
  })
})

describe('deriveAreaRecognitionState — earned tier × deadline-aware visits', () => {
  describe('CONFIRMED (both rounds met)', () => {
    it("confirms Distinguished when both rounds met at year's end", () => {
      const s = deriveAreaRecognitionState(input({ snapshotDate: '2026-06-15' }))
      expect(s.level).toBe('distinguished')
      expect(s.status).toBe('confirmed')
      expect(s.pendingRounds).toEqual([])
      expect(s.failureReason).toBeNull()
    })

    it('confirms Select Distinguished tier when earned + both rounds met', () => {
      const s = deriveAreaRecognitionState(
        input({ distinguishedClubs: 6, snapshotDate: '2026-06-15' })
      )
      expect(s.level).toBe('select')
      expect(s.status).toBe('confirmed')
    })

    it("confirms President's Distinguished tier when earned + both rounds met", () => {
      const s = deriveAreaRecognitionState(
        input({
          paidClubs: 11,
          distinguishedClubs: 6,
          snapshotDate: '2026-06-15',
        })
      )
      expect(s.level).toBe('presidents')
      expect(s.status).toBe('confirmed')
    })
  })

  describe('PROVISIONAL (unmet round whose deadline has not passed)', () => {
    it('flags Provisional in October when R1 unmet (R1 not yet due)', () => {
      const s = deriveAreaRecognitionState(
        input({
          firstRoundVisitMet: false,
          secondRoundVisitMet: false,
          snapshotDate: '2026-10-15',
        })
      )
      expect(s.level).toBe('distinguished')
      expect(s.status).toBe('provisional')
      expect(s.pendingRounds).toEqual([
        { round: 1, deadline: '2026-11-30' },
        { round: 2, deadline: '2027-05-31' },
      ])
      expect(s.failureReason).toBeNull()
    })

    it('flags Provisional in March when R1 met but R2 unmet (R2 not yet due)', () => {
      const s = deriveAreaRecognitionState(
        input({
          firstRoundVisitMet: true,
          secondRoundVisitMet: false,
          snapshotDate: '2026-03-10',
        })
      )
      expect(s.status).toBe('provisional')
      expect(s.pendingRounds).toEqual([{ round: 2, deadline: '2026-05-31' }])
    })

    it('flags Provisional on Nov 30 itself (deadline day not yet PAST)', () => {
      // Operator rule: passed(R) = snapshotDate > deadline(R) (strict >).
      const s = deriveAreaRecognitionState(
        input({
          firstRoundVisitMet: false,
          secondRoundVisitMet: false,
          snapshotDate: '2026-11-30',
        })
      )
      expect(s.status).toBe('provisional')
    })
  })

  describe('NOT DISTINGUISHED — hard fail (deadline passed unmet)', () => {
    it('hard-fails Distinguished in December when R1 still unmet', () => {
      const s = deriveAreaRecognitionState(
        input({
          firstRoundVisitMet: false,
          secondRoundVisitMet: true,
          snapshotDate: '2026-12-05',
        })
      )
      expect(s.level).toBe('none')
      expect(s.status).toBe('not-distinguished')
      expect(s.pendingRounds).toEqual([])
      expect(s.failureReason).toBe('missed-deadline')
    })

    it('hard-fails in June when R2 deadline passed unmet (even if R1 was met)', () => {
      const s = deriveAreaRecognitionState(
        input({
          firstRoundVisitMet: true,
          secondRoundVisitMet: false,
          snapshotDate: '2026-06-15',
        })
      )
      expect(s.status).toBe('not-distinguished')
      expect(s.failureReason).toBe('missed-deadline')
    })

    it('hard-fails when BOTH deadlines passed unmet', () => {
      const s = deriveAreaRecognitionState(
        input({
          firstRoundVisitMet: false,
          secondRoundVisitMet: false,
          snapshotDate: '2026-06-15',
        })
      )
      expect(s.status).toBe('not-distinguished')
      expect(s.failureReason).toBe('missed-deadline')
    })

    it('hard-fail on Dec 1 (Nov 30 strictly passed)', () => {
      const s = deriveAreaRecognitionState(
        input({
          firstRoundVisitMet: false,
          secondRoundVisitMet: true,
          snapshotDate: '2026-12-01',
        })
      )
      expect(s.status).toBe('not-distinguished')
      expect(s.failureReason).toBe('missed-deadline')
    })
  })

  describe('Earned-tier gate (does not earn tier on metrics)', () => {
    it('returns Not Distinguished when distinguished < 50% regardless of visits', () => {
      const s = deriveAreaRecognitionState(
        input({ distinguishedClubs: 4, snapshotDate: '2026-06-15' })
      )
      expect(s.level).toBe('none')
      expect(s.status).toBe('not-distinguished')
      expect(s.failureReason).toBe('insufficient-distinguished')
    })

    it('flags Net Loss reason when paid < base (separate from visit gate)', () => {
      const s = deriveAreaRecognitionState(
        input({ paidClubs: 8, snapshotDate: '2026-06-15' })
      )
      expect(s.level).toBe('none')
      expect(s.status).toBe('not-distinguished')
      expect(s.failureReason).toBe('net-loss')
    })

    it('net-loss takes precedence over missed-deadline as the displayed reason', () => {
      const s = deriveAreaRecognitionState(
        input({
          paidClubs: 8, // net loss
          firstRoundVisitMet: false, // and visits missed
          snapshotDate: '2026-12-15',
        })
      )
      expect(s.failureReason).toBe('net-loss')
    })
  })

  describe('Edge cases', () => {
    it('handles zero clubBase as Not Distinguished', () => {
      const s = deriveAreaRecognitionState(
        input({
          clubBase: 0,
          paidClubs: 0,
          distinguishedClubs: 0,
          snapshotDate: '2026-06-15',
        })
      )
      expect(s.level).toBe('none')
      expect(s.status).toBe('not-distinguished')
    })

    it('handles snapshot before any deadline (early August)', () => {
      const s = deriveAreaRecognitionState(
        input({
          firstRoundVisitMet: false,
          secondRoundVisitMet: false,
          snapshotDate: '2026-08-05',
        })
      )
      expect(s.status).toBe('provisional')
      expect(s.pendingRounds).toHaveLength(2)
    })
  })
})
