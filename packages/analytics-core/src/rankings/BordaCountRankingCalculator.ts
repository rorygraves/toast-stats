/**
 * BordaCountRankingCalculator service for computing district rankings using Borda count system
 *
 * This service implements the sophisticated Borda count ranking algorithm that was
 * previously part of the legacy cache system. It calculates rankings across three
 * categories: club growth, payment growth, and distinguished club percentages.
 *
 * CRITICAL: This code is migrated from backend/src/services/RankingCalculator.ts,
 * not rewritten, to preserve bug fixes.
 *
 * @module @toastmasters/analytics-core/rankings
 */

import type {
  AllDistrictsRankingsData,
  AllDistrictsRankingsMetadata,
  DistrictRanking,
} from '@toastmasters/shared-contracts'

import { getConfirmedDistinguishedLevel } from '../analytics/ClubEligibilityUtils.js'
import { calculateDistinguishedPercent } from './distinguishedPercent.js'
import {
  calculateCategoryRanking,
  calculateAggregateRankings,
  type AggregateRanking,
} from './bordaCount.js'
import {
  getProgramYearStartDate,
  parseCharterDateFromStatusField,
} from './programYearDates.js'

/**
 * Logger interface for ranking calculator.
 * Allows injection of custom logging implementation.
 */
export interface RankingLogger {
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
  debug(message: string, context?: Record<string, unknown>): void
}

/**
 * Default no-op logger for when no logger is provided.
 */
const noopLogger: RankingLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
}

/**
 * Input district statistics for ranking calculation.
 * This interface matches the backend DistrictStatistics structure.
 */
export interface RankingDistrictStatistics {
  districtId: string
  asOfDate: string
  membership: {
    total: number
    change: number
    changePercent: number
    byClub: Array<{
      clubId: string
      clubName: string
      memberCount: number
    }>
    new?: number
    renewed?: number
    dual?: number
  }
  clubs: {
    total: number
    active: number
    suspended: number
    ineligible: number
    low: number
    distinguished: number
    chartered?: number
  }
  education: {
    totalAwards: number
    byType: Array<{ type: string; count: number }>
    topClubs: Array<{ clubId: string; clubName: string; awards: number }>
    byMonth?: Array<{ month: string; count: number }>
  }
  goals?: {
    clubsGoal: number
    membershipGoal: number
    distinguishedGoal: number
  }
  performance?: {
    membershipNet: number
    clubsNet: number
    distinguishedPercent: number
  }
  ranking?: DistrictRankingData
  districtPerformance?: Array<Record<string, string | number | null>>
  divisionPerformance?: Array<Record<string, string | number | null>>
  clubPerformance?: Array<Record<string, string | number | null>>
}

/**
 * District ranking data structure.
 */
export interface DistrictRankingData {
  // Individual category ranks (1 = best)
  clubsRank: number
  paymentsRank: number
  distinguishedRank: number

  // Aggregate Borda count score (higher = better)
  aggregateScore: number

  // Growth metrics used for ranking
  clubGrowthPercent: number
  paymentGrowthPercent: number
  distinguishedPercent: number

  // Base values for growth calculations
  paidClubBase: number
  paymentBase: number

  // Absolute values
  paidClubs: number
  totalPayments: number
  distinguishedClubs: number
  activeClubs: number
  selectDistinguished: number
  presidentsDistinguished: number

  // Smedley Distinguished Clubs count — new tier for 2025-2026 (#329)
  smedleyDistinguished: number

  // District Recognition Program prerequisites (#329)
  // All five must be true for a district to qualify for any Distinguished tier
  dspSubmitted: boolean
  trainingMet: boolean
  marketAnalysisSubmitted: boolean
  communicationPlanSubmitted: boolean
  regionAdvisorVisitMet: boolean

  // Count of clubs with 20+ paid members — for President's 20-Plus Award (#330)
  clubsWith20PlusMembers: number

