/**
 * Shared Borda-count ranking primitives (#306).
 *
 * The category-ranking and aggregate-ranking algorithms were independently
 * implemented — byte-for-byte identical except for log strings — in both
 * `BordaCountRankingCalculator` (analytics-core) and `TransformService`
 * (collector-cli). Two copies of one formula is the drift surface lessons 61
 * and 76 warn about. These pure functions are the single home; both call
 * sites invoke them directly.
 *
 * @module @toastmasters/analytics-core/rankings
 */

/**
 * Minimal debug-logger surface. Structurally compatible with the
 * `RankingLogger` used by the calculator and the collector's logger; both
 * pass through without coupling this module to either.
 */
export interface CategoryRankingLogger {
  debug(message: string, context?: Record<string, unknown>): void
}

/**
 * Result of ranking a single category.
 */
export interface CategoryRanking {
  districtId: string
  rank: number
  bordaPoints: number
  value: number
}

/**
 * Aggregate ranking result — per-category ranks plus the summed Borda score.
 */
export interface AggregateRanking {
  districtId: string
  clubsRank: number
  paymentsRank: number
  distinguishedRank: number
  aggregateScore: number
}

/**
 * Calculate the Borda-count ranking for a single category.
 *
 * Scoring:
 * - Districts are sorted by `valueField` (highest first).
 * - Ties share a rank (standard competition ranking); the next distinct
 *   value resumes at `index + 1`.
 * - Borda points = `totalDistricts - rank + 1`.
 * - Tie-neutralization (#198): if every district has the same value the
 *   category cannot differentiate, so all districts get rank 1 and 0 points
 *   to avoid inflating every aggregate score equally.
 *
 * Generic over the metric shape — the only requirement is a `districtId` and
 * a numeric `valueField`.
 */
export function calculateCategoryRanking<T extends { districtId: string }>(
  metrics: T[],
  valueField: keyof T,
  category: string,
  logger?: CategoryRankingLogger
): CategoryRanking[] {
  // Tie-neutralization (#198): all values identical → no differentiation.
  const uniqueValues = new Set(metrics.map(m => m[valueField] as number))
  if (uniqueValues.size === 1) {
    logger?.debug('All districts tied in category — awarding 0 Borda points', {
      category,
      totalDistricts: metrics.length,
      tiedValue: [...uniqueValues][0],
      operation: 'calculateCategoryRanking',
    })
    return metrics.map(m => ({
      districtId: m.districtId,
      rank: 1,
      bordaPoints: 0,
      value: m[valueField] as number,
    }))
  }

  // Sort districts by value (highest first)
  const sortedMetrics = [...metrics].sort((a, b) => {
    const aValue = a[valueField] as number
    const bValue = b[valueField] as number
    return bValue - aValue
  })

  const rankings: CategoryRanking[] = []
  let currentRank = 1

  for (let i = 0; i < sortedMetrics.length; i++) {
    const metric = sortedMetrics[i]
    if (!metric) {
      continue
    }

    const value = metric[valueField] as number

    // Handle ties: if current value equals previous value, use same rank
    if (i > 0) {
      const previousMetric = sortedMetrics[i - 1]
      if (previousMetric) {
        const previousValue = previousMetric[valueField] as number
        if (value !== previousValue) {
          currentRank = i + 1
        }
      }
    }

    // Calculate Borda points: total districts - rank + 1
    const bordaPoints = metrics.length - currentRank + 1

    rankings.push({
      districtId: metric.districtId,
      rank: currentRank,
      bordaPoints,
      value,
    })
  }

  logger?.debug('Calculated category ranking', {
    category,
    totalDistricts: metrics.length,
    uniqueRanks: new Set(rankings.map(r => r.rank)).size,
    operation: 'calculateCategoryRanking',
  })

  return rankings
}

/**
 * Sum Borda points across the three categories (club growth, payment growth,
 * distinguished %) into an aggregate score, returning districts sorted by that
 * score (highest first). Each district's per-category rank is preserved.
 */
export function calculateAggregateRankings(
  clubRankings: CategoryRanking[],
  paymentRankings: CategoryRanking[],
  distinguishedRankings: CategoryRanking[]
): AggregateRanking[] {
  const aggregateMap = new Map<string, AggregateRanking>()

  // Initialize aggregate rankings from club rankings
  for (const ranking of clubRankings) {
    aggregateMap.set(ranking.districtId, {
      districtId: ranking.districtId,
      clubsRank: ranking.rank,
      paymentsRank: 0,
      distinguishedRank: 0,
      aggregateScore: ranking.bordaPoints,
    })
  }

  // Add payment rankings
  for (const ranking of paymentRankings) {
    const aggregate = aggregateMap.get(ranking.districtId)
    if (aggregate) {
      aggregate.paymentsRank = ranking.rank
      aggregate.aggregateScore += ranking.bordaPoints
    }
  }

  // Add distinguished rankings
  for (const ranking of distinguishedRankings) {
    const aggregate = aggregateMap.get(ranking.districtId)
    if (aggregate) {
      aggregate.distinguishedRank = ranking.rank
      aggregate.aggregateScore += ranking.bordaPoints
    }
  }

  // Sort by aggregate score (highest first)
  return Array.from(aggregateMap.values()).sort(
    (a, b) => b.aggregateScore - a.aggregateScore
  )
}
