import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// Journey tests render <App /> and click through multi-step flows; the
// full-page scope is the test. 15s recognises that category — unit
// tests still inherit the 5s cap from vitest.config.ts (#473).
vi.setConfig({ testTimeout: 15000 })
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import App from '../../../App'
import { setupCdnFetchMock } from '../utils/mockCdnData'

// Mock LazyChart to immediately render its children in integration tests
vi.mock('../../../components/LazyChart', () => ({
  LazyChart: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Journey 01: The Navigation Flow', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    setupCdnFetchMock()

    // Ensure we start at the root url for the router
    window.history.replaceState({}, 'Test', '/')
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('navigates from landing page to District 61 overview', async () => {
    render(<App />)

    // Step 1: Landing page loads successfully (#356 redesign chrome)
    const landingHeading = await screen.findByRole('heading', {
      level: 1,
      name: /^district rankings$/i,
    })
    expect(landingHeading).toBeInTheDocument()

    // Data loads and table displays District 61
    const districtNameCell = await screen.findByText('District 61')
    expect(districtNameCell).toBeInTheDocument()

    // Step 2: Filter by region using pill toggle bar (#326)
    const region6Pill = screen.getByRole('button', { name: /Region Region 6/i })
    await user.click(region6Pill)

    // Step 3: Search for specific district (optional, since filter does it)
    const searchInput = screen.getByRole('textbox', {
      name: /Search districts by number or name/i,
    })
    await user.type(searchInput, '61')

    // Step 4: Click the district row in the table
    // The tr elements don't have roles by default unless specified, so just click the District Name
    await user.click(districtNameCell)

    // Step 5: Verify Successful Navigation to District 61
    // The DistrictDetailPage should lazy load and render
    const districtHeading = await screen.findByRole(
      'heading',
      { name: /District 61/i },
      { timeout: 5000 }
    )
    expect(districtHeading).toBeInTheDocument()

    // Make sure we are on the District detail page viewing some summary content
    // We use findAllByText with a longer timeout because the data might be loading via React Query
    const trendsTabs = await screen.findAllByText(
      /Trends/i,
      {},
      { timeout: 3000 }
    )
    expect(trendsTabs.length).toBeGreaterThan(0)

    // Step 6: Go to the Analytics tab to view clubs
    // Step 6: Go to the Clubs tab to view clubs
    // Step 6: Go to the Clubs tab to view clubs
    const clubsTab = await screen.findByRole(
      'tab',
      { name: /^Clubs$/i },
      { timeout: 5000 }
    )
    await user.click(clubsTab)

    // Step 7: Find Ottawa Club in the data table and click it
    const ottawaClubRow = await screen.findByText(
      /Ottawa Club/i,
      {},
      { timeout: 5000 }
    )
    await user.click(ottawaClubRow)

    // Step 8: Verify Successful Navigation to Club Detail Page
    const clubHeading = await screen.findByRole(
      'heading',
      { name: /Ottawa Club/i },
      { timeout: 3000 }
    )
    expect(clubHeading).toBeInTheDocument()
  }, 15000)
})
