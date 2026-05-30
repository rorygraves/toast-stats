/**
 * CriteriaExplanation Component Tests
 *
 * Tests for the Distinguished Area Program criteria explanation component.
 * Validates content display, expand/collapse functionality, and accessibility.
 *
 * Requirements validated:
 * - 2.1: Show eligibility gate requirements prominently at the top
 * - 2.2: Explain that areas must have no net club loss (paid clubs >= club base)
 * - 2.3: Explain that 75% of club base must have first-round visits by Nov 30 and 75% must have second-round visits by May 31
 * - 2.4: Indicate that club visit data is not currently available from dashboard exports
 * - 2.5: Display eligibility status as "Unknown" when club visit data unavailable
 * - 3.1: Show that paid clubs must be at least equal to club base (no net loss)
 * - 3.2: Explain what constitutes a "paid club" (Active status, dues current)
 * - 3.3: Explain what statuses disqualify a club from being "paid" (Suspended, Ineligible, Low)
 * - 4.1: Show Distinguished Area requires paidClubs >= clubBase AND distinguishedClubs >= 50% of clubBase
 * - 4.2: Show Select Distinguished requires paidClubs >= clubBase AND distinguishedClubs >= 50% of clubBase + 1
 * - 4.3: Show President's Distinguished requires paidClubs >= clubBase + 1 AND distinguishedClubs >= 50% of clubBase + 1
 * - 4.4: Indicate percentages are calculated against club base, not paid clubs
 * - 4.5: Present recognition levels in ascending order of achievement
 * - 7.4: Use semantic HTML with appropriate ARIA labels
 */

