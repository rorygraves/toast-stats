import { readFileSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DistrictReportsDatasetSchema } from '@toastmasters/shared-contracts'

import { DailyReportFetcher } from '../DailyReportFetcher'
import { REPORT_GUIDS } from '../DistrictReportsBuilder'
import { ingestDistrictReports } from '../DistrictReportsIngest'

/**
 * Sprint 3 #1065 — full path proof: fetch (injected) → build → write the
 * separate dataset file, with the end-to-end privacy guard asserted against the
 * ACTUAL written bytes (not just the in-memory object).
 */

const FIXTURE_DIR = fileURLToPath(
  new URL('../../__tests__/fixtures/daily-reports/', import.meta.url)
)
const readFixture = (name: string): string =>
  readFileSync(FIXTURE_DIR + name, 'utf8')

/** Maps each report GUID → its recorded fixture, so the fake fetch can serve it. */
const FIXTURE_BY_GUID: Record<string, string> = {
  [REPORT_GUIDS.aprilDues]: 'april-dues-renewal.html',
  [REPORT_GUIDS.octoberDues]: 'october-dues-renewal.html',
  [REPORT_GUIDS.officerJan]: 'officer-list-january.html',
  [REPORT_GUIDS.officerJul]: 'officer-list-july.html',
  [REPORT_GUIDS.csp]: 'club-success-plan.html',
  [REPORT_GUIDS.education]: 'education-achievements.html',
  [REPORT_GUIDS.tripleCrown]: 'triple-crown.html',
  [REPORT_GUIDS.newClubs]: 'new-clubs.html',
  [REPORT_GUIDS.prospective]: 'prospective-clubs.html',
  [REPORT_GUIDS.coaches]: 'coaches.html',
}

const PERSONAL_DENYLIST = [
  'Ricardo J. Bocanegra, DTM',
  'Louise Audy, PM5',
  'Rodica Jelea, VC1',
  'Linda Brisebois',
  '00987204 - Name unavailable',
]

/** Fake fetch: serve the fixture whose GUID appears in the requested URL. */
const fixtureFetch = async (url: string) => {
  const guid = Object.keys(FIXTURE_BY_GUID).find(g => url.includes(g))
  if (!guid) return { ok: false, status: 404, text: async () => '' }
  return {
    ok: true,
    status: 200,
    text: async () => readFixture(FIXTURE_BY_GUID[guid]!),
  }
}

describe('ingestDistrictReports (fetch → build → write)', () => {
  let cacheDir: string
  beforeEach(async () => {
    cacheDir = await mkdtemp(join(tmpdir(), 'reports-ingest-'))
  })
  afterEach(async () => {
    await rm(cacheDir, { recursive: true, force: true })
  })

  it('writes a schema-valid dataset with all in-scope sections', async () => {
    const fetcher = new DailyReportFetcher({ fetchImpl: fixtureFetch })
    const path = await ingestDistrictReports({
      cacheDir,
      date: '2026-06-01',
      districtId: '61',
      programYear: '2025-2026',
      fetcher,
      generatedAt: '2026-06-01T12:00:00.000Z',
    })
    expect(path).toBe(
      join(cacheDir, 'snapshots', '2026-06-01', 'district_61_reports.json')
    )
    const written = JSON.parse(await readFile(path, 'utf8'))
    expect(DistrictReportsDatasetSchema.safeParse(written).success).toBe(true)
    expect(Object.keys(written.sections).sort()).toEqual(
      [
        'aprilDuesRenewal',
        'clubSuccessPlan',
        'coaches',
        'educationAchievements',
        'newClubs',
        'octoberDuesRenewal',
        'officerList',
        'prospectiveClubs',
        'tripleCrown',
      ].sort()
    )
    expect(written.sections.officerList.records).toHaveLength(17)
    expect(written.sections.tripleCrown.summary.achieverCount).toBe(12)
  })

  it('no personal value appears in the written file (end-to-end privacy guard)', async () => {
    const fetcher = new DailyReportFetcher({ fetchImpl: fixtureFetch })
    const path = await ingestDistrictReports({
      cacheDir,
      date: '2026-06-01',
      districtId: '61',
      programYear: '2025-2026',
      fetcher,
      generatedAt: '2026-06-01T12:00:00.000Z',
    })
    const raw = await readFile(path, 'utf8')
    for (const personal of PERSONAL_DENYLIST) {
      expect(raw).not.toContain(personal)
    }
  })
})
