/**
 * Area/division recognition-status diff (#1014, epic #1007 Sprint 2).
 *
 * Pure helper that derives `area-status` / `division-status` change events
 * between two dated district snapshots, to enrich the "What Changed" feed
 * beyond its club-scoped events.
 *
 * It runs the **verified recognition source-of-truth**
 * (`extractDivisionPerformance`) on each snapshot and compares:
 *   - per **division**: the DDP recognition tier (`DistinguishedStatus`);
 *   - per **area**: the snapshot-date-aware recognition *descriptor* — the
 *     `recognitionState` collapsed to Not Distinguished / Provisional <tier> /
 *     Confirmed <tier> (the visit-qualifying gate, #832).
 *
 * Computed in the frontend, NOT the analytics-core `diffSnapshots` engine:
 * #799 deliberately removed recognition-tier logic from analytics-core because
 * it diverged from this source-of-truth (Lesson 117). Keeping the derivation
 * here means one implementation feeds both the rendered tables and this diff.
 *
 * Each emitted `DiffEvent` sets `divisionId` (and `areaId` for areas) plus an
 * `entityName` the `label` begins with, so the feed can link the entity to its
 * scoped route exactly as club events link the club name (#1013).
 *
 * @module diffAreaDivisionStatus
 */

import type {
  DistrictStatisticsFile,
  DiffEvent,
} from '@toastmasters/shared-contracts'
import { extractDivisionPerformance } from './extractDivisionPerformance'
import type {
  DivisionPerformance,
  AreaPerformance,
  DistinguishedStatus,
} from './divisionStatus'

/** Human tier names shared by area + division labels. */
const TIER_LABEL: Record<string, string> = {
  distinguished: 'Distinguished',
  'select-distinguished': 'Select Distinguished',
  'presidents-distinguished': "President's Distinguished",
  // area recognition-LEVEL codes (areaRecognitionState.level)
  select: 'Select Distinguished',
  presidents: "President's Distinguished",
}

function tierLabel(code: string): string {
  return TIER_LABEL[code] ?? 'Distinguished'
}

/** A division is distinguished at any tier above the floor. */
function isDivisionDistinguished(status: DistinguishedStatus): boolean {
  return status !== 'not-distinguished' && status !== 'not-qualified'
}

/** Sort rank for a division tier (higher = stronger recognition). */
function divisionRank(status: DistinguishedStatus): number {
  switch (status) {
    case 'presidents-distinguished':
      return 3
    case 'select-distinguished':
      return 2
    case 'distinguished':
      return 1
    default:
      return 0
  }
}

/**
 * Collapse an area's `recognitionState` to the human descriptor the feed
 * surfaces: "Not Distinguished", or "<Provisional|Confirmed> <tier>".
 */
function areaDescriptor(area: AreaPerformance): string {
  const { level, status } = area.recognitionState
  if (level === 'none' || status === 'not-distinguished') {
    return 'Not Distinguished'
  }
  const prefix = status === 'confirmed' ? 'Confirmed' : 'Provisional'
  return `${prefix} ${tierLabel(level)}`
}

function areaIsDistinguished(area: AreaPerformance): boolean {
  return (
    area.recognitionState.level !== 'none' &&
    area.recognitionState.status !== 'not-distinguished'
  )
}

/** Sort rank for an area state: tier weight, with Confirmed above Provisional. */
function areaRank(area: AreaPerformance): number {
  const { level, status } = area.recognitionState
  if (level === 'none' || status === 'not-distinguished') return 0
  const tier = level === 'presidents' ? 3 : level === 'select' ? 2 : 1
  return tier * 2 + (status === 'confirmed' ? 1 : 0)
}

/** Build the became/lost/moved label fragment shared by both entity kinds. */
function transitionLabel(
  name: string,
  fromDist: boolean,
  toDist: boolean,
  toDescriptor: string
): string | null {
  if (!fromDist && toDist) return `${name} became ${toDescriptor}`
  if (fromDist && !toDist) return `${name} lost Distinguished status`
  if (fromDist && toDist) return `${name} moved to ${toDescriptor}`
  return null // both not-distinguished: no recognition change to surface
}

function divisionsById(
  snapshot: DistrictStatisticsFile
): Map<string, DivisionPerformance> {
  const perf = extractDivisionPerformance(snapshot, snapshot.snapshotDate)
  return new Map(perf.map(d => [d.divisionId, d]))
}

/**
 * Compute area/division recognition-status transition events between two dated
 * snapshots. Only entities present in BOTH snapshots are diffed (a freshly
 * added/removed division surfaces via club roster events, not a phantom
 * status flip). Returns events sorted by descending magnitude.
 */
export function diffAreaDivisionStatus(
  from: DistrictStatisticsFile,
  to: DistrictStatisticsFile
): DiffEvent[] {
  const fromDivs = divisionsById(from)
  const toDivs = divisionsById(to)
  const events: DiffEvent[] = []

  for (const [divisionId, toDiv] of toDivs) {
    const fromDiv = fromDivs.get(divisionId)
    if (!fromDiv) continue

    // Division tier transition.
    if (fromDiv.status !== toDiv.status) {
      const name = `Division ${divisionId}`
      const label = transitionLabel(
        name,
        isDivisionDistinguished(fromDiv.status),
        isDivisionDistinguished(toDiv.status),
        tierLabel(toDiv.status)
      )
      if (label) {
        events.push({
          category: 'division-status',
          clubId: '',
          clubName: '',
          divisionId,
          entityName: name,
          label,
          magnitude: divisionRank(toDiv.status) - divisionRank(fromDiv.status),
        })
      }
    }

    // Area transitions within the division.
    const fromAreas = new Map(fromDiv.areas.map(a => [a.areaId, a]))
    for (const toArea of toDiv.areas) {
      const fromArea = fromAreas.get(toArea.areaId)
      if (!fromArea) continue
      const fromDesc = areaDescriptor(fromArea)
      const toDesc = areaDescriptor(toArea)
      if (fromDesc === toDesc) continue

      const name = `Area ${toArea.areaId}`
      const label = transitionLabel(
        name,
        areaIsDistinguished(fromArea),
        areaIsDistinguished(toArea),
        toDesc
      )
      if (!label) continue
      events.push({
        category: 'area-status',
        clubId: '',
        clubName: '',
        divisionId,
        areaId: toArea.areaId,
        entityName: name,
        label,
        magnitude: areaRank(toArea) - areaRank(fromArea),
      })
    }
  }

  // Biggest absolute recognition swing first; stable tie-break by entity name.
  events.sort((a, b) => {
    const byMag = Math.abs(b.magnitude) - Math.abs(a.magnitude)
    if (byMag !== 0) return byMag
    return (a.entityName ?? '').localeCompare(b.entityName ?? '')
  })

  return events
}
