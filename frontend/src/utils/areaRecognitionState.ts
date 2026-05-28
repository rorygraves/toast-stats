/**
 * Area Recognition Gate — snapshot-date-aware (#832).
 *
 * Source-of-truth that enforces the Distinguished Area Program qualifying
 * club-visit requirement (item 1490, p.10 of the Toastmasters District
 * Recognition Program manual):
 *
 *   - R1: ≥75% of the area's club base visited by **Nov 30**
 *         of the program-year start year
 *   - R2: ≥75% by **May 31** of the program-year end year
 *
 * For an area that earns Distinguished/Select/President's on club metrics
 * (50% / 50%+1 / 50%+1+growth), this gate returns:
 *
 *   - 'confirmed'           — all rounds met
 *   - 'provisional'         — a round is unmet but its deadline has NOT passed
 *   - 'not-distinguished'   — a round's deadline has passed unmet (hard fail)
 *
 * Reference date is the snapshot's `asOfDate` (not wall-clock) so historical
 * snapshots gate correctly.
 *
 * `AreaPerformanceRow` is a pure presenter that reads this state — it must
 * NOT re-derive deadline-blind provisional logic locally. See #832.
 */

import {
  determineRecognitionLevel,
  type RecognitionLevel,
} from './areaGapAnalysis'

export type AreaRecognitionLevel = RecognitionLevel
export type AreaRecognitionStatus =
  | 'confirmed'
  | 'provisional'
  | 'not-distinguished'

export type AreaRecognitionFailureReason =
  | 'net-loss'
  | 'missed-deadline'
  | 'insufficient-distinguished'
  | null

export interface PendingRound {
  round: 1 | 2
  /** Deadline as an ISO `YYYY-MM-DD` string (Nov 30 or May 31). */
  deadline: string
}

export interface AreaRecognitionState {
  /** Earned tier on club metrics, OR `'none'` if visit gate hard-failed. */
  level: AreaRecognitionLevel
  status: AreaRecognitionStatus
  /** Visit rounds still pending (only populated for `'provisional'`). */
  pendingRounds: PendingRound[]
  failureReason: AreaRecognitionFailureReason
}

export interface AreaRecognitionInput {
  clubBase: number
  paidClubs: number
  distinguishedClubs: number
  firstRoundVisitMet: boolean
  secondRoundVisitMet: boolean
  /** Snapshot/as-of date in `YYYY-MM-DD` form. */
  snapshotDate: string
}

/**
 * Normalise any ISO-shaped input to `YYYY-MM-DD`. Date-only strings pass
 * through; full ISO timestamps (`'2025-11-30T15:00:00Z'`) get sliced so
 * the lexical `snapshotDate > deadline` comparison below holds the
 * "deadline day itself is not yet passed" invariant — without the slice,
 * any time-of-day suffix lexically sorts after the bare date and flips
 * the comparison on the deadline day itself.
 */
function toIsoDate(dateStr: string): string {
  return dateStr.slice(0, 10)
}

/**
 * Program-year anchor: Jul 1 starts a new PY.
 * Returns the 4-digit start year for the PY containing `dateStr`.
 *
 * String-slice parsing is intentional — `new Date(yyyy-mm-dd).getFullYear()`
 * is timezone-sensitive (UTC midnight in `Date` parses to the prior local
 * day west of UTC), so we side-step the JS `Date` constructor entirely.
 */
function programYearStartYear(dateStr: string): number {
  const iso = toIsoDate(dateStr)
  const year = Number.parseInt(iso.slice(0, 4), 10)
  const month = Number.parseInt(iso.slice(5, 7), 10)
  return month >= 7 ? year : year - 1
}

/**
 * Returns the R1 and R2 deadlines for the program year containing `snapshotDate`.
 */
export function getAreaVisitDeadlines(snapshotDate: string): {
  r1: string
  r2: string
} {
  const start = programYearStartYear(snapshotDate)
  return {
    r1: `${start}-11-30`,
    r2: `${start + 1}-05-31`,
  }
}

/**
 * Derive area recognition state, gated on the visit requirement with
 * snapshot-date deadline awareness.
 */
export function deriveAreaRecognitionState(
  input: AreaRecognitionInput
): AreaRecognitionState {
  const {
    clubBase,
    paidClubs,
    distinguishedClubs,
    firstRoundVisitMet,
    secondRoundVisitMet,
    snapshotDate,
  } = input

  // Net loss is reported as the failure reason even when visit deadlines have
  // also passed unmet — operators care more about the club-loss signal.
  if (clubBase > 0 && paidClubs < clubBase) {
    return {
      level: 'none',
      status: 'not-distinguished',
      pendingRounds: [],
      failureReason: 'net-loss',
    }
  }

  const earnedLevel = determineRecognitionLevel({
    clubBase,
    paidClubs,
    distinguishedClubs,
  })

  if (earnedLevel === 'none') {
    return {
      level: 'none',
      status: 'not-distinguished',
      pendingRounds: [],
      failureReason: clubBase === 0 ? null : 'insufficient-distinguished',
    }
  }

  const { r1, r2 } = getAreaVisitDeadlines(snapshotDate)
  // Strict `>` on date-only strings. Normalising via `toIsoDate` guards
  // against ISO-timestamp callers (`'2025-11-30T15:00:00Z' > '2025-11-30'`
  // would otherwise be true and silently flip the deadline-day case).
  const isoSnapshot = toIsoDate(snapshotDate)
  const r1Passed = isoSnapshot > r1
  const r2Passed = isoSnapshot > r2

  const hardFailR1 = r1Passed && !firstRoundVisitMet
  const hardFailR2 = r2Passed && !secondRoundVisitMet
  if (hardFailR1 || hardFailR2) {
    return {
      level: 'none',
      status: 'not-distinguished',
      pendingRounds: [],
      failureReason: 'missed-deadline',
    }
  }

  if (firstRoundVisitMet && secondRoundVisitMet) {
    return {
      level: earnedLevel,
      status: 'confirmed',
      pendingRounds: [],
      failureReason: null,
    }
  }

  const pendingRounds: PendingRound[] = []
  if (!firstRoundVisitMet) pendingRounds.push({ round: 1, deadline: r1 })
  if (!secondRoundVisitMet) pendingRounds.push({ round: 2, deadline: r2 })

  return {
    level: earnedLevel,
    status: 'provisional',
    pendingRounds,
    failureReason: null,
  }
}
