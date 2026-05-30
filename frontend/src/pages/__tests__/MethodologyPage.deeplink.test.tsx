/* /methodology deep-link open-section state (#981, epic #969 Sprint 5).

   The section expand/collapse state is encoded in the URL so reload / back /
   share preserve it:
     - `?openSections=a,b` seeds the open set on mount (round-trips through the
       toggle), and
     - `#section` auto-expands its target on mount (a shared anchor link).

   These mount the page AT the URL (Lesson 144 — the seed path bypasses every
   guard the click path enforces, so it must be exercised directly), not just by
   driving the controls. useIsMobile is forced true so sections are collapsible
   and `aria-expanded` is observable. */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'

const mockIsMobile = vi.fn()
vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => mockIsMobile(),
}))

import MethodologyPage from '../MethodologyPage'

// Surfaces the live router location so assertions can read the URL the page
// writes back (the round-trip half of the contract).
const LocationProbe: React.FC = () => {
  const loc = useLocation()
  return (
    <div data-testid="loc">
      {loc.pathname}
      {loc.search}
      {loc.hash}
    </div>
  )
}

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MethodologyPage />
      <LocationProbe />
    </MemoryRouter>
  )

const toggleFor = (name: RegExp) => screen.getByRole('button', { name })

describe('MethodologyPage — ?openSections seed (#981)', () => {
  beforeEach(() => mockIsMobile.mockReturnValue(true))

  it('expands the sections named in ?openSections on mount', () => {
    renderAt('/methodology?openSections=borda-count,glossary')
    expect(toggleFor(/Borda count scoring/i)).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(toggleFor(/Glossary/i)).toHaveAttribute('aria-expanded', 'true')
    // An unlisted section stays collapsed.
    expect(toggleFor(/Refresh cadence/i)).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('ignores an unknown id in ?openSections (no phantom expand)', () => {
    renderAt('/methodology?openSections=bogus,borda-count')
    expect(toggleFor(/Borda count scoring/i)).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    // Exactly one section open — the bogus id seeded nothing.
    const open = screen
      .getAllByRole('button')
      .filter(b => b.getAttribute('aria-expanded') === 'true')
    expect(open).toHaveLength(1)
  })

  it('round-trips: toggling a section closed updates ?openSections', async () => {
    renderAt('/methodology?openSections=borda-count,glossary')
    await userEvent.click(toggleFor(/Borda count scoring/i))
    expect(toggleFor(/Borda count scoring/i)).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    // The remaining open section is reflected in the URL; the closed one is gone.
    const loc = screen.getByTestId('loc').textContent || ''
    expect(loc).toContain('openSections=glossary')
    expect(loc).not.toContain('borda-count')
  })

  it('round-trips: opening a section adds it to ?openSections', async () => {
    renderAt('/methodology')
    await userEvent.click(toggleFor(/Caveats/i))
    const loc = screen.getByTestId('loc').textContent || ''
    expect(loc).toContain('openSections=caveats')
  })
})

describe('MethodologyPage — #fragment auto-expand on mount (#981)', () => {
  beforeEach(() => mockIsMobile.mockReturnValue(true))

  it('auto-expands the section named in the location hash', () => {
    renderAt('/methodology#borda-count')
    expect(toggleFor(/Borda count scoring/i)).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  it('ignores an unknown fragment', () => {
    renderAt('/methodology#bogus')
    const open = screen
      .getAllByRole('button')
      .filter(b => b.getAttribute('aria-expanded') === 'true')
    expect(open).toHaveLength(0)
  })

  it('expands the fragment target even when ?openSections lists others', () => {
    renderAt('/methodology?openSections=glossary#borda-count')
    expect(toggleFor(/Glossary/i)).toHaveAttribute('aria-expanded', 'true')
    expect(toggleFor(/Borda count scoring/i)).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })
})
