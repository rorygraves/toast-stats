/**
 * Responsive collapse breakpoint for ClubsTable (#671, epic #665 Sprint 5).
 *
 * HANDOFF §126: "Tables in District page collapse to card layout under
 * ~640px." The table→card collapse must therefore key off a 640px breakpoint
 * (matchMedia `(max-width: 639px)`), not the legacy 768px. This asserts the
 * query string ClubsTable hands to matchMedia via useIsMobile — falsifiable:
 * at 768 it would read `(max-width: 767px)`.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'

const CLUB: ClubTrend = {
  clubId: 'c1',
  clubName: 'Alpha',
  divisionId: 'div-1',
  divisionName: 'Division A',
  areaId: 'area-1',
  areaName: 'Area 1',
  distinguishedLevel: 'NotDistinguished',
  currentStatus: 'thriving',
  riskFactors: [],
  membershipTrend: [{ date: new Date().toISOString(), count: 20 }],
  dcpGoalsTrend: [{ date: new Date().toISOString(), goalsAchieved: 5 }],
}

describe('ClubsTable responsive collapse (#671)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('collapses to cards at the 640px breakpoint (matchMedia 639px)', () => {
    const queries: string[] = []
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => {
        queries.push(query)
        return {
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }
      })
    )
    render(<ClubsTable clubs={[CLUB]} districtId="61" isLoading={false} />)
    expect(queries).toContain('(max-width: 639px)')
    expect(queries).not.toContain('(max-width: 767px)')
  })
})
