/**
 * ClubsTable zero-results state (#817, epic #818 Sprint 4). When the active
 * filters exclude every club, the empty state must NAME the filters doing the
 * excluding and offer a one-click clear — not the old generic "Try adjusting
 * your column filters" dead end.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'
import type { FilterState } from '../filters/types'

const clubs: ClubTrend[] = [
  {
    clubId: 'club-1',
    clubName: 'Alpha Toastmasters',
    divisionId: 'div-a',
    divisionName: 'Division A',
    areaId: 'area-1',
    areaName: 'Area 1',
    distinguishedLevel: 'Distinguished',
    currentStatus: 'thriving',
    riskFactors: [],
    membershipTrend: [{ date: '2024-01-01', count: 25 }],
    dcpGoalsTrend: [{ date: '2024-01-01', goalsAchieved: 8 }],
  },
]

// A name filter that matches no club → zero results.
const noMatchState: FilterState = {
  name: { field: 'name', type: 'text', value: 'ZZZ', operator: 'contains' },
}

describe('ClubsTable — zero-results state names the filters (#817)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('names the active filter in the empty state', () => {
    render(
      <ClubsTable
        clubs={clubs}
        districtId="test-district"
        isLoading={false}
        initialFilterState={noMatchState}
      />
    )
    expect(screen.getByText('No clubs match your filters')).toBeInTheDocument()
    // The Club label + the excluding value are surfaced so the user knows WHY.
    expect(screen.getByText('ZZZ')).toBeInTheDocument()
  })

  it('clears all filters and restores the clubs from the empty state', async () => {
    const user = userEvent.setup()
    render(
      <ClubsTable
        clubs={clubs}
        districtId="test-district"
        isLoading={false}
        initialFilterState={noMatchState}
      />
    )
    expect(screen.getByText('No clubs match your filters')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear all filters/i }))

    // Filters gone → the single club is back.
    expect(screen.getByText('Total: 1 clubs')).toBeInTheDocument()
    expect(
      screen.queryByText('No clubs match your filters')
    ).not.toBeInTheDocument()
  })
})
