/**
 * Re-skin guard for ClubsTable chrome (#668, epic #665 Sprint 2).
 *
 * Acceptance criterion #1: "Zero legacy `*-gray-*` classes left on the table."
 * The clubs-table chrome (panel header, table header, rows, mobile sort
 * controls, empty states) must be driven by redesign tokens
 * (`--surface`/`--surface-2`/`--surface-3`/`--line`/`--ink`/`--ink-3`) via the
 * CSS layer, not by legacy gray Tailwind utilities that rely on the
 * dark-mode.css override layer (R10, lessons 093/096).
 *
 * This is a falsifiable DOM check: it renders the real component (desktop AND
 * mobile branches) and fails if any rendered element carries a `*-gray-N`
 * class. JSDOM can't compute contrast (lesson 075), but it CAN prove which
 * classes ship — which is exactly what this criterion is about.
 */

import type { ReactElement } from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render as rtlRender, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'

// CC-7 (#872): ClubsTable renders real <Link>s now — wrap every render in a
// router context.
const render = (ui: ReactElement, options?: Parameters<typeof rtlRender>[1]) =>
  rtlRender(<MemoryRouter>{ui}</MemoryRouter>, options)

const createMockClub = (overrides: Partial<ClubTrend> = {}): ClubTrend => ({
  clubId: 'club-1',
  clubName: 'Test Club',
  divisionId: 'div-1',
  divisionName: 'Division A',
  areaId: 'area-1',
  areaName: 'Area 1',
  distinguishedLevel: 'NotDistinguished',
  currentStatus: 'thriving',
  riskFactors: [],
  membershipTrend: [{ date: new Date().toISOString(), count: 20 }],
  dcpGoalsTrend: [{ date: new Date().toISOString(), goalsAchieved: 5 }],
  ...overrides,
})

// Fixtures that exercise every cell branch where a legacy gray utility lived:
// status variety (row backgrounds), a distinguished pill, zero renewals
// (muted values), and missing clubStatus / yearsChartered (em-dash placeholders).
const CLUBS: ClubTrend[] = [
  createMockClub({
    clubId: 'c1',
    clubName: 'Alpha',
    currentStatus: 'thriving',
    distinguishedLevel: 'Distinguished',
    octoberRenewals: 12,
    aprilRenewals: 10,
    newMembers: 5,
    clubStatus: 'Active',
    yearsChartered: 8,
  }),
  createMockClub({
    clubId: 'c2',
    clubName: 'Beta',
    currentStatus: 'vulnerable',
    octoberRenewals: 0,
    aprilRenewals: 0,
    newMembers: 0,
  }),
  createMockClub({
    clubId: 'c3',
    clubName: 'Gamma',
    currentStatus: 'intervention-required',
  }),
]

// Matches Tailwind gray utilities including state-variant prefixes
// (`hover:bg-gray-100`, `group-hover:text-gray-700`) via the `:` boundary,
// but NOT brand tokens like `tm-cool-gray-20` (Sprint 3 #669 tier pills) —
// those have a non-enumerated prefix before `-gray-`.
const GRAY_CLASS =
  /(?:^|[\s:])(?:text|bg|border|divide|from|to|ring|fill|stroke)-gray-\d/

// As of Sprint 5 (#671) the mobile <ClubCard> is re-skinned to redesign
// tokens, so the mobile assertion no longer excludes the card list — the
// whole mobile view (sort controls AND cards) must be gray-free.
function grayClassesIn(container: HTMLElement): string[] {
  const offenders: string[] = []
  container.querySelectorAll<HTMLElement>('*').forEach(el => {
    const cls = el.getAttribute('class')
    if (cls && GRAY_CLASS.test(cls)) {
      offenders.push(cls)
    }
  })
  return offenders
}

describe('ClubsTable re-skin (#668) — no legacy gray chrome', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders the desktop table with zero `*-gray-*` utility classes', () => {
    const { container } = render(
      <ClubsTable clubs={CLUBS} districtId="61" isLoading={false} />
    )
    expect(grayClassesIn(container)).toEqual([])
  })

  it('renders the mobile view with zero `*-gray-*` utility classes', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    )
    const { container } = render(
      <ClubsTable clubs={CLUBS} districtId="61" isLoading={false} />
    )
    // The mobile card list is re-skinned in Sprint 5 (#671) — no exclusion.
    expect(grayClassesIn(container)).toEqual([])
  })

  // Sprint 6 (#672): the populated renders above never mount the no-data
  // empty state, so its chrome fell outside the original guard's render
  // boundary (lesson 109 — the render boundary is the scope boundary). It
  // was still delegating to the shared <EmptyState>, which ships legacy
  // gray. The clubs-table re-skin owns its OWN no-data state; re-skin it
  // to redesign tokens so the table is gray-free in every state it renders.
  it('renders the no-data empty state with zero `*-gray-*` utility classes', () => {
    const { container } = render(
      <ClubsTable clubs={[]} districtId="61" isLoading={false} />
    )
    expect(grayClassesIn(container)).toEqual([])
  })

  // The loading state delegates to the shared <LoadingSkeleton variant=table>
  // (~25 consumers, dark-safe via dark-mode.css remaps). Re-skinning that
  // shared primitive is a cross-cutting migration, out of scope for the
  // clubs a11y pass (UX ruling, #672) — so the loading branch is
  // deliberately NOT asserted here, the same way the closed filter popover
  // (Sprint 4 surface) sits outside the desktop render above.
})
