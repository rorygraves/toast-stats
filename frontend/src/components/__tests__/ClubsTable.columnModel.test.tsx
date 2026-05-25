/**
 * Column-model guard for ClubsTable (#669, epic #665 Sprint 3).
 *
 * Reconciles the column set/order to the HANDOFF spec and renders the
 * Status + Tier columns as token-driven pills, Members as current/base,
 * and DCP as an inline progress bar. Falsifiable DOM checks:
 *
 *   1. Header order matches the spec exactly (extras appended).
 *   2. Tier renders as a pill whose modifier class encodes the DCP tier
 *      color map (HANDOFF §256); provisional → striped-yellow "projected".
 *   3. Status renders as a token-driven pill (not legacy `*-N` Tailwind).
 *   4. DCP renders as an accessible progressbar reading the canonical
 *      goalsAchieved count (no Goals-1-N inference).
 *   5. Members shows current / base when base is present; current-only
 *      when base is absent.
 *
 * Header labels changed from Sprint 2 (e.g. "Club Name" → "Club",
 * "Distinguished" → "Tier"). That is a deliberate spec change (Lesson 092),
 * not assertion pinning — the new labels encode the HANDOFF column set.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, within, screen } from '@testing-library/react'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'

const createMockClub = (overrides: Partial<ClubTrend> = {}): ClubTrend => ({
  clubId: 'club-1',
  clubName: 'Test Club',
  divisionId: 'div-1',
  divisionName: 'A',
  areaId: 'area-1',
  areaName: '1',
  distinguishedLevel: 'NotDistinguished',
  currentStatus: 'thriving',
  riskFactors: [],
  membershipTrend: [{ date: '2026-03-01T00:00:00.000Z', count: 20 }],
  dcpGoalsTrend: [{ date: '2026-03-01T00:00:00.000Z', goalsAchieved: 5 }],
  ...overrides,
})

// Expected header order per the HANDOFF column set, extras (Club Status,
// Years) appended. This is THE acceptance criterion for column order.
const EXPECTED_HEADERS = [
  'Club',
  'Div',
  'Area',
  'Status',
  'Members',
  'Needed',
  'New',
  'Oct Renew',
  'Apr Renew',
  'DCP',
  'Tier',
  'Club Status',
  'Years',
]

function headerLabelsInOrder(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      '#clubs-table thead th .clubs-col-header span.flex-1'
    )
  ).map(el => el.textContent?.trim() ?? '')
}

describe('ClubsTable column model (#669)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders the spec column order with extras appended', () => {
    const { container } = render(
      <ClubsTable
        clubs={[createMockClub()]}
        districtId="61"
        isLoading={false}
      />
    )
    expect(headerLabelsInOrder(container)).toEqual(EXPECTED_HEADERS)
  })

  it.each([
    ['Smedley', 'clubs-tier-pill--smedley'],
    ['President', 'clubs-tier-pill--presidents'],
    ['Select', 'clubs-tier-pill--select'],
    ['Distinguished', 'clubs-tier-pill--distinguished'],
  ] as const)(
    'renders %s tier as a pill with the %s modifier class',
    (level, modifier) => {
      const { container } = render(
        <ClubsTable
          clubs={[
            createMockClub({
              clubId: `c-${level}`,
              distinguishedLevel: level,
              // Post-April snapshot → confirmed (not provisional), so the
              // tier color shows rather than the projected stripe.
              aprilRenewals: 30,
              membershipBase: 25,
              membershipTrend: [
                { date: '2026-05-01T00:00:00.000Z', count: 30 },
              ],
            }),
          ]}
          districtId="61"
          isLoading={false}
        />
      )
      const pill = container.querySelector('.clubs-tier-pill')
      expect(pill).not.toBeNull()
      expect(pill?.className).toContain(modifier)
    }
  )

  it('renders a provisional Distinguished tier with the projected stripe', () => {
    const { container } = render(
      <ClubsTable
        clubs={[
          createMockClub({
            distinguishedLevel: 'Distinguished',
            isProvisionallyDistinguished: true,
          }),
        ]}
        districtId="61"
        isLoading={false}
      />
    )
    const pill = container.querySelector('.clubs-tier-pill')
    expect(pill?.className).toContain('clubs-tier-pill--projected')
  })

  it('renders NotDistinguished as a muted placeholder, not a tier pill', () => {
    const { container } = render(
      <ClubsTable
        clubs={[createMockClub({ distinguishedLevel: 'NotDistinguished' })]}
        districtId="61"
        isLoading={false}
      />
    )
    expect(container.querySelector('.clubs-tier-pill')).toBeNull()
  })

  it('renders Status as a token-driven pill', () => {
    const { container } = render(
      <ClubsTable
        clubs={[createMockClub({ currentStatus: 'vulnerable' })]}
        districtId="61"
        isLoading={false}
      />
    )
    const pill = container.querySelector('.clubs-status-pill')
    expect(pill).not.toBeNull()
    expect(pill?.className).toContain('clubs-status-pill--vulnerable')
    // No legacy Tailwind color utilities on the pill.
    expect(pill?.className).not.toMatch(/bg-(?:red|yellow|green)-\d/)
  })

  it('renders DCP as an accessible progressbar reading the canonical goal count', () => {
    render(
      <ClubsTable
        clubs={[
          createMockClub({
            dcpGoalsTrend: [
              { date: '2026-03-01T00:00:00.000Z', goalsAchieved: 7 },
            ],
          }),
        ]}
        districtId="61"
        isLoading={false}
      />
    )
    const bar = screen.getByRole('progressbar', { name: /dcp goals/i })
    expect(bar).toHaveAttribute('aria-valuenow', '7')
    expect(bar).toHaveAttribute('aria-valuemax', '10')
  })

  it('renders Members as current / base when base is present', () => {
    const { container } = render(
      <ClubsTable
        clubs={[
          createMockClub({
            membershipBase: 18,
            membershipTrend: [{ date: '2026-03-01T00:00:00.000Z', count: 24 }],
          }),
        ]}
        districtId="61"
        isLoading={false}
      />
    )
    const cell = container.querySelector('.clubs-members-cell')
    expect(cell).not.toBeNull()
    expect(within(cell as HTMLElement).getByText('24')).toBeInTheDocument()
    // base shown alongside, muted
    expect(cell?.textContent).toMatch(/24\s*\/\s*18/)
  })

  it('renders Members current-only when base is absent', () => {
    const { container } = render(
      <ClubsTable
        clubs={[
          createMockClub({
            membershipBase: undefined,
            membershipTrend: [{ date: '2026-03-01T00:00:00.000Z', count: 24 }],
          }),
        ]}
        districtId="61"
        isLoading={false}
      />
    )
    const cell = container.querySelector('.clubs-members-cell')
    expect(cell?.textContent?.replace(/\s/g, '')).toBe('24')
  })
})
