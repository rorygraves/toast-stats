/* /methodology mobile disclosure (#877, epic #880 Sprint 1).

   At <768px each H2 section collapses by default and expands on tap; the
   in-page TOC anchor links expand their target section. Desktop is
   unaffected (covered by MethodologyPage.test.tsx + the desktop case below,
   where useIsMobile() is false). */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const mockIsMobile = vi.fn()
vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => mockIsMobile(),
}))

import MethodologyPage from '../MethodologyPage'

const renderPage = () =>
  render(
    <MemoryRouter>
      <MethodologyPage />
    </MemoryRouter>
  )

describe('MethodologyPage — mobile collapsed sections', () => {
  beforeEach(() => mockIsMobile.mockReturnValue(true))

  it('renders every H2 section as a disclosure button, collapsed by default', () => {
    renderPage()
    // 10 sections → 10 toggle buttons, all collapsed.
    const toggles = screen
      .getAllByRole('button')
      .filter(b => b.getAttribute('aria-expanded') !== null)
    expect(toggles).toHaveLength(10)
    expect(
      toggles.every(b => b.getAttribute('aria-expanded') === 'false')
    ).toBe(true)
    // A body-only string is present in the DOM but not visible while collapsed.
    expect(
      screen.getByText(/weights all three categories equally/i)
    ).not.toBeVisible()
  })

  it('expands a section when its heading toggle is tapped', async () => {
    renderPage()
    const btn = screen.getByRole('button', { name: /Borda count scoring/i })
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText(/weights all three categories equally/i)
    ).toBeVisible()
  })

  it('expands the target section when a TOC anchor link is tapped', async () => {
    renderPage()
    // The TOC link (an <a>) is distinct from the section toggle (a <button>).
    const tocLink = screen.getByRole('link', { name: /Borda count scoring/i })
    await userEvent.click(tocLink)
    const btn = screen.getByRole('button', { name: /Borda count scoring/i })
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText(/weights all three categories equally/i)
    ).toBeVisible()
  })
})

describe('MethodologyPage — desktop unaffected', () => {
  beforeEach(() => mockIsMobile.mockReturnValue(false))

  it('renders no disclosure toggles and shows all bodies', () => {
    renderPage()
    const toggles = screen
      .queryAllByRole('button')
      .filter(b => b.getAttribute('aria-expanded') !== null)
    expect(toggles).toHaveLength(0)
    expect(
      screen.getByText(/weights all three categories equally/i)
    ).toBeVisible()
  })
})