  // Count of paid clubs chartered in the current program year (#336).
  // Subtracted from paidClubs when computing the District Club Retention Award
  // so the metric reflects base-club survival rather than extension.
  newCharteredClubs: number

  // Payment breakdown (#327)
  newPayments: number
  aprilPayments: number
  octoberPayments: number
  latePayments: number
  charterPayments: number

  // Regional information
  region: string
  districtName: string

  // Algorithm metadata
  rankingVersion: string
  calculatedAt: string
}

/**
 * Raw CSV data from getAllDistricts API call.
 */
export interface AllDistrictsCSVRecord {
  DISTRICT: string
  REGION: string
  'Paid Clubs': string
  'Paid Club Base': string
  '% Club Growth': string
  'Total YTD Payments': string
  'Payment Base': string
  '% Payment Growth': string
  'Active Clubs': string
  'Total Distinguished Clubs': string
  'Select Distinguished Clubs': string
  'Presidents Distinguished Clubs'?: string
  /** District Recognition Program prerequisites (Y/N) — added 2025-2026 (#329) */
  DSP?: string
  Training?: string
  'Market Analysis'?: string
  'Communication Plan'?: string
  'Region Advisor Visit'?: string
  /** Smedley Distinguished Clubs count — new tier for 2025-2026 (#329) */
  'Smedley Distinguished Clubs'?: string
  /** Payment breakdown columns (#327) */
  'New Payments'?: string
  'April Payments'?: string
  'October Payments'?: string
  'Late Payments'?: string
  'Charter Payments'?: string
  [key: string]: string | undefined
}

/**
 * Interface for ranking calculator.
 */
export interface IRankingCalculator {
  /**
   * Calculate rankings for all districts using Borda count system
   */
  calculateRankings(
    districts: RankingDistrictStatistics[]
  ): Promise<RankingDistrictStatistics[]>

  /**
   * Build AllDistrictsRankingsData from ranked districts
   * @param rankedDistricts - Districts with ranking data (output from calculateRankings)
   * @param snapshotId - The snapshot ID (date in YYYY-MM-DD format)
   * @returns AllDistrictsRankingsData structure ready to be written to all-districts-rankings.json
   */
  buildRankingsData(
    rankedDistricts: RankingDistrictStatistics[],
    snapshotId: string
  ): AllDistrictsRankingsData

  /**
   * Get the current ranking algorithm version
   */
  getRankingVersion(): string
}

/**
 * Internal structure for ranking metrics extraction
 */
interface RankingMetrics {
  districtId: string
  districtName: string
  region: string
  clubGrowthPercent: number
  paymentGrowthPercent: number
  distinguishedPercent: number
  paidClubs: number
  paidClubBase: number
  totalPayments: number
  paymentBase: number
  distinguishedClubs: number
  activeClubs: number
  selectDistinguished: number
  presidentsDistinguished: number
  // Smedley Distinguished Clubs count — new tier for 2025-2026 (#329)
  smedleyDistinguished: number
  // District Recognition Program prerequisites (#329)
  dspSubmitted: boolean
  trainingMet: boolean
  marketAnalysisSubmitted: boolean
  communicationPlanSubmitted: boolean
  regionAdvisorVisitMet: boolean
  // Count of clubs with 20+ paid members — for President's 20-Plus Award (#330)
  clubsWith20PlusMembers: number
  // Count of paid clubs chartered in the current program year (#336)
  newCharteredClubs: number
  // Payment breakdown (#327)
  newPayments: number
  aprilPayments: number
  octoberPayments: number
  latePayments: number
  charterPayments: number
}

/**
 * Configuration options for BordaCountRankingCalculator.
 */
export interface BordaCountRankingCalculatorConfig {
  logger?: RankingLogger
}

