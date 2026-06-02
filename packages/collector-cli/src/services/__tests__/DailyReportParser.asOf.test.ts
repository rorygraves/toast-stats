import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { extractReportAsOf } from '../DailyReportParser'

/**
 * Sprint 3 #1065 — every report response carries a freshness line
 * `Reports are uploaded daily - Updated: <Month DD, YYYY> ... MT`. The builder
 * needs that date as per-section provenance (`asOf`). Pure extraction here.
 */

const FIXTURE_DIR = fileURLToPath(
  new URL('../../__tests__/fixtures/daily-reports/', import.meta.url)
)
const readFixture = (name: string): string =>
  readFileSync(FIXTURE_DIR + name, 'utf8')

describe('extractReportAsOf', () => {
  it('pulls the "Updated: <date>" date from a real report', () => {
    expect(extractReportAsOf(readFixture('officer-list-july.html'))).toBe(
      'June 01, 2026'
    )
  })

  it('returns "" when no Updated line is present (e.g. empty archive)', () => {
    expect(extractReportAsOf('<html><body></body></html>')).toBe('')
  })
})
