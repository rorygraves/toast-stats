/**
 * Pure snapshot-to-snapshot diff engine ("What Changed", epic #797 Sprint 1).
 *
 * `diffSnapshots(from, to)` takes two dated `DistrictStatisticsFile` snapshots
 * and returns a `SnapshotDiff`: aggregate KPI deltas, a three-way club
 * partition, and a categorized, narrative-ready event list. No I/O — reusable
 * by a future collector pre-compute step (Phase 4) without rewrite.
 *
 * Load-bearing data facts (verified against live staging CDN, 2026-05-27):
 *   - Distinguished counts/flips come from raw `clubPerformance`
 *     "Club Distinguished Status" (`'' | D | S | P | M`), NOT `totals.*` —
 *     those are unpopulated mid-year and would always read 0 (Lesson 115).
 *   - Roster appear/disappear is a visibility/status signal, classified by
 *     `clubStatus`, never an error (Lesson 118).
 *   - DCP signals use the raw `dcpGoals` count, never inferred Goals 1-N order.
 *
 * @module diffSnapshots
 * @see docs/design/what-changed-feature.md §3-§4
 */

import type {
  DistrictStatisticsFile,
  ClubStatisticsFile,
  AggregateDelta,
  ClubDiff,
  ClubPresence,
  DiffEvent,
  SnapshotDiff,
} from '@toastmasters/shared-contracts'

function aggregate(from: number, to: number): AggregateDelta {
  return { from, to, delta: to - from }
}

