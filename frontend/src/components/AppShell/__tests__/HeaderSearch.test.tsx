/* HeaderSearch (omni-search epic #1055 Sprint 3, #1058) — the header entry
   point to the unified search. Two presentations of ONE behavior:
   - desktop (≥768px): an inline combobox with a typeahead dropdown
   - mobile  (<768px): a search-icon button that opens the modal palette
   Cmd-K continues to open the modal everywhere (owned by AppShell, not here). */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import HeaderSearch from '../HeaderSearch'
import { useIsMobile } from '../../../hooks/useIsMobile'

const fetchCdnRankings = vi.fn()
const fetchCdnClubIndex = vi.fn()

vi.mock('../../../services/cdn', () => ({
  fetchCdnRankings: (...args: unknown[]) => fetchCdnRankings(...args),
  fetchCdnClubIndex: (...args: unknown[]) => fetchCdnClubIndex(...args),
}))

vi.mock('../../../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

const setupCdn = () => {
  fetchCdnRankings.mockResolvedValue({
    rankings: [
      { districtId: '57', districtName: 'District 57', region: '7' },
      { districtId: '61', districtName: 'District 61', region: '7' },
    ],
    date: '2025-11-22',
  })
  fetchCdnClubIndex.mockResolvedValue({
    clubs: { '12345': { districtId: '61', clubName: 'Toast of the Town' } },
  })
}

const renderHeaderSearch = (onOpenSearch = () => {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HeaderSearch onOpenSearch={onOpenSearch} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('HeaderSearch (#1058)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupCdn()
    vi.mocked(useIsMobile).mockReturnValue(false)
  })

  describe('desktop (≥768px)', () => {
    beforeEach(() => vi.mocked(useIsMobile).mockReturnValue(false))

    it('renders an inline combobox, not a modal-opening icon', () => {
      renderHeaderSearch()
      expect(
        screen.getByRole('combobox', { name: /search districts, regions/i })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /^search$/i })
      ).not.toBeInTheDocument()
    })

    it('is lazy — does not fetch the index until the input is focused', () => {
      renderHeaderSearch()
      expect(fetchCdnRankings).not.toHaveBeenCalled()
      expect(fetchCdnClubIndex).not.toHaveBeenCalled()
    })

    it('fetches the index once focused and shows grouped results when typing', async () => {
      renderHeaderSearch()
      const input = screen.getByRole('combobox', {
        name: /search districts, regions/i,
      })
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '61' } })

      const listbox = await screen.findByRole('listbox', {
        name: /search results/i,
      })
      const districts = within(listbox).getByRole('group', {
        name: /districts/i,
      })
      const link = within(districts).getByRole('link')
      expect(link).toHaveTextContent(/District 61/)
      expect(link.getAttribute('href')).toBe('/district/61')
      await vi.waitFor(() => expect(fetchCdnClubIndex).toHaveBeenCalled())
    })

    it('marks the combobox expanded only while results are shown', async () => {
      renderHeaderSearch()
      const input = screen.getByRole('combobox', {
        name: /search districts, regions/i,
      })
      expect(input).toHaveAttribute('aria-expanded', 'false')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '61' } })
      await screen.findByRole('listbox', { name: /search results/i })
      expect(input).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('mobile (<768px)', () => {
    beforeEach(() => vi.mocked(useIsMobile).mockReturnValue(true))

    it('renders a search-icon button, not an inline combobox', () => {
      renderHeaderSearch()
      expect(
        screen.getByRole('button', { name: /^search$/i })
      ).toBeInTheDocument()
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('opens the modal palette when the icon is clicked', () => {
      const onOpenSearch = vi.fn()
      renderHeaderSearch(onOpenSearch)
      fireEvent.click(screen.getByRole('button', { name: /^search$/i }))
      expect(onOpenSearch).toHaveBeenCalledTimes(1)
    })

    it('does not fetch the index (no inline search on mobile)', () => {
      renderHeaderSearch()
      expect(fetchCdnRankings).not.toHaveBeenCalled()
      expect(fetchCdnClubIndex).not.toHaveBeenCalled()
    })
  })
})
