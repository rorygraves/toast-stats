/**
 * Wayfinding for the scoped Division/Area pages (#1017, epic #1008 Sprint 3).
 *
 * Sprint 3 replaces the ad-hoc `districts-page-header__eyebrow` single-link with
 * the standard `SubpageBreadcrumb` every other routed sub-page uses (Lesson 085),
 * so both pages render a proper District › Division › Area trail with a strong
 * link affordance and `aria-current` on the leaf. It also validates the slug:
 * an unknown division/area id throws a 404 that the root errorElement renders as
 * the branded not-found page (#1011/#1012) — not an empty "no clubs" page.
 */
import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import {
  MemoryRouter,
  Routes,
  Route,
  createMemoryRouter,
  RouterProvider,
  useRouteError,
  isRouteErrorResponse,
} from 'react-router-dom'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'
import DivisionPage from '../DivisionPage'
import AreaPage from '../AreaPage'

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
  ],
  clubPerformance: [
    {
      'Club Number': '123456',
      'Club Name': 'Ottawa Club',
      'Club Status': 'Active',
      'Club Distinguished Status': 'Select Distinguished',
    },
  ],
}

vi.mock('../../hooks/useIsMobile', () => ({ useIsMobile: () => false }))

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

function renderDivision(path = '/district/61/division/A') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/district/:districtId/division/:divId"
          element={<DivisionPage />}
        />
      </Routes>
    </MemoryRouter>
  )
}

function renderArea(path = '/district/61/division/A/area/10') {
  return render(
    <MemoryRouter initialEntries={[path]}>
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

describe('DivisionPage wayfinding (#1017)', () => {
  it('renders a SubpageBreadcrumb with District (link) › Division (current)', () => {
    const { getByRole } = renderDivision()
    const nav = getByRole('navigation', { name: 'Breadcrumb' })
    const districtLink = within(nav).getByRole('link', { name: 'District 61' })
    expect(districtLink).toHaveAttribute('href', '/district/61')
    // Leaf crumb is the current page, not a link.
    const current = within(nav).getByText('Division A')
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current.closest('a')).toBeNull()
  })
})

describe('AreaPage wayfinding (#1017)', () => {
  it('renders District (link) › Division (link) › Area (current)', () => {
    const { getByRole } = renderArea()
    const nav = getByRole('navigation', { name: 'Breadcrumb' })
    expect(
      within(nav).getByRole('link', { name: 'District 61' })
    ).toHaveAttribute('href', '/district/61')
    expect(
      within(nav).getByRole('link', { name: 'Division A' })
    ).toHaveAttribute('href', '/district/61/division/A')
    const current = within(nav).getByText('Area 10')
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current.closest('a')).toBeNull()
  })
})

// --- Slug validation → branded 404 (#1017) ---------------------------------
// A bad division/area id must throw a 404 Response so the root errorElement
// (#1011/#1012) renders the branded not-found page, NOT an empty "no clubs"
// page. The throw-to-boundary mechanism only exists in a data router, so these
// tests mount via createMemoryRouter with a test boundary that reports the
// thrown status.
function StatusBoundary() {
  const err = useRouteError()
  return (
    <div data-testid="boundary">
      {isRouteErrorResponse(err) ? err.status : 'non-response'}
    </div>
  )
}

function renderViaDataRouter(
  path: string,
  routePath: string,
  Element: React.ComponentType
) {
  const router = createMemoryRouter(
    [
      {
        path: routePath,
        element: <Element />,
        errorElement: <StatusBoundary />,
      },
    ],
    { initialEntries: [path] }
  )
  return render(<RouterProvider router={router} />)
}

describe('DivisionPage slug validation (#1017)', () => {
  it('throws a 404 for a division id absent from the snapshot', () => {
    const { getByTestId } = renderViaDataRouter(
      '/district/61/division/Z',
      '/district/:districtId/division/:divId',
      DivisionPage
    )
    expect(getByTestId('boundary')).toHaveTextContent('404')
  })

  it('does NOT throw for a valid division id', () => {
    const { queryByTestId } = renderViaDataRouter(
      '/district/61/division/A',
      '/district/:districtId/division/:divId',
      DivisionPage
    )
    expect(queryByTestId('boundary')).toBeNull()
  })
})

describe('AreaPage slug validation (#1017)', () => {
  it('throws a 404 for an area id absent from the snapshot', () => {
    const { getByTestId } = renderViaDataRouter(
      '/district/61/division/A/area/99',
      '/district/:districtId/division/:divId/area/:areaId',
      AreaPage
    )
    expect(getByTestId('boundary')).toHaveTextContent('404')
  })

  it('throws a 404 when the division id itself is unknown', () => {
    const { getByTestId } = renderViaDataRouter(
      '/district/61/division/Z/area/10',
      '/district/:districtId/division/:divId/area/:areaId',
      AreaPage
    )
    expect(getByTestId('boundary')).toHaveTextContent('404')
  })

  it('does NOT throw for a valid area id', () => {
    const { queryByTestId } = renderViaDataRouter(
      '/district/61/division/A/area/10',
      '/district/:districtId/division/:divId/area/:areaId',
      AreaPage
    )
    expect(queryByTestId('boundary')).toBeNull()
  })
})
