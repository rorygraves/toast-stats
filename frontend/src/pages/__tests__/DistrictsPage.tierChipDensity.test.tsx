/* Districts page — DDP tier chip + row-density improvements (#546).
   - Tier chip appears on each row when the district has qualified for
     Distinguished or higher.
   - No chip when currentTier is NotDistinguished or missing.
   - Smedley districts receive an extra rare-tier visual treatment
     (data-attribute hook for CSS).
   - Per-metric cells no longer prefix "Rank " — just "#1 · +8.7%".
   - Per-column InfoTooltips are consolidated to a single header-level
     affordance (the four icons no longer wrap the header row).
   - REGION as a standalone column is collapsed into the District cell. */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import DistrictsPage from '../DistrictsPage'
import { fetchCdnRankings, fetchCdnCompetitiveAwards } from '../../services/cdn'
import { renderWithProviders } from '../../__tests__/test-utils'

vi.mock('../../services/cdn', () => ({
  fetchCdnDates: vi.fn().mockResolvedValue({
    dates: [],
    count: 0,
    generatedAt: '2025-01-01T00:00:00Z',
  }),
  fetchCdnSnapshotIndex: vi.fn().mockResolvedValue({}),
  fetchCdnRankings: vi.fn(),
  fetchCdnRankingsForDate: vi.fn(),
  fetchCdnManifest: vi.fn().mockResolvedValue({
    latestSnapshotDate: '2026-05-18',
    generatedAt: '2026-05-18T00:00:00Z',
  }),
  fetchCdnCompetitiveAwards: vi.fn(),
  cdnAnalyticsUrl: vi.fn().mockReturnValue('https://cdn.taverns.red/test'),
  fetchFromCdn: vi.fn(),
}))

vi.mock('../../hooks/useDistricts', () => ({
  useDistricts: () => ({
    data: { districts: [] },
    isLoading: false,
    isError: false,
  }),
}))

const mockedFetchCdnRankings = vi.mocked(fetchCdnRankings)
const mockedFetchCdnCompetitiveAwards = vi.mocked(fetchCdnCompetitiveAwards)

const setupRankingsWithFourTiers = () => {
  mockedFetchCdnRankings.mockResolvedValue({
    rankings: [
      mkRanking('93', '8', 1),
      mkRanking('110', '11', 2),
      mkRanking('57', '7', 3),
      mkRanking('1', '1', 4),
      mkRanking('99', '1', 5),
    ],
    date: '2026-05-18',
  })
  mockedFetchCdnCompetitiveAwards.mockResolvedValue({
    metadata: {
      snapshotId: '2026-05-18',
      calculatedAt: '2026-05-18T00:00:00Z',
      totalDistricts: 5,
    },
    extensionAward: [],
    twentyPlusAward: [],
    retentionAward: [],
    byDistrict: {},
    distinguishedDistrict: {
      '93': mkStatus('93', 'Presidents'),
      '110': mkStatus('110', 'Distinguished'),
      '57': mkStatus('57', 'Select'),
      '1': mkStatus('1', 'Smedley'),
      '99': mkStatus('99', 'NotDistinguished'),
    },
  })
}

const mkRanking = (id: string, region: string, rank: number) => ({
  districtId: id,
  districtName: id,
  region,
  paidClubs: 75,
  paidClubBase: 70,
  clubGrowthPercent: 7.14,
  totalPayments: 2800,
  paymentBase: 2600,
  paymentGrowthPercent: 7.69,
  activeClubs: 75,
  distinguishedClubs: 35,
  selectDistinguished: 15,
  presidentsDistinguished: 8,
  distinguishedPercent: 50,
  clubsRank: rank,
  paymentsRank: rank,
  distinguishedRank: rank,
  aggregateScore: 300 - rank * 10,
})

const mkStatus = (
  id: string,
  tier:
    | 'NotDistinguished'
    | 'Distinguished'
    | 'Select'
    | 'Presidents'
    | 'Smedley'
) => ({
  districtId: id,
  currentTier: tier,
  allPrerequisitesMet: tier !== 'NotDistinguished',
  prerequisites: {
    dspSubmitted: true,
    trainingMet: true,
    marketAnalysisSubmitted: true,
    communicationPlanSubmitted: true,
    regionAdvisorVisitMet: true,
  },
  nextTierGap: null,
})

const findRow = (districtId: string) =>
  screen.getByTestId(`district-row-${districtId}`)