/**
 * Borda Count Ranking Calculator implementation
 *
 * Implements the sophisticated ranking system using Borda count scoring:
 * - Ranks districts in three categories: club growth, payment growth, distinguished percentage
 * - Handles ties by assigning the same rank to districts with equal values
 * - Calculates Borda points: (total districts - rank + 1)
 * - Sums Borda points across categories for aggregate score
 * - Orders districts by aggregate score (highest first)
 *
 * CRITICAL: This code is migrated from backend/src/services/RankingCalculator.ts,
 * not rewritten, to preserve bug fixes.
 */
export class BordaCountRankingCalculator implements IRankingCalculator {
  private readonly RANKING_VERSION = '2.0'
  private readonly logger: RankingLogger

  constructor(config?: BordaCountRankingCalculatorConfig) {
    this.logger = config?.logger ?? noopLogger
  }

  /**
   * Calculate rankings for all districts using Borda count system
   */
  async calculateRankings(
    districts: RankingDistrictStatistics[]
  ): Promise<RankingDistrictStatistics[]> {
    const startTime = Date.now()
    const calculatedAt = new Date().toISOString()

    this.logger.info('Starting Borda count ranking calculation', {
      operation: 'calculateRankings',
      districtCount: districts.length,
      rankingVersion: this.RANKING_VERSION,
      calculatedAt,
    })

    try {
      if (districts.length === 0) {
        this.logger.warn('No districts provided for ranking calculation')
        return districts
      }

      // Step 1: Extract ranking metrics from district data
      const metrics = this.extractRankingMetrics(districts)
      this.logger.debug('Extracted ranking metrics', {
        operation: 'calculateRankings',
        metricsCount: metrics.length,
      })

      // Step 2: Calculate category rankings
      const clubRankings = calculateCategoryRanking(
        metrics,
        'clubGrowthPercent',
        'clubs',
        this.logger
      )
      const paymentRankings = calculateCategoryRanking(
        metrics,
        'paymentGrowthPercent',
        'payments',
        this.logger
      )
      const distinguishedRankings = calculateCategoryRanking(
        metrics,
        'distinguishedPercent',
        'distinguished',
        this.logger
      )

      this.logger.debug('Calculated category rankings', {
        operation: 'calculateRankings',
        clubRankings: clubRankings.length,
        paymentRankings: paymentRankings.length,
        distinguishedRankings: distinguishedRankings.length,
      })

      // Step 3: Calculate aggregate rankings
      const aggregateRankings = calculateAggregateRankings(
        clubRankings,
        paymentRankings,
        distinguishedRankings
      )

      this.logger.debug('Calculated aggregate rankings', {
        operation: 'calculateRankings',
        aggregateRankings: aggregateRankings.length,
      })

      // Step 4: Apply rankings to district data
      const rankedDistricts = this.applyRankingsToDistricts(
        districts,
        metrics,
        aggregateRankings,
        calculatedAt
      )

      // Step 5: Sort districts by aggregate score (highest first)
      const sortedDistricts = rankedDistricts.sort((a, b) => {
        const scoreA = a.ranking?.aggregateScore || 0
        const scoreB = b.ranking?.aggregateScore || 0
        return scoreB - scoreA
      })

      const duration = Date.now() - startTime
      this.logger.info('Completed Borda count ranking calculation', {
        operation: 'calculateRankings',
        districtCount: sortedDistricts.length,
        rankingVersion: this.RANKING_VERSION,
        durationMs: duration,
        calculatedAt,
      })

      return sortedDistricts
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      const duration = Date.now() - startTime

      this.logger.error('Ranking calculation failed', {
        operation: 'calculateRankings',
        error: errorMessage,
        districtCount: districts.length,
        durationMs: duration,
      })

      // Return original districts without ranking data on failure
      return districts
    }
  }

  /**
   * Get the current ranking algorithm version
   */
  getRankingVersion(): string {
    return this.RANKING_VERSION
  }

