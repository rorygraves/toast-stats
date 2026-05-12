import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import { RegionGrid } from '../RegionGrid'
import type { RegionRollup } from '../../utils/aggregateRegions'

/* Sprint B test suite (#495, #492). Red-first per Lesson 54. */

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

const twoRollups: RegionRollup[] = [
  mkRollup({ region: '01', leadingDistrictName: 'District 01' }),
  mkRollup({ region: '07', leadingDistrictName: 'District 57' }),
]

describe('RegionGrid (#495)', () => {
  it('renders one card per rollup', () => {
    renderWithRouter(<RegionGrid rollups={twoRollups} />)
    const cards = screen.getAllByRole('link', { name: /region/i })
    expect(cards.length).toBe(2)
  })

  it('each card shows the region label as an eyebrow', () => {
    renderWithRouter(<RegionGrid rollups={twoRollups} />)
    expect(screen.getByText(/Region 01/)).toBeInTheDocument()
    expect(screen.getByText(/Region 07/)).toBeInTheDocument()
  })

  it('each card shows the leading district name', () => {
    renderWithRouter(<RegionGrid rollups={twoRollups} />)
    expect(screen.getByText(/District 01/)).toBeInTheDocument()
    expect(screen.getByText(/District 57/)).toBeInTheDocument()
  })

  it('each card links to /region/:n', () => {
    renderWithRouter(<RegionGrid rollups={twoRollups} />)
    const links = screen.getAllByRole('link', { name: /region/i })
    const hrefs = links.map(a => a.getAttribute('href'))
    expect(hrefs).toContain('/region/01')
    expect(hrefs).toContain('/region/07')
  })

  it('shows districtCount, paidClubs, distinguishedPercent on each card', () => {
    renderWithRouter(
      <RegionGrid
        rollups={[
          mkRollup({
            region: '01',
            districtCount: 8,
            paidClubs: 500,
            distinguishedPercent: 40,
          }),
        ]}
      />
    )
    expect(screen.getByText(/8 districts/i)).toBeInTheDocument()
    expect(screen.getByText(/500/)).toBeInTheDocument()
    expect(screen.getByText(/40%/)).toBeInTheDocument()
  })

  it('renders the 5-dot requirements ribbon', () => {
    renderWithRouter(<RegionGrid rollups={twoRollups} />)
    const card = screen.getAllByRole('link', { name: /region/i })[0]
    const ribbon = within(card as HTMLElement).getByLabelText(
      /requirements ribbon/i
    )
    // 5 requirement indicators (DSP/Training/Mkt/Comm/RA)
    const dots = ribbon.querySelectorAll('[data-requirement]')
    expect(dots.length).toBe(5)
  })

  it('requirement-ribbon dots carry data-met="true" when met > 0, else false', () => {
    renderWithRouter(
      <RegionGrid
        rollups={[
          mkRollup({
            region: '01',
            requirements: {
              dspSubmitted: { met: 5, total: 8 },
              trainingMet: { met: 0, total: 8 },
              marketAnalysisSubmitted: { met: 5, total: 8 },
              communicationPlanSubmitted: { met: 5, total: 8 },
              regionAdvisorVisitMet: { met: 5, total: 8 },
            },
          }),
        ]}
      />
    )
    const card = screen.getByRole('link', { name: /region/i })
    const ribbon = within(card as HTMLElement).getByLabelText(
      /requirements ribbon/i
    )
    const trainingDot = ribbon.querySelector('[data-requirement="trainingMet"]')
    expect(trainingDot).toHaveAttribute('data-met', 'false')
    const dspDot = ribbon.querySelector('[data-requirement="dspSubmitted"]')
    expect(dspDot).toHaveAttribute('data-met', 'true')
  })

  it('renders nothing when given an empty rollups array', () => {
    const { container } = renderWithRouter(<RegionGrid rollups={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
