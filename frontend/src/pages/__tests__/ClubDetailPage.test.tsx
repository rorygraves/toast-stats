/**
 * Tests for ClubDetailPage (#208) — full subpage with routing.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, render, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ProgramYearProvider } from '../../contexts/ProgramYearContext'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import ClubDetailPage from '../ClubDetailPage'
import { useDistrictAnalytics } from '../../hooks/useDistrictAnalytics'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock matchMedia (required by DarkModeContext)
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
})

// ── Mock hooks ──────────────────────────────────────────────────────────────

vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: vi.fn(() => ({
    data: {
      districts: [{ id: '61', name: 'District 61' }],
    },
  })),
}))

vi.mock('../../hooks/useDistrictData', () => ({
  useDistrictCachedDates: vi.fn(() => ({
    data: { dates: ['2025-10-15'] },
  })),
}))

const baseMockClub = {
  clubId: '00000606',
  clubName: 'St Lawrence Toastmasters',
  divisionId: 'A',
  divisionName: 'Division A',
  areaId: 'A1',
  areaName: 'Area A1',
  membershipTrend: [
    { date: '2025-07-31', count: 46 },
    { date: '2025-08-31', count: 47 },
    { date: '2025-09-30', count: 51 },
    { date: '2025-10-31', count: 41 },
  ],
  dcpGoalsTrend: [
    { date: '2025-07-31', goalsAchieved: 2 },
    { date: '2025-10-31', goalsAchieved: 8 },
  ],
  membershipBase: 46,
  currentStatus: 'thriving' as const,
  riskFactors: [],
  distinguishedLevel: 'NotDistinguished' as const,
  octoberRenewals: 5,
  aprilRenewals: 3,
  newMembers: 2,
}

vi.mock('../../hooks/useDistrictAnalytics', () => ({
  useDistrictAnalytics: vi.fn(() => ({
    data: {
      districtId: '61',
      allClubs: [baseMockClub],
    },
    isLoading: false,
    error: null,
  })),
  ClubTrend: {},
}))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderWithRoute(clubId: string = '00000606') {
  return render(
    <QueryClientProvider client={queryClient}>
      <ProgramYearProvider>
        <DarkModeProvider>
          <MemoryRouter initialEntries={[`/district/61/club/${clubId}`]}>
            <Routes>
              <Route
                path="/district/:districtId/club/:clubId"
                element={<ClubDetailPage />}
              />
            </Routes>
          </MemoryRouter>
        </DarkModeProvider>
      </ProgramYearProvider>
    </QueryClientProvider>
  )
}

describe('ClubDetailPage (#208)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders club name and breadcrumbs', () => {
    renderWithRoute()

    // Club name appears in breadcrumb + heading
    expect(
      screen.getAllByText('St Lawrence Toastmasters').length
    ).toBeGreaterThanOrEqual(1)

    // Breadcrumbs (#442) — leading 'Home' crumb removed; trail starts at
    // the parent district. The new hero also renders "District 61" in
    // its sub-line, so query the breadcrumb anchor explicitly.
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
    const breadcrumbLink = screen.getByRole('link', { name: 'District 61' })
    expect(breadcrumbLink).toHaveAttribute('href', '/district/61')
  })

  it('renders membership stats grid with correct net change', () => {
    renderWithRoute()

    // Stats labels
    expect(screen.getByText('Base')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('Net Change')).toBeInTheDocument()
    expect(screen.getByText('DCP Goals')).toBeInTheDocument()

    // Net Change = -5 (appears in stats grid + chart)
    expect(screen.getAllByText('-5').length).toBeGreaterThanOrEqual(1)
  })

  it('renders not found state for invalid club ID', () => {
    renderWithRoute('99999999')

    expect(screen.getByText('Club Not Found')).toBeInTheDocument()
  })

  it('renders DCP status section', () => {
    renderWithRoute()

    expect(screen.getByText('DCP Status')).toBeInTheDocument()
    expect(screen.getByText('Current Level')).toBeInTheDocument()
    expect(screen.getByText('Distinguished Outlook')).toBeInTheDocument()
  })

  it('renders DCP Goals Progress section', () => {
    renderWithRoute()

    expect(screen.getByText('DCP Goals Progress')).toBeInTheDocument()
    expect(screen.getByText('8 / 10 goals')).toBeInTheDocument()
  })

  it('renders CSP stat card', () => {
    renderWithRoute()

    expect(screen.getByText('CSP')).toBeInTheDocument()
  })
})

// ============================================================
// Provisional Distinguished Badge — ClubDetailPage (#297, #299)
// ============================================================

describe('Provisional Distinguished Badge — ClubDetailPage', () => {
  afterEach(() => {
    cleanup()
  })

  function setClubOverrides(overrides: Record<string, unknown>) {
    vi.mocked(useDistrictAnalytics).mockReturnValue({
      data: {
        districtId: '61',
        allClubs: [{ ...baseMockClub, ...overrides }],
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useDistrictAnalytics>)
  }

  it('shows "Provisional" when Distinguished and pre-April with low renewals', () => {
    setClubOverrides({
      distinguishedLevel: 'Distinguished',
      aprilRenewals: 3,
      membershipBase: 15,
      membershipTrend: [{ date: '2026-03-15', count: 22 }],
      dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 6 }],
    })
    renderWithRoute()

    // "Provisional" appears in header badge, DCP card, and gap table
    expect(screen.getAllByText(/Provisional/).length).toBeGreaterThanOrEqual(1)
  })

  it('does NOT show "Provisional" when Distinguished is confirmed', () => {
    setClubOverrides({
      distinguishedLevel: 'Select',
      aprilRenewals: 22,
      membershipBase: 15,
      membershipTrend: [{ date: '2026-03-15', count: 22 }],
      dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 8 }],
    })
    renderWithRoute()

    // Badge shows "Select" in gap table and header
    expect(screen.getAllByText('Select').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryAllByText(/Provisional/)).toHaveLength(0)
  })

  it('does NOT show "Provisional" for post-April data', () => {
    setClubOverrides({
      distinguishedLevel: 'Distinguished',
      aprilRenewals: 0,
      membershipBase: 15,
      membershipTrend: [{ date: '2026-05-15', count: 20 }],
      dcpGoalsTrend: [{ date: '2026-05-15', goalsAchieved: 6 }],
    })
    renderWithRoute()

    expect(screen.getAllByText('Distinguished').length).toBeGreaterThanOrEqual(
      1
    )
    expect(screen.queryAllByText(/Provisional/)).toHaveLength(0)
  })

  it('shows confirmed fallback level when provisional', () => {
    setClubOverrides({
      // Aspirational: President's (9 goals + 22 members)
      // Confirmed: Distinguished (renewals=19, base=15, netGrowth=4 >= 3)
      distinguishedLevel: 'President',
      aprilRenewals: 19,
      membershipBase: 15,
      membershipTrend: [{ date: '2026-03-15', count: 22 }],
      dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 9 }],
    })
    renderWithRoute()

    expect(screen.getAllByText(/Provisional/).length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(/Confirmed.*Distinguished/).length
    ).toBeGreaterThanOrEqual(1)
  })
})

// ============================================================
// Close-to-Distinguished call-out banner — chrome refresh (#366)
// ============================================================

describe('Close-to-Distinguished call-out — ClubDetailPage', () => {
  afterEach(() => {
    cleanup()
  })

  function setClubOverrides(overrides: Record<string, unknown>) {
    vi.mocked(useDistrictAnalytics).mockReturnValue({
      data: {
        districtId: '61',
        allClubs: [{ ...baseMockClub, ...overrides }],
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useDistrictAnalytics>)
  }

  it('renders the call-out with redesign chrome class when goals met but members short', () => {
    // 5 goals (gap=0) + 17 members + base 17 (no growth) → memberGap=3
    setClubOverrides({
      membershipBase: 17,
      membershipTrend: [{ date: '2026-03-15', count: 17 }],
      dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 5 }],
      distinguishedLevel: 'NotDistinguished',
      aprilRenewals: 0,
    })
    renderWithRoute()

    const callout = screen.getByRole('region', {
      name: /close to distinguished/i,
    })
    expect(callout).toHaveClass('club-close-to-distinguished')
  })

  it('positions the call-out before the stats grid', () => {
    setClubOverrides({
      membershipBase: 17,
      membershipTrend: [{ date: '2026-03-15', count: 17 }],
      dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 5 }],
      distinguishedLevel: 'NotDistinguished',
      aprilRenewals: 0,
    })
    renderWithRoute()

    const callout = screen.getByRole('region', {
      name: /close to distinguished/i,
    })
    const baseLabel = screen.getByText('Base')
    // DOCUMENT_POSITION_FOLLOWING (4) means callout precedes baseLabel
    expect(callout.compareDocumentPosition(baseLabel)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
  })

  it('does not render the call-out when neither goals nor members close', () => {
    setClubOverrides({
      membershipBase: 8,
      membershipTrend: [{ date: '2026-03-15', count: 10 }],
      dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 1 }],
      distinguishedLevel: 'NotDistinguished',
      aprilRenewals: 0,
    })
    renderWithRoute()

    expect(
      screen.queryByRole('region', { name: /close to distinguished/i })
    ).not.toBeInTheDocument()
  })

  it('renders the call-out at the upper boundary — exactly 4 members short (#433)', () => {
    // 5 goals (gap=0). To get memberGap=4 we need both
    //   absoluteGap = 20 - currentMembers = 4 → currentMembers = 16
    //   growthGap   = 3  - netGrowth      ≥ 4 → netGrowth ≤ -1 → base ≥ 17
    setClubOverrides({
      membershipBase: 17,
      membershipTrend: [{ date: '2026-03-15', count: 16 }],
      dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 5 }],
      distinguishedLevel: 'NotDistinguished',
      aprilRenewals: 0,
    })
    renderWithRoute()

    expect(
      screen.getByRole('region', { name: /close to distinguished/i })
    ).toBeInTheDocument()
  })

  it('does NOT render the call-out when 5 members short — just past the threshold (#433)', () => {
    // 5 goals (gap=0). currentMembers=15, base=17 → netGrowth=-2,
    // absoluteGap=5, growthGap=5, memberGap=5.
    setClubOverrides({
      membershipBase: 17,
      membershipTrend: [{ date: '2026-03-15', count: 15 }],
      dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 5 }],
      distinguishedLevel: 'NotDistinguished',
      aprilRenewals: 0,
    })
    renderWithRoute()

    expect(
      screen.queryByRole('region', { name: /close to distinguished/i })
    ).not.toBeInTheDocument()
  })

  it('does NOT render the call-out when 12 members short — original bug case (#433)', () => {
    // 5 goals (gap=0). currentMembers=8, base=17 → netGrowth=-9,
    // absoluteGap=12, growthGap=12, memberGap=12. This is the screenshot.
    setClubOverrides({
      membershipBase: 17,
      membershipTrend: [{ date: '2026-03-15', count: 8 }],
      dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 5 }],
      distinguishedLevel: 'NotDistinguished',
      aprilRenewals: 0,
    })
    renderWithRoute()

    expect(
      screen.queryByRole('region', { name: /close to distinguished/i })
    ).not.toBeInTheDocument()
  })
})
