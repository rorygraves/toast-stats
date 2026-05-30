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

import { useUrlState } from './useUrlState'

/** Dedupe, preserving first-seen order, dropping empty entries. */
function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(v => v.length > 0))]
}

type SetStringSetAction = string[] | ((prev: string[]) => string[])

// Module-scoped (stable references) so useUrlState's value memo + setter
// useCallback don't churn each render. With stable options + default, the
// parsed array useUrlState returns is itself stable when the param is unchanged
// — so consumers can use it directly in effect/memo deps (no extra memo here).
const EMPTY: string[] = []
const STRING_SET_OPTIONS = {
  parse: (raw: string) => dedupe(raw.split(',')),
  // Sort on write so the URL is order-stable regardless of click order.
  serialize: (values: string[]) => dedupe(values).sort().join(','),
}

export function useUrlStringSet(
  key: string
): [string[], (action: SetStringSetAction) => void] {
  return useUrlState<string[]>(key, EMPTY, STRING_SET_OPTIONS)
}
