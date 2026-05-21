import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { KpiBulletCard } from '../KpiBulletCard'
import type { MetricRankings, RecognitionTargets } from '../../types/districts'

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

const standardTargets: RecognitionTargets = {
  distinguished: 158,
  select: 161,
  presidents: 164,
  smedley: 169,
}

const standardRankings: MetricRankings = {
  worldRank: 30,
  worldPercentile: 77, // (128-30)/128 * 100 ≈ 77 → "23rd percentile"
  regionRank: 3,
  totalDistricts: 128,
  totalInRegion: 11,
  region: '05',
}

afterEach(() => cleanup())

describe('KpiBulletCard', () => {
  describe('basic rendering', () => {
    it('renders the title and current value', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={149}
          targets={standardTargets}
          rankings={standardRankings}
        />
      )
      expect(screen.getByText('Paid Clubs')).toBeInTheDocument()
      expect(screen.getByTestId('kpi-value')).toHaveTextContent('149')
    })

    it('formats large current values with locale separators', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Membership Payments"
          current={5707}
          targets={{
            distinguished: 5822,
            select: 5937,
            presidents: 6053,
            smedley: 6226,
          }}
          rankings={standardRankings}
        />
      )
      expect(screen.getByTestId('kpi-value')).toHaveTextContent('5,707')
    })

    it('renders the info tooltip when tooltipContent is provided', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={149}
          targets={standardTargets}
          rankings={standardRankings}
          tooltipContent="How many clubs have paid this period."
        />
      )
      // The Tooltip wraps an <InfoIcon /> — assert by aria-label or role
      expect(screen.getByLabelText(/more info/i)).toBeInTheDocument()
    })
  })

  describe('inline rank line', () => {
    it('renders #rank of total, percentile, and region rank chips', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={149}
          targets={standardTargets}
          rankings={standardRankings}
        />
      )
      expect(screen.getByText(/#30 of 128/)).toBeInTheDocument()
      expect(screen.getByText(/23rd percentile/)).toBeInTheDocument()
      // Region chip — links to /region/05 when numeric
      const regionLink = screen.getByTestId('region-rank')
      expect(regionLink).toHaveTextContent('05')
      expect(regionLink).toHaveTextContent('#3')
    })

    it('shows "—" placeholders when rank data is missing', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={149}
          targets={standardTargets}
          rankings={{
            worldRank: null,
            worldPercentile: null,
            regionRank: null,
            totalDistricts: 0,
            totalInRegion: 0,
            region: null,
          }}
        />
      )
      // World rank chip shows an em-dash fallback
      expect(screen.getByTestId('world-rank')).toHaveTextContent('—')
      // No region chip when region is null
      expect(screen.queryByTestId('region-rank')).not.toBeInTheDocument()
    })
  })

  describe('bullet bar', () => {
    it('renders a single progressbar with current as aria-valuenow', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={149}
          targets={standardTargets}
          rankings={standardRankings}
        />
      )
      const bar = screen.getByRole('progressbar')
      expect(bar).toHaveAttribute('aria-valuenow', '149')
      expect(bar).toHaveAttribute('aria-valuemin', '0')
      expect(bar).toHaveAttribute('aria-valuemax', '169') // Smedley
    })

    it('renders four tier ticks with short labels D, S, P, Sm', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={149}
          targets={standardTargets}
          rankings={standardRankings}
        />
      )
      const bar = screen.getByRole('progressbar')
      expect(
        within(bar).getByTestId('tier-tick-distinguished')
      ).toHaveTextContent('D')
      expect(within(bar).getByTestId('tier-tick-select')).toHaveTextContent('S')
      expect(within(bar).getByTestId('tier-tick-presidents')).toHaveTextContent(
        'P'
      )
      expect(within(bar).getByTestId('tier-tick-smedley')).toHaveTextContent(
        'Sm'
      )
    })

    it('renders each tier threshold value next to its tick', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={149}
          targets={standardTargets}
          rankings={standardRankings}
        />
      )
      const bar = screen.getByRole('progressbar')
      expect(
        within(bar).getByTestId('tier-tick-distinguished')
      ).toHaveTextContent('158')
      expect(within(bar).getByTestId('tier-tick-select')).toHaveTextContent(
        '161'
      )
      expect(within(bar).getByTestId('tier-tick-presidents')).toHaveTextContent(
        '164'
      )
      expect(within(bar).getByTestId('tier-tick-smedley')).toHaveTextContent(
        '169'
      )
    })

    it('positions the current-value marker proportionally between 0 and Smedley', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={149}
          targets={standardTargets}
          rankings={standardRankings}
        />
      )
      const marker = screen.getByTestId('current-marker')
      // 149 / 169 = 88.16%
      expect(marker).toHaveStyle({ left: '88.17%' })
    })

    it('caps marker position at 100% when current exceeds Smedley', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={200}
          targets={standardTargets}
          rankings={standardRankings}
        />
      )
      const marker = screen.getByTestId('current-marker')
      expect(marker).toHaveStyle({ left: '100%' })
    })

    it('marks the marker as "all tiers achieved" when current >= Smedley', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={170}
          targets={standardTargets}
          rankings={standardRankings}
        />
      )
      const marker = screen.getByTestId('current-marker')
      expect(marker).toHaveAttribute('data-all-achieved', 'true')
    })

    it('does not render the bullet bar when Smedley threshold is zero', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={0}
          targets={{
            distinguished: 0,
            select: 0,
            presidents: 0,
            smedley: 0,
          }}
          rankings={standardRankings}
        />
      )
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    it('does not render a bullet bar when targets is null', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={149}
          targets={null}
          rankings={standardRankings}
        />
      )
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      // Fallback message lives in a testable element
      expect(screen.getByTestId('targets-unavailable')).toBeInTheDocument()
    })
  })

  describe('aria labelling', () => {
    it('uses a sensible default aria-label that includes the title', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={149}
          targets={standardTargets}
          rankings={standardRankings}
        />
      )
      const bar = screen.getByRole('progressbar')
      expect(bar).toHaveAccessibleName(/paid clubs/i)
    })

    it('honors an explicit barAriaLabel prop when provided', () => {
      renderWithRouter(
        <KpiBulletCard
          title="Paid Clubs"
          current={149}
          targets={standardTargets}
          rankings={standardRankings}
          barAriaLabel="District 61 paid clubs progress to Distinguished tiers"
        />
      )
      const bar = screen.getByRole('progressbar')
      expect(bar).toHaveAccessibleName(
        'District 61 paid clubs progress to Distinguished tiers'
      )
    })
  })
})
