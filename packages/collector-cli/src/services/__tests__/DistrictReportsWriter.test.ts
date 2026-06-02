import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  DistrictReportsDatasetSchema,
  type DistrictReportsDataset,
} from '@toastmasters/shared-contracts'

import { writeDistrictReports } from '../DistrictReportsWriter'

/**
 * Sprint 3 #1065 — persist the de-identified dataset as a NEW separate file
 * `snapshots/{date}/district_{id}_reports.json` (never mutating the base
 * snapshot). Schema-validated before write; district id validated against path
 * traversal (active tripwire).
 */

const dataset = (districtId = '61'): DistrictReportsDataset => ({
  districtId,
  programYear: '2025-2026',
  generatedAt: '2026-06-01T12:00:00.000Z',
  sections: {
    coaches: {
      sources: [
        {
          reportType: 'coaches',
          tableId: '41955922-25ab-4a5a-8025-ebb7634f68bf',
          asOf: 'June 01, 2026',
        },
      ],
      records: [
        {
          club: '1296822',
          clubName: 'A Club',
          code: 'D',
          beginDate: '01/01/2026',
          status: 'PENDING',
          activeCoach: true,
        },
      ],
    },
  },
})

describe('writeDistrictReports', () => {
  let cacheDir: string
  beforeEach(async () => {
    cacheDir = await mkdtemp(join(tmpdir(), 'reports-writer-'))
  })
  afterEach(async () => {
    await rm(cacheDir, { recursive: true, force: true })
  })

  it('writes a schema-valid file at snapshots/{date}/district_{id}_reports.json', async () => {
    const path = await writeDistrictReports(cacheDir, '2026-06-01', dataset())
    expect(path).toBe(
      join(cacheDir, 'snapshots', '2026-06-01', 'district_61_reports.json')
    )
    const written = JSON.parse(await readFile(path, 'utf8'))
    expect(DistrictReportsDatasetSchema.safeParse(written).success).toBe(true)
    expect(written.districtId).toBe('61')
  })

  it('creates the snapshot directory if it does not exist', async () => {
    const path = await writeDistrictReports(
      cacheDir,
      '2026-06-02',
      dataset('93')
    )
    expect(await readFile(path, 'utf8')).toContain('"districtId": "93"')
  })

  it('refuses a path-traversal district id (validateDistrictId tripwire)', async () => {
    await expect(
      writeDistrictReports(cacheDir, '2026-06-01', dataset('../../etc'))
    ).rejects.toThrow(/district/i)
  })

  it('refuses to write a dataset that fails schema validation', async () => {
    const bad = dataset()
    // @ts-expect-error — deliberately corrupt the contract
    bad.sections.coaches.records[0].activeCoach = 'nope'
    await expect(
      writeDistrictReports(cacheDir, '2026-06-01', bad)
    ).rejects.toThrow(/schema|valid/i)
  })
})
