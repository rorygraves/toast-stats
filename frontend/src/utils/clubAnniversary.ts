/* clubAnniversary (#444) — derives years / milestone / proximity for
   a club from its charter date. Foundation utility for the
   Anniversaries epic (#443). Every anniversary-related UI surface
   consumes this function — UI does NOT compute years inline.

   Charter-date inputs accepted from the FAC enrichment pipeline:
   - ISO date  '1987-03-01'
   - ISO datetime  '1987-03-01T00:00:00Z'
   - JS Date object  new Date(...)

   All date math is done in UTC to keep results deterministic across
   timezones. */

export interface ClubAnniversary {
  /** Whole years since charter, measured against referenceDate. */
  years: number
  /** True for 5-year increments per the Toastmasters recognition set:
   *  5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100.
   *  Note: 35, 45, 55, 65, 70, 80, 85, 90, 95 are NOT milestones —
   *  TI doesn't issue recognition pins for those increments. */
  isMilestone: boolean
  /** Days until the next anniversary. Zero on the exact day; never
   *  negative (always in [0, ~365]). */
  daysUntilNext: number
  /** True iff the anniversary is within ±30 days of referenceDate
   *  (either upcoming OR just passed in the prior 30 days). */
  isUpcoming: boolean
  /** Whole-year mark that the next anniversary will celebrate.
   *  Equal to years on the exact anniversary day; otherwise years + 1. */
  upcomingYears: number
}

const MILESTONE_YEARS: ReadonlySet<number> = new Set([
  5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100,
])

const UPCOMING_WINDOW_DAYS = 30
const MIN_YEAR = 1900

const isLeapYear = (y: number): boolean =>
  (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

/** Parse a charter input. Returns a UTC-midnight Date or null. */
function parseCharter(input: string | Date): Date | null {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null
    return new Date(
      Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate())
    )
  }
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null
  // YYYY-MM-DD prefix is enough — drop time-of-day if present.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < MIN_YEAR) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  return new Date(Date.UTC(year, month - 1, day))
}

/** Build the observed anniversary date in a given UTC year. Feb 29
 *  charters fall back to Feb 28 in non-leap years (TI convention). */
function anniversaryInYear(charter: Date, year: number): Date {
  const month = charter.getUTCMonth()
  let day = charter.getUTCDate()
  if (month === 1 && day === 29 && !isLeapYear(year)) day = 28
  return new Date(Date.UTC(year, month, day))
}

/** UTC-day-truncate a date. */
function utcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function getClubAnniversary(
  charterDate: string | Date,
  referenceDate: Date = new Date()
): ClubAnniversary | null {
  const charter = parseCharter(charterDate)
  if (!charter) return null

  const ref = utcDay(referenceDate)
  const refYear = ref.getUTCFullYear()
  // Reject implausible futures — guard against parser accidents.
  if (charter.getUTCFullYear() > refYear + 10) return null

  // Years count up the moment the anniversary date is reached (or
  // passed) in the reference year.
  const thisYearAnniv = anniversaryInYear(charter, refYear)
  const alreadyPassed = ref.getTime() > thisYearAnniv.getTime()
  const isExactDay = ref.getTime() === thisYearAnniv.getTime()
  const baseYears = refYear - charter.getUTCFullYear()
  const years = alreadyPassed || isExactDay ? baseYears : baseYears - 1

  // daysUntilNext: 0 on the exact day, otherwise the gap to the next
  // anniversary (this year if we're before it, next year if after).
  const nextAnniv = alreadyPassed
    ? anniversaryInYear(charter, refYear + 1)
    : thisYearAnniv
  const daysUntilNext = Math.round(
    (nextAnniv.getTime() - ref.getTime()) / MS_PER_DAY
  )

  // Days since the previous anniversary (for the "just passed" half of
  // the upcoming window). Zero on the exact day.
  const prevAnniv =
    alreadyPassed || isExactDay
      ? thisYearAnniv
      : anniversaryInYear(charter, refYear - 1)
  const daysSincePrev = Math.round(
    (ref.getTime() - prevAnniv.getTime()) / MS_PER_DAY
  )

  const isUpcoming =
    daysUntilNext <= UPCOMING_WINDOW_DAYS ||
    daysSincePrev <= UPCOMING_WINDOW_DAYS

  // upcomingYears: years count on the upcoming anniversary day.
  // Equal to years when today IS the anniversary; otherwise years + 1.
  const upcomingYears = isExactDay ? years : years + 1

  return {
    years,
    isMilestone: MILESTONE_YEARS.has(years),
    daysUntilNext,
    isUpcoming,
    upcomingYears,
  }
}
