import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { DistrictReportsDatasetSchema } from '@toastmasters/shared-contracts'

import {
  buildDistrictReports,
  REPORT_GUIDS,
  type RawReport,
} from '../DistrictReportsBuilder'

/**
 * Sprint 3 #1065 (epic #1062) — assemble the de-identified per-district dataset
 * from the parsed in-scope reports, deriving cadence (Jan∩Jul), coach
 * activeCoach, and the Triple-Crown district scalar. Pure; fixture-driven.
 */

const FIXTURE_DIR = fileURLToPath(
  new URL('../../__tests__/fixtures/daily-reports/', import.meta.url)
)
const readFixture = (name: string): string =>
  readFileSync(FIXTURE_DIR + name, 'utf8')

/** Every personal value present in the recorded fixtures (the spike denylist). */
const PERSONAL_DENYLIST = [
  'Ricardo J. Bocanegra, DTM',
  'Louise Audy, PM5',
  'Rodica Jelea, VC1',
  'Linda Brisebois',
  '00987204 - Name unavailable',
]

const ALL_IN_SCOPE: RawReport[] = [
  {
    tableId: REPORT_GUIDS.aprilDues,
    html: readFixture('april-dues-renewal.html'),
  },
  {
    tableId: REPORT_GUIDS.octoberDues,
    html: readFixture('october-dues-renewal.html'),
  },
  {
    tableId: REPORT_GUIDS.officerJan,
    html: readFixture('officer-list-january.html'),
  },
  {
    tableId: REPORT_GUIDS.officerJul,
    html: readFixture('officer-list-july.html'),
  },
  { tableId: REPORT_GUIDS.csp, html: readFixture('club-success-plan.html') },
  {
    tableId: REPORT_GUIDS.education,
    html: readFixture('education-achievements.html'),
  },
  { tableId: REPORT_GUIDS.tripleCrown, html: readFixture('triple-crown.html') },
  { tableId: REPORT_GUIDS.newClubs, html: readFixture('new-clubs.html') },
  {
    tableId: REPORT_GUIDS.prospective,
    html: readFixture('prospective-clubs.html'),
  },
  { tableId: REPORT_GUIDS.coaches, html: readFixture('coaches.html') },
]

const build = (reports = ALL_IN_SCOPE) =>
  buildDistrictReports({
    districtId: '61',
    programYear: '2025-2026',
    generatedAt: '2026-06-01T12:00:00.000Z',
    reports,
  })

describe('buildDistrictReports — shape + schema', () => {
  it('produces a schema-valid dataset with identity fields', () => {
    const ds = build()
    expect(DistrictReportsDatasetSchema.safeParse(ds).success).toBe(true)
    expect(ds.districtId).toBe('61')
    expect(ds.programYear).toBe('2025-2026')
    expect(ds.generatedAt).toBe('2026-06-01T12:00:00.000Z')
  })

  it('tags every section with provenance (source GUID + asOf date)', () => {
    const ds = build()
    expect(ds.sections.coaches!.sources[0]).toEqual({
      reportType: 'coaches',
      tableId: REPORT_GUIDS.coaches,
      asOf: 'June 01, 2026',
    })
    // Officer list is a JOIN of two reports → two sources.
    expect(ds.sections.officerList!.sources.map(s => s.tableId).sort()).toEqual(
      [REPORT_GUIDS.officerJan, REPORT_GUIDS.officerJul].sort()
    )
  })
})

describe('buildDistrictReports — privacy backstop (end-to-end)', () => {
  it('no personal value survives anywhere in the serialized dataset', () => {
    const blob = JSON.stringify(build())
    for (const personal of PERSONAL_DENYLIST) {
      expect(blob).not.toContain(personal)
    }
  })

  it('sponsors-mentors is deferred (#11) — skipped even if fetched', () => {
    const withSponsors: RawReport[] = [
      ...ALL_IN_SCOPE,
      {
        tableId: REPORT_GUIDS.sponsors,
        html: readFixture('sponsors-mentors.html'),
      },
    ]
    const blob = JSON.stringify(build(withSponsors))
    expect(blob).not.toContain('Louise Audy, PM5')
  })
})

