/**
 * Area Progress Text Generation Module
 *
 * This module provides functions for generating concise English paragraphs
 * describing an area's progress toward Distinguished Area recognition.
 *
 * The generated text includes:
 * - Current recognition level achieved (or that it's not yet distinguished)
 * - Current metrics (paid clubs, distinguished clubs)
 * - What's needed to reach the next achievable level
 * - Incremental differences for higher levels (building on previous requirements)
 * - Club visit status when available
 *
 * Requirements: 5.1, 5.2, 5.3, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { AreaWithDivision } from '../components/DivisionAreaProgressSummary'
import { GapAnalysis, RecognitionLevel } from './areaGapAnalysis'
import type { MissingVisitClub } from './divisionStatus'

/**
 * Result of generating progress text for an area
 */
export interface AreaProgressText {
  /** Area identifier with division context (e.g., "Area A1 (Division A)") */
  areaLabel: string
  /** Current recognition level achieved */
  currentLevel: RecognitionLevel
  /** Concise paragraph describing progress and gaps */
  progressText: string
}

/**
 * Get human-readable label for recognition level
 *
 * @param level - Recognition level
 * @returns Human-readable label
 */
function getRecognitionLevelLabel(level: RecognitionLevel): string {
  switch (level) {
    case 'presidents':
      return "President's Distinguished"
    case 'select':
      return 'Select Distinguished'
    case 'distinguished':
      return 'Distinguished'
    default:
      return 'not yet distinguished'
  }
}

/**
 * Generate the area label with division context
 *
 * @param area - Area with division information
 * @returns Formatted area label (e.g., "Area A1 (Division A)")
 */
function generateAreaLabel(area: AreaWithDivision): string {
  return `Area ${area.areaId} (Division ${area.divisionId})`
}

/**
 * Generate the current metrics description
 *
 * @param area - Area performance data
 * @returns Metrics string (e.g., "4 of 4 clubs paid, 2 of 4 distinguished")
 */
function generateMetricsDescription(area: AreaWithDivision): string {
  return `${area.paidClubs} of ${area.clubBase} clubs paid, ${area.distinguishedClubs} of ${area.clubBase} distinguished`
}

/**
 * Fixed Distinguished Area Program visit deadline label for a round (item 1490):
 * R1 is due Nov 30, R2 is due May 31. The month/day is invariant across program
 * years, so a static label is correct and matches the operator's wording (#974).
 */
function visitDeadlineLabel(round: 1 | 2): string {
  return round === 1 ? 'Nov 30' : 'May 31'
}

/** Join club names for prose display: "A, B, C". */
function formatMissingClubNames(clubs: MissingVisitClub[]): string {
  return clubs.map(club => club.clubName).join(', ')
}

/**
 * Describe the area's CURRENT-round club-visit progress, naming the active
 * clubs that still need a visit report and flagging any suspended/ineligible
 * clubs separately. Reads the snapshot-derived source-of-truth fields added in
 * Sprint 1 (#973) — the round is never re-derived here (R3).
 *
 * Requirements: 6.7, 6.8 (#974)
 */
function generateMissingVisitClause(area: AreaWithDivision): string {
  const round = area.currentRound
  const roundVisits =
    round === 1 ? area.firstRoundVisits : area.secondRoundVisits
  const missing = area.clubsMissingCurrentRoundVisit
  const ineligible = area.clubsMissingCurrentRoundVisitIneligible

  let clause: string
  if (area.clubBase === 0) {
    clause = `Round ${round} club visits: no clubs in area.`
  } else if (missing.length === 0) {
    clause = `Round ${round} club visits: all clubs visited.`
  } else {
    const clubWord = missing.length === 1 ? 'active club' : 'active clubs'
    const verb = missing.length === 1 ? 'needs' : 'need'
    clause =
      `Round ${round} club visits: ${roundVisits.completed} of ${area.clubBase} complete` +
      ` — ${missing.length} ${clubWord} still ${verb} a visit report: ${formatMissingClubNames(missing)}.`
  }

  if (ineligible.length > 0) {
    const clubWord = ineligible.length === 1 ? 'club' : 'clubs'
    clause += ` (${ineligible.length} suspended/ineligible ${clubWord} excluded.)`
  }

  return clause
}

/**
 * State whether the area has met the current round's qualifying visit metric
 * and what that means for Distinguished recognition. Driven entirely by the
 * #832 `recognitionState` source of truth — no deadline logic is re-derived
 * here (R3). The "needs N more" count is presentation arithmetic against the
 * round's own 75% threshold, not a re-derivation of recognition.
 *
 * Requirements: 6.7 (#974)
 */
