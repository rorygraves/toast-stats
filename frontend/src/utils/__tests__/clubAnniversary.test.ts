import { describe, it, expect } from 'vitest'
import { getClubAnniversary } from '../clubAnniversary'

/* Sprint A — RED tests for #444. */

const ref = (iso: string) => new Date(`${iso}T12:00:00Z`)

describe('getClubAnniversary (#444)', () => {
  describe('null / invalid input', () => {
    it('returns null for empty string', () => {
      expect(getClubAnniversary('', ref('2026-05-12'))).toBeNull()
    })

    it('returns null for unparseable garbage', () => {
      expect(getClubAnniversary('not a date', ref('2026-05-12'))).toBeNull()
    })

    it('returns null for out-of-band years (< 1900 or > current+10)', () => {
      expect(getClubAnniversary('1800-01-01', ref('2026-05-12'))).toBeNull()
      expect(getClubAnniversary('2099-01-01', ref('2026-05-12'))).toBeNull()
    })
  })

  describe('whole-year arithmetic', () => {
    it('returns years=0 when charter date is exactly today', () => {
      const result = getClubAnniversary('2026-05-12', ref('2026-05-12'))
      expect(result?.years).toBe(0)
      expect(result?.daysUntilNext).toBe(0)
      expect(result?.upcomingYears).toBe(0)
    })

    it('returns years=1 one year after charter, on the day', () => {
      const result = getClubAnniversary('2025-05-12', ref('2026-05-12'))
      expect(result?.years).toBe(1)
      expect(result?.daysUntilNext).toBe(0)
      expect(result?.upcomingYears).toBe(1)
    })

    it('returns years just BEFORE incrementing on the day before anniversary', () => {
      const result = getClubAnniversary('2025-05-13', ref('2026-05-12'))
      expect(result?.years).toBe(0) // not yet first anniversary
      expect(result?.daysUntilNext).toBe(1)
      expect(result?.upcomingYears).toBe(1)
    })

    it('returns 39 years for a 1987-03-01 club observed in 2026-05-12', () => {
      const result = getClubAnniversary('1987-03-01', ref('2026-05-12'))
      expect(result?.years).toBe(39)
    })

    it('accepts ISO datetimes (Z) as well as date-only strings', () => {
      const a = getClubAnniversary('1987-03-01', ref('2026-05-12'))
      const b = getClubAnniversary('1987-03-01T00:00:00Z', ref('2026-05-12'))
      expect(a?.years).toBe(b?.years)
    })

    it('accepts Date objects', () => {
      const result = getClubAnniversary(
        new Date('1987-03-01T00:00:00Z'),
        ref('2026-05-12')
      )
      expect(result?.years).toBe(39)
    })
  })

  describe('milestone flag', () => {
    // #509 — every multiple of 5 from 5 through 100 is a milestone.
    // Districts recognize 35/45/55/65/70/etc. anniversaries even though
    // TI doesn't issue recognition pins for those exact increments.
    it.each([
      [5, true],
      [10, true],
      [15, true],
      [20, true],
      [25, true],
      [30, true],
      [35, true],
      [40, true],
      [45, true],
      [50, true],
      [55, true],
      [60, true],
      [65, true],
      [70, true],
      [75, true],
      [80, true],
      [85, true],
      [90, true],
      [95, true],
      [100, true],
    ])('marks %d years as a milestone', (y, expected) => {
      const charter = `${2026 - y}-05-12`
      const result = getClubAnniversary(charter, ref('2026-05-12'))
      expect(result?.years).toBe(y)
      expect(result?.isMilestone).toBe(expected)
    })

    it.each([
      [1, false],
      [3, false],
      [7, false],
      [11, false],
      [42, false],
      [99, false],
    ])('does NOT mark %d years as a milestone', (y, expected) => {
      const charter = `${2026 - y}-05-12`
      const result = getClubAnniversary(charter, ref('2026-05-12'))
      expect(result?.years).toBe(y)
      expect(result?.isMilestone).toBe(expected)
    })
  })

  describe('upcoming window (±30 days)', () => {
    it('is upcoming exactly on the anniversary day', () => {
      const result = getClubAnniversary('2020-05-12', ref('2026-05-12'))
      expect(result?.isUpcoming).toBe(true)
    })

    it('is upcoming 30 days before the anniversary', () => {
      const result = getClubAnniversary('2020-06-11', ref('2026-05-12'))
      // 2026-06-11 is 30 days away
      expect(result?.daysUntilNext).toBe(30)
      expect(result?.isUpcoming).toBe(true)
    })

    it('is NOT upcoming 31 days before the anniversary', () => {
      const result = getClubAnniversary('2020-06-12', ref('2026-05-12'))
      expect(result?.daysUntilNext).toBe(31)
      expect(result?.isUpcoming).toBe(false)
    })

    it('is upcoming within 30 days AFTER the anniversary (just passed)', () => {
      // Charter 2020-04-12; ref 2026-05-12. Last anniversary was 2026-04-12,
      // which is 30 days ago. daysUntilNext is to 2027-04-12 (~334 days).
      // But the "upcoming" flag should consider proximity in either
      // direction; per the AC: "within ±30 days of the reference date".
      const result = getClubAnniversary('2020-04-12', ref('2026-05-12'))
      expect(result?.isUpcoming).toBe(true)
    })

    it('is NOT upcoming 31 days after the anniversary', () => {
      const result = getClubAnniversary('2020-04-11', ref('2026-05-12'))
      expect(result?.isUpcoming).toBe(false)
    })
  })

  describe('upcomingYears', () => {
    it('equals years on the exact anniversary day', () => {
      const result = getClubAnniversary('2020-05-12', ref('2026-05-12'))
      expect(result?.years).toBe(6)
      expect(result?.upcomingYears).toBe(6)
    })

    it('equals years + 1 before the anniversary', () => {
      const result = getClubAnniversary('2020-05-13', ref('2026-05-12'))
      expect(result?.years).toBe(5)
      expect(result?.upcomingYears).toBe(6)
    })

    it('marks an upcoming MILESTONE even when current years is not a milestone', () => {
      // Charter 2001-06-01; ref 2026-05-12. Current years = 24, but next
      // anniversary (2026-06-01) is 20 days away → upcomingYears = 25
      // → milestone via upcoming.
      const result = getClubAnniversary('2001-06-01', ref('2026-05-12'))
      expect(result?.years).toBe(24)
      expect(result?.upcomingYears).toBe(25)
      expect(result?.isUpcoming).toBe(true)
      // Note: isMilestone reflects CURRENT years, not upcoming. UI uses
      // upcomingYears + isMilestone of upcomingYears to gild "in 20 days"
      // copy. Keep flags primitive; let UI compose.
      expect(result?.isMilestone).toBe(false)
    })
  })

  describe('Feb 29 leap-year clubs', () => {
    // Toastmasters has been around since 1924; leap-year charters exist.
    // On non-leap years the anniversary is observed on Feb 28 by
    // convention — same approach the TI dashboard uses.
    it('observes Feb 29 → Feb 28 in non-leap reference years', () => {
      const result = getClubAnniversary('1972-02-29', ref('2025-02-28'))
      expect(result?.years).toBe(53)
      expect(result?.daysUntilNext).toBe(0)
    })

    it('observes Feb 29 on actual Feb 29 in leap reference years', () => {
      const result = getClubAnniversary('1972-02-29', ref('2024-02-29'))
      expect(result?.years).toBe(52)
      expect(result?.daysUntilNext).toBe(0)
    })
  })
})
