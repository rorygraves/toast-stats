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

export function useUrlBoolean(
  key: string,
  options?: UseUrlBooleanOptions
): [boolean, (action: SetBooleanAction) => void] {
  const defaultValue = options?.defaultValue ?? false
  return useUrlState<boolean>(key, defaultValue, {
    // Anything that isn't an explicit '0' reads as true; '0' reads as false.
    // `undefined` would fall back to the default, but '1'/'0' cover both writes.
    parse: value => value !== '0',
    serialize: value => (value ? '1' : '0'),
  })
}
