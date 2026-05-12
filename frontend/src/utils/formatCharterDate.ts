/* Format a charter date for the club hero eyebrow (#432).

   Input shapes the Find-A-Club Search endpoint or downstream pipeline
   may emit, ranked from preferred to fallback:

   - ISO 8601 datetime / date — e.g. '1987-02-15T00:00:00Z', '1987-02-15'
   - YYYY-MM — month precision
   - YYYY — year precision

   Output: 'February 1987' (long month, year). The CSS uppercases the
   whole eyebrow, so callers don't need to upper-case here.

   Returns null when the input is missing, empty, or unparseable —
   callers should skip the '· CHARTERED <date>' segment entirely in
   that case rather than emit a placeholder. */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export function formatCharterDate(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  // YYYY-only.
  const yearOnly = /^(\d{4})$/.exec(trimmed)
  if (yearOnly) {
    const year = Number(yearOnly[1])
    if (year > 1900 && year < 2200) return String(year)
    return null
  }

  // YYYY-MM (no day).
  const yearMonth = /^(\d{4})-(\d{2})$/.exec(trimmed)
  if (yearMonth) {
    const year = Number(yearMonth[1])
    const month = Number(yearMonth[2])
    if (year > 1900 && year < 2200 && month >= 1 && month <= 12) {
      return `${MONTHS[month - 1]} ${year}`
    }
    return null
  }

  // Full ISO or other date string parseable by Date.
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  // Sanity bounds: Toastmasters was founded in 1924; future dates would
  // indicate a parsing accident.
  const year = parsed.getUTCFullYear()
  if (year < 1900 || year > 2200) return null
  return `${MONTHS[parsed.getUTCMonth()]} ${year}`
}
