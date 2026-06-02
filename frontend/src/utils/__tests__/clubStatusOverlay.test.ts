import { describe, it, expect } from 'vitest'
import type { DistrictReportsDataset } from '@toastmasters/shared-contracts'
import {
  parseVerifiedComplete,
  resolveClubStatusOverlay,
  buildDuesRenewalLookup,
  applyDuesRenewalOverlay,
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

const datasetWith = (
  sections: DistrictReportsDataset['sections']
): DistrictReportsDataset => ({
  districtId: '61',
  programYear: '2025-2026',
  generatedAt: '2026-06-01T00:00:00.000Z',
  sections,
})

const duesSection = (
  asOf: string,
  records: Array<{ club: string; renewalStatus: string; name?: string }>
) => ({
  sources: [{ reportType: 'dues-renewal', tableId: '0235cdd5', asOf } as const],
  records: records.map(r => ({
    club: r.club,
    division: 'D',
    area: '33',
    renewalStatus: r.renewalStatus,
    name: r.name ?? 'A Club',
    location: 'Ottawa',
  })),
})

describe('buildDuesRenewalLookup (join key = club number, provenance asOf)', () => {
  it('returns an empty map for a null/absent dataset', () => {
    expect(buildDuesRenewalLookup(null).size).toBe(0)
    expect(buildDuesRenewalLookup(datasetWith({})).size).toBe(0)
  })

  it('maps each club number to its renewalStatus + the section asOf', () => {
    const ds = datasetWith({
      octoberDuesRenewal: duesSection('June 01, 2026', [
        { club: '1009147', renewalStatus: 'Verified complete - 05/31/2026' },
        { club: '7777777', renewalStatus: 'Not renewed' },
      ]),
    })
    const map = buildDuesRenewalLookup(ds)
    expect(map.get('1009147')).toEqual({
      renewalStatus: 'Verified complete - 05/31/2026',
      asOf: 'June 01, 2026',
    })
    expect(map.get('7777777')).toEqual({
      renewalStatus: 'Not renewed',
      asOf: 'June 01, 2026',
    })
  })

  it('prefers the LATER verified-complete record when a club appears in both seasons', () => {
    const ds = datasetWith({
      aprilDuesRenewal: duesSection('April 02, 2026', [
        { club: '1009147', renewalStatus: 'Verified complete - 04/01/2026' },
      ]),
      octoberDuesRenewal: duesSection('June 01, 2026', [
        { club: '1009147', renewalStatus: 'Verified complete - 05/31/2026' },
      ]),
    })
    const map = buildDuesRenewalLookup(ds)
    expect(map.get('1009147')).toEqual({
      renewalStatus: 'Verified complete - 05/31/2026',
      asOf: 'June 01, 2026',
    })
  })
})

describe('applyDuesRenewalOverlay (join onto clubs at the assembly site)', () => {
  type C = { clubId: string; clubStatus?: string; statusOverlay?: unknown }
  const centretownDataset = datasetWith({
    octoberDuesRenewal: duesSection('June 01, 2026', [
      { club: '1009147', renewalStatus: 'Verified complete - 05/31/2026' },
      { club: '2222222', renewalStatus: 'Not renewed' },
    ]),
  })

  it('attaches the overlay only to verified, non-Active clubs (Centretown 150→151)', () => {
    const clubs: C[] = [
      { clubId: '1009147', clubStatus: 'Low' }, // Centretown: promoted
      { clubId: '2222222', clubStatus: 'Low' }, // not renewed: unchanged
      { clubId: '3333333', clubStatus: 'Low' }, // absent from report: unchanged
      { clubId: '4444444', clubStatus: 'Active' }, // base-Active: no-op
    ]
    applyDuesRenewalOverlay(clubs, buildDuesRenewalLookup(centretownDataset))

    expect(clubs[0]!.statusOverlay).toEqual({
      status: 'Active',
      source: 'dues-renewal',
      activeSince: '2026-05-31',
      asOf: 'June 01, 2026',
    })
    expect(clubs[1]!.statusOverlay).toBeUndefined()
    expect(clubs[2]!.statusOverlay).toBeUndefined()
    expect(clubs[3]!.statusOverlay).toBeUndefined()
    // The base status is NEVER mutated — overlay is read-time only.
    expect(clubs[0]!.clubStatus).toBe('Low')
  })

  it('is a no-op when the lookup is empty (graceful absence)', () => {
    const clubs: C[] = [{ clubId: '1009147', clubStatus: 'Low' }]
    applyDuesRenewalOverlay(clubs, buildDuesRenewalLookup(null))
    expect(clubs[0]!.statusOverlay).toBeUndefined()
  })
})
