/**
 * useUrlState — URL-synced state hook (#272)
 *
 * A drop-in replacement for useState that persists state in URL search params.
 * Uses { replace: true } to avoid polluting browser history per Lesson sprint-11.
 *
 * Features:
 * - Clean URL: removes param when value equals default
 * - Other params preserved when updating a single key
 * - Supports custom parse/serialize for non-string types (numbers, etc.)
 * - Supports functional updates like useState
 *
 * @example
 * ```tsx
 * // String state
 * const [tab, setTab] = useUrlState('tab', 'overview')
 *
 * // Number state
 * const [page, setPage] = useUrlState('page', 1, {
 *   parse: Number,
 *   serialize: String,
 * })
 * ```
 */

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

interface UseUrlStateOptions<T> {
  /** Parse URL string to target type. Return undefined to fall back to default. */
  parse: (value: string) => T | undefined
  /** Serialize target type to URL string */
  serialize: (value: T) => string
}

type SetStateAction<T> = T | ((prev: T) => T)

/**
 * Hook that syncs a single piece of state with a URL search parameter.
 *
 * @param key - URL search parameter name
 * @param defaultValue - Default value when param is not in URL
 * @param options - Optional parse/serialize functions for non-string types
 * @returns [value, setValue] tuple like useState
 */
export function useUrlState<T = string>(
  key: string,
  defaultValue: T,
  options?: UseUrlStateOptions<T>
): [T, (action: SetStateAction<T>) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse current value from URL. Memoized on the raw string so a custom
  // `parse` (which returns a fresh object/array — e.g. a comma-split list)
  // yields a STABLE reference across renders when the param is unchanged.
  // Without this, every render hands consumers a new array, busting their
  // downstream `useMemo`s (e.g. a 117-row re-sort on an unrelated keystroke).
  const rawValue = searchParams.get(key)
  const currentValue = useMemo<T>(() => {
    if (rawValue === null) return defaultValue
    if (options?.parse) {
      const parsed = options.parse(rawValue)
      return parsed !== undefined ? parsed : defaultValue
    }
    // Default: treat as string (works when T = string)
    return rawValue as unknown as T
  }, [rawValue, defaultValue, options])

  const setValue = useCallback(
    (action: SetStateAction<T>) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)

          // Resolve functional update
          const prevRaw = prev.get(key)
          let prevValue: T
          if (prevRaw === null) {
            prevValue = defaultValue
          } else if (options?.parse) {
            const parsed = options.parse(prevRaw)
            prevValue = parsed !== undefined ? parsed : defaultValue
          } else {
            prevValue = prevRaw as unknown as T
          }

          const newValue =
            typeof action === 'function'
              ? (action as (prev: T) => T)(prevValue)
              : action

          // Serialize
          const serialized = options?.serialize
            ? options.serialize(newValue)
            : String(newValue)

          // Remove from URL if it equals the default (keeps URLs clean)
          const defaultSerialized = options?.serialize
            ? options.serialize(defaultValue)
            : String(defaultValue)

          if (serialized === defaultSerialized) {
            next.delete(key)
          } else {
            next.set(key, serialized)
          }

          return next
        },
        { replace: true }
      )
    },
    [key, defaultValue, options, setSearchParams]
  )

  return [currentValue, setValue]
}
