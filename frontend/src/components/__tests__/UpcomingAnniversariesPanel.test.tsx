import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { UpcomingAnniversariesPanel } from '../UpcomingAnniversariesPanel'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'

/* Sprint C RED tests for #446. Reference date pinned to 2026-05-15 so
   tests don't drift with calendar time. */

afterEach(() => cleanup())

const REF = new Date('2026-05-15T12:00:00Z')

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

const renderPanel = (
  clubs: ClubTrend[],
  props: { initialRowLimit?: number } = {}
) =>
  render(
    <MemoryRouter>
      <UpcomingAnniversariesPanel
        clubs={clubs}
        referenceDate={REF}
        districtId="61"
        {...props}
      />
    </MemoryRouter>
  )

describe('UpcomingAnniversariesPanel (#446)', () => {
  it('renders empty state with a forward-looking next anniversary when no clubs are within the 60-day window', () => {
    // Club's anniversary is 200 days away — outside the window.
    const clubs = [
      mkClub({
        clubId: '1',
        clubName: 'Far Future Club',
        // 200 days after 2026-05-15 ≈ 2026-12-01 → use a charter 200d earlier
        // We pick a clear date well outside ±60.
        charterDate: '2000-12-01',
      }),
    ]
    renderPanel(clubs)
    expect(screen.getByText(/all quiet/i)).toBeInTheDocument()
    expect(screen.getByText(/Far Future Club/i)).toBeInTheDocument()
  })

  it('lists clubs whose next anniversary falls within 60 days, sorted by daysUntilNext ascending', () => {
    const clubs = [
      mkClub({
        clubId: '1',
        clubName: 'Three Weeks Away',
        // 21 days after 2026-05-15 → 2026-06-05
        charterDate: '2010-06-05',
      }),
      mkClub({
        clubId: '2',
        clubName: 'Five Days Away',
        // 5 days after 2026-05-15 → 2026-05-20
        charterDate: '2015-05-20',
      }),
      mkClub({
        clubId: '3',
        clubName: 'Outside Window',
        charterDate: '2010-12-01',
      }),
    ]
    renderPanel(clubs)
    const rows = screen.getAllByTestId('upcoming-anniversary-row')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent(/Five Days Away/)
    expect(rows[1]).toHaveTextContent(/Three Weeks Away/)
  })

  it('caps the visible list to initialRowLimit by default and reveals the rest after "Show all"', () => {
    // 6 clubs all within window → only 5 visible initially
    const clubs = Array.from({ length: 6 }, (_, i) =>
      mkClub({
        clubId: String(i + 1),
        clubName: `Club ${i + 1}`,
        // Spread anniversaries 5-30 days out from REF.
        charterDate: new Date(REF.getTime() + (5 + i * 5) * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
      })
    )
    renderPanel(clubs, { initialRowLimit: 5 })
    expect(screen.getAllByTestId('upcoming-anniversary-row')).toHaveLength(5)
    fireEvent.click(screen.getByRole('button', { name: /show all/i }))
    expect(screen.getAllByTestId('upcoming-anniversary-row')).toHaveLength(6)
  })

  it('visually elevates milestone anniversaries with data-milestone="true"', () => {
    const clubs = [
      mkClub({
        clubId: '1',
        clubName: 'Twenty-Five Year Club',
        // Charter exactly 25y minus 10d before REF (so 25y anniv ≈ 10d away,
        // upcoming milestone). REF = 2026-05-15, charter = 2001-05-25.
        charterDate: '2001-05-25',
      }),
    ]
    renderPanel(clubs)
    expect(
      screen
        .getByText(/Twenty-Five Year Club/i)
        .closest('[data-milestone="true"]')
    ).not.toBeNull()
  })

  it('skips clubs without a charterDate', () => {
    const clubs = [
      mkClub({ clubId: '1', clubName: 'No Charter' }),
      mkClub({
        clubId: '2',
        clubName: 'Has Charter',
        charterDate: '2015-05-20',
      }),
    ]
    renderPanel(clubs)
    expect(screen.queryByText(/No Charter/)).toBeNull()
    expect(screen.getByText(/Has Charter/)).toBeInTheDocument()
  })
})
