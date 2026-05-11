/**
 * DivisionAreaRecognitionPanel Component Tests
 *
 * Tests for the Division and Area Recognition Panel container component that combines
 * DivisionCriteriaExplanation, CriteriaExplanation, and AreaProgressSummary components
 * to display Distinguished Division Program (DDP) and Distinguished Area Program (DAP)
 * criteria and progress.
 *
 * Note: The standalone AreaProgressTable has been removed from this panel.
 * Recognition metrics are now displayed in the AreaPerformanceTable within
 * each Division card (see DivisionPerformanceCard).
 *
 * Requirements validated:
 * - 10.1: Rename AreaRecognitionPanel to DivisionAreaRecognitionPanel
 * - 10.2: Rename section header from "Area Recognition" to "Division and Area Recognition"
 * - 10.3: Include DivisionCriteriaExplanation component explaining DDP eligibility and recognition criteria
 * - 10.4: Include existing CriteriaExplanation component for DAP
 * - 1.1: Display Division and Area Recognition section alongside existing content
 * - 1.2: Position logically within existing tab layout
 * - 1.3: Maintain consistent styling with existing components
 *
 * Test categories:
 * 1. Rendering with valid division data
 * 2. Empty state when no divisions
 * 3. Loading state
 * 4. Data extraction (areas from divisions)
 * 5. DivisionCriteriaExplanation rendering
 */

import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import '@testing-library/jest-dom'
import { DivisionAreaRecognitionPanel } from '../DivisionAreaRecognitionPanel'
import { DivisionPerformance } from '../../utils/divisionStatus'
/**
 * Test data factory for creating division performance data
 */
const createDivision = (
  overrides: Partial<DivisionPerformance> = {}
): DivisionPerformance => ({
  divisionId: 'A',
  areas: [
    {
      areaId: 'A1',
      clubBase: 4,
      paidClubs: 3,
      distinguishedClubs: 2,
      netGrowth: 0,
      requiredDistinguishedClubs: 2,
      firstRoundVisits: {
        completed: 4,
        required: 3,
        percentage: 100,
        meetsThreshold: true,
      },
      secondRoundVisits: {
        completed: 2,
        required: 3,
        percentage: 50,
        meetsThreshold: false,
      },
      status: 'distinguished',
      isQualified: true,
    },
  ],
  clubBase: 4,
  paidClubs: 3,
  distinguishedClubs: 2,
  netGrowth: 0,
  requiredDistinguishedClubs: 2,
  status: 'distinguished',
  ...overrides,
})

/**
 * Create a division with multiple areas
 */
const createDivisionWithAreas = (
  divisionId: string,
  areaIds: string[]
): DivisionPerformance => ({
  divisionId,
  areas: areaIds.map(areaId => ({
    areaId,
    clubBase: 4,
    paidClubs: 3,
    distinguishedClubs: 2,
    netGrowth: 0,
    requiredDistinguishedClubs: 2,
    firstRoundVisits: {
      completed: 4,
      required: 3,
      percentage: 100,
      meetsThreshold: true,
    },
    secondRoundVisits: {
      completed: 2,
      required: 3,
      percentage: 50,
      meetsThreshold: false,
    },
    status: 'distinguished' as const,
    isQualified: true,
  })),
  clubBase: 4 * areaIds.length,
  paidClubs: 3 * areaIds.length,
  distinguishedClubs: 2 * areaIds.length,
  netGrowth: 0,
  requiredDistinguishedClubs: 2 * areaIds.length,
  status: 'distinguished',
})

