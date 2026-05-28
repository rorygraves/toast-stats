import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  DistinguishedDistrictTrophyCase,
  type DistinguishedDistrictStatus,
} from '../DistinguishedDistrictTrophyCase'
import type { RemainingInputs } from '../../utils/distinguishedCountdown'

afterEach(() => cleanup())

const baseStatus: DistinguishedDistrictStatus = {
  districtId: '61',
  currentTier: 'NotDistinguished',
  allPrerequisitesMet: true,
  prerequisites: {
    dspSubmitted: true,
    trainingMet: true,
    marketAnalysisSubmitted: true,
    communicationPlanSubmitted: true,
    regionAdvisorVisitMet: true,
  },
  nextTierGap: {
    tier: 'Distinguished',
    paymentGrowthGap: 2,
    clubGrowthGap: 5.5,
    distinguishedPercentGap: 13.6,
    netClubGrowthGap: 7,
    paidClubBase: 161,
    paymentBase: 5605,
  },
  // #840 — canonical absolute counts to the Distinguished gate. Match
  // the integers a region row would show; same shape as RegionPage.
  paidClubsRemaining: 11,
  paymentsRemaining: 169,
  distinguishedClubsRemaining: 20,
}

const baseRanking: RemainingInputs = {
  paidClubBase: 161,
  paidClubs: 152,
  paymentBase: 5605,
  totalPayments: 5493,
  distinguishedClubs: 53,
}

