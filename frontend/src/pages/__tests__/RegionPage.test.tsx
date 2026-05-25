import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RegionPage from '../RegionPage'
import {
  fetchCdnRankings,
  fetchCdnCompetitiveAwards,
  type CompetitiveAwardStandings,
} from '../../services/cdn'

vi.mock('../../services/cdn', () => ({
  fetchCdnRankings: vi.fn(),
  fetchCdnCompetitiveAwards: vi.fn().mockResolvedValue(null),
  fetchCdnManifest: vi
    .fn()
    .mockResolvedValue({ latestSnapshotDate: '2026-05-12', generatedAt: 'x' }),
}))

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)
const mockedFetchCdnAwards = vi.mocked(fetchCdnCompetitiveAwards)

const mkRanking = (overrides: Record<string, unknown>) => ({
  districtId: '1',
  districtName: '1',
  region: '1',
  paidClubs: 100,
  totalPayments: 5000,
  distinguishedClubs: 50,
  aggregateScore: 300,
  overallRank: 1,
  paidClubBase: 90,
  paymentBase: 4500,
  clubGrowthPercent: 10,
  paymentGrowthPercent: 10,
  activeClubs: 100,
  selectDistinguished: 20,
  presidentsDistinguished: 10,
  distinguishedPercent: 50,
  clubsRank: 1,
  paymentsRank: 1,
  distinguishedRank: 1,
  ...overrides,
})

