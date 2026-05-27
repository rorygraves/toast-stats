import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { previousRecordedDate } from './useSnapshotDiff'

/**
 * useUrlDatePair — URL-synced arbitrary date pair for the "What Changed" digest
 * (#794, epic #797 Sprint 2).
 *
 * Reads `?from=YYYY-MM-DD&to=YYYY-MM-DD` from the URL. A param is honoured only
 * when its value is one of the district's recorded snapshot `dates` (so a stale
 * or hand-edited URL can't select a date the district never had). When a param
 * is absent or invalid, that side falls back to the Phase-1 default — `from` =
 * previous recorded date (`[-2]`), `to` = latest (`[-1]`) — so an empty URL
 * reproduces the default digest exactly.
 *
 * The page owns this pair and passes `from`/`to` down as props (R3); the diff
 * hook never re-derives them from response data.
 *
 * Setters mirror `useUrlProgramYear`: a selection equal to the default deletes
 * its param (keeps shared URLs clean), any other value writes it, and a no-op
 * write bails early so it can't clobber a same-batch URL update (Lesson 070).
 *
 * @param dates Ascending list of the district's recorded snapshot dates.
 * @see docs/design/what-changed-feature.md §5, §4
 */
export function useUrlDatePair(dates: string[]): {
  from: string | undefined
  to: string | undefined
  setFrom: (date: string) => void
  setTo: (date: string) => void
} {
  const [searchParams, setSearchParams] = useSearchParams()

  const defaultPair = useMemo(() => previousRecordedDate(dates), [dates])

  const urlFrom = searchParams.get('from')
  const urlTo = searchParams.get('to')

  // A URL value wins only if it's a date this district actually recorded;
  // otherwise fall back to the Phase-1 default for that side.
  const from = urlFrom && dates.includes(urlFrom) ? urlFrom : defaultPair?.from
  const to = urlTo && dates.includes(urlTo) ? urlTo : defaultPair?.to

  const setParam = useCallback(
    (key: 'from' | 'to', date: string, current: string | undefined) => {
      if (date === current) return // no-op — don't churn history (Lesson 070)
      const isDefault = defaultPair
        ? date === (key === 'from' ? defaultPair.from : defaultPair.to)
        : false
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (isDefault) next.delete(key)
          else next.set(key, date)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams, defaultPair]
  )

  const setFrom = useCallback(
    (date: string) => setParam('from', date, from),
    [setParam, from]
  )
  const setTo = useCallback(
    (date: string) => setParam('to', date, to),
    [setParam, to]
  )

  return { from, to, setFrom, setTo }
}
