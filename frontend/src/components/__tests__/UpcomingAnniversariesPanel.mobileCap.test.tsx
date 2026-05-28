import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { UpcomingAnniversariesPanel } from '../UpcomingAnniversariesPanel'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'

/* #869 — below the 768px mobile breakpoint the upcoming-renewals list runs
   ~6 viewports, so it caps to the Next 3 followed by a "Show all →" link.
   Desktop (≥768px) keeps the default 5-row cap and "Show all (N)" label
   unchanged. matchMedia is stubbed the same way the #867/#868 fold tests do
   it. */

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

// 6 clubs all within the 60-day window, spread 5–30 days out from REF.
const sixClubs = () =>
  Array.from({ length: 6 }, (_, i) =>
    mkClub({
      clubId: String(i + 1),
      clubName: `Club ${i + 1}`,
      charterDate: new Date(REF.getTime() + (5 + i * 5) * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    })
  )

const renderPanel = (clubs: ClubTrend[]) =>
  render(
    <MemoryRouter>
      <UpcomingAnniversariesPanel
        clubs={clubs}
        referenceDate={REF}
        districtId="61"
      />
    </MemoryRouter>
  )

describe('UpcomingAnniversariesPanel mobile cap (#869)', () => {
  it('caps the visible list to 3 rows below the mobile breakpoint', () => {
    stubViewport(true)
    renderPanel(sixClubs())
    expect(screen.getAllByTestId('upcoming-anniversary-row')).toHaveLength(3)
  })

  it('shows a "Show all →" link on mobile that reveals the full list', () => {
    stubViewport(true)
    renderPanel(sixClubs())
    const button = screen.getByRole('button', { name: /show all/i })
    expect(button).toHaveTextContent('→')
    fireEvent.click(button)
    expect(screen.getAllByTestId('upcoming-anniversary-row')).toHaveLength(6)
  })

  it('keeps the default 5-row cap and "Show all (N)" label on desktop', () => {
    stubViewport(false)
    renderPanel(sixClubs())
    expect(screen.getAllByTestId('upcoming-anniversary-row')).toHaveLength(5)
    expect(
      screen.getByRole('button', { name: /show all \(6\)/i })
    ).toBeInTheDocument()
  })
})
