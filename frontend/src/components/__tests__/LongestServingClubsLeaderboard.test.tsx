import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { LongestServingClubsLeaderboard } from '../LongestServingClubsLeaderboard'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'

/* Red tests for #449. The leaderboard ranks clubs in a district by years
   chartered (descending), defaults to top 10, and links each row to the
   club detail page. Reference date is pinned for deterministic years. */

afterEach(() => cleanup())

const REF_DATE = new Date(Date.UTC(2026, 4, 22)) // 2026-05-22

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

const renderBoard = (
  clubs: ClubTrend[],
  props: Partial<{
    districtId: string
    limit: number
    referenceDate: Date
  }> = {}
) =>
  render(
    <MemoryRouter>
      <LongestServingClubsLeaderboard
        clubs={clubs}
        districtId={props.districtId ?? '61'}
        referenceDate={props.referenceDate ?? REF_DATE}
        {...(props.limit !== undefined && { limit: props.limit })}
      />
    </MemoryRouter>
  )

describe('LongestServingClubsLeaderboard (#449)', () => {
  it('renders an empty state when no clubs have a charter date', () => {
    const clubs = [
      mkClub({ clubId: '1', clubName: 'No Charter A' }),
      mkClub({ clubId: '2', clubName: 'No Charter B', charterDate: '' }),
    ]
    renderBoard(clubs)
    expect(screen.getByText(/no charter data yet/i)).toBeInTheDocument()
    expect(screen.queryAllByTestId('longest-serving-row')).toHaveLength(0)
  })

  it('sorts rows by years chartered descending (oldest first)', () => {
    const clubs = [
      mkClub({
        clubId: '1',
        clubName: 'Young Club',
        charterDate: '2020-03-15',
      }),
      mkClub({
        clubId: '2',
        clubName: 'Oldest Club',
        charterDate: '1975-08-01',
      }),
      mkClub({ clubId: '3', clubName: 'Mid Club', charterDate: '2000-01-12' }),
    ]
    renderBoard(clubs)
    const rows = screen.getAllByTestId('longest-serving-row')
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText(/Oldest Club/)).toBeInTheDocument()
    expect(within(rows[1]).getByText(/Mid Club/)).toBeInTheDocument()
    expect(within(rows[2]).getByText(/Young Club/)).toBeInTheDocument()
  })

  it('breaks year ties alphabetically by club name', () => {
    const clubs = [
      mkClub({ clubId: '1', clubName: 'Zulu Club', charterDate: '1990-06-01' }),
      mkClub({
        clubId: '2',
        clubName: 'Alpha Club',
        charterDate: '1990-06-01',
      }),
      mkClub({ clubId: '3', clubName: 'Mike Club', charterDate: '1990-06-01' }),
    ]
    renderBoard(clubs)
    const rows = screen.getAllByTestId('longest-serving-row')
    expect(within(rows[0]).getByText(/Alpha Club/)).toBeInTheDocument()
    expect(within(rows[1]).getByText(/Mike Club/)).toBeInTheDocument()
    expect(within(rows[2]).getByText(/Zulu Club/)).toBeInTheDocument()
  })

  it('defaults to the top 10 oldest clubs', () => {
    const clubs = Array.from({ length: 14 }, (_, i) =>
      mkClub({
        clubId: String(i + 1),
        clubName: `Club ${String(i + 1).padStart(2, '0')}`,
        // Older clubId → earlier charter year → higher rank
        charterDate: `${1960 + i}-01-01`,
      })
    )
    renderBoard(clubs)
    const rows = screen.getAllByTestId('longest-serving-row')
    expect(rows).toHaveLength(10)
    // Oldest charter (1960) ranks #1
    expect(within(rows[0]).getByText(/Club 01/)).toBeInTheDocument()
    // 10th oldest is the club chartered in 1969
    expect(within(rows[9]).getByText(/Club 10/)).toBeInTheDocument()
    // The 11th-oldest (Club 11, chartered 1970) must NOT appear
    expect(screen.queryByText(/Club 11/)).not.toBeInTheDocument()
  })

  it('honors a custom limit prop', () => {
    const clubs = Array.from({ length: 6 }, (_, i) =>
      mkClub({
        clubId: String(i + 1),
        clubName: `Club ${i + 1}`,
        charterDate: `${1990 + i}-01-01`,
      })
    )
    renderBoard(clubs, { limit: 3 })
    expect(screen.getAllByTestId('longest-serving-row')).toHaveLength(3)
  })

  it('skips clubs without a charter date entirely', () => {
    const clubs = [
      mkClub({
        clubId: '1',
        clubName: 'Has Charter',
        charterDate: '1980-04-01',
      }),
      mkClub({ clubId: '2', clubName: 'No Charter Here' }),
    ]
    renderBoard(clubs)
    const rows = screen.getAllByTestId('longest-serving-row')
    expect(rows).toHaveLength(1)
    expect(within(rows[0]).getByText(/Has Charter/)).toBeInTheDocument()
    expect(screen.queryByText(/No Charter Here/)).not.toBeInTheDocument()
  })

  it('links each row to the club detail page scoped by district', () => {
    const clubs = [
      mkClub({
        clubId: '042',
        clubName: 'Linkable Club',
        charterDate: '1985-02-14',
      }),
    ]
    renderBoard(clubs, { districtId: '61' })
    const link = screen.getByRole('link', { name: /Linkable Club/ })
    expect(link).toHaveAttribute('href', '/club/042?district=61')
  })

  it('shows the years count and a formatted charter date for each row', () => {
    const clubs = [
      mkClub({
        clubId: '1',
        clubName: 'Vintage Club',
        charterDate: '1990-06-15',
      }),
    ]
    renderBoard(clubs)
    const row = screen.getByTestId('longest-serving-row')
    // 2026-05-22 vs 1990-06-15 → anniversary not yet reached → 35y
    expect(within(row).getByText(/35y/i)).toBeInTheDocument()
    expect(within(row).getByText(/Jun 1990/)).toBeInTheDocument()
  })
})