function generateVisitRecognitionImpact(area: AreaWithDivision): string {
  if (area.clubBase === 0) {
    return ''
  }

  const round = area.currentRound
  const roundVisits =
    round === 1 ? area.firstRoundVisits : area.secondRoundVisits
  const { status, pendingRounds, failureReason } = area.recognitionState

  if (status === 'confirmed') {
    return (
      `The area has met the Round ${round} visit requirement (75%+), ` +
      `so visits won't block Distinguished recognition.`
    )
  }

  if (status === 'provisional') {
    const currentPending = pendingRounds.find(r => r.round === round)
    if (currentPending) {
      const remaining = Math.max(
        0,
        roundVisits.required - roundVisits.completed
      )
      const visitWord = remaining === 1 ? 'visit' : 'visits'
      return (
        `The Round ${round} visit requirement (75%) is not yet met; ` +
        `until it is, the area can only be Provisional — needs ${remaining} more ` +
        `${visitWord} by ${visitDeadlineLabel(round)}.`
      )
    }
    // The current round is met; a different round keeps the area Provisional.
    const otherPending = pendingRounds[0]
    if (otherPending) {
      return (
        `The area has met the Round ${round} visit requirement (75%), but ` +
        `remains Provisional until Round ${otherPending.round} is met by ` +
        `${visitDeadlineLabel(otherPending.round)}.`
      )
    }
    return `The area has met the Round ${round} visit requirement (75%).`
  }

  // status === 'not-distinguished'
  if (failureReason === 'missed-deadline') {
    // Attribute the miss to the current round when it is the unmet one; else to
    // the other (already-passed) round.
    const curMet =
      round === 1
        ? area.firstRoundVisits.meetsThreshold
        : area.secondRoundVisits.meetsThreshold
    const missedRound: 1 | 2 = curMet ? (round === 1 ? 2 : 1) : round
    return (
      `The Round ${missedRound} visit deadline (${visitDeadlineLabel(missedRound)}) ` +
      `passed without 75%, so the area cannot be Distinguished this year.`
    )
  }

  if (failureReason === 'net-loss') {
    // Net club loss is the headline blocker (stated earlier); the visit metric
    // is informational only here.
    return roundVisits.meetsThreshold
      ? `The Round ${round} visit requirement (75%) is met.`
      : ''
  }

  // insufficient-distinguished (or null): visits are not the gating shortfall.
  return roundVisits.meetsThreshold
    ? `The Round ${round} visit requirement (75%) is met; the remaining gap is in distinguished clubs, not visits.`
    : `Meeting the Round ${round} visit requirement (75%) is one of the remaining requirements for Distinguished.`
}

/**
 * Compose the full current-round club-visit text: the named missing-clubs
 * clause followed by the qualifying-metric → Distinguished-impact sentence.
 */
function generateCurrentRoundVisitText(area: AreaWithDivision): string {
  const clause = generateMissingVisitClause(area)
  const impact = generateVisitRecognitionImpact(area)
  return impact ? `${clause} ${impact}` : clause
}

/**
 * Generate text describing what's needed for Distinguished level
 *
 * @param gapAnalysis - Gap analysis for the area
 * @returns Text describing gap to Distinguished, or empty string if achieved
 */
function generateDistinguishedGapText(gapAnalysis: GapAnalysis): string {
  if (gapAnalysis.distinguishedGap.achieved) {
    return ''
  }

  const clubsNeeded = gapAnalysis.distinguishedGap.distinguishedClubsNeeded
  const clubWord = clubsNeeded === 1 ? 'club needs' : 'clubs need'

  return `For Distinguished, ${clubsNeeded} ${clubWord} to become distinguished.`
}

/**
 * Generate text describing what's needed for Select Distinguished level
 * (incremental from Distinguished)
 *
 * @param gapAnalysis - Gap analysis for the area
 * @returns Text describing incremental gap to Select, or empty string if achieved
 */
function generateSelectGapText(gapAnalysis: GapAnalysis): string {
  if (gapAnalysis.selectGap.achieved) {
    return ''
  }

  // Calculate incremental clubs needed beyond Distinguished
  const distinguishedClubsForDistinguished =
    gapAnalysis.distinguishedGap.distinguishedClubsNeeded
  const distinguishedClubsForSelect =
    gapAnalysis.selectGap.distinguishedClubsNeeded

  // If Distinguished is already achieved, show full gap to Select
  if (gapAnalysis.distinguishedGap.achieved) {
    const clubWord =
      distinguishedClubsForSelect === 1 ? 'club needs' : 'clubs need'
    return `For Select Distinguished, ${distinguishedClubsForSelect} more ${clubWord} to become distinguished.`
  }

  // Otherwise, show incremental difference
  const incrementalClubs =
    distinguishedClubsForSelect - distinguishedClubsForDistinguished

  if (incrementalClubs <= 0) {
    // Select requires same distinguished clubs as Distinguished (just different threshold calculation)
    // This shouldn't happen with correct DAP rules, but handle gracefully
    return 'For Select Distinguished, 1 additional club.'
  }

  const clubWord = incrementalClubs === 1 ? 'club' : 'clubs'
  return `For Select Distinguished, ${incrementalClubs} additional ${clubWord}.`
}

