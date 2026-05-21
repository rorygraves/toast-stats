import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { NotableDatesSection } from '../NotableDatesSection'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'

afterEach(() => cleanup())

// Pinned reference + program-year start so tests don't drift with the
// real calendar.
const REF = new Date('2026-05-15T12:00:00Z')
const PY_START = 2025 // PY 2025-26

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

// Charter 30 days from REF (within the 60d window).
const UPCOMING_CHARTER = '2020-06-14'
// Charter 10 years before PY 2025-26 anniversary (milestone).
// 2015-09-01 charter → 10th anniversary lands in 2025-09 (inside PY 2025-26).
const MILESTONE_CHARTER = '2015-09-01'

const renderSection = (clubs: ClubTrend[]) =>
  render(
    <MemoryRouter>
      <NotableDatesSection
        clubs={clubs}
        districtId="61"
        programYearStart={PY_START}
        referenceDate={REF}
      />
    </MemoryRouter>
  )

describe('NotableDatesSection (#551)', () => {
  it('renders a single compact band when both upcoming and milestones are empty', () => {
    renderSection([])
    expect(screen.getByTestId('notable-dates-empty-band')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /Upcoming anniversaries/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /Milestones/i })
    ).not.toBeInTheDocument()
  })

  it('renders only the upcoming panel full-width when only upcoming has data', () => {
    const clubs = [
      mkClub({
        clubId: '1',
        clubName: 'Anniversary Club',
        charterDate: UPCOMING_CHARTER,
      }),
    ]
    renderSection(clubs)
    expect(
      screen.getByRole('heading', { name: /Upcoming anniversaries/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /Milestones/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('notable-dates-empty-band')
    ).not.toBeInTheDocument()
  })

  it('renders only the milestones panel full-width when only milestones has data', () => {
    const clubs = [
      mkClub({
        clubId: '2',
        clubName: 'Decade Club',
        charterDate: MILESTONE_CHARTER,
      }),
    ]
    renderSection(clubs)
    expect(
      screen.getByRole('heading', { name: /Milestones/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /Upcoming anniversaries/i })
    ).not.toBeInTheDocument()
  })

  it('renders both panels side-by-side when both have data', () => {
    const clubs = [
      mkClub({
        clubId: '1',
        clubName: 'Anniversary Club',
        charterDate: UPCOMING_CHARTER,
      }),
      mkClub({
        clubId: '2',
        clubName: 'Decade Club',
        charterDate: MILESTONE_CHARTER,
      }),
    ]
    renderSection(clubs)
    expect(
      screen.getByRole('heading', { name: /Upcoming anniversaries/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Milestones/i })
    ).toBeInTheDocument()
  })
})
