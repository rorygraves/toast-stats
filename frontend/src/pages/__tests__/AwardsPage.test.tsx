/* /awards page (#370 / #371-#373).
   Mounts AwardsPage with mocked useCompetitiveAwards data so the test
   stays small (no full-app mount). */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { CompetitiveAwardStandings } from '../../services/cdn'

const mockStandings: CompetitiveAwardStandings = {
  metadata: {
    snapshotId: '2026-04-15',
    calculatedAt: '2026-04-15T00:00:00.000Z',
    totalDistricts: 117,
  },
  extensionAward: [
    {
      districtId: '17',
      districtName: 'District 17',
      region: '5',
      rank: 1,
      value: 14,
      isWinner: false,
    },
    {
      districtId: '60',
      districtName: 'District 60',
      region: '8',
      rank: 2,
      value: 10,
      isWinner: false,
    },
    {
      districtId: '93',
      districtName: 'District 93',
      region: '11',
      rank: 3,
      value: 9,
      isWinner: false,
    },
  ],
  twentyPlusAward: [
    {
      districtId: '60',
      districtName: 'District 60',
      region: '8',
      rank: 1,
      value: 22,
      isWinner: true,
    },
    {
      districtId: '57',
      districtName: 'District 57',
      region: '1',
      rank: 2,
      value: 18,
      isWinner: true,
    },
  ],
  retentionAward: [
    {
      districtId: '102',
      districtName: 'District 102',
      region: '14',
      rank: 1,
      value: 94.1,
      isWinner: true,
    },
  ],
  byDistrict: {},
}

vi.mock('../../hooks/useCompetitiveAwards', () => ({
  useCompetitiveAwards: () => ({
    data: mockStandings,
    isLoading: false,
    isError: false,
  }),
}))

import AwardsPage from '../AwardsPage'

const renderPage = () =>
  render(
    <MemoryRouter>
      <AwardsPage />
    </MemoryRouter>
  )

describe('AwardsPage (#371-#373)', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('page header', () => {
    it('renders the eyebrow + h1 + lede', () => {
      renderPage()
      expect(screen.getByText(/awards · 117 districts/i)).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { level: 1, name: /district awards/i })
      ).toBeInTheDocument()
      expect(
        screen.getByText(/competitive district-level awards/i)
      ).toBeInTheDocument()
    })

    it('links to /methodology section for Borda details (#373)', () => {
      renderPage()
      const links = screen.getAllByRole('link', { name: /methodology/i })
      const methodology = links.find(l =>
        l.getAttribute('href')?.startsWith('/methodology')
      )
      expect(methodology).toBeDefined()
    })
  })

  describe('award leaderboards', () => {
    it("renders President's Extension Award with all 3 fixture rows", () => {
      renderPage()
      const heading = screen.getByRole('heading', {
        name: /president'?s extension award/i,
      })
      const section = heading.closest('section')
      expect(section).toBeTruthy()
      expect(within(section!).getByText('District 17')).toBeInTheDocument()
      expect(within(section!).getByText('District 60')).toBeInTheDocument()
      expect(within(section!).getByText('District 93')).toBeInTheDocument()
    })

    it('marks Achieved status on awards with winners (#372)', () => {
      renderPage()
      const heading = screen.getByRole('heading', {
        name: /20-plus award/i,
      })
      const section = heading.closest('section')
      expect(within(section!).getByText(/achieved/i)).toBeInTheDocument()
    })

    it('links each district to its detail page', () => {
      renderPage()
      const link = screen.getByRole('link', { name: /district 17/i })
      expect(link).toHaveAttribute('href', '/district/17')
    })
  })
})
