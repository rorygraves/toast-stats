/**
 * DivisionAreaProgressSummary Component Tests
 *
 * Tests for the Division Area Progress Summary component that displays all areas
 * with concise English paragraphs describing their progress toward
 * Distinguished Area recognition.
 *
 * Requirements validated:
 * - 5.1: Display all areas in the district with their current progress as concise English paragraphs
 * - 7.4: Semantic HTML with appropriate ARIA labels
 *
 * Test categories:
 * 1. All areas displayed with paragraphs
 * 2. Division grouping
 * 3. Empty state
 * 4. Loading state
 * 5. Accessibility attributes
 * 6. Recognition badges
 * 7. Area count display
 */

import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import '@testing-library/jest-dom'
import { DivisionAreaProgressSummary } from '../DivisionAreaProgressSummary'
import type {
  DivisionPerformance,
  AreaPerformance,
} from '../../utils/divisionStatus'
import { deriveAreaRecognitionState } from '../../utils/areaRecognitionState'
/**
 * Test data factory for creating area data
 */
const createArea = (
  overrides: Partial<AreaPerformance> = {}
): AreaPerformance => {
  const base: Omit<AreaPerformance, 'recognitionState'> = {
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
    status: 'distinguished',
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
      // Mid-year snapshot: R1 deadline already passed, R2 still pending.
      snapshotDate: '2026-03-15',
    }),
    ...overrides,
  }
}

/**
 * Helper to group flat area data into DivisionPerformance[] format.
 * Each area must include a divisionId field for grouping.
 * Division-level metrics are aggregated from the contained areas.
 */
function buildDivisions(
  areas: (AreaPerformance & { divisionId: string })[]
): DivisionPerformance[] {
  const grouped = new Map<string, AreaPerformance[]>()
  for (const { divisionId, ...area } of areas) {
    const existing = grouped.get(divisionId) ?? []
    existing.push(area)
    grouped.set(divisionId, existing)
  }

  return Array.from(grouped.entries()).map(([divisionId, divAreas]) => {
    const clubBase = divAreas.reduce((sum, a) => sum + a.clubBase, 0)
    const paidClubs = divAreas.reduce((sum, a) => sum + a.paidClubs, 0)
    const distinguishedClubs = divAreas.reduce(
      (sum, a) => sum + a.distinguishedClubs,
      0
    )
    const netGrowth = paidClubs - clubBase
    const requiredDistinguishedClubs = Math.ceil(clubBase * 0.5)

    // Compute division status using same logic as calculateDivisionStatus
    let status: DivisionPerformance['status'] = 'not-distinguished'
    if (
      distinguishedClubs >= requiredDistinguishedClubs + 1 &&
      netGrowth >= 1
    ) {
      status = 'presidents-distinguished'
    } else if (
      distinguishedClubs >= requiredDistinguishedClubs + 1 &&
      paidClubs >= clubBase
    ) {
      status = 'select-distinguished'
    } else if (
      distinguishedClubs >= requiredDistinguishedClubs &&
      paidClubs >= clubBase
    ) {
      status = 'distinguished'
    }

    return {
      divisionId,
      status,
      clubBase,
      paidClubs,
      netGrowth,
      distinguishedClubs,
      requiredDistinguishedClubs,
      areas: divAreas,
    }
  })
}

