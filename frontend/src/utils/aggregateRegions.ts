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
  /** Sum of district aggregate scores. Higher is better. */
  aggregateScore: number
  /** District with highest aggregateScore in this region. */
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

  // Build rollups; sort by region number ascending.
  const rollups: RegionRollup[] = []
  for (const [region, districts] of byRegion) {
    if (districts.length === 0) continue

    const totals = districts.reduce(
      (acc, d) => {
        acc.paidClubs += d.paidClubs ?? 0
        acc.paidClubBase += d.paidClubBase ?? 0
        acc.totalPayments += d.totalPayments ?? 0
        acc.paymentBase += d.paymentBase ?? 0
        acc.distinguishedClubs += d.distinguishedClubs ?? 0
        acc.aggregateScore += d.aggregateScore ?? 0
        return acc
      },
      {
        paidClubs: 0,
        paidClubBase: 0,
        totalPayments: 0,
        paymentBase: 0,
        distinguishedClubs: 0,
        aggregateScore: 0,
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

    rollups.push({
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
      aggregateScore: totals.aggregateScore,
      leadingDistrictId: leading.districtId,
      leadingDistrictName: leading.districtName,
      requirements,
    })
  }

  rollups.sort((a, b) => Number(a.region) - Number(b.region))
  return rollups
}
