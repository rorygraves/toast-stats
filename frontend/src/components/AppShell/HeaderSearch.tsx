/* HeaderSearch (epic #1055 Sprint 3, #1058) — the header entry point to the
   unified omni-search. ONE behavior (useOmniSearch + OmniSearchResults), two
   presentations chosen by viewport so only the active one mounts (no hidden
   responsive twin — Lesson 149):

   - desktop (≥768px): an inline combobox with a typeahead dropdown. The ~1MB
     club index is fetched lazily on first focus, never at cold app load.
   - mobile  (<768px): a compact search-icon button that opens the full-screen
     modal palette (owned by AppShell). Keeps the cramped header clean.

   Cmd-K / Ctrl-K opens the modal on all viewports — that lives in AppShell. */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useOmniSearch } from '../../hooks/useOmniSearch'
import OmniSearchResults from './OmniSearchResults'
import { type SearchEntity } from '../../services/searchIndex'

interface HeaderSearchProps {
  /** Open the modal palette (mobile icon + the shared Cmd-K surface). */
  onOpenSearch: () => void
}

const LISTBOX_ID = 'header-search-results'
const OPTION_PREFIX = 'header-search-option'

const SearchGlyph: React.FC = () => (
  <svg
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="header-search__icon"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
)

const HeaderSearch: React.FC<HeaderSearchProps> = ({ onOpenSearch }) => {
  const isMobile = useIsMobile(768)
  if (isMobile) {
    return (
      <button
        type="button"
        className="app-shell-icon-btn header-search__trigger"
        aria-label="Search"
        title="Search districts, regions, clubs"
        onClick={onOpenSearch}
      >
        <SearchGlyph />
      </button>
    )
  }
  return <DesktopOmniCombobox />
}

const DesktopOmniCombobox: React.FC = () => {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // `focused` both gates the lazy index fetch and gates dropdown visibility,
  // so the 1MB club index is fetched only once the user engages the field.
  const [focused, setFocused] = useState(false)

  // Collapse the dropdown and drop DOM focus so React state and the input
  // agree (a still-focused input with focused=false would swallow typing).
  const dismiss = useCallback(() => {
    setFocused(false)
    inputRef.current?.blur()
  }, [])

  const selectEntity = useCallback(
    (entity: SearchEntity) => {
      navigate(entity.route)
      dismiss()
    },
    [navigate, dismiss]
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
  } = useOmniSearch({
    onSelect: selectEntity,
    onDismiss: dismiss,
    enabled: focused,
  })

  // Clear the query whenever the field collapses (select / Esc / outside-click)
  // so reopening starts fresh — the palette-style reset, minus a remount.
  useEffect(() => {
    if (!focused) setQuery('')
  }, [focused, setQuery])

  // Outside-click closes the dropdown (focus stays inert until re-engaged).
  // Bound only while open so idle pages carry no global listener.
  useEffect(() => {
    if (!focused) return
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) dismiss()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [focused, dismiss])

  const showDropdown = focused && hasQuery
  // The listbox only mounts once results exist; gate aria-expanded /
  // -controls / -activedescendant on that so they never reference an absent
  // id (the strictly-correct WAI-ARIA 1.2 combobox form).
  const listboxOpen = showDropdown && !!index && flat.length > 0
  const optionId = (e: SearchEntity) => `${OPTION_PREFIX}-${e.type}-${e.id}`

  return (
    <div className="header-search" ref={containerRef}>
      <div className="header-search__field">
        <SearchGlyph />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search…"
          aria-label="Search districts, regions, clubs by name or number"
          aria-autocomplete="list"
          aria-expanded={listboxOpen}
          aria-controls={listboxOpen ? LISTBOX_ID : undefined}
          aria-activedescendant={
            listboxOpen && activeEntity ? optionId(activeEntity) : undefined
          }
          className="header-search__input"
        />
      </div>
      {showDropdown && (
        <div className="header-search__dropdown">
          {!index ? (
            <p className="command-palette__empty">Searching…</p>
          ) : flat.length === 0 ? (
            <p className="command-palette__empty">No matches.</p>
          ) : (
            <OmniSearchResults
              groups={groups}
              activeIndex={activeIndex}
              onActivate={setActiveIndex}
              onSelect={dismiss}
              listboxId={LISTBOX_ID}
              idPrefix={OPTION_PREFIX}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default HeaderSearch
