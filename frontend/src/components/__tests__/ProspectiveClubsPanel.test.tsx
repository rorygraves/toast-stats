import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProspectiveClubsPanel } from '../ProspectiveClubsPanel'

/* #489 — Prospective (FAC-only) clubs panel. Renders below ClubsTable
   on /district/:id/clubs. Invisible when the list is empty so 95%
   of districts (which have zero ATOs) see no extra chrome. */

describe('ProspectiveClubsPanel', () => {
  it('renders nothing when the list is empty', () => {
    const { container } = render(<ProspectiveClubsPanel clubs={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when the list is undefined', () => {
    const { container } = render(<ProspectiveClubsPanel clubs={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a heading with the count when the list is non-empty', () => {
    render(
      <ProspectiveClubsPanel
        clubs={[
          {
            clubId: '00088888',
            clubName: 'New ATO Toastmasters',
            city: 'Ottawa',
            region: 'ON',
            country: 'Canada',
            isProspective: true,
          },
        ]}
      />
    )
    // Heading should communicate the count and the surface
    const heading = screen.getByRole('heading', { name: /prospective clubs/i })
    expect(heading).toBeInTheDocument()
    expect(heading.textContent).toMatch(/1/)
  })

  it('renders each club name and location', () => {
    render(
      <ProspectiveClubsPanel
        clubs={[
          {
            clubId: '00088888',
            clubName: 'New ATO Toastmasters',
            city: 'Ottawa',
            region: 'ON',
            country: 'Canada',
            isProspective: true,
          },
          {
            clubId: '00099999',
            clubName: 'Second Prospective Club',
            city: 'Montreal',
            region: 'QC',
            country: 'Canada',
            isProspective: true,
          },
        ]}
      />
    )
    expect(screen.getByText(/New ATO Toastmasters/)).toBeInTheDocument()
    expect(screen.getByText(/Second Prospective Club/)).toBeInTheDocument()
    // Location should be visible as a hint
    expect(screen.getAllByText(/Ottawa.*ON/i).length).toBeGreaterThan(0)
  })

  it('explains the surface in a caption so the panel is self-documenting', () => {
    render(
      <ProspectiveClubsPanel
        clubs={[
          {
            clubId: '00088888',
            clubName: 'New ATO Toastmasters',
            isProspective: true,
          },
        ]}
      />
    )
    // The caption must mention Find-A-Club / ATO concept so a district
    // director sees this and understands the provenance immediately.
    // textContent on the <section> also matches, so we pin to the <p>.
    expect(screen.getByText(/typically ATO/i)).toBeInTheDocument()
  })

  it('shows charter date when present', () => {
    render(
      <ProspectiveClubsPanel
        clubs={[
          {
            clubId: '00088888',
            clubName: 'Newly Chartered Club',
            charterDate: '2026-04-15',
          },
        ]}
      />
    )
    expect(screen.getByText(/2026-04-15|Apr.*2026/i)).toBeInTheDocument()
  })
})
