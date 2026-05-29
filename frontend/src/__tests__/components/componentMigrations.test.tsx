/**
 * Unit Tests: Component Migrations for Brand Compliance
 *
 * Tests for button component brand compliance and form component styling updates
 * **Validates: Requirements 3.1, 3.2**
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ErrorDisplay, EmptyState } from '../../components/ErrorDisplay'

// NOTE (#916, §4.2): these tests assert real className / click-handler / a11y
// behaviour of ErrorDisplay & EmptyState. A former `beforeEach` that stubbed
// `Element.prototype.getBoundingClientRect → 44×44` was removed — no assertion
// here reads geometry, so the stub was pure footgun (a jsdom geometry lie that
// a future geometry assertion would silently trust). jsdom proves what ships
// (class/role/handler); live geometry belongs in a Playwright check (L66/L134).

describe('Component Migrations - Brand Compliance Tests', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('Button Component Brand Compliance', () => {
    it('should use tm-btn-secondary class for retry buttons in inline variant', () => {
      const mockRetry = vi.fn()

      render(
        <ErrorDisplay error="Test error" onRetry={mockRetry} variant="inline" />
      )

      const retryButton = screen.getByRole('button', {
        name: /retry loading data/i,
      })

      // Check that button uses brand-compliant class
      expect(retryButton.classList.contains('tm-btn-secondary')).toBe(true)

      // Verify button functionality
      fireEvent.click(retryButton)
      expect(mockRetry).toHaveBeenCalledOnce()
    })

    it('should use tm-btn-primary class for retry buttons in full variant', () => {
      const mockRetry = vi.fn()

      render(
        <ErrorDisplay error="Test error" onRetry={mockRetry} variant="full" />
      )

      const retryButton = screen.getByRole('button', {
        name: /retry loading data/i,
      })

      // Check that button uses brand-compliant class
      expect(retryButton.classList.contains('tm-btn-primary')).toBe(true)
      expect(retryButton.classList.contains('w-full')).toBe(true)

      // Verify button functionality
      fireEvent.click(retryButton)
      expect(mockRetry).toHaveBeenCalledOnce()
    })

    it('should use tm-btn-secondary class for retry buttons in card variant', () => {
      const mockRetry = vi.fn()

      render(
        <ErrorDisplay error="Test error" onRetry={mockRetry} variant="card" />
      )

      const retryButton = screen.getByRole('button', {
        name: /retry loading data/i,
      })

      // Check that button uses brand-compliant class
      expect(retryButton.classList.contains('tm-btn-secondary')).toBe(true)

      // Verify button functionality
      fireEvent.click(retryButton)
      expect(mockRetry).toHaveBeenCalledOnce()
    })

    it('should use tm-btn-primary class for action buttons in EmptyState', () => {
      const mockAction = vi.fn()

      render(
        <EmptyState
          message="No data available"
          action={{
            label: 'Load Data',
            onClick: mockAction,
          }}
        />
      )

      const actionButton = screen.getByRole('button', { name: /load data/i })

      // Check that button uses brand-compliant class
      expect(actionButton.classList.contains('tm-btn-primary')).toBe(true)

      // Verify button functionality
      fireEvent.click(actionButton)
      expect(mockAction).toHaveBeenCalledOnce()
    })

    it('should maintain button accessibility with brand-compliant classes', () => {
      const mockRetry = vi.fn()

      render(
        <ErrorDisplay
          error="Network error"
          onRetry={mockRetry}
          variant="inline"
        />
      )

      const retryButton = screen.getByRole('button', {
        name: /retry loading data/i,
      })

      // Check accessibility attributes are preserved
      expect(retryButton).toHaveAttribute('aria-label', 'Retry loading data')

      // Check that button is focusable
      expect(retryButton.tabIndex).toBeGreaterThanOrEqual(0)

      // Check brand compliance
      expect(retryButton.classList.contains('tm-btn-secondary')).toBe(true)
    })

    it('should handle button states correctly with brand classes', () => {
      const mockRetry = vi.fn()

      render(
        <ErrorDisplay error="Test error" onRetry={mockRetry} variant="full" />
      )

      const retryButton = screen.getByRole('button', {
        name: /retry loading data/i,
      })

      // Check initial state
      expect(retryButton.classList.contains('tm-btn-primary')).toBe(true)
      expect(retryButton).not.toBeDisabled()

      // Simulate focus
      retryButton.focus()
      expect(document.activeElement).toBe(retryButton)
    })
  })

  describe('Card Component Brand Compliance', () => {
    it('should use tm-card class for error display containers', () => {
      render(<ErrorDisplay error="Test error" variant="full" />)

      // Check that the main container uses tm-card class
      const cardContainer = screen.getByRole('alert')
      expect(cardContainer.classList.contains('tm-card')).toBe(true)
    })

    it('should use tm-card class for empty state containers', () => {
      render(<EmptyState message="No data available" />)

      // Check that the container uses tm-card class
      const cardContainer = screen.getByRole('status')
      expect(cardContainer.classList.contains('tm-card')).toBe(true)
    })

    it('should maintain card accessibility with brand-compliant classes', () => {
      render(
        <ErrorDisplay
          error="Test error"
          variant="card"
          title="Custom Error Title"
        />
      )

      const errorCard = screen.getByRole('alert')

      // Check that card has proper role
      expect(errorCard).toHaveAttribute('role', 'alert')

      // Check that title is present
      expect(screen.getByText('Custom Error Title')).toBeInTheDocument()

      // Check brand compliance - card should not have old classes
      expect(errorCard.className).not.toContain('bg-red-50')
      expect(errorCard.className).not.toContain('border-red-200')
    })
  })

  describe('Component Integration Tests', () => {
    it('should render error display with all brand-compliant components', () => {
      const mockRetry = vi.fn()

      render(
        <ErrorDisplay
          error="Integration test error"
          onRetry={mockRetry}
          variant="card"
          title="Integration Test"
          showDetails={true}
        />
      )

      // Check that all components are present
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Integration Test')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /retry loading data/i })
      ).toBeInTheDocument()

      // Check brand compliance
      const retryButton = screen.getByRole('button', {
        name: /retry loading data/i,
      })
      expect(retryButton.classList.contains('tm-btn-secondary')).toBe(true)
    })

    it('should render empty state with all brand-compliant components', () => {
      const mockAction = vi.fn()

      render(
        <EmptyState
          title="Custom Empty State"
          message="No data found"
          action={{
            label: 'Reload',
            onClick: mockAction,
          }}
          icon="search"
        />
      )

      // Check that all components are present
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Custom Empty State')).toBeInTheDocument()
      expect(screen.getByText('No data found')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /reload/i })
      ).toBeInTheDocument()

      // Check brand compliance
      const actionButton = screen.getByRole('button', { name: /reload/i })
      expect(actionButton.classList.contains('tm-btn-primary')).toBe(true)

      const container = screen.getByRole('status')
      expect(container.classList.contains('tm-card')).toBe(true)
    })

    it('should handle error scenarios gracefully with brand compliance', () => {
      // Test with null error (should not render)
      const { rerender } = render(<ErrorDisplay error={null} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      // Test with string error
      rerender(<ErrorDisplay error="String error message" variant="inline" />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/string error message/i)).toBeInTheDocument()

      // Test with Error object
      const errorObj = new Error('Error object message')
      rerender(<ErrorDisplay error={errorObj} variant="card" />)

      expect(screen.getByText(/error object message/i)).toBeInTheDocument()
    })
  })

  describe('Brand Compliance Validation', () => {
    it('should not use deprecated color classes', () => {
      const mockRetry = vi.fn()

      render(
        <ErrorDisplay error="Test error" onRetry={mockRetry} variant="full" />
      )

      const retryButton = screen.getByRole('button', {
        name: /retry loading data/i,
      })

      // Check that deprecated classes are not used
      expect(retryButton.className).not.toContain('bg-tm-loyal-blue')
      expect(retryButton.className).not.toContain('text-tm-white')
      expect(retryButton.className).not.toContain('px-4')
      expect(retryButton.className).not.toContain('py-2')
      expect(retryButton.className).not.toContain('rounded-lg')

      // Check that brand-compliant class is used
      expect(retryButton.classList.contains('tm-btn-primary')).toBe(true)
    })

    it('should not use deprecated card classes', () => {
      render(<EmptyState message="Test message" />)

      const container = screen.getByRole('status')

      // Check that deprecated classes are not used
      expect(container.className).not.toContain('bg-white')
      expect(container.className).not.toContain('rounded-lg')
      expect(container.className).not.toContain('shadow-md')
      expect(container.className).not.toContain('p-12')

      // Check that brand-compliant class is used
      expect(container.classList.contains('tm-card')).toBe(true)
    })

    it('should maintain consistent brand styling across variants', () => {
      const mockRetry = vi.fn()

      // Test inline variant
      const { rerender } = render(
        <ErrorDisplay error="Test error" onRetry={mockRetry} variant="inline" />
      )

      let retryButton = screen.getByRole('button', {
        name: /retry loading data/i,
      })
      expect(retryButton.classList.contains('tm-btn-secondary')).toBe(true)

      // Test card variant
      rerender(
        <ErrorDisplay error="Test error" onRetry={mockRetry} variant="card" />
      )

      retryButton = screen.getByRole('button', { name: /retry loading data/i })
      expect(retryButton.classList.contains('tm-btn-secondary')).toBe(true)

      // Test full variant
      rerender(
        <ErrorDisplay error="Test error" onRetry={mockRetry} variant="full" />
      )

      retryButton = screen.getByRole('button', { name: /retry loading data/i })
      expect(retryButton.classList.contains('tm-btn-primary')).toBe(true)
    })
  })
})
