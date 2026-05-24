/**
 * DistinguishedDistrictCalculator (#332)
 *
 * Computes the four Distinguished District tiers from the Distinguished
 * District Program (Item 1490, Rev. 04/2025), with prerequisite gating
 * and gap analysis to the next tier.
 *
 * Tier thresholds:
 * - Distinguished:     ≥1% growth, 45% Distinguished, no net club loss
 * - Select:            ≥3% growth, 50% Distinguished, +1 net club minimum
 * - President's:       ≥5% growth, 55% Distinguished
 * - Smedley:           ≥8% growth, 60% Distinguished (new for 2025-2026)
 *
 * Prerequisites (all 5 must be Y for any tier):
 * - DSP submitted
 * - 85% Director training complete
 * - Market Analysis Plan submitted
 * - Communication Plan submitted
 * - 2+ Region Advisor meetings
 */

import type { DistrictRanking } from '@toastmasters/shared-contracts'

/**
 * Distinguished District tier names.
 * Listed from lowest to highest. NotDistinguished means no tier earned.
 */
export type DistinguishedDistrictTier =
  | 'NotDistinguished'
  | 'Distinguished'
  | 'Select'
  | 'Presidents'
  | 'Smedley'

/**
 * The 5 prerequisites required for any Distinguished District tier.
 */
export interface DistinguishedDistrictPrerequisites {
  dspSubmitted: boolean
  trainingMet: boolean
  marketAnalysisSubmitted: boolean
  communicationPlanSubmitted: boolean
  regionAdvisorVisitMet: boolean
}

/**
 * Gap analysis showing the distance from current state to a target tier.
 * Positive gap = how much improvement needed.
 */
export interface DistinguishedDistrictGap {
  tier: DistinguishedDistrictTier
  /** Additional payment growth % needed (0 if already met) */
  paymentGrowthGap: number
  /** Additional club growth % needed (0 if already met) */
  clubGrowthGap: number
  /** Additional Distinguished % needed (0 if already met) */
  distinguishedPercentGap: number
  /** Additional net club growth needed (0 if already met) */
  netClubGrowthGap: number
  /**
   * Program-year baseline values, propagated from the source ranking so
   * downstream UIs can derive concrete-unit gaps from the percentages
   * (#555). The TI DDP rule (Item 1490) measures growth as
   * `(current - base) / base × 100`, so the base is the multiplier the
   * UI needs to translate "+1.9%" into "+108 payments". Optional during
   * rollout — older snapshots may omit these and consumers gracefully
   * degrade to displaying only the percentage.
   */
  paidClubBase?: number
  paymentBase?: number
}

/**
 * Per-district Distinguished District status.
 */
export interface DistinguishedDistrictStatus {
  districtId: string
  /** The highest tier currently earned */
  currentTier: DistinguishedDistrictTier
  /** Whether all 5 prerequisites are met */
  allPrerequisitesMet: boolean
  /** Per-prerequisite breakdown for the checklist UI */
  prerequisites: DistinguishedDistrictPrerequisites
  /** Gap to the next higher tier (null if at Smedley) */
  nextTierGap: DistinguishedDistrictGap | null
  /**
   * Signed actual net change in paid clubs this program year
   * (`paidClubs − paidClubBase`). Distinct from `nextTierGap`'s
   * `netClubGrowthGap`, which is the clamped distance to the next tier's
   * net-growth rule (`max(0, required − netChange)`) and can never be
   * negative. A shrinking district has a negative `netClubGrowth` but a
   * positive `netClubGrowthGap` — conflating the two made D48 (79 → 71)
   * render as +8 "growth" (#684).
   */
  netClubGrowth: number
}

// ========== Tier Thresholds ==========

interface TierThreshold {
  tier: Exclude<DistinguishedDistrictTier, 'NotDistinguished'>
  paymentGrowthMin: number
  clubGrowthMin: number
  distinguishedPercentMin: number
  /**
   * Net club growth requirement:
   *  - 'no-loss' = paidClubs >= paidClubBase
   *  - 'plus-one' = paidClubs >= paidClubBase + 1
   *  - 'none' = no net growth requirement
   */
  netGrowthRule: 'no-loss' | 'plus-one' | 'none'
}

/**
 * Tier thresholds in ascending order. Order matters for tier matching:
 * we check from highest to lowest and award the first one that qualifies.
 */
const TIER_THRESHOLDS: TierThreshold[] = [
  {
    tier: 'Smedley',
    paymentGrowthMin: 8,
    clubGrowthMin: 8,
    distinguishedPercentMin: 60,
    netGrowthRule: 'none',
  },
  {
    tier: 'Presidents',
    paymentGrowthMin: 5,
    clubGrowthMin: 5,
    distinguishedPercentMin: 55,
    netGrowthRule: 'none',
  },
  {
    tier: 'Select',
    paymentGrowthMin: 3,
    clubGrowthMin: 3,
    distinguishedPercentMin: 50,
    netGrowthRule: 'plus-one',
  },
  {
    tier: 'Distinguished',
    paymentGrowthMin: 1,
    clubGrowthMin: 1,
    distinguishedPercentMin: 45,
    netGrowthRule: 'no-loss',
  },
]

