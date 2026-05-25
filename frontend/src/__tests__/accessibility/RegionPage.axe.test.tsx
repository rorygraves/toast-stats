// Full-page axe scan of RegionPage (`/region/:n`) in light + dark (#687).
//
// Sprint 4 of epic #683 restructured the district table into a two-tier
// grouped header (rowSpan=2 liked columns + colSpan=3 metric groups over
// Base/Current/Δ sub-headers). This guards that the new header structure
// stays WCAG 2.1 AA clean — scope attributes, header/cell association, and
// the table's accessible name.
//
// Known JSDOM limitation (Lesson 075): axe's `color-contrast` rule is
// auto-disabled under JSDOM. Contrast for this surface is covered by
// RegionDarkModeContrast.test.ts; this file owns the structural rules.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RegionPage from '../../pages/RegionPage'

// @ts-expect-error - jest-axe matcher types vs vitest expect
expect.extend(toHaveNoViolations)

vi.mock('../../services/cdn', () => {
  const ranking = (districtId: string, region: string, score: number) => ({
    districtId,
    districtName: `District ${districtId}`,
    region,
    paidClubs: 50,
    paidClubBase: 48,
    clubGrowthPercent: 4,
    totalPayments: 2000,
    paymentBase: 1900,
    paymentGrowthPercent: 5,
    activeClubs: 50,
    distinguishedClubs: 20,
    selectDistinguished: 5,
    presidentsDistinguished: 3,
    distinguishedPercent: 40,
    clubsRank: 1,
    paymentsRank: 1,
    distinguishedRank: 1,
    overallRank: 1,
    aggregateScore: score,
  })
  return {
    fetchCdnRankings: vi.fn().mockResolvedValue({
      date: '2026-05-12',
      rankings: [ranking('60', '07', 500), ranking('61', '07', 350)],
    }),
    fetchCdnCompetitiveAwards: vi.fn().mockResolvedValue(null),
    fetchCdnManifest: vi.fn().mockResolvedValue({
      latestSnapshotDate: '2026-05-12',
      generatedAt: 'x',
    }),
  }
})

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/region/07']}>
        <Routes>
          <Route path="/region/:n" element={<RegionPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => document.documentElement.removeAttribute('data-theme'))
afterEach(() => {
  document.documentElement.removeAttribute('data-theme')
  cleanup()
})

describe('RegionPage axe scan (#687)', () => {
  it('has no structural a11y violations in light mode', async () => {
    const { container } = renderPage()
    await screen.findByRole('table', { name: /district rankings/i })
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no structural a11y violations in dark mode', async () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    const { container } = renderPage()
    await screen.findByRole('table', { name: /district rankings/i })
    expect(await axe(container)).toHaveNoViolations()
  })
})
