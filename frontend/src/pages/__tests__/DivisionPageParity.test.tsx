/**
 * DivisionPage data parity with the Divisions overview (#1015, epic #1008).
 *
 * The standalone DivisionPage used to render four ad-hoc KPI cards
 * (Clubs / Total Members / Thriving / Needs Attention) computed from
 * `allClubs` — a *different* computation than the overview, with no
 * recognition status, gap analysis, or per-area visit metrics. This test
 * pins the parity target: the page must render the shared
 * `extractDivisionPerformance` → `DivisionPerformanceCard` surface for the
 * scoped division (DivisionSummary status + Gap-to-D/S/P, AreaPerformanceTable
 * with First/Second Round Visits + recognition badge), so it matches the
 * overview's division+areas data from one source of truth (R6/R8).
 */
import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'
import DivisionPage from '../DivisionPage'

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}))

// Two clubs in Division A: one Select Distinguished (area 10, R1 visit done),
// two undistinguished (area 11, no visits). base 3 → required distinguished
// ceil(3 * 0.45) = 2, so the division sits below Distinguished with a Gap-to-D
// of 1 and area 10 has a met first-round visit while area 11 does not.
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

function renderDivision() {
  return render(
    <MemoryRouter initialEntries={['/district/61/division/A']}>
      <Routes>
        <Route
          path="/district/:districtId/division/:divId"
          element={<DivisionPage />}
        />
      </Routes>
    </MemoryRouter>
  )
}

afterEach(() => cleanup())

describe('DivisionPage data parity with the Divisions overview (#1015)', () => {
  it('renders the division recognition status badge', () => {
    const { getByRole } = renderDivision()
    const badge = getByRole('status', { name: /Division status:/i })
    expect(badge).toBeInTheDocument()
  })

  it('renders Gap-to-D / S / P indicators from the shared gap analysis', () => {
    const { container } = renderDivision()
    expect(container.querySelector('[data-testid="gap-to-d"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="gap-to-s"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="gap-to-p"]')).not.toBeNull()
  })

  it('renders the per-area First/Second Round Visit columns', () => {
    const { getByText } = renderDivision()
    expect(getByText('First Round Visits')).toBeInTheDocument()
    expect(getByText('Second Round Visits')).toBeInTheDocument()
  })

  it('renders a per-area recognition badge (source-of-truth #832 gate)', () => {
    const { getAllByLabelText } = renderDivision()
    expect(
      getAllByLabelText(/Recognition status:/i).length
    ).toBeGreaterThanOrEqual(1)
  })

  it('drops the ad-hoc "Needs Attention" KPI card (swapped for shared data)', () => {
    const { queryByText } = renderDivision()
    expect(queryByText('Needs Attention')).toBeNull()
  })

  it('still renders the recognition card when allClubs has no rows for the division', async () => {
    // The recognition card is fed by the snapshot, not allClubs. A division
    // with snapshot data but zero analytics-club rows (suspended/migrated
    // clubs, or a casing skew) must still show parity data — not a bare
    // "No clubs found" placeholder that hides it.
    const mod = await import('../../hooks/useDistrictAnalytics')
    const spy = mod.useDistrictAnalytics as unknown as ReturnType<typeof vi.fn>
    spy.mockReturnValueOnce({
      data: { allClubs: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    const { getByRole, queryByText } = renderDivision()
    expect(
      getByRole('status', { name: /Division status:/i })
    ).toBeInTheDocument()
    expect(queryByText('No clubs found in this division.')).toBeNull()
  })
})
