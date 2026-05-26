import { describe, it, expect } from 'vitest'
import { redirectLegacyDistrictTab } from '../legacyTabRedirect'

/* #571, epic #568 Phase 3 — generalize the legacy `?tab=…` redirect
   so divisions / globalRankings (and the existing clubs handler) all
   land on their new route URLs. */

describe('redirectLegacyDistrictTab', () => {
  const base = (qs: string) => `http://localhost/district/61?${qs}`

  describe('non-matching URLs', () => {
    it('returns null when no tab param is present', () => {
      expect(redirectLegacyDistrictTab(base(''), '61')).toBeNull()
    })

    it('returns null for unknown tab values', () => {
      expect(
        redirectLegacyDistrictTab(base('tab=somethingElse'), '61')
      ).toBeNull()
    })

    it('returns null when districtId is missing', () => {
      expect(
        redirectLegacyDistrictTab(base('tab=divisions'), undefined)
      ).toBeNull()
    })
  })

  describe('tab=clubs', () => {
    it('translates f_status / f_name into status / search', () => {
      const out = redirectLegacyDistrictTab(
        base('tab=clubs&f_status=vulnerable&f_name=acme'),
        '61'
      )
      expect(out).toBe('/district/61/clubs?status=vulnerable&search=acme')
    })

    it('preserves sort / dir but strips legacy page (#667)', () => {
      // #667 (epic #665) — pagination removed; the obsolete ?page= param
      // is dropped from the redirect target while sort/dir carry through.
      const out = redirectLegacyDistrictTab(
        base('tab=clubs&sort=members&dir=desc&page=2'),
        '61'
      )
      expect(out).toBe('/district/61/clubs?sort=members&dir=desc')
    })

    it('maps intervention-required → intervention', () => {
      const out = redirectLegacyDistrictTab(
        base('tab=clubs&f_status=intervention-required'),
        '61'
      )
      expect(out).toBe('/district/61/clubs?status=intervention')
    })
  })

  describe('tab=divisions', () => {
    it('redirects to /district/:id/divisions with no extra params', () => {
      const out = redirectLegacyDistrictTab(base('tab=divisions'), '61')
      expect(out).toBe('/district/61/divisions')
    })

    it('preserves unrelated params (e.g. date)', () => {
      const out = redirectLegacyDistrictTab(
        base('tab=divisions&date=2026-04-30'),
        '61'
      )
      expect(out).toBe('/district/61/divisions?date=2026-04-30')
    })
  })

  describe('tab=globalRankings', () => {
    it('redirects to /district/:id/rankings with no extra params', () => {
      const out = redirectLegacyDistrictTab(base('tab=globalRankings'), '61')
      expect(out).toBe('/district/61/rankings')
    })

    it('renames rank_metric → metric and maps clubs → paid', () => {
      const out = redirectLegacyDistrictTab(
        base('tab=globalRankings&rank_metric=clubs'),
        '61'
      )
      expect(out).toBe('/district/61/rankings?metric=paid')
    })

    it('passes through payments / distinguished / aggregate metric values', () => {
      const out = redirectLegacyDistrictTab(
        base('tab=globalRankings&rank_metric=payments'),
        '61'
      )
      expect(out).toBe('/district/61/rankings?metric=payments')
    })

    it('preserves unrelated params', () => {
      const out = redirectLegacyDistrictTab(
        base('tab=globalRankings&date=2026-04-30'),
        '61'
      )
      expect(out).toBe('/district/61/rankings?date=2026-04-30')
    })
  })

  // #680 (epic #674 Sprint 6) — Trends and Analytics moved off the hub onto
  // their own routes, so their legacy `?tab=` deep links redirect too.
  describe('tab=trends', () => {
    it('redirects to /district/:id/trends with no extra params', () => {
      expect(redirectLegacyDistrictTab(base('tab=trends'), '61')).toBe(
        '/district/61/trends'
      )
    })

    it('preserves unrelated params (e.g. date)', () => {
      expect(
        redirectLegacyDistrictTab(base('tab=trends&date=2026-04-30'), '61')
      ).toBe('/district/61/trends?date=2026-04-30')
    })
  })

  describe('tab=analytics', () => {
    it('redirects to /district/:id/analytics with no extra params', () => {
      expect(redirectLegacyDistrictTab(base('tab=analytics'), '61')).toBe(
        '/district/61/analytics'
      )
    })

    it('preserves unrelated params (e.g. date)', () => {
      expect(
        redirectLegacyDistrictTab(base('tab=analytics&date=2026-04-30'), '61')
      ).toBe('/district/61/analytics?date=2026-04-30')
    })
  })
})
