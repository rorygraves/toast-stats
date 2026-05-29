/**
 * Unit Tests for DivisionSummary Component
 *
 * Tests the rendering and behavior of the DivisionSummary component,
 * verifying that it correctly displays division identifier, status badge,
 * paid clubs progress, distinguished clubs progress, recognition badges,
 * and gap indicators.
 *
 * Validates Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */

import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import '@testing-library/jest-dom'
import DivisionSummary from '../DivisionSummary'
import type { DivisionGapAnalysis } from '../../utils/divisionGapAnalysis'
describe('DivisionSummary', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  describe('Division Identifier Display (Requirement 3.1)', () => {
    it('should display the division identifier', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      expect(screen.getByText('Division A')).toBeInTheDocument()
    })

    // CC-7 (#872, epic #873 Sprint 2): when a `to` is supplied, the division
    // heading becomes a real <Link> to the division detail page — the division
    // performance card was previously a dead end (no link to the route that
    // exists). Restores middle-click / ⌘-click / open-in-new-tab.
    it('renders the heading as a link to the division page when `to` is set', () => {
      render(
        <MemoryRouter>
          <DivisionSummary
            divisionId="A"
            to="/district/61/division/A"
            status="distinguished"
            paidClubs={10}
            clubBase={10}
            netGrowth={0}
            distinguishedClubs={5}
            requiredDistinguishedClubs={5}
          />
        </MemoryRouter>
      )

      const link = screen.getByRole('link', { name: /Division A/ })
      expect(link).toHaveAttribute('href', '/district/61/division/A')
    })

    it('should display different division identifiers', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="B"
          status="distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      expect(screen.getByText('Division B')).toBeInTheDocument()

      cleanupAllResources()

      renderWithProviders(
        <DivisionSummary
          divisionId="C"
          status="distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      expect(screen.getByText('Division C')).toBeInTheDocument()
    })
  })

  describe('Status Badge Display (Requirement 3.2, 3.5)', () => {
    it('should display "President\'s Distinguished" status', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="presidents-distinguished"
          paidClubs={12}
          clubBase={10}
          netGrowth={2}
          distinguishedClubs={6}
          requiredDistinguishedClubs={5}
        />
      )

      expect(screen.getByText("President's Distinguished")).toBeInTheDocument()
      expect(
        screen.getByRole('status', {
          name: /Division status: President's Distinguished/i,
        })
      ).toBeInTheDocument()
    })

    it('should display "Select Distinguished" status', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="select-distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={6}
          requiredDistinguishedClubs={5}
        />
      )

      expect(screen.getByText('Select Distinguished')).toBeInTheDocument()
      expect(
        screen.getByRole('status', {
          name: /Division status: Select Distinguished/i,
        })
      ).toBeInTheDocument()
    })

    it('should display "Distinguished" status', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      expect(screen.getByText('Distinguished')).toBeInTheDocument()
      expect(
        screen.getByRole('status', { name: /Division status: Distinguished/i })
      ).toBeInTheDocument()
    })

    it('should display "Not Distinguished" status', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="not-distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={4}
          requiredDistinguishedClubs={5}
        />
      )

      expect(screen.getByText('Not Distinguished')).toBeInTheDocument()
      expect(
        screen.getByRole('status', {
          name: /Division status: Not Distinguished/i,
        })
      ).toBeInTheDocument()
    })
  })

  describe('Paid Clubs Progress Display (Requirement 3.3)', () => {
    it('should display paid clubs in "current / base" format', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={12}
          clubBase={10}
          netGrowth={2}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      expect(screen.getByText('Paid:')).toBeInTheDocument()
      expect(screen.getByText('12/10')).toBeInTheDocument()
    })

    it('should display positive net growth with up arrow and plus sign', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={12}
          clubBase={10}
          netGrowth={2}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      const netGrowthElement = screen.getByLabelText(/Net growth: positive 2/i)
      expect(netGrowthElement).toBeInTheDocument()
      expect(netGrowthElement).toHaveTextContent('↑')
      expect(netGrowthElement).toHaveTextContent('+2')
    })

    it('should display negative net growth with down arrow', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="not-distinguished"
          paidClubs={8}
          clubBase={10}
          netGrowth={-2}
          distinguishedClubs={4}
          requiredDistinguishedClubs={5}
        />
      )

      const netGrowthElement = screen.getByLabelText(/Net growth: negative 2/i)
      expect(netGrowthElement).toBeInTheDocument()
      expect(netGrowthElement).toHaveTextContent('↓')
      expect(netGrowthElement).toHaveTextContent('-2')
    })

    it('should display zero net growth with neutral arrow', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      const netGrowthElement = screen.getByLabelText(/Net growth: neutral 0/i)
      expect(netGrowthElement).toBeInTheDocument()
      expect(netGrowthElement).toHaveTextContent('→')
      expect(netGrowthElement).toHaveTextContent('0')
    })
  })

  describe('Distinguished Clubs Progress Display (Requirement 3.4)', () => {
    it('should display distinguished clubs in "current / required" format', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      expect(screen.getByText('Distinguished:')).toBeInTheDocument()
      expect(screen.getByText('5/5')).toBeInTheDocument()
    })

    it('should display checkmark when threshold is met', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      expect(
        screen.getByLabelText(/Distinguished clubs: 5 of 5, threshold met/i)
      ).toBeInTheDocument()
    })

    it('should display checkmark when threshold is exceeded', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="select-distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={6}
          requiredDistinguishedClubs={5}
        />
      )

      expect(
        screen.getByLabelText(/Distinguished clubs: 6 of 5, threshold met/i)
      ).toBeInTheDocument()
    })

    it('should not display checkmark when threshold is not met', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="not-distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={4}
          requiredDistinguishedClubs={5}
        />
      )

      expect(screen.queryByLabelText('Threshold met')).not.toBeInTheDocument()
    })
  })

  describe('Visual Indicators (Requirement 3.5)', () => {
    it('should use different colors for different status levels', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="presidents-distinguished"
          paidClubs={12}
          clubBase={10}
          netGrowth={2}
          distinguishedClubs={6}
          requiredDistinguishedClubs={5}
        />
      )

      const statusBadge = screen.getByRole('status', {
        name: /Division status/i,
      })
      expect(statusBadge).toHaveClass('bg-tm-happy-yellow')
    })

    it('should use gray color for not distinguished status', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="not-distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={4}
          requiredDistinguishedClubs={5}
        />
      )

      const statusBadge = screen.getByRole('status', {
        name: /Division status/i,
      })
      expect(statusBadge).toHaveClass('bg-gray-100')
    })

    it('should use color indicators for positive net growth', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={12}
          clubBase={10}
          netGrowth={2}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      const netGrowthElement = screen.getByLabelText(/Net growth: positive/i)
      expect(netGrowthElement).toHaveClass('tm-text-loyal-blue')
    })

    it('should use color indicators for negative net growth', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="not-distinguished"
          paidClubs={8}
          clubBase={10}
          netGrowth={-2}
          distinguishedClubs={4}
          requiredDistinguishedClubs={5}
        />
      )

      const netGrowthElement = screen.getByLabelText(/Net growth: negative/i)
      expect(netGrowthElement).toHaveClass('tm-text-true-maroon')
    })
  })

  describe('Brand Compliance (Requirements 8.1, 8.3)', () => {
    it('should use TM Loyal Blue for division heading', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      const heading = screen.getByText('Division A')
      expect(heading).toHaveClass('tm-text-loyal-blue')
    })

    it('should use Montserrat font for headings', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={10}
          clubBase={10}
          netGrowth={0}
          distinguishedClubs={5}
          requiredDistinguishedClubs={5}
        />
      )

      const heading = screen.getByText('Division A')
      expect(heading).toHaveClass('tm-h2')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero club base', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="not-distinguished"
          paidClubs={0}
          clubBase={0}
          netGrowth={0}
          distinguishedClubs={0}
          requiredDistinguishedClubs={0}
        />
      )

      expect(screen.getByText('Paid:')).toBeInTheDocument()
      expect(screen.getByText('Distinguished:')).toBeInTheDocument()
      expect(screen.getAllByText('0/0')).toHaveLength(2)
    })

    it('should handle large numbers', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={100}
          clubBase={95}
          netGrowth={5}
          distinguishedClubs={50}
          requiredDistinguishedClubs={48}
        />
      )

      expect(screen.getByText('100/95')).toBeInTheDocument()
      expect(screen.getByText('50/48')).toBeInTheDocument()
    })
  })

  /**
   * Tests for Recognition Badge Display (Requirement 9.1)
   *
   * THE DivisionSummary component SHALL display a recognition badge indicating
   * the current recognition level (Distinguished, Select Distinguished,
   * President's Distinguished, Not Distinguished, or Net Loss)
   */
  describe('Recognition Badge Display (Requirement 9.1)', () => {
    /**
     * Validates: Requirement 9.1
     * Shows "President's Distinguished" when at that level
     */
    it('should show "President\'s Distinguished" badge when at that level', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'presidents',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        presidentsGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="presidents-distinguished"
          paidClubs={52}
          clubBase={50}
          netGrowth={2}
          distinguishedClubs={28}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      expect(screen.getByText("President's Distinguished")).toBeInTheDocument()
      expect(
        screen.getByRole('status', {
          name: /Division status: President's Distinguished/i,
        })
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 9.1
     * Shows "Select Distinguished" when at that level
     */
    it('should show "Select Distinguished" badge when at that level', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'select',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 3,
          paidClubsNeeded: 1,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="B"
          status="select-distinguished"
          paidClubs={51}
          clubBase={50}
          netGrowth={1}
          distinguishedClubs={25}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      expect(screen.getByText('Select Distinguished')).toBeInTheDocument()
      expect(
        screen.getByRole('status', {
          name: /Division status: Select Distinguished/i,
        })
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 9.1
     * Shows "Distinguished" when at that level
     */
    it('should show "Distinguished" badge when at that level', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'distinguished',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 2,
          paidClubsNeeded: 1,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 5,
          paidClubsNeeded: 2,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="C"
          status="distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={23}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      expect(screen.getByText('Distinguished')).toBeInTheDocument()
      expect(
        screen.getByRole('status', { name: /Division status: Distinguished/i })
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 9.1
     * Shows "Not Distinguished" when not distinguished
     */
    it('should show "Not Distinguished" badge when not distinguished', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'none',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: false,
          distinguishedClubsNeeded: 3,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 5,
          paidClubsNeeded: 1,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 8,
          paidClubsNeeded: 2,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="D"
          status="not-distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={20}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      expect(screen.getByText('Not Distinguished')).toBeInTheDocument()
      expect(
        screen.getByRole('status', {
          name: /Division status: Not Distinguished/i,
        })
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 9.1
     * Shows "Net Loss" when there's a net club loss
     */
    it('should show "Net Loss" badge when there is a net club loss', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'none',
        meetsNoNetLossRequirement: false,
        paidClubsNeeded: 2,
        distinguishedGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="E"
          status="not-distinguished"
          paidClubs={48}
          clubBase={50}
          netGrowth={-2}
          distinguishedClubs={25}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      expect(screen.getByText('Net Loss')).toBeInTheDocument()
      expect(
        screen.getByRole('status', { name: /Division status: Net Loss/i })
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 9.1
     * Net Loss badge should use maroon color to indicate warning
     */
    it('should use maroon color for Net Loss badge', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'none',
        meetsNoNetLossRequirement: false,
        paidClubsNeeded: 2,
        distinguishedGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="F"
          status="not-distinguished"
          paidClubs={48}
          clubBase={50}
          netGrowth={-2}
          distinguishedClubs={25}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const statusBadge = screen.getByRole('status', {
        name: /Division status: Net Loss/i,
      })
      expect(statusBadge).toHaveClass('bg-red-100')
    })
  })

  /**
   * Tests for Gap Indicators Display (Requirements 9.2, 9.3, 9.4)
   *
   * THE DivisionSummary component SHALL display:
   * - Gap to D (distinguished clubs needed for 45%)
   * - Gap to S (distinguished clubs + paid clubs needed for 50% + base+1)
   * - Gap to P (distinguished clubs + paid clubs needed for 55% + base+2)
   */
  describe('Gap Indicators Display (Requirements 9.2, 9.3, 9.4)', () => {
    /**
     * Validates: Requirement 9.2
     * Gap to D shows correct number of distinguished clubs needed
     */
    it('should display Gap to D indicator with correct value', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'none',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: false,
          distinguishedClubsNeeded: 3,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 5,
          paidClubsNeeded: 1,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 8,
          paidClubsNeeded: 2,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="not-distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={20}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToD = screen.getByTestId('gap-to-d')
      expect(gapToD).toBeInTheDocument()
      expect(gapToD).toHaveTextContent('3')
      expect(gapToD).toHaveTextContent('D')
    })

    /**
     * Validates: Requirement 9.3
     * Gap to S shows correct number of distinguished + paid clubs needed
     */
    it('should display Gap to S indicator with correct value', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'distinguished',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 2,
          paidClubsNeeded: 1,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 5,
          paidClubsNeeded: 2,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="B"
          status="distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={23}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToS = screen.getByTestId('gap-to-s')
      expect(gapToS).toBeInTheDocument()
      // 2 distinguished + 1 paid shown as "2+1p"
      expect(gapToS).toHaveTextContent('2')
      expect(gapToS).toHaveTextContent('+1p')
      expect(gapToS).toHaveTextContent('S')
    })

    /**
     * Validates: Requirement 9.4
     * Gap to P shows correct number of distinguished + paid clubs needed
     */
    it('should display Gap to P indicator with correct value', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'select',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 3,
          paidClubsNeeded: 1,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="C"
          status="select-distinguished"
          paidClubs={51}
          clubBase={50}
          netGrowth={1}
          distinguishedClubs={25}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToP = screen.getByTestId('gap-to-p')
      expect(gapToP).toBeInTheDocument()
      // 3 distinguished + 1 paid shown as "3+1p"
      expect(gapToP).toHaveTextContent('3')
      expect(gapToP).toHaveTextContent('+1p')
      expect(gapToP).toHaveTextContent('P')
    })

    /**
     * Validates: Requirements 9.2, 9.3, 9.4
     * All gap indicators should be displayed together
     */
    it('should display all three gap indicators', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'none',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: false,
          distinguishedClubsNeeded: 3,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 5,
          paidClubsNeeded: 1,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 8,
          paidClubsNeeded: 2,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="D"
          status="not-distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={20}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      expect(screen.getByTestId('gap-to-d')).toBeInTheDocument()
      expect(screen.getByTestId('gap-to-s')).toBeInTheDocument()
      expect(screen.getByTestId('gap-to-p')).toBeInTheDocument()
    })
  })

  /**
   * Tests for Checkmark Display for Achieved Levels (Requirement 9.5)
   *
   * THE gap indicators SHALL show "✓" when a level is achieved
   */
  describe('Checkmark for Achieved Levels (Requirement 9.5)', () => {
    /**
     * Validates: Requirement 9.5
     * Shows "✓" when Distinguished is achieved
     */
    it('should show checkmark for Distinguished when achieved', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'distinguished',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 2,
          paidClubsNeeded: 1,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 5,
          paidClubsNeeded: 2,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={23}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToD = screen.getByTestId('gap-to-d')
      expect(gapToD).toHaveTextContent('✓')
    })

    /**
     * Validates: Requirement 9.5
     * Shows "✓" when Select Distinguished is achieved
     */
    it('should show checkmark for Select Distinguished when achieved', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'select',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 3,
          paidClubsNeeded: 1,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="B"
          status="select-distinguished"
          paidClubs={51}
          clubBase={50}
          netGrowth={1}
          distinguishedClubs={25}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToD = screen.getByTestId('gap-to-d')
      const gapToS = screen.getByTestId('gap-to-s')
      expect(gapToD).toHaveTextContent('✓')
      expect(gapToS).toHaveTextContent('✓')
    })

    /**
     * Validates: Requirement 9.5
     * Shows "✓" when President's Distinguished is achieved
     */
    it("should show checkmark for all levels when President's Distinguished is achieved", () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'presidents',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        presidentsGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="C"
          status="presidents-distinguished"
          paidClubs={52}
          clubBase={50}
          netGrowth={2}
          distinguishedClubs={28}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToD = screen.getByTestId('gap-to-d')
      const gapToS = screen.getByTestId('gap-to-s')
      const gapToP = screen.getByTestId('gap-to-p')
      expect(gapToD).toHaveTextContent('✓')
      expect(gapToS).toHaveTextContent('✓')
      expect(gapToP).toHaveTextContent('✓')
    })
  })

  /**
   * Tests for Number Display for Non-Achieved Levels (Requirement 9.6)
   *
   * THE gap indicators SHALL show the number of clubs needed when a level is not achieved
   */
  describe('Number Display for Non-Achieved Levels (Requirement 9.6)', () => {
    /**
     * Validates: Requirement 9.6
     * Shows number of clubs needed when level is not achieved
     */
    it('should show number of clubs needed when Distinguished is not achieved', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'none',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: false,
          distinguishedClubsNeeded: 5,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 8,
          paidClubsNeeded: 1,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 10,
          paidClubsNeeded: 2,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="not-distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={18}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToD = screen.getByTestId('gap-to-d')
      expect(gapToD).toHaveTextContent('5')
      expect(gapToD).not.toHaveTextContent('✓')
    })

    /**
     * Validates: Requirement 9.6
     * Shows combined number (distinguished + paid) when both are needed
     */
    it('should show combined number when both distinguished and paid clubs are needed', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'distinguished',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 2,
          paidClubsNeeded: 1,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 5,
          paidClubsNeeded: 2,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="B"
          status="distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={23}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToS = screen.getByTestId('gap-to-s')
      // 2 distinguished + 1 paid shown as "2+1p"
      expect(gapToS).toHaveTextContent('2')
      expect(gapToS).toHaveTextContent('+1p')

      const gapToP = screen.getByTestId('gap-to-p')
      // 5 distinguished + 2 paid shown as "5+2p"
      expect(gapToP).toHaveTextContent('5')
      expect(gapToP).toHaveTextContent('+2p')
    })

    /**
     * Validates: Requirement 9.6
     * Shows 0 when no clubs are needed but level not yet achieved (edge case)
     */
    it('should show 0 when no additional clubs needed', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'none',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 1,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="C"
          status="not-distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={23}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToD = screen.getByTestId('gap-to-d')
      expect(gapToD).toHaveTextContent('0')
    })
  })

  /**
   * Tests for Net Loss Indicator (Requirement 9.7)
   *
   * WHEN a division has net club loss, THE gap indicators SHALL indicate
   * the level is not achievable until eligibility is met
   */
  describe('Net Loss Indicator (Requirement 9.7)', () => {
    /**
     * Validates: Requirement 9.7
     * Shows "N/A" for all gap indicators when net loss blocks achievability
     */
    it('should show "N/A" for all gap indicators when net loss blocks achievability', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'none',
        meetsNoNetLossRequirement: false,
        paidClubsNeeded: 2,
        distinguishedGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="not-distinguished"
          paidClubs={48}
          clubBase={50}
          netGrowth={-2}
          distinguishedClubs={25}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToD = screen.getByTestId('gap-to-d')
      const gapToS = screen.getByTestId('gap-to-s')
      const gapToP = screen.getByTestId('gap-to-p')

      expect(gapToD).toHaveTextContent('N/A')
      expect(gapToS).toHaveTextContent('N/A')
      expect(gapToP).toHaveTextContent('N/A')
    })

    /**
     * Validates: Requirement 9.7
     * Gap indicators should have appropriate aria-label for net loss
     */
    it('should have appropriate aria-label for net loss indicators', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'none',
        meetsNoNetLossRequirement: false,
        paidClubsNeeded: 3,
        distinguishedGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 3,
          achievable: false,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 3,
          achievable: false,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 3,
          achievable: false,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="B"
          status="not-distinguished"
          paidClubs={47}
          clubBase={50}
          netGrowth={-3}
          distinguishedClubs={25}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToD = screen.getByTestId('gap-to-d')
      expect(gapToD).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Not achievable')
      )
    })

    /**
     * Validates: Requirement 9.7
     * Gap indicators should use gray styling when not achievable
     */
    it('should use gray styling for gap indicators when not achievable', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'none',
        meetsNoNetLossRequirement: false,
        paidClubsNeeded: 2,
        distinguishedGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 2,
          achievable: false,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="C"
          status="not-distinguished"
          paidClubs={48}
          clubBase={50}
          netGrowth={-2}
          distinguishedClubs={25}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToD = screen.getByTestId('gap-to-d')
      expect(gapToD).toHaveClass('tm-bg-cool-gray-20')
    })
  })

  /**
   * Tests for Backward Compatibility
   *
   * Component should work without gapAnalysis prop (gap indicators not shown)
   */
  describe('Backward Compatibility', () => {
    /**
     * Validates: Backward compatibility
     * Component works without gapAnalysis prop
     */
    it('should render without gapAnalysis prop', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={23}
          requiredDistinguishedClubs={23}
        />
      )

      expect(screen.getByText('Division A')).toBeInTheDocument()
      expect(screen.getByText('Distinguished')).toBeInTheDocument()
    })

    /**
     * Validates: Backward compatibility
     * Gap indicators should not be shown when gapAnalysis is not provided
     */
    it('should not show gap indicators when gapAnalysis is not provided', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="B"
          status="not-distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={20}
          requiredDistinguishedClubs={23}
        />
      )

      expect(screen.queryByTestId('gap-to-d')).not.toBeInTheDocument()
      expect(screen.queryByTestId('gap-to-s')).not.toBeInTheDocument()
      expect(screen.queryByTestId('gap-to-p')).not.toBeInTheDocument()
    })

    /**
     * Validates: Backward compatibility
     * Status badge should use status prop when gapAnalysis is not provided
     */
    it('should use status prop for badge when gapAnalysis is not provided', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="C"
          status="not-distinguished"
          paidClubs={48}
          clubBase={50}
          netGrowth={-2}
          distinguishedClubs={20}
          requiredDistinguishedClubs={23}
        />
      )

      // Without gapAnalysis, should show "Not Distinguished" even with net loss
      expect(screen.getByText('Not Distinguished')).toBeInTheDocument()
      expect(screen.queryByText('Net Loss')).not.toBeInTheDocument()
    })

    /**
     * Validates: Backward compatibility
     * Gap to Recognition section should not be shown when gapAnalysis is not provided
     */
    it('should not show Gap to Recognition section when gapAnalysis is not provided', () => {
      renderWithProviders(
        <DivisionSummary
          divisionId="D"
          status="distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={23}
          requiredDistinguishedClubs={23}
        />
      )

      expect(screen.queryByText('Gap to Recognition')).not.toBeInTheDocument()
    })
  })

  /**
   * Tests for Accessibility of Gap Indicators
   */
  describe('Gap Indicator Accessibility', () => {
    /**
     * Validates: Accessibility
     * Gap indicators should have appropriate aria-labels
     */
    it('should have appropriate aria-labels for gap indicators', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'distinguished',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: true,
          distinguishedClubsNeeded: 0,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 2,
          paidClubsNeeded: 1,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 5,
          paidClubsNeeded: 2,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="A"
          status="distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={23}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapToD = screen.getByTestId('gap-to-d')
      const gapToS = screen.getByTestId('gap-to-s')
      const gapToP = screen.getByTestId('gap-to-p')

      expect(gapToD).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Distinguished')
      )
      expect(gapToS).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Select Distinguished')
      )
      expect(gapToP).toHaveAttribute(
        'aria-label',
        expect.stringContaining("President's Distinguished")
      )
    })

    /**
     * Validates: Accessibility
     * Gap indicators group should have role="group" and aria-label
     */
    it('should have role="group" on gap indicators container', () => {
      const gapAnalysis: DivisionGapAnalysis = {
        currentLevel: 'none',
        meetsNoNetLossRequirement: true,
        paidClubsNeeded: 0,
        distinguishedGap: {
          achieved: false,
          distinguishedClubsNeeded: 3,
          paidClubsNeeded: 0,
          achievable: true,
        },
        selectGap: {
          achieved: false,
          distinguishedClubsNeeded: 5,
          paidClubsNeeded: 1,
          achievable: true,
        },
        presidentsGap: {
          achieved: false,
          distinguishedClubsNeeded: 8,
          paidClubsNeeded: 2,
          achievable: true,
        },
      }

      renderWithProviders(
        <DivisionSummary
          divisionId="B"
          status="not-distinguished"
          paidClubs={50}
          clubBase={50}
          netGrowth={0}
          distinguishedClubs={20}
          requiredDistinguishedClubs={23}
          gapAnalysis={gapAnalysis}
        />
      )

      const gapGroup = screen.getByRole('group', {
        name: /Gap indicators for recognition levels/i,
      })
      expect(gapGroup).toBeInTheDocument()
    })
  })
})
