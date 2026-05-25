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

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'

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

// `excludeSelector` skips elements inside a matching subtree. The mobile view
// embeds <ClubCard>, whose own re-skin is Sprint 5 (#671) — out of scope here,
// so the mobile assertion excludes the card list (`.space-y-3`) and only covers
// ClubsTable's own sort-control chrome.
function grayClassesIn(
  container: HTMLElement,
  excludeSelector?: string
): string[] {
  const offenders: string[] = []
  container.querySelectorAll<HTMLElement>('*').forEach(el => {
    if (excludeSelector && el.closest(excludeSelector)) return
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
    // Exclude the ClubCard list (`.space-y-3`) — its re-skin is Sprint 5 (#671).
    expect(grayClassesIn(container, '.space-y-3')).toEqual([])
  })
})