describe('buildDistrictReports — officer-list cadence join (Jan∩Jul)', () => {
  it('Jan-present ⇒ semiannual; Jul-only ⇒ annual; submitted from List Status', () => {
    const recs = build().sections.officerList!.records
    // 7 January clubs + 10 July clubs, no overlap in the trimmed fixtures.
    expect(recs).toHaveLength(17)
    const semiannual = recs.filter(r => r.electionCadence === 'semiannual')
    const annual = recs.filter(r => r.electionCadence === 'annual')
    expect(semiannual).toHaveLength(7)
    expect(annual).toHaveLength(10)
    // All 7 January clubs submitted; July has 7 received + 3 "List Not Here".
    expect(recs.filter(r => r.officerListSubmitted)).toHaveLength(14)
    expect(recs.filter(r => !r.officerListSubmitted)).toHaveLength(3)
    // A January (semiannual) club keeps its club name, not a personal value.
    const mcgill = recs.find(r => r.club === '4311')
    expect(mcgill?.electionCadence).toBe('semiannual')
    expect(mcgill?.clubName).toBe('McGill Club')
    expect(mcgill?.officerListSubmitted).toBe(true)
  })

  it('a club appearing in BOTH reports is semiannual (Jan wins), single record', () => {
    // Synthesize an overlap the trimmed fixtures lack: same club in both.
    const janHtml = `<table><tr><th>Club</th><th>Division</th><th>Area</th><th>List Status</th><th>Election</th><th>Name</th></tr><tr><td>555</td><td>A</td><td>1</td><td>Received - 01/05/2026</td><td>Semiannual</td><td>Dual Club</td></tr></table>`
    const julHtml = `<table><tr><th>Club</th><th>Division</th><th>Area</th><th>List Status</th><th>Election</th><th>Name</th></tr><tr><td>555</td><td>A</td><td>1</td><td>List Not Here</td><td>Annual</td><td>Dual Club</td></tr></table>`
    const recs = buildDistrictReports({
      districtId: '61',
      programYear: '2025-2026',
      generatedAt: '2026-06-01T12:00:00.000Z',
      reports: [
        { tableId: REPORT_GUIDS.officerJan, html: janHtml },
        { tableId: REPORT_GUIDS.officerJul, html: julHtml },
      ],
    }).sections.officerList!.records
    expect(recs).toHaveLength(1)
    expect(recs[0]!.electionCadence).toBe('semiannual')
  })
})

describe('buildDistrictReports — coaches activeCoach derivation', () => {
  it('PENDING ⇒ activeCoach true; other statuses false', () => {
    const recs = build().sections.coaches!.records
    expect(recs).toHaveLength(16)
    expect(recs.filter(r => r.activeCoach)).toHaveLength(13) // PENDING
    expect(recs.filter(r => !r.activeCoach)).toHaveLength(3) // AWARDED
    for (const r of recs) {
      expect(r.activeCoach).toBe(r.status === 'PENDING')
    }
  })
})

describe('buildDistrictReports — triple-crown district scalar', () => {
  it('collapses to a single achiever count, no per-member rows', () => {
    const tc = build().sections.tripleCrown!
    expect(tc.summary.achieverCount).toBe(12)
    expect(tc.sources[0]!.reportType).toBe('triple-crown')
    expect(JSON.stringify(tc)).not.toContain('Name unavailable')
  })
})

describe('buildDistrictReports — remaining sections', () => {
  it('education aggregates to per-club/award counts (33 groups, 40 total)', () => {
    const recs = build().sections.educationAchievements!.records
    expect(recs).toHaveLength(33)
    expect(recs.reduce((s, r) => s + r.count, 0)).toBe(40)
  })

  it('dues renewal April + October are separate provenanced sections', () => {
    const ds = build()
    expect(ds.sections.aprilDuesRenewal!.records.length).toBeGreaterThan(0)
    expect(ds.sections.octoberDuesRenewal!.records.length).toBeGreaterThan(0)
    expect(ds.sections.aprilDuesRenewal!.sources[0]!.tableId).toBe(
      REPORT_GUIDS.aprilDues
    )
  })

  it('CSP, new clubs, prospective clubs land with the right counts', () => {
    const ds = build()
    expect(ds.sections.clubSuccessPlan!.records).toHaveLength(8)
    expect(ds.sections.newClubs!.records).toHaveLength(5)
    expect(ds.sections.prospectiveClubs!.records).toHaveLength(8)
  })

  it('omits a section whose report was not fetched', () => {
    const ds = build([
      { tableId: REPORT_GUIDS.coaches, html: readFixture('coaches.html') },
    ])
    expect(ds.sections.coaches).toBeDefined()
    expect(ds.sections.officerList).toBeUndefined()
    expect(ds.sections.tripleCrown).toBeUndefined()
  })
})
