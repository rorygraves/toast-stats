import { describe, it, expect } from 'vitest'
import { diffAreaDivisionStatus } from '../diffAreaDivisionStatus'
import type { DistrictStatisticsFile } from '@toastmasters/shared-contracts'

/* Pure diff helper for area/division recognition-status transitions (#1014,
   epic #1007 Sprint 2). It runs the verified frontend recognition
   source-of-truth (`extractDivisionPerformance`) on both dated snapshots and
   emits a `division-status` / `area-status` DiffEvent wherever a recognition
   tier (division) or a recognition-state descriptor (area: Provisional /
   Confirmed / Not Distinguished) changes. Computed in the frontend, NOT
   analytics-core — #799 removed tier logic there to avoid divergence
   (Lesson 117). No page mount (R22). */

/** A single club row pair: divisionPerformance row + matching clubPerformance row. */
function club(o: {
  division: string
  area: string
  num: string
  divBase: string
  areaBase: string
  nov: string
  may: string
  distinguished?: boolean
}) {
  return {
    dp: {
      Division: o.division,
      Area: o.area,
      'Club Number': o.num,
      'Division Club Base': o.divBase,
      'Area Club Base': o.areaBase,
      'Nov Visit award': o.nov,
      'May Visit award': o.may,
    },
    cp: {
      'Club Number': o.num,
      'Club Status': 'Active',
      'Club Distinguished Status': o.distinguished ? 'Distinguished' : '',
    },
  }
}

function snapshot(
  snapshotDate: string,
  pairs: ReturnType<typeof club>[]
): DistrictStatisticsFile {
  return {
    districtId: '61',
    snapshotDate,
    divisionPerformance: pairs.map(p => p.dp),
    clubPerformance: pairs.map(p => p.cp),
  } as unknown as DistrictStatisticsFile
}

/* Division G (base 4): 2 distinguished + paid goes 4 → 5, so Distinguished
   (paid≥base) → Select (paid≥base+1). Its area "1" carries an inflated Area
   Club Base (10) so it is perpetually net-loss → Not Distinguished in BOTH
   snapshots and emits no area event — isolating the division transition. */
function divisionGClubs(extraPaidClub: boolean) {
  const base = [
    club({ division: 'G', area: '1', num: 'g1', divBase: '4', areaBase: '10', nov: '0', may: '0', distinguished: true }), // prettier-ignore
    club({ division: 'G', area: '1', num: 'g2', divBase: '4', areaBase: '10', nov: '0', may: '0', distinguished: true }), // prettier-ignore
    club({
      division: 'G',
      area: '1',
      num: 'g3',
      divBase: '4',
      areaBase: '10',
      nov: '0',
      may: '0',
    }),
    club({
      division: 'G',
      area: '1',
      num: 'g4',
      divBase: '4',
      areaBase: '10',
      nov: '0',
      may: '0',
    }),
  ]
  if (extraPaidClub) {
    base.push(
      club({ division: 'G', area: '1', num: 'g5', divBase: '4', areaBase: '10', nov: '0', may: '0' }) // prettier-ignore
    )
  }
  return base
}

/* Division B (base 4): paid 4, distinguished 2 in BOTH snapshots → Distinguished
   throughout (no division event). Its area "2" (base 4) earns Distinguished on
   club metrics; round-1 visits are met in both, round-2 visits flip 0 → met,
   so the area moves Provisional → Confirmed in a March snapshot (R2 deadline
   May 31 not yet passed). */
function divisionBClubs(round2Met: boolean) {
  const may = round2Met ? '1' : '0'
  return [
    club({ division: 'B', area: '2', num: 'b1', divBase: '4', areaBase: '4', nov: '1', may, distinguished: true }), // prettier-ignore
    club({ division: 'B', area: '2', num: 'b2', divBase: '4', areaBase: '4', nov: '1', may, distinguished: true }), // prettier-ignore
    club({
      division: 'B',
      area: '2',
      num: 'b3',
      divBase: '4',
      areaBase: '4',
      nov: '1',
      may,
    }),
    club({
      division: 'B',
      area: '2',
      num: 'b4',
      divBase: '4',
      areaBase: '4',
      nov: '1',
      may,
    }),
  ]
}

describe('diffAreaDivisionStatus (#1014)', () => {
  it('emits a division-status event when a division moves Distinguished → Select', () => {
    const from = snapshot('2026-03-10', [
      ...divisionGClubs(false),
      ...divisionBClubs(false),
    ])
    const to = snapshot('2026-03-20', [
      ...divisionGClubs(true),
      ...divisionBClubs(false),
    ])

    const events = diffAreaDivisionStatus(from, to)
    const div = events.filter(e => e.category === 'division-status')

    expect(div).toHaveLength(1)
    expect(div[0]).toMatchObject({
      category: 'division-status',
      divisionId: 'G',
      entityName: 'Division G',
      label: 'Division G moved to Select Distinguished',
    })
    expect(div[0].clubId).toBe('')
    expect(div[0].areaId).toBeUndefined()
  })

  it('emits an area-status event when an area moves Provisional → Confirmed', () => {
    const from = snapshot('2026-03-10', [
      ...divisionGClubs(false),
      ...divisionBClubs(false),
    ])
    const to = snapshot('2026-03-20', [
      ...divisionGClubs(false),
      ...divisionBClubs(true),
    ])

    const events = diffAreaDivisionStatus(from, to)
    const area = events.filter(e => e.category === 'area-status')

    expect(area).toHaveLength(1)
    expect(area[0]).toMatchObject({
      category: 'area-status',
      areaId: '2',
      divisionId: 'B',
      entityName: 'Area 2',
      label: 'Area 2 moved to Confirmed Distinguished',
    })
    // The area carries its division so the feed can build the scoped route.
    expect(area[0].clubId).toBe('')
  })

  it('emits nothing when the two snapshots are identical', () => {
    const from = snapshot('2026-03-10', [
      ...divisionGClubs(false),
      ...divisionBClubs(false),
    ])
    const to = snapshot('2026-03-20', [
      ...divisionGClubs(false),
      ...divisionBClubs(false),
    ])

    expect(diffAreaDivisionStatus(from, to)).toEqual([])
  })
})
