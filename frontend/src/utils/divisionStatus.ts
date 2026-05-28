/**
 * Division and Area Performance Status Calculation Module
 *
 * This module provides TypeScript types and interfaces for calculating
 * and representing division and area distinguished status according to
 * Toastmasters International criteria.
 *
 * Requirements: 2.1, 2.6, 5.5, 7.3
 */

import { determineDivisionRecognitionLevel } from './divisionGapAnalysis'
import type { AreaRecognitionState } from './areaRecognitionState'

/**
 * Distinguished status levels for divisions and areas
 *
 * - 'not-distinguished': Does not meet Distinguished criteria
 * - 'distinguished': Meets Distinguished criteria (≥45% for divisions, ≥50% for areas)
 * - 'select-distinguished': Meets Select Distinguished criteria
 * - 'presidents-distinguished': Meets President's Distinguished criteria
 * - 'not-qualified': Area-specific status when qualifying requirements are not met
 *
 * Requirements: 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4
 */
export type DistinguishedStatus =
  | 'not-distinguished'
  | 'distinguished'
  | 'select-distinguished'
  | 'presidents-distinguished'
  | 'not-qualified' // For areas only

/**
 * Visit completion status for area directors
 *
 * Tracks the number of completed visits, required visits (75% of club base),
 * completion percentage, and whether the 75% threshold is met.
 *
 * Requirements: 7.3, 7.4
 */
export interface VisitStatus {
  /** Number of completed visits */
  completed: number
  /** Required number of visits (75% of club base, rounded up) */
  required: number
  /** Completion percentage (0-100) */
  percentage: number
  /** Whether the 75% threshold is met */
  meetsThreshold: boolean
}

/**
 * Performance metrics and status for a single area
 *
 * Contains all data needed to display area performance in the
 * Area Performance Table, including club counts, visit status,
 * and distinguished status classification.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */
export interface AreaPerformance {
  /** Area identifier (e.g., "A1", "B2") */
  areaId: string
  /** Current distinguished status level */
  status: DistinguishedStatus
  /** Number of clubs at the start of the program year */
  clubBase: number
  /** Current number of clubs that have met membership payment requirements */
  paidClubs: number
  /** Net growth: (paidClubs - clubBase), can be positive, negative, or zero */
  netGrowth: number
  /** Current number of clubs that have achieved Distinguished status */
  distinguishedClubs: number
  /** Required number of distinguished clubs (50% of club base, rounded up) */
  requiredDistinguishedClubs: number
  /** First round visit completion status (Nov Visit award) */
  firstRoundVisits: VisitStatus
  /** Second round visit completion status (May visit award) */
  secondRoundVisits: VisitStatus
  /** Whether the area meets all qualifying requirements */
  isQualified: boolean
  /**
   * Snapshot-date-aware recognition state — the source of truth for the
   * area's recognition badge. See `deriveAreaRecognitionState` (#832).
   * Components MUST read this rather than re-deriving deadline-blind
   * provisional logic locally.
   */
  recognitionState: AreaRecognitionState
}

/**
 * Performance metrics and status for a single division
 *
 * Contains division-level summary data and an array of all areas
 * within the division. Used to render the Division Performance Card
 * with summary section and area table.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4
 */
export interface DivisionPerformance {
  /** Division identifier (e.g., "A", "B", "C") */
  divisionId: string
  /** Current distinguished status level (divisions cannot be 'not-qualified') */
  status: Exclude<DistinguishedStatus, 'not-qualified'>
  /** Number of clubs at the start of the program year */
  clubBase: number
  /** Current number of clubs that have met membership payment requirements */
  paidClubs: number
  /** Net growth: (paidClubs - clubBase), can be positive, negative, or zero */
  netGrowth: number
  /** Current number of clubs that have achieved Distinguished status */
  distinguishedClubs: number
  /**
   * Required distinguished clubs for the division's Distinguished tier — DDP
   * 45% of club base, rounded up (NOT the 50% area/DAP rule). Sourced from
   * `calculateDivisionDistinguishedRequirement` in divisionGapAnalysis (#799).
   */
  requiredDistinguishedClubs: number
  /** Array of all areas within this division */
  areas: AreaPerformance[]
}

