// Full-page axe scan of DistrictDetailPage (#564 Phase 4).
//
// Phase 4 of the contrast audit closes the loop with two guards:
//   1. `unmitigated-color-utilities.test.ts` — static scan for color
//      utilities used in components without a dark-mode override.
//   2. THIS FILE — axe-core scan of the rendered DOM in both light and
//      dark themes. Catches the structural a11y regressions that the
//      static scan can't (ARIA, semantic structure, labels, focus order).
//
// Known JSDOM limitation: axe-core's `color-contrast` rule is auto-
// disabled in JSDOM (no canvas → no computed color). Contrast coverage
// therefore lives in `contrastRequirements.test.ts` (property tests on
// the calculator) and `unmitigated-color-utilities.test.ts` (static
// presence-of-override check). This file's job is the rest of WCAG
// 2.1 AA — and to surface theme-toggle regressions where a dark-mode
// override drops an ARIA-affecting class.
//
// The dark-mode sweep matters because some dark-mode overrides change
// or hide elements (e.g. swapping an SVG illustration). Axe runs the
// full WCAG rule set on the dark DOM tree, not just the light one.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import DistrictDetailPage from '../../pages/DistrictDetailPage'

// @ts-expect-error - jest-axe matcher types vs vitest expect
expect.extend(toHaveNoViolations)

// Mount cost is the full DistrictDetailPage with lazy children. Honest
// ceiling — same category as DistrictsPage.a11y.test.tsx (line 13).
vi.setConfig({ testTimeout: 15000 })

// IntersectionObserver mock (lazy children need to flush). Mirrors the
// shape from DistrictDetailPage.AnalyticsTab.test.tsx — note Lesson 72:
// callbacks consuming `entry.target` must guard with `?.`.
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  constructor(
    callback: (
      entries: IntersectionObserverEntry[],
      observer: IntersectionObserver
    ) => void
  ) {
    setTimeout(() => {
      callback([{ isIntersecting: true } as IntersectionObserverEntry], this)
    }, 0)
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}
Object.defineProperty(global, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true,
})

// Hook mocks — same surface as DistrictDetailPage.AnalyticsTab.test.tsx
// so we test the page chrome + scaffolding, not the data layer.
vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: vi.fn(() => ({
    data: { districts: [{ id: '57', name: 'District 57' }] },
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/useDistrictAnalytics', () => ({
  useDistrictAnalytics: vi.fn(() => ({
    data: {
      allClubs: [],
      interventionRequiredClubs: [],
      vulnerableClubs: [],
      distinguishedClubs: { total: 10 },
      distinguishedProjection: null,
      thrivingClubs: [],
      divisionRankings: [],
      topPerformingAreas: [],
      membershipTrend: [],
      topGrowthClubs: [],
      totalMembership: 1000,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('../../hooks/useMembershipData', () => ({
  useDistrictStatistics: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../hooks/usePerformanceTargets', () => ({
  usePerformanceTargets: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../hooks/usePaymentsTrend', () => ({
  usePaymentsTrend: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../hooks/useDistrictData', () => ({
  useDistrictCachedDates: vi.fn(() => ({
    data: { dates: ['2024-01-15', '2024-01-01'] },
    isLoading: false,
  })),
}))

vi.mock('../../contexts/ProgramYearContext', () => ({
  useProgramYear: vi.fn(() => ({
    selectedProgramYear: {
      year: 2024,
      startDate: '2024-07-01',
      endDate: '2025-06-30',
      label: '2024-2025',
    },
    setSelectedProgramYear: vi.fn(),
    selectedDate: null,
    setSelectedDate: vi.fn(),
  })),
}))

// Heavy lazy children get stubbed so axe scans the page chrome, not
// duplicated coverage of the child components (each has its own axe
// test in src/__tests__/accessibility/).
vi.mock('../../components/GlobalRankingsTab', () => ({
  default: vi.fn(() => <div data-testid="global-rankings-tab-stub" />),
}))

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(
    [{ path: '/district/:districtId', element: <DistrictDetailPage /> }],
    { initialEntries: ['/district/57'] }
  )
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('DistrictDetailPage — axe-core scan in light and dark mode (#564 Phase 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure clean theme state per test. Source of truth is the
    // document-root attribute; the app's DarkModeContext writes to it.
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    cleanup()
    document.documentElement.removeAttribute('data-theme')
  })

  it('has no axe violations in light mode (default theme)', async () => {
    const { container } = renderPage()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations in dark mode ([data-theme=dark] on root)', async () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    const { container } = renderPage()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// Reuses the routed hub mount (renderPage at /district/57) to prove the
// hub wires the lateral subnav with Overview active (#678, ADR-005 §3).
describe('DistrictDetailPage — section subnav wiring (#678)', () => {
  afterEach(() => cleanup())

  it('renders the subnav with Overview marked active on the hub', () => {
    renderPage()
    const subnav = screen.getByRole('navigation', { name: 'District sections' })
    expect(subnav).toBeInTheDocument()
    const overview = screen.getByRole('link', {
      name: 'Overview',
      current: 'page',
    })
    expect(overview).toHaveAttribute('href', '/district/57')
  })
})