/**
 * Generate text describing what's needed for President's Distinguished level
 * (incremental from Select)
 *
 * @param gapAnalysis - Gap analysis for the area
 * @returns Text describing incremental gap to President's, or empty string if achieved
 */
function generatePresidentsGapText(gapAnalysis: GapAnalysis): string {
  if (gapAnalysis.presidentsGap.achieved) {
    return ''
  }

  const parts: string[] = []

  // Check if additional paid clubs are needed (beyond Select)
  const paidClubsNeeded = gapAnalysis.presidentsGap.paidClubsNeeded

  // Check if additional distinguished clubs are needed (beyond Select)
  const selectDistinguishedNeeded =
    gapAnalysis.selectGap.distinguishedClubsNeeded
  const presidentsDistinguishedNeeded =
    gapAnalysis.presidentsGap.distinguishedClubsNeeded
  const incrementalDistinguished =
    presidentsDistinguishedNeeded - selectDistinguishedNeeded

  // If Select is achieved, we only need to mention paid clubs
  if (gapAnalysis.selectGap.achieved) {
    if (paidClubsNeeded > 0) {
      const clubWord = paidClubsNeeded === 1 ? 'paid club' : 'paid clubs'
      parts.push(`add ${paidClubsNeeded} ${clubWord}`)
    }
  } else {
    // Build incremental description
    if (paidClubsNeeded > 0) {
      const clubWord = paidClubsNeeded === 1 ? 'paid club' : 'paid clubs'
      parts.push(`add ${paidClubsNeeded} ${clubWord}`)
    }

    // Only mention distinguished clubs if there's an increment beyond Select
    if (incrementalDistinguished > 0) {
      const clubWord =
        incrementalDistinguished === 1
          ? 'distinguished club'
          : 'distinguished clubs'
      parts.push(`${incrementalDistinguished} more ${clubWord}`)
    }
  }

  if (parts.length === 0) {
    return ''
  }

  // Use "also" to indicate this builds on previous requirements
  const prefix =
    gapAnalysis.distinguishedGap.achieved || gapAnalysis.selectGap.achieved
      ? "For President's Distinguished, "
      : "For President's Distinguished, also "

  return `${prefix}${parts.join(' and ')}.`
}

/**
 * Generate text for an area with net club loss
 *
 * Requirements: 6.1, 6.6
 *
 * @param area - Area performance data
 * @param gapAnalysis - Gap analysis for the area
 * @returns Text describing eligibility requirement and subsequent gaps
 */
function generateNetLossText(
  area: AreaWithDivision,
  gapAnalysis: GapAnalysis
): string {
  const paidClubsNeeded = gapAnalysis.paidClubsNeeded
  const clubWord = paidClubsNeeded === 1 ? 'paid club' : 'paid clubs'

  const parts: string[] = []

  // First explain the eligibility requirement
  parts.push(`To become eligible, add ${paidClubsNeeded} ${clubWord}.`)

  // Then describe what's needed for each level after eligibility
  // Calculate what would be needed once eligibility is met
  const clubBase = area.clubBase
  const distinguishedClubs = area.distinguishedClubs

  // Distinguished requires 50% of club base
  const distinguishedThreshold = Math.ceil(clubBase * 0.5)
  const distinguishedNeeded = Math.max(
    0,
    distinguishedThreshold - distinguishedClubs
  )

  if (distinguishedNeeded > 0) {
    const dClubWord = distinguishedNeeded === 1 ? 'club needs' : 'clubs need'
    parts.push(
      `Then for Distinguished, ${distinguishedNeeded} ${dClubWord} to become distinguished.`
    )
  } else {
    parts.push('Then Distinguished requirements would be met.')
  }

  return parts.join(' ')
}

/**
 * Generate text for an area that has achieved a recognition level
 *
 * Requirements: 6.5, 6.6
 *
 * @param area - Area performance data
 * @param gapAnalysis - Gap analysis for the area
 * @returns Text describing achievement and any remaining gaps
 */
