import { describe, it, expect } from 'vitest'
import { diffSnapshots } from './diffSnapshots.js'
import type {
  DistrictStatisticsFile,
  ClubStatisticsFile,
  ScrapedRecord,
} from '@toastmasters/shared-contracts'

function club(
  over: Partial<ClubStatisticsFile> & { clubId: string }
): ClubStatisticsFile {
  return {
    clubName: `Club ${over.clubId}`,
    divisionId: 'A',
    areaId: '01',
    membershipCount: 20,
    paymentsCount: 25,
    dcpGoals: 0,
    status: 'Active',
    divisionName: 'Division A',
    areaName: 'Area 01',
    octoberRenewals: 0,
    aprilRenewals: 0,
    newMembers: 0,
    membershipBase: 20,
    clubStatus: 'Active',
    ...over,
  }
}

function perf(clubId: string, distinguished: string | null): ScrapedRecord {
  return {
    'Club Number': clubId,
    'Club Distinguished Status': distinguished,
  }
}

function snapshot(opts: {
  date: string
  clubs: ClubStatisticsFile[]
  perf?: ScrapedRecord[]
}): DistrictStatisticsFile {
  const { clubs } = opts
  return {
    districtId: '61',
    snapshotDate: opts.date,
    clubs,
    divisions: [],
    areas: [],
    totals: {
      totalClubs: clubs.length,
      totalMembership: clubs.reduce((s, c) => s + c.membershipCount, 0),
      totalPayments: clubs.reduce((s, c) => s + c.paymentsCount, 0),
      // Deliberately 0 — mirrors live data where totals.distinguished* is
      // unpopulated mid-year (Lesson 115). The engine must NOT read these.
      distinguishedClubs: 0,
      selectDistinguishedClubs: 0,
      presidentDistinguishedClubs: 0,
    },
    divisionPerformance: [],
    clubPerformance: opts.perf ?? clubs.map(c => perf(c.clubId, '')),
    districtPerformance: [],
  }
}

