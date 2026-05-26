/**
 * AppShellTopBar mobile nav disclosure (#735).
 *
 * At ≤768px the primary nav collapses behind a hamburger toggle so the
 * 56px bar no longer overflows the viewport (the ~314px horizontal-scroll
 * bug). These tests cover the disclosure *behaviour* — open/close, escape,
 * outside-click, route-change, and a11y wiring. The actual no-overflow
 * proof lives in the Playwright preview smoke (jsdom has no layout — see
 * lesson 066), not here.
 */

import { describe, it, expect, afterEach } from 'vitest'
import {
  cleanup,
  render,
  screen,
  within,
  fireEvent,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DarkModeProvider } from '../../../contexts/DarkModeContext'
import AppShellTopBar from '../AppShellTopBar'

afterEach(() => cleanup())

const renderBar = () =>
  render(
    <DarkModeProvider>
      <MemoryRouter>
        <AppShellTopBar />
      </MemoryRouter>
    </DarkModeProvider>
  )

const getToggle = () => screen.getByRole('button', { name: /menu/i })

describe('AppShellTopBar mobile nav disclosure (#735)', () => {
  it('renders a nav toggle button wired to the primary nav, collapsed by default', () => {
    renderBar()
    const toggle = getToggle()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    const nav = screen.getByRole('navigation', { name: /primary/i })
    expect(toggle).toHaveAttribute('aria-controls', nav.id)
    expect(nav.id).toBeTruthy()
    expect(nav).toHaveAttribute('data-open', 'false')
  })

  it('keeps every primary nav link in the DOM regardless of open state', () => {
    renderBar()
    const nav = screen.getByRole('navigation', { name: /primary/i })
    for (const name of [
      'Districts',
      'Regions',
      'Awards',
      'History',
      'How it works',
    ]) {
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('opens the nav when the toggle is clicked', () => {
    renderBar()
    const toggle = getToggle()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('navigation', { name: /primary/i })
    ).toHaveAttribute('data-open', 'true')
  })

  it('closes the nav when a nav link is activated', () => {
    renderBar()
    const toggle = getToggle()
    fireEvent.click(toggle)
    const nav = screen.getByRole('navigation', { name: /primary/i })
    fireEvent.click(within(nav).getByRole('link', { name: 'Regions' }))
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(nav).toHaveAttribute('data-open', 'false')
  })

  it('closes the nav when Escape is pressed', () => {
    renderBar()
    const toggle = getToggle()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes the nav when a click lands outside the bar', () => {
    renderBar()
    const toggle = getToggle()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.mouseDown(document.body)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
