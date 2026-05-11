import React, { useState } from 'react'
import { CategoricalFilterProps } from './types'

/**
 * CategoricalFilter Component
 *
 * Provides multi-select filtering for categorical columns like Status and Distinguished.
 *
 * Features:
 * - Multi-select checkboxes for all available options
 * - Select all/none functionality
 * - Clear filter functionality
 * - Visual indication of selected items
 *
 * @component
 */
export const CategoricalFilter: React.FC<CategoricalFilterProps> = ({
  options,
  selectedValues,
  onChange,
  onClear,
  label,
  multiple = true,
  className = '',
}) => {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedValues)
  // Render-phase sync: when the parent resets selectedValues (e.g. "Clear
  // all filters") propagate it to local state without setState-in-effect
  // (#340). See React docs:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [trackedSelected, setTrackedSelected] =
    useState<string[]>(selectedValues)
  if (selectedValues !== trackedSelected) {
    setTrackedSelected(selectedValues)
    setLocalSelected(selectedValues)
  }

  // Handle option toggle
  const handleToggle = (option: string) => {
    let newSelected: string[]

    if (multiple) {
      if (localSelected.includes(option)) {
        newSelected = localSelected.filter(item => item !== option)
      } else {
        newSelected = [...localSelected, option]
      }
    } else {
      // Single select mode
      newSelected = localSelected.includes(option) ? [] : [option]
    }

    setLocalSelected(newSelected)
    onChange(newSelected)
  }

  // Handle select all
  const handleSelectAll = () => {
    if (localSelected.length === options.length) {
      // All selected, clear all
      setLocalSelected([])
      onChange([])
    } else {
      // Not all selected, select all
      setLocalSelected(options)
      onChange(options)
    }
  }

  // Handle clear
  const handleClear = () => {
    setLocalSelected([])
    onClear()
  }

  const hasSelection = localSelected.length > 0
  const allSelected = localSelected.length === options.length

  return (
    <div
      className={`p-4 bg-white border border-gray-200 rounded-lg shadow-lg min-w-64 max-w-80 ${className}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {hasSelection && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-tm-loyal-blue hover:text-tm-loyal-blue hover:underline font-medium focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue rounded transition-all duration-200"
              tabIndex={0}
              aria-label="Clear categorical filter"
            >
              Clear
            </button>
          )}
        </div>

        {/* Select All/None (only for multiple mode) */}
        {multiple && options.length > 1 && (
          <div className="pb-2 border-b border-gray-100">
            <div
              role="checkbox"
              aria-checked={allSelected}
              tabIndex={0}
              onClick={handleSelectAll}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelectAll()
                }
              }}
              className="flex items-center gap-2 cursor-pointer text-sm text-tm-loyal-blue hover:underline font-medium focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue rounded px-1 py-1"
            >
              <div
                className={`w-4 h-4 min-w-[16px] min-h-[16px] border-2 rounded-xs flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                  allSelected
                    ? 'bg-tm-loyal-blue border-tm-loyal-blue'
                    : localSelected.length > 0
                      ? 'bg-blue-100 border-tm-loyal-blue'
                      : 'bg-white border-gray-300'
                }`}
              >
                {allSelected && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {localSelected.length > 0 && !allSelected && (
                  <div className="w-2 h-2 bg-tm-loyal-blue rounded-xs" />
                )}
              </div>
              <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {options.map(option => {
            const isSelected = localSelected.includes(option)
            return (
              <div
                key={option}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleToggle(option)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleToggle(option)
                  }
                }}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded px-2 py-2 transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue focus:ring-inset"
              >
                <div
                  className={`w-4 h-4 min-w-[16px] min-h-[16px] border-2 rounded-xs flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                    isSelected
                      ? 'bg-tm-loyal-blue border-tm-loyal-blue'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700 select-none">
                  {option}
                </span>
              </div>
            )
          })}
        </div>

        {/* Selection Summary */}
        {hasSelection && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 border-t border-gray-100">
            {localSelected.length === 1
              ? `1 ${label.toLowerCase()} selected`
              : `${localSelected.length} ${label.toLowerCase()}s selected`}
            {localSelected.length <= 3 && (
              <div className="mt-1 text-gray-600">
                {localSelected.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
