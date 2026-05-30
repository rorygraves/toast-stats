/**
 * useUrlStringSet — set-of-strings URL-synced state (#980)
 *
 * A drop-in for `useState<string[]>([])` that persists a SET of string keys in a
 * comma-joined URL param: sorted for a stable/shareable URL, deduped, empties
 * dropped, and the param removed entirely when the set is empty (clean default).
 * Built on {@link useUrlState}, so unrelated params survive (Lesson 070 /
 * urlConcurrentWrites tripwire).
 *
 * @example
 * ```tsx
 * const [regions, setRegions] = useUrlStringSet('historyRegions')
 * // toggle membership
 * setRegions(prev => (prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]))
 * ```
 */

import { useMemo } from 'react'
import { useUrlState } from './useUrlState'

/** Dedupe, preserving first-seen order, dropping empty entries. */
function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(v => v.length > 0))]
}

type SetStringSetAction = string[] | ((prev: string[]) => string[])

export function useUrlStringSet(
  key: string
): [string[], (action: SetStringSetAction) => void] {
  const [value, setValue] = useUrlState<string[]>(key, [], {
    parse: raw => dedupe(raw.split(',')),
    // Sort on write so the URL is order-stable regardless of click order.
    serialize: values => dedupe(values).sort().join(','),
  })

  // useUrlState returns a fresh array each render; memoize on the joined value
  // so consumers can safely use the result in effect/memo dependency arrays.
  const joined = value.join(',')
  const stable = useMemo(() => (joined ? joined.split(',') : []), [joined])

  return [stable, setValue]
}
