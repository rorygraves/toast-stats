/**
 * Integration Tests for District Detail Page - Division Performance Cards
 *
 * Tests the integration of DivisionPerformanceCards component within the District Detail Page context,
 * verifying:
 * - Component renders correctly with real snapshot structure
 * - Component receives and processes proper data
 * - Responsive behavior at different breakpoints (mobile, tablet, desktop)
 * - Accessibility standards (WCAG AA compliance)
 *
 * Validates Requirements: 8.6, 8.7, 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { DivisionPerformanceCards } from '../../components/DivisionPerformanceCards'

// Extend expect with jest-axe matchers
// @ts-expect-error - jest-axe types are not perfectly compatible with vitest expect
expect.extend(toHaveNoViolations)

// Axe synchronization to prevent concurrent runs
let axeRunning = false
const axeQueue: Array<() => Promise<void>> = []

const runAxeSynchronized = async (container: Element): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const wrappedFn = async () => {
      try {
        const results = await axe(container)
        resolve(results)
      } catch (error) {
        reject(error)
      } finally {
        axeRunning = false
        // Process next item in queue
        const next = axeQueue.shift()
        if (next) {
          axeRunning = true
          next()
        }
      }
    }

    if (axeRunning) {
      // Add to queue
      axeQueue.push(wrappedFn)
    } else {
      // Run immediately
      axeRunning = true
      wrappedFn()
    }
  })
}

describe('DistrictDetailPage - Division Performance Cards Integration', () => {
  // Mock district statistics data with division and area performance
  // Note: divisionPerformance contains club-level data with Division and Area fields
  // The extractDivisionPerformance function groups clubs by Division and Area
  const mockDistrictStatistics = {
    districtId: 'D1',
    asOfDate: '2024-01-15T10:30:00Z',
    membership: {
      total: 5000,
      change: 100,
      changePercent: 2.0,
    },
    clubs: {
      total: 100,
      active: 95,
      suspended: 3,
      ineligible: 2,
      low: 5,
      distinguished: 50,
    },
    education: {
      totalAwards: 500,
      byType: [],
      topClubs: [],
      byMonth: [],
    },
    // divisionPerformance contains club-level data that gets grouped by Division/Area
    divisionPerformance: [
      // Division A clubs
      {
        Club: '123456',
        'Club Name': 'Test Club A1-1',
        Division: 'A',
        Area: 'A1',
        'Division Club Base': '50',
        'Area Club Base': '10',
        'Nov Visit award': '1',
        'May visit award': '1',
      },
      {
        Club: '123457',
        'Club Name': 'Test Club A1-2',
        Division: 'A',
        Area: 'A1',
        'Division Club Base': '50',
        'Area Club Base': '10',
        'Nov Visit award': '1',
        'May visit award': '1',
      },
      // Division B clubs
      {
        Club: '123458',
        'Club Name': 'Test Club B1-1',
        Division: 'B',
        Area: 'B1',
        'Division Club Base': '40',
        'Area Club Base': '8',
        'Nov Visit award': '1',
        'May visit award': '1',
      },
    ],
    // clubPerformance contains club status and distinguished status
    clubPerformance: [
      {
        'Club Number': '123456',
        'Club Name': 'Test Club A1-1',
        Division: 'A',
        Area: 'A1',
        'Club Status': 'Active',
        'Club Distinguished Status': 'Distinguished',
        'Mem. Base': '20',
        'Active Members': '22',
        'Goals Met': '5',
      },
      {
        'Club Number': '123457',
        'Club Name': 'Test Club A1-2',
        Division: 'A',
        Area: 'A1',
        'Club Status': 'Active',
        'Club Distinguished Status': 'Select Distinguished',
        'Mem. Base': '15',
        'Active Members': '20',
        'Goals Met': '7',
      },
      {
        'Club Number': '123458',
        'Club Name': 'Test Club B1-1',
        Division: 'B',
        Area: 'B1',
        'Club Status': 'Active',
        'Club Distinguished Status': 'Distinguished',
        'Mem. Base': '25',
        'Active Members': '27',
        'Goals Met': '6',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering with Real Data Structure (Requirements 8.6, 8.7)', () => {
    it('should render DivisionPerformanceCards with real snapshot structure', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
          snapshotTimestamp={mockDistrictStatistics.asOfDate}
        />
      )

      // Verify component renders
      expect(
        screen.getByText('Division & Area Performance')
      ).toBeInTheDocument()

      // Verify divisions are rendered
      expect(screen.getByText('Division A')).toBeInTheDocument()
      expect(screen.getByText('Division B')).toBeInTheDocument()
    })

    it('should display division data correctly from snapshot', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Verify Division A data - 2 clubs in division A, both active and distinguished
      // Club base from "Division Club Base" = 50, but actual clubs = 2
      // Since we have 2 clubs with "Division Club Base": "50", the division uses 50 as base
      // New compact format without spaces
      expect(screen.getByText('2/50')).toBeInTheDocument() // Paid clubs (2 active / 50 base)
      // Distinguished required = DDP Distinguished tier, 45% of club base (#799):
      // ceil(50 * 0.45) = 23 (the old 50% rule incorrectly demanded 25)
      expect(screen.getByText('2/23')).toBeInTheDocument()

      // Verify Division B data - 1 club in division B
      expect(screen.getByText('1/40')).toBeInTheDocument() // Paid clubs (1 active / 40 base)
      // ceil(40 * 0.45) = 18 (the old 50% rule incorrectly demanded 20)
      expect(screen.getByText('1/18')).toBeInTheDocument()
    })

    it('should display area performance tables', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Verify area tables are present (one per division)
      const tables = screen.getAllByRole('table')
      expect(tables).toHaveLength(2)

      // Verify area identifiers are displayed
      expect(screen.getByText('A1')).toBeInTheDocument()
      expect(screen.getByText('B1')).toBeInTheDocument()
    })

    it('should display snapshot timestamp', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
          snapshotTimestamp={mockDistrictStatistics.asOfDate}
        />
      )

      expect(screen.getByText('Data as of')).toBeInTheDocument()
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument()
    })

    it('should show loading state', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={true}
        />
      )

      expect(
        screen.getByText('Loading division performance data...')
      ).toBeInTheDocument()
    })

    it('should handle missing data gracefully', () => {
      render(
        <DivisionPerformanceCards districtSnapshot={null} isLoading={false} />
      )

      expect(screen.getByText('No Data Available')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior (Requirements 9.1, 9.2, 9.3)', () => {
    it('should render properly at mobile breakpoint (320px)', () => {
      // Set viewport to mobile size
      global.innerWidth = 320
      global.dispatchEvent(new Event('resize'))

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Verify content is rendered and accessible
      expect(screen.getByText('Division A')).toBeInTheDocument()
      expect(screen.getByText('Division B')).toBeInTheDocument()

      // Verify cards are visible
      const divisionCards = screen.getAllByLabelText(
        /Division [AB] performance card/
      )
      expect(divisionCards).toHaveLength(2)
      divisionCards.forEach(card => {
        expect(card).toBeVisible()
      })
    })

    it('should render properly at tablet breakpoint (768px)', () => {
      // Set viewport to tablet size
      global.innerWidth = 768
      global.dispatchEvent(new Event('resize'))

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Verify content is rendered
      expect(screen.getByText('Division A')).toBeInTheDocument()
      expect(screen.getByText('Division B')).toBeInTheDocument()
    })

    it('should render properly at desktop breakpoint (1024px)', () => {
      // Set viewport to desktop size
      global.innerWidth = 1024
      global.dispatchEvent(new Event('resize'))

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Verify content is rendered
      expect(screen.getByText('Division A')).toBeInTheDocument()
      expect(screen.getByText('Division B')).toBeInTheDocument()
    })

    it('should maintain readability of metrics on mobile', () => {
      global.innerWidth = 375
      global.dispatchEvent(new Event('resize'))

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Verify key metrics are visible and readable
      // Division A: 2 paid clubs / 50 base, 2 distinguished / 23 required
      // (DDP Distinguished = 45% of club base, #799: ceil(50 * 0.45) = 23)
      expect(screen.getByText('2/50')).toBeVisible()
      expect(screen.getByText('2/23')).toBeVisible()
    })

    it('should handle horizontal scrolling for area tables on mobile', () => {
      global.innerWidth = 320
      global.dispatchEvent(new Event('resize'))

      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Verify area tables are present
      const tables = screen.getAllByRole('table')
      expect(tables).toHaveLength(2)

      // Tables should be in scrollable containers
      tables.forEach(table => {
        const scrollContainer = table.closest('.overflow-x-auto')
        expect(scrollContainer).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility (Requirement 9.4)', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
          snapshotTimestamp={mockDistrictStatistics.asOfDate}
        />
      )

      // Run axe accessibility tests
      const results = await runAxeSynchronized(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels for division cards', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Verify ARIA labels
      expect(
        screen.getByLabelText('Division A performance card')
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText('Division B performance card')
      ).toBeInTheDocument()
    })

    it('should have proper tables for area performance', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Verify tables are present (one per division)
      const tables = screen.getAllByRole('table')
      expect(tables).toHaveLength(2)

      // Verify table headers exist (appears in both tables)
      expect(screen.getAllByText('Area').length).toBeGreaterThanOrEqual(2)
      expect(screen.getAllByText('Recognition').length).toBeGreaterThanOrEqual(
        2
      )
    })

    it('should maintain proper heading hierarchy', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
          snapshotTimestamp={mockDistrictStatistics.asOfDate}
        />
      )

      // Verify division headings exist (h2 level)
      const divisionHeadings = screen.getAllByRole('heading', { level: 2 })
      expect(divisionHeadings.length).toBeGreaterThanOrEqual(2) // At least Division A and Division B

      // Verify heading text
      expect(screen.getByText(/Division A/)).toBeInTheDocument()
      expect(screen.getByText(/Division B/)).toBeInTheDocument()
    })

    it('should have sufficient color contrast for status indicators', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Verify status badges are present (axe will check contrast)
      const statusBadges = screen.getAllByText(
        /Distinguished|Select Distinguished|President's Distinguished|Not Distinguished/i
      )
      expect(statusBadges.length).toBeGreaterThan(0)
    })

    it('should have proper region landmark', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      const region = screen.getByRole('region', {
        name: 'Division performance cards',
      })
      expect(region).toBeInTheDocument()
    })
  })

  describe('Data Integration', () => {
    it('should extract and display all divisions from snapshot', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Should show count of divisions
      expect(screen.getByText(/Showing 2 divisions/i)).toBeInTheDocument()
    })

    it('should calculate and display area counts', () => {
      render(
        <DivisionPerformanceCards
          districtSnapshot={mockDistrictStatistics}
          isLoading={false}
        />
      )

      // Should show total area count (A1 in Division A, B1 in Division B = 2 areas)
      expect(screen.getByText(/with 2 total area/i)).toBeInTheDocument()
    })

    it('should handle empty division data', () => {
      const emptySnapshot = {
        ...mockDistrictStatistics,
        divisionPerformance: [],
        clubPerformance: [],
      }

      render(
        <DivisionPerformanceCards
          districtSnapshot={emptySnapshot}
          isLoading={false}
        />
      )

      expect(screen.getByText('No Divisions Found')).toBeInTheDocument()
    })
  })
})