describe('DivisionAreaRecognitionPanel', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  describe('Rendering with Valid Division Data', () => {
    /**
     * Validates: Requirement 10.2
     * THE System SHALL rename the section header from "Area Recognition" to "Division and Area Recognition"
     */
    it('should display section header with "Division and Area Recognition" title', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      expect(
        screen.getByText('Division and Area Recognition')
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 10.2, 10.7
     * Section should include description text mentioning both DDP and DAP
     */
    it('should display section description mentioning DDP and DAP', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      expect(
        screen.getByText(
          /Track progress toward Distinguished Division Program \(DDP\) and/i
        )
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 10.3
     * THE DivisionAreaRecognitionPanel SHALL include a DivisionCriteriaExplanation component
     */
    it('should render DivisionCriteriaExplanation component', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // DivisionCriteriaExplanation has a toggle button with this text
      expect(
        screen.getByRole('button', {
          name: /Distinguished Division Program Criteria/i,
        })
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 10.4
     * THE DivisionAreaRecognitionPanel SHALL include the existing CriteriaExplanation component for DAP
     */
    it('should render CriteriaExplanation component for DAP', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // CriteriaExplanation has a toggle button with this text
      expect(
        screen.getByRole('button', {
          name: /Distinguished Area Program Criteria/i,
        })
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 10.3, 10.4
     * DivisionCriteriaExplanation should appear before CriteriaExplanation
     */
    it('should render DivisionCriteriaExplanation before CriteriaExplanation', () => {
      const divisions = [createDivision()]

      const { container } = renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Get all buttons that are criteria explanation toggles
      const ddpButton = screen.getByRole('button', {
        name: /Distinguished Division Program Criteria/i,
      })
      const dapButton = screen.getByRole('button', {
        name: /Distinguished Area Program Criteria/i,
      })

      // Get their positions in the DOM
      const allButtons = container.querySelectorAll('button')
      const buttonArray = Array.from(allButtons)
      const ddpIndex = buttonArray.indexOf(ddpButton)
      const dapIndex = buttonArray.indexOf(dapButton)

      // DDP should appear before DAP
      expect(ddpIndex).toBeLessThan(dapIndex)
    })

    /**
     * Validates: Requirement 1.1
     * AreaProgressSummary component should be rendered
     */
    it('should render AreaProgressSummary component', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // AreaProgressSummary has a region with this aria-label
      expect(
        screen.getByRole('region', { name: /area progress summary/i })
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 1.3
     * Summary footer should show correct counts
     */
    it('should display summary footer with correct area count', () => {
      const divisions = [
        createDivisionWithAreas('A', ['A1', 'A2']),
        createDivisionWithAreas('B', ['B1']),
      ]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Should show "Showing 3 areas across 2 divisions" in footer
      expect(
        screen.getByText(/Showing 3 areas across 2 divisions/)
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 1.3
     * Summary footer should use singular form for single area
     */
    it('should display singular form for single area', () => {
      const divisions = [createDivisionWithAreas('A', ['A1'])]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Should show "Showing 1 area across 1 division" in footer
      expect(
        screen.getByText(/Showing 1 area across 1 division/)
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 10.1, 10.2
     * Section should have proper aria-label for accessibility referencing "Division and Area Recognition"
     */
    it('should have proper aria-label on section', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      const section = screen.getByRole('region', {
        name: /division and area recognition/i,
      })
      expect(section).toBeInTheDocument()
    })
  })

  describe('DivisionCriteriaExplanation Rendering', () => {
    /**
     * Validates: Requirement 10.3
     * THE DivisionAreaRecognitionPanel SHALL include a DivisionCriteriaExplanation component
     * explaining DDP eligibility and recognition criteria
     */
    it('should render DivisionCriteriaExplanation with DDP criteria toggle', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      const ddpButton = screen.getByRole('button', {
        name: /Distinguished Division Program Criteria/i,
      })
      expect(ddpButton).toBeInTheDocument()
      expect(ddpButton).toHaveAttribute('aria-expanded', 'false')
    })

    /**
     * Validates: Requirement 10.3
     * DivisionCriteriaExplanation should have proper aria-label
     */
    it('should render DivisionCriteriaExplanation with proper aria-label', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      expect(
        screen.getByLabelText(
          /Distinguished Division Program criteria explanation/i
        )
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 10.3
     * DivisionCriteriaExplanation should NOT be rendered in empty state
     */
    it('should not render DivisionCriteriaExplanation in empty state', () => {
      renderWithProviders(<DivisionAreaRecognitionPanel divisions={[]} />)

      expect(
        screen.queryByRole('button', {
          name: /Distinguished Division Program Criteria/i,
        })
      ).not.toBeInTheDocument()
    })

    /**
     * Validates: Requirement 10.3
     * DivisionCriteriaExplanation should NOT be rendered during loading
     */
    it('should not render DivisionCriteriaExplanation during loading', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} isLoading={true} />
      )

      expect(
        screen.queryByRole('button', {
          name: /Distinguished Division Program Criteria/i,
        })
      ).not.toBeInTheDocument()
    })
  })

  describe('Empty State When No Divisions', () => {
    /**
     * Tests empty state when divisions array is empty
     */
    it('should display empty state message when no divisions', () => {
      renderWithProviders(<DivisionAreaRecognitionPanel divisions={[]} />)

      expect(
        screen.getByText('No Division or Area Data Available')
      ).toBeInTheDocument()
    })

    /**
     * Tests empty state description text
     */
    it('should display empty state description', () => {
      renderWithProviders(<DivisionAreaRecognitionPanel divisions={[]} />)

      expect(
        screen.getByText(/Division and area performance data is not available/i)
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 10.2
     * Tests that section header is still displayed in empty state with updated title
     */
    it('should still display "Division and Area Recognition" header in empty state', () => {
      renderWithProviders(<DivisionAreaRecognitionPanel divisions={[]} />)

      expect(
        screen.getByText('Division and Area Recognition')
      ).toBeInTheDocument()
    })

    /**
     * Tests that CriteriaExplanation is NOT rendered in empty state
     */
    it('should not render CriteriaExplanation in empty state', () => {
      renderWithProviders(<DivisionAreaRecognitionPanel divisions={[]} />)

      expect(
        screen.queryByRole('button', {
          name: /Distinguished Area Program Criteria/i,
        })
      ).not.toBeInTheDocument()
    })

    /**
     * Tests that AreaProgressSummary is NOT rendered in empty state
     */
    it('should not render AreaProgressSummary in empty state', () => {
      renderWithProviders(<DivisionAreaRecognitionPanel divisions={[]} />)

      expect(
        screen.queryByRole('region', { name: /area progress summary/i })
      ).not.toBeInTheDocument()
    })

    /**
     * Tests empty state when divisions is undefined (defensive)
     */
    it('should handle undefined divisions gracefully', () => {
      // TypeScript would normally prevent this, but testing defensive behavior
      renderWithProviders(
        <DivisionAreaRecognitionPanel
          divisions={undefined as unknown as DivisionPerformance[]}
        />
      )

      expect(
        screen.getByText('No Division or Area Data Available')
      ).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    /**
     * Tests loading state display
     */
    it('should display loading skeletons when isLoading is true', () => {
      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={[]} isLoading={true} />
      )

      // LoadingSkeleton with variant="card" has role="status" and aria-label="Loading"
      const loadingElements = screen.getAllByRole('status')
      expect(loadingElements.length).toBeGreaterThan(0)
    })

    /**
     * Validates: Requirement 10.2
     * Tests aria-busy attribute during loading with updated aria-label
     */
    it('should set aria-busy attribute when loading', () => {
      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={[]} isLoading={true} />
      )

      const section = screen.getByLabelText('Division and Area Recognition')
      expect(section).toHaveAttribute('aria-busy', 'true')
    })

    /**
     * Tests that content is not rendered during loading
     */
    it('should not render CriteriaExplanation during loading', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} isLoading={true} />
      )

      expect(
        screen.queryByRole('button', {
          name: /Distinguished Area Program Criteria/i,
        })
      ).not.toBeInTheDocument()
    })

    /**
     * Tests that AreaProgressSummary is not rendered during loading
     */
    it('should not render AreaProgressSummary during loading', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} isLoading={true} />
      )

      expect(
        screen.queryByRole('region', { name: /area progress summary/i })
      ).not.toBeInTheDocument()
    })

    /**
     * Tests that empty state is not shown during loading
     */
    it('should not show empty state during loading', () => {
      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={[]} isLoading={true} />
      )

      expect(
        screen.queryByText('No Division or Area Data Available')
      ).not.toBeInTheDocument()
    })

    /**
     * Tests loading skeleton for table variant
     */
    it('should display table loading skeleton', () => {
      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={[]} isLoading={true} />
      )

      // LoadingSkeleton with variant="table" has aria-label="Loading table"
      expect(
        screen.getByRole('status', { name: /loading table/i })
      ).toBeInTheDocument()
    })
  })

  describe('Data Extraction', () => {
    /**
     * Tests that areas are correctly extracted from divisions
     */
    it('should extract all areas from all divisions', () => {
      const divisions = [
        createDivisionWithAreas('A', ['A1', 'A2']),
        createDivisionWithAreas('B', ['B1', 'B2', 'B3']),
      ]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // All 5 areas should be displayed in AreaProgressSummary
      expect(screen.getByText(/Area A1 \(Division A\)/)).toBeInTheDocument()
      expect(screen.getByText(/Area A2 \(Division A\)/)).toBeInTheDocument()
      expect(screen.getByText(/Area B1 \(Division B\)/)).toBeInTheDocument()
      expect(screen.getByText(/Area B2 \(Division B\)/)).toBeInTheDocument()
      expect(screen.getByText(/Area B3 \(Division B\)/)).toBeInTheDocument()
    })

    /**
     * Tests that division context is preserved for each area
     */
    it('should preserve division context for each area', () => {
      const divisions = [
        createDivisionWithAreas('A', ['A1']),
        createDivisionWithAreas('B', ['B1']),
      ]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Division context should be displayed in AreaProgressSummary
      expect(screen.getAllByText('Division A').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Division B').length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Tests handling of division with no areas
     */
    it('should handle division with no areas', () => {
      const divisions = [
        createDivision({ divisionId: 'A', areas: [] }),
        createDivisionWithAreas('B', ['B1']),
      ]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Only B1 should be displayed in AreaProgressSummary
      expect(screen.getByText(/Area B1 \(Division B\)/)).toBeInTheDocument()
      // Summary should show 1 area across 2 divisions
      expect(
        screen.getByText(/Showing 1 area across 2 divisions/)
      ).toBeInTheDocument()
    })

    /**
     * Tests that area metrics are passed correctly to AreaProgressSummary
     */
    it('should pass area metrics correctly to AreaProgressSummary', () => {
      const divisions = [
        {
          ...createDivision(),
          divisionId: 'A',
          areas: [
            {
              areaId: 'A1',
              clubBase: 5,
              paidClubs: 4,
              distinguishedClubs: 3,
              netGrowth: 0,
              requiredDistinguishedClubs: 2,
              firstRoundVisits: {
                completed: 5,
                required: 4,
                percentage: 100,
                meetsThreshold: true,
              },
              secondRoundVisits: {
                completed: 3,
                required: 4,
                percentage: 75,
                meetsThreshold: false,
              },
              status: 'select-distinguished' as const,
              isQualified: true,
            },
          ],
        },
      ]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Verify metrics are displayed in AreaProgressSummary
      // Progress text should include metrics like "4 of 5 clubs paid" (both division and area narratives)
      const paidClubsTexts = screen.getAllByText(/4 of 5 clubs paid/)
      expect(paidClubsTexts.length).toBeGreaterThanOrEqual(1)
      const distinguishedTexts = screen.getAllByText(/3 of 5 distinguished/)
      expect(distinguishedTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Accessibility', () => {
    /**
     * Tests that section has proper role attribute
     */
    it('should have role="region" on main section', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      const section = screen.getByRole('region', {
        name: /division and area recognition/i,
      })
      expect(section).toBeInTheDocument()
    })

    /**
     * Tests that decorative icon is hidden from screen readers
     */
    it('should hide decorative star icon from screen readers', () => {
      const divisions = [createDivision()]

      const { container } = renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      const decorativeIcons = container.querySelectorAll(
        'svg[aria-hidden="true"]'
      )
      expect(decorativeIcons.length).toBeGreaterThan(0)
    })

    /**
     * Tests that section uses semantic HTML
     */
    it('should use semantic section element', () => {
      const divisions = [createDivision()]

      const { container } = renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      const sections = container.querySelectorAll('section')
      expect(sections.length).toBeGreaterThan(0)
    })
  })

  describe('AreaProgressSummary Integration', () => {
    /**
     * Validates: Requirement 10.4
     * AreaProgressSummary component should be rendered
     */
    it('should render AreaProgressSummary component', () => {
      const divisions = [createDivision()]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // AreaProgressSummary has a region with this aria-label
      expect(
        screen.getByRole('region', { name: /area progress summary/i })
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 5.1
     * THE System SHALL display all areas in the district with their current progress as concise English paragraphs
     */
    it('should display progress paragraphs for each area', () => {
      const divisions = [
        createDivisionWithAreas('A', ['A1', 'A2']),
        createDivisionWithAreas('B', ['B1']),
      ]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Progress paragraphs should contain area labels with division context
      expect(screen.getByText(/Area A1 \(Division A\)/)).toBeInTheDocument()
      expect(screen.getByText(/Area A2 \(Division A\)/)).toBeInTheDocument()
      expect(screen.getByText(/Area B1 \(Division B\)/)).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 5.1
     * Progress paragraphs should include metrics (paid clubs, distinguished clubs)
     */
    it('should display progress paragraphs with metrics', () => {
      const divisions = [
        {
          ...createDivision(),
          divisionId: 'A',
          areas: [
            {
              areaId: 'A1',
              clubBase: 4,
              paidClubs: 4,
              distinguishedClubs: 2,
              netGrowth: 0,
              requiredDistinguishedClubs: 2,
              firstRoundVisits: {
                completed: 4,
                required: 3,
                percentage: 100,
                meetsThreshold: true,
              },
              secondRoundVisits: {
                completed: 2,
                required: 3,
                percentage: 50,
                meetsThreshold: false,
              },
              status: 'distinguished' as const,
              isQualified: true,
            },
          ],
        },
      ]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Progress text should include metrics (both division and area narratives)
      const paidClubsTexts = screen.getAllByText(/4 of 4 clubs paid/)
      expect(paidClubsTexts.length).toBeGreaterThanOrEqual(1)
      const distinguishedTexts = screen.getAllByText(/2 of 4 distinguished/)
      expect(distinguishedTexts.length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Validates: Requirement 1.1
     * Area count should be shown in both AreaProgressSummary header and panel footer
     */
    it('should display area count in AreaProgressSummary header', () => {
      const divisions = [
        createDivisionWithAreas('A', ['A1', 'A2']),
        createDivisionWithAreas('B', ['B1']),
      ]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // AreaProgressSummary header shows "X areas in Y divisions"
      expect(screen.getByText('3 areas in 2 divisions')).toBeInTheDocument()
      // Panel footer shows "Showing X areas across Y divisions"
      expect(
        screen.getByText(/Showing 3 areas across 2 divisions/)
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 5.5
     * Progress descriptions should be grouped by division for context
     */
    it('should group progress paragraphs by division', () => {
      const divisions = [
        createDivisionWithAreas('A', ['A1', 'A2']),
        createDivisionWithAreas('B', ['B1']),
      ]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Division headers should be present in AreaProgressSummary
      const divisionAHeaders = screen.getAllByText('Division A')
      const divisionBHeaders = screen.getAllByText('Division B')

      // Should have at least 1 occurrence in AreaProgressSummary
      expect(divisionAHeaders.length).toBeGreaterThanOrEqual(1)
      expect(divisionBHeaders.length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Validates: Requirement 5.6
     * Progress paragraphs should indicate recognition level achieved
     */
    it('should display recognition badges in AreaProgressSummary', () => {
      const divisions = [
        {
          ...createDivision(),
          divisionId: 'A',
          areas: [
            // Distinguished area
            {
              areaId: 'A1',
              clubBase: 4,
              paidClubs: 4,
              distinguishedClubs: 2,
              netGrowth: 0,
              requiredDistinguishedClubs: 2,
              firstRoundVisits: {
                completed: 4,
                required: 3,
                percentage: 100,
                meetsThreshold: true,
              },
              secondRoundVisits: {
                completed: 2,
                required: 3,
                percentage: 50,
                meetsThreshold: false,
              },
              status: 'distinguished' as const,
              isQualified: true,
            },
          ],
        },
      ]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Recognition badges should be present with aria-label (both division and area badges)
      const badges = screen.getAllByLabelText(/recognition status/i)
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Edge Cases', () => {
    /**
     * Tests handling of many divisions
     */
    it('should handle many divisions correctly', () => {
      const divisions = Array.from({ length: 10 }, (_, i) =>
        createDivisionWithAreas(String.fromCharCode(65 + i), [
          `${String.fromCharCode(65 + i)}1`,
        ])
      )

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Should show "Showing 10 areas across 10 divisions" in footer
      expect(
        screen.getByText(/Showing 10 areas across 10 divisions/)
      ).toBeInTheDocument()
    })

    /**
     * Tests handling of division with many areas
     */
    it('should handle division with many areas', () => {
      const areaIds = Array.from({ length: 20 }, (_, i) => `A${i + 1}`)
      const divisions = [createDivisionWithAreas('A', areaIds)]

      renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={divisions} />
      )

      // Should show "Showing 20 areas across 1 division" in footer
      expect(
        screen.getByText(/Showing 20 areas across 1 division/)
      ).toBeInTheDocument()
    })

    /**
     * Tests that component re-renders correctly when divisions change
     */
    it('should update when divisions prop changes', () => {
      const initialDivisions = [createDivisionWithAreas('A', ['A1'])]

      const { rerender } = renderWithProviders(
        <DivisionAreaRecognitionPanel divisions={initialDivisions} />
      )

      expect(
        screen.getByText(/Showing 1 area across 1 division/)
      ).toBeInTheDocument()

      // Update divisions
      const updatedDivisions = [
        createDivisionWithAreas('A', ['A1', 'A2']),
        createDivisionWithAreas('B', ['B1']),
      ]

      rerender(<DivisionAreaRecognitionPanel divisions={updatedDivisions} />)

      expect(
        screen.getByText(/Showing 3 areas across 2 divisions/)
      ).toBeInTheDocument()
    })
  })
})
