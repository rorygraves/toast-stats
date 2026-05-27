/**
 * Division Gap Analysis Calculation Module
 *
 * This module provides functions for calculating gap analysis for divisions
 * in the Distinguished Division Program (DDP). It determines what a division
 * needs to achieve each recognition level.
 *
 * DDP Criteria (from TOASTMASTERS_DASHBOARD_KNOWLEDGE.md):
 * - Eligibility: No net club loss (paidClubs >= clubBase)
 * - Distinguished Division: paidClubs >= clubBase AND distinguishedClubs >= 45% of clubBase
 * - Select Distinguished Division: paidClubs >= clubBase + 1 AND distinguishedClubs >= 50% of clubBase
 * - President's Distinguished Division: paidClubs >= clubBase + 2 AND distinguishedClubs >= 55% of clubBase
 *
 * Key differences from DAP (Distinguished Area Program):
 * - DDP uses 45%/50%/55% thresholds vs DAP's 50%/50%+1/50%+1
 * - DDP requires base/base+1/base+2 paid clubs vs DAP's base/base/base+1
 * - DDP has NO club visit requirements (DAP requires 75% visits)
 * - Distinguished percentage is calculated against club base (same as DAP)
 *
 * Requirements: 5.2, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 9.4
 */

/**
 * Recognition levels for divisions in the Distinguished Division Program
 *
 * - 'none': Does not meet any recognition level criteria
 * - 'distinguished': Meets Distinguished Division criteria
 * - 'select': Meets Select Distinguished Division criteria
 * - 'presidents': Meets President's Distinguished Division criteria
 */
export type DivisionRecognitionLevel =
  | 'none'
  | 'distinguished'
  | 'select'
  | 'presidents'

/**
 * Gap information for achieving a specific recognition level
 */
export interface DivisionGapToLevel {
  /** Whether this level is already achieved */
  achieved: boolean
  /** Number of additional distinguished clubs needed (0 if achieved) */
  distinguishedClubsNeeded: number
  /** Number of additional paid clubs needed for this level (0 if met) */
  paidClubsNeeded: number
  /** Whether this level is achievable (no net loss requirement met) */
  achievable: boolean
}

/**
 * Complete gap analysis for a division
 *
 * Contains the current recognition level achieved and the gaps
 * to each recognition level, including whether the no net club loss
 * requirement is met.
 */
export interface DivisionGapAnalysis {
  /** Current recognition level achieved */
  currentLevel: DivisionRecognitionLevel
  /** Whether no net club loss requirement is met (paidClubs >= clubBase) */
  meetsNoNetLossRequirement: boolean
  /** Number of additional paid clubs needed to meet club base (0 if met) */
  paidClubsNeeded: number
  /** Gap to Distinguished level (45% of club base) */
  distinguishedGap: DivisionGapToLevel
  /** Gap to Select Distinguished level (50% of club base, base+1 paid) */
  selectGap: DivisionGapToLevel
  /** Gap to President's Distinguished level (55% of club base, base+2 paid) */
  presidentsGap: DivisionGapToLevel
}

/**
 * Input parameters for division gap analysis calculation
 */
export interface DivisionMetrics {
  /** Number of clubs at the start of the program year (club base) */
  clubBase: number
  /** Current number of clubs that have met membership payment requirements */
  paidClubs: number
  /** Current number of clubs that have achieved Distinguished status */
  distinguishedClubs: number
}

/**
 * DDP threshold percentages for each recognition level, expressed as whole
 * percents. Integer percents (not 0.45/0.50/0.55) so the required-club count is
 * computed with integer arithmetic — `Math.ceil(base * 0.55)` overshoots for
 * some bases because 0.55 is not exactly representable (e.g. 100 * 0.55 =
 * 55.00000000000001 → ceil → 56, when 55% of 100 is exactly 55). See #798.
 */
const DDP_THRESHOLDS = {
  distinguished: 45,
  select: 50,
  presidents: 55,
} as const

/**
 * DDP paid clubs requirements (relative to club base)
 */
const DDP_PAID_CLUBS_OFFSET = {
  distinguished: 0, // >= club base
  select: 1, // >= club base + 1
  presidents: 2, // >= club base + 2
} as const

