/**
 * Unit Tests for DivisionPerformanceCards Component
 *
 * Tests the container component that orchestrates division performance card rendering,
 * verifying data extraction, ordering, loading states, error handling, and snapshot
 * timestamp display.
 *
 * Validates Requirements: 1.1, 1.2, 1.3, 10.3, 10.4
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DivisionPerformanceCards } from '../DivisionPerformanceCards'
import { logger } from '../../utils/logger'

// Mock the extractDivisionPerformance function
vi.mock('../../utils/extractDivisionPerformance', () => ({
  extractDivisionPerformance: vi.fn(),
}))

// Mock the formatDisplayDate function
vi.mock('../../utils/dateFormatting', () => ({
  formatDisplayDate: vi.fn((date: string) => {
    // Simple mock implementation
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }),
}))

import { extractDivisionPerformance } from '../../utils/extractDivisionPerformance'
import type { DivisionPerformance } from '../../utils/divisionStatus'
import { withRecognitionState } from '../../test-utils/areaFixture'

describe('DivisionPerformanceCards', () => {
  const mockDivisions: DivisionPerformance[] = [
    {
      divisionId: 'A',
      status: 'distinguished',
      clubBase: 50,
      paidClubs: 52,
      netGrowth: 2,
      distinguishedClubs: 26,
      requiredDistinguishedClubs: 25,
      areas: [
        withRecognitionState({
          areaId: 'A1',
          status: 'distinguished',
          clubBase: 10,
          paidClubs: 11,
          netGrowth: 1,
          distinguishedClubs: 6,
          requiredDistinguishedClubs: 5,
          firstRoundVisits: {
            completed: 8,
            required: 8,
            percentage: 80,
            meetsThreshold: true,
          },
          secondRoundVisits: {
            completed: 8,
            required: 8,
            percentage: 80,
            meetsThreshold: true,
          },
          isQualified: true,
        }),
      ],
    },
    {
      divisionId: 'B',
      status: 'select-distinguished',
      clubBase: 40,
      paidClubs: 41,
      netGrowth: 1,
      distinguishedClubs: 21,
      requiredDistinguishedClubs: 20,
      areas: [
        withRecognitionState({
          areaId: 'B1',
          status: 'select-distinguished',
          clubBase: 8,
          paidClubs: 9,
          netGrowth: 1,
          distinguishedClubs: 5,
          requiredDistinguishedClubs: 4,
          firstRoundVisits: {
            completed: 7,
            required: 6,
            percentage: 87.5,
            meetsThreshold: true,
          },
          secondRoundVisits: {
            completed: 7,
            required: 6,
            percentage: 87.5,
            meetsThreshold: true,
          },
          isQualified: true,
        }),
      ],
    },
  ]

  const mockSnapshot = {
    divisionPerformance: [
      { Division: 'A', 'Club Base': '50', 'Paid Clubs': '52' },
      { Division: 'B', 'Club Base': '40', 'Paid Clubs': '41' },
    ],
    clubPerformance: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State (Requirement 10.4)', () => {
    it('should display loading indicator when isLoading is true', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={true}
        />
      )

      expect(
        screen.getByText('Loading division performance data...')
      ).toBeInTheDocument()
    })

    it('should show spinner animation during loading', () => {
      const { container } = render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={true}
        />
      )

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should not call extractDivisionPerformance when loading', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={true}
        />
      )

      expect(extractDivisionPerformance).not.toHaveBeenCalled()
    })
  })

  describe('Error State - Invalid Data', () => {
    it('should display error message when districtSnapshot is null', () => {
      render(
        <DivisionPerformanceCards districtSnapshot={null} isLoading={false} />
      )

      expect(screen.getByText('No Data Available')).toBeInTheDocument()
      expect(
        screen.getByText(/District snapshot data is not available/i)
      ).toBeInTheDocument()
    })

    it('should display error message when districtSnapshot is undefined', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={undefined}
          isLoading={false}
        />
      )

      expect(screen.getByText('No Data Available')).toBeInTheDocument()
    })

    it('should show error icon when data is invalid', () => {
      const { container } = render(
        <DivisionPerformanceCards districtSnapshot={null} isLoading={false} />
      )

      const errorIcon = container.querySelector('svg')
      expect(errorIcon).toBeInTheDocument()
    })
  })

  describe('Empty State - No Divisions', () => {
    it('should display empty state when no divisions are found', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue([])

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      expect(screen.getByText('No Divisions Found')).toBeInTheDocument()
      expect(
        screen.getByText(/No division data was found/i)
      ).toBeInTheDocument()
    })

    it('should show empty state icon', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue([])

      const { container } = render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      const emptyIcon = container.querySelector('svg')
      expect(emptyIcon).toBeInTheDocument()
    })
  })

  describe('Snapshot Timestamp Display (Requirement 10.3)', () => {
    it('should display snapshot timestamp when provided', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
          snapshotTimestamp="2024-01-15T10:30:00Z"
        />
      )

      expect(screen.getByText('Data as of')).toBeInTheDocument()
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument()
    })

    it('should not display timestamp section when not provided', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      expect(screen.queryByText('Data as of')).not.toBeInTheDocument()
    })

    it('should display section header with timestamp', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
          snapshotTimestamp="2024-01-15T10:30:00Z"
        />
      )

      expect(
        screen.getByText('Division & Area Performance')
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Performance metrics for all divisions and areas/i)
      ).toBeInTheDocument()
    })
  })

  describe('Division Card Rendering (Requirements 1.1, 1.2)', () => {
    it('should render one card for each division', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      expect(screen.getByText('Division A')).toBeInTheDocument()
      expect(screen.getByText('Division B')).toBeInTheDocument()
    })

    it('should render single division correctly', () => {
      const singleDivision: DivisionPerformance[] = [mockDivisions[0]]
      vi.mocked(extractDivisionPerformance).mockReturnValue(singleDivision)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      expect(screen.getByText('Division A')).toBeInTheDocument()
      expect(screen.queryByText('Division B')).not.toBeInTheDocument()
      expect(
        screen.getByLabelText('Division A performance card')
      ).toBeInTheDocument()
    })

    it('should render all divisions simultaneously', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      // Both divisions should be visible at the same time
      const divisionA = screen.getByText('Division A')
      const divisionB = screen.getByText('Division B')

      expect(divisionA).toBeVisible()
      expect(divisionB).toBeVisible()
    })

    it('should call extractDivisionPerformance with snapshot data', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      // Snapshot date is forwarded so the source-of-truth gate is
      // snapshot-relative, not wall-clock (#832). Undefined when no
      // `snapshotTimestamp` prop is provided.
      expect(extractDivisionPerformance).toHaveBeenCalledWith(
        mockSnapshot,
        undefined
      )
      expect(extractDivisionPerformance).toHaveBeenCalledTimes(1)
    })
  })

  describe('Division Ordering (Requirement 1.3)', () => {
    it('should render divisions in order returned by extractDivisionPerformance', () => {
      // extractDivisionPerformance is responsible for ordering
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      // Verify order by checking that both division cards are present
      const divisionACard = screen.getByLabelText('Division A performance card')
      const divisionBCard = screen.getByLabelText('Division B performance card')

      expect(divisionACard).toBeInTheDocument()
      expect(divisionBCard).toBeInTheDocument()

      // Verify they appear in the correct order in the DOM
      const allCards = screen.getAllByLabelText(
        /Division [AB] performance card/
      )
      expect(allCards).toHaveLength(2)
      expect(allCards[0]).toHaveAttribute(
        'aria-label',
        'Division A performance card'
      )
      expect(allCards[1]).toHaveAttribute(
        'aria-label',
        'Division B performance card'
      )
    })

    it('should render multiple divisions in alphabetical order', () => {
      // Create divisions C, A, B to verify ordering is maintained
      const unorderedDivisions: DivisionPerformance[] = [
        { ...mockDivisions[0], divisionId: 'C' },
        { ...mockDivisions[0], divisionId: 'A' },
        { ...mockDivisions[1], divisionId: 'B' },
      ]
      // extractDivisionPerformance returns them in sorted order
      const sortedDivisions = [...unorderedDivisions].sort((a, b) =>
        a.divisionId.localeCompare(b.divisionId)
      )
      vi.mocked(extractDivisionPerformance).mockReturnValue(sortedDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      // Verify all three divisions are rendered in alphabetical order
      const allCards = screen.getAllByLabelText(
        /Division [ABC] performance card/
      )
      expect(allCards).toHaveLength(3)
      expect(allCards[0]).toHaveAttribute(
        'aria-label',
        'Division A performance card'
      )
      expect(allCards[1]).toHaveAttribute(
        'aria-label',
        'Division B performance card'
      )
      expect(allCards[2]).toHaveAttribute(
        'aria-label',
        'Division C performance card'
      )
    })

    it('should maintain order with different division identifiers', () => {
      const orderedDivisions: DivisionPerformance[] = [
        { ...mockDivisions[0], divisionId: 'C' },
        { ...mockDivisions[1], divisionId: 'D' },
      ]

      vi.mocked(extractDivisionPerformance).mockReturnValue(orderedDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      const divisionC = screen.getByText('Division C')
      const divisionD = screen.getByText('Division D')

      expect(divisionC).toBeInTheDocument()
      expect(divisionD).toBeInTheDocument()
    })
  })

  describe('Summary Footer', () => {
    it('should display count of divisions and areas', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      expect(
        screen.getByText(/Showing 2 divisions with 2 total areas/i)
      ).toBeInTheDocument()
    })

    it('should use singular form for single division', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue([mockDivisions[0]])

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      expect(
        screen.getByText(/Showing 1 division with 1 total area/i)
      ).toBeInTheDocument()
    })

    it('should handle multiple areas correctly', () => {
      const divisionWithManyAreas: DivisionPerformance = {
        ...mockDivisions[0],
        areas: [
          mockDivisions[0].areas[0],
          { ...mockDivisions[0].areas[0], areaId: 'A2' },
          { ...mockDivisions[0].areas[0], areaId: 'A3' },
        ],
      }

      vi.mocked(extractDivisionPerformance).mockReturnValue([
        divisionWithManyAreas,
      ])

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      expect(
        screen.getByText(/Showing 1 division with 3 total areas/i)
      ).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle extraction errors gracefully', () => {
      vi.mocked(extractDivisionPerformance).mockImplementation(() => {
        throw new Error('Extraction failed')
      })

      // Should not throw, should show empty state
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      expect(screen.getByText('No Divisions Found')).toBeInTheDocument()
    })

    it('should log extraction errors to console', () => {
      const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
      vi.mocked(extractDivisionPerformance).mockImplementation(() => {
        throw new Error('Extraction failed')
      })

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      expect(loggerSpy).toHaveBeenCalledWith(
        'Error extracting division performance:',
        expect.any(Error)
      )

      loggerSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA region for division cards', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      const region = screen.getByRole('region', {
        name: 'Division performance cards',
      })
      expect(region).toBeInTheDocument()
    })

    it('should have semantic HTML structure', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
          snapshotTimestamp="2024-01-15T10:30:00Z"
        />
      )

      const heading = screen.getByText('Division & Area Performance')
      expect(heading.tagName).toBe('H2')
    })
  })

  describe('Data Memoization', () => {
    it('should memoize division extraction based on snapshot', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      const { rerender } = render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      // Rerender with same snapshot
      rerender(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      // Should only call once due to memoization
      expect(extractDivisionPerformance).toHaveBeenCalledTimes(1)
    })

    it('should re-extract when snapshot changes', () => {
      vi.mocked(extractDivisionPerformance).mockReturnValue(mockDivisions)

      const { rerender } = render(
        <DivisionPerformanceCards
          districtSnapshot={mockSnapshot}
          isLoading={false}
        />
      )

      const newSnapshot = { ...mockSnapshot, divisionPerformance: [] }

      rerender(
        <DivisionPerformanceCards
          districtSnapshot={newSnapshot}
          isLoading={false}
        />
      )

      // Should call twice - once for each snapshot
      expect(extractDivisionPerformance).toHaveBeenCalledTimes(2)
    })
  })
})
