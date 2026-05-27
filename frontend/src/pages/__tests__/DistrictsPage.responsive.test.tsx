/**
 * DistrictsPage landing rankings table — priority-column responsive model +
 * sticky fix (#811, epic #813 Sprint 3).
 *
 * The landing rankings table is a LEADERBOARD: its value is comparing
 * districts across rows. Per Lesson 105 (#689) a ranking table keeps the
 * table and makes the horizontal scroll non-trap — it must NOT card-collapse
 * (which destroys the cross-row comparison). So the responsive contract is:
 *   (1) the scroll container is a focusable, labelled region (WCAG 2.1.1, the
 *       axe "scrollable-region-focusable" rule) with a right-edge scroll-cue;
 *   (2) ONE sticky key column (District) pinned at left:0 — no hardcoded
 *       second sticky (the old `left-[200px]` px seam, AC #2);
 *   (3) a per-column priority model that hides low-priority columns at tablet
 *       / mobile via CSS (verified for real at each breakpoint in Playwright —
 *       jsdom has no layout, Lesson 66);
 *   (4) ≥44px touch targets on the row action buttons (Lesson 111).
 *
 * jsdom can't evaluate media queries or measure px, so these assert the
 * structural hooks (roles, classes, testids) the CSS keys off; the live
 * per-breakpoint behaviour is proven on the PR preview channel.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import DistrictsPage from '../DistrictsPage'
import { fetchCdnRankings } from '../../services/cdn'
import { renderWithProviders } from '../../__tests__/test-utils'

vi.mock('../../services/cdn', () => ({
  fetchCdnDates: vi.fn().mockResolvedValue({
    dates: [],
    count: 0,
    generatedAt: '2025-01-01T00:00:00Z',
  }),
  fetchCdnSnapshotIndex: vi.fn().mockResolvedValue({}),
  fetchCdnRankings: vi.fn(),
  fetchCdnManifest: vi.fn().mockResolvedValue({
    latestSnapshotDate: '2025-11-22',
    generatedAt: '2025-01-01T00:00:00Z',
  }),
  cdnAnalyticsUrl: vi.fn().mockReturnValue('https://cdn.taverns.red/test'),
  fetchFromCdn: vi.fn(),
}))

vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: () => ({
    data: { districts: [] },
    isLoading: false,
    isError: false,
  }),
}))

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)

const setupSingleRow = () => {
  mockedFetchCdnRankings.mockResolvedValue({
    rankings: [
      {
        districtId: '7',
        districtName: 'District 7',
        region: '7',
        paidClubs: 100,
        paidClubBase: 90,
        clubGrowthPercent: 11.1,
        totalPayments: 5000,
        paymentBase: 4500,
        paymentGrowthPercent: 11.1,
        activeClubs: 100,
        distinguishedClubs: 50,
        selectDistinguished: 20,
        presidentsDistinguished: 10,
        distinguishedPercent: 50,
        clubsRank: 1,
        paymentsRank: 1,
        distinguishedRank: 1,
        aggregateScore: 300,
        overallRank: 1,
      },
    ],
    date: '2025-11-22',
  } as never)
}

const headerByText = (re: RegExp): HTMLElement => {
  const table = screen.getByRole('table', { name: /district rankings/i })
  const headers = within(table).getAllByRole('columnheader')
  const match = headers.find(h => re.test(h.textContent?.trim() ?? ''))
  if (!match) throw new Error(`no column header matching ${re}`)
  return match
}

describe('DistrictsPage rankings table — responsive + sticky (#811)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wraps the table in a focusable, labelled scroll region with a scroll-cue', async () => {
    setupSingleRow()
    const { container } = renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 7')

    const scroller = screen.getByRole('region', { name: /scroll/i })
    expect(scroller).toHaveAttribute('tabindex', '0')
    expect(scroller.className).toMatch(/overflow-x-auto/)

    // Right-edge discoverability cue (Lesson 105 — non-trap move #3).
    expect(
      container.querySelector('.districts-rankings-table__scroll-cue')
    ).not.toBeNull()
  })

  it('makes District the single sticky key column (no hardcoded second sticky)', async () => {
    setupSingleRow()
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 7')

    const districtCell = screen.getByTestId('district-cell-7')
    expect(districtCell.className).toMatch(
      /districts-rankings-table__sticky-col/
    )

    // AC #2: the Rank column must NOT be a second hardcoded sticky column —
    // that `left-[200px]` magic-number seam is exactly what this sprint removes.
    const rankCell = screen.getByTestId('rank-cell-7')
    expect(rankCell.className).not.toMatch(/sticky-col/)
    expect(rankCell.className).not.toMatch(/left-\[200px\]/)
    expect(rankCell.className).not.toMatch(/\bsticky\b/)
  })

  it('keeps the sticky District cell tint-aware (data-row-tint hook)', async () => {
    setupSingleRow()
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 7')

    // Default (untinted) row: the sticky cell must NOT hardcode bg-white
    // (Lesson 116 — that routes to the lighter dark scale). It carries an
    // explicit tint hook so isMine/isPinned rows repaint opaquely instead.
    const districtCell = screen.getByTestId('district-cell-7')
    expect(districtCell.className).not.toMatch(/bg-white/)
    expect(districtCell).toHaveAttribute('data-row-tint')
  })

  it('assigns responsive priority classes per column', async () => {
    setupSingleRow()
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 7')

    // Always-visible (mobile 375): District (sticky), Rank, Score.
    for (const re of [/^rank$/i, /^score$/i]) {
      const th = headerByText(re)
      expect(th.className).not.toMatch(/__col--tablet/)
      expect(th.className).not.toMatch(/__col--desktop/)
    }
    // Tablet+ (≥768): the three metric columns.
    for (const re of [/paid clubs/i, /total payments/i, /distinguished/i]) {
      expect(headerByText(re).className).toMatch(/__col--tablet/)
    }
    // Desktop-only (≥1280): Tier.
    expect(headerByText(/^tier$/i).className).toMatch(/__col--desktop/)
  })

  it('gives the row action buttons a ≥44px touch-target class', async () => {
    setupSingleRow()
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 7')

    const star = screen.getByRole('button', { name: /my district/i })
    const pin = screen.getByRole('button', { name: /pin district 7/i })
    expect(star.className).toMatch(/districts-rankings-table__touch-btn/)
    expect(pin.className).toMatch(/districts-rankings-table__touch-btn/)
  })

  it('exposes the rank badge by a stable testid (not by sticky-ness)', async () => {
    setupSingleRow()
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 7')

    const badge = screen.getByTestId('rank-badge-7')
    expect(badge.textContent?.trim()).toBe('1')
  })
})