/** Calendar days between two YYYY-MM-DD dates (absolute, whole days). */
function dayCountBetween(fromDate: string, toDate: string): number {
  const a = Date.parse(`${fromDate}T00:00:00Z`)
  const b = Date.parse(`${toDate}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.round(Math.abs(b - a) / 86_400_000)
}

/** Per-club distinguished status code keyed by clubId, from clubPerformance. */
function distinguishedByClub(
  snapshot: DistrictStatisticsFile
): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of snapshot.clubPerformance) {
    const clubId = String(row['Club Number'] ?? '')
    if (!clubId) continue
    const raw = row['Club Distinguished Status']
    map.set(clubId, raw == null ? '' : String(raw))
  }
  return map
}

const TIER_NAMES: Record<string, string> = {
  D: 'Distinguished',
  S: 'Select Distinguished',
  P: "President's Distinguished",
  M: 'Distinguished',
}

function tierName(code: string): string {
  return TIER_NAMES[code] ?? 'Distinguished'
}

function membershipLabel(name: string, delta: number): string {
  const n = Math.abs(delta)
  const noun = n === 1 ? 'member' : 'members'
  return delta > 0 ? `${name} gained ${n} ${noun}` : `${name} lost ${n} ${noun}`
}

function dcpLabel(name: string, delta: number): string {
  const n = Math.abs(delta)
  const noun = n === 1 ? 'goal' : 'goals'
  return delta > 0
    ? `${name} met ${n} more DCP ${noun}`
    : `${name} dropped ${n} DCP ${noun}`
}

function distinguishedLabel(name: string, from: string, to: string): string {
  if (!from && to) return `${name} became ${tierName(to)}`
  if (from && !to) return `${name} lost Distinguished status`
  return `${name} moved to ${tierName(to)}`
}

function presence(club: ClubStatisticsFile): ClubPresence {
  return {
    clubId: club.clubId,
    clubName: club.clubName,
    divisionId: club.divisionId,
    areaId: club.areaId,
    clubStatus: club.clubStatus ?? club.status,
  }
}

function rosterLabel(verb: string, club: ClubStatisticsFile): string {
  const status = club.clubStatus ?? club.status
  return `${club.clubName} (${status}) ${verb} the roster`
}

export function diffSnapshots(
  from: DistrictStatisticsFile,
  to: DistrictStatisticsFile
): SnapshotDiff {
  const fromDist = distinguishedByClub(from)
  const toDist = distinguishedByClub(to)

  const fromClubs = new Map(from.clubs.map(c => [c.clubId, c]))
  const toClubs = new Map(to.clubs.map(c => [c.clubId, c]))

  const distinguishedCount = (m: Map<string, string>): number =>
    [...m.values()].filter(s => s !== '').length

  const bothPresent: ClubDiff[] = []
  const onlyInFrom: ClubPresence[] = []
  const onlyInTo: ClubPresence[] = []
  const events: DiffEvent[] = []

  for (const [clubId, fromClub] of fromClubs) {
    const toClub = toClubs.get(clubId)
    if (!toClub) {
      onlyInFrom.push(presence(fromClub))
      events.push({
        category: 'club-removed',
        clubId,
        clubName: fromClub.clubName,
        label: rosterLabel('left', fromClub),
        magnitude: -1,
      })
      continue
    }

    const distFrom = fromDist.get(clubId) ?? ''
    const distTo = toDist.get(clubId) ?? ''
    const membership = aggregate(
      fromClub.membershipCount,
      toClub.membershipCount
    )
    const payments = aggregate(fromClub.paymentsCount, toClub.paymentsCount)
    const dcpGoals = aggregate(fromClub.dcpGoals, toClub.dcpGoals)

    bothPresent.push({
      clubId,
      clubName: toClub.clubName,
      divisionId: toClub.divisionId,
      areaId: toClub.areaId,
      membership,
      payments,
      dcpGoals,
      distinguishedFrom: distFrom,
      distinguishedTo: distTo,
      distinguishedChanged: distFrom !== distTo,
    })

    if (membership.delta !== 0) {
      events.push({
        category: 'membership',
        clubId,
        clubName: toClub.clubName,
        label: membershipLabel(toClub.clubName, membership.delta),
        magnitude: membership.delta,
      })
    }
    if (dcpGoals.delta !== 0) {
      events.push({
        category: 'dcp-goals',
        clubId,
        clubName: toClub.clubName,
        label: dcpLabel(toClub.clubName, dcpGoals.delta),
        magnitude: dcpGoals.delta,
      })
    }
    if (distFrom !== distTo) {
      const gained = !distFrom && distTo
      const lost = distFrom && !distTo
      events.push({
        category: 'distinguished',
        clubId,
        clubName: toClub.clubName,
        label: distinguishedLabel(toClub.clubName, distFrom, distTo),
        magnitude: gained ? 1 : lost ? -1 : 0,
      })
    }
  }

  for (const [clubId, toClub] of toClubs) {
    if (fromClubs.has(clubId)) continue
    onlyInTo.push(presence(toClub))
    events.push({
      category: 'club-added',
      clubId,
      clubName: toClub.clubName,
      label: rosterLabel('joined', toClub),
      magnitude: 1,
    })
  }

  // Biggest absolute change first; stable tie-break by name then clubId.
  events.sort((a, b) => {
    const byMag = Math.abs(b.magnitude) - Math.abs(a.magnitude)
    if (byMag !== 0) return byMag
    const byName = a.clubName.localeCompare(b.clubName)
    return byName !== 0 ? byName : a.clubId.localeCompare(b.clubId)
  })

  return {
    districtId: to.districtId,
    from: { date: from.snapshotDate },
    to: { date: to.snapshotDate },
    dayCount: dayCountBetween(from.snapshotDate, to.snapshotDate),
    totals: {
      membership: aggregate(
        from.totals.totalMembership,
        to.totals.totalMembership
      ),
      payments: aggregate(from.totals.totalPayments, to.totals.totalPayments),
      clubCount: aggregate(from.totals.totalClubs, to.totals.totalClubs),
      distinguished: aggregate(
        distinguishedCount(fromDist),
        distinguishedCount(toDist)
      ),
    },
    clubs: { bothPresent, onlyInFrom, onlyInTo },
    events,
  }
}
