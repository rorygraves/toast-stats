/**
 * Test helper: derive `recognitionState` for a partial `AreaPerformance` fixture.
 *
 * The component tests don't care about the snapshot-date-aware gate (that's
 * exhaustively tested in `areaRecognitionState.test.ts`). They just need the
 * required field present so the presenter can render. Default snapshot date
 * is mid-PY (`2026-03-15`): R1 deadline has passed but R2 hasn't, so a
 * single-round-unmet fixture yields Provisional rather than hard-fail —
 * preserving pre-#832 "tier name appears in badge" assertions.
 */
import type { AreaPerformance } from '../utils/divisionStatus'
import { deriveAreaRecognitionState } from '../utils/areaRecognitionState'

export function withRecognitionState(
  fixture: Omit<AreaPerformance, 'recognitionState'>,
  snapshotDate = '2026-03-15'
): AreaPerformance {
  return {
    ...fixture,
    recognitionState: deriveAreaRecognitionState({
      clubBase: fixture.clubBase,
      paidClubs: fixture.paidClubs,
      distinguishedClubs: fixture.distinguishedClubs,
      firstRoundVisitMet: fixture.firstRoundVisits.meetsThreshold,
      secondRoundVisitMet: fixture.secondRoundVisits.meetsThreshold,
      snapshotDate,
    }),
  }
}