  /**
   * Build AllDistrictsRankingsData from ranked districts.
   * This method transforms the ranked district statistics into the file format
   * expected by all-districts-rankings.json.
   *
   * @param rankedDistricts - Districts with ranking data (output from calculateRankings)
   * @param snapshotId - The snapshot ID (date in YYYY-MM-DD format)
   * @returns AllDistrictsRankingsData structure ready to be written to all-districts-rankings.json
   */
  buildRankingsData(
    rankedDistricts: RankingDistrictStatistics[],
    snapshotId: string
  ): AllDistrictsRankingsData {
    const calculatedAt = new Date().toISOString()

    this.logger.info('Building rankings data structure', {
      operation: 'buildRankingsData',
      snapshotId,
      districtCount: rankedDistricts.length,
      rankingVersion: this.RANKING_VERSION,
    })

    // Build metadata
    const metadata: AllDistrictsRankingsMetadata = {
      snapshotId,
      calculatedAt,
      schemaVersion: '1.0',
      calculationVersion: '1.0',
      rankingVersion: this.RANKING_VERSION,
      sourceCsvDate: snapshotId, // Snapshot ID is the date
      csvFetchedAt: calculatedAt, // Use calculation time as fetch time
      totalDistricts: rankedDistricts.length,
      fromCache: false, // Rankings are freshly computed
    }

    // Filter districts with ranking data and sort by aggregate score (highest first)
    const districtsWithRankings = rankedDistricts
      .filter(district => district.ranking !== undefined)
      .sort((a, b) => {
        const scoreA = a.ranking?.aggregateScore ?? 0
        const scoreB = b.ranking?.aggregateScore ?? 0
        return scoreB - scoreA
      })

    // Build rankings array with standard competition ranking for overallRank (#303)
    // Tied districts share the same rank; the next rank skips accordingly
    // e.g., scores [250, 250, 249] → ranks [1, 1, 3]
    const rankings: DistrictRanking[] = districtsWithRankings.map(
      (district, index) => {
        const ranking = district.ranking!

        // Standard competition ranking: if this score equals the previous,
        // use the same rank; otherwise rank = position (1-indexed)
        let overallRank = index + 1
        if (index > 0) {
          const prevScore =
            districtsWithRankings[index - 1]?.ranking?.aggregateScore ?? 0
          if (ranking.aggregateScore === prevScore) {
            // Find the first district with this score to get its rank
            for (let j = index - 1; j >= 0; j--) {
              const jScore =
                districtsWithRankings[j]?.ranking?.aggregateScore ?? 0
              if (jScore !== ranking.aggregateScore) {
                overallRank = j + 2
                break
              }
              if (j === 0) overallRank = 1
            }
          }
        }

        return {
          districtId: district.districtId,
          districtName: ranking.districtName,
          region: ranking.region,
          paidClubs: ranking.paidClubs,
          paidClubBase: ranking.paidClubBase,
          clubGrowthPercent: ranking.clubGrowthPercent,
          totalPayments: ranking.totalPayments,
          paymentBase: ranking.paymentBase,
          paymentGrowthPercent: ranking.paymentGrowthPercent,
          activeClubs: ranking.activeClubs,
          distinguishedClubs: ranking.distinguishedClubs,
          selectDistinguished: ranking.selectDistinguished,
          presidentsDistinguished: ranking.presidentsDistinguished,
          distinguishedPercent: ranking.distinguishedPercent,
          clubsRank: ranking.clubsRank,
          paymentsRank: ranking.paymentsRank,
          distinguishedRank: ranking.distinguishedRank,
          aggregateScore: ranking.aggregateScore,
          overallRank,
          // Smedley Distinguished tier (#329)
          smedleyDistinguished: ranking.smedleyDistinguished,
          // District Recognition Program prerequisites (#329)
          dspSubmitted: ranking.dspSubmitted,
          trainingMet: ranking.trainingMet,
          marketAnalysisSubmitted: ranking.marketAnalysisSubmitted,
          communicationPlanSubmitted: ranking.communicationPlanSubmitted,
          regionAdvisorVisitMet: ranking.regionAdvisorVisitMet,
          // Clubs with 20+ paid members for President's 20-Plus Award (#330)
          clubsWith20PlusMembers: ranking.clubsWith20PlusMembers,
          // New chartered clubs for District Club Retention Award (#336)
          newCharteredClubs: ranking.newCharteredClubs,
          // Payment breakdown (#327)
          newPayments: ranking.newPayments,
          aprilPayments: ranking.aprilPayments,
          octoberPayments: ranking.octoberPayments,
          latePayments: ranking.latePayments,
          charterPayments: ranking.charterPayments,
        }
      }
    )

    this.logger.info('Built rankings data structure', {
      operation: 'buildRankingsData',
      snapshotId,
      totalDistricts: rankings.length,
      rankingVersion: this.RANKING_VERSION,
    })

    return {
      metadata,
      rankings,
    }
  }

