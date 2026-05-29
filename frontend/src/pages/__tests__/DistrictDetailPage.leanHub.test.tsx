/**
 * Lean Overview hub — IA contract tests (#679, epic #674, ADR-005)
 *
 * Sprint 5 trims `/district/:id` to a lean hub:
 *   - the "On this page" anchor rail (DistrictAnchorToc) is DELETED — the
 *     DistrictSubnav (#678) owns wayfinding at every width (ADR-005 §5);
 *   - the inline Divisions summary and inline "Vs world" blocks are removed
 *     as duplicates of the `/divisions` and `/rankings` routes — but the
 *     subview CTAs that link OUT to those routes must survive, so the content
 *     stays reachable.
 *
 * The rail assertion is the load-bearing red: the rail renders unconditionally
 * (not data-gated), so its absence is a reliable signal. The inline-section
 * removals are enforced at compile time by deleting their components; the CTA
 * guards below prove the link-out path is intact.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, render, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import DistrictDetailPage from '../DistrictDetailPage'
import { ProgramYearProvider } from '../../contexts/ProgramYearContext'

// ---------------------------------------------------------------------------
// Global mocks
// ---------------------------------------------------------------------------

const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
}
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  private readonly callback: (
    entries: IntersectionObserverEntry[],
    observer: IntersectionObserver
  ) => void
  constructor(
    callback: (
      entries: IntersectionObserverEntry[],
      observer: IntersectionObserver
    ) => void
  ) {
    this.callback = callback
  }
  // Fire from observe() (deferred, so lazy children still flush) WITH the
  // observed `target` — conforming to the global setup.ts mock's shape. The
  // old version fired from the constructor with no target, so any callback
  // reading `entry.target` would throw asynchronously (Lesson 72 / V3, #914).
  observe(target: Element): void {
    setTimeout(() => {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this
      )
    }, 0)
  }
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

// ---------------------------------------------------------------------------
// Hook mocks (mirrors the DistrictDetailPage.TrendsTab harness)
// ---------------------------------------------------------------------------

vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: vi.fn(() => ({
    data: { districts: [{ id: 'D42', name: 'Test District 42' }] },
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/useDistrictData', () => ({
  useDistrictCachedDates: vi.fn(() => ({
    data: { dates: ['2024-10-15', '2024-10-01'] },
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
      distinguishedClubs: { total: 0 },
      distinguishedProjection: null,
      thrivingClubs: [],
      topGrowthClubs: [],
      membershipTrend: [{ date: '2024-10-15', count: 999 }],
      divisionRankings: [],
      topPerformingAreas: [],
      totalMembership: 999,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('../../hooks/useMembershipData', () => ({
  useDistrictStatistics: vi.fn(() => ({ data: null, isLoading: false })),
}))

vi.mock('../../hooks/useLeadershipInsights', () => ({
  useLeadershipInsights: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/useDistinguishedClubAnalytics', () => ({
  useDistinguishedClubAnalytics: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/usePaymentsTrend', () => ({
  usePaymentsTrend: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

vi.mock('../../hooks/useTimeSeries', () => ({
  useTimeSeries: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('../../hooks/useAggregatedAnalytics', () => ({
  useAggregatedAnalytics: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    usedFallback: false,
  })),
}))

// Avoid Recharts in JSDOM.
vi.mock('../../components/MembershipTrendChart', () => ({
  MembershipTrendChart: () => <div data-testid="membership-trend-chart" />,
}))
vi.mock('../../components/YearOverYearComparison', () => ({
  YearOverYearComparison: () => <div data-testid="year-over-year-comparison" />,
}))

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderHub() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProgramYearProvider>
        <MemoryRouter initialEntries={['/districts/D42']}>
          <Routes>
            <Route
              path="/districts/:districtId"
              element={<DistrictDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </ProgramYearProvider>
    </QueryClientProvider>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DistrictDetailPage — lean Overview hub (#679)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })
  afterEach(() => cleanup())

  it('does NOT render the "On this page" anchor rail (ADR-005 §5)', async () => {
    renderHub()
    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /district subviews/i })
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByRole('navigation', { name: /on this page/i })
    ).not.toBeInTheDocument()
  })

  it('keeps the subview CTAs linking out to /divisions and /rankings', async () => {
    renderHub()
    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /divisions & areas/i })
      ).toBeInTheDocument()
    })
    expect(
      screen.getByRole('link', { name: /divisions & areas/i })
    ).toHaveAttribute('href', '/district/D42/divisions')
    expect(
      screen.getByRole('link', { name: /global rankings/i })
    ).toHaveAttribute('href', '/district/D42/rankings')
  })

  it('no longer renders the trend charts on the hub — they moved to /trends (#680)', async () => {
    renderHub()
    await waitFor(() => {
      expect(
        screen.getByRole('navigation', { name: /district subviews/i })
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByTestId('membership-trend-chart')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('year-over-year-comparison')
    ).not.toBeInTheDocument()
  })

  it('exposes CTAs to the new /trends and /analytics routes (#680)', async () => {
    renderHub()
    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /membership & payment trends/i })
      ).toBeInTheDocument()
    })
    expect(
      screen.getByRole('link', { name: /membership & payment trends/i })
    ).toHaveAttribute('href', '/district/D42/trends')
    expect(
      screen.getByRole('link', { name: /top clubs & analytics/i })
    ).toHaveAttribute('href', '/district/D42/analytics')
  })
})
