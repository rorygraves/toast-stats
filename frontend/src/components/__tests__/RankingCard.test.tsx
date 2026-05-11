import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import '@testing-library/jest-dom'
import RankingCard, { RankingCardProps } from '../RankingCard'
import {
  testComponentVariants,
  ComponentVariant,
} from '../../__tests__/utils/componentTestUtils' // Mock icon component for testing
const MockIcon = () => (
  <svg data-testid="mock-icon" width="24" height="24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
  </svg>
)

describe('RankingCard', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  // Base props for testing
  const baseProps: RankingCardProps = {
    title: 'Overall Rank',
    rank: 15,
    totalDistricts: 126,
    percentile: 12,
    icon: <MockIcon />,
    colorScheme: 'blue',
  }

  describe('Basic Rendering', () => {
    const basicVariants: ComponentVariant<RankingCardProps>[] = [
      {
        name: 'with all required props',
        props: baseProps,
        expectedText: 'Overall Rank',
        customAssertion: () => {
          expect(screen.getByText('15')).toBeInTheDocument()
          expect(screen.getByText('of 126')).toBeInTheDocument()
          expect(screen.getByText('12th percentile')).toBeInTheDocument()
        },
      },
      {
        name: 'with loading state',
        props: { ...baseProps, isLoading: true },
        customAssertion: () => {
          expect(
            screen.getByLabelText('Loading Overall Rank ranking')
          ).toBeInTheDocument()
          expect(screen.queryByText('15')).not.toBeInTheDocument()
        },
      },
    ]

    testComponentVariants(
      RankingCard as unknown as React.ComponentType<Record<string, unknown>>,
      basicVariants as unknown as ComponentVariant<Record<string, unknown>>[]
    )
  })

  describe('Color Schemes', () => {
    const colorSchemeVariants: ComponentVariant<RankingCardProps>[] = [
      {
        name: 'blue color scheme',
        props: { ...baseProps, colorScheme: 'blue' },
        customAssertion: container => {
          // Check that the card has the blue accent border
          const card = container.querySelector('.border-l-4')
          expect(card).toBeInTheDocument()
        },
      },
      {
        name: 'green color scheme',
        props: { ...baseProps, colorScheme: 'green' },
        customAssertion: container => {
          const card = container.querySelector('.border-l-4')
          expect(card).toBeInTheDocument()
        },
      },
      {
        name: 'purple color scheme',
        props: { ...baseProps, colorScheme: 'purple' },
        customAssertion: container => {
          const card = container.querySelector('.border-l-4')
          expect(card).toBeInTheDocument()
        },
      },
      {
        name: 'yellow color scheme',
        props: { ...baseProps, colorScheme: 'yellow' },
        customAssertion: container => {
          const card = container.querySelector('.border-l-4')
          expect(card).toBeInTheDocument()
        },
      },
    ]

    testComponentVariants(
      RankingCard as unknown as React.ComponentType<Record<string, unknown>>,
      colorSchemeVariants as unknown as ComponentVariant<
        Record<string, unknown>
      >[]
    )
  })

  describe('Year-Over-Year Change Indicator', () => {
    it('shows improvement indicator when rank improved (moved up)', () => {
      // Previous rank 20, current rank 15 = improved by 5 positions
      renderWithProviders(<RankingCard {...baseProps} previousYearRank={20} />)

      // Should show improvement (↑ +5)
      const indicator = screen.getByRole('status', {
        name: /improved by 5 positions/i,
      })
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveTextContent('+5')
      expect(indicator).toHaveClass('tm-text-loyal-blue')
    })

    it('shows decline indicator when rank declined (moved down)', () => {
      // Previous rank 10, current rank 15 = declined by 5 positions
      renderWithProviders(<RankingCard {...baseProps} previousYearRank={10} />)

      // Should show decline (↓ -5)
      const indicator = screen.getByRole('status', {
        name: /declined by 5 positions/i,
      })
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveTextContent('-5')
      expect(indicator).toHaveClass('tm-text-true-maroon')
    })

    it('shows unchanged indicator when rank stayed the same', () => {
      // Previous rank 15, current rank 15 = unchanged
      renderWithProviders(<RankingCard {...baseProps} previousYearRank={15} />)

      // Should show unchanged (→ 0)
      const indicator = screen.getByRole('status', { name: /unchanged/i })
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveTextContent('0')
      expect(indicator).toHaveClass('tm-text-cool-gray')
    })

    it('does not show change indicator when previousYearRank is not provided', () => {
      renderWithProviders(<RankingCard {...baseProps} />)

      // Should not have any change indicator
      const indicators = screen.queryAllByRole('status')
      // Only the percentile badge should be present
      expect(indicators).toHaveLength(1)
      expect(indicators[0]).toHaveTextContent('12th percentile')
    })

    it('handles single position change correctly', () => {
      // Previous rank 16, current rank 15 = improved by 1 position
      renderWithProviders(<RankingCard {...baseProps} previousYearRank={16} />)

      const indicator = screen.getByRole('status', {
        name: /improved by 1 position$/i,
      })
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Percentile Display', () => {
    it('displays percentile rounded to nearest integer', () => {
      renderWithProviders(<RankingCard {...baseProps} percentile={11.7} />)

      expect(screen.getByText('12th percentile')).toBeInTheDocument()
    })

    it('displays percentile for top performer', () => {
      renderWithProviders(
        <RankingCard {...baseProps} rank={1} percentile={0.8} />
      )

      expect(screen.getByText('1st percentile')).toBeInTheDocument()
    })

    it('displays percentile for lower ranked district', () => {
      renderWithProviders(
        <RankingCard {...baseProps} rank={100} percentile={79.4} />
      )

      expect(screen.getByText('79th percentile')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible aria-label with complete ranking information', () => {
      renderWithProviders(<RankingCard {...baseProps} />)

      const card = screen.getByLabelText(
        'Overall Rank: Rank 15 of 126, 12th percentile'
      )
      expect(card).toBeInTheDocument()
    })

    it('includes year-over-year change in aria-label when provided', () => {
      renderWithProviders(<RankingCard {...baseProps} previousYearRank={20} />)

      const card = screen.getByLabelText(
        'Overall Rank: Rank 15 of 126, 12th percentile, improved by 5 positions'
      )
      expect(card).toBeInTheDocument()
    })

    it('renders icon with aria-hidden', () => {
      renderWithProviders(<RankingCard {...baseProps} />)

      const iconContainer = screen.getByTestId('mock-icon').parentElement
      expect(iconContainer?.parentElement).toHaveAttribute(
        'aria-hidden',
        'true'
      )
    })

    it('loading state has proper aria attributes', () => {
      renderWithProviders(<RankingCard {...baseProps} isLoading={true} />)

      // The loading card has aria-label for accessibility
      const loadingCard = screen.getByLabelText('Loading Overall Rank ranking')
      expect(loadingCard).toBeInTheDocument()
      // The Card component renders with role="status" when passed
      expect(loadingCard).toHaveAttribute('role', 'status')
    })
  })

  describe('Different Ranking Metrics', () => {
    it('renders Paid Clubs ranking correctly', () => {
      renderWithProviders(
        <RankingCard
          title="Paid Clubs"
          rank={8}
          totalDistricts={126}
          percentile={6.3}
          icon={<MockIcon />}
          colorScheme="green"
        />
      )

      expect(screen.getByText('Paid Clubs')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
      expect(screen.getByText('6th percentile')).toBeInTheDocument()
    })

    it('renders Membership Payments ranking correctly', () => {
      renderWithProviders(
        <RankingCard
          title="Membership Payments"
          rank={22}
          totalDistricts={126}
          percentile={17.5}
          icon={<MockIcon />}
          colorScheme="purple"
        />
      )

      expect(screen.getByText('Membership Payments')).toBeInTheDocument()
      expect(screen.getByText('22')).toBeInTheDocument()
      expect(screen.getByText('18th percentile')).toBeInTheDocument()
    })

    it('renders Distinguished Clubs ranking correctly', () => {
      renderWithProviders(
        <RankingCard
          title="Distinguished Clubs"
          rank={45}
          totalDistricts={126}
          percentile={35.7}
          icon={<MockIcon />}
          colorScheme="yellow"
        />
      )

      expect(screen.getByText('Distinguished Clubs')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('36th percentile')).toBeInTheDocument()
    })
  })
})