/**
 * Calculates the number of paid clubs needed to meet the no net club loss requirement
 *
 * Property 2: Paid Clubs Gap
 * - For no net loss: max(0, clubBase - paidClubs)
 *
 * @param clubBase - Number of clubs at the start of the program year
 * @param paidClubs - Current number of paid clubs
 * @returns Number of additional paid clubs needed (0 if requirement met)
 *
 * @example
 * calculatePaidClubsGap(50, 48) // Returns 2 (need 50 paid clubs, have 48)
 * calculatePaidClubsGap(50, 50) // Returns 0 (requirement met)
 * calculatePaidClubsGap(0, 0) // Returns 0 (edge case: no clubs)
 *
 * Requirements: 6.1
 */
export function calculatePaidClubsGap(
  clubBase: number,
  paidClubs: number
): number {
  // Edge case: zero clubs means no gap
  if (clubBase === 0) {
    return 0
  }

  // No net club loss: paidClubs must be >= clubBase
  return Math.max(0, clubBase - paidClubs)
}

/**
 * Calculates the required number of distinguished clubs for a given whole-percent
 * threshold ("at least X% of club base", rounded up).
 *
 * Uses integer arithmetic — `Math.ceil((base * percent) / 100)` — to avoid the
 * float-representation overshoot of `Math.ceil(base * (percent / 100))`. See #798.
 *
 * @param clubBase - Number of clubs at the start of the program year
 * @param thresholdPercent - Whole-percent threshold (45, 50, or 55)
 * @returns Required number of distinguished clubs (rounded up)
 */
function calculateRequiredDistinguishedClubs(
  clubBase: number,
  thresholdPercent: number
): number {
  return Math.ceil((clubBase * thresholdPercent) / 100)
}

/**
 * Determines the current recognition level based on metrics
 *
 * Property 1: Recognition Level Classification
 * - If paidClubs < clubBase: "none" (net club loss - not eligible)
 * - Else if paidClubs >= clubBase + 2 AND distinguishedClubs >= Math.ceil(clubBase * 0.55): "presidents"
 * - Else if paidClubs >= clubBase + 1 AND distinguishedClubs >= Math.ceil(clubBase * 0.50): "select"
 * - Else if paidClubs >= clubBase AND distinguishedClubs >= Math.ceil(clubBase * 0.45): "distinguished"
 * - Else: "none"
 *
 * @param metrics - Division metrics (clubBase, paidClubs, distinguishedClubs)
 * @returns Current recognition level achieved
 *
 * Requirements: 5.2, 5.5, 9.1
 */
export function determineDivisionRecognitionLevel(
  metrics: DivisionMetrics
): DivisionRecognitionLevel {
  const { clubBase, paidClubs, distinguishedClubs } = metrics

  // Edge case: zero clubs means no recognition possible
  if (clubBase === 0) {
    return 'none'
  }

  // Check no net club loss requirement first (paidClubs >= clubBase)
  if (paidClubs < clubBase) {
    return 'none'
  }

  // Calculate distinguished thresholds
  const distinguishedThreshold = calculateRequiredDistinguishedClubs(
    clubBase,
    DDP_THRESHOLDS.distinguished
  )
  const selectThreshold = calculateRequiredDistinguishedClubs(
    clubBase,
    DDP_THRESHOLDS.select
  )
  const presidentsThreshold = calculateRequiredDistinguishedClubs(
    clubBase,
    DDP_THRESHOLDS.presidents
  )

  // Check President's Distinguished: paidClubs >= clubBase + 2 AND distinguishedClubs >= 55%
  if (
    paidClubs >= clubBase + DDP_PAID_CLUBS_OFFSET.presidents &&
    distinguishedClubs >= presidentsThreshold
  ) {
    return 'presidents'
  }

  // Check Select Distinguished: paidClubs >= clubBase + 1 AND distinguishedClubs >= 50%
  if (
    paidClubs >= clubBase + DDP_PAID_CLUBS_OFFSET.select &&
    distinguishedClubs >= selectThreshold
  ) {
    return 'select'
  }

  // Check Distinguished: paidClubs >= clubBase AND distinguishedClubs >= 45%
  if (
    paidClubs >= clubBase + DDP_PAID_CLUBS_OFFSET.distinguished &&
    distinguishedClubs >= distinguishedThreshold
  ) {
    return 'distinguished'
  }

  return 'none'
}

/**
 * Calculates the gap to Distinguished level
 *
 * Distinguished Division: paidClubs >= clubBase AND distinguishedClubs >= 45% of clubBase
 *
 * @param metrics - Division metrics
 * @param meetsNoNetLossRequirement - Whether no net club loss requirement is met
 * @returns Gap information for Distinguished level
 *
 * Requirements: 6.2, 9.2
 */
