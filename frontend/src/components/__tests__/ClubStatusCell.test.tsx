import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClubStatusCell } from '../ClubStatusCell'
import type { ClubStatusOverlay } from '../../utils/clubStatusOverlay'

const overlay: ClubStatusOverlay = {
  status: 'Active',
  source: 'dues-renewal',
  activeSince: '2026-05-31',
  asOf: 'June 01, 2026',
}

describe('ClubStatusCell', () => {
  it('renders the base status plainly when there is no overlay', () => {
    render(<ClubStatusCell clubStatus="Low" />)
    expect(screen.getByText('Low')).toBeInTheDocument()
    // No provenance affordance for an un-augmented club.
    expect(screen.queryByText(/renewal verified/i)).not.toBeInTheDocument()
  })

  it('renders an em-dash when there is neither a base status nor an overlay', () => {
    const { container } = render(<ClubStatusCell />)
    expect(container.textContent).toContain('—')
  })

  it('renders the augmented Active status with a visible provenance affordance', () => {
    render(<ClubStatusCell clubStatus="Low" statusOverlay={overlay} />)
    // The augmented status is shown (NOT the base "Low").
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.queryByText('Low')).not.toBeInTheDocument()
    // A visible affordance names the date.
    expect(screen.getByText(/renewal verified 2026-05-31/i)).toBeInTheDocument()
  })

  it('exposes provenance (source + dates + base) accessibly, never silently blending', () => {
    render(<ClubStatusCell clubStatus="Low" statusOverlay={overlay} />)
    const el = screen.getByRole('note')
    const label = el.getAttribute('aria-label') ?? ''
    expect(label).toMatch(/active/i)
    expect(label).toMatch(/dues renewal/i)
    expect(label).toMatch(/2026-05-31/)
    expect(label).toMatch(/June 01, 2026/)
    // discloses the frozen base so two cadences are never presented as one
    expect(label).toMatch(/Low/)
  })

  it('augments a club that has no base status at all (undefined base)', () => {
    render(<ClubStatusCell statusOverlay={overlay} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
