/* /history lede (#879, epic #880 Sprint 3 — Epic E).

   The other doc-style long-text route. A one-sentence "what does this page
   answer?" lede sits above the year strip so a reader knows what each
   archived program year shows and which years are on file. */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HistoryPage from '../HistoryPage'

// HistoryPage fetches per-year summary cards (#892); this lede test asserts the
// synchronous header/strip only, so stub the data hook (empty = no cards, the
// year strip stays the sole role="list").
vi.mock('../../hooks/useProgramYearSummaries', () => ({
  useProgramYearSummaries: () => ({
    summaries: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
}))

const renderPage = () =>
  render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>
  )

describe('HistoryPage — "what does this page answer?" lede (#879)', () => {
  it('renders a single lede element', () => {
    renderPage()
    expect(screen.getByTestId('history-lede')).toBeInTheDocument()
  })

  it('the lede summarises what the page answers (per-year standings / archive)', () => {
    renderPage()
    const lede = screen.getByTestId('history-lede').textContent || ''
    expect(lede).toMatch(/year/i)
    expect(lede).toMatch(/archive|on file|frozen|final|standing/i)
  })

  it('the lede appears above the year strip, so it reads first', () => {
    renderPage()
    const lede = screen.getByTestId('history-lede')
    const strip = screen.getByRole('list')
    expect(
      lede.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})
