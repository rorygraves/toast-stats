/**
 * Unit Tests for DivisionPerformanceCard Component
 *
 * Tests the rendering and composition of the DivisionPerformanceCard component,
 * verifying that it correctly combines DivisionSummary and AreaPerformanceTable
 * components with proper card styling and brand compliance.
 *
 * Validates Requirements: 1.1, 8.1, 8.7
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DivisionPerformanceCard } from '../DivisionPerformanceCard'
import type { DivisionPerformance } from '../../utils/divisionStatus'
import { withRecognitionState } from '../../test-utils/areaFixture'

describe('DivisionPerformanceCard', () => {
  const mockDivision: DivisionPerformance = {
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
      withRecognitionState({
        areaId: 'A2',
        status: 'not-qualified',
        clubBase: 8,
        paidClubs: 7,
        netGrowth: -1,
        distinguishedClubs: 4,
        requiredDistinguishedClubs: 4,
        firstRoundVisits: {
          completed: 5,
          required: 6,
          percentage: 62.5,
          meetsThreshold: false,
        },
        secondRoundVisits: {
          completed: 6,
          required: 6,
          percentage: 75,
          meetsThreshold: true,
        },
        isQualified: false,
      }),
    ],
  }

  describe('Component Composition (Requirement 1.1)', () => {
    it('should render DivisionSummary at the top', () => {
      render(<DivisionPerformanceCard division={mockDivision} />)

      // Verify division summary is rendered
      expect(screen.getByText('Division A')).toBeInTheDocument()
      expect(
        screen.getByRole('status', { name: /Division status: Distinguished/i })
      ).toBeInTheDocument()
      // New compact layout uses "Paid:" and "Distinguished:" labels
      expect(screen.getByText('Paid:')).toBeInTheDocument()
      expect(screen.getByText('Distinguished:')).toBeInTheDocument()
    })

    it('should render AreaPerformanceTable below summary', () => {
      const { container } = render(
        <DivisionPerformanceCard division={mockDivision} />
      )

      // Verify table headers are rendered (new column structure per Requirement 9.1)
      // Use container queries to target table headers specifically
      const tableHeaders = container.querySelectorAll('th')
      const headerTexts = Array.from(tableHeaders).map(th => th.textContent)

      expect(headerTexts).toContain('Area')
      // Header includes additional context text
      expect(headerTexts.some(h => h?.includes('Paid'))).toBe(true)
      expect(headerTexts.some(h => h?.includes('Distinguished'))).toBe(true)
      expect(headerTexts.some(h => h?.includes('First Round Visits'))).toBe(
        true
      )
      expect(headerTexts.some(h => h?.includes('Second Round Visits'))).toBe(
        true
      )
      expect(headerTexts).toContain('Recognition')
      expect(headerTexts.some(h => h?.includes('Gap to D'))).toBe(true)
      expect(headerTexts.some(h => h?.includes('Gap to S'))).toBe(true)
      expect(headerTexts.some(h => h?.includes('Gap to P'))).toBe(true)

      // Verify area rows are rendered
      expect(screen.getByText('A1')).toBeInTheDocument()
      expect(screen.getByText('A2')).toBeInTheDocument()
    })

    it('should pass division data to DivisionSummary', () => {
      render(<DivisionPerformanceCard division={mockDivision} />)

      // Verify division-level metrics are displayed (new compact format without spaces)
      expect(screen.getByText('52/50')).toBeInTheDocument() // Paid clubs
      expect(screen.getByText('26/25')).toBeInTheDocument() // Distinguished clubs
      expect(
        screen.getByLabelText(/Net growth: positive 2/i)
      ).toBeInTheDocument()
    })

    it('should pass areas data to AreaPerformanceTable', () => {
      render(<DivisionPerformanceCard division={mockDivision} />)

      // Verify area-level data is displayed
      expect(screen.getByText('A1')).toBeInTheDocument()
      expect(screen.getByText('A2')).toBeInTheDocument()
      // Area table now shows Paid/Base with percentage (e.g., "11/10 110%")
      expect(screen.getByText(/11\/10 110%/)).toBeInTheDocument()
      expect(screen.getByText(/7\/8 88%/)).toBeInTheDocument()
    })
  })

  describe('Card Styling (Requirement 8.1)', () => {
    it('should render as a card component', () => {
      const { container } = render(
        <DivisionPerformanceCard division={mockDivision} />
      )

      // Verify card classes are applied
      const card = container.querySelector('.tm-card')
      expect(card).toBeInTheDocument()
    })

    it('should use default card variant', () => {
      const { container } = render(
        <DivisionPerformanceCard division={mockDivision} />
      )

      const card = container.querySelector('.tm-card-default')
      expect(card).toBeInTheDocument()
    })

    it('should have proper spacing between cards', () => {
      const { container } = render(
        <DivisionPerformanceCard division={mockDivision} />
      )

      const card = container.querySelector('.mb-6')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Accessibility (Requirement 8.7)', () => {
    it('should have aria-label for the card', () => {
      render(<DivisionPerformanceCard division={mockDivision} />)

      const card = screen.getByLabelText('Division A performance card')
      expect(card).toBeInTheDocument()
    })

    it('should have proper semantic structure', () => {
      render(<DivisionPerformanceCard division={mockDivision} />)

      // Verify heading hierarchy
      const heading = screen.getByText('Division A')
      expect(heading.tagName).toBe('H2')

      // Verify table structure
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('should have accessible status indicators', () => {
      render(<DivisionPerformanceCard division={mockDivision} />)

      // Verify status badge has proper aria-label
      expect(
        screen.getByRole('status', { name: /Division status: Distinguished/i })
      ).toBeInTheDocument()
    })
  })

  describe('Different Division Statuses', () => {
    it("should render President's Distinguished division", () => {
      const presidentsDiv: DivisionPerformance = {
        ...mockDivision,
        status: 'presidents-distinguished',
        paidClubs: 52,
        netGrowth: 2,
        distinguishedClubs: 28,
      }

      render(<DivisionPerformanceCard division={presidentsDiv} />)

      // Use aria-label to target the division status badge specifically
      expect(
        screen.getByRole('status', {
          name: /Division status: President's Distinguished/i,
        })
      ).toBeInTheDocument()
    })

    it('should render Select Distinguished division', () => {
      const selectDiv: DivisionPerformance = {
        ...mockDivision,
        status: 'select-distinguished',
        paidClubs: 50,
        netGrowth: 0,
        distinguishedClubs: 26,
      }

      render(<DivisionPerformanceCard division={selectDiv} />)

      expect(
        screen.getByRole('status', {
          name: /Division status: Select Distinguished/i,
        })
      ).toBeInTheDocument()
    })

    it('should render Not Distinguished division', () => {
      // Create a division that is "Not Distinguished" but meets no net loss requirement
      // (paidClubs >= clubBase) so it shows "Not Distinguished" instead of "Net Loss"
      // Per Requirement 9.1: Show "Net Loss" when paidClubs < clubBase
      const notDistDiv: DivisionPerformance = {
        ...mockDivision,
        status: 'not-distinguished',
        clubBase: 50,
        paidClubs: 50, // Meets no net loss requirement
        netGrowth: 0,
        distinguishedClubs: 20, // Below 45% threshold (need 23)
      }

      render(<DivisionPerformanceCard division={notDistDiv} />)

      expect(
        screen.getByRole('status', {
          name: /Division status: Not Distinguished/i,
        })
      ).toBeInTheDocument()
    })

    it('should render Net Loss division when paidClubs < clubBase', () => {
      // Per Requirement 9.1: Show "Net Loss" when there's net club loss
      const netLossDiv: DivisionPerformance = {
        ...mockDivision,
        status: 'not-distinguished',
        clubBase: 50,
        paidClubs: 48, // Net club loss
        netGrowth: -2,
        distinguishedClubs: 20,
      }

      render(<DivisionPerformanceCard division={netLossDiv} />)

      expect(
        screen.getByRole('status', {
          name: /Division status: Net Loss/i,
        })
      ).toBeInTheDocument()
    })
  })

  describe('Different Division Identifiers', () => {
    it('should render different division identifiers', () => {
      const divisionB: DivisionPerformance = {
        ...mockDivision,
        divisionId: 'B',
      }

      const { rerender } = render(
        <DivisionPerformanceCard division={divisionB} />
      )
      expect(screen.getByText('Division B')).toBeInTheDocument()

      const divisionC: DivisionPerformance = {
        ...mockDivision,
        divisionId: 'C',
      }

      rerender(<DivisionPerformanceCard division={divisionC} />)
      expect(screen.getByText('Division C')).toBeInTheDocument()
    })
  })

  describe('Varying Number of Areas', () => {
    it('should render division with no areas', () => {
      const emptyDiv: DivisionPerformance = {
        ...mockDivision,
        areas: [],
      }

      render(<DivisionPerformanceCard division={emptyDiv} />)

      // Summary should still render
      expect(screen.getByText('Division A')).toBeInTheDocument()

      // Table should render but with no rows
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.queryByText('A1')).not.toBeInTheDocument()
    })

    it('should render division with single area', () => {
      const singleAreaDiv: DivisionPerformance = {
        ...mockDivision,
        areas: [mockDivision.areas[0]],
      }

      render(<DivisionPerformanceCard division={singleAreaDiv} />)

      expect(screen.getByText('A1')).toBeInTheDocument()
      expect(screen.queryByText('A2')).not.toBeInTheDocument()
    })

    it('should render division with many areas', () => {
      const manyAreasDiv: DivisionPerformance = {
        ...mockDivision,
        areas: [
          mockDivision.areas[0],
          { ...mockDivision.areas[0], areaId: 'A2' },
          { ...mockDivision.areas[0], areaId: 'A3' },
          { ...mockDivision.areas[0], areaId: 'A4' },
          { ...mockDivision.areas[0], areaId: 'A5' },
        ],
      }

      render(<DivisionPerformanceCard division={manyAreasDiv} />)

      expect(screen.getByText('A1')).toBeInTheDocument()
      expect(screen.getByText('A2')).toBeInTheDocument()
      expect(screen.getByText('A3')).toBeInTheDocument()
      expect(screen.getByText('A4')).toBeInTheDocument()
      expect(screen.getByText('A5')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero club base', () => {
      const zeroBaseDiv: DivisionPerformance = {
        ...mockDivision,
        clubBase: 0,
        paidClubs: 0,
        netGrowth: 0,
        distinguishedClubs: 0,
        requiredDistinguishedClubs: 0,
        areas: [],
      }

      render(<DivisionPerformanceCard division={zeroBaseDiv} />)

      expect(screen.getByText('Division A')).toBeInTheDocument()
      expect(screen.getAllByText('0/0')).toHaveLength(2)
    })

    it('should handle large numbers', () => {
      const largeDiv: DivisionPerformance = {
        ...mockDivision,
        clubBase: 100,
        paidClubs: 105,
        netGrowth: 5,
        distinguishedClubs: 55,
        requiredDistinguishedClubs: 50,
      }

      render(<DivisionPerformanceCard division={largeDiv} />)

      expect(screen.getByText('105/100')).toBeInTheDocument()
      expect(screen.getByText('55/50')).toBeInTheDocument()
    })
  })
})
