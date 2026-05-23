import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LazyComparisonPanel } from '../LazyComparisonPanel'
import type { DistrictRanking } from '../../../types/districts'

// #488 — When the wrapper is asked to render with fewer than 2 pinned
// districts (the default state for most visitors of /), it must not
// reserve a 400px Suspense fallback. ComparisonPanel itself returns
// null in that case, so the skeleton appears, then collapses to 0
// once the lazy chunk loads — a large CLS contributor on the landing
// page.
describe('LazyComparisonPanel (#488)', () => {
  const noop = () => {}

  it('renders nothing — no 400px skeleton — when no districts are pinned', () => {
    const { container } = render(
      <LazyComparisonPanel
        pinnedDistricts={[]}
        allRankings={[]}
        totalDistricts={0}
        onRemove={noop}
        onClearAll={noop}
      />
    )
    expect(container.querySelector('.chart-skeleton')).toBeNull()
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when only 1 district is pinned (panel needs >=2)', () => {
    const one: DistrictRanking[] = [
      {
        districtId: '61',
        districtName: 'District 61',
        region: '8',
        paidClubs: 0,
        totalPayments: 0,
        distinguishedClubs: 0,
        aggregateScore: 0,
        clubsRank: 1,
        paymentsRank: 1,
        distinguishedRank: 1,
        overallRank: 1,
        clubGrowthPercent: 0,
        paymentGrowthPercent: 0,
        distinguishedPercent: 0,
      } as DistrictRanking,
    ]
    const { container } = render(
      <LazyComparisonPanel
        pinnedDistricts={one}
        allRankings={one}
        totalDistricts={1}
        onRemove={noop}
        onClearAll={noop}
      />
    )
    expect(container.querySelector('.chart-skeleton')).toBeNull()
    expect(container.firstChild).toBeNull()
  })
})
