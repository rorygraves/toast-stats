import { describe, expect, it } from 'vitest'
import { hasDescriptiveName } from '../districtName'

describe('hasDescriptiveName', () => {
  it('returns false for undefined', () => {
    expect(hasDescriptiveName(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(hasDescriptiveName('')).toBe(false)
  })

  it('returns false for a bare district number (TI CSV default)', () => {
    expect(hasDescriptiveName('86')).toBe(false)
    expect(hasDescriptiveName('110')).toBe(false)
  })

  it('returns false for whitespace-wrapped bare number', () => {
    expect(hasDescriptiveName('  57  ')).toBe(false)
  })

  it('returns true for a descriptive district name', () => {
    expect(hasDescriptiveName('District 57 Carolinas')).toBe(true)
    expect(hasDescriptiveName('Greater Toronto')).toBe(true)
  })

  it('returns true for any non-numeric content', () => {
    expect(hasDescriptiveName('D86')).toBe(true)
  })
})
