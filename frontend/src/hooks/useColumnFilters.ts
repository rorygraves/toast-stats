import { useState, useCallback, useMemo } from 'react'
import { ClubTrend } from './useDistrictAnalytics'
import {
  ColumnFilter,
  FilterState,
  SortField,
  ProcessedClubTrend,
} from '../components/filters/types'
import {
  processClubs,
  applyFilter as applyFilterUtil,
} from '../utils/columnFilterUtils'

// Re-export utils for backward compatibility / direct testing
export {
  getLatestMembership,
  getLatestDcpGoals,
  getDistinguishedOrder,
  processClubs,
  applyFilter,
  applyAllFilters,
} from '../utils/columnFilterUtils'

/**
 * Hook for managing individual column filter states
 * Provides filter combination logic (AND operations) and filter clearing functionality
 */
export const useColumnFilters = (
  clubs: ClubTrend[],
  initialFilterState?: FilterState,
  referenceDate?: Date
) => {
  const [filterState, setFilterState] = useState<FilterState>(
    initialFilterState ?? {}
  )

  /**
   * Process clubs with computed properties for filtering
   */
  const processedClubs = useMemo((): ProcessedClubTrend[] => {
    return processClubs(clubs, referenceDate)
  }, [clubs, referenceDate])

  /**
   * Apply a single filter to the club data
   */
  const applyFilter = useCallback(
    (
      clubs: ProcessedClubTrend[],
      filter: ColumnFilter
    ): ProcessedClubTrend[] => {
      return applyFilterUtil(clubs, filter)
    },
    []
  )

  /**
   * Apply all active filters using AND logic
   */
  const filteredClubs = useMemo((): ProcessedClubTrend[] => {
    const activeFilters = Object.values(filterState).filter(
      Boolean
    ) as ColumnFilter[]

    if (activeFilters.length === 0) {
      return processedClubs
    }

    return activeFilters.reduce((filtered, filter) => {
      return applyFilter(filtered, filter)
    }, processedClubs)
  }, [processedClubs, filterState, applyFilter])

  /**
   * Set a filter for a specific column
   */
  const setFilter = useCallback(
    (field: SortField, filter: ColumnFilter | null) => {
      setFilterState(prev => ({
        ...prev,
        [field]: filter,
      }))
    },
    []
  )

  /**
   * Clear a specific column filter
   */
  const clearFilter = useCallback((field: SortField) => {
    setFilterState(prev => {
      const newState = { ...prev }
      delete newState[field]
      return newState
    })
  }, [])

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    setFilterState({})
  }, [])

  /**
   * Get the current filter for a specific field
   */
  const getFilter = useCallback(
    (field: SortField): ColumnFilter | null => {
      return filterState[field] || null
    },
    [filterState]
  )

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return Object.values(filterState).some(Boolean)
  }, [filterState])

  /**
   * Get count of active filters
   */
  const activeFilterCount = useMemo(() => {
    return Object.values(filterState).filter(Boolean).length
  }, [filterState])

  return {
    filteredClubs,
    filterState,
    setFilter,
    clearFilter,
    clearAllFilters,
    getFilter,
    hasActiveFilters,
    activeFilterCount,
  }
}
