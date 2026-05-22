import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  DistinguishedDistrictTrophyCase,
  type DistinguishedDistrictStatus,
} from '../DistinguishedDistrictTrophyCase'

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
    // #555 — base values used to derive concrete-unit secondary lines.
    paidClubBase: 161,
    paymentBase: 5605,
  },
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

  describe('gap to next tier — inline tile row (#555, #556)', () => {
    it('renders three tiles in Club Growth → Payment Growth → % Distinguished order', () => {
      render(<DistinguishedDistrictTrophyCase status={baseStatus} />)
      const tiles = screen.getByTestId('distinguished-gap-tiles')
      const labels = within(tiles).getAllByTestId('gap-tile-label')
      expect(labels.map(l => l.textContent)).toEqual([
        'Club growth',
        'Payment growth',
        '% Distinguished',
      ])
      // Net Club Growth tile is gone (#556)
      expect(screen.queryByText(/Net club growth/i)).not.toBeInTheDocument()
    })

    it('renders both the percentage and the concrete unit count per tile (#555)', () => {
      render(<DistinguishedDistrictTrophyCase status={baseStatus} />)
      const tiles = screen.getByTestId('distinguished-gap-tiles')
      const values = within(tiles).getAllByTestId('gap-tile-value')
      const units = within(tiles).getAllByTestId('gap-tile-units')

      // Order: Club growth, Payment growth, % Distinguished
      expect(values[0]).toHaveTextContent('+5.5%')
      // 161 × 5.5% = 8.855 → ~9 clubs
      expect(units[0]).toHaveTextContent('~9 clubs')

      expect(values[1]).toHaveTextContent('+2.0%')
      // 5605 × 2% = 112.1 → ~112 payments
      expect(units[1]).toHaveTextContent('~112 payments')

      expect(values[2]).toHaveTextContent('+13.6%')
      // 161 × 13.6 / 100 = 21.896 → ~22 clubs (Distinguished clubs)
      expect(units[2]).toHaveTextContent('~22 clubs')
    })

    it('singularises units when count is exactly 1', () => {
      const tinyGap: DistinguishedDistrictStatus = {
        ...baseStatus,
        nextTierGap: {
          tier: 'Distinguished',
          paymentGrowthGap: 0.018, // 5605 × 0.00018 = 1.01 → 1 payment
          clubGrowthGap: 0.62, // 161 × 0.0062 = 1.0 → 1 club
          distinguishedPercentGap: 0.62, // 161 × 0.62/100 = 1.0 → 1 club
          netClubGrowthGap: 1,
          paidClubBase: 161,
          paymentBase: 5605,
        },
      }
      render(<DistinguishedDistrictTrophyCase status={tinyGap} />)
      const units = screen.getAllByTestId('gap-tile-units')
      expect(units[0]).toHaveTextContent('~1 club')
      expect(units[1]).toHaveTextContent('~1 payment')
      expect(units[2]).toHaveTextContent('~1 club')
    })

    it('renders a ✓ with no concrete-unit line when a gap is zero', () => {
      const closed: DistinguishedDistrictStatus = {
        ...baseStatus,
        nextTierGap: {
          tier: 'Distinguished',
          paymentGrowthGap: 0,
          clubGrowthGap: 0,
          distinguishedPercentGap: 0,
          netClubGrowthGap: 0,
          paidClubBase: 161,
          paymentBase: 5605,
        },
      }
      render(<DistinguishedDistrictTrophyCase status={closed} />)
      const values = screen.getAllByTestId('gap-tile-value')
      values.forEach(v => expect(v).toHaveTextContent('✓'))
      // No "gap-tile-units" rendered when the gap is closed
      expect(screen.queryByTestId('gap-tile-units')).not.toBeInTheDocument()
    })
  })

  it('renders nothing when status is null', () => {
    const { container } = render(
      <DistinguishedDistrictTrophyCase status={null} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
