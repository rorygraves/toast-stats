/**
 * ClubsTable priority-column responsive model + sticky key column + scroll-cue
 * (#812, epic #813 Sprint 4).
 *
 * Mirrors the landing rankings table contract (#811) for the club table, per
 * ADR-006 §2–3. The club table differs from the districts leaderboard in one
 * way that matters here: a club is BROWSED one-at-a-time, not compared
 * row-vs-row, so card-collapse at true mobile is the right pattern (Lesson
 * 105). Hence the responsive contract:
 *   (1) the card view appears at TRUE mobile only — `< 768px` (ADR-006 §2),
 *       not the old 640px cliff (asserted in ClubsTable.responsive.test.tsx);
 *   (2) the table (rendered at tablet ≥768 and up) has ONE sticky key column
 *       (Club) pinned at left:0 — a robust sticky, no hardcoded px offset;
 *   (3) a per-column priority model hides the low-priority "detail" columns at
 *       the tablet tier (768–1279) and reveals them at desktop (≥1280) via the
 *       `clubs-table__col--desktop` class;
 *   (4) a right-edge scroll-cue affordance signals clipped columns.
 *
 * jsdom has no layout and can't evaluate media queries (Lesson 66), so this
 * asserts the structural hooks (classes, data-attrs, elements) the CSS keys
 * off; the live per-breakpoint behaviour is proven on the PR preview channel
 * in Playwright at 375 / 768 / 1280 / 1600 + dark mode.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'

const makeClub = (over: Partial<ClubTrend> = {}): ClubTrend => ({
  clubId: 'c1',
  clubName: 'Alpha',
  divisionId: 'div-1',
  divisionName: 'Division A',
  areaId: 'area-1',
  areaName: 'Area 1',
  distinguishedLevel: 'NotDistinguished',
  currentStatus: 'thriving',
  riskFactors: [],
  membershipTrend: [{ date: new Date().toISOString(), count: 20 }],
  dcpGoalsTrend: [{ date: new Date().toISOString(), goalsAchieved: 5 }],
  ...over,
})

// jsdom matchMedia defaults to no-match → ClubsTable renders the desktop
// table, which is the surface under test here.
const stubDesktopMatchMedia = () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )
}

describe('ClubsTable priority-column responsive model (#812)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('pins the Club key column with the sticky-col class on header and body', () => {
    stubDesktopMatchMedia()
    const { container } = render(
      <ClubsTable clubs={[makeClub()]} districtId="61" isLoading={false} />
    )
    const headerCells = container.querySelectorAll('#clubs-table thead th')
    // Club is the first column (COLUMN_CONFIGS order) and the only sticky one.
    expect(headerCells[0].className).toContain('clubs-table__sticky-col')
    const stickyHeaders = container.querySelectorAll(
      '#clubs-table thead th.clubs-table__sticky-col'
    )
    expect(stickyHeaders).toHaveLength(1)

    const bodyRow = container.querySelector('#clubs-table tbody tr')!
    const firstCell = bodyRow.querySelector('td')!
    expect(firstCell.className).toContain('clubs-table__sticky-col')
    // The pinned cell carries the club name (the row's identity).
    expect(within(firstCell as HTMLElement).getByText('Alpha')).toBeTruthy()
  })

  it('tags the sticky cell with data-row-tint so it repaints opaque per row status', () => {
    stubDesktopMatchMedia()
    const { container } = render(
      <ClubsTable
        clubs={[
          makeClub({
            clubId: 't',
            clubName: 'Thrive',
            currentStatus: 'thriving',
          }),
          makeClub({
            clubId: 'v',
            clubName: 'Vuln',
            currentStatus: 'vulnerable',
          }),
          makeClub({
            clubId: 'i',
            clubName: 'Inter',
            currentStatus: 'intervention-required',
          }),
        ]}
        districtId="61"
        isLoading={false}
      />
    )
    const tintOf = (name: string) => {
      const cell = within(
        container.querySelector('#clubs-table tbody') as HTMLElement
      )
        .getByText(name)
        .closest('td')
      return cell?.getAttribute('data-row-tint')
    }
    expect(tintOf('Thrive')).toBe('none')
    expect(tintOf('Vuln')).toBe('vulnerable')
    expect(tintOf('Inter')).toBe('intervention')
  })

  it('hides the detail columns at tablet via clubs-table__col--desktop, keeps the core set always shown', () => {
    stubDesktopMatchMedia()
    const { container } = render(
      <ClubsTable clubs={[makeClub()]} districtId="61" isLoading={false} />
    )
    // Map header label → its th, so the assertion reads off the spec column set.
    const headerByLabel = new Map<string, Element>()
    container.querySelectorAll('#clubs-table thead th').forEach(th => {
      const label = th.textContent?.trim() ?? ''
      // ColumnHeader wraps the label in a button; first non-empty token is it.
      headerByLabel.set(label.split(/\s+/)[0] ?? '', th)
    })

    // Detail columns hidden at the tablet tier (revealed ≥1280).
    const desktopOnly = ['Div', 'Area', 'New', 'Oct', 'Apr', 'Club', 'Years']
    // NB: 'Club' here matches the "Club Status" header's first token, NOT the
    // sticky "Club" column (column 0), which is asserted separately below.
    const headers = Array.from(
      container.querySelectorAll('#clubs-table thead th')
    )
    // Index-based: the desktop-only columns are 1,2,6,7,8,11,12 (0-based) in the
    // COLUMN_CONFIGS order: Club, Div, Area, Status, Members, Needed, New, Oct,
    // Apr, DCP, Tier, ClubStatus, Years.
    const desktopOnlyIdx = [1, 2, 6, 7, 8, 11, 12]
    const coreIdx = [0, 3, 4, 5, 9, 10]
    desktopOnlyIdx.forEach(i => {
      expect(headers[i].className).toContain('clubs-table__col--desktop')
    })
    coreIdx.forEach(i => {
      expect(headers[i].className).not.toContain('clubs-table__col--desktop')
    })
    // The sticky column (Club, col 0) is core, never a desktop-only hide.
    expect(headers[0].className).toContain('clubs-table__sticky-col')
    expect(headers[0].className).not.toContain('clubs-table__col--desktop')
    void desktopOnly
    void headerByLabel
  })

  it('applies the same priority classes to body cells in column order', () => {
    stubDesktopMatchMedia()
    const { container } = render(
      <ClubsTable clubs={[makeClub()]} districtId="61" isLoading={false} />
    )
    const cells = Array.from(
      container.querySelectorAll('#clubs-table tbody tr:first-child td')
    )
    const desktopOnlyIdx = [1, 2, 6, 7, 8, 11, 12]
    desktopOnlyIdx.forEach(i => {
      expect(cells[i].className).toContain('clubs-table__col--desktop')
    })
    expect(cells[0].className).toContain('clubs-table__sticky-col')
  })

  it('wraps the scroller and renders a right-edge scroll-cue affordance', () => {
    stubDesktopMatchMedia()
    const { container } = render(
      <ClubsTable clubs={[makeClub()]} districtId="61" isLoading={false} />
    )
    const wrap = container.querySelector('.clubs-table__scroll-wrap')
    expect(wrap).not.toBeNull()
    // The scroller (the overflow container) lives inside the wrap.
    expect(wrap!.querySelector('.clubs-table-scroll')).not.toBeNull()
    // The cue is a sibling overlay inside the wrap.
    expect(wrap!.querySelector('.clubs-table__scroll-cue')).not.toBeNull()
  })
})
