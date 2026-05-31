import { describe, it, expect } from 'vitest'
import { resolveRouteRecovery } from '../errorRecovery'
import { DISTRICT_SECTIONS } from '../../components/DistrictSubnav'

/* Route-aware smart recovery resolver (#1012, epic #1010 Sprint 2).
 *
 * Pure function: given the attempted (unmatched) pathname and the set of valid
 * district ids, decide what destinations to suggest on the branded error page.
 * Kept pure + unit-tested here (no page mount → R22) so the rendering layer in
 * ErrorPage stays a thin consumer. */

const D61 = ['61', '42', '7']

describe('resolveRouteRecovery', () => {
  describe('malformed /district/:id with a VALID id', () => {
    it("suggests the district's real subpages", () => {
      const r = resolveRouteRecovery('/district/61/dude', D61)
      expect(r.kind).toBe('district-subpages')
      expect(r.districtId).toBe('61')
      // Every suggestion is a REAL route built from the canonical section list
      // (no invented destinations — same single source DistrictSubnav uses).
      const expected = DISTRICT_SECTIONS.map(({ label, segment }) => ({
        label,
        to: segment ? `/district/61/${segment}` : '/district/61',
      }))
      expect(r.suggestions).toEqual(expected)
    })

    it('points the Overview suggestion at the bare hub URL', () => {
      const r = resolveRouteRecovery('/district/42/nonsense', D61)
      const overview = r.suggestions.find(s => s.label === 'Overview')
      expect(overview?.to).toBe('/district/42')
    })
  })

  describe('malformed /district/:id with an UNKNOWN id', () => {
    it('suggests the districts index, not subpages', () => {
      const r = resolveRouteRecovery('/district/zzz/whatever', D61)
      expect(r.kind).toBe('districts-index')
      expect(r.suggestions).toEqual([{ label: 'All districts', to: '/' }])
    })
  })

  describe('districts not loaded yet (empty valid set)', () => {
    it('falls back to the districts index (cannot confirm the id)', () => {
      const r = resolveRouteRecovery('/district/61/dude', [])
      expect(r.kind).toBe('districts-index')
      expect(r.suggestions).toEqual([{ label: 'All districts', to: '/' }])
    })
  })

  describe('a /district path with no id segment', () => {
    it('treats /district/ as the districts index', () => {
      const r = resolveRouteRecovery('/district/', D61)
      expect(r.kind).toBe('districts-index')
    })
  })

  describe('a non-district path', () => {
    it('returns kind=none with no suggestions (Home + Back only)', () => {
      const r = resolveRouteRecovery('/totally/unknown', D61)
      expect(r.kind).toBe('none')
      expect(r.suggestions).toEqual([])
    })

    it('does not treat the landing path as a district recovery', () => {
      const r = resolveRouteRecovery('/', D61)
      expect(r.kind).toBe('none')
    })
  })
})