  /**
   * Extract ranking metrics from district statistics
   */
  private extractRankingMetrics(
    districts: RankingDistrictStatistics[]
  ): RankingMetrics[] {
    const metrics: RankingMetrics[] = []

    for (const district of districts) {
      try {
        // Extract metrics from the raw district performance data
        const districtPerformance = district.districtPerformance?.[0] as
          | AllDistrictsCSVRecord
          | undefined

        if (!districtPerformance) {
          this.logger.warn('No district performance data found', {
            districtId: district.districtId,
            operation: 'extractRankingMetrics',
          })
          continue
        }

        const metric: RankingMetrics = {
          districtId: district.districtId,
          districtName: districtPerformance.DISTRICT || district.districtId,
          region: districtPerformance.REGION || 'Unknown',
          clubGrowthPercent: this.parsePercentage(
            districtPerformance['% Club Growth']
          ),
          paymentGrowthPercent: this.parsePercentage(
            districtPerformance['% Payment Growth']
          ),
          distinguishedPercent: calculateDistinguishedPercent(
            this.parseNumber(districtPerformance['Total Distinguished Clubs']),
            this.parseNumber(districtPerformance['Paid Club Base'])
          ),
          paidClubs: this.parseNumber(districtPerformance['Paid Clubs']),
          paidClubBase: this.parseNumber(districtPerformance['Paid Club Base']),
          totalPayments: this.parseNumber(
            districtPerformance['Total YTD Payments']
          ),
          paymentBase: this.parseNumber(districtPerformance['Payment Base']),
          distinguishedClubs: this.parseNumber(
            districtPerformance['Total Distinguished Clubs']
          ),
          activeClubs: this.parseNumber(districtPerformance['Active Clubs']),
          selectDistinguished: this.parseNumber(
            districtPerformance['Select Distinguished Clubs']
          ),
          presidentsDistinguished: this.parseNumber(
            districtPerformance['Presidents Distinguished Clubs']
          ),
          // Smedley Distinguished Clubs — new tier for 2025-2026 (#329)
          smedleyDistinguished: this.parseNumber(
            districtPerformance['Smedley Distinguished Clubs']
          ),
          // District Recognition Program prerequisites (#329)
          dspSubmitted: this.parseYesNo(districtPerformance['DSP']),
          trainingMet: this.parseYesNo(districtPerformance['Training']),
          marketAnalysisSubmitted: this.parseYesNo(
            districtPerformance['Market Analysis']
          ),
          communicationPlanSubmitted: this.parseYesNo(
            districtPerformance['Communication Plan']
          ),
          regionAdvisorVisitMet: this.parseYesNo(
            districtPerformance['Region Advisor Visit']
          ),
          // Aggregate clubs with 20+ paid members for President's 20-Plus Award (#330)
          clubsWith20PlusMembers: district.clubPerformance
            ? this.countClubsWith20PlusMembers(district.clubPerformance)
            : 0,
          // Count paid clubs chartered in the current program year (#336)
          newCharteredClubs:
            district.clubPerformance && district.asOfDate
              ? this.countNewCharteredClubs(
                  district.clubPerformance,
                  district.asOfDate
                )
              : 0,
          // Payment breakdown (#327)
          newPayments: this.parseNumber(districtPerformance['New Payments']),
          aprilPayments: this.parseNumber(
            districtPerformance['April Payments']
          ),
          octoberPayments: this.parseNumber(
            districtPerformance['October Payments']
          ),
          latePayments: this.parseNumber(districtPerformance['Late Payments']),
          charterPayments: this.parseNumber(
            districtPerformance['Charter Payments']
          ),
        }

        // When TI reports 0 Distinguished (pre-April), compute confirmed
        // count from club-level data using April renewals (#304)
        if (
          metric.distinguishedClubs === 0 &&
          district.clubPerformance &&
          district.clubPerformance.length > 0
        ) {
          const confirmedCount = this.countConfirmedDistinguished(
            district.clubPerformance
          )
          if (confirmedCount > 0) {
            metric.distinguishedClubs = confirmedCount
            metric.distinguishedPercent =
              metric.activeClubs > 0
                ? (confirmedCount / metric.activeClubs) * 100
                : 0
            this.logger.debug(
              'Using confirmed Distinguished count (pre-April)',
              {
                districtId: district.districtId,
                confirmedCount,
                operation: 'extractRankingMetrics',
              }
            )
          }
        }

        metrics.push(metric)
      } catch (error) {
        this.logger.warn('Failed to extract metrics for district', {
          districtId: district.districtId,
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'extractRankingMetrics',
        })
      }
    }

    return metrics
  }

