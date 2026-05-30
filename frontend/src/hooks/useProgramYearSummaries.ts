/**
 * useProgramYearSummaries (#892) — data for the /history per-year summary cards.
 *
 * Assembled entirely from EXISTING CDN endpoints, no new pipeline step:
 *   1. `fetchCdnDates()` — all snapshot dates. Grouped by program year
 *      (Jul 1 – Jun 30), the latest date in each COMPLETED year is its
 *      year-end snapshot.
 *   2. `fetchCdnRankingsForDate(yearEndDate)` — that date's all-districts
 *      standings, reduced to the card view-model by `buildProgramYearSummary`.
 *
 * The current (incomplete) program year is excluded — a card only exists once
 * the year is frozen at June 30.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchCdnDates, fetchCdnRankingsForDate } from '../services/cdn'
import {
  buildProgramYearSummary,
  type ProgramYearSummary,
} from '../utils/programYearSummary'

export const programYearSummariesQueryKey = ['program-year-summaries'] as const

/**
 * How many days after June 30 a legitimate year-end freeze may be dated. The
 * year-end CSV is published ~mid-July (sourceCsvDate ~Jul 18-19), so a few
 * weeks of lag is normal; the cdn.ts current-data fallback is months-to-years
 * newer and falls well outside this window.
 */
const MAX_YEAR_END_LAG_DAYS = 120

export interface UseProgramYearSummariesResult {
  /** Completed program years, newest first. */
  summaries: ProgramYearSummary[]
  isLoading: boolean
  isError: boolean
  error: Error | null
}

/**
 * Program year (Jul 1 – Jun 30) a snapshot date belongs to, as a start year.
 *
 * Parses the ISO string by hand on purpose — do NOT swap this for the
 * `new Date()`-based `getProgramYearForDate`: that reads the month in LOCAL
 * time, so a `YYYY-07-01` boundary date parses to June 30 in any negative-UTC
 * zone and lands in the wrong program year. String parsing is timezone-safe.
 */
function startYearOf(dateStr: string): number {
  const [y, m] = dateStr.split('-')
  const year = parseInt(y!, 10)
  const month = parseInt(m!, 10)
  return month >= 7 ? year : year - 1
}

export function useProgramYearSummaries(): UseProgramYearSummariesResult {
  const query = useQuery({
    queryKey: programYearSummariesQueryKey,
    queryFn: async (): Promise<ProgramYearSummary[]> => {
      const { dates } = await fetchCdnDates()

      // Group snapshot dates by program year, tracking each year's latest date.
      const latestByYear = new Map<number, string>()
      for (const d of dates) {
        const sy = startYearOf(d)
        const cur = latestByYear.get(sy)
        if (!cur || d > cur) latestByYear.set(sy, d)
      }

      // Keep only COMPLETED years (frozen at June 30), newest first.
      const now = new Date()
      const completed = [...latestByYear.entries()]
        .filter(([sy]) => new Date(`${sy + 1}-06-30T23:59:59`) < now)
        .sort(([a], [b]) => b - a)

      const built = await Promise.all(
        completed.map(async ([startYear, yearEndDate]) => {
          const { rankings, date } = await fetchCdnRankingsForDate(yearEndDate)
          // `fetchCdnRankingsForDate` silently falls back to the CURRENT
          // v1/rankings.json when a year-end file 404s. Building a past-year
          // "final standings" card from current data would be actively
          // misleading, so drop any year whose returned data is far newer than
          // its year-end. NOTE: a real year-end freeze is published a few weeks
          // AFTER June 30 (sourceCsvDate ~mid-July), so this is a date-window
          // check, not a same-program-year check — July data is legitimate; the
          // fallback's current data is months-to-years newer.
          const lagDays =
            (Date.parse(date) - Date.parse(yearEndDate)) / 86_400_000
          if (!Number.isFinite(lagDays) || lagDays > MAX_YEAR_END_LAG_DAYS) {
            return null
          }
          return buildProgramYearSummary(startYear, yearEndDate, rankings)
        })
      )

      return built.filter((s): s is ProgramYearSummary => s !== null)
    },
    staleTime: 15 * 60 * 1000, // 15 min — archived years are immutable
    gcTime: 30 * 60 * 1000,
    retry: failureCount => failureCount < 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    summaries: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
