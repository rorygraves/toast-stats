import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { MilestonesCallout } from '../MilestonesCallout'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'

/* Sprint C RED tests for #447. Pinned to PY 2025-2026
   (Jul 1 2025 → Jun 30 2026). */

afterEach(() => cleanup())

const PY_START = 2025

const mkClub = (overrides: Partial<ClubTrend>): ClubTrend => ({
  clubId: '0',
  clubName: 'Test Club',
  divisionId: 'A',
  divisionName: 'Division A',
  areaId: '01',
  areaName: 'Area 01',
  membershipTrend: [],
  dcpGoalsTrend: [],
  currentStatus: 'thriving',
  riskFactors: [],
  distinguishedLevel: 'NotDistinguished',
  ...overrides,
})

const renderCallout = (clubs: ClubTrend[]) =>
  render(
    <MemoryRouter>
      <MilestonesCallout
        clubs={clubs}
        programYearStart={PY_START}
        districtId="61"
      />
    </MemoryRouter>
  )

describe('MilestonesCallout (#447)', () => {
  it('renders empty state with the next upcoming milestone when no milestones fall in the program year', () => {
    // Charter 2024-06-01 → will hit 5y on 2029-06-01 → outside PY 2025-2026
    const clubs = [
      mkClub({
        clubId: '1',
        clubName: 'Brand New Club',
        charterDate: '2024-06-01',
      }),
    ]
    renderCallout(clubs)
    // Copy was tightened in #511 ("None this PY — next is ...").
    expect(screen.getByText(/none this py/i)).toBeInTheDocument()
    expect(screen.getByText(/Brand New Club/)).toBeInTheDocument()
  })

  it('lists milestone clubs grouped by milestone year in descending order', () => {
    const clubs = [
      // 25y milestone: charter 2000-08-15 → 25y on 2025-08-15 (in PY)
      mkClub({
        clubId: '1',
        clubName: 'Twenty-Five Years Club',
        charterDate: '2000-08-15',
      }),
      // 10y milestone: charter 2015-09-01 → 10y on 2025-09-01 (in PY)
      mkClub({
        clubId: '2',
        clubName: 'Ten Years Club',
        charterDate: '2015-09-01',
      }),
      // 50y milestone: charter 1975-11-12 → 50y on 2025-11-12 (in PY)
      mkClub({
        clubId: '3',
        clubName: 'Fifty Years Club',
        charterDate: '1975-11-12',
      }),
    ]
    renderCallout(clubs)
    const groups = screen.getAllByTestId('milestone-group')
    expect(groups).toHaveLength(3)
    // Descending order: 50 → 25 → 10
    expect(within(groups[0]!).getByText(/50 Years/i)).toBeInTheDocument()
    expect(within(groups[1]!).getByText(/25 Years/i)).toBeInTheDocument()
    expect(within(groups[2]!).getByText(/10 Years/i)).toBeInTheDocument()
    expect(
      within(groups[0]!).getByText(/Fifty Years Club/i)
    ).toBeInTheDocument()
    expect(
      within(groups[1]!).getByText(/Twenty-Five Years Club/i)
    ).toBeInTheDocument()
    expect(within(groups[2]!).getByText(/Ten Years Club/i)).toBeInTheDocument()
  })

  it('within a group, sorts clubs by anniversary date ascending', () => {
    // Two 10y milestones: 2015-09-01 (earlier) and 2015-12-20 (later)
    const clubs = [
      mkClub({
        clubId: '1',
        clubName: 'December Anniversary',
        charterDate: '2015-12-20',
      }),
      mkClub({
        clubId: '2',
        clubName: 'September Anniversary',
        charterDate: '2015-09-01',
      }),
    ]
    renderCallout(clubs)
    const group = screen.getByTestId('milestone-group')
    const clubLinks = within(group).getAllByTestId('milestone-club')
    expect(clubLinks[0]).toHaveTextContent(/September Anniversary/)
    expect(clubLinks[1]).toHaveTextContent(/December Anniversary/)
  })

  it('respects program year boundaries — Jul 1 inclusive, Jun 30 inclusive', () => {
    // PY 2025-2026 = 2025-07-01 → 2026-06-30
    const clubs = [
      // Charter 2020-07-01 → 5y on 2025-07-01 (PY start, inclusive)
      mkClub({
        clubId: '1',
        clubName: 'PY Start Club',
        charterDate: '2020-07-01',
      }),
      // Charter 2020-06-30 → 5y on 2025-06-30 (one day before PY → excluded)
      mkClub({
        clubId: '2',
        clubName: 'Before PY Club',
        charterDate: '2020-06-30',
      }),
      // Charter 2021-06-30 → 5y on 2026-06-30 (PY end, inclusive)
      mkClub({
        clubId: '3',
        clubName: 'PY End Club',
        charterDate: '2021-06-30',
      }),
      // Charter 2021-07-01 → 5y on 2026-07-01 (one day after PY → excluded)
      mkClub({
        clubId: '4',
        clubName: 'After PY Club',
        charterDate: '2021-07-01',
      }),
    ]
    renderCallout(clubs)
    expect(screen.getByText(/PY Start Club/)).toBeInTheDocument()
    expect(screen.getByText(/PY End Club/)).toBeInTheDocument()
    expect(screen.queryByText(/Before PY Club/)).toBeNull()
    expect(screen.queryByText(/After PY Club/)).toBeNull()
  })

  it('skips clubs without a charterDate', () => {
    const clubs = [
      mkClub({ clubId: '1', clubName: 'No Charter' }),
      mkClub({
        clubId: '2',
        clubName: 'Has Charter',
        charterDate: '2000-08-15',
      }),
    ]
    renderCallout(clubs)
    expect(screen.queryByText(/No Charter/)).toBeNull()
    expect(screen.getByText(/Has Charter/)).toBeInTheDocument()
  })
})
