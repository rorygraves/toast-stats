import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { DistrictAnchorToc, type AnchorSection } from '../DistrictAnchorToc'

/* #572 — desktop-only "On this page" anchor TOC. The component takes a
   list of {id,label} entries, renders an <aside> with anchor links,
   and uses IntersectionObserver to mark the currently-visible
   section. JSDOM mocks IntersectionObserver to immediately mark
   observed targets as intersecting, so the first section in document
   order wins by default. */

const sections: AnchorSection[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'trends', label: 'Trends' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'top-clubs', label: 'Top clubs' },
  { id: 'divisions', label: 'Divisions' },
  { id: 'vs-world', label: 'Vs world' },
]

afterEach(() => cleanup())

const mountWithSections = () =>
  render(
    <>
      <DistrictAnchorToc sections={sections} />
      {sections.map(s => (
        <section key={s.id} id={s.id} style={{ minHeight: 600 }}>
          {s.label} content
        </section>
      ))}
    </>
  )

describe('DistrictAnchorToc (#572)', () => {
  it('renders a navigation landmark titled "On this page"', () => {
    mountWithSections()
    expect(
      screen.getByRole('navigation', { name: /on this page/i })
    ).toBeInTheDocument()
  })

  it('renders an anchor link for each section pointing at its id', () => {
    mountWithSections()
    for (const s of sections) {
      const link = screen.getByRole('link', { name: s.label })
      expect(link).toHaveAttribute('href', `#${s.id}`)
    }
  })

  it('marks the first observed section as the current anchor', () => {
    mountWithSections()
    // The setup mock fires isIntersecting=true on every observe() call.
    // The first section observed is "overview" — so it should win.
    const overviewLink = screen.getByRole('link', { name: 'Overview' })
    expect(overviewLink).toHaveAttribute('aria-current', 'true')
  })

  it('returns null when no sections are provided', () => {
    const { container } = render(<DistrictAnchorToc sections={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
