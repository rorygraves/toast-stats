/**
 * useUrlBoolean — boolean URL-synced state (#980)
 *
 * A drop-in for `useState<boolean>(false)` that persists in a URL search param:
 * the param is `1` when the value is the non-default, and absent when it equals
 * the default (keeping URLs clean). Built on {@link useUrlState}, so it inherits
 * the prev-callback write form that preserves unrelated params (Lesson 070 /
 * urlConcurrentWrites tripwire).
 *
 * @example
 * ```tsx
 * // collapsed by default; `?expandChanges=1` when open
 * const [open, setOpen] = useUrlBoolean('expandChanges')
 *
 * // expanded by default; `?clubsExpanded=0` when collapsed
 * const [open, setOpen] = useUrlBoolean('clubsExpanded', { defaultValue: true })
 * ```
 */

import { useUrlState } from './useUrlState'

interface UseUrlBooleanOptions {
  /** Value when the param is absent. Default `false`. */
  defaultValue?: boolean
}

type SetBooleanAction = boolean | ((prev: boolean) => boolean)

// Module-scoped so the reference is stable across renders — useUrlState keys its
// value memo and setter useCallback on `options`, so a fresh object each render
// would needlessly churn both. Anything that isn't an explicit '0' reads true.
const BOOLEAN_OPTIONS = {
  parse: (value: string) => value !== '0',
  serialize: (value: boolean) => (value ? '1' : '0'),
}

export function useUrlBoolean(
  key: string,
  options?: UseUrlBooleanOptions
): [boolean, (action: SetBooleanAction) => void] {
  return useUrlState<boolean>(
    key,
    options?.defaultValue ?? false,
    BOOLEAN_OPTIONS
  )
}
