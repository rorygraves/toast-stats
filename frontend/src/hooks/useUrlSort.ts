import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export type SortDirection = 'asc' | 'desc'

export interface UrlSortState<F extends string> {
  field: F
  direction: SortDirection
}

export interface UseUrlSortOptions<F extends string> {
  /** Allowed field names. Unknown URL values fall back to defaultField. */
  fields: readonly F[]
  /** Field used when URL has no sort param (or value is unknown). */
  defaultField: F
  /** Direction used when URL has no dir param. Default 'asc'. */
  defaultDirection?: SortDirection
  /**
   * Direction used when the user clicks a NEW field (not the currently
   * active one). Defaults to 'asc' — Excel / GitHub-style: clicking a new
   * column shows ascending first; click again to flip. Distinct from
   * `defaultDirection` so the table can boot in desc (e.g. "Score") while
   * a new column click still starts at asc.
   */
  newFieldDirection?: SortDirection
  /** URL param name for the field. Default 'sort'. */
  fieldParam?: string
  /** URL param name for the direction. Default 'dir'. */
  dirParam?: string
}

const isDirection = (v: string | null): v is SortDirection =>
  v === 'asc' || v === 'desc'

/**
 * URL-synced sort state for click-header sortable tables.
 *
 * The URL is the source of truth (#851). Clicking the same field flips
 * direction; clicking a new field selects it at `defaultDirection`. When
 * the sort returns to the default (`defaultField` + `defaultDirection`),
 * both params are removed so the URL stays clean and shareable.
 *
 * The toggle bails out when it would be a no-op (lesson 070): a same-batch
 * second `setSearchParams(prev=>...)` would otherwise read a stale `prev`
 * and clobber unrelated writes (filters, pagination).
 */
export function useUrlSort<F extends string>(
  opts: UseUrlSortOptions<F>
): {
  sort: UrlSortState<F>
  toggleSort: (field: F) => void
} {
  const {
    fields,
    defaultField,
    defaultDirection = 'asc',
    newFieldDirection = 'asc',
    fieldParam = 'sort',
    dirParam = 'dir',
  } = opts

  const [searchParams, setSearchParams] = useSearchParams()

  const sort = useMemo<UrlSortState<F>>(() => {
    const rawField = searchParams.get(fieldParam)
    const rawDir = searchParams.get(dirParam)
    const fieldKnown =
      rawField !== null && (fields as readonly string[]).includes(rawField)
    if (!fieldKnown) {
      // Unknown / missing field — the dir param has no anchor, so reset both.
      return { field: defaultField, direction: defaultDirection }
    }
    const direction = isDirection(rawDir) ? rawDir : defaultDirection
    return { field: rawField as F, direction }
  }, [searchParams, fieldParam, dirParam, fields, defaultField, defaultDirection])

  const toggleSort = useCallback(
    (field: F) => {
      // Compute the next sort against the *currently rendered* searchParams,
      // not a stale `prev` snapshot (lesson 070).
      const currentField = searchParams.get(fieldParam)
      const currentDir = searchParams.get(dirParam)
      const resolvedField =
        currentField && (fields as readonly string[]).includes(currentField)
          ? (currentField as F)
          : defaultField
      const resolvedDir = isDirection(currentDir) ? currentDir : defaultDirection

      const nextField = field
      const nextDirection: SortDirection =
        resolvedField === field
          ? resolvedDir === 'asc'
            ? 'desc'
            : 'asc'
          : newFieldDirection

      const isDefault =
        nextField === defaultField && nextDirection === defaultDirection

      // Bail on no-op writes (lesson 070): returning to default with no URL
      // params is a write of nothing.
      const hasFieldParam = searchParams.has(fieldParam)
      const hasDirParam = searchParams.has(dirParam)
      if (isDefault && !hasFieldParam && !hasDirParam) return
      if (
        !isDefault &&
        currentField === nextField &&
        currentDir === nextDirection
      ) {
        return
      }

      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (isDefault) {
            next.delete(fieldParam)
            next.delete(dirParam)
          } else {
            next.set(fieldParam, nextField)
            next.set(dirParam, nextDirection)
          }
          return next
        },
        { replace: true }
      )
    },
    [
      searchParams,
      setSearchParams,
      fieldParam,
      dirParam,
      fields,
      defaultField,
      defaultDirection,
      newFieldDirection,
    ]
  )

  return { sort, toggleSort }
}