/**
 * Calculates the required number of distinguished clubs for a given club base
 *
 * The threshold is calculated as 50% of the club base, rounded up using Math.ceil().
 * This ensures that divisions and areas must achieve at least half of their clubs
 * as distinguished to meet the base requirement.
 *
 * @param clubBase - The number of clubs at the start of the program year
 * @returns The required number of distinguished clubs (50% of club base, rounded up)
 *
 * @example
 * calculateRequiredDistinguishedClubs(10) // Returns 5 (50% of 10)
 * calculateRequiredDistinguishedClubs(11) // Returns 6 (50% of 11 = 5.5, rounded up)
 * calculateRequiredDistinguishedClubs(1)  // Returns 1 (50% of 1 = 0.5, rounded up)
 * calculateRequiredDistinguishedClubs(0)  // Returns 0 (edge case: no clubs)
 *
 * Requirements: 2.1, 5.5
 */
export function calculateRequiredDistinguishedClubs(clubBase: number): number {
  // Handle edge case of zero club base
  if (clubBase === 0) {
    return 0
  }

  // Calculate 50% of club base and round up
  return Math.ceil(clubBase * 0.5)
}

/**
 * Calculates net growth for a division or area
 *
 * Net growth represents the change in the number of paid clubs compared to
 * the club base at the start of the program year. It can be:
 * - Positive: More paid clubs than the base (growth)
 * - Negative: Fewer paid clubs than the base (decline)
 * - Zero: Same number of paid clubs as the base (no change)
 *
 * @param paidClubs - Current number of clubs that have met membership payment requirements
 * @param clubBase - Number of clubs at the start of the program year
 * @returns Net growth (paidClubs - clubBase)
 *
 * @example
 * calculateNetGrowth(12, 10) // Returns 2 (positive growth)
 * calculateNetGrowth(8, 10)  // Returns -2 (negative growth/decline)
 * calculateNetGrowth(10, 10) // Returns 0 (no change)
 *
 * Requirements: 2.6
 */
export function calculateNetGrowth(
  paidClubs: number,
  clubBase: number
): number {
  return paidClubs - clubBase
}

/**
 * Calculates visit completion status for area directors
 *
 * Determines whether an area has met the 75% visit completion threshold
 * for a given round of visits (first or second round). The required number
 * of visits is calculated as 75% of the club base, rounded up.
 *
 * @param completedVisits - Number of visits completed by the area director
 * @param clubBase - Number of clubs at the start of the program year
 * @returns VisitStatus object with completion metrics and threshold status
 *
 * @example
 * calculateVisitStatus(3, 4)  // Returns { completed: 3, required: 3, percentage: 75, meetsThreshold: true }
 * calculateVisitStatus(7, 10) // Returns { completed: 7, required: 8, percentage: 70, meetsThreshold: false }
 * calculateVisitStatus(8, 10) // Returns { completed: 8, required: 8, percentage: 80, meetsThreshold: true }
 * calculateVisitStatus(0, 1)  // Returns { completed: 0, required: 1, percentage: 0, meetsThreshold: false }
 *
 * Requirements: 7.3, 7.4
 */
export function calculateVisitStatus(
  completedVisits: number,
  clubBase: number
): VisitStatus {
  // Handle edge case of zero club base
  if (clubBase === 0) {
    return {
      completed: completedVisits,
      required: 0,
      percentage: 0,
      meetsThreshold: false,
    }
  }

  // Calculate required visits as 75% of club base, rounded up
  const required = Math.ceil(clubBase * 0.75)

  // Calculate completion percentage
  const percentage = (completedVisits / clubBase) * 100

  // Determine if 75% threshold is met
  const meetsThreshold = completedVisits >= required

  return {
    completed: completedVisits,
    required,
    percentage,
    meetsThreshold,
  }
}

