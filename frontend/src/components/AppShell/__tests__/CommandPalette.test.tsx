/* CommandPalette (#422 → omni-search epic #1055 Sprint 2, #1057) — scoped
   tests on the palette component directly (Lesson 51 — keep render scope
   tight). Sprint 2 swaps the districts-only data layer for the unified
   Sprint-1 search index (districts + regions + clubs), grouped by type. */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import CommandPalette from '../CommandPalette'

// The palette now loads the unified index, which fans out to two CDN
// fetches (rankings → districts+regions, club-index → clubs). Mock both.
const fetchCdnRankings = vi.fn()
const fetchCdnClubIndex = vi.fn()

vi.mock('../../../services/cdn', () => ({
  fetchCdnRankings: (...args: unknown[]) => fetchCdnRankings(...args),
  fetchCdnClubIndex: (...args: unknown[]) => fetchCdnClubIndex(...args),
}))

const rankingRow = (
  districtId: string,
  districtName: string,
  region: string
) => ({ districtId, districtName, region })

const setupCdn = (
  opts: {
    rankings?: Array<ReturnType<typeof rankingRow>>
    clubs?: Record<string, { districtId: string; clubName: string }>
  } = {}
) => {
  fetchCdnRankings.mockResolvedValue({
    rankings: opts.rankings ?? [
      rankingRow('57', 'District 57', '7'),
      rankingRow('61', 'District 61', '7'),
    ],
    date: '2025-11-22',
  })
  fetchCdnClubIndex.mockResolvedValue({
    clubs: opts.clubs ?? {
      '12345': { districtId: '61', clubName: 'Toast of the Town' },
    },
  })
}

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

describe('CommandPalette omni-search (#1057)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupCdn()
  })

  it('renders nothing when closed', () => {
    renderPalette(false)
    expect(
      screen.queryByRole('dialog', { name: /universal search/i })
    ).not.toBeInTheDocument()
  })

  it('does not fetch the club index until the palette is opened (lazy)', () => {
    renderPalette(false)
    expect(fetchCdnClubIndex).not.toHaveBeenCalled()
    expect(fetchCdnRankings).not.toHaveBeenCalled()
  })

  it('renders an input + dialog when open', async () => {
    renderPalette(true)
    expect(
      screen.getByRole('dialog', { name: /universal search/i })
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/universal search input/i)).toBeInTheDocument()
    // Loading the index fans out to both CDN fetches on open.
    await vi.waitFor(() => expect(fetchCdnClubIndex).toHaveBeenCalled())
    expect(fetchCdnRankings).toHaveBeenCalled()
  })

  it('finds a district and navigates to /district/<id> (no #422 regression)', async () => {
    renderPalette(true)
    const input = screen.getByLabelText(/universal search input/i)
    fireEvent.change(input, { target: { value: '61' } })

    const listbox = await screen.findByRole('listbox', {
      name: /search results/i,
    })
    const districts = within(listbox).getByRole('group', { name: /districts/i })
    const link = within(districts).getByRole('link')
    expect(link).toHaveTextContent(/District 61/)
    expect(link.getAttribute('href')).toBe('/district/61')
  })

  it('finds a club, shows it under a Clubs group with its district, and routes to the club', async () => {
    renderPalette(true)
    const input = screen.getByLabelText(/universal search input/i)
    fireEvent.change(input, { target: { value: 'Toast' } })

    const listbox = await screen.findByRole('listbox', {
      name: /search results/i,
    })
    const clubs = await within(listbox).findByRole('group', {
      name: /clubs/i,
    })
    const link = within(clubs).getByRole('link')
    expect(link).toHaveTextContent(/Toast of the Town/)
    // Disambiguation context (which district the club belongs to).
    expect(link).toHaveTextContent(/District 61/)
    expect(link.getAttribute('href')).toBe('/district/61/club/12345')
  })

  it('finds a region and routes to /region/<n>', async () => {
    renderPalette(true)
    const input = screen.getByLabelText(/universal search input/i)
    fireEvent.change(input, { target: { value: 'Region 7' } })

    const listbox = await screen.findByRole('listbox', {
      name: /search results/i,
    })
    const regions = await within(listbox).findByRole('group', {
      name: /regions/i,
    })
    const link = within(regions).getByRole('link')
    expect(link).toHaveTextContent(/Region 7/)
    expect(link.getAttribute('href')).toBe('/region/7')
  })

  it('groups results by type with headings when a query spans entities', async () => {
    renderPalette(true)
    const input = screen.getByLabelText(/universal search input/i)
    // "61" matches District 61; widen with a query the club also matches.
    fireEvent.change(input, { target: { value: 'o' } })

    const listbox = await screen.findByRole('listbox', {
      name: /search results/i,
    })
    // At least the Clubs group is present (club name contains "o").
    await within(listbox).findByRole('group', { name: /clubs/i })
  })

  it('shows an empty-state prompt before the user types', async () => {
    renderPalette(true)
    // No query yet → no listbox, a guiding prompt instead.
    expect(
      screen.queryByRole('listbox', { name: /search results/i })
    ).not.toBeInTheDocument()
    expect(screen.getByText(/type to search/i)).toBeInTheDocument()
  })

  it('does not duplicate the district number when districtName is bare (#522)', async () => {
    setupCdn({ rankings: [rankingRow('86', '86', '6')], clubs: {} })
    renderPalette(true)
    const input = screen.getByLabelText(/universal search input/i)
    fireEvent.change(input, { target: { value: '86' } })

    const listbox = await screen.findByRole('listbox', {
      name: /search results/i,
    })
    expect(within(listbox).getByText('D86')).toBeInTheDocument()
    expect(within(listbox).queryByText(/^86$/)).not.toBeInTheDocument()
  })
})
