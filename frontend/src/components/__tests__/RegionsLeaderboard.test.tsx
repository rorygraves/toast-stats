import { describe, it, expect, afterEach } from 'vitest'
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'
import { RegionsLeaderboard } from '../RegionsLeaderboard'
import type { RegionRollup } from '../../utils/aggregateRegions'

/* #964 — restore the /regions leaderboard table as the PRIMARY view,
   sortable with URL-synced sort state (?sort=&dir=) via the shared
   useUrlSort + SortableHeader infra (#851/#857). Red-first per Lesson 54. */

afterEach(() => cleanup())

/* Reads the live URL search string so URL-sync round-trips are assertable. */
const LocationProbe = () => {
  const { search } = useLocation()
  return <div data-testid="loc-search">{search}</div>
}

const renderAt = (ui: ReactElement, url = '/regions') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <LocationProbe />
      {ui}
    </MemoryRouter>
  )

const mkRollup = (overrides: Partial<RegionRollup>): RegionRollup => ({
  region: '01',
  districtCount: 8,
  paidClubs: 500,
  paidClubBase: 480,
  clubGrowthPercent: 4.16,
  paymentGrowthPercent: 9.09,
  totalPayments: 12000,
  paymentBase: 11000,
  distinguishedClubs: 200,
  distinguishedPercent: 40,
  clubsRank: 1,
  paymentsRank: 1,
  distinguishedRank: 1,
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

/* Out-of-order on purpose so a default-sort assertion is meaningful (Lesson
   138 / #882 — the table owns and pins its own order). */
const sampleRollups: RegionRollup[] = [
  mkRollup({ region: '03', aggregateScore: 900, paidClubs: 300 }),
  mkRollup({ region: '01', aggregateScore: 1500, paidClubs: 700 }),
  mkRollup({ region: '02', aggregateScore: 2200, paidClubs: 500 }),
]

const rowRegions = (): string[] => {
  const tbody = screen.getByRole('table').querySelector('tbody')
  return Array.from(tbody?.querySelectorAll('tr') ?? []).map(
    tr => tr.textContent ?? ''
  )
}

describe('RegionsLeaderboard (#964) — structure', () => {
  it('renders one table row per region', () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    const tbody = screen.getByRole('table').querySelector('tbody')
    expect(tbody?.querySelectorAll('tr').length).toBe(3)
  })

  it('renders the expected sortable column headers', () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    for (const name of [
      /sort by region/i,
      /sort by districts/i,
      /sort by paid clubs/i,
      /sort by payments/i,
      /sort by distinguished/i,
      /sort by score/i,
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('links each region row to /region/:n', () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    const link = screen.getByRole('link', { name: /region 02/i })
    expect(link).toHaveAttribute('href', '/region/02')
  })

  it('wraps the table in a focusable, labelled scroll region (#689)', () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    const scroller = screen.getByRole('region', { name: /scroll/i })
    expect(scroller).toHaveAttribute('tabindex', '0')
    expect(scroller.className).toMatch(/overflow-x-auto/)
  })
})

describe('RegionsLeaderboard (#964) — default sort', () => {
  it('defaults to region number ascending', () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    const regions = rowRegions()
    expect(regions[0]).toMatch(/Region 01/)
    expect(regions[1]).toMatch(/Region 02/)
    expect(regions[2]).toMatch(/Region 03/)
  })

  it('keeps the URL clean for the default sort (no sort/dir params)', () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    expect(screen.getByTestId('loc-search').textContent).toBe('')
  })

  it('marks the Region header aria-sort=ascending by default', () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    const header = screen
      .getByRole('button', { name: /sort by region/i })
      .closest('th')
    expect(header).toHaveAttribute('aria-sort', 'ascending')
  })
})

