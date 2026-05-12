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

/* Year-band: TI was founded in 1924; anything outside [1900, 2200] is
   a parsing accident. Bounds are inclusive (#486 L5). */
const MIN_YEAR = 1900
const MAX_YEAR = 2200
const inYearBand = (y: number): boolean => y >= MIN_YEAR && y <= MAX_YEAR

/* Match the YYYY-MM(-DD) prefix of an ISO date or datetime. This lets
   us pull year + month directly from the string instead of going
   through Date, which sidesteps the local-vs-UTC drift on datetime
   strings without a Z marker (#486 L4). */
const ISO_PREFIX = /^(\d{4})-(\d{2})(?:-\d{2})?(?:[T\s].*)?$/

export function formatCharterDate(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  // YYYY-only.
  const yearOnly = /^(\d{4})$/.exec(trimmed)
  if (yearOnly) {
    const year = Number(yearOnly[1])
    return inYearBand(year) ? String(year) : null
  }

  // YYYY-MM or YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS[Z|+HH:MM] — pull year
  // and month straight from the string. No Date parsing means no
  // timezone drift.
  const isoPrefix = ISO_PREFIX.exec(trimmed)
  if (isoPrefix) {
    const year = Number(isoPrefix[1])
    const month = Number(isoPrefix[2])
    if (inYearBand(year) && month >= 1 && month <= 12) {
      return `${MONTHS[month - 1]} ${year}`
    }
    return null
  }

  // Anything else (RFC 2822 dates, slash formats, etc.) — fall back to
  // Date parsing. Use local accessors; if a non-Z datetime string is
  // intended as UTC, the caller should pass an ISO string.
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  const year = parsed.getFullYear()
  if (!inYearBand(year)) return null
  return `${MONTHS[parsed.getMonth()]} ${year}`
}
