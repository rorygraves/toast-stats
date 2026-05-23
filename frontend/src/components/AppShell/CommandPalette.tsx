/* CommandPalette (#422) — universal search opened with Cmd-K / Ctrl-K
   from anywhere in the app. v1 searches districts only (the data we
   already fetch on the landing page); clubs/areas can extend later by
   resolving the user's pinned district at open time.

   Architecture: outer <CommandPalette> just gates visibility. The inner
   <OpenPalette> holds all local state, so closing + reopening naturally
   resets via React's unmount/remount, avoiding setState-in-effect
   patterns. */

import React, { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCdnRankings } from '../../services/cdn'
import type { DistrictRanking } from '../../types/districts'
import { DistrictChipAndName } from '../DistrictChipAndName'

const MAX_RESULTS = 8

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

const OpenPalette: React.FC<OpenPaletteProps> = ({ onClose }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  // Auto-focus the input on mount. Callback ref avoids the
  // setState-in-effect pattern; React calls it once when the input
  // attaches.
  const inputAttachRef = useCallback((el: HTMLInputElement | null) => {
    if (el) {
      // Defer one frame so the modal animation/layout has settled.
      window.setTimeout(() => el.focus(), 0)
    }
  }, [])

  // Share the same cache as DistrictsPage so opening the palette is
  // typically free.
  const { data } = useQuery({
    queryKey: ['district-rankings', 'latest'],
    queryFn: async () => {
      const cdnData = await fetchCdnRankings()
      return { rankings: cdnData.rankings, date: cdnData.date }
    },
    staleTime: 15 * 60 * 1000,
  })

  const matches = useMemo<DistrictRanking[]>(() => {
    const all: DistrictRanking[] = data?.rankings ?? []
    const q = query.trim().toLowerCase()
    if (!q) return all.slice(0, MAX_RESULTS)
    return all
      .filter(
        r =>
          r.districtId.toLowerCase().includes(q) ||
          r.districtName.toLowerCase().includes(q)
      )
      .slice(0, MAX_RESULTS)
  }, [data?.rankings, query])

  // Clamp activeIndex at read time rather than in an effect — derived
  // value, no setState-in-effect needed.
  const clampedActiveIndex = Math.min(
    activeIndex,
    Math.max(0, matches.length - 1)
  )

  const navigateToActive = useCallback(() => {
    const choice = matches[clampedActiveIndex]
    if (!choice) return
    navigate(`/district/${choice.districtId}`)
    onClose()
  }, [matches, clampedActiveIndex, navigate, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, Math.max(0, matches.length - 1)))
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
    [matches.length, navigateToActive, onClose]
  )

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
            placeholder="Jump to a district by number or name…"
            aria-label="Universal search input"
            aria-controls="command-palette-results"
            aria-activedescendant={
              matches[clampedActiveIndex]
                ? `command-palette-result-${matches[clampedActiveIndex].districtId}`
                : undefined
            }
            className="command-palette__input"
          />
          <kbd className="command-palette__hint">esc</kbd>
        </div>

        {matches.length > 0 ? (
          <ul
            id="command-palette-results"
            role="listbox"
            aria-label="Search results"
            className="command-palette__results"
          >
            {matches.map((m, i) => (
              <li
                key={m.districtId}
                role="option"
                aria-selected={i === clampedActiveIndex}
                id={`command-palette-result-${m.districtId}`}
                onMouseEnter={() => setActiveIndex(i)}
                className={
                  'command-palette__result' +
                  (i === clampedActiveIndex
                    ? ' command-palette__result--active'
                    : '')
                }
              >
                <Link
                  to={`/district/${m.districtId}`}
                  onClick={onClose}
                  className="command-palette__result-link"
                >
                  <DistrictChipAndName
                    districtId={m.districtId}
                    name={m.districtName}
                    chipClassName="command-palette__result-num"
                    nameClassName="command-palette__result-name"
                  />
                  <span className="command-palette__result-region">
                    Region {m.region}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="command-palette__empty">
            {data ? 'No districts match.' : 'Loading districts…'}
          </p>
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
