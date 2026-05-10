/* AwardsRaceSection — 2026 redesign 3-card contender summary (#357).
   The detailed top-10 lists move to the future Awards page (Epic #370). */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AwardsRaceSection } from '../AwardsRaceSection'
import type { CompetitiveAwardStandings } from '../../services/cdn'

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

const mockStandings: CompetitiveAwardStandings = {
  metadata: {
    snapshotId: '2026-04-15',
    calculatedAt: '2026-04-15T00:00:00.000Z',
    totalDistricts: 5,
  },
  extensionAward: [
    {
      districtId: '17',
      districtName: 'District 17',
      region: '5',
      rank: 1,
      value: 14,
      isWinner: false,
    },
    {
      districtId: '60',
      districtName: 'District 60',
      region: '8',
      rank: 2,
      value: 10,
      isWinner: false,
    },
    {
      districtId: '93',
      districtName: 'District 93',
      region: '11',
      rank: 3,
      value: 9,
      isWinner: false,
    },
  ],
  twentyPlusAward: [
    {
      districtId: '60',
      districtName: 'District 60',
      region: '8',
      rank: 1,
      value: 22,
      isWinner: true,
    },
    {
      districtId: '57',
      districtName: 'District 57',
      region: '1',
      rank: 2,
      value: 18,
      isWinner: true,
    },
  ],
  retentionAward: [
    {
      districtId: '102',
      districtName: 'District 102',
      region: '14',
      rank: 1,
      value: 94.1,
      isWinner: true,
    },
  ],
  byDistrict: {},
}

const findCard = (cardTitle: RegExp) => {
  const heading = screen.getByRole('heading', { name: cardTitle })
  const card = heading.closest('.awards-race-card') as HTMLElement
  expect(card).toBeTruthy()
  return card
}

describe('AwardsRaceSection — 3-card redesign (#357)', () => {
  it('renders the panel header naming the section', () => {
    renderWithRouter(<AwardsRaceSection standings={mockStandings} />)
    expect(screen.getByText(/awards race/i)).toBeInTheDocument()
  })

  it('renders three contender cards (Extension / 20-Plus / Retention)', () => {
    renderWithRouter(<AwardsRaceSection standings={mockStandings} />)
    expect(
      screen.getByRole('heading', { name: /president'?s extension award/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /president'?s 20-plus award/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /district club retention award/i })
    ).toBeInTheDocument()
  })

  it('shows the leading district id + value on each card', () => {
    renderWithRouter(<AwardsRaceSection standings={mockStandings} />)

    const ext = findCard(/extension/i)
    expect(within(ext).getByText(/D17/)).toBeInTheDocument()
    expect(within(ext).getByText(/14/)).toBeInTheDocument()

    const twenty = findCard(/20-plus/i)
    expect(within(twenty).getByText(/D60/)).toBeInTheDocument()
    expect(within(twenty).getByText(/22/)).toBeInTheDocument()

    const ret = findCard(/retention/i)
    expect(within(ret).getByText(/D102/)).toBeInTheDocument()
    // Allow the renderer to format 94.1% how it likes — check substring
    expect(within(ret).getByText(/94/)).toBeInTheDocument()
  })

  it('signals "Achieved" on cards where the leader has won', () => {
    renderWithRouter(<AwardsRaceSection standings={mockStandings} />)
    // 20-Plus + Retention leaders are winners in the fixture
    const twenty = findCard(/20-plus/i)
    expect(within(twenty).getByText(/achieved/i)).toBeInTheDocument()

    const ret = findCard(/retention/i)
    expect(within(ret).getByText(/achieved/i)).toBeInTheDocument()
  })

  it('does NOT signal "Achieved" on cards where no winner exists yet', () => {
    renderWithRouter(<AwardsRaceSection standings={mockStandings} />)
    // Extension fixture has zero winners — should show in-progress copy
    const ext = findCard(/extension/i)
    expect(within(ext).queryByText(/achieved/i)).not.toBeInTheDocument()
  })

  it('links the leader to its district detail page', () => {
    renderWithRouter(<AwardsRaceSection standings={mockStandings} />)
    const ext = findCard(/extension/i)
    const link = within(ext).getByRole('link', { name: /D17/ })
    expect(link).toHaveAttribute('href', '/district/17')
  })

  it('does NOT render top-10 leaderboards (deferred to Awards page Epic #370)', () => {
    renderWithRouter(<AwardsRaceSection standings={mockStandings} />)
    // No <table> rendered — the deeper top-10 list lives on /awards (deferred)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('does not render when standings is null', () => {
    const { container } = renderWithRouter(
      <AwardsRaceSection standings={null} />
    )
    expect(container.querySelector('.awards-race-card')).toBeNull()
  })

  it('does not render when all award arrays are empty', () => {
    const empty: CompetitiveAwardStandings = {
      ...mockStandings,
      extensionAward: [],
      twentyPlusAward: [],
      retentionAward: [],
    }
    const { container } = renderWithRouter(
      <AwardsRaceSection standings={empty} />
    )
    expect(container.querySelector('.awards-race-card')).toBeNull()
  })

  it('renders a progress bar on each card with a sensible width %', () => {
    renderWithRouter(<AwardsRaceSection standings={mockStandings} />)

    // Extension leader value=14, no winner — progress = min(100, 14/15*100) ≈ 93%
    const ext = findCard(/extension/i)
    const extBar = within(ext).getByRole('progressbar') as HTMLElement
    const extFill = extBar.firstElementChild as HTMLElement
    expect(parseFloat(extFill.style.width)).toBeGreaterThan(80)
    expect(parseFloat(extFill.style.width)).toBeLessThanOrEqual(100)
    expect(extFill).not.toHaveClass('awards-race-card__progress-fill--won')

    // 20-Plus leader is a winner → progress = 100% with --won modifier
    const twenty = findCard(/20-plus/i)
    const twentyBar = within(twenty).getByRole('progressbar') as HTMLElement
    const twentyFill = twentyBar.firstElementChild as HTMLElement
    expect(twentyFill.style.width).toBe('100%')
    expect(twentyFill).toHaveClass('awards-race-card__progress-fill--won')
  })

  it('shows a status dot in each card footer', () => {
    renderWithRouter(<AwardsRaceSection standings={mockStandings} />)
    // Each card's footer has a leading dot indicator
    const dots = document.querySelectorAll('.awards-race-card__status-dot')
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })

  it('renders the threshold sub-line per card per design wording', () => {
    renderWithRouter(<AwardsRaceSection standings={mockStandings} />)
    // Design subtitles describe the award threshold below the title
    expect(
      screen.getByText(/most new paid clubs vs prior year/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/% of paid clubs with 20\+ members/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/90% retention of last year/i)).toBeInTheDocument()
  })
})
