/**
 * AreaPage data parity with the Divisions overview (#1016, epic #1008).
 *
 * Sprint 1 (#1015) gave DivisionPage parity with the Divisions overview via the
 * shared extractDivisionPerformance → DivisionPerformanceCard surface. Sprint 2
 * ports the same recognition-aware data down to the standalone AreaPage: the
 * scoped page must render, for its single area, the same per-area row the
 * overview shows (recognition badge, First/Second Round Visits, Gap-to-D/S/P
 * via AreaPerformanceTable) AND the scoped narrative the overview carries
 * (generateAreaProgressText — the #974/#976 per-area progress prose), all from
 * the snapshot — one source of truth (R6/R8). Per Lesson 147, the recognition
 * surface is fed by the snapshot and must NOT be hidden behind the *other*
 * source's (allClubs) emptiness check.
 */
import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'
import AreaPage from '../AreaPage'

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}))

// Division A, Area 10: one Select Distinguished club (R1 visit done). Area 11:
// two undistinguished clubs (no visits). We scope to Area 10.
const SNAPSHOT = {
  asOfDate: '2026-03-15',
  divisionPerformance: [
    {
      Division: 'A',
      Area: '10',
      'Club Number': '123456',
      'Club Name': 'Ottawa Club',
      'Division Club Base': '3',
      'Area Club Base': '1',
      'Nov Visit award': '1',
      'May Visit award': '0',
    },
    {
      Division: 'A',
      Area: '11',
      'Club Number': '234567',
      'Club Name': 'Vulnerable Club',
      'Division Club Base': '3',
      'Area Club Base': '2',
      'Nov Visit award': '0',
      'May Visit award': '0',
    },
    {
      Division: 'A',
      Area: '11',
      'Club Number': '654321',
      'Club Name': 'Struggling Club',
      'Division Club Base': '3',
      'Area Club Base': '2',
      'Nov Visit award': '0',
      'May Visit award': '0',
    },
  ],
  clubPerformance: [
    {
      'Club Number': '123456',
      'Club Name': 'Ottawa Club',
      'Club Status': 'Active',
      'Club Distinguished Status': 'Select Distinguished',
    },
    {
      'Club Number': '234567',
      'Club Name': 'Vulnerable Club',
      'Club Status': 'Active',
      'Club Distinguished Status': '',
    },
    {
      'Club Number': '654321',
      'Club Name': 'Struggling Club',
      'Club Status': 'Active',
      'Club Distinguished Status': '',
    },
  ],
}

vi.mock('../../hooks/useMembershipData', () => ({
  useDistrictStatistics: vi.fn(() => ({
    data: SNAPSHOT,
    isLoading: false,
    error: null,
  })),
}))

const CLUB: ClubTrend = {
  clubId: '123456',
  clubName: 'Ottawa Club',
  divisionId: 'A',
  divisionName: 'Division A',
  areaId: '10',
  areaName: 'Area 10',
  distinguishedLevel: 'Select Distinguished',
  currentStatus: 'thriving',
  riskFactors: [],
  membershipTrend: [{ date: '2026-03-15', count: 25 }],
  dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 8 }],
}

vi.mock('../../hooks/useDistrictAnalytics', async () => {
  const actual = await vi.importActual<
    typeof import('../../hooks/useDistrictAnalytics')
  >('../../hooks/useDistrictAnalytics')
  return {
    ...actual,
    useDistrictAnalytics: vi.fn(() => ({
      data: { allClubs: [CLUB] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })),
  }
})

function renderArea() {
  return render(
    <MemoryRouter initialEntries={['/district/61/division/A/area/10']}>
      <Routes>
        <Route
          path="/district/:districtId/division/:divId/area/:areaId"
          element={<AreaPage />}
        />
      </Routes>
    </MemoryRouter>
  )
}

afterEach(() => cleanup())

describe('AreaPage data parity with the Divisions overview (#1016)', () => {
  it('renders the per-area recognition badge from the snapshot', () => {
    const { getAllByLabelText } = renderArea()
    expect(
      getAllByLabelText(/Recognition status:/i).length
    ).toBeGreaterThanOrEqual(1)
  })

  it('renders the per-area First/Second Round Visit columns', () => {
    const { getByText } = renderArea()
    expect(getByText('First Round Visits')).toBeInTheDocument()
    expect(getByText('Second Round Visits')).toBeInTheDocument()
  })

  it('renders Gap-to-D / S / P columns from the shared area performance row', () => {
    const { getByText } = renderArea()
    expect(getByText('Gap to D')).toBeInTheDocument()
    expect(getByText('Gap to S')).toBeInTheDocument()
    expect(getByText('Gap to P')).toBeInTheDocument()
  })

  it('renders the scoped areaProgressText narrative for this area', () => {
    const { getByTestId } = renderArea()
    const narrative = getByTestId('area-progress-text')
    // The generator always prefixes the area label "Area <id> (Division <id>)".
    expect(narrative.textContent).toMatch(/Area 10 \(Division A\)/)
  })

  it('still renders the recognition surface when allClubs has no rows for the area', async () => {
    // Parity surface is fed by the snapshot, not allClubs. An area with snapshot
    // data but zero analytics-club rows (suspended/migrated clubs, or a casing
    // skew) must still show parity data — not a bare "No clubs" placeholder that
    // hides it (Lesson 147, inherited from Sprint 1 #1015).
    const mod = await import('../../hooks/useDistrictAnalytics')
    const spy = mod.useDistrictAnalytics as unknown as ReturnType<typeof vi.fn>
    spy.mockReturnValueOnce({
      data: { allClubs: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    const { getAllByLabelText, getByTestId } = renderArea()
    expect(
      getAllByLabelText(/Recognition status:/i).length
    ).toBeGreaterThanOrEqual(1)
    expect(getByTestId('area-progress-text').textContent).toMatch(
      /Area 10 \(Division A\)/
    )
  })
})
