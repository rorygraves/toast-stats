import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AreaPerformanceTable } from '../AreaPerformanceTable'
import { AreaPerformance } from '../../utils/divisionStatus'
import { deriveAreaRecognitionState } from '../../utils/areaRecognitionState'

/**
 * Add a derived `recognitionState` to a partially-constructed AreaPerformance
 * fixture. Year-end snapshot keeps legacy "visits met → confirmed" assertions
 * valid; the deadline-aware gate is verified in `areaRecognitionState.test.ts`.
 */
function withState(
  fixture: Omit<AreaPerformance, 'recognitionState'>
): AreaPerformance {
  return {
    ...fixture,
    recognitionState: deriveAreaRecognitionState({
      clubBase: fixture.clubBase,
      paidClubs: fixture.paidClubs,
      distinguishedClubs: fixture.distinguishedClubs,
      firstRoundVisitMet: fixture.firstRoundVisits.meetsThreshold,
      secondRoundVisitMet: fixture.secondRoundVisits.meetsThreshold,
      snapshotDate: '2026-06-15',
    }),
  }
}

/**
 * Unit tests for AreaPerformanceTable component
 *
 * Tests verify:
 * - Requirement 6.1: Display one row for each area
 * - Requirement 6.8: Order areas by area identifier
 * - Requirement 8.6: Ensure accessibility (table semantics, headers)
 * - Requirement 8.7: Apply responsive table styling
 * - Requirement 9.1: Display columns in order: Area, Paid/Base, Distinguished, First Round Visits,
 *                    Second Round Visits, Recognition, Gap to D, Gap to S, Gap to P
 * - Requirement 9.2: Paid/Base column shows paid clubs count vs club base with percentage
 * - Requirement 9.3: Distinguished column shows distinguished clubs count vs club base with percentage
 * - Requirement 9.5: Recognition column displays badge indicating current recognition level
 * - Requirement 9.6: Gap columns show number of additional distinguished clubs needed
 */
