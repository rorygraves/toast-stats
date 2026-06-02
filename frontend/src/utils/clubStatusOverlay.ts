/**
 * Read-time club-status overlay (epic #1062, Sprint 4 #1069).
 *
 * During the month-end closing period the base club/division/district dashboards
 * freeze (the #309 closing logic, scrape↔snapshot date remap). The Daily
 * **Dues Renewal** report keeps moving daily and is program-year-keyed, so it
 * sidesteps that remap. This resolver augments a club's status at READ time from
 * the renewal report — it NEVER mutates the frozen base snapshot.
 *
 * Two non-negotiable rules (from the sprint charter):
 *   - **Promote-only.** The overlay may ONLY upgrade a club to `Active`, and only
 *     when its renewal status is `Verified complete - <date>`. It can never emit
 *     anything but `Active` (the top operational state), so it can never demote.
 *   - **Provenance-explicit.** Every augmented value carries its source + as-of
 *     date so we never silently blend two cadences into one number (the #800 /
 *     D61 150→151 multi-source hazard).
 *
 * Clean hand-off on un-freeze: once the base snapshot reports the club `Active`
 * itself, {@link resolveClubStatusOverlay} returns `null` (the base-Active
 * no-op), so the overlay yields to the authoritative base with no backward jump.
 *
 * @module clubStatusOverlay
 */

import type { DistrictReportsDataset } from '@toastmasters/shared-contracts'

/** The augmented status + provenance attached to a club at read time. */
export interface ClubStatusOverlay {
  /** The augmented status. The overlay only ever promotes to `Active`. */
  status: 'Active'
  /** Where the augmentation came from. */
  source: 'dues-renewal'
  /** The verified-complete date as ISO `YYYY-MM-DD` (the dues were confirmed). */
  activeSince: string
  /** The renewal report's "Updated:" freshness date, e.g. 'June 01, 2026' ('' if absent). */
  asOf: string
}

const VERIFIED_COMPLETE =
  /^\s*verified\s+complete\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/i

/**
 * Parse the verified-complete date out of a Dues Renewal `renewalStatus`.
 *
 * @param renewalStatus e.g. `'Verified complete - 05/31/2026'`.
 * @returns ISO `YYYY-MM-DD`, or `null` for any status that is not a parseable
 *   "Verified complete - MM/DD/YYYY" (e.g. "Not renewed", "Pending", "").
 */
export function parseVerifiedComplete(renewalStatus: string): string | null {
  const m = VERIFIED_COMPLETE.exec(renewalStatus)
  if (!m) return null
  const [, mm = '', dd = '', yyyy = ''] = m
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

/**
 * Resolve the read-time status overlay for a single club.
 *
 * @param baseStatus the club's operational status from the frozen base snapshot
 *   ("Active" | "Low" | "Suspended" | "Ineligible" | undefined).
 * @param renewalStatus the club's `renewalStatus` from the Dues Renewal report.
 * @param asOf the renewal report's "Updated:" freshness date (provenance).
 * @returns the augmented overlay, or `null` when no augmentation applies:
 *   the base is already Active (no-op hand-off), or the report does not verify
 *   the club.
 */
export function resolveClubStatusOverlay(
  baseStatus: string | undefined,
  renewalStatus: string,
  asOf: string
): ClubStatusOverlay | null {
  // Clean hand-off: the base already reports Active — never re-attribute or jump.
  if (baseStatus?.toLowerCase() === 'active') return null

  const activeSince = parseVerifiedComplete(renewalStatus)
  if (!activeSince) return null

  return { status: 'Active', source: 'dues-renewal', activeSince, asOf }
}

/** A club's renewal signal + its source freshness date, keyed by club number. */
export interface DuesRenewalLookup {
  renewalStatus: string
  asOf: string
}

/**
 * Build a `clubNumber → renewal signal` map from a reports dataset's
 * Dues Renewal sections (April + October). The join key is the club **number**
 * (`record.club`), which matches `ClubTrend.clubId`.
 *
 * A club may appear in both seasons; we keep the record with the **later**
 * verified-complete date so the freshest confirmation wins. Non-verified
 * records are retained (the resolver turns them into a no-op anyway).
 *
 * @param dataset the de-identified reports dataset, or `null` if none was
 *   fetched (404 / malformed) — yields an empty map (no overlay anywhere).
 */
export function buildDuesRenewalLookup(
  dataset: DistrictReportsDataset | null
): Map<string, DuesRenewalLookup> {
  const map = new Map<string, DuesRenewalLookup>()
  if (!dataset) return map

  const sections = [
    dataset.sections.aprilDuesRenewal,
    dataset.sections.octoberDuesRenewal,
  ]
  for (const sec of sections) {
    if (!sec) continue
    const asOf = sec.sources[0]?.asOf ?? ''
    for (const rec of sec.records) {
      const candidate: DuesRenewalLookup = {
        renewalStatus: rec.renewalStatus,
        asOf,
      }
      const existing = map.get(rec.club)
      if (!existing) {
        map.set(rec.club, candidate)
        continue
      }
      // Prefer the later verified-complete date; '' (unverified) sorts lowest.
      const newDate = parseVerifiedComplete(candidate.renewalStatus) ?? ''
      const oldDate = parseVerifiedComplete(existing.renewalStatus) ?? ''
      if (newDate > oldDate) map.set(rec.club, candidate)
    }
  }
  return map
}

/** The minimal club shape the overlay reads + writes. `ClubTrend` satisfies it. */
export interface OverlayableClub {
  clubId: string
  clubStatus?: string
  statusOverlay?: ClubStatusOverlay
}

/**
 * Attach the read-time Dues Renewal overlay to each club, IN PLACE. The base
 * `clubStatus` is never mutated — only `statusOverlay` is set, and only for a
 * verified, non-Active club. An empty lookup is a clean no-op.
 *
 * Takes a pre-built lookup (from {@link buildDuesRenewalLookup}) rather than the
 * raw dataset so a caller augmenting several club arrays from one dataset builds
 * the Map once and reuses it across all of them.
 *
 * @param clubs the clubs to augment (mutated).
 * @param lookup the `clubNumber → renewal signal` map for the district.
 */
export function applyDuesRenewalOverlay(
  clubs: OverlayableClub[],
  lookup: Map<string, DuesRenewalLookup>
): void {
  if (lookup.size === 0) return

  for (const club of clubs) {
    const renewal = lookup.get(club.clubId)
    if (!renewal) continue
    const overlay = resolveClubStatusOverlay(
      club.clubStatus,
      renewal.renewalStatus,
      renewal.asOf
    )
    if (overlay) club.statusOverlay = overlay
  }
}
