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
import { clickSearchSuggestion } from './_helpers'

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

describe('Journey 05: The Division/Area Performance Flow', () => {
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

  it('navigates to District 61 and drills into the Divisions & Areas hierarchy', async () => {
    // Ensure we start at the root url for the router
    window.history.replaceState({}, 'Test', '/')
    render(<App />)

    // Step 0: Search and Navigate to District 61
    const searchInput = await screen.findByRole(
      'textbox',
      { name: /Search districts by number or name/i },
      { timeout: 5000 }
    )
    await user.type(searchInput, '61')
    await clickSearchSuggestion(user, /D61.*District 61/i)

    // Step 1: Wait for District 61 header to appear to confirm we are inside details
    const districtHeading = await screen.findByRole(
      'heading',
      { name: /District 61/i },
      { timeout: 5000 }
    )
    expect(districtHeading).toBeInTheDocument()

    // Step 2: Navigate to the `Divisions & Areas` Tab
    const divisionsTab = await screen.findByRole(
      'tab',
      { name: /divisions & areas/i },
      { timeout: 5000 }
    )
    await user.click(divisionsTab)

    // Step 3: Verify that `Division A` renders on the UI!
    // This is sourced via districtSnapshot mock injected natively into extractDivisionPerformance
    // Multiple elements match "Division A" (performance card heading + recognition narrative)
    const divisionAElements = await screen.findAllByText(
      /Division A/i,
      {},
      { timeout: 5000 }
    )
    expect(divisionAElements.length).toBeGreaterThan(0)

    // Step 4: Validate underlying Area Data (Area 10, Area 11 mapped in mockCdnData.ts)
    // Looking up an Area metric within the table or cards. We know `Area 10` is an active text property inside the District logic tree matching division A.
    const area10Elements = await screen.findAllByText(
      /Area 10/i,
      {},
      { timeout: 5000 }
    )
    expect(area10Elements.length).toBeGreaterThan(0) // Ensuring the area property exists in the page structure
  }, 15000)
})
