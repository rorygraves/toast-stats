import { describe, it, expect, afterEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import { RegionsLeaderboard } from '../RegionsLeaderboard'
import type { RegionRollup } from '../../utils/aggregateRegions'

/* Sprint B test suite (#494, #492). Red-first per Lesson 54. */

afterEach(() => cleanup())

const renderWithRouter = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

const mkRollup = (overrides: Partial<RegionRollup>): RegionRollup => ({
  region: '01',
  districtCount: 8,
  paidClubs: 500,
  paidClubBase: 480,
  clubGrowthPercent: 4.16,
  totalPayments: 12000,
  paymentBase: 11000,
  paymentGrowthPercent: 9.09,
  distinguishedClubs: 200,
  distinguishedPercent: 40,
  aggregateScore: 1500,
  leadingDistrictId: '01',
  leadingDistrictName: 'District 01',
  requirements: {
    dspSubmitted: { met: 7, total: 8 },
    trainingMet: { met: 8, total: 8 },
    marketAnalysisSubmitted: { met: 6, total: 8 },
    communicationPlanSubmitted: { met: 7, total: 8 },
    regionAdvisorVisitMet: { met: 8, total: 8 },
  },
  ...overrides,
})

const sampleRollups: RegionRollup[] = [
  mkRollup({ region: '01', aggregateScore: 1500, leadingDistrictId: '01' }),
  mkRollup({ region: '02', aggregateScore: 2200, leadingDistrictId: '20' }),
  mkRollup({ region: '03', aggregateScore: 900, leadingDistrictId: '99' }),
]

describe('RegionsLeaderboard responsive scroll region (#689)', () => {
  it('wraps the table in a focusable, labelled scroll region', () => {
    renderWithRouter(<RegionsLeaderboard rollups={sampleRollups} />)
    const scroller = screen.getByRole('region', { name: /scroll/i })
    expect(scroller).toHaveAttribute('tabindex', '0')
    expect(scroller.className).toMatch(/overflow-x-auto/)
  })
})

describe('RegionsLeaderboard (#494)', () => {
  it('renders one table row per region', () => {
    renderWithRouter(<RegionsLeaderboard rollups={sampleRollups} />)
    const tbody = screen.getByRole('table').querySelector('tbody')
    expect(tbody?.querySelectorAll('tr').length).toBe(3)
  })

  it('renders the expected column headers', () => {
    renderWithRouter(<RegionsLeaderboard rollups={sampleRollups} />)
    expect(
      screen.getByRole('columnheader', { name: /region/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /districts/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /paid clubs/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /payments/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /distinguished/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /score/i })
    ).toBeInTheDocument()
  })

  it('defaults to sorting by aggregateScore descending', () => {
    renderWithRouter(<RegionsLeaderboard rollups={sampleRollups} />)
    const tbody = screen.getByRole('table').querySelector('tbody')
    const regionTexts = Array.from(tbody?.querySelectorAll('tr') ?? []).map(
      tr => tr.textContent
    )
    // Score order: 2200 (02), 1500 (01), 900 (03)
    expect(regionTexts[0]).toMatch(/Region 02/)
    expect(regionTexts[1]).toMatch(/Region 01/)
    expect(regionTexts[2]).toMatch(/Region 03/)
  })

  it('clicking a column header reorders by that column', () => {
    renderWithRouter(<RegionsLeaderboard rollups={sampleRollups} />)
    fireEvent.click(screen.getByRole('columnheader', { name: /^region/i }))
    const tbody = screen.getByRole('table').querySelector('tbody')
    const regionTexts = Array.from(tbody?.querySelectorAll('tr') ?? []).map(
      tr => tr.textContent
    )
    // After clicking Region header → ascending by region number
    expect(regionTexts[0]).toMatch(/Region 01/)
    expect(regionTexts[2]).toMatch(/Region 03/)
  })

  it('clicking the same header twice reverses the sort direction', () => {
    renderWithRouter(<RegionsLeaderboard rollups={sampleRollups} />)
    const regionHeader = screen.getByRole('columnheader', { name: /^region/i })
    fireEvent.click(regionHeader) // asc
    fireEvent.click(regionHeader) // desc
    const tbody = screen.getByRole('table').querySelector('tbody')
    const regionTexts = Array.from(tbody?.querySelectorAll('tr') ?? []).map(
      tr => tr.textContent
    )
    expect(regionTexts[0]).toMatch(/Region 03/)
    expect(regionTexts[2]).toMatch(/Region 01/)
  })

  it('each row is a link to /region/:n', () => {
    renderWithRouter(<RegionsLeaderboard rollups={sampleRollups} />)
    const tbody = screen.getByRole('table').querySelector('tbody')
    const links = within(tbody as HTMLElement).getAllByRole('link')
    const hrefs = links.map(a => a.getAttribute('href'))
    expect(hrefs).toContain('/region/01')
    expect(hrefs).toContain('/region/02')
    expect(hrefs).toContain('/region/03')
  })

  it('renders the leading district name in the region cell', () => {
    renderWithRouter(
      <RegionsLeaderboard
        rollups={[
          mkRollup({
            region: '07',
            leadingDistrictId: '57',
            leadingDistrictName: 'District 57',
          }),
        ]}
      />
    )
    expect(screen.getByText(/District 57/)).toBeInTheDocument()
  })

  it('shows distinguished as count + percent', () => {
    renderWithRouter(
      <RegionsLeaderboard
        rollups={[
          mkRollup({ distinguishedClubs: 200, distinguishedPercent: 40 }),
        ]}
      />
    )
    // Component should render '200' AND '40%' somewhere in the row
    expect(screen.getByText(/200/)).toBeInTheDocument()
    expect(screen.getByText(/40%/)).toBeInTheDocument()
  })

  it('renders empty state when no rollups are provided', () => {
    renderWithRouter(<RegionsLeaderboard rollups={[]} />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText(/no regions/i)).toBeInTheDocument()
  })
})
