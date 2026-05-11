import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import '@testing-library/jest-dom'
import EndOfYearRankingsPanel, {
  EndOfYearRankingsPanelProps,
} from '../EndOfYearRankingsPanel'
import type { EndOfYearRankings } from '../../hooks/useGlobalRankings'
import type { ProgramYear } from '../../utils/programYear'
describe('EndOfYearRankingsPanel', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  // Test data fixtures
  const mockProgramYear: ProgramYear = {
    year: 2024,
    startDate: '2024-07-01',
    endDate: '2025-06-30',
    label: '2024-2025',
  }

  const mockRankings: EndOfYearRankings = {
    overall: { rank: 15, totalDistricts: 126, percentile: 88.1 },
    paidClubs: { rank: 8, totalDistricts: 126, percentile: 93.7 },
    membershipPayments: { rank: 22, totalDistricts: 126, percentile: 82.5 },
    distinguishedClubs: { rank: 45, totalDistricts: 126, percentile: 64.3 },
    asOfDate: '2025-01-15',
    isPartialYear: false,
  }

  const mockPreviousYearRankings: EndOfYearRankings = {
    overall: { rank: 20, totalDistricts: 126, percentile: 84.1 },
    paidClubs: { rank: 12, totalDistricts: 126, percentile: 90.5 },
    membershipPayments: { rank: 18, totalDistricts: 126, percentile: 85.7 },
    distinguishedClubs: { rank: 50, totalDistricts: 126, percentile: 60.3 },
    asOfDate: '2024-06-30',
    isPartialYear: false,
  }

  const baseProps: EndOfYearRankingsPanelProps = {
    rankings: mockRankings,
    isLoading: false,
    programYear: mockProgramYear,
  }

  describe('Basic Rendering', () => {
    it('renders section heading', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      expect(screen.getByText('End-of-Year Rankings')).toBeInTheDocument()
    })

    it('renders program year label', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      expect(screen.getByText('2024-2025 Program Year')).toBeInTheDocument()
    })

    it('renders as-of date when rankings are available', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      expect(screen.getByText(/As of Jan 15, 2025/)).toBeInTheDocument()
    })

    it('renders all four ranking cards', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      expect(screen.getByText('Overall Rank')).toBeInTheDocument()
      expect(screen.getByText('Paid Clubs')).toBeInTheDocument()
      expect(screen.getByText('Payments')).toBeInTheDocument()
      expect(screen.getByText('Distinguished')).toBeInTheDocument()
    })
  })

  describe('Ranking Data Display', () => {
    it('displays correct rank values for all metrics', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      // Check rank numbers are displayed
      expect(screen.getByText('15')).toBeInTheDocument() // Overall
      expect(screen.getByText('8')).toBeInTheDocument() // Paid Clubs
      expect(screen.getByText('22')).toBeInTheDocument() // Payments
      expect(screen.getByText('45')).toBeInTheDocument() // Distinguished
    })

    it('displays total districts for each metric', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      // All cards should show "of 126"
      const totalDistrictsElements = screen.getAllByText('of 126')
      expect(totalDistrictsElements).toHaveLength(4)
    })

    it('displays percentile badges for each metric', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      expect(screen.getByText('88th percentile')).toBeInTheDocument() // Overall
      expect(screen.getByText('94th percentile')).toBeInTheDocument() // Paid Clubs
      expect(screen.getByText('83rd percentile')).toBeInTheDocument() // Payments
      expect(screen.getByText('64th percentile')).toBeInTheDocument() // Distinguished
    })
  })

  describe('Loading State', () => {
    it('renders loading skeletons when isLoading is true', () => {
      renderWithProviders(
        <EndOfYearRankingsPanel {...baseProps} isLoading={true} />
      )

      // Should have 4 loading cards
      const loadingCards = screen.getAllByRole('status', {
        name: /loading.*ranking/i,
      })
      expect(loadingCards).toHaveLength(4)
    })

    it('sets aria-busy on section when loading', () => {
      renderWithProviders(
        <EndOfYearRankingsPanel {...baseProps} isLoading={true} />
      )

      const section = screen.getByRole('region', {
        name: /end-of-year rankings/i,
      })
      expect(section).toHaveAttribute('aria-busy', 'true')
    })

    it('does not display rank values when loading', () => {
      renderWithProviders(
        <EndOfYearRankingsPanel {...baseProps} isLoading={true} />
      )

      // Rank values should not be visible
      expect(screen.queryByText('15')).not.toBeInTheDocument()
      expect(screen.queryByText('8')).not.toBeInTheDocument()
    })
  })

  describe('Partial Year Indicator', () => {
    it('shows partial year indicator when isPartialYear is true', () => {
      const partialYearRankings: EndOfYearRankings = {
        ...mockRankings,
        isPartialYear: true,
      }

      renderWithProviders(
        <EndOfYearRankingsPanel {...baseProps} rankings={partialYearRankings} />
      )

      expect(screen.getByText('Partial Year')).toBeInTheDocument()
    })

    it('does not show partial year indicator when isPartialYear is false', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      expect(screen.queryByText('Partial Year')).not.toBeInTheDocument()
    })

    it('partial year indicator has accessible label', () => {
      const partialYearRankings: EndOfYearRankings = {
        ...mockRankings,
        isPartialYear: true,
      }

      renderWithProviders(
        <EndOfYearRankingsPanel {...baseProps} rankings={partialYearRankings} />
      )

      const indicator = screen.getByRole('status', {
        name: /partial year data/i,
      })
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Year-Over-Year Change', () => {
    it('shows improvement indicators when previous year rankings provided', () => {
      renderWithProviders(
        <EndOfYearRankingsPanel
          {...baseProps}
          previousYearRankings={mockPreviousYearRankings}
        />
      )

      // Overall: 20 -> 15 = +5 improvement
      // Paid Clubs: 12 -> 8 = +4 improvement
      // Payments: 18 -> 22 = -4 decline
      // Distinguished: 50 -> 45 = +5 improvement

      // Check for improvement indicators
      const improvementIndicators = screen.getAllByRole('status', {
        name: /improved/i,
      })
      expect(improvementIndicators.length).toBeGreaterThanOrEqual(3)
    })

    it('shows decline indicator when rank worsened', () => {
      renderWithProviders(
        <EndOfYearRankingsPanel
          {...baseProps}
          previousYearRankings={mockPreviousYearRankings}
        />
      )

      // Payments: 18 -> 22 = -4 decline
      const declineIndicator = screen.getByRole('status', {
        name: /declined by 4 positions/i,
      })
      expect(declineIndicator).toBeInTheDocument()
    })

    it('does not show change indicators when no previous year data', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      // Should not have any improvement/decline indicators
      const changeIndicators = screen.queryAllByRole('status', {
        name: /improved|declined/i,
      })
      expect(changeIndicators).toHaveLength(0)
    })
  })

  describe('Null Rankings Handling', () => {
    it('renders with null rankings (shows zeros)', () => {
      renderWithProviders(
        <EndOfYearRankingsPanel
          {...baseProps}
          rankings={null}
          isLoading={false}
        />
      )

      // Should render cards with zero values
      const zeroRanks = screen.getAllByText('0')
      expect(zeroRanks.length).toBeGreaterThanOrEqual(4)
    })

    it('does not show as-of date when rankings are null', () => {
      renderWithProviders(
        <EndOfYearRankingsPanel
          {...baseProps}
          rankings={null}
          isLoading={false}
        />
      )

      expect(screen.queryByText(/As of/)).not.toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('renders grid container with responsive classes', () => {
      const { container } = renderWithProviders(
        <EndOfYearRankingsPanel {...baseProps} />
      )

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('sm:grid-cols-2')
      expect(grid).toHaveClass('lg:grid-cols-4')
    })

    it('renders cards in a list for accessibility', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      const list = screen.getByRole('list', {
        name: /end-of-year ranking metrics/i,
      })
      expect(list).toBeInTheDocument()

      const listItems = within(list).getAllByRole('listitem')
      expect(listItems).toHaveLength(4)
    })
  })

  describe('Accessibility', () => {
    it('has accessible section with proper heading', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      const section = screen.getByRole('region', {
        name: /end-of-year rankings/i,
      })
      expect(section).toBeInTheDocument()

      const heading = screen.getByRole('heading', {
        name: /end-of-year rankings/i,
        level: 2,
      })
      expect(heading).toBeInTheDocument()
    })

    it('each ranking card has accessible aria-label', () => {
      renderWithProviders(<EndOfYearRankingsPanel {...baseProps} />)

      // Check that cards have descriptive aria-labels
      expect(
        screen.getByLabelText(/Overall Rank: Rank 15 of 126/i)
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(/Paid Clubs: Rank 8 of 126/i)
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(/Payments: Rank 22 of 126/i)
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(/Distinguished: Rank 45 of 126/i)
      ).toBeInTheDocument()
    })
  })

  describe('Color Schemes', () => {
    it('applies correct color schemes to each card', () => {
      const { container } = renderWithProviders(
        <EndOfYearRankingsPanel {...baseProps} />
      )

      // Each card should have a border-l-4 class for the accent
      const cards = container.querySelectorAll('.border-l-4')
      expect(cards).toHaveLength(4)
    })
  })

  describe('Different Program Years', () => {
    it('displays different program year labels correctly', () => {
      const differentYear: ProgramYear = {
        year: 2023,
        startDate: '2023-07-01',
        endDate: '2024-06-30',
        label: '2023-2024',
      }

      renderWithProviders(
        <EndOfYearRankingsPanel {...baseProps} programYear={differentYear} />
      )

      expect(screen.getByText('2023-2024 Program Year')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('formats as-of date correctly for different dates', () => {
      const rankingsWithDifferentDate: EndOfYearRankings = {
        ...mockRankings,
        asOfDate: '2024-06-30',
      }

      renderWithProviders(
        <EndOfYearRankingsPanel
          {...baseProps}
          rankings={rankingsWithDifferentDate}
        />
      )

      expect(screen.getByText(/As of Jun 30, 2024/)).toBeInTheDocument()
    })
  })
})
