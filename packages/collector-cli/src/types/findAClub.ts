/**
 * Shared types for the Find-A-Club merge pipeline.
 *
 * Kept separate from the FindAClubService schema so the merger can be
 * unit-tested with simple typed fixtures without spinning up Zod
 * parsing.
 */

import type { ClubEnrichment } from '../services/FindAClubService.js'

export const TI_CLUB_NUMBER_KEY = 'Club Number'

/** Raw response from the FAC fetch (subset — only the fields we read). */
export interface FacRawResponse {
  Clubs: unknown[] | null
  district?: string | null
}

/** District snapshot shape (subset — only the fields we read/write). */
export interface DistrictSnapshot {
  districtId?: string
  data?: {
    clubPerformance?: unknown[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

/** A clubPerformance row with optional FAC enrichment fields layered on. */
export type EnrichedClub = Record<string, unknown> & Partial<ClubEnrichment>

/** Output of mergeFacIntoSnapshot. */
export interface MergeResult {
  snapshot: DistrictSnapshot
  matched: number
  snapshotOnly: number
  facOnly: number
  /** FAC clubs that had no matching snapshot row (typically ATO /
   *  prospective). NOT merged into snapshot.data.clubPerformance —
   *  callers can surface them separately. See #489. */
  facOnlyClubs: ClubEnrichment[]
}