/**
 * Calculates division distinguished status (the recognition badge tier).
 *
 * Divisions follow the **Distinguished Division Program (DDP)**, NOT the area
 * program. DDP thresholds (District Recognition Program manual, item 1490):
 * - Distinguished: distinguished ≥ 45% of base AND no net club loss (paid ≥ base)
 * - Select: distinguished ≥ 50% of base AND paid ≥ base + 1
 * - President's: distinguished ≥ 55% of base AND paid ≥ base + 2
 *
 * The tier is delegated to `determineDivisionRecognitionLevel`
 * (`divisionGapAnalysis.ts`) — the single source of truth that the card's
 * gap/summary line also uses. The badge and the gap line therefore agree by
 * construction; the DDP threshold table lives in exactly one place. This
 * function only maps that recognition level to the badge's `DistinguishedStatus`
 * enum. See docs/investigations/798-division-recognition-thresholds.md.
 *
 * (Areas use 50%/50%+1 with visit requirements — see `calculateAreaStatus`.)
 *
 * @param distinguishedClubs - Clubs that have achieved Distinguished status
 * @param paidClubs - Clubs that have met membership payment requirements
 * @param clubBase - Number of clubs at the start of the program year
 * @returns Distinguished status level (cannot be 'not-qualified' for divisions)
 *
 * @example
 * // D61 Division G: base 16, paid 17, dist 8 → Select (50% + base+1 paid)
 * calculateDivisionStatus(8, 17, 16) // Returns 'select-distinguished'
 *
 * // D61 Division H: base 17, paid 18, dist 8 → Distinguished (45% + base paid)
 * calculateDivisionStatus(8, 18, 17) // Returns 'distinguished'
 *
 * Requirements: 2.2, 2.3, 2.4, 2.5
 */
export function calculateDivisionStatus(
  distinguishedClubs: number,
  paidClubs: number,
  clubBase: number
): Exclude<DistinguishedStatus, 'not-qualified'> {
  const level = determineDivisionRecognitionLevel({
    clubBase,
    paidClubs,
    distinguishedClubs,
  })

  switch (level) {
    case 'presidents':
      return 'presidents-distinguished'
    case 'select':
      return 'select-distinguished'
    case 'distinguished':
      return 'distinguished'
    case 'none':
      return 'not-distinguished'
  }
}

