/* CommandPalette (#422 → omni-search epic #1055 Sprint 2, #1057) — universal
   search opened with Cmd-K / Ctrl-K from anywhere in the app. It searches the
   three globally-indexable entity types — districts, regions, clubs — via the
   unified Sprint-1 index (`searchIndex.ts`), grouping results by type.

   Architecture: outer <CommandPalette> just gates visibility. The inner
   <OpenPalette> holds all local state AND triggers the index load, so the
   ~1MB club index is fetched only on first open (never at app boot), and
   closing + reopening naturally resets via React's unmount/remount — avoiding
   setState-in-effect patterns. */

import React, { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  loadSearchIndex,
  searchEntities,
  type SearchEntity,
  type SearchEntityType,
} from '../../services/searchIndex'
import { DistrictChipAndName } from '../DistrictChipAndName'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  return <OpenPalette onClose={onClose} />
}

interface OpenPaletteProps {
  onClose: () => void
}

// Human-readable group headings, in the index's canonical group order.
const GROUP_LABEL: Record<SearchEntityType, string> = {
  district: 'Districts',
  region: 'Regions',
  club: 'Clubs',
}

const OpenPalette: React.FC<OpenPaletteProps> = ({ onClose }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  // Auto-focus the input on mount. Callback ref avoids the
  // setState-in-effect pattern; React calls it once when the input attaches.
  const inputAttachRef = useCallback((el: HTMLInputElement | null) => {
    if (el) {
      // Defer one frame so the modal animation/layout has settled.
      window.setTimeout(() => el.focus(), 0)
    }
  }, [])

  // The unified index loads on first open (this component only mounts when the
  // palette opens), fanning out to the rankings + club-index CDN fetches.
  const { data: index, isLoading } = useQuery({
    queryKey: ['omni-search-index'],
    queryFn: loadSearchIndex,
    staleTime: 15 * 60 * 1000,
  })

  const groups = useMemo(
    () => (index ? searchEntities(query, index) : []),
    [index, query]
  )

  // Flatten the grouped results into a single ordered list for keyboard
  // navigation and aria-activedescendant — groups are for display only.
  const flat = useMemo<SearchEntity[]>(
    () => groups.flatMap(g => g.entities),
    [groups]
  )

  // Clamp activeIndex at read time rather than in an effect — derived value.
  const clampedActiveIndex = Math.min(activeIndex, Math.max(0, flat.length - 1))
  const activeEntity = flat[clampedActiveIndex]

  const navigateToActive = useCallback(() => {
    if (!activeEntity) return
    navigate(activeEntity.route)
    onClose()
  }, [activeEntity, navigate, onClose])

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
        navigateToActive()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [flat.length, navigateToActive, onClose]
  )

  const hasQuery = query.trim().length > 0
  const optionId = (e: SearchEntity) =>
    `command-palette-result-${e.type}-${e.id}`

  return (
    <div
      className="command-palette__backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Universal search"
        onClick={e => e.stopPropagation()}
      >
        <div className="command-palette__input-row">
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="command-palette__icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputAttachRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search districts, regions, clubs by name or number…"
            aria-label="Universal search input"
            aria-controls="command-palette-results"
            aria-activedescendant={
              activeEntity ? optionId(activeEntity) : undefined
            }
            className="command-palette__input"
          />
          <kbd className="command-palette__hint">esc</kbd>
        </div>

        {renderBody()}

        <div className="command-palette__footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )

  function renderBody() {
    // Before the user types, guide them — listing every indexed entity (14k+
    // clubs) is meaningless, so the empty query intentionally shows no listbox.
    if (!hasQuery) {
      return (
        <p className="command-palette__empty">
          Type to search districts, regions, and clubs.
        </p>
      )
    }
    if (isLoading && !index) {
      return <p className="command-palette__empty">Searching…</p>
    }
    if (flat.length === 0) {
      return <p className="command-palette__empty">No matches.</p>
    }
    return (
      <ul
        id="command-palette-results"
        role="listbox"
        aria-label="Search results"
        className="command-palette__results"
      >
        {groups.map(group => (
          <li
            key={group.type}
            role="group"
            aria-label={GROUP_LABEL[group.type]}
            className="command-palette__group"
          >
            <div className="command-palette__group-heading" aria-hidden="true">
              {GROUP_LABEL[group.type]}
            </div>
            <ul role="presentation" className="command-palette__group-list">
              {group.entities.map(entity => {
                const flatIdx = flat.indexOf(entity)
                const active = flatIdx === clampedActiveIndex
                return (
                  <li
                    key={optionId(entity)}
                    role="option"
                    aria-selected={active}
                    id={optionId(entity)}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                    className={
                      'command-palette__result' +
                      (active ? ' command-palette__result--active' : '')
                    }
                  >
                    <Link
                      to={entity.route}
                      onClick={onClose}
                      className="command-palette__result-link"
                    >
                      {renderEntity(entity)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    )
  }
}

// District results reuse the chip+name treatment (and its #522 no-duplicate
// guard); regions and clubs render their label plus disambiguation context.
function renderEntity(entity: SearchEntity) {
  if (entity.type === 'district') {
    return (
      <DistrictChipAndName
        districtId={entity.id}
        name={entity.label}
        chipClassName="command-palette__result-num"
        nameClassName="command-palette__result-name"
      />
    )
  }
  return (
    <>
      <span className="command-palette__result-name">{entity.label}</span>
      {entity.context && (
        <span className="command-palette__result-region">{entity.context}</span>
      )}
    </>
  )
}

export default CommandPalette