function calculateDistinguishedGap(
  metrics: DivisionMetrics,
  meetsNoNetLossRequirement: boolean
): DivisionGapToLevel {
  const { clubBase, paidClubs, distinguishedClubs } = metrics

  // If no net loss requirement not met, level is not achievable
  if (!meetsNoNetLossRequirement) {
    return {
      achieved: false,
      distinguishedClubsNeeded: 0,
      paidClubsNeeded: Math.max(0, clubBase - paidClubs),
      achievable: false,
    }
  }

  // Edge case: zero clubs
  if (clubBase === 0) {
    return {
      achieved: false,
      distinguishedClubsNeeded: 0,
      paidClubsNeeded: 0,
      achievable: false,
    }
  }

  // Distinguished requires: paidClubs >= clubBase (already met) AND distinguishedClubs >= 45% of clubBase
  const requiredDistinguished = calculateRequiredDistinguishedClubs(
    clubBase,
    DDP_THRESHOLDS.distinguished
  )
  const distinguishedClubsNeeded = Math.max(
    0,
    requiredDistinguished - distinguishedClubs
  )
  const achieved = distinguishedClubsNeeded === 0

  return {
    achieved,
    distinguishedClubsNeeded,
    paidClubsNeeded: 0, // No net loss already met, Distinguished requires base (no additional)
    achievable: true,
  }
}

/**
 * Calculates the gap to Select Distinguished level
 *
 * Select Distinguished Division: paidClubs >= clubBase + 1 AND distinguishedClubs >= 50% of clubBase
 *
 * @param metrics - Division metrics
 * @param meetsNoNetLossRequirement - Whether no net club loss requirement is met
 * @returns Gap information for Select Distinguished level
 *
 * Requirements: 6.3, 9.3
 */
function calculateSelectGap(
  metrics: DivisionMetrics,
  meetsNoNetLossRequirement: boolean
): DivisionGapToLevel {
  const { clubBase, paidClubs, distinguishedClubs } = metrics

  // If no net loss requirement not met, level is not achievable
  if (!meetsNoNetLossRequirement) {
    return {
      achieved: false,
      distinguishedClubsNeeded: 0,
      paidClubsNeeded: Math.max(0, clubBase - paidClubs),
      achievable: false,
    }
  }

  // Edge case: zero clubs
  if (clubBase === 0) {
    return {
      achieved: false,
      distinguishedClubsNeeded: 0,
      paidClubsNeeded: 0,
      achievable: false,
    }
  }

  // Select requires: paidClubs >= clubBase + 1 AND distinguishedClubs >= 50% of clubBase
  const requiredPaidClubs = clubBase + DDP_PAID_CLUBS_OFFSET.select
  const requiredDistinguished = calculateRequiredDistinguishedClubs(
    clubBase,
    DDP_THRESHOLDS.select
  )

  const paidClubsNeeded = Math.max(0, requiredPaidClubs - paidClubs)
  const distinguishedClubsNeeded = Math.max(
    0,
    requiredDistinguished - distinguishedClubs
  )

  // Achieved only if both requirements are met
  const achieved = paidClubsNeeded === 0 && distinguishedClubsNeeded === 0

  return {
    achieved,
    distinguishedClubsNeeded,
    paidClubsNeeded,
    achievable: true, // Achievable since no net loss is met
  }
}

/**
 * Calculates the gap to President's Distinguished level
 *
 * President's Distinguished Division: paidClubs >= clubBase + 2 AND distinguishedClubs >= 55% of clubBase
 *
 * @param metrics - Division metrics
 * @param meetsNoNetLossRequirement - Whether no net club loss requirement is met
 * @returns Gap information for President's Distinguished level
 *
 * Requirements: 6.4, 9.4
 */