describe('AreaPerformanceTable', () => {
  const mockArea1: AreaPerformance = withState({
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
  })

  const mockArea2: AreaPerformance = withState({
    areaId: 'A2',
    status: 'not-qualified',
    clubBase: 8,
    paidClubs: 7,
    netGrowth: -1,
    distinguishedClubs: 3,
    requiredDistinguishedClubs: 4,
    firstRoundVisits: {
      completed: 5,
      required: 6,
      percentage: 62.5,
      meetsThreshold: false,
    },
    secondRoundVisits: {
      completed: 5,
      required: 6,
      percentage: 62.5,
      meetsThreshold: false,
    },
    isQualified: false,
  })

  const mockArea3: AreaPerformance = withState({
    areaId: 'B1',
    status: 'presidents-distinguished',
    clubBase: 12,
    paidClubs: 14,
    netGrowth: 2,
    distinguishedClubs: 8,
    requiredDistinguishedClubs: 6,
    firstRoundVisits: {
      completed: 10,
      required: 9,
      percentage: 83.3,
      meetsThreshold: true,
    },
    secondRoundVisits: {
      completed: 10,
      required: 9,
      percentage: 83.3,
      meetsThreshold: true,
    },
    isQualified: true,
  })

  describe('Requirement 6.1: Display one row for each area', () => {
    it('should render one row for each area in the areas array', () => {
      const areas = [mockArea1, mockArea2, mockArea3]
      render(<AreaPerformanceTable areas={areas} />)

      // Verify all area identifiers are present
      expect(screen.getByText('A1')).toBeInTheDocument()
      expect(screen.getByText('A2')).toBeInTheDocument()
      expect(screen.getByText('B1')).toBeInTheDocument()
    })

    it('should render empty tbody when areas array is empty', () => {
      const { container } = render(<AreaPerformanceTable areas={[]} />)

      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
      expect(tbody?.children.length).toBe(0)
    })

    it('should render exactly one row per area', () => {
      const areas = [mockArea1, mockArea2]
      const { container } = render(<AreaPerformanceTable areas={areas} />)

      const tbody = container.querySelector('tbody')
      expect(tbody?.children.length).toBe(2)
    })
  })

  describe('Requirement 6.8: Order areas by area identifier', () => {
    it('should display areas in ascending order by area identifier', () => {
      // Provide areas in non-alphabetical order
      const areas = [mockArea3, mockArea1, mockArea2] // B1, A1, A2
      const { container } = render(<AreaPerformanceTable areas={areas} />)

      const tbody = container.querySelector('tbody')
      const rows = tbody?.querySelectorAll('tr')

      // Verify order: A1, A2, B1
      expect(rows?.[0].textContent).toContain('A1')
      expect(rows?.[1].textContent).toContain('A2')
      expect(rows?.[2].textContent).toContain('B1')
    })

    it('should maintain alphabetical order with numeric area identifiers', () => {
      const area10: AreaPerformance = {
        ...mockArea1,
        areaId: 'A10',
      }
      const area2: AreaPerformance = {
        ...mockArea2,
        areaId: 'A2',
      }
      const area3: AreaPerformance = {
        ...mockArea3,
        areaId: 'A3',
      }

      const areas = [area10, area2, area3]
      const { container } = render(<AreaPerformanceTable areas={areas} />)

      const tbody = container.querySelector('tbody')
      const rows = tbody?.querySelectorAll('tr')

      // Verify alphabetical order (A10, A2, A3)
      expect(rows?.[0].textContent).toContain('A10')
      expect(rows?.[1].textContent).toContain('A2')
      expect(rows?.[2].textContent).toContain('A3')
    })
  })

  describe('Requirement 8.6: Ensure accessibility (table semantics, headers)', () => {
    it('should render a semantic table element', () => {
      const { container } = render(<AreaPerformanceTable areas={[mockArea1]} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('should render table headers with proper scope attributes', () => {
      const { container } = render(<AreaPerformanceTable areas={[mockArea1]} />)

      const headers = container.querySelectorAll('th[scope="col"]')
      // 9 columns: Area, Paid/Base, Distinguished, First Round Visits, Second Round Visits, Recognition, Gap to D, Gap to S, Gap to P
      expect(headers.length).toBe(9)
    })

    it('should render all required column headers', () => {
      render(<AreaPerformanceTable areas={[mockArea1]} />)

      // Requirement 9.1: Column order - headers now have subtitles
      expect(screen.getByText('Area')).toBeInTheDocument()
      expect(screen.getByText('Paid / Base')).toBeInTheDocument()
      expect(screen.getByText('Distinguished')).toBeInTheDocument()
      expect(screen.getByText('First Round Visits')).toBeInTheDocument()
      expect(screen.getByText('Second Round Visits')).toBeInTheDocument()
      expect(screen.getByText('Recognition')).toBeInTheDocument()
      expect(screen.getByText('Gap to D')).toBeInTheDocument()
      expect(screen.getByText('Gap to S')).toBeInTheDocument()
      expect(screen.getByText('Gap to P')).toBeInTheDocument()
    })

    it('should render column header subtitles', () => {
      render(<AreaPerformanceTable areas={[mockArea1]} />)

      // Verify subtitles are displayed
      expect(screen.getByText('(≥ club base required)')).toBeInTheDocument()
      expect(screen.getByText('(of club base)')).toBeInTheDocument()
      expect(screen.getAllByText('(75% of club base)').length).toBe(2) // First and Second Round Visits
      expect(screen.getByText('(50% of base)')).toBeInTheDocument()
      expect(screen.getByText('(50% + 1)')).toBeInTheDocument()
      expect(screen.getByText('(base+1, 50%+1)')).toBeInTheDocument()
    })

    it('should use thead and tbody elements for proper table structure', () => {
      const { container } = render(<AreaPerformanceTable areas={[mockArea1]} />)

      expect(container.querySelector('thead')).toBeInTheDocument()
      expect(container.querySelector('tbody')).toBeInTheDocument()
    })
  })

  describe('Requirement 8.7: Apply responsive table styling', () => {
    it('should wrap table in overflow-x-auto container for horizontal scrolling', () => {
      const { container } = render(<AreaPerformanceTable areas={[mockArea1]} />)

      const wrapper = container.querySelector('.overflow-x-auto')
      expect(wrapper).toBeInTheDocument()
    })

    it('should apply table-auto class for responsive column sizing', () => {
      const { container } = render(<AreaPerformanceTable areas={[mockArea1]} />)

      const table = container.querySelector('table')
      expect(table?.classList.contains('table-auto')).toBe(true)
    })

    it('should apply w-full class for full width table', () => {
      const { container } = render(<AreaPerformanceTable areas={[mockArea1]} />)

      const table = container.querySelector('table')
      expect(table?.classList.contains('w-full')).toBe(true)
    })
  })

  describe('Requirement 9.3: Maintain table accessibility', () => {
    it('should enable horizontal scrolling on mobile through overflow-x-auto', () => {
      const { container } = render(<AreaPerformanceTable areas={[mockArea1]} />)

      const wrapper = container.querySelector('.overflow-x-auto')
      expect(wrapper).toBeInTheDocument()

      // Verify the wrapper contains the table
      const table = wrapper?.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('should maintain table structure for screen readers', () => {
      const { container } = render(<AreaPerformanceTable areas={[mockArea1]} />)

      // Verify proper table structure
      const table = container.querySelector('table')
      const thead = table?.querySelector('thead')
      const tbody = table?.querySelector('tbody')

      expect(table).toBeInTheDocument()
      expect(thead).toBeInTheDocument()
      expect(tbody).toBeInTheDocument()
    })
  })

  describe('Integration with row rendering', () => {
    it('should render row data for each area', () => {
      const areas = [mockArea1, mockArea2]
      render(<AreaPerformanceTable areas={areas} />)

      // Verify that area data is rendered
      expect(screen.getByText('A1')).toBeInTheDocument()
      expect(screen.getByText('A2')).toBeInTheDocument()
    })

    it('should display correct area data with new column format', () => {
      const areas = [mockArea1]
      render(<AreaPerformanceTable areas={areas} />)

      // Verify area identifier is displayed
      expect(screen.getByText('A1')).toBeInTheDocument()

      // Requirement 9.2: Paid/Base column shows paid clubs count vs club base with percentage
      // mockArea1 has paidClubs: 11, clubBase: 10, so "11/10 110%"
      expect(screen.getByText(/11\/10 110%/)).toBeInTheDocument()

      // Requirement 9.3: Distinguished column shows distinguished clubs count vs club base with percentage
      // mockArea1 has distinguishedClubs: 6, clubBase: 10, so "6/10 60%"
      expect(screen.getByText(/6\/10 60%/)).toBeInTheDocument()
    })

    it('should display recognition badge', () => {
      const areas = [mockArea1]
      render(<AreaPerformanceTable areas={areas} />)

      // Requirement 9.5: Recognition column displays badge
      // mockArea1 should be President's Distinguished (paidClubs >= clubBase + 1 AND distinguishedClubs >= 50% + 1)
      const badge = screen.getByLabelText(/Recognition status:/i)
      expect(badge).toBeInTheDocument()
    })

    it('should display gap columns', () => {
      // Create an area that is not yet distinguished
      const notDistinguishedArea: AreaPerformance = {
        ...mockArea1,
        areaId: 'A3',
        paidClubs: 10,
        clubBase: 10,
        distinguishedClubs: 3, // Need 5 for Distinguished (50% of 10)
        netGrowth: 0,
      }
      render(<AreaPerformanceTable areas={[notDistinguishedArea]} />)

      // Requirement 9.6: Gap columns show number of additional distinguished clubs needed
      // Gap to D: need 5 - 3 = 2 more distinguished clubs
      expect(screen.getByText('+2')).toBeInTheDocument()
    })
  })

  describe('Brand compliance', () => {
    it('should use Toastmasters brand colors for header', () => {
      const { container } = render(<AreaPerformanceTable areas={[mockArea1]} />)

      const thead = container.querySelector('thead')
      expect(thead?.classList.contains('bg-tm-cool-gray-10')).toBe(true)
      expect(thead?.classList.contains('border-tm-loyal-blue')).toBe(true)
    })

    it('should use Montserrat font for column headers', () => {
      const { container } = render(<AreaPerformanceTable areas={[mockArea1]} />)

      const headers = container.querySelectorAll('th')
      headers.forEach(header => {
        expect(header.classList.contains('font-tm-headline')).toBe(true)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle single area', () => {
      const areas = [mockArea1]
      const { container } = render(<AreaPerformanceTable areas={areas} />)

      const tbody = container.querySelector('tbody')
      expect(tbody?.children.length).toBe(1)
    })

    it('should handle many areas', () => {
      const manyAreas: AreaPerformance[] = Array.from(
        { length: 20 },
        (_, i) => ({
          ...mockArea1,
          areaId: `A${i + 1}`,
        })
      )

      const { container } = render(<AreaPerformanceTable areas={manyAreas} />)

      const tbody = container.querySelector('tbody')
      expect(tbody?.children.length).toBe(20)
    })

    it('should not mutate the original areas array', () => {
      const areas = [mockArea3, mockArea1, mockArea2]
      const originalOrder = [...areas]

      render(<AreaPerformanceTable areas={areas} />)

      // Verify original array is unchanged
      expect(areas).toEqual(originalOrder)
    })
  })

  describe('Requirement 9.7: Old columns removed', () => {
    it('should not display old Paid Clubs column header', () => {
      render(<AreaPerformanceTable areas={[mockArea1]} />)

      // Old column header should not exist (replaced by Paid / Base)
      const headers = screen.getAllByRole('columnheader')
      const headerTexts = headers.map(h => h.textContent)

      // Should not have standalone "Paid Clubs" header
      expect(headerTexts).not.toContain('Paid Clubs')
    })

    it('should not display old Distinguished Clubs column header', () => {
      render(<AreaPerformanceTable areas={[mockArea1]} />)

      // Old column header should not exist (replaced by Distinguished)
      const headers = screen.getAllByRole('columnheader')
      const headerTexts = headers.map(h => h.textContent)

      // Should not have standalone "Distinguished Clubs" header
      expect(headerTexts).not.toContain('Distinguished Clubs')
    })

    it('should not display old Status column header', () => {
      render(<AreaPerformanceTable areas={[mockArea1]} />)

      // Old column header should not exist (replaced by Recognition)
      const headers = screen.getAllByRole('columnheader')
      const headerTexts = headers.map(h => h.textContent)

      // Should not have "Status" header
      expect(headerTexts).not.toContain('Status')
    })
  })

  describe('Requirement 9.5: Recognition badge variations', () => {
    it('should display Net Loss badge when paidClubs < clubBase', () => {
      // mockArea2 has paidClubs: 7, clubBase: 8 (net loss)
      render(<AreaPerformanceTable areas={[mockArea2]} />)

      const badge = screen.getByLabelText(/Recognition status: Net Loss/i)
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('Net Loss')
    })

    it("should display President's Distinguished badge when criteria met", () => {
      // Create area that meets President's Distinguished criteria
      // paidClubs >= clubBase + 1 AND distinguishedClubs >= 50% of clubBase + 1
      const presidentsArea: AreaPerformance = {
        ...mockArea1,
        areaId: 'P1',
        clubBase: 10,
        paidClubs: 11, // >= clubBase + 1 (11)
        distinguishedClubs: 6, // >= 50% of 10 + 1 = 6
      }
      render(<AreaPerformanceTable areas={[presidentsArea]} />)

      const badge = screen.getByLabelText(
        /Recognition status: President's Distinguished/i
      )
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent("President's Distinguished")
    })

    it('should display Select Distinguished badge when criteria met', () => {
      // Create area that meets Select Distinguished criteria
      // paidClubs >= clubBase AND distinguishedClubs >= 50% of clubBase + 1
      const selectArea: AreaPerformance = withState({
        ...mockArea1,
        areaId: 'S1',
        clubBase: 10,
        paidClubs: 10, // >= clubBase (10) but not clubBase + 1
        distinguishedClubs: 6, // >= 50% of 10 + 1 = 6
      })
      render(<AreaPerformanceTable areas={[selectArea]} />)

      const badge = screen.getByLabelText(
        /Recognition status: Select Distinguished/i
      )
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('Select Distinguished')
    })

    it('should display Distinguished badge when criteria met', () => {
      // Create area that meets Distinguished criteria
      // paidClubs >= clubBase AND distinguishedClubs >= 50% of clubBase
      const distinguishedArea: AreaPerformance = withState({
        ...mockArea1,
        areaId: 'D1',
        clubBase: 10,
        paidClubs: 10, // >= clubBase (10)
        distinguishedClubs: 5, // >= 50% of 10 = 5
      })
      render(<AreaPerformanceTable areas={[distinguishedArea]} />)

      const badge = screen.getByLabelText(/Recognition status: Distinguished/i)
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('Distinguished')
      // Should not be Select or President's
      expect(badge).not.toHaveTextContent('Select')
      expect(badge).not.toHaveTextContent("President's")
    })

    it('should display Not Distinguished badge when no criteria met', () => {
      // Create area that doesn't meet any criteria
      const notDistinguishedArea: AreaPerformance = withState({
        ...mockArea1,
        areaId: 'N1',
        clubBase: 10,
        paidClubs: 10, // >= clubBase (10)
        distinguishedClubs: 4, // < 50% of 10 = 5
      })
      render(<AreaPerformanceTable areas={[notDistinguishedArea]} />)

      const badge = screen.getByLabelText(
        /Recognition status: Not Distinguished/i
      )
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('Not Distinguished')
    })
  })

  describe('Requirement 9.6: Gap column display variations', () => {
    it('should display "-" for achieved gap levels', () => {
      // mockArea3 is President's Distinguished - all gaps should show "-"
      render(<AreaPerformanceTable areas={[mockArea3]} />)

      // All three gap columns should show "-" for achieved levels
      const cells = screen.getAllByText('-')
      expect(cells.length).toBeGreaterThanOrEqual(3)
    })

    it('should display "N/A" for gaps when net loss blocks achievement', () => {
      // mockArea2 has net loss - gaps should show "N/A"
      render(<AreaPerformanceTable areas={[mockArea2]} />)

      // Gap columns should show "N/A" when not achievable
      const naCells = screen.getAllByText('N/A')
      expect(naCells.length).toBe(3) // Gap to D, Gap to S, Gap to P
    })

    it('should display "+N" for gaps that need more clubs', () => {
      // Create area that needs more distinguished clubs
      const needsMoreArea: AreaPerformance = {
        ...mockArea1,
        areaId: 'G1',
        clubBase: 10,
        paidClubs: 10,
        distinguishedClubs: 3, // Need 5 for Distinguished (50% of 10)
      }
      render(<AreaPerformanceTable areas={[needsMoreArea]} />)

      // Gap to D should show +2 (need 5, have 3)
      expect(screen.getByText('+2')).toBeInTheDocument()
      // Gap to S and Gap to P both show +3 (need 6, have 3)
      // Use getAllByText since both columns have the same value
      const plusThreeCells = screen.getAllByText('+3')
      expect(plusThreeCells.length).toBe(2) // Gap to S and Gap to P
    })
  })

  describe('Requirement 9.2 & 9.3: Percentage calculations', () => {
    it('should display 0% when clubBase is 0', () => {
      const zeroBaseArea: AreaPerformance = {
        ...mockArea1,
        areaId: 'Z1',
        clubBase: 0,
        paidClubs: 0,
        distinguishedClubs: 0,
      }
      render(<AreaPerformanceTable areas={[zeroBaseArea]} />)

      // Should display 0/0 0% for both columns
      const zeroCells = screen.getAllByText(/0\/0 0%/)
      expect(zeroCells.length).toBe(2) // Paid/Base and Distinguished columns
    })

    it('should display percentage over 100% when paidClubs > clubBase', () => {
      // mockArea1 has paidClubs: 11, clubBase: 10 = 110%
      render(<AreaPerformanceTable areas={[mockArea1]} />)

      expect(screen.getByText(/11\/10 110%/)).toBeInTheDocument()
    })

    it('should display percentage under 100% when paidClubs < clubBase', () => {
      // mockArea2 has paidClubs: 7, clubBase: 8 = 88% (rounded)
      render(<AreaPerformanceTable areas={[mockArea2]} />)

      expect(screen.getByText(/7\/8 88%/)).toBeInTheDocument()
    })
  })
})
