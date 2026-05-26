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
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import App from '../../../App'
import { clickSearchSuggestion } from './_helpers'

import { setupCdnFetchMock } from '../utils/mockCdnData'

// Journey tests render <App /> and click through multi-step flows; the
// full-page scope is the test. 15s recognises that category — unit
// tests still inherit the 5s cap from vitest.config.ts (#473).
vi.setConfig({ testTimeout: 15000 })

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

describe('Journey 04: The Time Travel Flow', () => {
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

  it('navigates to District 61 and travels back in time to an earlier snapshot', async () => {
    // Ensure we start at the root url for the router
    window.history.replaceState({}, 'Test', '/')
    render(<App />)

    // Step 0: Search and Navigate
    const searchInput = await screen.findByRole(
      'textbox',
      { name: /Search districts by number or name/i },
      { timeout: 5000 }
    )
    await user.type(searchInput, '61')
    await clickSearchSuggestion(user, /D61.*District 61/i)

    // Step 1: Wait for District 61 header to appear
    const districtHeading = await screen.findByRole(
      'heading',
      { name: /District 61/i },
      { timeout: 5000 }
    )
    expect(districtHeading).toBeInTheDocument()

    // Step 2: Verify Initial state (December 31) has exactly 5 Smedley.
    // After the #550 Overview redesign the per-tier badges live in the
    // Distinguished Composition legend (format: "Smedley · 5").
    const smedleyBadge = await screen.findByText(
      /Smedley\s*·\s*5/i,
      {},
      { timeout: 5000 }
    )
    expect(smedleyBadge).toBeInTheDocument()

    // Step 3: Find the Date Selector (DataControlsBar's date chip).
    const dateSelect = await screen.findByTestId(
      'date-chip-select',
      undefined,
      {
        timeout: 5000,
      }
    )

    // Step 4: Time Travel! Change date to 2024-11-30
    await user.selectOptions(dateSelect, '2024-11-30')

    // Step 5: Verify Final State (November 30) data drops Smedley count to 0!
    await waitFor(
      async () => {
        const novSmedley = await screen.queryByText(/Smedley\s*·\s*5/i)
        expect(novSmedley).not.toBeInTheDocument() // The 5 Smedley should disappear because the new mock sends 0!
      },
      { timeout: 5000 }
    )
  }, 15000)
})
