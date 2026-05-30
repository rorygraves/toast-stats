/**
 * programYearSummary (#892, epic #893) — pure aggregation for the /history
 * per-year summary cards.
 *
 * The cards are assembled entirely from EXISTING CDN endpoints (no new
 * pipeline step): the dates index gives each completed program year's
 * year-end snapshot date, and that date's all-districts rankings give every
 * district's final standing. This module turns one year's rankings array into
 * the card's view-model: headline aggregate metrics + the top-5 districts.
 */

/** The subset of a CDN ranking entry the summary needs. */
export interface DistrictRankingLite {
  districtId: string
  districtName: string
  region: string
  overallRank: number
  aggregateScore: number
  paidClubs: number
  totalPayments: number
  distinguishedClubs: number
}

/** One of the top-N districts shown on a card. */
export interface TopDistrict {
  districtId: string
  districtName: string
  region: string
  overallRank: number
}

/** View-model for a single program-year summary card. */
export interface ProgramYearSummary {
  /** Calendar year the program year started (e.g. 2024 for 2024-25). */
  startYear: number
  /** Compact display label, e.g. "2024-25". */
  label: string
  /** The year-end snapshot date the standings are frozen at, e.g. "2025-06-30". */
  yearEndDate: string
  /** Number of districts ranked that year. */
  totalDistricts: number
  /** Sum of paid clubs across all districts. */
  totalPaidClubs: number
  /** Sum of total payments across all districts. */
  totalPayments: number
  /** Sum of distinguished clubs across all districts. */
  totalDistinguishedClubs: number
  /** Up to `topN` districts, best overall rank first. */
  topDistricts: TopDistrict[]
}

export const DEFAULT_TOP_N = 5

/**
 * Build the view-model for one program year's summary card from that year's
 * year-end all-districts rankings.
 *
 * @param startYear   Calendar year the program year started (2024 → "2024-25").
 * @param yearEndDate The snapshot date the standings are frozen at.
 * @param rankings    Every district's final standing for the year.
 * @param topN        How many top districts to surface (default 5).
 */
export function buildProgramYearSummary(
  startYear: number,
  yearEndDate: string,
  rankings: DistrictRankingLite[],
  topN: number = DEFAULT_TOP_N
): ProgramYearSummary {
  const totals = rankings.reduce(
    (acc, d) => {
      acc.totalPaidClubs += d.paidClubs
      acc.totalPayments += d.totalPayments
      acc.totalDistinguishedClubs += d.distinguishedClubs
      return acc
    },
    { totalPaidClubs: 0, totalPayments: 0, totalDistinguishedClubs: 0 }
  )

  // overallRank can tie (a real shape in the CDN data); break ties
  // deterministically so the card order is stable across renders (Lesson 120):
  // higher aggregateScore first, then districtId as a final tiebreak.
  const topDistricts: TopDistrict[] = [...rankings]
    .sort(
      (a, b) =>
        a.overallRank - b.overallRank ||
        b.aggregateScore - a.aggregateScore ||
        a.districtId.localeCompare(b.districtId)
    )
    .slice(0, topN)
    .map(({ districtId, districtName, region, overallRank }) => ({
      districtId,
      districtName,
      region,
      overallRank,
    }))

  return {
    startYear,
    label: `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`,
    yearEndDate,
    totalDistricts: rankings.length,
    ...totals,
    topDistricts,
  }
}