  /**
   * Count clubs whose confirmed Distinguished level (using April renewals)
   * is not NotDistinguished. Used pre-April when TI reports 0. (#304)
   */
  private countConfirmedDistinguished(
    clubPerformance: Array<Record<string, string | number | null>>
  ): number {
    let count = 0
    for (const club of clubPerformance) {
      const goals = this.parseNumber(club['Goals Met'])
      const aprilRenewals = this.parseNumber(club['Mem. dues on time Apr'])
      const membershipBase = this.parseNumber(club['Mem. Base'])

      const level = getConfirmedDistinguishedLevel(
        goals,
        aprilRenewals,
        membershipBase
      )
      if (level !== 'NotDistinguished') count++
    }
    return count
  }

  /**
   * Count clubs with 20+ paid members from club-performance data (#330).
   *
   * Used for President's 20-Plus Award which recognizes the top 3 districts
   * by percentage of active clubs with 20 or more paid members.
   *
   * Uses "Active Members" column (alternative names: "Membership", "Paid Members").
   */
  private countClubsWith20PlusMembers(
    clubPerformance: Array<Record<string, string | number | null>>
  ): number {
    let count = 0
    for (const club of clubPerformance) {
      const members = this.parseNumber(
        club['Active Members'] ?? club['Membership'] ?? club['Paid Members']
      )
      if (members >= 20) count++
    }
    return count
  }

  /**
   * Count clubs chartered during the current program year (#336).
   *
   * The Toastmasters program year runs July 1 → June 30. The signal lives in
   * district-performance.csv under the `Charter Date/Suspend Date` column —
   * values like `Charter 04/15/26` (new charter) or `Susp 09/30/25`
   * (suspension). Only Charter entries with date ≥ PY start are counted.
   *
   * Used to exclude new charters from the District Club Retention Award
   * numerator so retention measures base-club survival rather than extension.
   */
  private countNewCharteredClubs(
    rows: Array<Record<string, string | number | null>>,
    snapshotDate: string
  ): number {
    const programYearStart = getProgramYearStartDate(snapshotDate)
    if (!programYearStart) return 0

    let count = 0
    for (const row of rows) {
      const chartered = parseCharterDateFromStatusField(
        row['Charter Date/Suspend Date']
      )
      if (chartered && chartered >= programYearStart) count++
    }
    return count
  }

