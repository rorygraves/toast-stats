/**
 * FindAClubMerger — joins a district snapshot's \`clubPerformance\`
 * array with the FAC fetch output for that district, copying the
 * optional enrichment fields onto each matched club.
 *
 * Semantics (#429 follow-up):
 *
 *   - Snapshot is the spine. For every club in \`clubPerformance\`,
 *     look up the FAC record by \`Club Number\` (8-char zero-padded).
 *   - Matched: copy charterDate / coordinates / address / email / etc.
 *   - Snapshot-only: leave as-is. The FAC fields are all optional, so
 *     a missing match is a no-op. Most of the 410 'missing from FAC'
 *     clubs land here — see #490 for the pattern investigation.
 *   - FAC-only (ATOs / prospective): NOT merged into clubPerformance —
 *     they have no membership / DCP / status, would break analytics.
 *     Captured separately in the merge result so callers can decide
 *     whether to surface them. See #489 for the UI-placement design.
 *
 * The merger is pure data: takes parsed objects in, returns a new
 * snapshot. No I/O. The CLI command in cli.ts handles file reads /
 * writes around it.
 */

import {
  TI_CLUB_NUMBER_KEY,
  type FacRawResponse,
  type DistrictSnapshot,
  type EnrichedClub,
  type MergeResult,
} from '../types/findAClub.js'
import { normaliseTiClub } from './FindAClubService.js'

/** 8-char zero-pad a club number from anywhere (CSV row, FAC payload). */
export function normaliseClubNumber(raw: unknown): string | null {
  if (raw == null) return null
  const s = typeof raw === 'number' ? String(raw) : String(raw).trim()
  if (!s) return null
  // Strip non-digits; clubPerformance rows occasionally have stray
  // whitespace, leading apostrophes from CSV import quirks, etc.
  const digits = s.replace(/\D/g, '')
  if (!digits) return null
  return digits.padStart(8, '0')
}

/**
 * Merge a FAC fetch result into a district snapshot.
 *
 * Idempotent: running twice with the same inputs produces the same
 * output. Re-runs overwrite previously-merged fields with the latest
 * FAC values (which is what we want — TI's registry is the source of
 * truth for the enrichment fields).
 */
export function mergeFacIntoSnapshot(
  snapshot: DistrictSnapshot,
  fac: FacRawResponse
): MergeResult {
  const cp = snapshot.data?.clubPerformance
  if (!Array.isArray(cp)) {
    return {
      snapshot,
      matched: 0,
      snapshotOnly: 0,
      facOnly: 0,
      facOnlyClubs: [],
    }
  }

  // Build the FAC lookup keyed by 8-char club number.
  const facByClubId = new Map<string, ReturnType<typeof normaliseTiClub>>()
  const facClubs = Array.isArray(fac?.Clubs) ? fac.Clubs : []
  for (const raw of facClubs) {
    if (typeof raw !== 'object' || raw === null) continue
    // normaliseTiClub takes a parsed TiClub (Zod-validated); at runtime
    // it tolerates the unknown shape because every field is optional
    // and it bails on missing Id. The cast keeps TS happy without
    // re-validating shape we already trust from the fetch step.
    const enriched = normaliseTiClub(
      raw as Parameters<typeof normaliseTiClub>[0]
    )
    if (enriched && enriched.clubId) {
      facByClubId.set(enriched.clubId, enriched)
    }
  }

  let matched = 0
  let snapshotOnly = 0
  const matchedIds = new Set<string>()

  // Mutating the snapshot in-place would couple us to JSON.parse'd
  // shapes; clone the array so callers can hold onto the original
  // for diffing.
  const enrichedClubs: EnrichedClub[] = cp.map(rawRow => {
    if (typeof rawRow !== 'object' || rawRow === null) {
      snapshotOnly += 1
      return rawRow as EnrichedClub
    }
    const row = rawRow as Record<string, unknown>
    const clubId = normaliseClubNumber(row[TI_CLUB_NUMBER_KEY])
    if (!clubId) {
      snapshotOnly += 1
      return rawRow as EnrichedClub
    }
    const facHit = facByClubId.get(clubId)
    if (!facHit) {
      snapshotOnly += 1
      return rawRow as EnrichedClub
    }
    matched += 1
    matchedIds.add(clubId)
    // Spread the FAC enrichment alongside the existing snapshot fields.
    // Snapshot fields win on collision — TI dashboard is canonical for
    // DCP / payments / status; FAC is only authoritative for the
    // optional enrichment fields it adds.
    return {
      ...row,
      ...(facHit.charterDate && { charterDate: facHit.charterDate }),
      ...(facHit.coordinates && { coordinates: facHit.coordinates }),
      ...(facHit.address && { address: facHit.address }),
      ...(facHit.email && { email: facHit.email }),
      ...(facHit.phone && { phone: facHit.phone }),
      ...(facHit.website && { website: facHit.website }),
      ...(facHit.facebookLink && { facebookLink: facHit.facebookLink }),
      ...(facHit.twitterLink && { twitterLink: facHit.twitterLink }),
      ...(facHit.meetingDay && { meetingDay: facHit.meetingDay }),
      ...(facHit.meetingTime && { meetingTime: facHit.meetingTime }),
      ...(typeof facHit.allowsVirtualAttendance === 'boolean' && {
        allowsVirtualAttendance: facHit.allowsVirtualAttendance,
      }),
      ...(typeof facHit.isProspective === 'boolean' && {
        isProspective: facHit.isProspective,
      }),
    }
  })

  // FAC-only clubs: in FAC but not in snapshot. These are typically
  // ATOs / prospective (#489). We don't merge them into clubPerformance
  // (would corrupt analytics), but we do return them so callers can
  // surface them separately or log the count.
  const facOnlyClubs: NonNullable<ReturnType<typeof normaliseTiClub>>[] = []
  for (const [clubId, enriched] of facByClubId) {
    if (!matchedIds.has(clubId) && enriched) {
      facOnlyClubs.push(enriched)
    }
  }

  return {
    snapshot: {
      ...snapshot,
      data: {
        ...snapshot.data,
        clubPerformance: enrichedClubs,
      },
    },
    matched,
    snapshotOnly,
    facOnly: facOnlyClubs.length,
    facOnlyClubs,
  }
}
