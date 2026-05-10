/* District Membership Trend — methodology surfacing (#438).
   Mounts the small chart component directly with a minimal trend
   fixture (Lesson 51 — keep render scope tight). */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MembershipTrendChart } from '../MembershipTrendChart'

const TREND = [
  { date: '2025-07-01', count: 100 },
  { date: '2025-08-01', count: 105 },
  { date: '2025-09-01', count: 110 },
]

describe('MembershipTrendChart — methodology surfacing (#438)', () => {
  it('renders a subtitle that names the metric explicitly (paid members)', () => {
    render(<MembershipTrendChart membershipTrend={TREND} />)
    const heading = screen.getByRole('heading', {
      name: /district membership trend/i,
    })
    const panel = heading.closest('div[aria-label]') as HTMLElement
    expect(panel).toBeTruthy()
    // Subtitle should mention "paid members" — the actual metric being plotted
    expect(within(panel).getByText(/paid members/i)).toBeInTheDocument()
  })

  it('subtitle cites Toastmasters District Performance as the source', () => {
    render(<MembershipTrendChart membershipTrend={TREND} />)
    expect(
      screen.getByText(/Toastmasters District Performance/i)
    ).toBeInTheDocument()
  })

  it('renders an info link to /methodology#district-membership-trend', () => {
    render(<MembershipTrendChart membershipTrend={TREND} />)
    const infoLink = screen.getByRole('link', { name: /^info$/i })
    expect(infoLink).toBeInTheDocument()
    expect(infoLink.getAttribute('href')).toBe(
      '/methodology#district-membership-trend'
    )
  })
})
