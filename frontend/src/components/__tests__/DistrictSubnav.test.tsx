import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe, toHaveNoViolations } from 'jest-axe'
import { DistrictSubnav, DISTRICT_SECTIONS } from '../DistrictSubnav'

expect.extend(toHaveNoViolations)

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <DistrictSubnav districtId="61" />
    </MemoryRouter>
  )

describe('DistrictSubnav (#678, ADR-005 §3)', () => {
  it('renders a nav labelled "District sections" — distinct from the breadcrumb', () => {
    renderAt('/district/61')
    expect(
      screen.getByRole('navigation', { name: 'District sections' })
    ).toBeInTheDocument()
    // It is NOT the breadcrumb affordance.
    expect(
      screen.queryByRole('navigation', { name: 'Breadcrumb' })
    ).not.toBeInTheDocument()
  })

  it('renders one link per live section with the right hrefs', () => {
    renderAt('/district/61')
    const expected: Record<string, string> = {
      Overview: '/district/61',
      'What Changed': '/district/61/changes',
      Clubs: '/district/61/clubs',
      Divisions: '/district/61/divisions',
      Trends: '/district/61/trends',
      Analytics: '/district/61/analytics',
      Rankings: '/district/61/rankings',
    }
    for (const [label, href] of Object.entries(expected)) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute(
        'href',
        href
      )
    }
  })

  it('lists Trends and Analytics now that their routes exist (#680)', () => {
    renderAt('/district/61')
    expect(screen.getByRole('link', { name: 'Trends' })).toHaveAttribute(
      'href',
      '/district/61/trends'
    )
    expect(screen.getByRole('link', { name: 'Analytics' })).toHaveAttribute(
      'href',
      '/district/61/analytics'
    )
    // ADR-005 §3 order: lateral views read Overview · Clubs · Divisions ·
    // Trends · Analytics · Rankings.
    expect(DISTRICT_SECTIONS.map(s => s.label)).toEqual([
      'Overview',
      'What Changed',
      'Clubs',
      'Divisions',
      'Trends',
      'Analytics',
      'Rankings',
    ])
  })

  it('marks Trends active on the trends route (#680)', () => {
    renderAt('/district/61/trends')
    expect(screen.getByRole('link', { name: 'Trends' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('marks the active route with aria-current="page" (Clubs)', () => {
    renderAt('/district/61/clubs')
    expect(screen.getByRole('link', { name: 'Clubs' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('link', { name: 'Divisions' })).not.toHaveAttribute(
      'aria-current'
    )
  })

  it('marks Overview active only at the exact hub, not on sub-routes (end match)', () => {
    renderAt('/district/61')
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('does NOT mark Overview active when on a sub-route', () => {
    renderAt('/district/61/divisions')
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute(
      'aria-current'
    )
    expect(screen.getByRole('link', { name: 'Divisions' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('has no axe violations', async () => {
    const { container } = renderAt('/district/61/clubs')
    expect(await axe(container)).toHaveNoViolations()
  })
})
