import { useCallback, useEffect, useState } from 'react'
import { COLUMN_GROUP_IDS, type ColumnGroup } from '../components/filters/types'

/**
 * localStorage key for the club table's hidden column groups (#819).
 * Namespaced so it can't collide with other persisted preferences.
 */
export const COLUMN_GROUP_VISIBILITY_STORAGE_KEY =
  'toast-stats:clubs-table:hidden-groups'

const VALID_GROUPS = new Set<ColumnGroup>(COLUMN_GROUP_IDS)

/** Read + sanitise the persisted hidden-group set. Unknown/malformed ids and a
 *  corrupt (non-JSON) value both degrade to "nothing hidden" — a bad store
 *  must never wedge the table into an unusable column set. */
const readStored = (): Set<ColumnGroup> => {
  try {
    const raw = localStorage.getItem(COLUMN_GROUP_VISIBILITY_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(
      parsed.filter((g): g is ColumnGroup => VALID_GROUPS.has(g as ColumnGroup))
    )
  } catch {
    return new Set()
  }
}

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
 * table is unchanged until the user opts in). Writes mirror to localStorage so
 * the selection survives reloads; reads sanitise against the canonical group
 * ids so a stale/corrupt store can't hide phantom groups or crash the table.
 */
export const useColumnGroupVisibility = (): ColumnGroupVisibility => {
  const [hiddenGroups, setHiddenGroups] = useState<Set<ColumnGroup>>(readStored)

  useEffect(() => {
    try {
      localStorage.setItem(
        COLUMN_GROUP_VISIBILITY_STORAGE_KEY,
        JSON.stringify([...hiddenGroups])
      )
    } catch {
      // Private-mode / quota failures are non-fatal: the in-memory set still
      // drives the table for this session; we just can't persist it.
    }
  }, [hiddenGroups])

  const isGroupHidden = useCallback(
    (group: ColumnGroup) => hiddenGroups.has(group),
    [hiddenGroups]
  )

  const toggleGroup = useCallback((group: ColumnGroup) => {
    setHiddenGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }, [])

  return { hiddenGroups, isGroupHidden, toggleGroup }
}
