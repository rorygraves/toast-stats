/* District detail header redesign chrome (#358).

   Mounts the extracted DistrictDetailHeader component directly — NOT
   the full DistrictDetailPage — so the test stays well under the
   global 5s testTimeout even when --coverage is enabled. The full-page
   integration is exercised by other DistrictDetailPage.*.test.tsx files
   that already smoke-test the header indirectly. */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MemoryRouter } from 'react-router-dom'
import { DistrictDetailHeader } from '../../components/DistrictDetailHeader'
import type { ProgramYear } from '../../utils/programYear'

const mockProgramYear: ProgramYear = {
  year: 2025,
  startDate: '2025-07-01',
  endDate: '2026-06-30',
  label: '2025-2026',
}

const renderHeader = (
  overrides: Partial<React.ComponentProps<typeof DistrictDetailHeader>> = {}
) => {
  const defaultProps: React.ComponentProps<typeof DistrictDetailHeader> = {
    districtId: '57',
    districtName: 'District 57',
    selectedProgramYear: mockProgramYear,
    setSelectedProgramYear: () => {},
    availableProgramYears: [mockProgramYear],
    selectedDate: undefined,
    onDateChange: () => {},
    availableDates: ['2025-11-22', '2025-10-15'],
    ...overrides,
  }
  return render(
    <MemoryRouter>
      <DistrictDetailHeader {...defaultProps} />
    </MemoryRouter>
  )
}

describe('DistrictDetailHeader (#358)', () => {
  describe('breadcrumbs (#442 — removed)', () => {
    it('does NOT render a breadcrumb (would duplicate AppShell nav + H1)', () => {
      renderHeader()
      expect(
        screen.queryByRole('navigation', { name: /breadcrumb/i })
      ).not.toBeInTheDocument()
    })
  })

  describe('page header', () => {
    it('renders the program-year eyebrow (en-dash format)', () => {
      renderHeader()
      expect(screen.getByText(/program year 2025[–-]2026/i)).toBeInTheDocument()
    })

    it('renders the redesigned h1 "District N"', () => {
      renderHeader()
      expect(
        screen.getByRole('heading', { level: 1, name: /^district 57$/i })
      ).toBeInTheDocument()
    })

    it('renders a lede paragraph below the h1', () => {
      renderHeader()
      expect(screen.getByTestId('district-detail-lede')).toBeInTheDocument()
    })
  })

  describe('action cluster', () => {
    it('keeps the existing program-year + date selectors visible', () => {
      renderHeader()
      expect(screen.getByLabelText(/view specific date/i)).toBeInTheDocument()
    })

    it('renders an Export button', () => {
      renderHeader()
      expect(
        screen.getByRole('button', { name: /export/i })
      ).toBeInTheDocument()
    })

    it('renders a Share button', () => {
      renderHeader()
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
    })
  })

  describe('lesson 49/50 nesting check', () => {
    it('does not declare nested min-height: 100vh inside AppShell', () => {
      // Static guard: the .district-detail-page-root rule must NOT set
      // min-height because AppShell already owns the viewport wrapper.
      const css = readFileSync(
        resolve(__dirname, '../../styles/components/app-shell.css'),
        'utf-8'
      )
      const rule = css.match(
        /\.district-detail-page-root\s*\{([\s\S]*?)\n\s*\}/
      )
      expect(rule).toBeTruthy()
      const stripped = (rule?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(stripped).not.toMatch(/min-height\s*:\s*100vh\s*;/)
    })
  })
})
