import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import {
  cleanup,
  render,
  screen,
  within,
  fireEvent,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { DistrictKpiStrip } from '../DistrictKpiStrip'
import type { MetricRankings, RecognitionTargets } from '../../types/districts'

/* #572 — sticky KPI strip extracted from DistrictOverview. Presentational
   only: takes already-loaded KPI values + targets and renders three
   KpiBulletCards inside a sticky-positioned container. Mobile gets a
   collapsible affordance persisted via sessionStorage. */

const rankings: MetricRankings = {
  worldRank: 30,
  worldPercentile: 77,
  regionRank: 3,
  totalDistricts: 128,
  totalInRegion: 11,
  region: '05',
}

const targets: RecognitionTargets = {
  distinguished: 158,
  select: 161,
  presidents: 164,
  smedley: 169,
}

const sampleKpis = {
  paidClubs: { current: 149, targets, rankings },
  membershipPayments: { current: 12500, targets, rankings },
  distinguishedClubs: { current: 84, targets, rankings },
}

const renderStrip = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

beforeEach(() => {
  window.sessionStorage.clear()
})
afterEach(() => cleanup())

describe('DistrictKpiStrip (#572)', () => {
  it('renders the three KPI cards inside a labelled landmark', () => {
    renderStrip(<DistrictKpiStrip kpis={sampleKpis} />)
    const strip = screen.getByRole('region', { name: /key district metrics/i })
    expect(within(strip).getByText('Paid Clubs')).toBeInTheDocument()
    expect(within(strip).getByText('Membership Payments')).toBeInTheDocument()
    expect(within(strip).getByText('Distinguished Clubs')).toBeInTheDocument()
  })

  it('applies the sticky-positioning hook class', () => {
    const { container } = renderStrip(<DistrictKpiStrip kpis={sampleKpis} />)
    expect(container.querySelector('.district-kpi-strip')).toBeInTheDocument()
  })

  it('shows a collapse toggle button on the strip', () => {
    renderStrip(<DistrictKpiStrip kpis={sampleKpis} />)
    expect(
      screen.getByRole('button', { name: /collapse kpi/i })
    ).toBeInTheDocument()
  })

  it('toggles to the compact summary row when the chevron is clicked', () => {
    renderStrip(<DistrictKpiStrip kpis={sampleKpis} />)
    const toggle = screen.getByRole('button', { name: /collapse kpi/i })
    fireEvent.click(toggle)
    // After collapse the cards are gone; a summary row replaces them.
    expect(screen.queryByText('Paid Clubs')).not.toBeInTheDocument()
    expect(screen.getByTestId('district-kpi-strip-summary')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /expand kpi/i })
    ).toBeInTheDocument()
  })

  it('persists the collapsed state in sessionStorage', () => {
    renderStrip(<DistrictKpiStrip kpis={sampleKpis} />)
    fireEvent.click(screen.getByRole('button', { name: /collapse kpi/i }))
    expect(window.sessionStorage.getItem('district-kpi-strip-collapsed')).toBe(
      'true'
    )
  })

  it('restores the collapsed state from sessionStorage on mount', () => {
    window.sessionStorage.setItem('district-kpi-strip-collapsed', 'true')
    renderStrip(<DistrictKpiStrip kpis={sampleKpis} />)
    expect(screen.queryByText('Paid Clubs')).not.toBeInTheDocument()
    expect(screen.getByTestId('district-kpi-strip-summary')).toBeInTheDocument()
  })

  it('renders a compact loading skeleton when kpis is null', () => {
    renderStrip(<DistrictKpiStrip kpis={null} />)
    expect(
      screen.getByTestId('district-kpi-strip-skeleton')
    ).toBeInTheDocument()
  })
})
