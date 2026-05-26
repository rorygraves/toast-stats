/**
 * Shared program-year date helpers (#306).
 *
 * Toastmasters program years run July 1 → June 30. These flexible-format date
 * parsers were duplicated verbatim between `BordaCountRankingCalculator`
 * (analytics-core) and `TransformService` (collector-cli). This module is the
 * single home; both import from here.
 *
 * @module @toastmasters/analytics-core/rankings
 */

/**
 * Parse a date string in ISO (YYYY-MM-DD), US 4-digit (M/D/YYYY), or US
 * 2-digit (M/D/YY) format and return a UTC-normalized Date. Two-digit years
 * are interpreted as 20YY — Toastmasters' district-performance CSVs use this
 * for charter/suspend dates. Returns null on failure.
 */
export function parseDateFlexible(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  // ISO format: YYYY-MM-DD (optionally with time)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const y = Number(isoMatch[1])
    const m = Number(isoMatch[2])
    const d = Number(isoMatch[3])
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return new Date(Date.UTC(y, m - 1, d))
    }
  }

  // US format: M/D/YY or M/D/YYYY (2-digit year → 20YY)
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)
  if (usMatch) {
    const m = Number(usMatch[1])
    const d = Number(usMatch[2])
    const yRaw = Number(usMatch[3])
    const y = usMatch[3]!.length === 2 ? 2000 + yRaw : yRaw
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return new Date(Date.UTC(y, m - 1, d))
    }
  }

  return null
}

/**
 * Return the start-of-program-year date (July 1) preceding the given snapshot
 * date, or null if the snapshot date is unparseable (#336).
 */
export function getProgramYearStartDate(snapshotDate: string): Date | null {
  const parsed = parseDateFlexible(snapshotDate)
  if (!parsed) return null
  const year = parsed.getUTCFullYear()
  const month = parsed.getUTCMonth() + 1 // 1-indexed
  const pyStartYear = month >= 7 ? year : year - 1
  return new Date(Date.UTC(pyStartYear, 6, 1)) // July 1 UTC
}

/**
 * Extract a charter date from a `Charter Date/Suspend Date` field value (#336).
 *
 * Toastmasters district-performance.csv encodes club status changes as a
 * single string with a prefix and date: `Charter MM/DD/YY` for newly chartered
 * clubs, `Susp MM/DD/YY` for suspensions. Returns null if the field is empty,
 * prefixed `Susp`, or unparseable.
 */
export function parseCharterDateFromStatusField(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '') return null
  const match = trimmed.match(/^Charter\s+(.+)$/i)
  if (!match) return null
  return parseDateFlexible(match[1]!)
}
