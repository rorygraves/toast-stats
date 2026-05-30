/**
 * Tests for ClubDetailPage (#208) — full subpage with routing.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import {
  screen,
  render,
  cleanup,
  within,
  fireEvent,
} from '@testing-library/react'
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

function renderWithRoute(
  clubId: string = '00000606',
  fromClubsSearch?: string
) {
  const entry = fromClubsSearch
    ? {
        pathname: `/district/61/club/${clubId}`,
        state: { fromClubsSearch },
      }
    : `/district/61/club/${clubId}`
  return render(
    <QueryClientProvider client={queryClient}>
      <ProgramYearProvider>
        <DarkModeProvider>
          <MemoryRouter initialEntries={[entry]}>
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

  // #875 (epic #876 Sprint 2, CC-3): the membership trend collapses to a
  // sparkline-then-expand wrapper below 768px. The page's matchMedia mock is
  // writable, so flip the max-width query to mobile for this block only.
  describe('mobile membership-trend collapse (#875)', () => {
    const setMobile = (mobile: boolean) => {
      ;(window.matchMedia as unknown as ReturnType<typeof vi.fn>) = vi
        .fn()
        .mockImplementation((query: string) => ({
          matches: /max-width/.test(query) ? mobile : false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }))
    }
    afterEach(() => setMobile(false))

    it('collapses the mem-chart behind an expand trigger', () => {
      setMobile(true)
      const { container } = renderWithRoute()
      expect(container.querySelector('svg.mem-chart')).toBeNull()
      expect(
        screen.getByRole('button', { name: /expand membership trend chart/i })
      ).toBeInTheDocument()
    })

    it('opens the mem-chart in a sheet when tapped', () => {
      setMobile(true)
      renderWithRoute()
      fireEvent.click(
        screen.getByRole('button', { name: /expand membership trend chart/i })
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      // The sheet is portalled to document.body, not inside `container`.
      expect(document.querySelector('svg.mem-chart')).not.toBeNull()
    })

    it('renders the mem-chart directly at desktop widths', () => {
      setMobile(false)
      const { container } = renderWithRoute()
      expect(container.querySelector('svg.mem-chart')).not.toBeNull()
      expect(
        screen.queryByRole('button', { name: /expand .* chart/i })
      ).not.toBeInTheDocument()
    })
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

  it('self-titles the document with club and district (#780)', () => {
    renderWithRoute()
    // render() flushes the title effect inside act(), so the title is set
    // synchronously — no waitFor (whose polling would leak a deferred render
    // into the next test and consume its mockReturnValueOnce).
    expect(document.title).toBe(
      'St Lawrence Toastmasters — District 61 — Toast Stats'
    )
  })

  it('renders the District › Clubs › Club trail with a Clubs crumb (#577)', () => {
    renderWithRoute()

    // Intermediate Clubs crumb links to the clubs subview so users coming
    // from a filtered list keep their context.
    const clubsCrumb = screen.getByRole('link', { name: 'Clubs' })
    expect(clubsCrumb).toHaveAttribute('href', '/district/61/clubs')

    // The club name is the current page, not a link.
    const current = screen.getByText('St Lawrence Toastmasters', {
      selector: '[aria-current="page"]',
    })
    expect(current).toBeInTheDocument()
  })

  it('round-trips the prior clubs filter into the Clubs crumb (#577)', () => {
    renderWithRoute('00000606', '?status=vulnerable')

    expect(screen.getByRole('link', { name: 'Clubs' })).toHaveAttribute(
      'href',
      '/district/61/clubs?status=vulnerable'
    )
  })

  it('renders a bottom "Back to District" link (#618 redesign re-adds it as an anchor)', () => {
    renderWithRoute()

    // #577 removed the old bottom *button* as redundant with the breadcrumb.
    // The #618 redesign (operator-confirmed, pixel-perfect to
    // club-reference.html) reintroduces a bottom back affordance — but as an
    // anchor link (reference uses a `.back-link` <a>), not a button. The
    // breadcrumb's District crumb still provides top-of-page back nav.
    const backLink = screen.getByRole('link', {
      name: /Back to District 61/i,
    })
    expect(backLink).toHaveAttribute('href', '/district/61')

    // Still no *button* affordance — the reference is an anchor, and we keep
    // a single styled treatment.
    expect(
      screen.queryAllByRole('button', { name: /Back to District 61/i })
    ).toHaveLength(0)
  })

  it('renders membership stats grid with correct net change', () => {
    renderWithRoute()

    // Stats labels — #618 renames "Net Change" → "Net Δ" to match the
    // pixel-perfect club-reference.html stat strip. #619 adds a chart-stats
    // row that ALSO labels "Base"/"Current", so those are now non-unique;
    // scope the assertion to the stats grid.
    const grid = screen
      .getAllByText('Base')
      .map(el => el.closest('.club-stats-grid'))
      .find(Boolean)
    expect(grid).toBeTruthy()
    const inGrid = within(grid as HTMLElement)
    expect(inGrid.getByText('Current')).toBeInTheDocument()
    expect(inGrid.getByText('Net Δ')).toBeInTheDocument()
    expect(inGrid.getByText('DCP Goals')).toBeInTheDocument()

    // Net Δ = -5 (appears in stats grid + chart)
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
    // #619 — label matches club-reference.html ("Outlook", was
    // "Distinguished Outlook"). The "DCP Status" panel header supplies context.
    expect(screen.getByText('Outlook')).toBeInTheDocument()
  })

  // #432 — CHARTERED <Month YYYY> in club hero eyebrow. Only one
  // page-mount test here (the "present" case proves the wiring); the
  // absent case is implicitly covered by all other tests in the file
  // (none of which set charterDate). Keeping integration tests narrow
  // honours Lesson 51 / 53 — every page mount adds parallel-coverage
  // contention pressure.
  it('renders the chartered date segment in the eyebrow when charterDate is present', () => {
    const mockedHook = vi.mocked(useDistrictAnalytics)
    mockedHook.mockReturnValueOnce({
      data: {
        districtId: '61',
        allClubs: [{ ...baseMockClub, charterDate: '1987-02-15' }],
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useDistrictAnalytics>)

    renderWithRoute()

    // The eyebrow text concatenates the club id + chartered date.
    // CSS uppercases it; the JSX source uses mixed case.
    expect(
      screen.getByText(/club #00000606 · chartered february 1987/i)
    ).toBeInTheDocument()
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

  it('positions the call-out between the trend row and the DCP Goals panel (#620)', () => {
    // #620 moves the call-out from above the stats grid to its
    // club-reference.html home: directly below the 2/3 + 1/3 trend row and
    // above the DCP Goals Progress panel.
    setClubOverrides({
      membershipBase: 17,
      membershipTrend: [{ date: '2026-03-15', count: 17 }],
      dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 5 }],
      distinguishedLevel: 'NotDistinguished',
      aprilRenewals: 0,
    })
    const { container } = renderWithRoute()

    const callout = screen.getByRole('region', {
      name: /close to distinguished/i,
    })
    const trendGrid = container.querySelector('.club-trend-grid') as HTMLElement
    const dcpPanel = screen
      .getByText('DCP Goals Progress')
      .closest('.club-panel') as HTMLElement

    // DOCUMENT_POSITION_FOLLOWING (4): the argument node comes after the
    // reference node in document order.
    // trendGrid → callout → dcpPanel.
    expect(trendGrid.compareDocumentPosition(callout)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
    expect(callout.compareDocumentPosition(dcpPanel)).toBe(
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

  it('renders the call-out at the upper boundary — exactly 3 members short (#903)', () => {
    // #903 tightened the members gap from <=4 (old #433) to <=3 (the canonical
    // gapToDistinguished.members rule). 5 goals (gap=0). For memberGap=3:
    //   absoluteGap = 20 - currentMembers = 3 → currentMembers = 17
    //   growthGap   = 3  - netGrowth      ≥ 3 → netGrowth ≤ 0 → base ≥ 17
    setClubOverrides({
      membershipBase: 17,
      membershipTrend: [{ date: '2026-03-15', count: 17 }],
      dcpGoalsTrend: [{ date: '2026-03-15', goalsAchieved: 5 }],
      distinguishedLevel: 'NotDistinguished',
      aprilRenewals: 0,
    })
    renderWithRoute()

    expect(
      screen.getByRole('region', { name: /close to distinguished/i })
    ).toBeInTheDocument()
  })

  it('does NOT render the call-out when 4 members short — just past the #903 threshold', () => {
    // #903: memberGap=4 no longer qualifies (was the old #433 boundary).
    // 5 goals (gap=0). currentMembers=16, base=17 → netGrowth=-1,
    // absoluteGap=4, growthGap=4, memberGap=4.
    setClubOverrides({
      membershipBase: 17,
      membershipTrend: [{ date: '2026-03-15', count: 16 }],
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

// ── Sprint 2 (#619) — Membership Trend chart + DCP Status panel re-skin ──────
describe('Membership Trend + DCP Status re-skin (#619)', () => {
  // Earlier describes use persistent mockReturnValue; reset to the base club
  // so these assertions see the 4-point PY 2025–2026 trend.
  beforeEach(() => {
    vi.mocked(useDistrictAnalytics).mockReturnValue({
      data: { districtId: '61', allClubs: [baseMockClub] },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useDistrictAnalytics>)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the 2/3 + 1/3 row inside .club-trend-grid', () => {
    renderWithRoute()
    const grid = screen
      .getByText('Membership Trend')
      .closest('.club-trend-grid')
    expect(grid).not.toBeNull()
    // both panels live in the same grid
    expect(within(grid as HTMLElement).getByText('DCP Status')).toBeTruthy()
  })

  it('renders the panel meta with an en-dashed program year and data-point count', () => {
    renderWithRoute()
    // baseMockClub has 4 trend points in PY 2025–2026
    expect(
      screen.getByText('Program Year 2025–2026 · 4 data points')
    ).toBeInTheDocument()
  })

  it('renders the chart-stats Change as a signed value + signed percent', () => {
    renderWithRoute()
    // base 46 → current 41 → change -5 → -5/46 = -10.9%
    expect(screen.getByText('-5 (-10.9%)')).toBeInTheDocument()
  })

  it('renders all four key-date verticals labeled Jul 1 / Oct 1 / Apr 1 / Jun 30', () => {
    renderWithRoute()
    expect(screen.getByText('Jul 1')).toBeInTheDocument()
    expect(screen.getByText('Oct 1')).toBeInTheDocument()
    expect(screen.getByText('Apr 1')).toBeInTheDocument()
    expect(screen.getByText('Jun 30')).toBeInTheDocument()
  })

  it('renders the membership chart svg with the .mem-chart class', () => {
    const { container } = renderWithRoute()
    expect(container.querySelector('svg.mem-chart')).not.toBeNull()
  })

  it('renders the Gap to Each Tier section with all four tiers', () => {
    renderWithRoute()
    const section = screen.getByText('Gap to Each Tier').closest('.gap-section')
    expect(section).not.toBeNull()
    const inSection = within(section as HTMLElement)
    expect(inSection.getByText('Distinguished')).toBeInTheDocument()
    expect(inSection.getByText('Select')).toBeInTheDocument()
    expect(inSection.getByText("President's")).toBeInTheDocument()
    expect(inSection.getByText('Smedley')).toBeInTheDocument()
  })
})
