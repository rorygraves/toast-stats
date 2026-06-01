/* CommandPalette (#422 → omni-search epic #1055 Sprint 2 #1057, Sprint 3 #1058)
   — the universal-search MODAL, opened with Cmd-K / Ctrl-K from anywhere and by
   the mobile header search icon. It searches the three globally-indexable entity
   types — districts, regions, clubs — via the unified index (`searchIndex.ts`),
   grouping results by type.

   Sprint 3: the search behavior (lazy index load, keyboard nav, ARIA, result
   rendering) is shared with the desktop header combobox via `useOmniSearch` +
   `OmniSearchResults`. This component is now just the modal shell around them.

   Architecture: outer <CommandPalette> gates visibility; the inner <OpenPalette>
   only mounts when open, so the ~1MB club index is fetched on first open (never
   at app boot) and closing + reopening resets state via unmount/remount. */

import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOmniSearch } from '../../hooks/useOmniSearch'
import OmniSearchResults from './OmniSearchResults'
import { type SearchEntity } from '../../services/searchIndex'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

const LISTBOX_ID = 'command-palette-results'
const OPTION_PREFIX = 'command-palette-result'

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  return <OpenPalette onClose={onClose} />
}

interface OpenPaletteProps {
  onClose: () => void
}

const OpenPalette: React.FC<OpenPaletteProps> = ({ onClose }) => {
  const navigate = useNavigate()

  const selectEntity = useCallback(
    (entity: SearchEntity) => {
      navigate(entity.route)
      onClose()
    },
    [navigate, onClose]
  )

  const {
    query,
    setQuery,
    index,
    groups,
    flat,
    activeIndex,
    setActiveIndex,
    activeEntity,
    hasQuery,
    handleKeyDown,
  } = useOmniSearch({ onSelect: selectEntity, onDismiss: onClose })

  // Auto-focus the input on mount. Callback ref avoids the
  // setState-in-effect pattern; React calls it once when the input attaches.
  const inputAttachRef = useCallback((el: HTMLInputElement | null) => {
    if (el) {
      // Defer one frame so the modal animation/layout has settled.
      window.setTimeout(() => el.focus(), 0)
    }
  }, [])

  const optionId = (e: SearchEntity) => `${OPTION_PREFIX}-${e.type}-${e.id}`

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
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search districts, regions, clubs by name or number…"
            aria-label="Universal search input"
            aria-controls={LISTBOX_ID}
            aria-activedescendant={
              activeEntity ? optionId(activeEntity) : undefined
            }
            className="command-palette__input"
          />
          <kbd className="command-palette__hint">esc</kbd>
        </div>

        {!hasQuery ? (
          // Before the user types, guide them — listing every indexed entity
          // (14k+ clubs) is meaningless, so the empty query shows no listbox.
          <p className="command-palette__empty">
            Type to search districts, regions, and clubs.
          </p>
        ) : !index ? (
          <p className="command-palette__empty">Searching…</p>
        ) : flat.length === 0 ? (
          <p className="command-palette__empty">No matches.</p>
        ) : (
          <OmniSearchResults
            groups={groups}
            activeIndex={activeIndex}
            onActivate={setActiveIndex}
            onSelect={onClose}
            listboxId={LISTBOX_ID}
            idPrefix={OPTION_PREFIX}
          />
        )}

        <div className="command-palette__footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
