/**
 * AppShellTopBar mobile "About ▾" disclosure (#889).
 *
 * Epic H Sprint 1: at <768px the full footer chrome is dropped and its
 * version + license meta is surfaced behind a tappable "About ▾" inside
 * the hamburger nav. Desktop keeps the footer and shows no About control.
 *
 * These tests cover the disclosure's *presence and contents* per
 * breakpoint. The no-overflow / above-the-fold proof lives in the
 * Playwright preview smoke (jsdom has no layout — lesson 066).
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DarkModeProvider } from '../../../contexts/DarkModeContext'

vi.mock('../../../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

import { useIsMobile } from '../../../hooks/useIsMobile'
import AppShellTopBar from '../AppShellTopBar'

afterEach(() => cleanup())
beforeEach(() => vi.mocked(useIsMobile).mockReturnValue(false))

const renderBar = () =>
  render(
    <DarkModeProvider>
      <MemoryRouter>
        <AppShellTopBar />
      </MemoryRouter>
    </DarkModeProvider>
  )

describe('AppShellTopBar "About ▾" disclosure (#889)', () => {
  describe('mobile (<768px)', () => {
    beforeEach(() => vi.mocked(useIsMobile).mockReturnValue(true))

    it('renders an "About" disclosure inside the primary nav', () => {
      renderBar()
      const nav = screen.getByRole('navigation', { name: /primary/i })
      const details = within(nav).getByText('About').closest('details')
      expect(details).not.toBeNull()
    })

    it('keeps the disclosure collapsed by default', () => {
      renderBar()
      const nav = screen.getByRole('navigation', { name: /primary/i })
      const details = within(nav).getByText('About').closest('details')
      expect(details).not.toHaveAttribute('open')
    })

    it('exposes the version + MIT License inside the disclosure', () => {
      renderBar()
      const nav = screen.getByRole('navigation', { name: /primary/i })
      const details = within(nav).getByText('About').closest('details')!
      expect(within(details).getByTestId('app-version')).toBeInTheDocument()
      expect(
        within(details).getByRole('link', { name: /mit license/i })
      ).toBeInTheDocument()
      // Version slot is non-empty and well-formed (no double-v / bare-v).
      const text = details.textContent ?? ''
      expect(text).toMatch(/MIT License\s*·\s*(?:v\d|dev)/i)
      expect(text).not.toMatch(/v\s*v/i)
      expect(text).not.toMatch(/vdev/i)
    })
  })

  describe('desktop (≥768px)', () => {
    it('renders no "About" control in the bar (footer carries the meta)', () => {
      renderBar()
      expect(screen.queryByText('About')).not.toBeInTheDocument()
      expect(screen.queryByTestId('app-version')).not.toBeInTheDocument()
    })
  })
})
