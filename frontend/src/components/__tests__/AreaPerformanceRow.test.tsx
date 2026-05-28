import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AreaPerformanceRow } from '../AreaPerformanceRow'
import { AreaPerformance } from '../../utils/divisionStatus'
import { deriveAreaRecognitionState } from '../../utils/areaRecognitionState'

describe('AreaPerformanceRow', () => {
  const createMockArea = (
    overrides: Partial<AreaPerformance> = {}
  ): AreaPerformance => {
    const base: Omit<AreaPerformance, 'recognitionState'> = {
      areaId: 'A1',
      status: 'distinguished',
      clubBase: 10,
      paidClubs: 10,
      netGrowth: 0,
      distinguishedClubs: 5,
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
      ...overrides,
    }
    return {
      ...base,
      recognitionState: deriveAreaRecognitionState({
        clubBase: base.clubBase,
        paidClubs: base.paidClubs,
        distinguishedClubs: base.distinguishedClubs,
        firstRoundVisitMet: base.firstRoundVisits.meetsThreshold,
        secondRoundVisitMet: base.secondRoundVisits.meetsThreshold,
        // Mid-PY snapshot — R1 deadline has passed, R2 has not. An R2-unmet
        // case yields Provisional (label still contains the tier name), so
        // pre-gate assertions like `toContain("President's Distinguished")`
        // remain valid. Visits-met cases are Confirmed regardless of date.
        snapshotDate: '2026-03-15',
      }),
      ...overrides,
    }
  }

  describe('Requirement 9.1: Column Order - Area Identifier Display', () => {
    it('should display the area identifier in the first column', () => {
      const area = createMockArea({ areaId: 'B3' })
      render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      expect(screen.getByText('B3')).toBeInTheDocument()
    })
  })

  describe('Requirement 9.2: Paid/Base Column with Percentage', () => {
    it('should display paid clubs vs club base with percentage', () => {
      const area = createMockArea({ paidClubs: 12, clubBase: 10 })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      // Cell 1 is Paid/Base column
      expect(cells[1].textContent).toBe('12/10 120%')
    })

    it('should display 100% when paid equals base', () => {
      const area = createMockArea({ paidClubs: 10, clubBase: 10 })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      expect(cells[1].textContent).toBe('10/10 100%')
    })

    it('should display percentage below 100% when paid is less than base', () => {
      const area = createMockArea({ paidClubs: 8, clubBase: 10 })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      expect(cells[1].textContent).toBe('8/10 80%')
    })
  })

  describe('Requirement 9.3: Distinguished Column with Percentage', () => {
    it('should display distinguished clubs vs club base with percentage', () => {
      const area = createMockArea({
        distinguishedClubs: 6,
        clubBase: 10,
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      // Cell 2 is Distinguished column
      expect(cells[2].textContent).toBe('6/10 60%')
    })

    it('should display 50% when distinguished is half of base', () => {
      const area = createMockArea({
        distinguishedClubs: 5,
        clubBase: 10,
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      expect(cells[2].textContent).toBe('5/10 50%')
    })
  })

  describe('First Round Visit Status', () => {
    it('should display first round visit status with checkmark when threshold met', () => {
      const area = createMockArea({
        firstRoundVisits: {
          completed: 8,
          required: 8,
          percentage: 80,
          meetsThreshold: true,
        },
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      // Cell 3 is First Round Visits column
      expect(cells[3].textContent).toBe('8/8 ✓')
    })

    it('should display first round visit status with X when threshold not met', () => {
      const area = createMockArea({
        firstRoundVisits: {
          completed: 5,
          required: 8,
          percentage: 62.5,
          meetsThreshold: false,
        },
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      expect(cells[3].textContent).toBe('5/8 ✗')
    })
  })

  describe('Second Round Visit Status', () => {
    it('should display second round visit status with checkmark when threshold met', () => {
      const area = createMockArea({
        secondRoundVisits: {
          completed: 9,
          required: 8,
          percentage: 90,
          meetsThreshold: true,
        },
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      // Cell 4 is Second Round Visits column
      expect(cells[4].textContent).toBe('9/8 ✓')
    })

    it('should display second round visit status with X when threshold not met', () => {
      const area = createMockArea({
        secondRoundVisits: {
          completed: 6,
          required: 8,
          percentage: 75,
          meetsThreshold: false,
        },
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      expect(cells[4].textContent).toBe('6/8 ✗')
    })
  })

  describe('Requirement 9.5: Recognition Badge Display', () => {
    it('should display "President\'s Distinguished" badge when criteria met', () => {
      // President's: paidClubs >= clubBase + 1 AND distinguishedClubs >= 50% + 1
      const area = createMockArea({
        clubBase: 10,
        paidClubs: 11,
        distinguishedClubs: 6, // 50% of 10 = 5, need 6 for President's
      })
      render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      expect(screen.getByText("President's Distinguished")).toBeInTheDocument()
    })

    it('should display "Select Distinguished" badge when criteria met', () => {
      // Select: paidClubs >= clubBase AND distinguishedClubs >= 50% + 1
      const area = createMockArea({
        clubBase: 10,
        paidClubs: 10,
        distinguishedClubs: 6, // 50% of 10 = 5, need 6 for Select
      })
      render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      expect(screen.getByText('Select Distinguished')).toBeInTheDocument()
    })

    it('should display "Distinguished" badge when criteria met', () => {
      // Distinguished: paidClubs >= clubBase AND distinguishedClubs >= 50%
      const area = createMockArea({
        clubBase: 10,
        paidClubs: 10,
        distinguishedClubs: 5, // 50% of 10 = 5
      })
      render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      expect(screen.getByText('Distinguished')).toBeInTheDocument()
    })

    it('should display "Not Distinguished" badge when criteria not met', () => {
      const area = createMockArea({
        clubBase: 10,
        paidClubs: 10,
        distinguishedClubs: 4, // Below 50% threshold
      })
      render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      expect(screen.getByText('Not Distinguished')).toBeInTheDocument()
    })

    it('should display "Net Loss" badge when paid clubs below club base', () => {
      const area = createMockArea({
        clubBase: 10,
        paidClubs: 8, // Below club base
        distinguishedClubs: 5,
      })
      render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      expect(screen.getByText('Net Loss')).toBeInTheDocument()
    })

    it('should have aria-label for recognition status', () => {
      const area = createMockArea({
        clubBase: 10,
        paidClubs: 10,
        distinguishedClubs: 5,
      })
      render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const badge = screen.getByLabelText('Recognition status: Distinguished')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Requirement 9.6: Gap Columns Display', () => {
    it('should display "-" for achieved levels', () => {
      // Area at Distinguished level
      const area = createMockArea({
        clubBase: 10,
        paidClubs: 10,
        distinguishedClubs: 5, // Meets Distinguished (50%)
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      // Cell 6 is Gap to D - should be "-" since Distinguished is achieved
      expect(cells[6].textContent).toBe('-')
    })

    it('should display gap count for unachieved levels', () => {
      // Area not at Distinguished level
      const area = createMockArea({
        clubBase: 10,
        paidClubs: 10,
        distinguishedClubs: 4, // Below 50% threshold (needs 5)
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      // Cell 6 is Gap to D - needs 1 more distinguished club
      expect(cells[6].textContent).toBe('+1')
    })

    it('should display "N/A" for levels not achievable due to net loss', () => {
      const area = createMockArea({
        clubBase: 10,
        paidClubs: 8, // Net loss - below club base
        distinguishedClubs: 5,
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      // All gap columns should show N/A since no net loss requirement not met
      expect(cells[6].textContent).toBe('N/A') // Gap to D
      expect(cells[7].textContent).toBe('N/A') // Gap to S
      expect(cells[8].textContent).toBe('N/A') // Gap to P
    })

    it('should show correct gaps for area needing clubs for each level', () => {
      // Area with 4 clubs, 4 paid, 1 distinguished
      const area = createMockArea({
        clubBase: 4,
        paidClubs: 4,
        distinguishedClubs: 1, // Needs 2 for D (50%), 3 for S (50%+1)
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      // Gap to D: needs 2 - 1 = 1 more
      expect(cells[6].textContent).toBe('+1')
      // Gap to S: needs 3 - 1 = 2 more
      expect(cells[7].textContent).toBe('+2')
      // Gap to P: needs 3 - 1 = 2 more distinguished, plus 1 paid
      expect(cells[8].textContent).toBe('+2')
    })
  })

  describe('Brand Styling', () => {
    it('should apply Toastmasters brand font classes', () => {
      const area = createMockArea()
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      // Check that font-tm-body class is applied
      const bodyElements = container.querySelectorAll('.font-tm-body')
      expect(bodyElements.length).toBeGreaterThan(0)
    })

    it("should apply brand-approved colors for President's Distinguished badge", () => {
      const area = createMockArea({
        clubBase: 10,
        paidClubs: 11,
        distinguishedClubs: 6,
      })
      render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const statusBadge = screen.getByText("President's Distinguished")
      expect(statusBadge.className).toMatch(/bg-tm-happy-yellow/)
    })

    it('should apply brand-approved colors for Distinguished badge', () => {
      const area = createMockArea({
        clubBase: 10,
        paidClubs: 10,
        distinguishedClubs: 5,
      })
      render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const statusBadge = screen.getByText('Distinguished')
      expect(statusBadge.className).toMatch(/bg-tm-true-maroon/)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero club base', () => {
      const area = createMockArea({
        clubBase: 0,
        paidClubs: 0,
        distinguishedClubs: 0,
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      // Paid/Base should show 0/0 0%
      expect(cells[1].textContent).toBe('0/0 0%')
      // Distinguished should show 0/0 0%
      expect(cells[2].textContent).toBe('0/0 0%')
    })

    it('should handle large numbers', () => {
      const area = createMockArea({
        paidClubs: 100,
        clubBase: 95,
        distinguishedClubs: 55,
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      expect(cells[1].textContent).toBe('100/95 105%')
      expect(cells[2].textContent).toBe('55/95 58%')
    })
  })

  describe('Row Structure', () => {
    it('should render exactly 9 table cells for all required columns', () => {
      const area = createMockArea()
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const row = container.querySelector('tr')
      const cells = row?.querySelectorAll('td')

      // Must have exactly 9 cells: Area, Paid/Base, Distinguished, First Round, Second Round, Recognition, Gap to D, Gap to S, Gap to P
      expect(cells?.length).toBe(9)
    })

    it('should render all data elements in correct cell positions', () => {
      const area = createMockArea({
        areaId: 'C5',
        paidClubs: 15,
        clubBase: 12,
        distinguishedClubs: 8,
        firstRoundVisits: {
          completed: 10,
          required: 10,
          percentage: 100,
          meetsThreshold: true,
        },
        secondRoundVisits: {
          completed: 9,
          required: 10,
          percentage: 90,
          meetsThreshold: false,
        },
      })
      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')

      // Cell 0: Area identifier
      expect(cells[0].textContent).toContain('C5')
      // Cell 1: Paid/Base with percentage
      expect(cells[1].textContent).toBe('15/12 125%')
      // Cell 2: Distinguished with percentage
      expect(cells[2].textContent).toBe('8/12 67%')
      // Cell 3: First round visits
      expect(cells[3].textContent).toBe('10/10 ✓')
      // Cell 4: Second round visits
      expect(cells[4].textContent).toBe('9/10 ✗')
      // Cell 5: Recognition badge (President's Distinguished: 15 >= 13, 8 >= 7)
      expect(cells[5].textContent).toContain("President's Distinguished")
      // Cell 6: Gap to D (achieved)
      expect(cells[6].textContent).toBe('-')
      // Cell 7: Gap to S (achieved)
      expect(cells[7].textContent).toBe('-')
      // Cell 8: Gap to P (achieved)
      expect(cells[8].textContent).toBe('-')
    })
  })

  describe('Data Integrity', () => {
    it('should display all input values in the rendered output', () => {
      const area = createMockArea({
        areaId: 'D7',
        status: 'not-qualified',
        clubBase: 8,
        paidClubs: 6,
        netGrowth: -2,
        distinguishedClubs: 2,
        requiredDistinguishedClubs: 4,
        firstRoundVisits: {
          completed: 5,
          required: 7,
          percentage: 71.4,
          meetsThreshold: false,
        },
        secondRoundVisits: {
          completed: 3,
          required: 7,
          percentage: 42.9,
          meetsThreshold: false,
        },
        isQualified: false,
      })

      const { container } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const text = container.textContent ?? ''

      // Verify key input values appear in the output
      expect(text).toContain('D7')
      expect(text).toContain('6/8') // Paid/Base
      expect(text).toContain('2/8') // Distinguished
      expect(text).toContain('5/7') // First round visits
      expect(text).toContain('3/7') // Second round visits
      expect(text).toContain('Net Loss') // Recognition badge for net loss
    })

    it('should produce consistent output for the same input data', () => {
      const area = createMockArea({
        areaId: 'E2',
        paidClubs: 11,
        clubBase: 10,
      })

      // Render twice with the same data
      const { container: container1 } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      const { container: container2 } = render(
        <table>
          <tbody>
            <AreaPerformanceRow area={area} />
          </tbody>
        </table>
      )

      // Both renders should produce identical output
      expect(container1.textContent).toBe(container2.textContent)
    })
  })
})
