import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'

import { LongestServingClubsLeaderboard } from '../LongestServingClubsLeaderboard'
import { MobileDisclosure } from '../MobileDisclosure'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'

/* #867 — DistrictDetailPage folds the longest-serving leaderboard behind a
   disclosure below 768 px. This locks the exact composition the page uses
   (summary label + the real leaderboard component) without paying the cost
   of mounting the full page (kept light per the redesign-test note). */

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const stubViewport = (mobile: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: mobile,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )
}

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

// As wired in DistrictDetailPage.tsx.
const renderFolded = () =>
  render(
    <MemoryRouter>
      <MobileDisclosure summaryLabel="Longest-serving clubs">
        <LongestServingClubsLeaderboard
          clubs={[mkClub({ clubId: '1', charterDate: '1990-01-01' })]}
          districtId="61"
        />
      </MobileDisclosure>
    </MemoryRouter>
  )

describe('Longest-serving clubs mobile fold (#867)', () => {
  it('folds the leaderboard behind a collapsed disclosure on mobile', () => {
    stubViewport(true)
    renderFolded()

    const summary = screen.getByText('Longest-serving clubs', {
      selector: 'summary',
    })
    const details = summary.closest('details')
    expect(details).not.toBeNull()
    expect(details?.hasAttribute('open')).toBe(false)
  })

  it('renders the leaderboard directly with no disclosure on desktop', () => {
    stubViewport(false)
    const { container } = renderFolded()

    expect(container.querySelector('details')).toBeNull()
    expect(
      screen.getByRole('heading', { name: /Longest-serving clubs/i })
    ).toBeInTheDocument()
  })
})
