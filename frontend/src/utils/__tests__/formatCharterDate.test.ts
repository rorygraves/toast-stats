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
})
