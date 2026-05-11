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

    // Step 2: Verify the three TargetProgressCards render
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

    // The Overview redesign (#360 slice 2) adds a 'Distinguished Clubs ·
    // Composition' panel, so 'Distinguished Clubs' now appears multiple
    // times on the page. The KPI card is the FIRST occurrence.
    const distClubsCards = await screen.findAllByText(
      /Distinguished Clubs/i,
      {},
      { timeout: 5000 }
    )
    expect(distClubsCards.length).toBeGreaterThan(0)

    // Step 3: Verify DCP badge details (Smedley, Presidents, Select) within the Distinguished Clubs card region
    const smedleyBadge = await screen.findByText(
      /5 Smedley/i,
      {},
      { timeout: 5000 }
    )
    expect(smedleyBadge).toBeInTheDocument()

    const presidentsBadge = await screen.findByText(
      /10 President's/i,
      {},
      { timeout: 5000 }
    )
    expect(presidentsBadge).toBeInTheDocument()

    const selectBadge = await screen.findByText(
      /15 Select/i,
      {},
      { timeout: 5000 }
    )
    expect(selectBadge).toBeInTheDocument()
  }, 15000)
})