const renderRegion = (region: string) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/region/${region}`]}>
        <Routes>
          <Route path="/region/:n" element={<RegionPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('RegionPage tier column (#517 #513)', () => {
  const awardsWithTier = (tier: string) =>
    ({
      metadata: {
        snapshotId: 'x',
        calculatedAt: 'x',
        totalDistricts: 1,
      },
      extensionAward: [],
      twentyPlusAward: [],
      retentionAward: [],
      byDistrict: {},
      distinguishedDistrict: {
        '61': {
          districtId: '61',
          currentTier: tier,
          allPrerequisitesMet: tier !== 'NotDistinguished',
          prerequisites: {
            dspSubmitted: true,
            trainingMet: true,
            marketAnalysisSubmitted: true,
            communicationPlanSubmitted: true,
            regionAdvisorVisitMet: true,
          },
          nextTierGap:
            tier === 'Smedley'
              ? null
              : {
                  tier: 'Distinguished',
                  netClubGrowthGap: 0,
                  paymentGrowthGap: 0,
                  distinguishedPercentGap: 0,
                  clubGrowthGap: 0,
                },
        },
      },
      officerAwards: {
        educationTraining: [],
        clubGrowth: [],
      },
    }) as CompetitiveAwardStandings

  it('renders an em-dash for districts that have not yet reached Distinguished', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [mkRanking({ districtId: '61', region: '2' })],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(awardsWithTier('NotDistinguished'))
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D61')).closest(
      'tr'
    )!
    expect(within(row).getByTestId('tier-cell')).toHaveTextContent(/—/)
  })

  it('renders the tier name for Distinguished and above', async () => {
    for (const [tier, label] of [
      ['Distinguished', /distinguished/i],
      ['Select', /select/i],
      ['Presidents', /president/i],
      ['Smedley', /smedley/i],
    ] as const) {
      cleanup()
      mockedFetchCdnRankings.mockResolvedValueOnce({
        rankings: [mkRanking({ districtId: '61', region: '2' })],
        date: '2026-05-12',
      })
      mockedFetchCdnAwards.mockResolvedValue(awardsWithTier(tier))
      renderRegion('2')

      const row = (
        await screen.findByTestId('district-number-chip-D61')
      ).closest('tr')!
      expect(within(row).getByTestId('tier-cell')).toHaveTextContent(label)
    }
  })

  it('renders an em-dash when the awards JSON is null (legacy snapshot)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [mkRanking({ districtId: '61', region: '2' })],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(null)
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D61')).closest(
      'tr'
    )!
    expect(within(row).getByTestId('tier-cell')).toHaveTextContent(/—/)
  })

  it('renders a "Tier" column header', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [mkRanking({ districtId: '61', region: '2' })],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(awardsWithTier('Distinguished'))
    renderRegion('2')
    expect(
      await screen.findByRole('columnheader', { name: /^tier$/i })
    ).toBeInTheDocument()
  })
})

describe('RegionPage Distinguished countdown columns (#516 #513)', () => {
  const awardsFixture = (overrides: Partial<Record<string, unknown>> = {}) =>
    ({
      metadata: {
        snapshotId: 'x',
        calculatedAt: 'x',
        totalDistricts: 1,
      },
      extensionAward: [],
      twentyPlusAward: [],
      retentionAward: [],
      byDistrict: {},
      distinguishedDistrict: {
        '61': {
          districtId: '61',
          currentTier: 'NotDistinguished',
          allPrerequisitesMet: false,
          prerequisites: {
            dspSubmitted: false,
            trainingMet: false,
            marketAnalysisSubmitted: false,
            communicationPlanSubmitted: false,
            regionAdvisorVisitMet: false,
          },
          nextTierGap: {
            tier: 'Distinguished',
            netClubGrowthGap: 3,
            paymentGrowthGap: 12,
            distinguishedPercentGap: 8,
            clubGrowthGap: 0,
            paidClubBase: 90,
            paymentBase: 4500,
          },
        },
      },
      officerAwards: {
        educationTraining: [
          {
            districtId: '61',
            districtName: 'District 61',
            region: '2',
            qualifies: false,
          },
        ],
        clubGrowth: [
          {
            districtId: '61',
            districtName: 'District 61',
            region: '2',
            qualifies: true,
          },
        ],
      },
      ...overrides,
    }) as CompetitiveAwardStandings

  it('renders the "Remaining to Distinguished" column group and drops the old % headers (#688)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [mkRanking({ districtId: '61', region: '2' })],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(awardsFixture())
    renderRegion('2')

    // The new headline grouping (epic #683 F4): absolute counts remaining
    // to the minimum Distinguished tier.
    expect(
      await screen.findByRole('columnheader', {
        name: /remaining to distinguished/i,
      })
    ).toBeInTheDocument()
    // Officer-award + tier columns are unchanged.
    expect(
      screen.getByRole('columnheader', { name: /education ?\/ ?training/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /^cgd$/i })
    ).toBeInTheDocument()
    // The percentage-point prerequisite columns are GONE — Amy wants the
    // count, not the percentage (replace, don't bolt on — lesson 092).
    expect(
      screen.queryByRole('columnheader', { name: /payment growth/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('columnheader', { name: /distinguished %/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('columnheader', { name: /club growth %/i })
    ).not.toBeInTheDocument()
  })

  it('renders the canonical absolute remaining counts when present (#688)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [mkRanking({ districtId: '61', region: '2' })],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(
      awardsFixture({
        distinguishedDistrict: {
          '61': {
            districtId: '61',
            currentTier: 'NotDistinguished',
            allPrerequisitesMet: false,
            paidClubsRemaining: 12,
            paymentsRemaining: 277,
            distinguishedClubsRemaining: 14,
            prerequisites: {
              dspSubmitted: false,
              trainingMet: false,
              marketAnalysisSubmitted: false,
              communicationPlanSubmitted: false,
              regionAdvisorVisitMet: false,
            },
            nextTierGap: {
              tier: 'Distinguished',
              netClubGrowthGap: 0,
              paymentGrowthGap: 4.1,
              distinguishedPercentGap: 9,
              clubGrowthGap: 7.76,
              paidClubBase: 148,
              paymentBase: 6738,
            },
          },
        },
      })
    )
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D61')).closest(
      'tr'
    )!
    // Absolute count, not a percentage, and no signed "+" prefix.
    expect(
      within(row).getByTestId('countdown-paymentsRemaining')
    ).toHaveTextContent(/^277$/)
    expect(
      within(row).getByTestId('countdown-paidClubsRemaining')
    ).toHaveTextContent(/^12$/)
    expect(
      within(row).getByTestId('countdown-distinguishedClubsRemaining')
    ).toHaveTextContent(/^14$/)
  })

  it('derives the absolute count from the rankings row on a pre-pipeline snapshot — D47 payments = 277 (#688)', async () => {
    // No canonical *Remaining fields (snapshot predates the pipeline run),
    // so the count is derived from the rankings row's base + current
    // counts with the analytics formula — matching the canonical value
    // EXACTLY. Real prod D47: base 148/6738, current 138/6529, dist 53.
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '47',
          region: '2',
          paidClubBase: 148,
          paidClubs: 138,
          paymentBase: 6738,
          totalPayments: 6529,
          distinguishedClubs: 53,
        }),
      ],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(
      awardsFixture({
        distinguishedDistrict: {
          '47': {
            districtId: '47',
            currentTier: 'NotDistinguished',
            allPrerequisitesMet: false,
            prerequisites: {
              dspSubmitted: false,
              trainingMet: false,
              marketAnalysisSubmitted: false,
              communicationPlanSubmitted: false,
              regionAdvisorVisitMet: false,
            },
            nextTierGap: null,
          },
        },
      })
    )
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D47')).closest(
      'tr'
    )!
    expect(
      within(row).getByTestId('countdown-paymentsRemaining')
    ).toHaveTextContent(/^277$/)
    expect(
      within(row).getByTestId('countdown-paidClubsRemaining')
    ).toHaveTextContent(/^12$/)
    expect(
      within(row).getByTestId('countdown-distinguishedClubsRemaining')
    ).toHaveTextContent(/^14$/)
  })

  it('renders ✓ when a remaining metric is met (0) and a plain count when not (#688)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [mkRanking({ districtId: '61', region: '2' })],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(
      awardsFixture({
        distinguishedDistrict: {
          '61': {
            districtId: '61',
            currentTier: 'NotDistinguished',
            allPrerequisitesMet: false,
            paidClubsRemaining: 0,
            paymentsRemaining: 31,
            distinguishedClubsRemaining: 5,
            prerequisites: {
              dspSubmitted: false,
              trainingMet: false,
              marketAnalysisSubmitted: false,
              communicationPlanSubmitted: false,
              regionAdvisorVisitMet: false,
            },
            nextTierGap: null,
          },
        },
      })
    )
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D61')).closest(
      'tr'
    )!
    expect(
      within(row).getByTestId('countdown-paidClubsRemaining')
    ).toHaveTextContent(/✓/)
    expect(
      within(row).getByTestId('countdown-paymentsRemaining')
    ).toHaveTextContent(/^31$/)
    expect(
      within(row).getByTestId('countdown-distinguishedClubsRemaining')
    ).toHaveTextContent(/^5$/)
  })

  it('renders an em-dash for the remaining columns when the awards JSON is null (#688)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [mkRanking({ districtId: '61', region: '2' })],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(null)
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D61')).closest(
      'tr'
    )!
    expect(
      within(row).getByTestId('countdown-paidClubsRemaining')
    ).toHaveTextContent(/—/)
    expect(
      within(row).getByTestId('countdown-paymentsRemaining')
    ).toHaveTextContent(/—/)
    expect(
      within(row).getByTestId('countdown-distinguishedClubsRemaining')
    ).toHaveTextContent(/—/)
  })

  // #684 (epic #683 F1): the Net Club Growth column shows the SIGNED
  // actual net change (paidClubs − paidClubBase), not the clamped
  // distinguished-gap. A shrinking district must read negative.
  it('renders Net Club Growth as the signed net change, negative for a shrinking district', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      // D48 shape: lost 8 clubs (79 → 71). Pre-fix this rendered +8.
      rankings: [
        mkRanking({
          districtId: '48',
          region: '2',
          paidClubs: 71,
          paidClubBase: 79,
        }),
      ],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(awardsFixture())
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D48')).closest(
      'tr'
    )!
    const cell = within(row).getByTestId('countdown-netClubGrowth')
    expect(cell).toHaveTextContent(/-8/)
    expect(cell).not.toHaveTextContent(/\+8/)
  })

  it('renders Net Club Growth as +N for a growing district', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      // 90 → 100 = +10 net growth.
      rankings: [
        mkRanking({
          districtId: '61',
          region: '2',
          paidClubs: 100,
          paidClubBase: 90,
        }),
      ],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(awardsFixture())
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D61')).closest(
      'tr'
    )!
    expect(
      within(row).getByTestId('countdown-netClubGrowth')
    ).toHaveTextContent(/\+10/)
  })

  it('prefers the snapshot netClubGrowth field when present (post-pipeline)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      // Ranking-derived would be +10; the snapshot field wins.
      rankings: [
        mkRanking({
          districtId: '61',
          region: '2',
          paidClubs: 100,
          paidClubBase: 90,
        }),
      ],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(
      awardsFixture({
        distinguishedDistrict: {
          '61': {
            districtId: '61',
            currentTier: 'NotDistinguished',
            allPrerequisitesMet: false,
            netClubGrowth: -3,
            prerequisites: {
              dspSubmitted: false,
              trainingMet: false,
              marketAnalysisSubmitted: false,
              communicationPlanSubmitted: false,
              regionAdvisorVisitMet: false,
            },
            nextTierGap: {
              tier: 'Distinguished',
              netClubGrowthGap: 3,
              paymentGrowthGap: 0,
              distinguishedPercentGap: 0,
              clubGrowthGap: 0,
            },
          },
        },
      })
    )
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D61')).closest(
      'tr'
    )!
    const cell = within(row).getByTestId('countdown-netClubGrowth')
    expect(cell).toHaveTextContent(/-3/)
    expect(cell).not.toHaveTextContent(/\+10/)
  })

  it('renders ✓ for officer-award booleans when met, em-dash when not', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [mkRanking({ districtId: '61', region: '2' })],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(awardsFixture())
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D61')).closest(
      'tr'
    )!
    expect(
      within(row).getByTestId('countdown-educationTraining')
    ).toHaveTextContent(/—/)
    expect(within(row).getByTestId('countdown-clubGrowth')).toHaveTextContent(
      /✓/
    )
  })

  it('renders ✓ for numeric metrics that are already met', async () => {
    const fixture = awardsFixture({
      distinguishedDistrict: {
        '61': {
          districtId: '61',
          currentTier: 'Distinguished',
          allPrerequisitesMet: true,
          prerequisites: {
            dspSubmitted: true,
            trainingMet: true,
            marketAnalysisSubmitted: true,
            communicationPlanSubmitted: true,
            regionAdvisorVisitMet: true,
          },
          nextTierGap: {
            tier: 'Select',
            netClubGrowthGap: 0,
            paymentGrowthGap: -2,
            distinguishedPercentGap: 5,
            clubGrowthGap: 0,
          },
        },
      },
    })
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [mkRanking({ districtId: '61', region: '2' })],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(fixture)
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D61')).closest(
      'tr'
    )!
    // Already at Distinguished ⇒ every remaining-to-minimum metric is met
    // (✓), even though nextTierGap points at the higher Select tier. Net
    // Club Growth shows the signed net change (mkRanking 100 − 90 = +10).
    expect(
      within(row).getByTestId('countdown-paymentsRemaining')
    ).toHaveTextContent(/✓/)
    expect(
      within(row).getByTestId('countdown-paidClubsRemaining')
    ).toHaveTextContent(/✓/)
    expect(
      within(row).getByTestId('countdown-distinguishedClubsRemaining')
    ).toHaveTextContent(/✓/)
    expect(
      within(row).getByTestId('countdown-netClubGrowth')
    ).toHaveTextContent(/\+10/)
  })

  it('renders Net Club Growth from the rankings row even when the awards JSON is null (#684)', async () => {
    // Net growth is sourced from the rankings snapshot, not the awards
    // snapshot — so a legacy/missing awards file does not blank it.
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '61',
          region: '2',
          paidClubs: 100,
          paidClubBase: 90,
        }),
      ],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(null)
    renderRegion('2')

    const row = (await screen.findByTestId('district-number-chip-D61')).closest(
      'tr'
    )!
    expect(
      within(row).getByTestId('countdown-netClubGrowth')
    ).toHaveTextContent(/\+10/)
  })
})

describe('RegionPage KPI strip — base / current / Δ / ±% (#514 #513)', () => {
  it('shows current totals (existing behaviour)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '60',
          region: '2',
          paidClubs: 150,
          paidClubBase: 140,
          totalPayments: 6000,
          paymentBase: 5500,
          distinguishedClubs: 50,
        }),
        mkRanking({
          districtId: '61',
          region: '2',
          paidClubs: 200,
          paidClubBase: 190,
          totalPayments: 8000,
          paymentBase: 7000,
          distinguishedClubs: 70,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    // Paid Clubs card shows current total 350 = 150 + 200.
    const paidClubsCard = await screen.findByLabelText(/paid clubs kpi/i)
    expect(within(paidClubsCard).getByText('350')).toBeInTheDocument()
  })

  it('shows base, delta and ±% for Paid Clubs and Payments', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '60',
          region: '2',
          paidClubs: 150,
          paidClubBase: 140,
          totalPayments: 6000,
          paymentBase: 5500,
          distinguishedClubs: 50,
        }),
        mkRanking({
          districtId: '61',
          region: '2',
          paidClubs: 200,
          paidClubBase: 190,
          totalPayments: 8000,
          paymentBase: 7000,
          distinguishedClubs: 70,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    // Paid Clubs: base 330, current 350, Δ +20, +6.1%
    const paidCard = await screen.findByLabelText(/paid clubs kpi/i)
    expect(within(paidCard).getByTestId('kpi-base').textContent).toContain(
      '330'
    )
    expect(within(paidCard).getByTestId('kpi-delta').textContent).toContain(
      '+20'
    )
    expect(within(paidCard).getByTestId('kpi-percent').textContent).toMatch(
      /\+6\.1%/
    )

    // Payments: base 12500, current 14000, Δ +1500, +12.0%
    const paymentsCard = screen.getByLabelText(/payments kpi/i)
    expect(within(paymentsCard).getByTestId('kpi-base').textContent).toContain(
      '12,500'
    )
    expect(within(paymentsCard).getByTestId('kpi-delta').textContent).toContain(
      '+1,500'
    )
    expect(within(paymentsCard).getByTestId('kpi-percent').textContent).toMatch(
      /\+12\.0%/
    )
  })

  it('treats Distinguished Clubs as year-cumulative — base 0, delta = current', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '61',
          region: '2',
          distinguishedClubs: 48,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    const card = await screen.findByLabelText(/distinguished clubs kpi/i)
    expect(within(card).getByTestId('kpi-base').textContent).toContain('0')
    expect(within(card).getByTestId('kpi-delta').textContent).toContain('+48')
  })

  it('renders negative deltas in red (Δ < 0)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '61',
          region: '2',
          paidClubs: 130,
          paidClubBase: 140,
          totalPayments: 5000,
          paymentBase: 5500,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    const paidCard = await screen.findByLabelText(/paid clubs kpi/i)
    const delta = within(paidCard).getByTestId('kpi-delta')
    expect(delta.textContent).toContain('-10')
    expect(delta).toHaveClass('text-tm-true-maroon')
  })
})

describe('RegionPage base → current → Δ column model (#687 epic #683)', () => {
  const row61 = () =>
    screen
      .findByTestId('district-number-chip-D61')
      .then(el => el.closest('tr')!)

  it('renders grouped headers for the three metrics', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [mkRanking({ districtId: '61', region: '2' })],
      date: '2026-05-12',
    })
    renderRegion('2')

    expect(
      await screen.findByRole('columnheader', { name: /^paid clubs$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /membership payments/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /distinguished clubs/i })
    ).toBeInTheDocument()
  })

  it('retains the liked single columns (region rank, district, world rank, score)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [mkRanking({ districtId: '61', region: '2' })],
      date: '2026-05-12',
    })
    renderRegion('2')

    expect(
      await screen.findByRole('columnheader', { name: /region rank/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /^district$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /world rank/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /^score$/i })
    ).toBeInTheDocument()
  })

  it('renders Paid Clubs as base → current → signed Δ', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '61',
          region: '2',
          paidClubs: 100,
          paidClubBase: 90,
        }),
      ],
      date: '2026-05-12',
    })
    mockedFetchCdnAwards.mockResolvedValue(null)
    renderRegion('2')

    const row = await row61()
    expect(within(row).getByTestId('paid-base')).toHaveTextContent('90')
    expect(within(row).getByTestId('paid-current')).toHaveTextContent('100')
    // Δ is the signed net growth, reusing the #684 cell testid.
    expect(
      within(row).getByTestId('countdown-netClubGrowth')
    ).toHaveTextContent(/\+10/)
  })

  it('renders Membership Payments as base → current → signed Δ', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '61',
          region: '2',
          totalPayments: 5000,
          paymentBase: 4500,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    const row = await row61()
    expect(within(row).getByTestId('payments-base')).toHaveTextContent('4,500')
    expect(within(row).getByTestId('payments-current')).toHaveTextContent(
      '5,000'
    )
    const delta = within(row).getByTestId('payments-delta')
    expect(delta).toHaveTextContent(/\+500/)
    expect(delta.querySelector('span')).toHaveClass('text-green-700')
  })

  it('renders a shrinking Payments Δ as a negative maroon value', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '61',
          region: '2',
          totalPayments: 4200,
          paymentBase: 4500,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    const row = await row61()
    const delta = within(row).getByTestId('payments-delta')
    expect(delta).toHaveTextContent(/-300/)
    expect(delta).not.toHaveTextContent(/\+300/)
    expect(delta.querySelector('span')).toHaveClass('text-tm-true-maroon')
  })

  it('treats Distinguished Clubs as year-cumulative — base 0, Δ = current', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({ districtId: '61', region: '2', distinguishedClubs: 48 }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    const row = await row61()
    expect(within(row).getByTestId('dist-base')).toHaveTextContent('0')
    expect(within(row).getByTestId('dist-current')).toHaveTextContent('48')
    expect(within(row).getByTestId('dist-delta')).toHaveTextContent(/\+48/)
  })
})

describe('RegionPage rank-within-region column (#515 #513)', () => {
  it('renders a "Region Rank" column header on the district table', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({ districtId: '1', region: '1', aggregateScore: 300 }),
      ],
      date: '2026-05-12',
    })
    renderRegion('1')
    expect(
      await screen.findByRole('columnheader', { name: /region rank/i })
    ).toBeInTheDocument()
  })

  it('ranks districts within the region by aggregateScore descending', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '60',
          region: '2',
          aggregateScore: 100,
          overallRank: 50,
        }),
        mkRanking({
          districtId: '61',
          region: '2',
          aggregateScore: 300,
          overallRank: 10,
        }),
        mkRanking({
          districtId: '31',
          region: '2',
          aggregateScore: 200,
          overallRank: 30,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('2')

    const rows = await screen.findAllByRole('row')
    // skip the two header rows (#687 added a Base/Current/Δ sub-header row)
    const rank1 = within(rows[2]!).getByTestId('region-rank-cell')
    const rank2 = within(rows[3]!).getByTestId('region-rank-cell')
    const rank3 = within(rows[4]!).getByTestId('region-rank-cell')
    expect(rank1.textContent).toContain('#1')
    expect(rank2.textContent).toContain('#2')
    expect(rank3.textContent).toContain('#3')
    // D61 (score 300) ranks #1 within region 2.
    expect(within(rows[2]!).getByText(/D61/)).toBeInTheDocument()
  })

  it('marks tied region ranks (same aggregateScore) as tied', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '7',
          region: '3',
          aggregateScore: 250,
          overallRank: 20,
        }),
        mkRanking({
          districtId: '8',
          region: '3',
          aggregateScore: 250,
          overallRank: 21,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('3')

    const rows = await screen.findAllByRole('row')
    // skip the two header rows (#687 Base/Current/Δ sub-header row)
    expect(
      within(rows[2]!).getByTestId('region-rank-cell').textContent
    ).toMatch(/#1.*tied/i)
    expect(
      within(rows[3]!).getByTestId('region-rank-cell').textContent
    ).toMatch(/#1.*tied/i)
  })

  it('does not duplicate the district number when districtName is bare (#522)', async () => {
    mockedFetchCdnRankings.mockResolvedValueOnce({
      rankings: [
        mkRanking({
          districtId: '86',
          districtName: '86',
          region: '6',
          overallRank: 5,
        }),
      ],
      date: '2026-05-12',
    })
    renderRegion('6')

    const rows = await screen.findAllByRole('row')
    // skip the two header rows (#687 Base/Current/Δ sub-header row)
    const districtCell = within(rows[2]!).getByTestId(
      'district-number-chip-D86'
    )
    expect(districtCell).toHaveTextContent('D86')
    // The bare "86" name should NOT render as a sibling span — the chip
    // already conveys the number.
    expect(within(rows[2]!).queryByText(/^86$/)).not.toBeInTheDocument()
  })
})
