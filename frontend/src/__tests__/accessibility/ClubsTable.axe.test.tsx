// Axe scan of ClubsTable (#672, epic #665 Sprint 6 — the a11y + verification
// pass). The clubs table is the last district surface to migrate to the
// redesign chrome; sprints 1–5 rebuilt it (single sticky-header scroll, pill
// column model, segmented/chip controls, 640px card collapse). This guards its
// STRUCTURAL WCAG 2.1 AA rules — ARIA roles, accessible names, heading order,
// and scrollable-region-focusable — across desktop + mobile and both themes,
// and in the populated / no-data / loading states.
//
// Known JSDOM limitation (lesson 075): axe auto-disables `color-contrast`
// under JSDOM (no layout engine), so a green scan here is NOT a contrast proof.
// Contrast is owned by ClubsTableDarkModeContrast.test.ts (+ the controls audit)
// and verified live in both engines on the PR preview.

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ClubsTable } from '../../components/ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'

// @ts-expect-error - jest-axe matcher types vs vitest expect
expect.extend(toHaveNoViolations)

const mockClub = (overrides: Partial<ClubTrend> = {}): ClubTrend => ({
  clubId: 'club-1',
  clubName: 'Test Club',
  divisionId: 'div-1',
  divisionName: 'Division A',
  areaId: 'area-1',
  areaName: 'Area 1',
  distinguishedLevel: 'NotDistinguished',
  currentStatus: 'thriving',
  riskFactors: [],
  membershipTrend: [{ date: '2026-03-01T00:00:00.000Z', count: 20 }],
  dcpGoalsTrend: [{ date: '2026-03-01T00:00:00.000Z', goalsAchieved: 5 }],
  ...overrides,
})

// One club per status + tier so the pill branches all render.
const CLUBS: ClubTrend[] = [
  mockClub({
    clubId: 'c1',
    clubName: 'Alpha',
    currentStatus: 'thriving',
    distinguishedLevel: 'Distinguished',
  }),
  mockClub({
    clubId: 'c2',
    clubName: 'Beta',
    currentStatus: 'vulnerable',
    distinguishedLevel: 'Select',
  }),
  mockClub({
    clubId: 'c3',
    clubName: 'Gamma',
    currentStatus: 'intervention-required',
    distinguishedLevel: 'President',
  }),
]

const mobileMatchMedia = () =>
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

beforeEach(() => document.documentElement.removeAttribute('data-theme'))
afterEach(() => {
  document.documentElement.removeAttribute('data-theme')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  cleanup()
})

describe('ClubsTable axe scan (#672)', () => {
  it('desktop, populated — no structural a11y violations (light)', async () => {
    const { container } = render(
      <ClubsTable clubs={CLUBS} districtId="61" isLoading={false} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('desktop, populated — no structural a11y violations (dark)', async () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    const { container } = render(
      <ClubsTable clubs={CLUBS} districtId="61" isLoading={false} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('mobile card view — no structural a11y violations', async () => {
    vi.stubGlobal('matchMedia', mobileMatchMedia())
    const { container } = render(
      <ClubsTable clubs={CLUBS} districtId="61" isLoading={false} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('no-data empty state — no structural a11y violations', async () => {
    const { container } = render(
      <ClubsTable clubs={[]} districtId="61" isLoading={false} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('loading state — no structural a11y violations', async () => {
    const { container } = render(
      <ClubsTable clubs={[]} districtId="61" isLoading={true} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  // WCAG 1.4.1 (Use of Color): status + tier are conveyed by a TEXT label, not
  // colour alone. Assert every status/tier pill carries non-empty text — the
  // CSS comments claim it, this proves it so a future "icon-only pill" refactor
  // can't silently make status colour-only.
  it('status and tier pills carry a text label (not colour alone)', () => {
    const { container } = render(
      <ClubsTable clubs={CLUBS} districtId="61" isLoading={false} />
    )
    const pills = container.querySelectorAll(
      '[class*="clubs-status-pill--"], [class*="clubs-tier-pill--"]'
    )
    expect(pills.length).toBeGreaterThan(0)
    pills.forEach(pill => {
      expect(pill.textContent?.trim().length ?? 0).toBeGreaterThan(0)
    })
  })

  // The keyboard-scrollable container must be a focusable, named region
  // (WCAG 2.1.1 / axe scrollable-region-focusable). Assert the contract the
  // axe scan relies on, independently of the engine.
  it('scroll container is a focusable, labelled region', () => {
    const { container } = render(
      <ClubsTable clubs={CLUBS} districtId="61" isLoading={false} />
    )
    const region = container.querySelector('.clubs-table-scroll')
    expect(region).not.toBeNull()
    expect(region).toHaveAttribute('role', 'region')
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region?.getAttribute('aria-label')?.length ?? 0).toBeGreaterThan(0)
    // sanity: the table itself is inside the region
    expect(within(region as HTMLElement).getByRole('table')).toBeTruthy()
  })
})
