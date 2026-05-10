import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import MultiYearComparisonTable, {
  MultiYearComparisonTableProps,
} from '../MultiYearComparisonTable'
import type { YearlyRankingSummary } from '../../hooks/useGlobalRankings'
import {
  renderWithProviders,
  cleanupAllResources,
} from '../../__tests__/utils/componentTestUtils'

describe('MultiYearComparisonTable', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  // Sample test data
  const createYearlyRanking = (
    overrides: Partial<YearlyRankingSummary> = {}
  ): YearlyRankingSummary => ({
    programYear: '2023-2024',
    overallRank: 15,
    clubsRank: 12,
    paymentsRank: 18,
    distinguishedRank: 20,
    totalDistricts: 126,
    isPartialYear: false,
    yearOverYearChange: null,
    ...overrides,
  })

  const sampleRankings: YearlyRankingSummary[] = [
    createYearlyRanking({
      programYear: '2023-2024',
      overallRank: 15,
      clubsRank: 12,
      paymentsRank: 18,
      distinguishedRank: 20,
      isPartialYear: true,
      yearOverYearChange: {
        overall: 5, // improved from 20 to 15
        clubs: 3, // improved from 15 to 12
        payments: -2, // declined from 16 to 18
        distinguished: 0, // unchanged
      },
    }),
    createYearlyRanking({
      programYear: '2022-2023',
      overallRank: 20,
      clubsRank: 15,
      paymentsRank: 16,
      distinguishedRank: 20,
      isPartialYear: false,
      yearOverYearChange: {
        overall: -3, // declined from 17 to 20
        clubs: 2, // improved from 17 to 15
        payments: 4, // improved from 20 to 16
        distinguished: -5, // declined from 15 to 20
      },
    }),
    createYearlyRanking({
      programYear: '2021-2022',
      overallRank: 17,
      clubsRank: 17,
      paymentsRank: 20,
      distinguishedRank: 15,
      isPartialYear: false,
      yearOverYearChange: null, // oldest year, no previous data
    }),
  ]

  const baseProps: MultiYearComparisonTableProps = {
    yearlyRankings: sampleRankings,
    isLoading: false,
  }

  describe('Basic Rendering', () => {
    it('renders the component with heading', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      expect(screen.getByText('Multi-Year Comparison')).toBeInTheDocument()
    })

    it('renders all program years', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      // Both desktop and mobile views render, so use getAllByText
      const year2023Elements = screen.getAllByText('2023-2024')
      expect(year2023Elements.length).toBeGreaterThan(0)
      const year2022Elements = screen.getAllByText('2022-2023')
      expect(year2022Elements.length).toBeGreaterThan(0)
      const year2021Elements = screen.getAllByText('2021-2022')
      expect(year2021Elements.length).toBeGreaterThan(0)
    })

    it('displays rank values with total districts', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      // Check for rank display format (rank/total)
      // Multiple instances expected due to multiple years
      const rank15Elements = screen.getAllByText('15')
      expect(rank15Elements.length).toBeGreaterThan(0)

      // Check for total districts display
      const totalElements = screen.getAllByText('/126')
      expect(totalElements.length).toBeGreaterThan(0)
    })
  })

  describe('Loading State', () => {
    it('shows loading skeleton when isLoading is true', () => {
      renderWithProviders(
        <MultiYearComparisonTable yearlyRankings={[]} isLoading={true} />
      )

      expect(
        screen.getByLabelText('Loading multi-year comparison table')
      ).toBeInTheDocument()
      expect(screen.queryByText('2023-2024')).not.toBeInTheDocument()
    })

    it('has aria-busy attribute when loading', () => {
      renderWithProviders(
        <MultiYearComparisonTable yearlyRankings={[]} isLoading={true} />
      )

      const loadingSection = screen.getByLabelText(
        'Loading multi-year comparison table'
      )
      expect(loadingSection).toHaveAttribute('aria-busy', 'true')
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no rankings data', () => {
      renderWithProviders(
        <MultiYearComparisonTable yearlyRankings={[]} isLoading={false} />
      )

      expect(
        screen.getByText(/No multi-year ranking data available/i)
      ).toBeInTheDocument()
    })

    it('has proper aria-label for empty state', () => {
      renderWithProviders(
        <MultiYearComparisonTable yearlyRankings={[]} isLoading={false} />
      )

      expect(
        screen.getByLabelText('No multi-year ranking data available')
      ).toBeInTheDocument()
    })
  })

  describe('Chronological Ordering', () => {
    it('orders program years with most recent first', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      // Get all program year cells in the table
      const rows = screen.getAllByRole('row')
      // Skip header row (index 0), data rows start at index 1
      const dataRows = rows.slice(1)

      // First data row should be 2023-2024 (most recent)
      expect(within(dataRows[0]!).getByText('2023-2024')).toBeInTheDocument()
      // Second data row should be 2022-2023
      expect(within(dataRows[1]!).getByText('2022-2023')).toBeInTheDocument()
      // Third data row should be 2021-2022 (oldest)
      expect(within(dataRows[2]!).getByText('2021-2022')).toBeInTheDocument()
    })

    it('handles unsorted input and sorts correctly', () => {
      const unsortedRankings = [
        createYearlyRanking({ programYear: '2021-2022' }),
        createYearlyRanking({ programYear: '2023-2024' }),
        createYearlyRanking({ programYear: '2022-2023' }),
      ]

      renderWithProviders(
        <MultiYearComparisonTable
          yearlyRankings={unsortedRankings}
          isLoading={false}
        />
      )

      const rows = screen.getAllByRole('row')
      const dataRows = rows.slice(1)

      // Should be sorted most recent first regardless of input order
      expect(within(dataRows[0]!).getByText('2023-2024')).toBeInTheDocument()
      expect(within(dataRows[1]!).getByText('2022-2023')).toBeInTheDocument()
      expect(within(dataRows[2]!).getByText('2021-2022')).toBeInTheDocument()
    })
  })

  describe('Year-Over-Year Change Indicators', () => {
    it('shows improvement indicator for positive change (rank improved)', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      // 2023-2024 has overall improvement of 5 (from 20 to 15)
      // Both desktop and mobile views render, so use getAllByRole
      const improvementIndicators = screen.getAllByRole('status', {
        name: /Overall rank improved by 5 positions/i,
      })
      expect(improvementIndicators.length).toBeGreaterThan(0)
      expect(improvementIndicators[0]).toHaveTextContent('+5')
    })

    it('shows decline indicator for negative change (rank declined)', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      // 2023-2024 has payments decline of -2 (from 16 to 18)
      // Both desktop and mobile views render, so use getAllByRole
      const declineIndicators = screen.getAllByRole('status', {
        name: /Payments rank declined by 2 positions/i,
      })
      expect(declineIndicators.length).toBeGreaterThan(0)
      expect(declineIndicators[0]).toHaveTextContent('-2')
    })

    it('shows unchanged indicator for zero change', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      // 2023-2024 has distinguished unchanged (0)
      // Both desktop and mobile views render, so use getAllByRole
      const unchangedIndicators = screen.getAllByRole('status', {
        name: /Distinguished rank unchanged/i,
      })
      expect(unchangedIndicators.length).toBeGreaterThan(0)
      expect(unchangedIndicators[0]).toHaveTextContent('0')
    })

    it('does not show change indicator when yearOverYearChange is null', () => {
      const rankingsWithoutChange = [
        createYearlyRanking({
          programYear: '2021-2022',
          yearOverYearChange: null,
        }),
      ]

      renderWithProviders(
        <MultiYearComparisonTable
          yearlyRankings={rankingsWithoutChange}
          isLoading={false}
        />
      )

      // Should not have any change indicators
      const changeIndicators = screen.queryAllByRole('status', {
        name: /improved|declined|unchanged/i,
      })
      expect(changeIndicators).toHaveLength(0)
    })

    it('uses token-driven color for improvement', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      const improvementIndicators = screen.getAllByRole('status', {
        name: /Overall rank improved by 5 positions/i,
      })
      const indicator = improvementIndicators[0] as HTMLElement
      expect(indicator.style.color).toBe('var(--green-600)')
      expect(indicator.style.backgroundColor).toBe('var(--loyal-50)')
    })

    it('uses token-driven color for decline', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      const declineIndicators = screen.getAllByRole('status', {
        name: /Payments rank declined by 2 positions/i,
      })
      const indicator = declineIndicators[0] as HTMLElement
      expect(indicator.style.color).toBe('var(--red-600)')
    })

    it('uses muted token color for unchanged', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      const unchangedIndicators = screen.getAllByRole('status', {
        name: /Distinguished rank unchanged/i,
      })
      const indicator = unchangedIndicators[0] as HTMLElement
      expect(indicator.style.color).toBe('var(--ink-3)')
      expect(indicator.style.backgroundColor).toBe('var(--surface-3)')
    })
  })

  describe('Partial Year Indicator', () => {
    it('shows partial year badge for incomplete data', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      // 2023-2024 is marked as partial year
      // Both desktop and mobile views render, so use getAllByRole
      const partialBadges = screen.getAllByRole('status', {
        name: /Partial year data/i,
      })
      expect(partialBadges.length).toBeGreaterThan(0)
      expect(partialBadges[0]).toHaveTextContent('Partial')
    })

    it('does not show partial badge for complete years', () => {
      const completeYearRankings = [
        createYearlyRanking({
          programYear: '2022-2023',
          isPartialYear: false,
        }),
      ]

      renderWithProviders(
        <MultiYearComparisonTable
          yearlyRankings={completeYearRankings}
          isLoading={false}
        />
      )

      const partialBadges = screen.queryAllByRole('status', {
        name: /Partial year data/i,
      })
      expect(partialBadges).toHaveLength(0)
    })

    it('partial badge uses amber color for visibility', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      const partialBadges = screen.getAllByRole('status', {
        name: /Partial year data/i,
      })
      expect(partialBadges[0]).toHaveClass('bg-amber-100')
    })
  })

  describe('Table Structure', () => {
    it('renders table with correct column headers', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      // Use getAllByText since mobile view also has these labels
      expect(screen.getByText('Program Year')).toBeInTheDocument()
      // Column headers are unique to the table, but mobile has labels too
      const overallElements = screen.getAllByText('Overall')
      expect(overallElements.length).toBeGreaterThan(0)
      const clubsElements = screen.getAllByText('Clubs')
      expect(clubsElements.length).toBeGreaterThan(0)
      const paymentsElements = screen.getAllByText('Payments')
      expect(paymentsElements.length).toBeGreaterThan(0)
      const distinguishedElements = screen.getAllByText('Distinguished')
      expect(distinguishedElements.length).toBeGreaterThan(0)
    })

    it('has proper table semantics with scope attributes', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      const columnHeaders = screen.getAllByRole('columnheader')
      expect(columnHeaders).toHaveLength(5)

      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col')
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible section label', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      const section = screen.getByRole('region', {
        name: /Multi-year rankings table/i,
      })
      expect(section).toBeInTheDocument()
    })

    it('provides screen reader description of table content', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      // Check for sr-only description
      const description = screen.getByText(
        /Multi-year ranking comparison showing 3 program years/i
      )
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('sr-only')
    })

    it('change indicators have descriptive aria-labels', () => {
      renderWithProviders(<MultiYearComparisonTable {...baseProps} />)

      // Check that change indicators have proper labels
      // Note: Both desktop table and mobile card views render, so we use getAllByRole
      const overallImprovedIndicators = screen.getAllByRole('status', {
        name: /Overall rank improved by 5 positions/i,
      })
      expect(overallImprovedIndicators.length).toBeGreaterThan(0)

      const clubsImprovedIndicators = screen.getAllByRole('status', {
        name: /Clubs rank improved by 3 positions/i,
      })
      expect(clubsImprovedIndicators.length).toBeGreaterThan(0)
    })

    it('handles singular position change in aria-label', () => {
      const singleChangeRankings = [
        createYearlyRanking({
          programYear: '2023-2024',
          yearOverYearChange: {
            overall: 1, // improved by 1 position
            clubs: 0,
            payments: 0,
            distinguished: 0,
          },
        }),
      ]

      renderWithProviders(
        <MultiYearComparisonTable
          yearlyRankings={singleChangeRankings}
          isLoading={false}
        />
      )

      // Both desktop and mobile views render, so use getAllByRole
      const indicators = screen.getAllByRole('status', {
        name: /Overall rank improved by 1 position$/i,
      })
      expect(indicators.length).toBeGreaterThan(0)
    })
  })

  describe('Single Year Display', () => {
    it('renders correctly with only one year of data', () => {
      const singleYearRankings = [
        createYearlyRanking({
          programYear: '2023-2024',
          yearOverYearChange: null,
        }),
      ]

      renderWithProviders(
        <MultiYearComparisonTable
          yearlyRankings={singleYearRankings}
          isLoading={false}
        />
      )

      // Both desktop and mobile views render, so use getAllByText
      const yearElements = screen.getAllByText('2023-2024')
      expect(yearElements.length).toBeGreaterThan(0)
      expect(screen.getByText('Multi-Year Comparison')).toBeInTheDocument()

      // Description should say "1 program year"
      const description = screen.getByText(
        /Multi-year ranking comparison showing 1 program year/i
      )
      expect(description).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles extreme rank values', () => {
      const extremeRankings = [
        createYearlyRanking({
          programYear: '2023-2024',
          overallRank: 1,
          clubsRank: 126,
          paymentsRank: 1,
          distinguishedRank: 126,
          totalDistricts: 126,
        }),
      ]

      renderWithProviders(
        <MultiYearComparisonTable
          yearlyRankings={extremeRankings}
          isLoading={false}
        />
      )

      // Should display rank 1 (best)
      const rank1Elements = screen.getAllByText('1')
      expect(rank1Elements.length).toBeGreaterThan(0)

      // Should display rank 126 (worst)
      const rank126Elements = screen.getAllByText('126')
      expect(rank126Elements.length).toBeGreaterThan(0)
    })

    it('handles large year-over-year changes', () => {
      const largeChangeRankings = [
        createYearlyRanking({
          programYear: '2023-2024',
          yearOverYearChange: {
            overall: 50, // improved by 50 positions
            clubs: -40, // declined by 40 positions
            payments: 0,
            distinguished: 0,
          },
        }),
      ]

      renderWithProviders(
        <MultiYearComparisonTable
          yearlyRankings={largeChangeRankings}
          isLoading={false}
        />
      )

      // Both desktop and mobile views render, so use getAllByRole
      const overallIndicators = screen.getAllByRole('status', {
        name: /Overall rank improved by 50 positions/i,
      })
      expect(overallIndicators.length).toBeGreaterThan(0)

      const clubsIndicators = screen.getAllByRole('status', {
        name: /Clubs rank declined by 40 positions/i,
      })
      expect(clubsIndicators.length).toBeGreaterThan(0)
    })
  })
})
