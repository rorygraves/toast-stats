import { describe, it, expect } from 'vitest'
import { formatCharterDate } from '../formatCharterDate'

describe('formatCharterDate (#432)', () => {
  it('parses ISO datetime → long month + year', () => {
    expect(formatCharterDate('1987-02-15T00:00:00Z')).toBe('February 1987')
  })

  it('parses ISO date → long month + year', () => {
    expect(formatCharterDate('1987-02-15')).toBe('February 1987')
  })

  it('parses YYYY-MM → long month + year', () => {
    expect(formatCharterDate('1982-05')).toBe('May 1982')
  })

  it('returns year only when input has year precision', () => {
    expect(formatCharterDate('1982')).toBe('1982')
  })

  it('returns null for empty / whitespace / non-string input', () => {
    expect(formatCharterDate('')).toBeNull()
    expect(formatCharterDate('   ')).toBeNull()
    expect(formatCharterDate(null)).toBeNull()
    expect(formatCharterDate(undefined)).toBeNull()
    expect(formatCharterDate(123)).toBeNull()
  })

  it('returns null for nonsense strings', () => {
    expect(formatCharterDate('not a date')).toBeNull()
    expect(formatCharterDate('1987-13')).toBeNull() // month 13
    expect(formatCharterDate('99999')).toBeNull()
  })

  it('rejects implausible years (< 1900 or > 2200)', () => {
    expect(formatCharterDate('1800-05-01')).toBeNull()
    expect(formatCharterDate('2301-05-01')).toBeNull()
  })

  // #486 L5: year-band semantics consistent across all input shapes.
  it('accepts the inclusive band edges (1900 and 2200) for YYYY and YYYY-MM', () => {
    expect(formatCharterDate('1900')).toBe('1900')
    expect(formatCharterDate('2200')).toBe('2200')
    expect(formatCharterDate('1900-01')).toBe('January 1900')
    expect(formatCharterDate('2200-12')).toBe('December 2200')
  })

  // #486 L4: ISO datetimes WITHOUT a Z marker must not drift one month
  // when read in a positive-UTC-offset locale. The previous impl used
  // getUTCMonth() on a locally-parsed Date, so '1987-01-01T00:00:00' in
  // a UTC+N locale rendered as "December 1986". Pull year/month from
  // the string instead.
  it('reads ISO datetimes without timezone marker by string parse, not Date', () => {
    expect(formatCharterDate('1987-01-01T00:00:00')).toBe('January 1987')
    expect(formatCharterDate('1987-01-01T05:30:00')).toBe('January 1987')
    expect(formatCharterDate('1987-01-01T00:00:00Z')).toBe('January 1987')
    expect(formatCharterDate('1987-01-01T00:00:00-05:00')).toBe('January 1987')
  })
})