function calculatePresidentsGap(
  metrics: DivisionMetrics,
  meetsNoNetLossRequirement: boolean
): DivisionGapToLevel {
  const { clubBase, paidClubs, distinguishedClubs } = metrics

  // If no net loss requirement not met, level is not achievable
  if (!meetsNoNetLossRequirement) {
    return {
      achieved: false,
      distinguishedClubsNeeded: 0,
      paidClubsNeeded: Math.max(0, clubBase - paidClubs),
      achievable: false,
    }
  }

  // Edge case: zero clubs
  if (clubBase === 0) {
    return {
      achieved: false,
      distinguishedClubsNeeded: 0,
      paidClubsNeeded: 0,
      achievable: false,
    }
  }

  // President's requires: paidClubs >= clubBase + 2 AND distinguishedClubs >= 55% of clubBase
  const requiredPaidClubs = clubBase + DDP_PAID_CLUBS_OFFSET.presidents
  const requiredDistinguished = calculateRequiredDistinguishedClubs(
    clubBase,
    DDP_THRESHOLDS.presidents
  )

  const paidClubsNeeded = Math.max(0, requiredPaidClubs - paidClubs)
  const distinguishedClubsNeeded = Math.max(
    0,
    requiredDistinguished - distinguishedClubs
  )

  // Achieved only if both requirements are met
  const achieved = paidClubsNeeded === 0 && distinguishedClubsNeeded === 0

  return {
    achieved,
    distinguishedClubsNeeded,
    paidClubsNeeded,
    achievable: true, // Achievable since no net loss is met
  }
}

/**
 * Calculates complete gap analysis for a division
 *
 * This function determines the current recognition level and calculates
 * the gaps to each recognition level (Distinguished, Select Distinguished,
 * President's Distinguished).
 *
 * DDP Thresholds:
 * - Eligibility: No net club loss (paidClubs >= clubBase)
 * - Distinguished Division: paidClubs >= clubBase AND distinguishedClubs >= 45% of clubBase
 * - Select Distinguished Division: paidClubs >= clubBase + 1 AND distinguishedClubs >= 50% of clubBase
 * - President's Distinguished Division: paidClubs >= clubBase + 2 AND distinguishedClubs >= 55% of clubBase
 *
 * Properties implemented:
 * - Property 1: Recognition Level Classification
 * - Property 2: Gap Calculation Correctness
 *
 * @param metrics - Division metrics (clubBase, paidClubs, distinguishedClubs)
 * @returns Complete gap analysis for the division
 *
 * @example
 * // Division with 50 clubs, 50 paid, 23 distinguished (46% - meets 45% threshold)
 * calculateDivisionGapAnalysis({ clubBase: 50, paidClubs: 50, distinguishedClubs: 23 })
 * // Returns: {
 * //   currentLevel: 'distinguished',
 * //   meetsNoNetLossRequirement: true,
 * //   paidClubsNeeded: 0,
 * //   distinguishedGap: { achieved: true, distinguishedClubsNeeded: 0, paidClubsNeeded: 0, achievable: true },
 * //   selectGap: { achieved: false, distinguishedClubsNeeded: 2, paidClubsNeeded: 1, achievable: true },
 * //   presidentsGap: { achieved: false, distinguishedClubsNeeded: 5, paidClubsNeeded: 2, achievable: true }
 * // }
 *
 * @example
 * // Division with net club loss (paidClubs < clubBase)
 * calculateDivisionGapAnalysis({ clubBase: 50, paidClubs: 48, distinguishedClubs: 25 })
 * // Returns: {
 * //   currentLevel: 'none',
 * //   meetsNoNetLossRequirement: false,
 * //   paidClubsNeeded: 2,
 * //   distinguishedGap: { achieved: false, distinguishedClubsNeeded: 0, paidClubsNeeded: 2, achievable: false },
 * //   selectGap: { achieved: false, distinguishedClubsNeeded: 0, paidClubsNeeded: 2, achievable: false },
 * //   presidentsGap: { achieved: false, distinguishedClubsNeeded: 0, paidClubsNeeded: 2, achievable: false }
 * // }
 *
 * Requirements: 5.2, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 9.4
 */
export function calculateDivisionGapAnalysis(
  metrics: DivisionMetrics
): DivisionGapAnalysis {
  const { clubBase, paidClubs } = metrics

  // Calculate paid clubs gap for no net loss requirement
  const paidClubsNeeded = calculatePaidClubsGap(clubBase, paidClubs)

  // Determine if no net loss requirement is met
  const meetsNoNetLossRequirement = paidClubsNeeded === 0 && clubBase > 0

  // Determine current recognition level (Property 1)
  const currentLevel = determineDivisionRecognitionLevel(metrics)

  // Calculate gaps to each level (Property 2)
  const distinguishedGap = calculateDistinguishedGap(
    metrics,
    meetsNoNetLossRequirement
  )

  const selectGap = calculateSelectGap(metrics, meetsNoNetLossRequirement)

  const presidentsGap = calculatePresidentsGap(
    metrics,
    meetsNoNetLossRequirement
  )

  return {
    currentLevel,
    meetsNoNetLossRequirement,
    paidClubsNeeded,
    distinguishedGap,
    selectGap,
    presidentsGap,
  }
}
