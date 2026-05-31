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
import { MemoryRouter, Routes, Route } from 'react-router-dom'
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
