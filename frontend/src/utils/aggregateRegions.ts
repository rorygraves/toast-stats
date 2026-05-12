/* aggregateRegions (#493) — group rankings.json districts by region
   into a leaderboard-ready rollup.

   Powers the /regions overview page (epic #492). The TI dashboard
   itself renders the same data server-side as HTML; this utility lets
   us compute it client-side from the per-district feed we already
   publish, with no pipeline changes. */

import type { DistrictRanking } from '@toastmasters/shared-contracts'

export interface RequirementRatio {
  met: number
  total: number
}

export interface RegionRollup {
  region: string
  districtCount: number
  paidClubs: number
  paidClubBase: number
  /** Derived: (paidClubs − paidClubBase) / paidClubBase × 100. 0 when base is 0. */
  clubGrowthPercent: number
  totalPayments: number
  paymentBase: number
  /** Derived: (totalPayments − paymentBase) / paymentBase × 100. 0 when base is 0. */
  paymentGrowthPercent: number
  distinguishedClubs: number
  /** Derived: distinguishedClubs / paidClubs × 100. 0 when paidClubs is 0. */
  distinguishedPercent: number
  /** Region's rank by clubGrowthPercent. 1 = best across all regions. */
  clubsRank: number
  /** Region's rank by paymentGrowthPercent. 1 = best. */
  paymentsRank: number
  /** Region's rank by distinguishedPercent. 1 = best. */
  distinguishedRank: number
  /** Region-level Borda count (#501): sum of points across the 3
   *  category ranks, where rank #1 gets N points and rank #N gets 1.
   *  With 14 regions the max possible is 42 (1st in all three). This
   *  mirrors the district-level Borda described on /methodology and
   *  is unbiased by region size. */
  aggregateScore: number
  /** District with highest district-level aggregateScore in this region. */
  leadingDistrictId: string
  leadingDistrictName: string
  /** Per-requirement counts: how many districts met / total in region. */
  requirements: {
    dspSubmitted: RequirementRatio
    trainingMet: RequirementRatio
    marketAnalysisSubmitted: RequirementRatio
    communicationPlanSubmitted: RequirementRatio
    regionAdvisorVisitMet: RequirementRatio
  }
}

const REQUIREMENT_KEYS = [
  'dspSubmitted',
  'trainingMet',
  'marketAnalysisSubmitted',
  'communicationPlanSubmitted',
  'regionAdvisorVisitMet',
] as const

/** Region IDs that should be excluded from the leaderboard / grid.
 *  TI uses 'DNAR' for districts that aren't yet assigned to a region;
 *  unknown / empty values fall in the same bucket defensively. */
const isValidRegion = (region: string): boolean => /^\d+$/.test(region)

/** Safe division: 0 when denominator is 0 so we never emit NaN. */
const pct = (num: number, denom: number): number =>
  denom > 0 ? (num / denom) * 100 : 0

/** Assign ranks (1 = highest value) across rollups for a metric. Stable
 *  for ties: insertion order within an equal-value group is preserved. */
function rankBy<
  K extends
    | 'clubGrowthPercent'
    | 'paymentGrowthPercent'
    | 'distinguishedPercent',
>(rollups: ReadonlyArray<RegionRollup>, metric: K): Map<string, number> {
  const indexed = rollups.map((r, idx) => ({
    region: r.region,
    value: r[metric],
    idx,
  }))
  indexed.sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value
    return a.idx - b.idx // stable tie-break
  })
  const ranks = new Map<string, number>()
  indexed.forEach((entry, i) => ranks.set(entry.region, i + 1))
  return ranks
}

export function aggregateRegions(
  rankings: ReadonlyArray<DistrictRanking>
): RegionRollup[] {
  if (rankings.length === 0) return []

  // Group: region → districts in that region.
  const byRegion = new Map<string, DistrictRanking[]>()
  for (const r of rankings) {
    if (!isValidRegion(r.region)) continue
    const list = byRegion.get(r.region) ?? []
    list.push(r)
    byRegion.set(r.region, list)
  }

  // First pass: compute the derived totals + growth percents for each
  // region. aggregateScore + per-category ranks come in the second pass
  // because they depend on cross-region ordering.
  const initial: Omit<
    RegionRollup,
    'clubsRank' | 'paymentsRank' | 'distinguishedRank' | 'aggregateScore'
  >[] = []
  for (const [region, districts] of byRegion) {
    if (districts.length === 0) continue

    const totals = districts.reduce(
      (acc, d) => {
        acc.paidClubs += d.paidClubs ?? 0
        acc.paidClubBase += d.paidClubBase ?? 0
        acc.totalPayments += d.totalPayments ?? 0
        acc.paymentBase += d.paymentBase ?? 0
        acc.distinguishedClubs += d.distinguishedClubs ?? 0
        return acc
      },
      {
        paidClubs: 0,
        paidClubBase: 0,
        totalPayments: 0,
        paymentBase: 0,
        distinguishedClubs: 0,
      }
    )

    const leading = districts.reduce((best, d) =>
      (d.aggregateScore ?? 0) > (best.aggregateScore ?? 0) ? d : best
    )

    const requirements = REQUIREMENT_KEYS.reduce(
      (acc, key) => {
        const met = districts.filter(
          d => (d as unknown as Record<string, unknown>)[key] === true
        ).length
        acc[key] = { met, total: districts.length }
        return acc
      },
      {} as RegionRollup['requirements']
    )

    initial.push({
      region,
      districtCount: districts.length,
      paidClubs: totals.paidClubs,
      paidClubBase: totals.paidClubBase,
      clubGrowthPercent: pct(
        totals.paidClubs - totals.paidClubBase,
        totals.paidClubBase
      ),
      totalPayments: totals.totalPayments,
      paymentBase: totals.paymentBase,
      paymentGrowthPercent: pct(
        totals.totalPayments - totals.paymentBase,
        totals.paymentBase
      ),
      distinguishedClubs: totals.distinguishedClubs,
      distinguishedPercent: pct(totals.distinguishedClubs, totals.paidClubs),
      leadingDistrictId: leading.districtId,
      leadingDistrictName: leading.districtName,
      requirements,
    })
  }

  // Second pass: rank regions in each of the 3 growth categories, then
  // sum the Borda points (N = number of valid regions). With N regions,
  // rank #1 → N points, rank #N → 1 point. Region aggregateScore = sum
  // across the 3 categories. Mirrors the district-level Borda described
  // at /methodology#borda-count (#501).
  const N = initial.length
  const placeholder = initial as RegionRollup[]
  const clubsRanks = rankBy(placeholder, 'clubGrowthPercent')
  const paymentsRanks = rankBy(placeholder, 'paymentGrowthPercent')
  const distinguishedRanks = rankBy(placeholder, 'distinguishedPercent')

  const rollups: RegionRollup[] = initial.map(r => {
    const clubsRank = clubsRanks.get(r.region) ?? N
    const paymentsRank = paymentsRanks.get(r.region) ?? N
    const distinguishedRank = distinguishedRanks.get(r.region) ?? N
    const aggregateScore =
      N - clubsRank + 1 + (N - paymentsRank + 1) + (N - distinguishedRank + 1)
    return {
      ...r,
      clubsRank,
      paymentsRank,
      distinguishedRank,
      aggregateScore,
    }
  })

  rollups.sort((a, b) => Number(a.region) - Number(b.region))
  return rollups
}