describe('diffSnapshots', () => {
  it('computes signed aggregate deltas from totals (membership, payments, clubCount)', () => {
    const from = snapshot({
      date: '2026-05-25',
      clubs: [club({ clubId: '001', membershipCount: 20, paymentsCount: 22 })],
    })
    const to = snapshot({
      date: '2026-05-26',
      clubs: [club({ clubId: '001', membershipCount: 26, paymentsCount: 25 })],
    })
    const diff = diffSnapshots(from, to)
    expect(diff.totals.membership).toEqual({ from: 20, to: 26, delta: 6 })
    expect(diff.totals.payments).toEqual({ from: 22, to: 25, delta: 3 })
    expect(diff.totals.clubCount).toEqual({ from: 1, to: 1, delta: 0 })
    expect(diff.districtId).toBe('61')
    expect(diff.from.date).toBe('2026-05-25')
    expect(diff.to.date).toBe('2026-05-26')
    expect(diff.dayCount).toBe(1)
  })

  it('counts distinguished from clubPerformance, NOT totals (Lesson 115)', () => {
    // totals.distinguishedClubs stays 0 in both; clubPerformance tells the truth.
    const from = snapshot({
      date: '2026-05-25',
      clubs: [club({ clubId: '001' }), club({ clubId: '002' })],
      perf: [perf('001', 'D'), perf('002', '')],
    })
    const to = snapshot({
      date: '2026-05-26',
      clubs: [club({ clubId: '001' }), club({ clubId: '002' })],
      perf: [perf('001', 'D'), perf('002', 'S')],
    })
    const diff = diffSnapshots(from, to)
    // 1 distinguished -> 2 distinguished, despite totals.distinguishedClubs == 0
    expect(diff.totals.distinguished).toEqual({ from: 1, to: 2, delta: 1 })
  })

  it('partitions clubs into bothPresent / onlyInFrom / onlyInTo', () => {
    const from = snapshot({
      date: '2026-05-25',
      clubs: [club({ clubId: '001' }), club({ clubId: 'gone' })],
    })
    const to = snapshot({
      date: '2026-05-26',
      clubs: [club({ clubId: '001' }), club({ clubId: 'new' })],
    })
    const diff = diffSnapshots(from, to)
    expect(diff.clubs.bothPresent.map(c => c.clubId)).toEqual(['001'])
    expect(diff.clubs.onlyInFrom.map(c => c.clubId)).toEqual(['gone'])
    expect(diff.clubs.onlyInTo.map(c => c.clubId)).toEqual(['new'])
  })

  it('classifies roster appear/disappear with clubStatus, not as an error (Lesson 118)', () => {
    const from = snapshot({
      date: '2026-05-25',
      clubs: [club({ clubId: 'susp', clubStatus: 'Suspended' })],
    })
    const to = snapshot({
      date: '2026-05-26',
      clubs: [club({ clubId: 'new', clubStatus: 'Active' })],
    })
    const diff = diffSnapshots(from, to)
    expect(diff.clubs.onlyInFrom[0]?.clubStatus).toBe('Suspended')
    expect(diff.clubs.onlyInTo[0]?.clubStatus).toBe('Active')
    const added = diff.events.find(e => e.category === 'club-added')
    const removed = diff.events.find(e => e.category === 'club-removed')
    expect(added?.label).toMatch(/Active/)
    expect(removed?.label).toMatch(/Suspended/)
  })

  it('emits a per-club ClubDiff with signed membership/dcpGoals/distinguished change', () => {
    const from = snapshot({
      date: '2026-05-25',
      clubs: [club({ clubId: '001', membershipCount: 20, dcpGoals: 3 })],
      perf: [perf('001', '')],
    })
    const to = snapshot({
      date: '2026-05-26',
      clubs: [club({ clubId: '001', membershipCount: 18, dcpGoals: 6 })],
      perf: [perf('001', 'D')],
    })
    const cd = diffSnapshots(from, to).clubs.bothPresent[0]!
    expect(cd.membership.delta).toBe(-2)
    expect(cd.dcpGoals.delta).toBe(3)
    expect(cd.distinguishedFrom).toBe('')
    expect(cd.distinguishedTo).toBe('D')
    expect(cd.distinguishedChanged).toBe(true)
  })

  it('produces categorized events for every change kind', () => {
    const from = snapshot({
      date: '2026-05-25',
      clubs: [
        club({ clubId: '001', membershipCount: 20, dcpGoals: 2 }),
        club({ clubId: 'gone' }),
      ],
      perf: [perf('001', ''), perf('gone', '')],
    })
    const to = snapshot({
      date: '2026-05-26',
      clubs: [
        club({ clubId: '001', membershipCount: 23, dcpGoals: 5 }),
        club({ clubId: 'new' }),
      ],
      perf: [perf('001', 'D'), perf('new', '')],
    })
    const cats = new Set(diffSnapshots(from, to).events.map(e => e.category))
    expect(cats).toEqual(
      new Set([
        'membership',
        'dcp-goals',
        'distinguished',
        'club-added',
        'club-removed',
      ])
    )
  })

  it('returns no events when nothing changed (valid outcome)', () => {
    const a = snapshot({
      date: '2026-05-25',
      clubs: [club({ clubId: '001' })],
    })
    const b = snapshot({
      date: '2026-05-26',
      clubs: [club({ clubId: '001' })],
    })
    expect(diffSnapshots(a, b).events).toEqual([])
  })

  it('sorts events by descending absolute magnitude', () => {
    const from = snapshot({
      date: '2026-05-25',
      clubs: [
        club({ clubId: 'big', membershipCount: 20 }),
        club({ clubId: 'small', membershipCount: 20 }),
      ],
    })
    const to = snapshot({
      date: '2026-05-26',
      clubs: [
        club({ clubId: 'big', membershipCount: 30 }),
        club({ clubId: 'small', membershipCount: 19 }),
      ],
    })
    const events = diffSnapshots(from, to).events
    expect(Math.abs(events[0]!.magnitude)).toBeGreaterThanOrEqual(
      Math.abs(events[1]!.magnitude)
    )
    expect(events[0]!.clubId).toBe('big')
  })

  it('tolerates null distinguished status from clubPerformance', () => {
    const from = snapshot({
      date: '2026-05-25',
      clubs: [club({ clubId: '001' })],
      perf: [perf('001', null)],
    })
    const to = snapshot({
      date: '2026-05-26',
      clubs: [club({ clubId: '001' })],
      perf: [perf('001', null)],
    })
    const diff = diffSnapshots(from, to)
    expect(diff.totals.distinguished).toEqual({ from: 0, to: 0, delta: 0 })
    expect(diff.clubs.bothPresent[0]!.distinguishedChanged).toBe(false)
  })
})