function generateAchievedText(
  area: AreaWithDivision,
  gapAnalysis: GapAnalysis
): string {
  const levelLabel = getRecognitionLevelLabel(gapAnalysis.currentLevel)
  const metrics = generateMetricsDescription(area)
  const visitText = generateCurrentRoundVisitText(area)

  // President's Distinguished - no further gaps to mention
  if (gapAnalysis.currentLevel === 'presidents') {
    return `has achieved ${levelLabel} status (${metrics}). ${visitText}`
  }

  // Select Distinguished - mention gap to President's
  if (gapAnalysis.currentLevel === 'select') {
    const presidentsGap = generatePresidentsGapText(gapAnalysis)
    return `has achieved ${levelLabel} status (${metrics}). ${presidentsGap} ${visitText}`
  }

  // Distinguished - mention gaps to Select and President's
  if (gapAnalysis.currentLevel === 'distinguished') {
    const selectGap = generateSelectGapText(gapAnalysis)
    const presidentsGap = generatePresidentsGapText(gapAnalysis)
    return `has achieved ${levelLabel} status (${metrics}). ${selectGap} ${presidentsGap} ${visitText}`
  }

  // Should not reach here, but handle gracefully
  return `has achieved ${levelLabel} status.`
}

/**
 * Generate text for an area that is not yet distinguished
 *
 * Requirements: 5.2, 5.3, 6.2, 6.3, 6.4
 *
 * @param area - Area performance data
 * @param gapAnalysis - Gap analysis for the area
 * @returns Text describing current status and all gaps
 */
function generateNotDistinguishedText(
  area: AreaWithDivision,
  gapAnalysis: GapAnalysis
): string {
  const metrics = generateMetricsDescription(area)

  const distinguishedGap = generateDistinguishedGapText(gapAnalysis)
  const selectGap = generateSelectGapText(gapAnalysis)
  const presidentsGap = generatePresidentsGapText(gapAnalysis)
  const visitText = generateCurrentRoundVisitText(area)

  return `is not yet distinguished (${metrics}). ${distinguishedGap} ${selectGap} ${presidentsGap} ${visitText}`
}

/**
 * Generates a concise English paragraph describing an area's progress
 * toward Distinguished Area recognition.
 *
 * The generated text includes:
 * - Current status and recognition level achieved
 * - Current metrics (paid clubs, distinguished clubs)
 * - Eligibility requirements (no net club loss) if not met
 * - What's needed for the next level (building incrementally)
 * - Additional requirements for higher levels (only the differences)
 * - Club visit status when available
 *
 * Examples:
 * - "Area A1 (Division A) has achieved President's Distinguished status with all club visits complete."
 * - "Area A2 (Division A) has achieved Distinguished status (4 of 4 clubs paid, 2 of 4 distinguished).
 *    For Select Distinguished, 1 more club needs to become distinguished.
 *    For President's Distinguished, also add 1 paid club.
 *    Club visits: 4 of 4 first-round complete, 2 of 4 second-round complete."
 * - "Area B1 (Division B) has a net club loss (3 of 4 clubs paid). To become eligible,
 *    add 1 paid club. Then for Distinguished, 2 clubs need to become distinguished.
 *    Club visits: first-round 75% complete (3 of 4), second-round not started."
 * - "Area C1 (Division C) is not yet distinguished (4 of 4 clubs paid, 1 of 4 distinguished).
 *    For Distinguished, 1 more club needs to become distinguished.
 *    For Select Distinguished, 1 additional club. For President's Distinguished, also add 1 paid club.
 *    Club visits: status unknown."
 *
 * Requirements: 5.1, 5.2, 5.3, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 *
 * @param area - Area with division information (carries the Sprint 1 #973
 *   current-round visit fields and the #832 recognitionState)
 * @param gapAnalysis - Gap analysis for the area
 * @returns AreaProgressText with label, level, and progress paragraph
 */
export function generateAreaProgressText(
  area: AreaWithDivision,
  gapAnalysis: GapAnalysis
): AreaProgressText {
  const areaLabel = generateAreaLabel(area)
  const currentLevel = gapAnalysis.currentLevel

  let progressText: string

  // Handle net club loss scenario first (Requirement 6.1)
  if (!gapAnalysis.meetsNoNetLossRequirement) {
    const metrics = generateMetricsDescription(area)
    const netLossText = generateNetLossText(area, gapAnalysis)
    const visitText = generateCurrentRoundVisitText(area)
    progressText = `${areaLabel} has a net club loss (${metrics}). ${netLossText} ${visitText}`
  }
  // Handle achieved recognition levels (Requirement 6.5)
  else if (gapAnalysis.currentLevel !== 'none') {
    progressText = `${areaLabel} ${generateAchievedText(area, gapAnalysis)}`
  }
  // Handle not yet distinguished (Requirements 5.2, 5.3, 6.2, 6.3, 6.4)
  else {
    progressText = `${areaLabel} ${generateNotDistinguishedText(area, gapAnalysis)}`
  }

  // Clean up any double spaces
  progressText = progressText.replace(/\s+/g, ' ').trim()

  return {
    areaLabel,
    currentLevel,
    progressText,
  }
}
