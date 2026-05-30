/**
 * Unit tests for ProgramYearSummaryCards (#892).
 *
 * Presentational: takes the summaries + query state as props and renders the
 * /history per-year cards. No data fetching here (that's the hook's job).
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProgramYearSummaryCards } from '../ProgramYearSummaryCards'
import type { ProgramYearSummary } from '../../utils/programYearSummary'

const summary = (over: Partial<ProgramYearSummary>): ProgramYearSummary => ({
  startYear: 2024,
  label: '2024-25',
  yearEndDate: '2025-06-30',
  totalDistricts: 126,
  totalPaidClubs: 14266,
  totalPayments: 549577,
  totalDistinguishedClubs: 6460,
  topDistricts: [
    {
      districtId: '94',
      districtName: 'District 94',
      region: '11',
      overallRank: 1,
    },
    {
      districtId: '42',
      districtName: 'District 42',
      region: '7',
      overallRank: 2,
    },
  ],
  ...over,
})

const renderCards = (
  props: Partial<React.ComponentProps<typeof ProgramYearSummaryCards>>
) =>
  render(
    <MemoryRouter>
      <ProgramYearSummaryCards
        summaries={[]}
        isLoading={false}
        isError={false}
        {...props}
      />
    </MemoryRouter>
  )

describe('ProgramYearSummaryCards (#892)', () => {
  it('reserves space with skeleton cards while loading (CLS — Lesson 79/125)', () => {
    renderCards({ isLoading: true })
    expect(
      screen.getAllByTestId('history-year-card-skeleton').length
    ).toBeGreaterThan(0)
  })

  it('shows an error notice when the fetch failed', () => {
    renderCards({ isError: true })
    expect(screen.getByRole('status')).toHaveTextContent(/load|try again/i)
  })

  it('shows an empty notice when no completed years are on file', () => {
    renderCards({ summaries: [] })
    expect(screen.getByRole('status')).toHaveTextContent(
      /no completed program years/i
    )
  })

  it('renders one card per summary, in the order given (newest first)', () => {
    renderCards({
      summaries: [
        summary({ startYear: 2024, label: '2024-25' }),
        summary({ startYear: 2023, label: '2023-24' }),
      ],
    })
    const cards = screen.getAllByTestId('history-year-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('2024-25')
    expect(cards[1]).toHaveTextContent('2023-24')
  })

  it('shows headline aggregate metrics, thousands-separated', () => {
    renderCards({ summaries: [summary({})] })
    const card = screen.getByTestId('history-year-card')
    expect(within(card).getByText('14,266')).toBeInTheDocument()
    expect(within(card).getByText('549,577')).toBeInTheDocument()
    expect(within(card).getByText('6,460')).toBeInTheDocument()
  })

  it('lists the top districts with their final rank', () => {
    renderCards({ summaries: [summary({})] })
    const card = screen.getByTestId('history-year-card')
    expect(within(card).getByText(/District 94/)).toBeInTheDocument()
    expect(within(card).getByText(/District 42/)).toBeInTheDocument()
  })

  it('links each card into the landing page filtered to that program year', () => {
    renderCards({ summaries: [summary({ startYear: 2023, label: '2023-24' })] })
    const link = screen.getByRole('link', { name: /2023-24/i })
    expect(link).toHaveAttribute('href', '/?py=2023')
  })
})