describe('DistinguishedDistrictTrophyCase', () => {
  describe('header', () => {
    it('renders the title and the program-item caption', () => {
      render(<DistinguishedDistrictTrophyCase status={baseStatus} />)
      expect(
        screen.getByRole('heading', { name: /Distinguished District Status/i })
      ).toBeInTheDocument()
      expect(screen.getByText(/Program Item 1490/i)).toBeInTheDocument()
      expect(
        screen.queryByText(/Distinguished District Program/i)
      ).not.toBeInTheDocument()
    })

    it('renders the status pill with the current tier label', () => {
      render(<DistinguishedDistrictTrophyCase status={baseStatus} />)
      const pill = screen.getByTestId('distinguished-status-pill')
      expect(pill).toHaveTextContent(/Not Yet Distinguished/i)
    })
  })

  describe('prerequisites — collapsed by default when all met', () => {
    it('collapses to a single summary line when all prerequisites are met', () => {
      render(<DistinguishedDistrictTrophyCase status={baseStatus} />)
      const toggle = screen.getByRole('button', {
        name: /5 of 5 prerequisites met/i,
      })
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(
        screen.queryByText(/District Success Plan submitted/i)
      ).not.toBeInTheDocument()
    })

    it('expands the prerequisites list when the toggle is clicked', async () => {
      const user = userEvent.setup()
      render(<DistinguishedDistrictTrophyCase status={baseStatus} />)
      const toggle = screen.getByRole('button', {
        name: /5 of 5 prerequisites met/i,
      })
      await user.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(
        screen.getByText(/District Success Plan submitted/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/2\+ Region Advisor meetings/i)
      ).toBeInTheDocument()
    })
  })

  describe('prerequisites — auto-expanded when any item is missing', () => {
    it('renders a non-interactive status summary and the full list', () => {
      const unmet: DistinguishedDistrictStatus = {
        ...baseStatus,
        allPrerequisitesMet: false,
        prerequisites: {
          ...baseStatus.prerequisites,
          marketAnalysisSubmitted: false,
        },
      }
      render(<DistinguishedDistrictTrophyCase status={unmet} />)
      // No toggle button when the list is locked open — the summary is a
      // status, not an interactive control.
      expect(
        screen.queryByRole('button', { name: /prerequisites met/i })
      ).not.toBeInTheDocument()
      expect(screen.getByText(/4 of 5 prerequisites met/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Market Analysis Plan submitted/i)
      ).toBeInTheDocument()
    })
  })

  describe('gap to next tier — canonical countdown tiles (#840)', () => {
    /* The district tiles must consume the SAME integers the region row's
       "Remaining to Distinguished" cells consume — never a value derived
       from TI's pre-rounded gap %. Integer is the headline; percentage is
       the sub-item. Labels match the region page exactly. Lesson 103/104. */

    it('renders three tiles in Paid Clubs → Payments → Distinguished Clubs order with region-page labels', () => {
      render(
        <DistinguishedDistrictTrophyCase
          status={baseStatus}
          ranking={baseRanking}
        />
      )
      const tiles = screen.getByTestId('distinguished-gap-tiles')
      const labels = within(tiles).getAllByTestId('gap-tile-label')
      expect(labels.map(l => l.textContent)).toEqual([
        'Paid Clubs',
        'Payments',
        'Distinguished Clubs',
      ])
      expect(screen.queryByText(/Club growth/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Payment growth/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/% Distinguished/i)).not.toBeInTheDocument()
    })

    it('renders the canonical integer as the headline and the percentage as a sub-item (no ~)', () => {
      render(
        <DistinguishedDistrictTrophyCase
          status={baseStatus}
          ranking={baseRanking}
        />
      )
      const tiles = screen.getByTestId('distinguished-gap-tiles')
      const values = within(tiles).getAllByTestId('gap-tile-value')
      const subitems = within(tiles).getAllByTestId('gap-tile-subitem')

      // Headlines — exact canonical counts. Distinguished-Clubs is 20,
      // not 19 (the rounded-% derivation bug).
      expect(values[0]).toHaveTextContent(/^11 clubs?$/)
      expect(values[1]).toHaveTextContent(/^169 payments$/)
      expect(values[2]).toHaveTextContent(/^20 clubs$/)

      // Percentages are demoted to the sub-item, no "~" prefix on either.
      expect(subitems[0]).toHaveTextContent(/^\+5\.5%$/)
      expect(subitems[1]).toHaveTextContent(/^\+2\.0%$/)
      expect(subitems[2]).toHaveTextContent(/^\+13\.6%$/)

      // The "~" approximation marker is gone — the integer is exact now.
      values.forEach(v => expect(v.textContent).not.toMatch(/~/))
      subitems.forEach(s => expect(s.textContent).not.toMatch(/~/))
    })

    it('prefers the canonical status field over a derivation from the rankings row', () => {
      // status carries 20 (canonical); rankings derivation would give 20 too,
      // but if they disagreed the canonical field wins.
      const drifted = {
        ...baseStatus,
        distinguishedClubsRemaining: 22, // deliberately != derivation
      }
      render(
        <DistinguishedDistrictTrophyCase
          status={drifted}
          ranking={baseRanking}
        />
      )
      const values = screen.getAllByTestId('gap-tile-value')
      expect(values[2]).toHaveTextContent(/^22 clubs$/)
    })

    it('derives counts from the rankings row when the canonical fields are absent', () => {
      const noCanonical: DistinguishedDistrictStatus = {
        ...baseStatus,
      }
      delete (noCanonical as Partial<DistinguishedDistrictStatus>)
        .paidClubsRemaining
      delete (noCanonical as Partial<DistinguishedDistrictStatus>)
        .paymentsRemaining
      delete (noCanonical as Partial<DistinguishedDistrictStatus>)
        .distinguishedClubsRemaining

      render(
        <DistinguishedDistrictTrophyCase
          status={noCanonical}
          ranking={baseRanking}
        />
      )
      const values = screen.getAllByTestId('gap-tile-value')
      // Same headline integers via derivation: 11 / 169 / 20.
      expect(values[0]).toHaveTextContent(/^11 clubs?$/)
      expect(values[1]).toHaveTextContent(/^169 payments$/)
      expect(values[2]).toHaveTextContent(/^20 clubs$/)
    })

    it('uses the next-tier thresholds for districts already at Distinguished', () => {
      // Already at Distinguished, counting down to Select (+3% growth,
      // 50% distinguished, plus-one): from baseRanking →
      // paid: ceil(161 × 1.03) − 152 = 14; payments: ceil(5605 × 1.03) − 5493 = 281;
      // dist: ceil(161 × 0.50) − 53 = 28.
      const atDistinguished: DistinguishedDistrictStatus = {
        ...baseStatus,
        currentTier: 'Distinguished',
        nextTierGap: {
          ...baseStatus.nextTierGap!,
          tier: 'Select',
        },
      }
      // Remove canonical Distinguished-tier counts — they're for the wrong
      // gate when the next target is Select.
      delete (atDistinguished as Partial<DistinguishedDistrictStatus>)
        .paidClubsRemaining
      delete (atDistinguished as Partial<DistinguishedDistrictStatus>)
        .paymentsRemaining
      delete (atDistinguished as Partial<DistinguishedDistrictStatus>)
        .distinguishedClubsRemaining

      render(
        <DistinguishedDistrictTrophyCase
          status={atDistinguished}
          ranking={baseRanking}
        />
      )
      const values = screen.getAllByTestId('gap-tile-value')
      expect(values[0]).toHaveTextContent(/^14 clubs$/)
      expect(values[1]).toHaveTextContent(/^281 payments$/)
      expect(values[2]).toHaveTextContent(/^28 clubs$/)
    })

    it('singularises the unit noun when the count is exactly 1', () => {
      const oneEach: DistinguishedDistrictStatus = {
        ...baseStatus,
        paidClubsRemaining: 1,
        paymentsRemaining: 1,
        distinguishedClubsRemaining: 1,
      }
      render(<DistinguishedDistrictTrophyCase status={oneEach} />)
      const values = screen.getAllByTestId('gap-tile-value')
      expect(values[0]).toHaveTextContent(/^1 club$/)
      expect(values[1]).toHaveTextContent(/^1 payment$/)
      expect(values[2]).toHaveTextContent(/^1 club$/)
    })

    it('renders ✓ when a metric minimum is met (canonical remaining = 0)', () => {
      const closed: DistinguishedDistrictStatus = {
        ...baseStatus,
        paidClubsRemaining: 0,
        paymentsRemaining: 0,
        distinguishedClubsRemaining: 0,
      }
      render(<DistinguishedDistrictTrophyCase status={closed} />)
      const values = screen.getAllByTestId('gap-tile-value')
      values.forEach(v => expect(v).toHaveTextContent('✓'))
      // No sub-item rendered when the gate is met.
      expect(screen.queryByTestId('gap-tile-subitem')).not.toBeInTheDocument()
    })
  })

  it('renders nothing when status is null', () => {
    const { container } = render(
      <DistinguishedDistrictTrophyCase status={null} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
