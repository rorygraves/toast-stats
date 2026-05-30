import type { ClubDCPProjection } from './dcpProjections'

/**
 * Canonical "Close to Distinguished" predicate (epic #900, Sprint 1 spec in
 * docs/design/close-to-distinguished-predicate-2026-05-28.md).
 *
 * Single source of truth consumed by BOTH the clubs-table preset chip and the
 * club-detail-card banner — neither surface re-derives the rule (Lesson 052).
 *
 * A club is "close" when ALL four hold:
 *   1. Not already Distinguished+ — `currentLevel === 'NotDistinguished'`.
 *   2. Members gap <= 3 — `gapToDistinguished.members`, which
 *      `calculateClubProjection` already computes as the floored
 *      min(20 - members, 3 - netGrowth). We reuse it, never re-derive it.
 *   3. DCP goals >= 3 — 2 or fewer points from the 5 needed.
 *   4. CSP submitted OR unknown — `true` and `undefined` both eligible
 *      (pre-2025 data has no CSP field; treat absent as eligible).
 */
export interface CloseToDistinguishedInput {
  projection: Pick<
    ClubDCPProjection,
    'currentLevel' | 'currentGoals' | 'gapToDistinguished'
  >
  cspSubmitted: boolean | undefined
}

export function isCloseToDistinguished(
  input: CloseToDistinguishedInput
): boolean {
  const { projection, cspSubmitted } = input
  return (
    projection.currentLevel === 'NotDistinguished' &&
    projection.gapToDistinguished.members <= 3 &&
    projection.currentGoals >= 3 &&
    (cspSubmitted === true || cspSubmitted === undefined)
  )
}