  /**
   * Apply calculated rankings to district statistics
   */
  private applyRankingsToDistricts(
    districts: RankingDistrictStatistics[],
    metrics: RankingMetrics[],
    aggregateRankings: AggregateRanking[],
    calculatedAt: string
  ): RankingDistrictStatistics[] {
    const metricsMap = new Map(metrics.map(m => [m.districtId, m]))
    const rankingsMap = new Map(aggregateRankings.map(r => [r.districtId, r]))

    return districts.map(district => {
      const metric = metricsMap.get(district.districtId)
      const ranking = rankingsMap.get(district.districtId)

      if (!metric || !ranking) {
        // Return district without ranking data if metrics/rankings are missing
        this.logger.warn('Missing metrics or rankings for district', {
          districtId: district.districtId,
          hasMetric: !!metric,
          hasRanking: !!ranking,
          operation: 'applyRankingsToDistricts',
        })
        return district
      }

      const rankingData: DistrictRankingData = {
        clubsRank: ranking.clubsRank,
        paymentsRank: ranking.paymentsRank,
        distinguishedRank: ranking.distinguishedRank,
        aggregateScore: ranking.aggregateScore,
        clubGrowthPercent: metric.clubGrowthPercent,
        paymentGrowthPercent: metric.paymentGrowthPercent,
        distinguishedPercent: metric.distinguishedPercent,
        paidClubBase: metric.paidClubBase,
        paymentBase: metric.paymentBase,
        paidClubs: metric.paidClubs,
        totalPayments: metric.totalPayments,
        distinguishedClubs: metric.distinguishedClubs,
        activeClubs: metric.activeClubs,
        selectDistinguished: metric.selectDistinguished,
        presidentsDistinguished: metric.presidentsDistinguished,
        // Smedley Distinguished tier (#329)
        smedleyDistinguished: metric.smedleyDistinguished,
        // District Recognition Program prerequisites (#329)
        dspSubmitted: metric.dspSubmitted,
        trainingMet: metric.trainingMet,
        marketAnalysisSubmitted: metric.marketAnalysisSubmitted,
        communicationPlanSubmitted: metric.communicationPlanSubmitted,
        regionAdvisorVisitMet: metric.regionAdvisorVisitMet,
        // Clubs with 20+ paid members for President's 20-Plus Award (#330)
        clubsWith20PlusMembers: metric.clubsWith20PlusMembers,
        // New chartered clubs for District Club Retention Award (#336)
        newCharteredClubs: metric.newCharteredClubs,
        // Payment breakdown (#327)
        newPayments: metric.newPayments,
        aprilPayments: metric.aprilPayments,
        octoberPayments: metric.octoberPayments,
        latePayments: metric.latePayments,
        charterPayments: metric.charterPayments,
        region: metric.region,
        districtName: metric.districtName,
        rankingVersion: this.RANKING_VERSION,
        calculatedAt,
      }

      return {
        ...district,
        ranking: rankingData,
      }
    })
  }

  /**
   * Parse percentage string to number
   */
  private parsePercentage(value: string | number | null | undefined): number {
    if (typeof value === 'number') {
      return value
    }

    if (typeof value === 'string') {
      // Remove % sign and parse as float
      const cleaned = value.replace('%', '').trim()
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }

    return 0
  }

  /**
   * Parse number from various input types
   */
  private parseNumber(value: string | number | null | undefined): number {
    if (typeof value === 'number') {
      return value
    }

    if (typeof value === 'string') {
      // Remove commas and parse as integer
      const cleaned = value.replace(/,/g, '').trim()
      const parsed = parseInt(cleaned, 10)
      return isNaN(parsed) ? 0 : parsed
    }

    return 0
  }

  /**
   * Parse Y/N string into boolean (#329)
   *
   * Used for District Recognition Program prerequisite columns:
   * DSP, Training, Market Analysis, Communication Plan, Region Advisor Visit.
   *
   * Defaults to false when the column is missing (legacy CSVs) or contains
   * any value other than "Y" (case-insensitive).
   */
  private parseYesNo(value: string | number | null | undefined): boolean {
    if (typeof value !== 'string') return false
    return value.trim().toUpperCase() === 'Y'
  }
}
