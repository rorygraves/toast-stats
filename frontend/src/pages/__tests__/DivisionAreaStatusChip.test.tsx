/**
 * Division / Area club mini-tables — mobile status-chip treatment (#871, CC-4).
 *
 * These two mini-tables rendered the raw `currentStatus` enum
 * ("intervention-required") as `whitespace-nowrap` text that clips to
 * "interv…" at 375px. At <768px they must instead render a StatusChip
 * (`.clubs-status-pill`), with the desktop rendering left unchanged
 * ("Desktop unchanged" acceptance criterion).
 *
 * `useIsMobile` is mocked per-test so we exercise both the <768px (chip) and
 * the >=768px (unchanged raw text) branches without a layout engine.
 */
import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { ClubTrend } from '../../hooks/useDistrictAnalytics'
import DivisionPage from '../DivisionPage'
import AreaPage from '../AreaPage'

const mockUseIsMobile = vi.fn(() => false)
vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

const CLUB: ClubTrend = {
  clubId: 'c1',
  clubName: 'Limestone City Club',
  divisionId: 'A',
  divisionName: 'Division A',
  areaId: '01',
  areaName: 'Area 01',
  distinguishedLevel: 'NotDistinguished',
  currentStatus: 'vulnerable',
  riskFactors: [],
  membershipTrend: [{ date: '2025-07-15', count: 18 }],
  dcpGoalsTrend: [{ date: '2025-07-15', goalsAchieved: 3 }],
}

vi.mock('../../hooks/useDistrictAnalytics', async () => {
  const actual = await vi.importActual<
    typeof import('../../hooks/useDistrictAnalytics')
  >('../../hooks/useDistrictAnalytics')
  return {
    ...actual,
    useDistrictAnalytics: vi.fn(() => ({
      data: { allClubs: [CLUB] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })),
  }
})

function renderDivision() {
  return render(
    <MemoryRouter initialEntries={['/district/61/division/A']}>
      <Routes>
        <Route
          path="/district/:districtId/division/:divId"
          element={<DivisionPage />}
        />
      </Routes>
    </MemoryRouter>
  )
}

function renderArea() {
  return render(
    <MemoryRouter initialEntries={['/district/61/division/A/area/01']}>
      <Routes>
        <Route
          path="/district/:districtId/division/:divId/area/:areaId"
          element={<AreaPage />}
        />
      </Routes>
    </MemoryRouter>
  )
}

afterEach(() => {
  cleanup()
  mockUseIsMobile.mockReturnValue(false)
})

describe('Division/Area status chip at <768px (#871 CC-4)', () => {
  it('DivisionPage de-tables to a card list with a status chip on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)
    const { container } = renderDivision()
    // de-tabled: no wide table that would clip the chip at 375px
    expect(container.querySelector('table')).toBeNull()
    expect(container.querySelector('.clubs-card')).not.toBeNull()
    const pill = container.querySelector('.clubs-status-pill')
    expect(pill).not.toBeNull()
    expect(pill).toHaveClass('clubs-status-pill--vulnerable')
    expect(pill).toHaveTextContent('Vulnerable')
    // raw enum must not leak
    expect(container.textContent).not.toContain('vulnerable')
  })

  it('DivisionPage leaves the desktop rendering unchanged (table, raw text, no pill)', () => {
    mockUseIsMobile.mockReturnValue(false)
    const { container } = renderDivision()
    expect(container.querySelector('table')).not.toBeNull()
    expect(container.querySelector('.clubs-status-pill')).toBeNull()
    expect(container.textContent).toContain('vulnerable')
  })

  it('AreaPage de-tables to a card list with a status chip on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)
    const { container } = renderArea()
    expect(container.querySelector('table')).toBeNull()
    const pill = container.querySelector('.clubs-status-pill')
    expect(pill).not.toBeNull()
    expect(pill).toHaveClass('clubs-status-pill--vulnerable')
    expect(
      within(pill as HTMLElement).getByText('Vulnerable')
    ).toBeInTheDocument()
  })

  it('AreaPage leaves the desktop rendering unchanged (table, raw text, no pill)', () => {
    mockUseIsMobile.mockReturnValue(false)
    const { container } = renderArea()
    expect(container.querySelector('table')).not.toBeNull()
    expect(container.querySelector('.clubs-status-pill')).toBeNull()
    expect(container.textContent).toContain('vulnerable')
  })
})
