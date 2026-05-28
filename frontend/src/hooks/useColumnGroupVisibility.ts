import { useCallback, useMemo } from 'react'
import { usePersistedState } from './usePersistedState'
import { storageKey } from '../utils/localStorageStore'
import { COLUMN_GROUP_IDS, type ColumnGroup } from '../components/filters/types'

/**
 * Persisted-store NAME for the club table's hidden column groups (#819).
 * Passed to the versioned localStorage primitive (#420), which prefixes it
 * with `toast-stats:v<N>:` so it migrates with every other persisted key.
 */
export const COLUMN_GROUP_VISIBILITY_STORAGE_NAME = 'clubs-table:hidden-groups'

/** The fully-qualified localStorage key (versioned). Exposed for tests. */
export const COLUMN_GROUP_VISIBILITY_STORAGE_KEY = storageKey(
  COLUMN_GROUP_VISIBILITY_STORAGE_NAME
)

const VALID_GROUPS = new Set<ColumnGroup>(COLUMN_GROUP_IDS)

/** Keep only known group ids; a stale/corrupt store must never hide phantom
 *  groups or wedge the table into an unusable column set. */
const sanitize = (raw: unknown): ColumnGroup[] =>
  Array.isArray(raw)
    ? raw.filter((g): g is ColumnGroup => VALID_GROUPS.has(g as ColumnGroup))
    : []

export interface ColumnGroupVisibility {
  /** Groups the user has hidden. Empty = all visible (the default). */
  hiddenGroups: Set<ColumnGroup>
  isGroupHidden: (group: ColumnGroup) => boolean
  /** Flip a group between hidden and visible, persisting the result. */
  toggleGroup: (group: ColumnGroup) => void
}

/**
 * Persisted show/hide state for the club table's column groups (#819).
 *
 * The hidden set is the source of truth (default empty = all visible, so the
 * table is unchanged until the user opts in). Built on `usePersistedState`
 * (#416) over the versioned store (#420) rather than URL sync, because group
 * visibility is a durable per-user VIEW preference (like dark mode), not
 * shareable filter data — keeping it out of the URL avoids the filter↔URL
 * reconcile race surface (lessons 070/130). Reads sanitise against the
 * canonical group ids so a stale store can't hide phantom groups.
 */
export const useColumnGroupVisibility = (): ColumnGroupVisibility => {
  const [stored, setStored] = usePersistedState<ColumnGroup[]>(
    COLUMN_GROUP_VISIBILITY_STORAGE_NAME,
    []
  )
  const hiddenGroups = useMemo(() => new Set(sanitize(stored)), [stored])

  const isGroupHidden = useCallback(
    (group: ColumnGroup) => hiddenGroups.has(group),
    [hiddenGroups]
  )

  const toggleGroup = useCallback(
    (group: ColumnGroup) => {
      setStored(prev => {
        const next = new Set(sanitize(prev))
        if (next.has(group)) next.delete(group)
        else next.add(group)
        return [...next]
      })
    },
    [setStored]
  )

  return { hiddenGroups, isGroupHidden, toggleGroup }
}