describe('AreaProgressSummary', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  describe('All Areas Displayed with Paragraphs', () => {
    /**
     * Validates: Requirement 5.1
     * THE System SHALL display all areas in the district with their current progress
     * as concise English paragraphs
     */
    it('should display all areas from all divisions exactly once', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'A2' }), divisionId: 'A' },
        { ...createArea({ areaId: 'B1' }), divisionId: 'B' },
        { ...createArea({ areaId: 'C1' }), divisionId: 'C' },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Each area should appear exactly once as a heading
      expect(screen.getByText('Area A1')).toBeInTheDocument()
      expect(screen.getByText('Area A2')).toBeInTheDocument()
      expect(screen.getByText('Area B1')).toBeInTheDocument()
      expect(screen.getByText('Area C1')).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 5.1
     * Each area should have a progress paragraph
     */
    it('should display progress paragraph for each area', () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 2,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Should contain progress text with metrics (both division and area narratives)
      const paidClubsTexts = screen.getAllByText(/4 of 4 clubs paid/)
      expect(paidClubsTexts.length).toBeGreaterThanOrEqual(1)
      const distinguishedTexts = screen.getAllByText(/2 of 4 distinguished/)
      expect(distinguishedTexts.length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Validates: Requirement 5.1
     * Single area should display correctly
     */
    it('should display single area correctly', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      expect(screen.getByText('Area A1')).toBeInTheDocument()
      expect(screen.getByText('1 area in 1 division')).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 5.1
     * Progress text should include area label with division context
     */
    it('should include area label with division context in progress text', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Progress text should mention "Area A1 (Division A)"
      expect(screen.getByText(/Area A1 \(Division A\)/)).toBeInTheDocument()
    })
  })

  describe('Division Grouping', () => {
    /**
     * Validates: Requirement 5.5
     * THE progress descriptions SHALL be grouped by division for context
     */
    it('should group areas by division', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'A2' }), divisionId: 'A' },
        { ...createArea({ areaId: 'B1' }), divisionId: 'B' },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Division headers should be present
      expect(screen.getByText('Division A')).toBeInTheDocument()
      expect(screen.getByText('Division B')).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 5.5
     * Areas should be sorted within divisions
     */
    it('should sort areas within each division', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A3' }), divisionId: 'A' },
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'A2' }), divisionId: 'A' },
      ])

      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} />
      )

      // Get all area headings within Division A section (excluding division narrative heading)
      const divisionASection = container.querySelector(
        '[aria-labelledby="division-A-heading"]'
      )
      expect(divisionASection).toBeInTheDocument()

      // Get area headings (h5 elements with id starting with "area-")
      const areaHeadings = divisionASection!.querySelectorAll('h5[id^="area-"]')
      const areaTexts = Array.from(areaHeadings).map(h => h.textContent)

      // Should be sorted: A1, A2, A3
      expect(areaTexts).toEqual(['Area A1', 'Area A2', 'Area A3'])
    })

    /**
     * Validates: Requirement 5.5
     * Divisions should be sorted alphabetically
     */
    it('should sort divisions alphabetically', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'C1' }), divisionId: 'C' },
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'B1' }), divisionId: 'B' },
      ])

      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} />
      )

      // Get all division headings
      const divisionHeadings = container.querySelectorAll('h4')
      const divisionTexts = Array.from(divisionHeadings).map(h => h.textContent)

      // Should be sorted: A, B, C
      expect(divisionTexts).toEqual(['Division A', 'Division B', 'Division C'])
    })

    /**
     * Validates: Requirement 5.5
     * Each division section should have proper aria-labelledby
     */
    it('should have proper aria-labelledby on division sections', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'B1' }), divisionId: 'B' },
      ])

      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} />
      )

      // Each division section should reference its heading
      const divisionASection = container.querySelector(
        '[aria-labelledby="division-A-heading"]'
      )
      const divisionBSection = container.querySelector(
        '[aria-labelledby="division-B-heading"]'
      )

      expect(divisionASection).toBeInTheDocument()
      expect(divisionBSection).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    /**
     * Tests empty state when no divisions provided
     */
    it('should display empty state message when no areas', () => {
      renderWithProviders(<DivisionAreaProgressSummary divisions={[]} />)

      expect(screen.getByText('No Division Data')).toBeInTheDocument()
    })

    /**
     * Tests empty state description text
     */
    it('should display empty state description', () => {
      renderWithProviders(<DivisionAreaProgressSummary divisions={[]} />)

      expect(
        screen.getByText(/No division performance data is available/i)
      ).toBeInTheDocument()
    })

    /**
     * Tests that section header is still displayed in empty state
     */
    it('should still display section header in empty state', () => {
      renderWithProviders(<DivisionAreaProgressSummary divisions={[]} />)

      expect(
        screen.getByText('Division and Area Progress Summary')
      ).toBeInTheDocument()
    })

    /**
     * Tests that division groups are not rendered in empty state
     */
    it('should not render division groups in empty state', () => {
      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={[]} />
      )

      // No division sections should be present
      const divisionSections = container.querySelectorAll(
        '[aria-labelledby^="division-"]'
      )
      expect(divisionSections.length).toBe(0)
    })

    /**
     * Tests empty state when divisions is undefined (defensive)
     */
    it('should handle undefined areas gracefully', () => {
      // TypeScript would normally prevent this, but testing defensive behavior
      renderWithProviders(
        <DivisionAreaProgressSummary
          divisions={undefined as unknown as DivisionPerformance[]}
        />
      )

      expect(screen.getByText('No Division Data')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    /**
     * Tests loading state display
     */
    it('should display loading skeleton when isLoading is true', () => {
      renderWithProviders(
        <DivisionAreaProgressSummary divisions={[]} isLoading={true} />
      )

      // Loading state should have role="status" and aria-label
      expect(
        screen.getByRole('status', {
          name: /loading division and area progress summaries/i,
        })
      ).toBeInTheDocument()
    })

    /**
     * Tests aria-busy attribute during loading
     */
    it('should set aria-busy attribute when loading', () => {
      renderWithProviders(
        <DivisionAreaProgressSummary divisions={[]} isLoading={true} />
      )

      const loadingContainer = screen.getByRole('status', {
        name: /loading division and area progress summaries/i,
      })
      expect(loadingContainer).toHaveAttribute('aria-busy', 'true')
    })

    /**
     * Tests that content is not rendered during loading
     */
    it('should not render area content during loading', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
      ])

      renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} isLoading={true} />
      )

      // Area content should not be visible
      expect(screen.queryByText('Area A1')).not.toBeInTheDocument()
    })

    /**
     * Tests that empty state is not shown during loading
     */
    it('should not show empty state during loading', () => {
      renderWithProviders(
        <DivisionAreaProgressSummary divisions={[]} isLoading={true} />
      )

      expect(screen.queryByText('No Division Data')).not.toBeInTheDocument()
    })

    /**
     * Tests loading skeleton has screen reader text
     */
    it('should have screen reader text during loading', () => {
      renderWithProviders(
        <DivisionAreaProgressSummary divisions={[]} isLoading={true} />
      )

      expect(
        screen.getByText('Loading division and area progress summaries...')
      ).toBeInTheDocument()
    })
  })

  describe('Accessibility Attributes', () => {
    /**
     * Validates: Requirement 7.4
     * THE Criteria_Display SHALL use semantic HTML with appropriate ARIA labels
     */
    it('should have proper role="region" on main section', () => {
      const divisions = buildDivisions([{ ...createArea(), divisionId: 'A' }])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      const section = screen.getByRole('region', {
        name: /division and area progress summary/i,
      })
      expect(section).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 7.4
     * Each area should be an article element
     */
    it('should use article elements for each area', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'A2' }), divisionId: 'A' },
      ])

      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} />
      )

      // Articles include: 1 division narrative + 2 area narratives = 3 total
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(3)
    })

    /**
     * Validates: Requirement 7.4
     * Each area article should have aria-labelledby
     */
    it('should have aria-labelledby on area articles', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
      ])

      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} />
      )

      // Get the area article (not the division narrative article)
      const areaArticle = container.querySelector(
        'article[aria-labelledby="area-A-A1-heading"]'
      )
      expect(areaArticle).toBeInTheDocument()
      expect(areaArticle).toHaveAttribute(
        'aria-labelledby',
        'area-A-A1-heading'
      )
    })

    /**
     * Validates: Requirement 7.4
     * Recognition badges should have aria-label
     */
    it('should have aria-label on recognition badges', () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 2,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Both division and area badges should have aria-label describing the recognition status
      const badges = screen.getAllByLabelText(/recognition status/i)
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Validates: Requirement 7.4
     * Section should use semantic header element
     */
    it('should use semantic header element', () => {
      const divisions = buildDivisions([{ ...createArea(), divisionId: 'A' }])

      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} />
      )

      const header = container.querySelector('header')
      expect(header).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 7.4
     * Section should use semantic footer element
     */
    it('should use semantic footer element', () => {
      const divisions = buildDivisions([{ ...createArea(), divisionId: 'A' }])

      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} />
      )

      const footer = container.querySelector('footer')
      expect(footer).toBeInTheDocument()
    })
  })

  describe('Recognition Badges', () => {
    /**
     * Tests badge styling for President's Distinguished
     */
    it("should display President's Distinguished badge with correct styling", () => {
      const completeVisits = {
        firstRoundVisits: {
          completed: 4,
          required: 3,
          percentage: 100,
          meetsThreshold: true,
        },
        secondRoundVisits: {
          completed: 4,
          required: 3,
          percentage: 100,
          meetsThreshold: true,
        },
      }
      const divisions = buildDivisions([
        // President's Distinguished: clubBase+1 paid AND 50%+1 distinguished
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 5,
            distinguishedClubs: 3,
            ...completeVisits,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      expect(screen.getByText("President's Distinguished")).toBeInTheDocument()
    })

    /**
     * Tests badge styling for Select Distinguished
     */
    it('should display Select Distinguished badge', () => {
      const completeVisits = {
        firstRoundVisits: {
          completed: 4,
          required: 3,
          percentage: 100,
          meetsThreshold: true,
        },
        secondRoundVisits: {
          completed: 4,
          required: 3,
          percentage: 100,
          meetsThreshold: true,
        },
      }
      const divisions = buildDivisions([
        // Select Distinguished: clubBase paid AND 50%+1 distinguished
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 3,
            ...completeVisits,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      expect(screen.getByText('Select Distinguished')).toBeInTheDocument()
    })

    /**
     * Tests badge styling for Distinguished
     */
    it('should display Distinguished badge', () => {
      const divisions = buildDivisions([
        // Distinguished: clubBase paid AND 50% distinguished
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 2,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Use getAllByText since "Distinguished" may appear in multiple places
      const badges = screen.getAllByText('Distinguished')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Tests badge styling for Not Distinguished
     */
    it('should display Not Distinguished badge', () => {
      const divisions = buildDivisions([
        // Not Distinguished: below 50% distinguished
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 1,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Both division and area may show Not Distinguished badge
      const badges = screen.getAllByText('Not Distinguished')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Tests badge styling for Net Loss
     */
    it('should display Net Loss badge when paidClubs < clubBase', () => {
      const divisions = buildDivisions([
        // Net Loss: paidClubs < clubBase
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 3,
            distinguishedClubs: 2,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Both division and area may show Net Loss badge
      const badges = screen.getAllByText('Net Loss')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Area Count Display', () => {
    /**
     * Tests header shows correct area count
     */
    it('should display correct area count in header', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'A2' }), divisionId: 'A' },
        { ...createArea({ areaId: 'B1' }), divisionId: 'B' },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      expect(screen.getByText('3 areas in 2 divisions')).toBeInTheDocument()
    })

    /**
     * Tests singular form for single area
     */
    it('should use singular form for single area', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      expect(screen.getByText('1 area in 1 division')).toBeInTheDocument()
    })

    /**
     * Tests plural form for multiple areas
     */
    it('should use plural form for multiple areas', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'A2' }), divisionId: 'A' },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      expect(screen.getByText('2 areas in 1 division')).toBeInTheDocument()
    })

    /**
     * Tests plural form for multiple divisions
     */
    it('should use plural form for multiple divisions', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'B1' }), divisionId: 'B' },
        { ...createArea({ areaId: 'C1' }), divisionId: 'C' },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      expect(screen.getByText('3 areas in 3 divisions')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    /**
     * Tests area with zero clubs (clubBase = 0)
     */
    it('should handle area with zero clubs', () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 0,
            paidClubs: 0,
            distinguishedClubs: 0,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Should render without crashing
      expect(screen.getByText('Area A1')).toBeInTheDocument()
    })

    /**
     * Tests area with 1 club (minimum case)
     */
    it('should handle area with single club', () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 1,
            paidClubs: 1,
            distinguishedClubs: 1,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Should render and show metrics (both division and area narratives)
      const paidClubsTexts = screen.getAllByText(/1 of 1 clubs paid/)
      expect(paidClubsTexts.length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Tests multiple areas with different recognition levels
     */
    it('should display multiple areas with different recognition levels', () => {
      const completeVisits = {
        firstRoundVisits: {
          completed: 4,
          required: 3,
          percentage: 100,
          meetsThreshold: true,
        },
        secondRoundVisits: {
          completed: 4,
          required: 3,
          percentage: 100,
          meetsThreshold: true,
        },
      }
      const divisions = buildDivisions([
        // President's Distinguished
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 5,
            distinguishedClubs: 3,
            ...completeVisits,
          }),
          divisionId: 'A',
        },
        // Select Distinguished
        {
          ...createArea({
            areaId: 'A2',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 3,
            ...completeVisits,
          }),
          divisionId: 'A',
        },
        // Distinguished
        {
          ...createArea({
            areaId: 'B1',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 2,
            ...completeVisits,
          }),
          divisionId: 'B',
        },
        // Not Distinguished
        {
          ...createArea({
            areaId: 'B2',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 1,
          }),
          divisionId: 'B',
        },
        // Net Loss
        {
          ...createArea({
            areaId: 'C1',
            clubBase: 4,
            paidClubs: 3,
            distinguishedClubs: 2,
          }),
          divisionId: 'C',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Use getAllByText since division and area badges may both show these statuses
      const presidentsDistinguishedBadges = screen.getAllByText(
        "President's Distinguished"
      )
      expect(presidentsDistinguishedBadges.length).toBeGreaterThanOrEqual(1)
      const selectDistinguishedBadges = screen.getAllByText(
        'Select Distinguished'
      )
      expect(selectDistinguishedBadges.length).toBeGreaterThanOrEqual(1)
      const distinguishedBadges = screen.getAllByText('Distinguished')
      expect(distinguishedBadges.length).toBeGreaterThanOrEqual(1)
      const notDistinguishedBadges = screen.getAllByText('Not Distinguished')
      expect(notDistinguishedBadges.length).toBeGreaterThanOrEqual(1)
      const netLossBadges = screen.getAllByText('Net Loss')
      expect(netLossBadges.length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Tests that component re-renders correctly when divisions change
     */
    it('should update when areas prop changes', () => {
      const initialDivisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
      ])

      const { rerender } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={initialDivisions} />
      )

      expect(screen.getByText('1 area in 1 division')).toBeInTheDocument()

      // Update divisions
      const updatedDivisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'A2' }), divisionId: 'A' },
        { ...createArea({ areaId: 'B1' }), divisionId: 'B' },
      ])

      rerender(<DivisionAreaProgressSummary divisions={updatedDivisions} />)

      expect(screen.getByText('3 areas in 2 divisions')).toBeInTheDocument()
    })
  })

  describe('Progress Text Content', () => {
    /**
     * Tests that progress text mentions club visit status with actual data
     */
    it('should include actual club visit status in progress text', () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            firstRoundVisits: {
              completed: 3,
              required: 3,
              percentage: 75,
              meetsThreshold: true,
            },
            secondRoundVisits: {
              completed: 2,
              required: 3,
              percentage: 50,
              meetsThreshold: false,
            },
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Club visit status should show progress toward 75% threshold
      expect(screen.getByText(/Club visits:/)).toBeInTheDocument()
      expect(screen.getByText(/75%/)).toBeInTheDocument()
    })

    /**
     * Tests that both rounds meeting threshold shows appropriate message
     */
    it('should show both rounds meet threshold when 75% is achieved', () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 5,
            distinguishedClubs: 3,
            firstRoundVisits: {
              completed: 3,
              required: 3,
              percentage: 75,
              meetsThreshold: true,
            },
            secondRoundVisits: {
              completed: 3,
              required: 3,
              percentage: 75,
              meetsThreshold: true,
            },
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Should show both rounds meet 75% threshold for President's Distinguished
      expect(
        screen.getByText(/club visits meeting 75% threshold/)
      ).toBeInTheDocument()
    })

    /**
     * Tests progress text for area with net club loss
     */
    it('should describe eligibility requirement for net club loss', () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 3,
            distinguishedClubs: 2,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Should mention net club loss and eligibility (both division and area narratives)
      const netLossTexts = screen.getAllByText(/has a net club loss/)
      expect(netLossTexts.length).toBeGreaterThanOrEqual(1)
      const eligibilityTexts = screen.getAllByText(/To become eligible/)
      expect(eligibilityTexts.length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Tests progress text for achieved President's Distinguished
     */
    it("should describe President's Distinguished achievement", () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 5,
            distinguishedClubs: 3,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Should mention achievement (area narrative)
      const achievementTexts = screen.getAllByText(
        /has achieved President's Distinguished status/
      )
      expect(achievementTexts.length).toBeGreaterThanOrEqual(1)
    })

    /**
     * Tests progress text includes incremental gaps
     */
    it('should describe incremental gaps for not distinguished area', () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 1,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Should mention gaps to each level (both division and area narratives may contain these)
      const notDistinguishedTexts = screen.getAllByText(
        /is not yet distinguished/
      )
      expect(notDistinguishedTexts.length).toBeGreaterThanOrEqual(1)
      const forDistinguishedTexts = screen.getAllByText(/For Distinguished/)
      expect(forDistinguishedTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Division Progress Narratives', () => {
    /**
     * Validates: Requirements 10.5, 11.2
     * THE System SHALL augment the existing AreaProgressSummary to include division progress narratives
     * FOR EACH division, THE System SHALL first display the division's progress narrative
     */
    it('should display division progress narrative for each division', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'B1' }), divisionId: 'B' },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Each division should have a progress narrative heading
      expect(screen.getByText('Division A Progress')).toBeInTheDocument()
      expect(screen.getByText('Division B Progress')).toBeInTheDocument()
    })

    /**
     * Validates: Requirements 10.6, 11.2, 11.3
     * THE division progress narratives SHALL appear before the area progress narratives
     * FOR EACH division, THE System SHALL first display the division's progress narrative
     * FOR EACH division, THE System SHALL then display the area progress narratives
     */
    it('should display division narrative before area narratives within each division', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'A2' }), divisionId: 'A' },
      ])

      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} />
      )

      // Get the Division A section
      const divisionASection = container.querySelector(
        '[aria-labelledby="division-A-heading"]'
      )
      expect(divisionASection).toBeInTheDocument()

      // Get all articles within the division section
      const articles = divisionASection!.querySelectorAll('article')

      // First article should be the division narrative (has division-A-narrative-heading)
      expect(articles[0]).toHaveAttribute(
        'aria-labelledby',
        'division-A-narrative-heading'
      )

      // Subsequent articles should be area narratives
      expect(articles[1]).toHaveAttribute(
        'aria-labelledby',
        'area-A-A1-heading'
      )
      expect(articles[2]).toHaveAttribute(
        'aria-labelledby',
        'area-A-A2-heading'
      )
    })

    /**
     * Validates: Requirement 11.4
     * THE division narratives SHALL use the same paragraph-based format as area narratives
     */
    it('should use paragraph-based format for division narratives', () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 2,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Division narrative should contain progress text with metrics
      // Division A has 4 clubs paid, 2 distinguished (same as the single area)
      expect(
        screen.getByText(/Division A has achieved Distinguished status/)
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 11.5
     * THE division narratives SHALL be visually distinguished from area narratives
     */
    it('should visually distinguish division narratives from area narratives', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
      ])

      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} />
      )

      // Division narrative article should have distinct styling
      const divisionNarrativeArticle = container.querySelector(
        'article[aria-labelledby="division-A-narrative-heading"]'
      )
      expect(divisionNarrativeArticle).toBeInTheDocument()

      // Division narrative should have tm-loyal-blue background styling
      expect(divisionNarrativeArticle).toHaveClass('bg-tm-loyal-blue/10')
      expect(divisionNarrativeArticle).toHaveClass('border-2')
      expect(divisionNarrativeArticle).toHaveClass('border-tm-loyal-blue/30')

      // Area narrative article should have different styling
      const areaArticle = container.querySelector(
        'article[aria-labelledby="area-A-A1-heading"]'
      )
      expect(areaArticle).toBeInTheDocument()
      expect(areaArticle).toHaveClass('bg-gray-50')
      expect(areaArticle).toHaveClass('border-gray-200')
    })

    /**
     * Validates: Requirement 11.5
     * Division narrative heading should be bold and use brand color
     */
    it('should have bold heading with brand color for division narratives', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
      ])

      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} />
      )

      // Division narrative heading should be bold and use tm-loyal-blue
      const divisionNarrativeHeading = container.querySelector(
        '#division-A-narrative-heading'
      )
      expect(divisionNarrativeHeading).toBeInTheDocument()
      expect(divisionNarrativeHeading).toHaveClass('font-bold')
      expect(divisionNarrativeHeading).toHaveClass('text-tm-loyal-blue')
    })

    /**
     * Validates: Requirements 10.5, 11.1
     * Division narratives should include recognition badge
     */
    it('should display recognition badge for division narratives', () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 2,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Division narrative should have a recognition badge with aria-label
      const divisionBadge = screen.getByLabelText(
        /Division recognition status/i
      )
      expect(divisionBadge).toBeInTheDocument()
    })

    /**
     * Validates: Requirements 10.5, 11.2
     * Division narrative should show division-level metrics (aggregated from areas)
     */
    it('should show division-level metrics in division narrative', () => {
      const divisions = buildDivisions([
        {
          ...createArea({
            areaId: 'A1',
            clubBase: 4,
            paidClubs: 4,
            distinguishedClubs: 2,
          }),
          divisionId: 'A',
        },
        {
          ...createArea({
            areaId: 'A2',
            clubBase: 6,
            paidClubs: 6,
            distinguishedClubs: 3,
          }),
          divisionId: 'A',
        },
      ])

      renderWithProviders(<DivisionAreaProgressSummary divisions={divisions} />)

      // Division A should show aggregated metrics: 10 clubs paid, 5 distinguished
      // (4+6 = 10 paid, 2+3 = 5 distinguished)
      expect(screen.getByText(/10 of 10 clubs paid/)).toBeInTheDocument()
      expect(screen.getByText(/5 of 10 distinguished/)).toBeInTheDocument()
    })

    /**
     * Validates: Requirements 10.6, 11.3
     * Each division should have its own division narrative followed by its areas
     */
    it('should group division narrative with its areas for multiple divisions', () => {
      const divisions = buildDivisions([
        { ...createArea({ areaId: 'A1' }), divisionId: 'A' },
        { ...createArea({ areaId: 'B1' }), divisionId: 'B' },
        { ...createArea({ areaId: 'B2' }), divisionId: 'B' },
      ])

      const { container } = renderWithProviders(
        <DivisionAreaProgressSummary divisions={divisions} />
      )

      // Division A section should have 1 division narrative + 1 area = 2 articles
      const divisionASection = container.querySelector(
        '[aria-labelledby="division-A-heading"]'
      )
      const divisionAArticles = divisionASection!.querySelectorAll('article')
      expect(divisionAArticles.length).toBe(2)

      // Division B section should have 1 division narrative + 2 areas = 3 articles
      const divisionBSection = container.querySelector(
        '[aria-labelledby="division-B-heading"]'
      )
      const divisionBArticles = divisionBSection!.querySelectorAll('article')
      expect(divisionBArticles.length).toBe(3)
    })
  })
})
