// Full-page axe scan of RegionsPage in light + dark (#685).
//
// Sprint 2 of epic #683 added the RegionFinder jump-to-region filter bar.
// This guards its structural accessibility (role=group label, button
// names, aria-pressed) and the rest of WCAG 2.1 AA across the index.
//
// Known JSDOM limitation (Lesson 075): axe's `color-contrast` rule is
// auto-disabled under JSDOM. Contrast for this surface is covered by
// RegionDarkModeContrast.test.ts; this file owns the structural rules.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RegionsPage from '../../pages/RegionsPage'

// @ts-expect-error - jest-axe matcher types vs vitest expect
expect.extend(toHaveNoViolations)

vi.mock('../../services/cdn', () => {
  const baseRanking = (region: string, districtId: string, score: number) => ({
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
    smedleyDistinguished: 2,
    dspSubmitted: true,
    trainingMet: true,
    marketAnalysisSubmitted: true,
    communicationPlanSubmitted: true,
    regionAdvisorVisitMet: true,
    clubsWith20PlusMembers: 10,
    newCharteredClubs: 1,
    newPayments: 100,
    aprilPayments: 200,
    octoberPayments: 300,
    latePayments: 0,
    charterPayments: 0,
  })
  return {
    fetchCdnRankings: vi.fn().mockResolvedValue({
      date: '2026-05-12',
      rankings: [
        baseRanking('01', '01', 500),
        baseRanking('07', '57', 350),
        baseRanking('14', '88', 200),
      ],
    }),
  }
})

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/regions']}>
        <Routes>
          <Route path="/regions" element={<RegionsPage />} />
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

describe('RegionsPage axe scan (#685)', () => {
  it('has no structural a11y violations in light mode', async () => {
    const { container } = renderPage()
    await screen.findByRole('link', { name: /^region 01/i })
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no structural a11y violations in dark mode', async () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    const { container } = renderPage()
    await screen.findByRole('link', { name: /^region 01/i })
    expect(await axe(container)).toHaveNoViolations()
  })

  it('stays axe-clean after a region is isolated via the finder', async () => {
    const { container } = renderPage()
    await screen.findByRole('link', { name: /^region 01/i })
    await userEvent.click(screen.getByRole('button', { name: /^region 07$/i }))
    expect(await axe(container)).toHaveNoViolations()
  })
})
