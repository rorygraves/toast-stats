/**
 * DivisionCriteriaExplanation Component Tests
 *
 * Tests for the Distinguished Division Program criteria explanation component.
 * Validates content display, expand/collapse functionality, and accessibility.
 *
 * Requirements validated:
 * - 2.1: Show eligibility gate requirements prominently at the top
 * - 2.2: Explain that divisions must have no net club loss (paid clubs >= club base)
 * - 3.1: Show that paid clubs must be at least equal to club base (no net loss)
 * - 3.2: Explain what constitutes a "paid club" (Active status, dues current)
 * - 3.3: Explain what statuses disqualify a club from being "paid" (Suspended, Ineligible, Low)
 * - 4.1: Show Distinguished Division requires paidClubs >= clubBase AND distinguishedClubs >= 45% of clubBase
 * - 4.2: Show Select Distinguished requires paidClubs >= clubBase + 1 AND distinguishedClubs >= 50% of clubBase
 * - 4.3: Show President's Distinguished requires paidClubs >= clubBase + 2 AND distinguishedClubs >= 55% of clubBase
 * - 4.4: Indicate percentages are calculated against club base, not paid clubs
 * - 4.5: Present recognition levels in ascending order of achievement
 * - 7.4: Use semantic HTML with appropriate ARIA labels
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { ReactElement } from 'react'
import { DivisionCriteriaExplanation } from '../DivisionCriteriaExplanation'

// DivisionCriteriaExplanation is provider-free (useState only). Skipping
// the heavy renderWithProviders wrapper (QueryClient + memory router +
// performance wrapper) eliminates ~3 wrappers per test × 24 tests, which
// pushes this file from a Lesson 51 landmine under worker contention to
// a stable unit-test (#473).
const renderComponent = (ui: ReactElement) => render(ui)

describe('DivisionCriteriaExplanation', () => {
  afterEach(() => {
    cleanup()
  })

  describe('Criteria Content Display', () => {
    /**
     * Validates: Requirements 2.1, 2.2
     * THE Criteria_Display SHALL show the eligibility gate requirements prominently
     * THE Criteria_Display SHALL explain that divisions must have no net club loss
     */
    it('should display eligibility gate section with no net club loss requirement', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      // Check eligibility gate heading is present
      expect(screen.getByText('Eligibility Gate')).toBeInTheDocument()

      // Check no net club loss requirement is explained
      expect(screen.getByText('No Net Club Loss')).toBeInTheDocument()
      expect(
        screen.getByText(/paid clubs must be at least equal to the club base/i)
      ).toBeInTheDocument()
    })

    /**
     * Validates: DDP-specific requirement - no club visit requirements
     * Unlike DAP, DDP does NOT have club visit requirements
     */
    it('should display note about no club visit requirements (unlike DAP)', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      // Check that the note about no club visit requirements is present
      // The text is split across elements due to <strong> tag, so we use a function matcher
      expect(
        screen.getByText((content, element) => {
          const hasText =
            element?.textContent?.includes('have club visit requirements') ??
            false
          const isCorrectElement = element?.tagName.toLowerCase() === 'p'
          return hasText && isCorrectElement
        })
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 3.1
     * THE Criteria_Display SHALL show that paid clubs must be at least equal to club base (no net loss)
     */
    it('should display no net club loss requirement section', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      expect(
        screen.getByText('No Net Club Loss Requirement')
      ).toBeInTheDocument()
      expect(screen.getByText('≥ Base')).toBeInTheDocument()
      expect(
        screen.getByText(
          /Paid clubs.*must be at least equal to the.*club base/i
        )
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirements 3.2, 3.3
     * THE Criteria_Display SHALL explain what constitutes a "paid club"
     * THE Criteria_Display SHALL explain what statuses disqualify a club
     */
    it('should display what qualifies and disqualifies as paid club', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      // What qualifies
      expect(screen.getByText('Qualifies as Paid Club')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText(/Membership dues current/i)).toBeInTheDocument()

      // What disqualifies
      expect(screen.getByText('Does Not Qualify')).toBeInTheDocument()
      expect(screen.getByText('Suspended')).toBeInTheDocument()
      expect(screen.getByText('Ineligible')).toBeInTheDocument()
      expect(screen.getByText('Low')).toBeInTheDocument()
    })

    /**
     * Validates: Requirements 4.1, 4.2, 4.3, 4.5
     * THE Criteria_Display SHALL show all three recognition levels with correct thresholds
     * THE Criteria_Display SHALL present recognition levels in ascending order
     * DDP uses 45%/50%/55% thresholds (different from DAP's 50%/50%+1/50%+1)
     */
    it('should display all three recognition levels with correct DDP thresholds', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      expect(screen.getByText('Recognition Levels')).toBeInTheDocument()

      // Distinguished Division - ≥ Club Base paid, ≥ 45% of Club Base distinguished
      expect(screen.getByText('Distinguished Division')).toBeInTheDocument()
      expect(screen.getByText('≥ 45% of Club Base')).toBeInTheDocument()

      // Select Distinguished Division - ≥ Club Base + 1 paid, ≥ 50% of Club Base distinguished
      expect(
        screen.getByText('Select Distinguished Division')
      ).toBeInTheDocument()
      expect(screen.getByText('≥ 50% of Club Base')).toBeInTheDocument()

      // President's Distinguished Division - ≥ Club Base + 2 paid, ≥ 55% of Club Base distinguished
      expect(
        screen.getByText("President's Distinguished Division")
      ).toBeInTheDocument()
      expect(screen.getByText('≥ 55% of Club Base')).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 4.4
     * THE Criteria_Display SHALL indicate percentages are calculated against club base, not paid clubs
     */
    it('should display note about percentages calculated against club base', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      // Check for the important note about calculation basis
      expect(
        screen.getByText(
          /Distinguished club percentages are calculated against/i
        )
      ).toBeInTheDocument()
      // Verify the note mentions "not paid clubs" to confirm it's about club base
      expect(screen.getByText(/not paid clubs/i)).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 4.5
     * THE Criteria_Display SHALL present recognition levels in ascending order of achievement
     */
    it('should display recognition levels in ascending order', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      const table = screen.getByRole('table', {
        name: /Division recognition level requirements/i,
      })
      const rows = table.querySelectorAll('tbody tr')

      // Verify order: Distinguished, Select, President's
      expect(rows[0]).toHaveTextContent('Distinguished Division')
      expect(rows[0]).toHaveTextContent('≥ Club Base')
      expect(rows[0]).toHaveTextContent('≥ 45% of Club Base')

      expect(rows[1]).toHaveTextContent('Select Distinguished Division')
      expect(rows[1]).toHaveTextContent('≥ Club Base + 1')
      expect(rows[1]).toHaveTextContent('≥ 50% of Club Base')

      expect(rows[2]).toHaveTextContent("President's Distinguished Division")
      expect(rows[2]).toHaveTextContent('≥ Club Base + 2')
      expect(rows[2]).toHaveTextContent('≥ 55% of Club Base')
    })

    /**
     * Validates: Requirements 4.1, 4.2, 4.3
     * Verify the paid clubs column shows correct thresholds for each level
     * DDP requires base/base+1/base+2 (different from DAP's base/base/base+1)
     */
    it('should display correct paid clubs thresholds for each recognition level', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      const table = screen.getByRole('table', {
        name: /Division recognition level requirements/i,
      })
      expect(table).toBeInTheDocument()

      // Distinguished requires ≥ Club Base
      // Select requires ≥ Club Base + 1
      // President's requires ≥ Club Base + 2
      expect(screen.getByText('≥ Club Base')).toBeInTheDocument()
      expect(screen.getByText('≥ Club Base + 1')).toBeInTheDocument()
      expect(screen.getByText('≥ Club Base + 2')).toBeInTheDocument()
    })

    /**
     * Validates: Key differences from DAP section
     * THE Criteria_Display SHALL show key differences from DAP
     */
    it('should display key differences from DAP section', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      // Check for the key differences section
      expect(
        screen.getByText('Key Differences from Area Program (DAP)')
      ).toBeInTheDocument()

      // Check for specific differences mentioned
      expect(screen.getByText(/DDP uses 45%\/50%\/55%/i)).toBeInTheDocument()
      expect(
        screen.getByText(/DDP requires base\/base\+1\/base\+2/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/no club visit requirements/i)
      ).toBeInTheDocument()
    })
  })

  describe('Expand/Collapse Functionality', () => {
    /**
     * Tests that component starts collapsed by default
     */
    it('should start collapsed by default', () => {
      renderComponent(<DivisionCriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Division Program Criteria/i,
      })
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

      // Content should be hidden
      const content = document.getElementById('division-criteria-content')
      expect(content).toHaveAttribute('aria-hidden', 'true')
    })

    /**
     * Tests that component starts expanded when defaultExpanded={true}
     */
    it('should start expanded when defaultExpanded is true', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Division Program Criteria/i,
      })
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

      // Content should be visible
      const content = document.getElementById('division-criteria-content')
      expect(content).toHaveAttribute('aria-hidden', 'false')
    })

    /**
     * Tests that clicking toggle button expands/collapses content
     */
    it('should toggle content visibility when button is clicked', () => {
      renderComponent(<DivisionCriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Division Program Criteria/i,
      })
      const content = document.getElementById('division-criteria-content')

      // Initially collapsed
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
      expect(content).toHaveAttribute('aria-hidden', 'true')

      // Click to expand
      fireEvent.click(toggleButton)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      expect(content).toHaveAttribute('aria-hidden', 'false')

      // Click to collapse
      fireEvent.click(toggleButton)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
      expect(content).toHaveAttribute('aria-hidden', 'true')
    })

    /**
     * Tests that content visibility changes appropriately with expand/collapse
     */
    it('should change content visibility classes appropriately', () => {
      renderComponent(<DivisionCriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Division Program Criteria/i,
      })
      const content = document.getElementById('division-criteria-content')

      // Initially collapsed - should have max-h-0 and opacity-0
      expect(content).toHaveClass('max-h-0')
      expect(content).toHaveClass('opacity-0')

      // Click to expand
      fireEvent.click(toggleButton)

      // Expanded - should have max-h-[2000px] and opacity-100
      expect(content).toHaveClass('max-h-[2000px]')
      expect(content).toHaveClass('opacity-100')
    })
  })

  describe('Accessibility', () => {
    /**
     * Validates: Requirement 7.4
     * Toggle button has aria-expanded attribute
     */
    it('should have aria-expanded attribute on toggle button', () => {
      renderComponent(<DivisionCriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Division Program Criteria/i,
      })
      expect(toggleButton).toHaveAttribute('aria-expanded')
    })

    /**
     * Validates: Requirement 7.4
     * Toggle button has aria-controls attribute
     */
    it('should have aria-controls attribute on toggle button', () => {
      renderComponent(<DivisionCriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Division Program Criteria/i,
      })
      expect(toggleButton).toHaveAttribute(
        'aria-controls',
        'division-criteria-content'
      )
    })

    /**
     * Validates: Requirement 7.4
     * Content section has aria-hidden attribute
     */
    it('should have aria-hidden attribute on content section', () => {
      renderComponent(<DivisionCriteriaExplanation />)

      const content = document.getElementById('division-criteria-content')
      expect(content).toHaveAttribute('aria-hidden')
    })

    /**
     * Validates: Requirement 7.4
     * Sections have proper aria-labelledby attributes
     */
    it('should have proper aria-labelledby attributes on sections', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      // Eligibility section
      const eligibilitySection = document.querySelector(
        '[aria-labelledby="division-eligibility-heading"]'
      )
      expect(eligibilitySection).toBeInTheDocument()
      expect(
        document.getElementById('division-eligibility-heading')
      ).toBeInTheDocument()

      // No net loss section
      const noNetLossSection = document.querySelector(
        '[aria-labelledby="division-no-net-loss-heading"]'
      )
      expect(noNetLossSection).toBeInTheDocument()
      expect(
        document.getElementById('division-no-net-loss-heading')
      ).toBeInTheDocument()

      // Recognition levels section
      const recognitionSection = document.querySelector(
        '[aria-labelledby="division-recognition-levels-heading"]'
      )
      expect(recognitionSection).toBeInTheDocument()
      expect(
        document.getElementById('division-recognition-levels-heading')
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 7.4
     * Card has aria-label for screen readers
     */
    it('should have aria-label on the main card', () => {
      const { container } = renderComponent(<DivisionCriteriaExplanation />)

      const card = container.querySelector(
        '[aria-label="Distinguished Division Program criteria explanation"]'
      )
      expect(card).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 7.4
     * Table has aria-label for screen readers
     */
    it('should have aria-label on the recognition levels table', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      const table = screen.getByRole('table', {
        name: /Division recognition level requirements/i,
      })
      expect(table).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 7.4
     * Table headers have proper scope attributes
     */
    it('should have proper scope attributes on table headers', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      const table = screen.getByRole('table', {
        name: /Division recognition level requirements/i,
      })
      const headers = table.querySelectorAll('th')

      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col')
      })
    })

    /**
     * Validates: Requirement 7.4
     * Decorative icons are hidden from screen readers
     */
    it('should hide decorative icons from screen readers', () => {
      const { container } = renderComponent(
        <DivisionCriteriaExplanation defaultExpanded={true} />
      )

      const decorativeIcons = container.querySelectorAll(
        'svg[aria-hidden="true"]'
      )
      expect(decorativeIcons.length).toBeGreaterThan(0)
    })

    /**
     * Validates: Requirement 7.3 (touch targets)
     * Toggle button meets minimum touch target size
     */
    it('should have minimum 44px touch target on toggle button', () => {
      renderComponent(<DivisionCriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Division Program Criteria/i,
      })
      expect(toggleButton).toHaveClass('min-h-[44px]')
    })

    /**
     * Validates: Requirement 7.4
     * Toggle button has visible focus indicator
     */
    it('should have visible focus indicator on toggle button', () => {
      renderComponent(<DivisionCriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Division Program Criteria/i,
      })
      expect(toggleButton).toHaveClass('focus-visible:ring-2')
    })

    /**
     * Validates: Requirement 7.4
     * Semantic HTML structure with proper headings
     */
    it('should use semantic HTML with proper heading hierarchy', () => {
      renderComponent(<DivisionCriteriaExplanation defaultExpanded={true} />)

      // Main heading (h3)
      const mainHeading = screen.getByRole('heading', {
        name: /Distinguished Division Program Criteria/i,
        level: 3,
      })
      expect(mainHeading).toBeInTheDocument()

      // Section headings (h4)
      const sectionHeadings = screen.getAllByRole('heading', { level: 4 })
      expect(sectionHeadings.length).toBeGreaterThanOrEqual(3) // Eligibility, No Net Loss, Recognition Levels
    })
  })
})
