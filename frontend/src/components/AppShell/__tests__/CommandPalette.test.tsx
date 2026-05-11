/* CommandPalette (#422) — scoped tests on the small palette component
   directly (Lesson 51 — keep render scope tight). */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import CommandPalette from '../CommandPalette'

// Mock CDN service — palette fetches via fetchCdnRankings.
vi.mock('../../../services/cdn', () => ({
  fetchCdnRankings: vi.fn().mockResolvedValue({
    rankings: [
      {
        districtId: '57',
        districtName: 'District 57',
        region: '7',
        paidClubs: 100,
        paidClubBase: 90,
        clubGrowthPercent: 11.1,
        totalPayments: 5000,
        paymentBase: 4500,
        paymentGrowthPercent: 11.1,
        activeClubs: 100,
        distinguishedClubs: 50,
        selectDistinguished: 20,
        presidentsDistinguished: 10,
        distinguishedPercent: 50,
        clubsRank: 1,
        paymentsRank: 1,
        distinguishedRank: 1,
        aggregateScore: 300,
        overallRank: 1,
      },
      {
        districtId: '61',
        districtName: 'District 61',
        region: '7',
        paidClubs: 100,
        paidClubBase: 90,
        clubGrowthPercent: 11.1,
        totalPayments: 5000,
        paymentBase: 4500,
        paymentGrowthPercent: 11.1,
        activeClubs: 100,
        distinguishedClubs: 50,
        selectDistinguished: 20,
        presidentsDistinguished: 10,
        distinguishedPercent: 50,
        clubsRank: 2,
        paymentsRank: 2,
        distinguishedRank: 2,
        aggregateScore: 250,
        overallRank: 2,
      },
    ],
    date: '2025-11-22',
  }),
}))

const renderPalette = (isOpen: boolean) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CommandPalette isOpen={isOpen} onClose={() => {}} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('CommandPalette (#422)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    renderPalette(false)
    expect(
      screen.queryByRole('dialog', { name: /universal search/i })
    ).not.toBeInTheDocument()
  })

  it('renders an input + listbox when open', async () => {
    renderPalette(true)
    expect(
      screen.getByRole('dialog', { name: /universal search/i })
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/universal search input/i)).toBeInTheDocument()
    // Wait for the rankings query to resolve and results to render
    await screen.findByRole('listbox', { name: /search results/i })
  })

  it('filters results as the user types', async () => {
    renderPalette(true)
    await screen.findByRole('listbox', { name: /search results/i })

    const input = screen.getByLabelText(/universal search input/i)
    fireEvent.change(input, { target: { value: '61' } })

    const listbox = screen.getByRole('listbox', { name: /search results/i })
    const options = within(listbox).getAllByRole('option')
    expect(options.length).toBe(1)
    expect(options[0]?.textContent).toMatch(/District 61/)
  })

  it('renders a Link with href /district/<id> for each result', async () => {
    renderPalette(true)
    await screen.findByRole('listbox', { name: /search results/i })
    const listbox = screen.getByRole('listbox')
    const links = within(listbox).getAllByRole('link')
    expect(links[0]?.getAttribute('href')).toBe('/district/57')
    expect(links[1]?.getAttribute('href')).toBe('/district/61')
  })
})
