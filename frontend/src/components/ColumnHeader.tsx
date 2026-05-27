import React, { useState, useRef, useEffect } from 'react'
import { ColumnHeaderProps } from './filters/types'

/**
 * Focus trap utility for managing focus within dropdowns
 */
const useFocusTrap = (
  isActive: boolean,
  containerRef: React.RefObject<HTMLElement | null>
) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    // Focus first element when trap becomes active
    if (firstElement) {
      firstElement.focus()
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive, containerRef])
}

/**
 * Interactive column header — SORT control (#816).
 *
 * Filtering moved out of the header into the dedicated FiltersPanel drawer
 * (epic #818 Sprint 3 / table-ux-review §B3), so the once-hidden per-column
 * filter dropdown is gone. The header now opens a small sort popover (Sort A-Z /
 * Sort Z-A) — the sort interaction is unchanged from before.
 *
 * Features:
 * - Clickable header with a sort popover
 * - Active-sort visual indicator
 * - Keyboard navigation + focus management for the popover
 */
export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  field,
  label,
  sortable,
  currentSort,
  onSort,
  className = '',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Enable focus trapping when dropdown is open
  useFocusTrap(isDropdownOpen, dropdownRef)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscapeKey)
      }
    }

    return undefined
  }, [isDropdownOpen])

  // Non-sortable column: a plain, non-interactive label (no popover to open).
  if (!sortable) {
    return (
      <div
        className={`clubs-col-header flex items-center gap-1 px-2 py-2 text-left text-[9px] font-medium uppercase tracking-wider ${className}`.trim()}
      >
        <span className="flex-1">{label}</span>
      </div>
    )
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsDropdownOpen(!isDropdownOpen)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setIsDropdownOpen(false)
      buttonRef.current?.focus()
    } else if (event.key === 'ArrowDown' && !isDropdownOpen) {
      event.preventDefault()
      setIsDropdownOpen(true)
    }
  }

  // Active state = this column is the current sort key.
  const hasActiveState = () => currentSort.field === field

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onKeyDown={handleKeyDown}
        className="clubs-col-header group flex items-center gap-1 px-2 py-2 text-left text-[9px] font-medium uppercase tracking-wider hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue focus:ring-inset transition-all duration-200 w-full cursor-pointer"
        tabIndex={0}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        aria-label={`${label} column header. Sortable. ${currentSort.field === field ? `Currently sorted ${currentSort.direction}ending. ` : ''}Press Enter or Space to open sort options, Arrow Down to open dropdown.`}
      >
        <span className="flex-1">{label}</span>
        <svg
          className={`w-2.5 h-2.5 transition-all duration-200 ${isDropdownOpen ? 'rotate-180' : ''} ${hasActiveState() ? 'text-tm-loyal-blue' : 'clubs-col-header__arrow'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Sort popover — token-driven (.clubs-filter-*) so dark mode works via
          [data-theme='dark'] remaps (R10). */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-48 clubs-filter-popover shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium clubs-filter-heading">Sort</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSort(field)
                    setIsDropdownOpen(false)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.currentTarget.click()
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded border focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue transition-all duration-200 clubs-filter-btn${
                    currentSort.field === field &&
                    currentSort.direction === 'asc'
                      ? ' clubs-filter-btn--active'
                      : ''
                  }`}
                  tabIndex={0}
                  aria-label={`Sort ${label} ascending (A to Z)`}
                >
                  Sort A-Z
                </button>
                <button
                  onClick={() => {
                    if (
                      currentSort.field === field &&
                      currentSort.direction === 'asc'
                    ) {
                      onSort(field) // This will toggle to desc
                    } else {
                      onSort(field)
                      if (currentSort.direction === 'asc') {
                        onSort(field) // Toggle to desc
                      }
                    }
                    setIsDropdownOpen(false)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.currentTarget.click()
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded border focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue transition-all duration-200 clubs-filter-btn${
                    currentSort.field === field &&
                    currentSort.direction === 'desc'
                      ? ' clubs-filter-btn--active'
                      : ''
                  }`}
                  tabIndex={0}
                  aria-label={`Sort ${label} descending (Z to A)`}
                >
                  Sort Z-A
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
