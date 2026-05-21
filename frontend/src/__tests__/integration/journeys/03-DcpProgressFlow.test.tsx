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

describe('Journey 03: The DCP Progress Flow', () => {
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

  it('navigates to District 61 and verifying DCP progress metric cards', async () => {
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

    // Step 2: Verify the three KPI bullet cards render (#550 redesign)
    const paidClubsCard = await screen.findByText(
      /Paid Clubs/i,
      {},
      { timeout: 5000 }
    )
    expect(paidClubsCard).toBeInTheDocument()

    const memPaymentsCard = await screen.findByText(
      /Membership Payments/i,
      {},
      { timeout: 5000 }
    )
    expect(memPaymentsCard).toBeInTheDocument()

    // 'Distinguished Clubs' appears both as a KPI card title and as a
    // legend item in the Composition panel below — assert it exists.
    const distClubsCards = await screen.findAllByText(
      /Distinguished Clubs/i,
      {},
      { timeout: 5000 }
    )
    expect(distClubsCards.length).toBeGreaterThan(0)

    // Step 3: Verify DCP tier breakdown appears in the Composition legend
    // (#550 moved the per-tier badges out of the KPI card and into the
    // Distinguished Composition legend, format: "Smedley · 5").
    const smedleyBadge = await screen.findByText(
      /Smedley\s*·\s*5/i,
      {},
      { timeout: 5000 }
    )
    expect(smedleyBadge).toBeInTheDocument()

    const presidentsBadge = await screen.findByText(
      /President's\s*·\s*10/i,
      {},
      { timeout: 5000 }
    )
    expect(presidentsBadge).toBeInTheDocument()

    const selectBadge = await screen.findByText(
      /Select\s*·\s*15/i,
      {},
      { timeout: 5000 }
    )
    expect(selectBadge).toBeInTheDocument()
  }, 15000)
})
