/**
 * DistrictReportsWriter — persist the de-identified Daily Reports dataset
 * (epic #1062, Sprint 3 #1065) as a NEW separate file:
 *   `CACHE_DIR/snapshots/{date}/district_{id}_reports.json`
 *
 * Deliberately separate from the base `district_{id}.json` snapshot — it keeps
 * the daily-reports cadence + provenance distinct and NEVER mutates the base
 * (the overlay is applied at read time in Sprint 4). The new file is purely
 * additive, so it auto-promotes through the ADR-002 staging→diff→promote gate.
 *
 * The dataset is schema-validated before any bytes are written (a malformed
 * dataset must not reach GCS), and the district id is validated against path
 * traversal before it is interpolated into the file path (active tripwire:
 * never `path.join` raw input).
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import {
  DistrictReportsDatasetSchema,
  type DistrictReportsDataset,
} from '@toastmasters/shared-contracts'

/** Same posture as TimeSeriesIndexWriter: alphanumeric district ids only. */
const VALID_DISTRICT_ID_PATTERN = /^[A-Za-z0-9]+$/

function validateDistrictId(districtId: string): void {
  if (typeof districtId !== 'string' || districtId.length === 0) {
    throw new Error('Invalid district ID: empty or non-string value')
  }
  if (!VALID_DISTRICT_ID_PATTERN.test(districtId)) {
    throw new Error(
      'Invalid district ID format: only alphanumeric characters allowed'
    )
  }
}

/** The reports dataset filename for a district (distinct from the base snapshot). */
export function districtReportsFileName(districtId: string): string {
  return `district_${districtId}_reports.json`
}

/**
 * Write a district's reports dataset to `snapshots/{date}/district_{id}_reports.json`.
 *
 * @returns the absolute path written.
 * @throws if the district id is unsafe or the dataset fails schema validation.
 */
export async function writeDistrictReports(
  cacheDir: string,
  date: string,
  dataset: DistrictReportsDataset
): Promise<string> {
  validateDistrictId(dataset.districtId)

  const parsed = DistrictReportsDatasetSchema.safeParse(dataset)
  if (!parsed.success) {
    throw new Error(
      `writeDistrictReports: dataset failed schema validation: ${parsed.error.message}`
    )
  }

  const dir = path.join(cacheDir, 'snapshots', date)
  const filePath = path.join(dir, districtReportsFileName(dataset.districtId))
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(parsed.data, null, 2), 'utf-8')
  return filePath
}
