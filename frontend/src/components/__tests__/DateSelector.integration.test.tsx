/**
 * Unit tests for DateSelector error handling
 * Feature: firestore-index-fix
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *
 * These tests verify that the DateSelector component correctly:
 * - Displays error state with user-friendly message on CDN failure (3.1)
 * - Displays empty state when no dates are available (3.2)
 * - Provides a retry button that triggers refetch (3.3)
 * - Does not display loading spinner indefinitely when CDN fails (3.4)
 *
 * Updated for CDN-only architecture (#173): DateSelector now fetches
 * from CDN via fetchCdnDates() instead of Express apiClient.get().
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { render } from '@testing-library/react'
import DateSelector from '../DateSelector'
import { fetchCdnDates } from '../../services/cdn'
import { logger } from '../../utils/logger'

// Mock the CDN service (#173)
vi.mock('../../services/cdn', () => ({
  fetchCdnDates: vi.fn(),
  fetchCdnManifest: vi.fn(),
  cdnAnalyticsUrl: vi.fn(),
  fetchFromCdn: vi.fn(),
}))

const mockedFetchCdnDates = vi.mocked(fetchCdnDates)

// CDN dates response with dates (flat strings — component transforms them)
const createMockCdnDatesResponse = () => ({
  dates: ['2024-01-15', '2024-01-20', '2024-02-10'],
  count: 3,
  generatedAt: '2024-02-10T10:00:00Z',
})

// Empty CDN dates response
const createEmptyCdnDatesResponse = () => ({
  dates: [] as string[],
  count: 0,
  generatedAt: '2024-02-10T10:00:00Z',
})

// Create a wrapper with QueryClientProvider for testing
// Note: retry: false ensures errors are immediately propagated without retries
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

// Helper to render DateSelector with providers
const renderDateSelector = (onDateChange = vi.fn(), selectedDate?: string) => {
  const wrapper = createWrapper()
  return render(
    <DateSelector onDateChange={onDateChange} selectedDate={selectedDate} />,
    { wrapper }
  )
}

// Extended timeout for error state tests (React Query needs time to process)
const ERROR_TIMEOUT = { timeout: 5000 }

describe('DateSelector Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Error State Rendering', () => {
    /**
     * Test that error state renders on CDN failure
     *
     * **Validates: Requirement 3.1**
     * WHEN the CDN dates fetch returns an error
     * THEN THE Date_Selector SHALL display an error state with a user-friendly message
     */
    it('should display error state with user-friendly message on CDN failure', async () => {
      mockedFetchCdnDates.mockRejectedValue(new Error('CDN unavailable'))

      renderDateSelector()

      // Wait for error state to appear (with extended timeout for React Query processing)
      await waitFor(() => {
        expect(
          screen.getByText('Unable to load available dates. Please try again.')
        ).toBeInTheDocument()
      }, ERROR_TIMEOUT)

      // Verify error alert is present with proper role
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    /**
     * Test that error state includes error icon
     *
     * **Validates: Requirement 3.1**
     */
    it('should display error icon in error state', async () => {
      mockedFetchCdnDates.mockRejectedValue(new Error('CDN Error'))

      const { container } = renderDateSelector()

      await waitFor(() => {
        expect(
          screen.getByText('Unable to load available dates. Please try again.')
        ).toBeInTheDocument()
      }, ERROR_TIMEOUT)

      // Check for SVG error icon
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Empty State Rendering', () => {
    /**
     * Test that empty state renders when no dates are available
     *
     * **Validates: Requirement 3.2**
     * WHEN the CDN dates returns an empty array
     * THEN THE Date_Selector SHALL display a message indicating no dates are available
     */
    it('should display empty state message when no dates are available', async () => {
      mockedFetchCdnDates.mockResolvedValue(createEmptyCdnDatesResponse())

      renderDateSelector()

      await waitFor(() => {
        expect(
          screen.getByText(
            'No dates available. Data may not have been collected yet.'
          )
        ).toBeInTheDocument()
      })

      // Verify status role is present
      const status = screen.getByRole('status')
      expect(status).toBeInTheDocument()
    })

    /**
     * Test that empty state includes calendar icon
     *
     * **Validates: Requirement 3.2**
     */
    it('should display calendar icon in empty state', async () => {
      mockedFetchCdnDates.mockResolvedValue(createEmptyCdnDatesResponse())

      const { container } = renderDateSelector()

      await waitFor(() => {
        expect(
          screen.getByText(
            'No dates available. Data may not have been collected yet.'
          )
        ).toBeInTheDocument()
      })

      // Check for SVG calendar icon
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Retry Button Functionality', () => {
    /**
     * Test that retry button is displayed in error state
     *
     * **Validates: Requirement 3.3**
     * WHEN the Date_Selector is in an error state
     * THEN THE Date_Selector SHALL provide a retry button
     */
    it('should display retry button when in error state', async () => {
      mockedFetchCdnDates.mockRejectedValue(new Error('CDN Error'))

      renderDateSelector()

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument()
      }, ERROR_TIMEOUT)
    })

    /**
     * Test that retry button triggers refetch
     *
     * **Validates: Requirement 3.3**
     * WHEN the retry button is clicked
     * THEN the Date_Selector SHALL attempt to fetch dates again
     */
    it('should trigger refetch when retry button is clicked', async () => {
      // First call fails
      mockedFetchCdnDates.mockRejectedValueOnce(new Error('CDN Error'))

      renderDateSelector()

      // Wait for error state
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument()
      }, ERROR_TIMEOUT)

      // Clear mock to track retry call
      mockedFetchCdnDates.mockClear()
      // Second call succeeds
      mockedFetchCdnDates.mockResolvedValue(createMockCdnDatesResponse())

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i })
      fireEvent.click(retryButton)

      // Verify CDN was called again
      await waitFor(() => {
        expect(mockedFetchCdnDates).toHaveBeenCalled()
      }, ERROR_TIMEOUT)
    })

    /**
     * Test that retry button has proper accessibility label
     *
     * **Validates: Requirement 3.3**
     */
    it('should have accessible retry button with aria-label', async () => {
      mockedFetchCdnDates.mockRejectedValue(new Error('CDN Error'))

      renderDateSelector()

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i })
        expect(retryButton).toHaveAttribute(
          'aria-label',
          'Retry loading available dates'
        )
      }, ERROR_TIMEOUT)
    })

    /**
     * Test that successful retry clears error state and shows dates
     *
     * **Validates: Requirement 3.3**
     */
    it('should clear error state and show dates after successful retry', async () => {
      // First call fails
      mockedFetchCdnDates.mockRejectedValueOnce(new Error('CDN Error'))

      renderDateSelector()

      // Wait for error state
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument()
      }, ERROR_TIMEOUT)

      // Second call succeeds
      mockedFetchCdnDates.mockResolvedValue(createMockCdnDatesResponse())

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i })
      fireEvent.click(retryButton)

      // Wait for successful state - should show month selector
      await waitFor(() => {
        expect(screen.getByLabelText('Select month')).toBeInTheDocument()
      }, ERROR_TIMEOUT)

      // Error message should be gone
      expect(
        screen.queryByText('Unable to load available dates. Please try again.')
      ).not.toBeInTheDocument()
    })
  })

  describe('Loading State Transitions', () => {
    /**
     * Test that loading state is shown initially
     *
     * **Validates: Requirement 3.4**
     */
    it('should show loading state initially while fetching', async () => {
      // Create a delayed response
      mockedFetchCdnDates.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve(createMockCdnDatesResponse()), 100)
          )
      )

      const { container } = renderDateSelector()

      // Should show loading skeleton
      const loadingElements = container.querySelectorAll('.animate-pulse')
      expect(loadingElements.length).toBeGreaterThan(0)
    })

    /**
     * Test that loading state transitions to error state (not infinite loading)
     *
     * **Validates: Requirement 3.4**
     * THE Date_Selector SHALL NOT display a loading spinner indefinitely when CDN fails
     */
    it('should transition from loading to error state on CDN failure', async () => {
      mockedFetchCdnDates.mockRejectedValue(new Error('CDN Error'))

      const { container } = renderDateSelector()

      // Wait for error state to appear
      await waitFor(() => {
        expect(
          screen.getByText('Unable to load available dates. Please try again.')
        ).toBeInTheDocument()
      }, ERROR_TIMEOUT)

      // Loading skeleton should be gone
      const loadingElements = container.querySelectorAll('.animate-pulse')
      expect(loadingElements.length).toBe(0)
    })

    /**
     * Test that loading state transitions to empty state
     *
     * **Validates: Requirement 3.4**
     */
    it('should transition from loading to empty state when no dates', async () => {
      mockedFetchCdnDates.mockResolvedValue(createEmptyCdnDatesResponse())

      const { container } = renderDateSelector()

      // Wait for empty state
      await waitFor(() => {
        expect(
          screen.getByText(
            'No dates available. Data may not have been collected yet.'
          )
        ).toBeInTheDocument()
      })

      // Loading skeleton should be gone
      const loadingElements = container.querySelectorAll('.animate-pulse')
      expect(loadingElements.length).toBe(0)
    })

    /**
     * Test that loading state transitions to success state
     *
     * **Validates: Requirement 3.4**
     */
    it('should transition from loading to success state with dates', async () => {
      mockedFetchCdnDates.mockResolvedValue(createMockCdnDatesResponse())

      const { container } = renderDateSelector()

      // Wait for success state - should show month selector
      await waitFor(() => {
        expect(screen.getByLabelText('Select month')).toBeInTheDocument()
      })

      // Loading skeleton should be gone
      const loadingElements = container.querySelectorAll('.animate-pulse')
      expect(loadingElements.length).toBe(0)
    })
  })

  describe('Error Logging', () => {
    /**
     * Test that errors are logged for debugging
     *
     * **Validates: Requirement 3.5**
     * WHEN the Date_Selector encounters an error
     * THEN THE Date_Selector SHALL log the error details for debugging purposes
     */
    it('should log error details when CDN fails', async () => {
      const loggerSpy = vi.spyOn(logger, 'error')
      const errorMessage = 'Network connection failed'
      mockedFetchCdnDates.mockRejectedValue(new Error(errorMessage))

      renderDateSelector()

      // Wait for error state
      await waitFor(() => {
        expect(
          screen.getByText('Unable to load available dates. Please try again.')
        ).toBeInTheDocument()
      }, ERROR_TIMEOUT)

      // Verify error was logged
      await waitFor(() => {
        expect(loggerSpy).toHaveBeenCalledWith(
          '[DateSelector] Failed to load available dates:',
          expect.objectContaining({
            error: errorMessage,
            timestamp: expect.any(String),
          })
        )
      }, ERROR_TIMEOUT)
    })
  })

  describe('Retry Limit', () => {
    /**
     * Test that retry count is bounded (not infinite)
     *
     * **Validates: Requirement 3.4**
     * The query should have limited retries to prevent infinite retry loops
     */
    it('should have bounded retry count configured', async () => {
      // Track how many times fetchCdnDates is called
      let callCount = 0
      mockedFetchCdnDates.mockImplementation(() => {
        callCount++
        return Promise.reject(new Error('Persistent error'))
      })

      renderDateSelector()

      // Wait for error state to appear (after retries are exhausted)
      await waitFor(
        () => {
          expect(
            screen.getByText(
              'Unable to load available dates. Please try again.'
            )
          ).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      // The component has retry: 2 configured, so we expect:
      // 1 initial call + 2 retries = 3 total calls maximum
      expect(callCount).toBeLessThanOrEqual(3)
    })
  })
})