describe('DistrictsPage — DDP tier chip + density (#546)', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('tier chip', () => {
    it("renders a President's chip for a President's-tier district", async () => {
      setupRankingsWithFourTiers()
      renderWithProviders(<DistrictsPage />)
      await screen.findByTestId('district-row-93')
      const chip = within(findRow('93')).getByTestId('tier-chip-93')
      expect(chip).toHaveTextContent(/president/i)
    })

    it('renders a Distinguished chip for a Distinguished-tier district', async () => {
      setupRankingsWithFourTiers()
      renderWithProviders(<DistrictsPage />)
      await screen.findByTestId('district-row-110')
      expect(
        within(findRow('110')).getByTestId('tier-chip-110')
      ).toHaveTextContent(/distinguished/i)
    })

    it('renders a Select chip for a Select-tier district', async () => {
      setupRankingsWithFourTiers()
      renderWithProviders(<DistrictsPage />)
      await screen.findByTestId('district-row-57')
      expect(
        within(findRow('57')).getByTestId('tier-chip-57')
      ).toHaveTextContent(/select/i)
    })

    it('does NOT render a chip for NotDistinguished districts (absence = signal)', async () => {
      setupRankingsWithFourTiers()
      renderWithProviders(<DistrictsPage />)
      await screen.findByTestId('district-row-99')
      expect(
        within(findRow('99')).queryByTestId('tier-chip-99')
      ).not.toBeInTheDocument()
    })

    it('gives Smedley districts a rare-tier visual hook (data-tier="Smedley")', async () => {
      setupRankingsWithFourTiers()
      renderWithProviders(<DistrictsPage />)
      await screen.findByTestId('district-row-1')
      const chip = within(findRow('1')).getByTestId('tier-chip-1')
      expect(chip).toHaveAttribute('data-tier', 'Smedley')
      expect(chip).toHaveTextContent(/smedley/i)
    })

    it('exposes data-tier on the <tr> so CSS can style the whole row by tier', async () => {
      setupRankingsWithFourTiers()
      renderWithProviders(<DistrictsPage />)
      await screen.findByTestId('district-row-1')
      // Row for the Smedley district carries the data-tier hook so
      // future CSS (e.g. row gold border) is one selector away.
      expect(findRow('1')).toHaveAttribute('data-tier', 'Smedley')
      // NotDistinguished rows do not get a data-tier attribute.
      expect(findRow('99')).not.toHaveAttribute('data-tier')
    })

    it('renders rows without chips when competitiveAwards fetch fails', async () => {
      mockedFetchCdnRankings.mockResolvedValue({
        rankings: [mkRanking('93', '8', 1), mkRanking('110', '11', 2)],
        date: '2026-05-18',
      })
      // CDN fetch failure → hook returns null/undefined → page must
      // still render rows with em-dash placeholders, not crash.
      mockedFetchCdnCompetitiveAwards.mockRejectedValue(
        new Error('CDN fetch failed')
      )
      renderWithProviders(<DistrictsPage />)
      await screen.findByTestId('district-row-93')
      expect(
        within(findRow('93')).queryByTestId('tier-chip-93')
      ).not.toBeInTheDocument()
      expect(
        within(findRow('110')).queryByTestId('tier-chip-110')
      ).not.toBeInTheDocument()
    })
  })

  describe('density — per-metric cells', () => {
    it('drops the "Rank " word prefix from per-metric cells (just shows #N)', async () => {
      setupRankingsWithFourTiers()
      renderWithProviders(<DistrictsPage />)
      await screen.findByTestId('district-row-93')
      const row = findRow('93')
      // None of the per-metric cells should contain the literal "Rank #"
      // prefix anymore — they should show just "#1" or "#2" etc.
      expect(within(row).queryByText(/Rank\s+#/)).not.toBeInTheDocument()
      // The numeric rank itself is still present.
      expect(within(row).getAllByText(/#1\b/).length).toBeGreaterThan(0)
    })
  })

  describe('density — header tooltips', () => {
    it('consolidates per-column InfoTooltips into a single table-level affordance', async () => {
      setupRankingsWithFourTiers()
      renderWithProviders(<DistrictsPage />)
      await screen.findByTestId('district-row-93')
      // Single affordance lives near the table title with a stable testid.
      expect(
        screen.getByTestId('rankings-table-methodology-affordance')
      ).toBeInTheDocument()
      // The four per-column InfoTooltip icons inside the rankings table
      // header are gone. InfoTooltip renders a <button aria-label="info">
      // so we count those inside columnheader cells.
      const table = screen.getByRole('table', { name: /district rankings/i })
      const header = within(table).getAllByRole('columnheader')
      const tooltipButtons = header.flatMap(h =>
        within(h).queryAllByRole('button', { name: /^info$/i })
      )
      expect(tooltipButtons).toHaveLength(0)
    })
  })

  describe('density — REGION column collapse', () => {
    it('removes the standalone REGION column from the rankings table header', async () => {
      setupRankingsWithFourTiers()
      renderWithProviders(<DistrictsPage />)
      await screen.findByTestId('district-row-93')
      const table = screen.getByRole('table', { name: /district rankings/i })
      const headers = within(table).getAllByRole('columnheader')
      const headerTexts = headers.map(h => h.textContent?.trim() ?? '')
      // The standalone "Region" column is gone — region info moves into
      // the District cell as a subtle suffix.
      expect(headerTexts).not.toContain('Region')
      expect(headerTexts).not.toContain('REGION')
    })

    it('surfaces region as a subtle "· R<n>" suffix inside the District cell', async () => {
      setupRankingsWithFourTiers()
      renderWithProviders(<DistrictsPage />)
      await screen.findByTestId('district-row-93')
      const row = findRow('93')
      // D93 is in region 8 per the fixture.
      expect(
        within(row).getByTestId('district-region-suffix-93')
      ).toHaveTextContent(/R8/)
    })
  })
})