describe('RegionsLeaderboard (#964) — click-header sort', () => {
  it('sorts by Score descending and writes ?sort=score&dir=desc on first click', async () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    await userEvent.click(
      screen.getByRole('button', { name: /sort by score/i })
    )
    const regions = rowRegions()
    // Score: 2200 (02), 1500 (01), 900 (03)
    expect(regions[0]).toMatch(/Region 02/)
    expect(regions[2]).toMatch(/Region 03/)
    await waitFor(() => {
      const search = screen.getByTestId('loc-search').textContent ?? ''
      expect(search).toContain('sort=score')
      expect(search).toContain('dir=desc')
    })
  })

  it('flips direction when the same header is clicked twice', async () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    const scoreBtn = screen.getByRole('button', { name: /sort by score/i })
    await userEvent.click(scoreBtn) // desc
    await userEvent.click(scoreBtn) // asc
    const regions = rowRegions()
    // Score asc: 900 (03), 1500 (01), 2200 (02)
    expect(regions[0]).toMatch(/Region 03/)
    expect(regions[2]).toMatch(/Region 02/)
    await waitFor(() =>
      expect(screen.getByTestId('loc-search').textContent).toContain('dir=asc')
    )
  })

  it('sorts by Paid Clubs descending on click', async () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    await userEvent.click(
      screen.getByRole('button', { name: /sort by paid clubs/i })
    )
    const regions = rowRegions()
    // Paid clubs: 700 (01), 500 (02), 300 (03)
    expect(regions[0]).toMatch(/Region 01/)
    expect(regions[2]).toMatch(/Region 03/)
  })
})

describe('RegionsLeaderboard (#964) — deep link', () => {
  it('honours ?sort=score&dir=desc seeded in the URL on mount', () => {
    renderAt(
      <RegionsLeaderboard rollups={sampleRollups} />,
      '/regions?sort=score&dir=desc'
    )
    const regions = rowRegions()
    expect(regions[0]).toMatch(/Region 02/)
    expect(regions[2]).toMatch(/Region 03/)
  })

  it('falls back to the default sort for an unknown sort field (Lesson 144)', () => {
    renderAt(
      <RegionsLeaderboard rollups={sampleRollups} />,
      '/regions?sort=bogus&dir=desc'
    )
    // Unknown field → region asc default, never a crash or empty body.
    const regions = rowRegions()
    expect(regions[0]).toMatch(/Region 01/)
    expect(regions[2]).toMatch(/Region 03/)
  })
})

describe('RegionsLeaderboard (#965) — sticky region-identity column', () => {
  /* #965: at narrow widths the 6-column table scrolls horizontally; the Region
     identity column must stay pinned so each row keeps its label while the
     metric columns scroll under it (Lesson 105). The CSS that makes it opaque +
     themed lives in app-shell.css and is contract-tested by
     RegionDarkModeContrast; here we only assert the markup carries the hooks. */
  it('tags the table so its sticky-column CSS can scope to it', () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    expect(screen.getByRole('table').className).toMatch(
      /region-leaderboard-table/
    )
  })

  it('pins the Region header cell (sticky-col class on the <th>)', () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    const th = screen
      .getByRole('button', { name: /sort by region/i })
      .closest('th')
    expect(th?.className).toMatch(/region-leaderboard__sticky-col/)
  })

  it('pins the Region cell on every body row (sticky-col class on the first <td>)', () => {
    renderAt(<RegionsLeaderboard rollups={sampleRollups} />)
    const rows = screen.getByRole('table').querySelectorAll('tbody tr')
    expect(rows.length).toBeGreaterThan(0)
    for (const tr of rows) {
      const firstCell = tr.querySelector('td')
      expect(firstCell?.className).toMatch(/region-leaderboard__sticky-col/)
    }
  })
})

describe('RegionsLeaderboard (#964) — empty state', () => {
  it('renders a table-form empty message and no rows when there are no regions', () => {
    renderAt(<RegionsLeaderboard rollups={[]} />)
    expect(screen.queryByRole('row')).not.toBeInTheDocument()
    expect(screen.getByText(/no regions to display/i)).toBeInTheDocument()
  })
})

describe('RegionsLeaderboard (#964) — cell content', () => {
  it('renders the per-region metric values', () => {
    renderAt(<RegionsLeaderboard rollups={[mkRollup({ region: '05' })]} />)
    const row = screen.getByRole('table').querySelector('tbody tr')!
    const cells = within(row as HTMLElement)
    expect(cells.getByText('500')).toBeInTheDocument() // paid clubs
    expect(cells.getByText('12,000')).toBeInTheDocument() // payments
    expect(cells.getByText('1,500')).toBeInTheDocument() // score
  })
})
