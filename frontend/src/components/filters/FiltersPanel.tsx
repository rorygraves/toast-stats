import React from 'react'
import { ColumnFilter, SortField } from './types'

export interface FiltersPanelProps {
  isOpen: boolean
  onClose: () => void
  getFilter: (field: SortField) => ColumnFilter | null
  setFilter: (field: SortField, filter: ColumnFilter | null) => void
  clearAllFilters: () => void
  activeFilterCount: number
}

// RED stub (#816) — implemented in the GREEN commit that follows.
export const FiltersPanel: React.FC<FiltersPanelProps> = () => null
