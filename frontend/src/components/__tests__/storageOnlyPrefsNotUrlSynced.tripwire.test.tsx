/**
 * @vitest-environment jsdom
 *
 * Tripwire — storage-only preferences stay storage-only (epic #969 Sprint 6 / #982).
 *
 * Decision: docs/design/storage-only-prefs-decision-2026-05-30.md. The three
 * P3 controls flagged by the deep-link audit (§6 P3) are genuine *per-user
 * preferences*, not shareable view state, so NONE is promoted to the URL:
 *
 *   1. My-district star       — localStorage `my-district-id`      (useMyDistrict)
 *   2. KPI-strip collapse      — sessionStorage `district-kpi-strip-collapsed`
 *   3. Column-group visibility — localStorage `clubs-table:hidden-groups`
 *
 * This guard locks that decision. For each control it asserts BOTH halves of
 * "storage-only":
 *   (a) URL-INERT — mounting at the control's *proposed* deep-link param does
 *       NOT seed the control's state (the URL is not a read path); and
 *   (b) STORAGE-BACKED — toggling the control writes its storage key and leaves
 *       the router's search string EMPTY (the URL is not a write path).
 *
 * It is GREEN today and goes RED the moment a future sprint wires any of these
 * to `useSearchParams`/`useUrlState` — the inverse of Lesson 144 (there a value
 * BECAME URL-seedable and gained an unguarded write path; here we prove these
 * three never gain one). This is the tripwire the audit's guardrails call for
 * (Lesson 107 / #680: reserve the seam with a test, not a comment).
 *
 * Scope note: the seed lives in the MemoryRouter's virtual URL, so this catches
 * a regression that reads the *router* (`useSearchParams`/`useUrlState`/
 * `useLocation`) — the only sanctioned deep-link path in this codebase, and the
 * one the audit mandates. A hypothetical direct `window.location.search` read
 * would slip past, but nothing here deep-links that way; that gap is intentional.
 *
 * Component-level mounts only (no `pages/*Page`/`<App>`) → fast unit project (R22).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  render,
  cleanup,
  screen,
  fireEvent,
  renderHook,
  act,
} from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { useMyDistrict } from '../../hooks/useMyDistrict'
import { DistrictKpiStrip } from '../DistrictKpiStrip'
import { ClubsTable } from '../ClubsTable'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'
import { storageKey } from '../../utils/localStorageStore'
import type { MetricRankings, RecognitionTargets } from '../../types/districts'

const HIDDEN_GROUPS_STORAGE_KEY = storageKey('clubs-table:hidden-groups')

// A probe that renders the live router search string into the DOM so we can
// assert no control ever wrote to the URL — rendered, not stored in a module
// global, to stay pure (react-hooks/globals).
const SEARCH_PROBE_ID = 'router-search-probe'
function SearchProbe() {
  return <span data-testid={SEARCH_PROBE_ID}>{useLocation().search}</span>
}
const probedSearch = () => screen.getByTestId(SEARCH_PROBE_ID).textContent ?? ''

const atUrl =
  (initial: string) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initial]}>
      <SearchProbe />
      {children}
    </MemoryRouter>
  )

const renderAt = (ui: ReactElement, initial: string) =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <SearchProbe />
      {ui}
    </MemoryRouter>
  )

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
})
afterEach(() => cleanup())

// ── Control 1: my-district star ─────────────────────────────────────────────
describe('my-district star stays localStorage-only (#982)', () => {
  it('ignores a ?myDistrict= seed in the URL', () => {
    const { result } = renderHook(() => useMyDistrict(), {
      wrapper: atUrl('/?myDistrict=99'),
    })
    // URL is inert — empty storage wins.
    expect(result.current.myDistrictId).toBeNull()
    expect(probedSearch()).toBe('?myDistrict=99') // probe sees it; the hook does not
  })

  it('writes localStorage, not the URL, when set', () => {
    const { result } = renderHook(() => useMyDistrict(), {
      wrapper: atUrl('/'),
    })
    act(() => result.current.setMyDistrict('61'))
    expect(window.localStorage.getItem(storageKey('my-district-id'))).toContain(
      '61'
    )
    expect(probedSearch()).toBe('') // no URL write
  })
})

// ── Control 2: KPI-strip collapse ───────────────────────────────────────────
const rankings: MetricRankings = {
  worldRank: 30,
  worldPercentile: 77,
  regionRank: 3,
  totalDistricts: 128,
  totalInRegion: 11,
  region: '05',
}
const targets: RecognitionTargets = {
  distinguished: 158,
  select: 161,
  presidents: 164,
  smedley: 169,
}
const sampleKpis = {
  paidClubs: { current: 149, targets, rankings },
  membershipPayments: { current: 12500, targets, rankings },
  distinguishedClubs: { current: 84, targets, rankings },
  netMemberChange: { current: 312 },
}

describe('KPI-strip collapse stays sessionStorage-only (#982)', () => {
  it('ignores a ?kpiCollapsed= seed in the URL (renders expanded)', () => {
    renderAt(<DistrictKpiStrip kpis={sampleKpis} />, '/?kpiCollapsed=true')
    // URL inert: still expanded → the *collapse* affordance is present.
    expect(
      screen.getByRole('button', { name: /collapse kpi/i })
    ).toBeInTheDocument()
  })

  it('writes sessionStorage, not the URL, when collapsed', () => {
    renderAt(<DistrictKpiStrip kpis={sampleKpis} />, '/')
    fireEvent.click(screen.getByRole('button', { name: /collapse kpi/i }))
    expect(window.sessionStorage.getItem('district-kpi-strip-collapsed')).toBe(
      'true'
    )
    expect(probedSearch()).toBe('') // no URL write
  })
})

// ── Control 3: column-group visibility ──────────────────────────────────────
const makeClub = (over: Partial<ClubTrend> = {}): ClubTrend => ({
  clubId: 'c1',
  clubName: 'Alpha Club',
  divisionId: 'div-1',
  divisionName: 'A',
  areaId: 'area-1',
  areaName: '1',
  distinguishedLevel: 'NotDistinguished',
  currentStatus: 'thriving',
  riskFactors: [],
  membershipTrend: [{ date: '2026-03-01T00:00:00.000Z', count: 20 }],
  dcpGoalsTrend: [{ date: '2026-03-01T00:00:00.000Z', goalsAchieved: 5 }],
  ...over,
})

describe('column-group visibility stays localStorage-only (#982)', () => {
  it('ignores a ?hiddenGroups= seed in the URL (all groups visible)', () => {
    renderAt(
      <ClubsTable clubs={[makeClub()]} districtId="61" isLoading={false} />,
      '/?hiddenGroups=membership'
    )
    // URL inert → the persisted hidden-groups is the empty default (all
    // groups visible), NOT the URL's `membership`. usePersistedState mirrors
    // its initial `[]` to storage on mount; the param never reaches it.
    const stored = window.localStorage.getItem(HIDDEN_GROUPS_STORAGE_KEY)
    expect(stored).not.toContain('membership')
    expect(JSON.parse(stored ?? '[]')).toEqual([])
    expect(probedSearch()).toBe('?hiddenGroups=membership') // probe sees it; table ignores it
  })
})
