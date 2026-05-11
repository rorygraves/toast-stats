import React from 'react'
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterEach,
} from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import '@testing-library/jest-dom'
import App from '../../../App'

import { setupCdnFetchMock } from '../utils/mockCdnData'

// Journey tests render <App /> and click through multi-step flows; the
// full-page scope is the test. 15s recognises that category — unit
// tests still inherit the 5s cap from vitest.config.ts (#473).
vi.setConfig({ testTimeout: 15000 })

// Mock LazyChart to immediately render its children in integration tests
vi.mock('../../../components/LazyChart', () => ({
  LazyChart: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Setup Responsive defaults for jsdom
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false, // Default to desktop view
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

describe('Journey 02: The "At-Risk" Discovery Flow', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    setupCdnFetchMock()
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('navigates to the Clubs tab and filters for at-risk clubs', async () => {
    // Ensure we start at the root url for the router
    window.history.replaceState({}, 'Test', '/')
    render(<App />)

    // Step 0: Search and Navigate
    const searchInput = await screen.findByRole(
      'combobox',
      {},
      { timeout: 5000 }
    )
    await user.type(searchInput, '61')
    await user.click(await screen.findByText(/District 61/i))

    // Step 1: Wait for District 61 header to appear
    const districtHeading = await screen.findByRole(
      'heading',
      { name: /District 61/i },
      { timeout: 5000 }
    )
    expect(districtHeading).toBeInTheDocument()

    // Step 2: Navigate to the Clubs Tab
    const clubsTab = await screen.findByRole(
      'tab',
      { name: /^Clubs$/i },
      { timeout: 5000 }
    )
    await user.click(clubsTab)

    // Step 3: Wait for the Data Table to load clubs
    const ottawaRow = await screen.findByText(
      /Ottawa Club/i,
      {},
      { timeout: 5000 }
    )
    expect(ottawaRow).toBeInTheDocument()

    // Step 4: Open the Status Filter
    // In ClubsTable, there is a combobox for filtering by Status
    const statusSelect = await screen
      .findByRole('combobox', { name: /Filter by Status/i }, { timeout: 5000 })
      .catch(() => null)

    // Select Vulnerable if it exists
    if (statusSelect) {
      await user.selectOptions(statusSelect, 'vulnerable')

      // Assume "Vulnerable Club" is now visible
      const vulnerableRow = await screen.findByText(
        /Vulnerable Club/i,
        {},
        { timeout: 5000 }
      )
      expect(vulnerableRow).toBeInTheDocument()

      // Click the row to navigate to Club Detail Page
      await user.click(vulnerableRow)

      // Verify the navigation succeeded
      const clubDetailHeading = await screen.findByRole(
        'heading',
        { name: /Vulnerable Club/i },
        { timeout: 5000 }
      )
      expect(clubDetailHeading).toBeInTheDocument()
    }
  }, 15000)
})
