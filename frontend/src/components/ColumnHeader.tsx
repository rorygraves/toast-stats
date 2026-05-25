import React, { useState, useRef, useEffect } from 'react'
import { ColumnHeaderProps } from './filters/types'
import { TextFilter } from './filters/TextFilter'
import { NumericFilter } from './filters/NumericFilter'
import { CategoricalFilter } from './filters/CategoricalFilter'

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
 * Interactive column header component with sort and filter capabilities
 *
 * Features:
 * - Clickable headers with dropdown/popover functionality
 * - Visual indicators for sort and filter states
 * - Hover states and accessibility attributes
 * - Keyboard navigation support
 * - Focus management for dropdowns
 */
export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  field,
  label,
  sortable,
  filterable,
  filterType,
  currentSort,
  currentFilter,
  onSort,
  onFilter,
  options = [],
  className = '',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [filterValue, setFilterValue] = useState<
    string | [number | null, number | null] | string[]
  >(() => {
    if (currentFilter) {
      if (
        currentFilter.type === 'numeric' &&
        Array.isArray(currentFilter.value)
      ) {
        // Convert number[] to [number | null, number | null]
        const numArray = currentFilter.value as number[]
        return [numArray[0] ?? null, numArray[1] ?? null] as [
          number | null,
          number | null,
        ]
      }
      return currentFilter.value as string | string[]
    }
    switch (filterType) {
      case 'numeric':
        return [null, null] as [number | null, number | null]
      case 'categorical':
        return [] as string[]
      default:
        return ''
    }
  })

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

  // Handle filter application
  const handleFilterApply = () => {
    if (filterType === 'text' && typeof filterValue === 'string') {
      if (filterValue.trim()) {
        onFilter(field, {
          field,
          type: filterType,
          value: filterValue,
          operator: 'contains',
        })
      } else {
        onFilter(field, null)
      }
    } else if (filterType === 'numeric' && Array.isArray(filterValue)) {
      const [min, max] = filterValue as [number | null, number | null]
      if (min !== null || max !== null) {
        onFilter(field, {
          field,
          type: filterType,
          value: [min, max],
          operator: 'range',
        })
      } else {
        onFilter(field, null)
      }
    } else if (filterType === 'categorical' && Array.isArray(filterValue)) {
      const selectedValues = filterValue as string[]
      if (selectedValues.length > 0) {
        onFilter(field, {
          field,
          type: filterType,
          value: selectedValues,
          operator: 'in',
        })
      } else {
        onFilter(field, null)
      }
    }
    setIsDropdownOpen(false)
  }

  // Handle filter clear
  const handleFilterClear = () => {
    switch (filterType) {
      case 'numeric':
        setFilterValue([null, null] as [number | null, number | null])
        break
      case 'categorical':
        setFilterValue([] as string[])
        break
      default:
        setFilterValue('')
    }
    onFilter(field, null)
    setIsDropdownOpen(false)
  }

  // Check if column has active state (sorted or filtered)
  const hasActiveState = () => {
    return currentSort.field === field || currentFilter !== null
  }

  // Render filter component
  const renderFilterComponent = () => {
    switch (filterType) {
      case 'text':
        return (
          <TextFilter
            value={filterValue as string}
            onChange={value => {
              setFilterValue(value)
            }}
            onClear={handleFilterClear}
            placeholder={`Filter ${label.toLowerCase()}...`}
          />
        )
      case 'numeric':
        return (
          <NumericFilter
            value={filterValue as [number | null, number | null]}
            onChange={(min, max) => {
              setFilterValue([min, max] as [number | null, number | null])
            }}
            onClear={handleFilterClear}
            label={label}
          />
        )
      case 'categorical':
        return (
          <CategoricalFilter
            options={options}
            selectedValues={filterValue as string[]}
            onChange={values => {
              setFilterValue(values)
            }}
            onClear={handleFilterClear}
            label={label}
            multiple={true}
          />
        )
      default:
        return null
    }
  }

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
        aria-label={`${label} column header. ${sortable ? 'Sortable. ' : ''}${filterable ? 'Filterable. ' : ''}${currentSort.field === field ? `Currently sorted ${currentSort.direction}ending. ` : ''}${currentFilter ? 'Has active filter. ' : ''}Press Enter or Space to open options, Arrow Down to open dropdown.`}
      >
        <span className="flex-1">{label}</span>
        {(sortable || filterable) && (
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
        )}
      </button>

      {/* Dropdown/Popover — the filter control surface, re-skinned to redesign
          tokens in Sprint 4 (#670). Token-driven (.clubs-filter-*) so dark mode
          works via [data-theme='dark'] remaps (R10) — no legacy gray, no baked
          opacity-variants (lesson 073). The active accent matches the
          segmented/chip controls (--link on --loyal-50). */}
      {isDropdownOpen && (sortable || filterable) && (
        <div className="absolute top-full left-0 z-50 mt-1 w-80 clubs-filter-popover shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="p-4 space-y-4">
            {/* Sort Options */}
            {sortable && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium clubs-filter-heading">
                  Sort
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onSort(field)
                      if (
                        currentSort.field !== field ||
                        currentSort.direction !== 'asc'
                      ) {
                        // Will be handled by parent component
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
                      currentSort.direction === 'asc'
                        ? '--active'
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
                        ? '--active'
                        : ''
                    }`}
                    tabIndex={0}
                    aria-label={`Sort ${label} descending (Z to A)`}
                  >
                    Sort Z-A
                  </button>
                </div>
              </div>
            )}

            {/* Filter Options */}
            {filterable && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium clubs-filter-heading">
                  Filter
                </h4>
                {renderFilterComponent()}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleFilterApply}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.currentTarget.click()
                      }
                    }}
                    className="px-3 py-1 text-sm rounded border clubs-filter-btn--primary hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue transition-all duration-200"
                    tabIndex={0}
                    aria-label={`Apply ${label} filter`}
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleFilterClear}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.currentTarget.click()
                      }
                    }}
                    className="px-3 py-1 text-sm rounded border clubs-filter-btn--ghost hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue transition-all duration-200"
                    tabIndex={0}
                    aria-label={`Clear ${label} filter`}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