/**
 * Determines if an area meets qualifying requirements for distinguished status
 *
 * An area must meet ALL three qualifying criteria to be eligible for any
 * distinguished status level:
 * 1. No net club loss (paid clubs ≥ club base, i.e., net growth ≥ 0)
 * 2. First round visits ≥ 75% of club base
 * 3. Second round visits ≥ 75% of club base
 *
 * If any criterion is not met, the area is marked as not qualified and
 * cannot achieve Distinguished, Select Distinguished, or President's Distinguished status.
 *
 * @param netGrowth - Net growth (paidClubs - clubBase), can be positive, negative, or zero
 * @param firstRoundVisits - First round visit completion status (Nov Visit award)
 * @param secondRoundVisits - Second round visit completion status (May visit award)
 * @returns true if all three qualifying criteria are met, false otherwise
 *
 * @example
 * // Qualified: no club loss, both visit rounds ≥ 75%
 * const firstRound = { completed: 3, required: 3, percentage: 75, meetsThreshold: true }
 * const secondRound = { completed: 3, required: 3, percentage: 75, meetsThreshold: true }
 * checkAreaQualifying(0, firstRound, secondRound) // Returns true
 *
 * // Not qualified: net club loss
 * checkAreaQualifying(-1, firstRound, secondRound) // Returns false
 *
 * // Not qualified: first round visits below 75%
 * const lowFirstRound = { completed: 2, required: 3, percentage: 67, meetsThreshold: false }
 * checkAreaQualifying(0, lowFirstRound, secondRound) // Returns false
 *
 * // Not qualified: second round visits below 75%
 * const lowSecondRound = { completed: 2, required: 3, percentage: 67, meetsThreshold: false }
 * checkAreaQualifying(0, firstRound, lowSecondRound) // Returns false
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function checkAreaQualifying(
  netGrowth: number,
  firstRoundVisits: VisitStatus,
  secondRoundVisits: VisitStatus
): boolean {
  // Check criterion 1: No net club loss (net growth ≥ 0)
  const noClubLoss = netGrowth >= 0

  // Check criterion 2: First round visits ≥ 75%
  const firstRoundMet = firstRoundVisits.meetsThreshold

  // Check criterion 3: Second round visits ≥ 75%
  const secondRoundMet = secondRoundVisits.meetsThreshold

  // Area is qualified only if ALL three criteria are met
  return noClubLoss && firstRoundMet && secondRoundMet
}

/**
 * Calculates area distinguished status based on metrics and qualifying requirements
 *
 * Determines the distinguished status level for an area according to Toastmasters
 * International criteria. Unlike divisions, areas must first meet qualifying
 * requirements before they can achieve any distinguished status level.
 *
 * The qualifying gate is applied first:
 * - If the area is NOT qualified, the status is "not-qualified" regardless of other metrics
 * - If the area IS qualified, the same classification rules as divisions are applied
 *
 * Status levels for qualified areas (in order of precedence):
 * 1. President's Distinguished: distinguished clubs ≥ (threshold + 1) AND net growth ≥ 1
 * 2. Select Distinguished: distinguished clubs ≥ (threshold + 1) AND paid clubs ≥ base
 * 3. Distinguished: distinguished clubs ≥ threshold AND paid clubs ≥ base
 * 4. Not Distinguished: Does not meet Distinguished criteria
 *
 * @param isQualified - Whether the area meets all qualifying requirements
 * @param distinguishedClubs - Current number of clubs that have achieved Distinguished status
 * @param requiredDistinguishedClubs - Required number of distinguished clubs (50% of club base, rounded up)
 * @param paidClubs - Current number of clubs that have met membership payment requirements
 * @param clubBase - Number of clubs at the start of the program year
 * @param netGrowth - Net growth (paidClubs - clubBase), can be positive, negative, or zero
 * @returns Distinguished status level (including 'not-qualified' for areas)
 *
 * @example
 * // Not qualified area with excellent metrics - still returns 'not-qualified'
 * calculateAreaStatus(false, 8, 5, 12, 10, 2) // Returns 'not-qualified'
 *
 * // Qualified area with President's Distinguished metrics
 * calculateAreaStatus(true, 6, 5, 11, 10, 1) // Returns 'presidents-distinguished'
 *
 * // Qualified area with Select Distinguished metrics
 * calculateAreaStatus(true, 6, 5, 10, 10, 0) // Returns 'select-distinguished'
 *
 * // Qualified area with Distinguished metrics
 * calculateAreaStatus(true, 5, 5, 10, 10, 0) // Returns 'distinguished'
 *
 * // Qualified area with insufficient metrics
 * calculateAreaStatus(true, 4, 5, 10, 10, 0) // Returns 'not-distinguished'
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function calculateAreaStatus(
  isQualified: boolean,
  distinguishedClubs: number,
  requiredDistinguishedClubs: number,
  paidClubs: number,
  clubBase: number,
  netGrowth: number
): DistinguishedStatus {
  // Apply qualifying gate first
  // If area is not qualified, return 'not-qualified' regardless of other metrics
  if (!isQualified) {
    return 'not-qualified'
  }

  // If area is qualified, apply the same classification logic as divisions
  // President's Distinguished: distinguished ≥ (threshold + 1) AND net growth ≥ 1
  if (distinguishedClubs >= requiredDistinguishedClubs + 1 && netGrowth >= 1) {
    return 'presidents-distinguished'
  }

  // Select Distinguished: distinguished ≥ (threshold + 1) AND paid ≥ base
  if (
    distinguishedClubs >= requiredDistinguishedClubs + 1 &&
    paidClubs >= clubBase
  ) {
    return 'select-distinguished'
  }

  // Distinguished: distinguished ≥ threshold AND paid ≥ base
  if (
    distinguishedClubs >= requiredDistinguishedClubs &&
    paidClubs >= clubBase
  ) {
    return 'distinguished'
  }

  // Not Distinguished: Does not meet Distinguished criteria
  return 'not-distinguished'
}
