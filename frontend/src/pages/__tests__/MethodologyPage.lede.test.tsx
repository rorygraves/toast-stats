/* /methodology lede (#879, epic #880 Sprint 3 — Epic E).

   A one-sentence "what does this page answer?" lede sits above the section
   list so a (mobile) reader can decide whether to dive into the ~16,000px of
   prose. See docs/design/mobile-ux-audit-2026-05-28.md §14 / Epic E. */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MethodologyPage from '../MethodologyPage'

const renderPage = () =>
  render(
    <MemoryRouter>
      <MethodologyPage />
    </MemoryRouter>
  )

describe('MethodologyPage — "what does this page answer?" lede (#879)', () => {
  it('renders a single lede element', () => {
    renderPage()
    expect(screen.getByTestId('methodology-lede')).toBeInTheDocument()
  })

  it('the lede summarises what the page answers (data source, ranking, definitions)', () => {
    renderPage()
    const lede = screen.getByTestId('methodology-lede').textContent || ''
    // It frames the questions the page resolves, not just "what this is".
    expect(lede).toMatch(/rank/i)
    expect(lede).toMatch(/tier|health|label|defin/i)
  })

  it('the lede appears above the section list (TOC), so it reads first', () => {
    renderPage()
    const lede = screen.getByTestId('methodology-lede')
    const toc = screen.getByRole('navigation', { name: /on this page/i })
    // DOM order: lede must precede the TOC nav.
    expect(
      lede.compareDocumentPosition(toc) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})
