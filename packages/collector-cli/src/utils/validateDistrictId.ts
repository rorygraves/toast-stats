/**
 * Shared district-id guard. A district id is interpolated into GCS/file paths
 * (`district_{id}.json`, `district_{id}_reports.json`), so it must be validated
 * against path traversal before any path is constructed from it (active
 * tripwire: never `path.join` raw input).
 *
 * Alphanumeric only — matches the existing `TimeSeriesIndexWriter` posture and
 * the valid TI district ids ('01', '61', '130', 'F', 'U').
 */

export const VALID_DISTRICT_ID_PATTERN = /^[A-Za-z0-9]+$/

export function validateDistrictId(districtId: string): void {
  if (typeof districtId !== 'string' || districtId.length === 0) {
    throw new Error('Invalid district ID: empty or non-string value')
  }
  if (!VALID_DISTRICT_ID_PATTERN.test(districtId)) {
    throw new Error(
      'Invalid district ID format: only alphanumeric characters allowed'
    )
  }
}
