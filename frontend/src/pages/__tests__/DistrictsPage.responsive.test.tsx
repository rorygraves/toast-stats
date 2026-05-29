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

/**
 * The CLS-stable shell invariant (#826/#488/#861, Lesson 125): every terminal
 * state (loading + both error branches + loaded) reserves the hero-search slot
 * ABOVE a KPI strip whose mobile height is fixed by the 3-card demotion. Shared
 * by the loading-slot test (#861) and the error-state tests (#915 V9) so the
 * invariant has one definition.
 */
const expectReservedShell = (container: HTMLElement) => {
  const skel = container.querySelector('.districts-hero-search-skeleton')
  const strip = container.querySelector('.districts-kpi-strip')
  expect(skel).not.toBeNull()
  expect(strip).not.toBeNull()
  // Hero-search slot precedes the KPI strip in DOM so it sits above on mobile.
  expect(
    skel!.compareDocumentPosition(strip!) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()
  // 3 secondary KPI cards → the strip's mobile height matches across states.
  expect(
    container.querySelectorAll('.districts-kpi-card--secondary').length
  ).toBe(3)
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

/**
 * Landing hero hoist + KPI demotion (#861, epic #865 Sprint 1).
 *
 * Mobile-first triage: the "Find your district" hero search must sit above the
 * fold at 375px, and the 4-card global KPI strip collapses to a single
 * headline tile (Paid Clubs · Global) below 768px, restoring the full strip at
 * ≥768px. jsdom has no layout/media queries (Lesson 66), so these assert the
 * structural hooks the CSS keys off; the live per-breakpoint position + the
 * single-visible-tile are proven on the PR preview channel (both engines).
 *
 * CLS guard (#826/#488, Lesson 125): the loaded state hoists the search above
 * the KPI strip, so the shared shell (loading + both error states) must reserve
 * the same slot, or the KPI strip shifts down on data-load and re-opens the
 * ~0.2 CLS that lessons 79/107/125 closed.
 */
describe('DistrictsPage landing hero hoist + KPI demotion (#861)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps Paid Clubs · Global as the primary tile and marks the other three secondary (hidden <768px)', async () => {
    setupSingleRow()
    renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 7')

    const primary = screen
      .getByTestId('kpi-paid-clubs')
      .closest('.districts-kpi-card') as HTMLElement
    expect(primary.className).not.toMatch(/districts-kpi-card--secondary/)

    for (const tid of [
      'kpi-total-payments',
      'kpi-distinguished-clubs',
      'kpi-districts-tracked',
    ]) {
      const card = screen
        .getByTestId(tid)
        .closest('.districts-kpi-card') as HTMLElement
      expect(card.className).toMatch(/districts-kpi-card--secondary/)
    }
  })

  it('wraps the hero search and the KPI strip in one reorder stack so the search can hoist on mobile', async () => {
    setupSingleRow()
    const { container } = renderWithProviders(<DistrictsPage />)
    await screen.findByText('District 7')

    const stack = container.querySelector('.districts-hero-stack')
    expect(stack).not.toBeNull()
    expect(
      stack!.querySelector('.districts-toolbar__search--hero')
    ).not.toBeNull()
    expect(stack!.querySelector('.districts-kpi-strip')).not.toBeNull()
  })

  it('reserves the hoisted-search slot in the loading shell, before the KPI strip (CLS-stable swap)', async () => {
    // Pending fetch → component stays in the isLoading shell.
    mockedFetchCdnRankings.mockReturnValue(new Promise(() => {}) as never)
    const { container } = renderWithProviders(<DistrictsPage />)
    await screen.findByRole('status', { name: /loading district rankings/i })

    // Lesson 125: the loading shell reserves the same slot as loaded + error.
    expectReservedShell(container)
  })
})

/**
 * Terminal-state CLS-slot reservation (#915, epic #917 Sprint 4 — V9; Lesson 125).
 *
 * #826 unified the OUTER geometry across loading / both error branches / loaded
 * (`.districts-page-root > .districts-page`), and the test above proves the
 * LOADING shell reserves the hoisted-search slot + KPI strip + 3-card demotion.
 * But the deep-dive (§3 V9) flagged that only the *loading* slot was covered —
 * a CDN flake renders the **error/empty** state, whose reserved-slot geometry
 * was unverified. If a future refactor lets an error branch bypass `renderShell`
 * (or drop the demotion), the loaded↔error swap re-opens the ~0.2 CLS that
 * lessons 79/107/125 closed, and it only ever fires when the CDN flakes — green
 * most days, red on luck. These lock the error terminal states to the SAME
 * reserved geometry, so the Lighthouse CLS gate can't be ambushed by which
 * terminal state the run happened to render.
 */
describe('DistrictsPage terminal-state CLS slot (#915 V9, Lesson 125)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reserves the hero-search slot + KPI strip in the no-snapshot welcome state', async () => {
    mockedFetchCdnRankings.mockRejectedValue(
      new Error('CDN rankings fetch failed: 404')
    )
    const { container } = renderWithProviders(<DistrictsPage />)
    await screen.findByText('Welcome to Toast-Stats!')
    expectReservedShell(container)
  })

  it('reserves the hero-search slot + KPI strip in the generic error state', async () => {
    mockedFetchCdnRankings.mockRejectedValue(new Error('Something went wrong'))
    const { container } = renderWithProviders(<DistrictsPage />)
    await screen.findByText('Error Loading Rankings')
    expectReservedShell(container)
  })
})