import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import '@testing-library/jest-dom'
import { CriteriaExplanation } from '../CriteriaExplanation'
describe('CriteriaExplanation', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  describe('Criteria Content Display', () => {
    /**
     * Validates: Requirements 2.1, 2.2
     * THE Criteria_Display SHALL show the eligibility gate requirements prominently
     * THE Criteria_Display SHALL explain that areas must have no net club loss
     */
    it('should display eligibility gate section with no net club loss requirement', () => {
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

      // Check eligibility gate heading is present
      expect(screen.getByText('Eligibility Gate')).toBeInTheDocument()

      // Check no net club loss requirement is explained
      expect(screen.getByText('No Net Club Loss')).toBeInTheDocument()
      expect(
        screen.getByText(/paid clubs must be at least equal to the club base/i)
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirements 2.3
     * THE Criteria_Display SHALL explain that 75% of club base must have first-round visits by Nov 30
     * and 75% must have second-round visits by May 31
     */
    it('should display club visits requirement with specific deadlines', () => {
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

      // Check club visits requirement is explained
      expect(screen.getByText('Club Visit Reports')).toBeInTheDocument()
      expect(
        screen.getByText(/75% of club base must have first-round visits/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/November 30/i)).toBeInTheDocument()
      expect(screen.getByText(/May 31/i)).toBeInTheDocument()
    })

    /**
     * Validates: Requirements 2.4, 2.5
     * THE Criteria_Display SHALL indicate that club visit data is not currently available
     * WHEN club visit data is unavailable, THE System SHALL display eligibility status as "Unknown"
     */
    it('should display "Status: Unknown" for club visit data', () => {
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

      expect(
        screen.getByText(/Club Visit Status: Unknown/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Club visit data is not currently available/i)
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 3.1
     * THE Criteria_Display SHALL show that paid clubs must be at least equal to club base (no net loss)
     */
    it('should display no net club loss requirement section', () => {
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

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
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

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
     */
    it('should display all three recognition levels with correct thresholds', () => {
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

      expect(screen.getByText('Recognition Levels')).toBeInTheDocument()

      // Distinguished Area - ≥ Club Base paid, ≥ 50% of Club Base distinguished
      expect(screen.getByText('Distinguished Area')).toBeInTheDocument()
      expect(screen.getByText('≥ 50% of Club Base')).toBeInTheDocument()

      // Select Distinguished Area - ≥ Club Base paid, ≥ 50% of Club Base + 1 distinguished
      expect(screen.getByText('Select Distinguished Area')).toBeInTheDocument()
      // Note: There are multiple "≥ 50% of Club Base + 1" values (Select and President's distinguished columns)
      const fiftyPlusOneElements = screen.getAllByText('≥ 50% of Club Base + 1')
      expect(fiftyPlusOneElements.length).toBe(2)

      // President's Distinguished Area - ≥ Club Base + 1 paid, ≥ 50% of Club Base + 1 distinguished
      expect(
        screen.getByText("President's Distinguished Area")
      ).toBeInTheDocument()
      expect(screen.getByText('≥ Club Base + 1')).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 4.4
     * THE Criteria_Display SHALL indicate percentages are calculated against club base, not paid clubs
     */
    it('should display note about percentages calculated against club base', () => {
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

      // Check for the important note about calculation basis
      // The text is split across elements due to <strong> tags, so we check for key parts
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
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

      const table = screen.getByRole('table', {
        name: /recognition level requirements/i,
      })
      const rows = table.querySelectorAll('tbody tr')

      // Verify order: Distinguished, Select, President's
      expect(rows[0]).toHaveTextContent('Distinguished Area')
      expect(rows[0]).toHaveTextContent('≥ Club Base')
      expect(rows[0]).toHaveTextContent('≥ 50% of Club Base')

      expect(rows[1]).toHaveTextContent('Select Distinguished Area')
      expect(rows[1]).toHaveTextContent('≥ Club Base')
      expect(rows[1]).toHaveTextContent('≥ 50% of Club Base + 1')

      expect(rows[2]).toHaveTextContent("President's Distinguished Area")
      expect(rows[2]).toHaveTextContent('≥ Club Base + 1')
      expect(rows[2]).toHaveTextContent('≥ 50% of Club Base + 1')
    })

    /**
     * Validates: Requirements 4.1, 4.2, 4.3
     * Verify the paid clubs column shows correct thresholds for each level
     */
    it('should display correct paid clubs thresholds for each recognition level', () => {
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

      const table = screen.getByRole('table', {
        name: /recognition level requirements/i,
      })
      // Verify table exists (rows are checked via content assertions below)
      expect(table).toBeInTheDocument()

      // Distinguished and Select require ≥ Club Base
      // President's requires ≥ Club Base + 1
      const clubBaseElements = screen.getAllByText('≥ Club Base')
      expect(clubBaseElements.length).toBe(2) // Distinguished and Select

      expect(screen.getByText('≥ Club Base + 1')).toBeInTheDocument() // President's only
    })
  })

  describe('Expand/Collapse Functionality', () => {
    /**
     * Tests that component starts collapsed by default
     */
    it('should start collapsed by default', () => {
      renderWithProviders(<CriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Area Program Criteria/i,
      })
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

      // Content should be hidden
      const content = document.getElementById('criteria-content')
      expect(content).toHaveAttribute('aria-hidden', 'true')
    })

    /**
     * Tests that component starts expanded when defaultExpanded={true}
     */
    it('should start expanded when defaultExpanded is true', () => {
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Area Program Criteria/i,
      })
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

      // Content should be visible
      const content = document.getElementById('criteria-content')
      expect(content).toHaveAttribute('aria-hidden', 'false')
    })

    /**
     * Tests that clicking toggle button expands/collapses content
     */
    it('should toggle content visibility when button is clicked', () => {
      renderWithProviders(<CriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Area Program Criteria/i,
      })
      const content = document.getElementById('criteria-content')

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
      renderWithProviders(<CriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Area Program Criteria/i,
      })
      const content = document.getElementById('criteria-content')

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
      renderWithProviders(<CriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Area Program Criteria/i,
      })
      expect(toggleButton).toHaveAttribute('aria-expanded')
    })

    /**
     * Validates: Requirement 7.4
     * Toggle button has aria-controls attribute
     */
    it('should have aria-controls attribute on toggle button', () => {
      renderWithProviders(<CriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Area Program Criteria/i,
      })
      expect(toggleButton).toHaveAttribute('aria-controls', 'criteria-content')
    })

    /**
     * Validates: Requirement 7.4
     * Content section has aria-hidden attribute
     */
    it('should have aria-hidden attribute on content section', () => {
      renderWithProviders(<CriteriaExplanation />)

      const content = document.getElementById('criteria-content')
      expect(content).toHaveAttribute('aria-hidden')
    })

    /**
     * Validates: Requirement 7.4
     * Sections have proper aria-labelledby attributes
     */
    it('should have proper aria-labelledby attributes on sections', () => {
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

      // Eligibility section
      const eligibilitySection = document.querySelector(
        '[aria-labelledby="eligibility-heading"]'
      )
      expect(eligibilitySection).toBeInTheDocument()
      expect(document.getElementById('eligibility-heading')).toBeInTheDocument()

      // No net loss section (updated from paid-clubs-heading)
      const noNetLossSection = document.querySelector(
        '[aria-labelledby="no-net-loss-heading"]'
      )
      expect(noNetLossSection).toBeInTheDocument()
      expect(document.getElementById('no-net-loss-heading')).toBeInTheDocument()

      // Recognition levels section
      const recognitionSection = document.querySelector(
        '[aria-labelledby="recognition-levels-heading"]'
      )
      expect(recognitionSection).toBeInTheDocument()
      expect(
        document.getElementById('recognition-levels-heading')
      ).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 7.4
     * Card has aria-label for screen readers
     */
    it('should have aria-label on the main card', () => {
      const { container } = renderWithProviders(<CriteriaExplanation />)

      const card = container.querySelector(
        '[aria-label="Distinguished Area Program criteria explanation"]'
      )
      expect(card).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 7.4
     * Table has aria-label for screen readers
     */
    it('should have aria-label on the recognition levels table', () => {
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

      const table = screen.getByRole('table', {
        name: /recognition level requirements/i,
      })
      expect(table).toBeInTheDocument()
    })

    /**
     * Validates: Requirement 7.4
     * Table headers have proper scope attributes
     */
    it('should have proper scope attributes on table headers', () => {
      renderWithProviders(<CriteriaExplanation defaultExpanded={true} />)

      const table = screen.getByRole('table', {
        name: /recognition level requirements/i,
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
      const { container } = renderWithProviders(
        <CriteriaExplanation defaultExpanded={true} />
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
      renderWithProviders(<CriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Area Program Criteria/i,
      })
      expect(toggleButton).toHaveClass('min-h-[44px]')
    })

    /**
     * Validates: Requirement 7.4
     * Toggle button has visible focus indicator
     */
    it('should have visible focus indicator on toggle button', () => {
      renderWithProviders(<CriteriaExplanation />)

      const toggleButton = screen.getByRole('button', {
        name: /Distinguished Area Program Criteria/i,
      })
      expect(toggleButton).toHaveClass('focus-visible:ring-2')
    })
  })

  // #980 — when a urlParam is supplied the expand state deep-links via the URL.
  // Needs a router; the uncontrolled (no urlParam) path above stays router-free.
  describe('URL-synced expand state (#980)', () => {
    let location = ''
    const LocationProbe: React.FC = () => {
      location = useLocation().search
      return null
    }
    const renderWithRouter = (entry: string) =>
      render(
        <MemoryRouter initialEntries={[entry]}>
          <CriteriaExplanation urlParam="expandAreaCriteria" />
          <LocationProbe />
        </MemoryRouter>
      )
    const button = () =>
      screen.getByRole('button', {
        name: /Distinguished Area Program Criteria/i,
      })

    it('reads expanded state from the URL param', () => {
      renderWithRouter('/?expandAreaCriteria=1')
      expect(button()).toHaveAttribute('aria-expanded', 'true')
    })

    it('is collapsed when the param is absent', () => {
      renderWithRouter('/')
      expect(button()).toHaveAttribute('aria-expanded', 'false')
    })

    it('writes the param to the URL when toggled open', () => {
      renderWithRouter('/')
      fireEvent.click(button())
      expect(new URLSearchParams(location).get('expandAreaCriteria')).toBe('1')
    })

    it('removes the param from the URL when toggled closed', () => {
      renderWithRouter('/?expandAreaCriteria=1')
      fireEvent.click(button())
      expect(new URLSearchParams(location).has('expandAreaCriteria')).toBe(
        false
      )
    })
  })
})
