/**
 * Unit tests for shared program-year date helpers (#306).
 *
 * Previously duplicated verbatim between BordaCountRankingCalculator
 * (analytics-core) and TransformService (collector-cli).
 */

import { describe, it, expect } from 'vitest'
import {
  parseDateFlexible,
  getProgramYearStartDate,
  parseCharterDateFromStatusField,
} from './programYearDates.js'

describe('parseDateFlexible', () => {
  it('parses ISO YYYY-MM-DD as UTC', () => {
    expect(parseDateFlexible('2026-04-15')?.toISOString()).toBe(
      '2026-04-15T00:00:00.000Z'
    )
  })

  it('parses US M/D/YYYY', () => {
    expect(parseDateFlexible('4/15/2026')?.toISOString()).toBe(
      '2026-04-15T00:00:00.000Z'
    )
  })

  it('parses US M/D/YY as 20YY', () => {
    expect(parseDateFlexible('4/15/26')?.toISOString()).toBe(
      '2026-04-15T00:00:00.000Z'
    )
  })

  it('returns null for empty or unparseable input', () => {
    expect(parseDateFlexible('')).toBeNull()
    expect(parseDateFlexible('not a date')).toBeNull()
  })
})

describe('getProgramYearStartDate', () => {
  it('returns July 1 of the same calendar year for a date in/after July', () => {
    expect(getProgramYearStartDate('2025-09-15')?.toISOString()).toBe(
      '2025-07-01T00:00:00.000Z'
    )
  })

  it('returns July 1 of the previous calendar year for a date before July', () => {
    expect(getProgramYearStartDate('2026-04-15')?.toISOString()).toBe(
      '2025-07-01T00:00:00.000Z'
    )
  })

  it('returns null for an unparseable date', () => {
    expect(getProgramYearStartDate('garbage')).toBeNull()
  })
})

describe('parseCharterDateFromStatusField', () => {
  it('extracts the date from a Charter entry', () => {
    expect(
      parseCharterDateFromStatusField('Charter 04/15/26')?.toISOString()
    ).toBe('2026-04-15T00:00:00.000Z')
  })

  it('returns null for a Susp entry', () => {
    expect(parseCharterDateFromStatusField('Susp 09/30/25')).toBeNull()
  })

  it('returns null for empty or non-string input', () => {
    expect(parseCharterDateFromStatusField('')).toBeNull()
    expect(parseCharterDateFromStatusField(null)).toBeNull()
    expect(parseCharterDateFromStatusField(42)).toBeNull()
  })
})
