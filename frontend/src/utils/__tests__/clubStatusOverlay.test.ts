import { describe, it, expect } from 'vitest'
import {
  parseVerifiedComplete,
  resolveClubStatusOverlay,
} from '../clubStatusOverlay'

describe('parseVerifiedComplete', () => {
  it('extracts an ISO date from "Verified complete - MM/DD/YYYY"', () => {
    expect(parseVerifiedComplete('Verified complete - 05/31/2026')).toBe(
      '2026-05-31'
    )
    expect(parseVerifiedComplete('Verified complete - 08/09/2025')).toBe(
      '2025-08-09'
    )
  })

  it('tolerates surrounding whitespace and is case-insensitive on the label', () => {
    expect(parseVerifiedComplete('  verified complete - 1/2/2026 ')).toBe(
      '2026-01-02'
    )
  })

  it('returns null for any non-verified status', () => {
    expect(parseVerifiedComplete('Not renewed')).toBeNull()
    expect(parseVerifiedComplete('Pending')).toBeNull()
    expect(parseVerifiedComplete('')).toBeNull()
    // "Verified" without a parseable date is not a promotion signal
    expect(parseVerifiedComplete('Verified complete')).toBeNull()
    expect(parseVerifiedComplete('Verified complete - soon')).toBeNull()
  })
})

describe('resolveClubStatusOverlay (promote-only, provenance)', () => {
  const ASOF = 'June 01, 2026'

  it('promotes a Low/stale base club to Active with provenance + activeSince', () => {
    const overlay = resolveClubStatusOverlay(
      'Low',
      'Verified complete - 05/31/2026',
      ASOF
    )
    expect(overlay).toEqual({
      status: 'Active',
      source: 'dues-renewal',
      activeSince: '2026-05-31',
      asOf: ASOF,
    })
  })

  it('Centretown D61 case (150→151): base Low + verified ⇒ Active, activeSince 2026-05-31', () => {
    const overlay = resolveClubStatusOverlay(
      'Low',
      'Verified complete - 05/31/2026',
      ASOF
    )
    expect(overlay?.status).toBe('Active')
    expect(overlay?.activeSince).toBe('2026-05-31')
    expect(overlay?.source).toBe('dues-renewal')
  })

  it('promotes a Suspended/Ineligible/undefined base when verified (upgrade-only)', () => {
    for (const base of ['Suspended', 'Ineligible', undefined]) {
      const overlay = resolveClubStatusOverlay(
        base,
        'Verified complete - 05/31/2026',
        ASOF
      )
      expect(overlay?.status).toBe('Active')
    }
  })

  it('is a NO-OP when the base is already Active (clean hand-off, no backward jump)', () => {
    expect(
      resolveClubStatusOverlay('Active', 'Verified complete - 05/31/2026', ASOF)
    ).toBeNull()
    // case-insensitive
    expect(
      resolveClubStatusOverlay('active', 'Verified complete - 05/31/2026', ASOF)
    ).toBeNull()
  })

  it('leaves a club unchanged when the renewal report does NOT verify it', () => {
    expect(resolveClubStatusOverlay('Low', 'Not renewed', ASOF)).toBeNull()
    expect(resolveClubStatusOverlay('Low', '', ASOF)).toBeNull()
    expect(
      resolveClubStatusOverlay('Suspended', 'Pending verification', ASOF)
    ).toBeNull()
  })

  it('never produces a status other than Active (promote-only, never demote)', () => {
    // The only status the overlay can ever emit is the top operational state.
    const overlay = resolveClubStatusOverlay(
      'Suspended',
      'Verified complete - 05/31/2026',
      ASOF
    )
    expect(overlay?.status).toBe('Active')
  })

  it('passes through an empty asOf without failing', () => {
    const overlay = resolveClubStatusOverlay(
      'Low',
      'Verified complete - 05/31/2026',
      ''
    )
    expect(overlay).toEqual({
      status: 'Active',
      source: 'dues-renewal',
      activeSince: '2026-05-31',
      asOf: '',
    })
  })
})
