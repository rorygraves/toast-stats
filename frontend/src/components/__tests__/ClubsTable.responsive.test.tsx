/**
 * Responsive collapse breakpoint for ClubsTable (#671 → #812).
 *
 * ADR-006 §2 (epic #813 table-UX program) re-establishes the tablet tier: the
 * card view is for TRUE mobile only (`< 768px`), and 768–1279px shows the table
 * with low-priority columns hidden (the priority-column model, #812) rather
 * than the old 640px desktop→mobile cliff (#671). The table→card collapse must
 * therefore key off a 768px breakpoint (matchMedia `(max-width: 767px)`). This
 * asserts the query string ClubsTable hands to matchMedia via useIsMobile —
 * falsifiable: at the old 640 it would read `(max-width: 639px)`.
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

describe('ClubsTable responsive collapse (#671 → #812)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('collapses to cards at the 768px tablet boundary (matchMedia 767px)', () => {
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
    expect(queries).toContain('(max-width: 767px)')
    expect(queries).not.toContain('(max-width: 639px)')
  })
})
