/* useOmniSearch (epic #1055 Sprint 3, #1058) — the shared behavior behind both
   omni-search presentations: the Cmd-K modal palette and the desktop header
   combobox. Extracting it keeps the keyboard-nav + ARIA + lazy-load logic in
   ONE place rather than diverging across two surfaces (Lesson 092 / R6).

   Lazy load: the ~1MB club index fetch is gated by `enabled`. The modal only
   mounts when open, so it passes `enabled: true`; the always-mounted header
   combobox flips `enabled` on first focus so cold app-load stays untouched. */

import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  loadSearchIndex,
  searchEntities,
  type SearchEntity,
  type SearchIndex,
  type SearchResultGroup,
} from '../services/searchIndex'

export interface UseOmniSearchOptions {
  /** Navigate to (and otherwise act on) the chosen entity. */
  onSelect: (entity: SearchEntity) => void
  /** Esc handler — modal closes, combobox collapses. Optional. */
  onDismiss?: () => void
  /** Gate the (lazy) index fetch. Defaults to true. */
  enabled?: boolean
}

export interface UseOmniSearch {
  query: string
  setQuery: (q: string) => void
  index: SearchIndex | undefined
  groups: SearchResultGroup[]
  flat: SearchEntity[]
  /** Already clamped into [0, flat.length-1]. */
  activeIndex: number
  setActiveIndex: (i: number) => void
  activeEntity: SearchEntity | undefined
  hasQuery: boolean
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const INDEX_STALE_MS = 15 * 60 * 1000

export function useOmniSearch(options: UseOmniSearchOptions): UseOmniSearch {
  const { onSelect, onDismiss, enabled = true } = options
  const [query, setQueryRaw] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const { data: index } = useQuery({
    queryKey: ['omni-search-index'],
    queryFn: loadSearchIndex,
    staleTime: INDEX_STALE_MS,
    enabled,
  })

  const groups = useMemo(
    () => (index ? searchEntities(query, index) : []),
    [index, query]
  )

  // Flatten grouped results into one ordered list for keyboard nav /
  // aria-activedescendant — groups are display-only.
  const flat = useMemo<SearchEntity[]>(
    () => groups.flatMap(g => g.entities),
    [groups]
  )

  // Clamp at read time rather than in an effect — it is a derived value.
  const clampedActiveIndex = Math.min(activeIndex, Math.max(0, flat.length - 1))
  const activeEntity = flat[clampedActiveIndex]

  // Reset the active row whenever the query changes so the first result is
  // pre-highlighted; callers only ever set the query through this wrapper.
  const setQuery = useCallback((q: string) => {
    setQueryRaw(q)
    setActiveIndex(0)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, Math.max(0, flat.length - 1)))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (activeEntity) onSelect(activeEntity)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onDismiss?.()
      }
    },
    [flat.length, activeEntity, onSelect, onDismiss]
  )

  return {
    query,
    setQuery,
    index,
    groups,
    flat,
    activeIndex: clampedActiveIndex,
    setActiveIndex,
    activeEntity,
    hasQuery: query.trim().length > 0,
    handleKeyDown,
  }
}