export class DistinguishedDistrictCalculator {
  /**
   * Calculate Distinguished District status for a single district.
   */
  calculate(ranking: DistrictRanking): DistinguishedDistrictStatus {
    const prerequisites: DistinguishedDistrictPrerequisites = {
      dspSubmitted: ranking.dspSubmitted ?? false,
      trainingMet: ranking.trainingMet ?? false,
      marketAnalysisSubmitted: ranking.marketAnalysisSubmitted ?? false,
      communicationPlanSubmitted: ranking.communicationPlanSubmitted ?? false,
      regionAdvisorVisitMet: ranking.regionAdvisorVisitMet ?? false,
    }
    const allPrerequisitesMet = Object.values(prerequisites).every(v => v)

    const currentTier: DistinguishedDistrictTier = allPrerequisitesMet
      ? this.determineTier(ranking)
      : 'NotDistinguished'

    const nextTierGap = this.computeNextTierGap(currentTier, ranking)

    return {
      districtId: ranking.districtId,
      currentTier,
      allPrerequisitesMet,
      prerequisites,
      nextTierGap,
      netClubGrowth: ranking.paidClubs - ranking.paidClubBase,
    }
  }

  /**
   * Calculate Distinguished District status for all districts, keyed by ID.
   */
  calculateAll(
    rankings: DistrictRanking[]
  ): Record<string, DistinguishedDistrictStatus> {
    const result: Record<string, DistinguishedDistrictStatus> = {}
    for (const ranking of rankings) {
      result[ranking.districtId] = this.calculate(ranking)
    }
    return result
  }

  // ========== Private helpers ==========

  /**
   * Determine the highest tier earned. Assumes prerequisites are met.
   */
  private determineTier(ranking: DistrictRanking): DistinguishedDistrictTier {
    for (const threshold of TIER_THRESHOLDS) {
      if (this.meetsThreshold(ranking, threshold)) {
        return threshold.tier
      }
    }
    return 'NotDistinguished'
  }

  /**
   * Check if a district meets a specific tier's thresholds.
   */
  private meetsThreshold(
    ranking: DistrictRanking,
    threshold: TierThreshold
  ): boolean {
    if (ranking.paymentGrowthPercent < threshold.paymentGrowthMin) return false
    if (ranking.clubGrowthPercent < threshold.clubGrowthMin) return false
    if (ranking.distinguishedPercent < threshold.distinguishedPercentMin)
      return false
    return this.meetsNetGrowthRule(ranking, threshold.netGrowthRule)
  }

  private meetsNetGrowthRule(
    ranking: DistrictRanking,
    rule: 'no-loss' | 'plus-one' | 'none'
  ): boolean {
    const netChange = ranking.paidClubs - ranking.paidClubBase
    switch (rule) {
      case 'no-loss':
        return netChange >= 0
      case 'plus-one':
        return netChange >= 1
      case 'none':
        return true
    }
  }

  /**
   * Compute gap analysis to the next higher tier.
   * Returns null if at Smedley (highest tier).
   */
  private computeNextTierGap(
    currentTier: DistinguishedDistrictTier,
    ranking: DistrictRanking
  ): DistinguishedDistrictGap | null {
    const nextTier = this.getNextTier(currentTier)
    if (nextTier === null) return null

    const threshold = TIER_THRESHOLDS.find(t => t.tier === nextTier)
    if (!threshold) return null

    const netChange = ranking.paidClubs - ranking.paidClubBase
    const requiredNetChange = this.requiredNetGrowth(threshold.netGrowthRule)

    return {
      tier: nextTier,
      paymentGrowthGap: Math.max(
        0,
        threshold.paymentGrowthMin - ranking.paymentGrowthPercent
      ),
      clubGrowthGap: Math.max(
        0,
        threshold.clubGrowthMin - ranking.clubGrowthPercent
      ),
      distinguishedPercentGap: Math.max(
        0,
        threshold.distinguishedPercentMin - ranking.distinguishedPercent
      ),
      netClubGrowthGap: Math.max(0, requiredNetChange - netChange),
      paidClubBase: ranking.paidClubBase,
      paymentBase: ranking.paymentBase,
    }
  }

  /**
   * Returns the next tier above the given one, or null if at Smedley.
   */
  private getNextTier(
    tier: DistinguishedDistrictTier
  ):
    | Exclude<DistinguishedDistrictTier, 'NotDistinguished' | 'Smedley'>
    | 'Smedley'
    | null {
    switch (tier) {
      case 'NotDistinguished':
        return 'Distinguished'
      case 'Distinguished':
        return 'Select'
      case 'Select':
        return 'Presidents'
      case 'Presidents':
        return 'Smedley'
      case 'Smedley':
        return null
    }
  }

  private requiredNetGrowth(rule: 'no-loss' | 'plus-one' | 'none'): number {
    switch (rule) {
      case 'no-loss':
        return 0
      case 'plus-one':
        return 1
      case 'none':
        return 0
    }
  }
}
