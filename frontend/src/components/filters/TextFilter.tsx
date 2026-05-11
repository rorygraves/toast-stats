import React, { useState, useEffect } from 'react'
import { TextFilterProps } from './types'
import { useDebounce } from '../../hooks/useDebounce'

/**
 * TextFilter Component
 *
 * Provides text-based filtering with contains/starts-with options
 * for text columns like Club Name, Division, and Area.
 *
 * Features:
 * - Text input with real-time filtering
 * - Operator selection (contains/starts with)
 * - Clear filter functionality
 * - Debounced input to prevent excessive filtering
 *
 * @component
 */
export const TextFilter: React.FC<TextFilterProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Filter...',
  className = '',
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [operator, setOperator] = useState<'contains' | 'startsWith'>(
    'contains'
  )
  // Track the prop value to detect external resets (e.g. "Clear all").
  // Render-phase sync avoids setState-in-effect (#340); see React docs:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [trackedValue, setTrackedValue] = useState(value)
  if (value !== trackedValue) {
    setTrackedValue(value)
    setLocalValue(value)
  }

  // Debounce the local value with 300ms delay for performance optimization
  const debouncedValue = useDebounce(localValue, 300)

  // Call onChange when debounced value changes
  useEffect(() => {
    // Only call onChange if the debounced value is different from the current prop value
    // This ensures we don't call onChange on initial mount when values are the same
    // but we do call it when user input has been debounced
    if (debouncedValue !== value) {
      onChange(debouncedValue, operator)
    }
  }, [debouncedValue, operator, onChange, value])

  // Handle input change - only update local state, debouncing will handle the rest
  const handleInputChange = (newValue: string) => {
    setLocalValue(newValue)
  }

  // Handle operator change - apply immediately since it's not a text input
  const handleOperatorChange = (newOperator: 'contains' | 'startsWith') => {
    setOperator(newOperator)
    // Apply operator change immediately with current debounced value
    onChange(debouncedValue, newOperator)
  }

  // Handle clear
  const handleClear = () => {
    setLocalValue('')
    setOperator('contains')
    onClear()
  }

  return (
    <div
      className={`p-4 bg-white border border-gray-200 rounded-lg shadow-lg min-w-64 ${className}`}
    >
      <div className="space-y-3">
        {/* Filter Type Selection */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleOperatorChange('contains')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.currentTarget.click()
              }
            }}
            className={`px-3 py-1 text-xs font-medium rounded transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
              operator === 'contains'
                ? 'bg-blue-100 text-tm-loyal-blue border border-blue-300 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 hover:border-gray-400'
            }`}
            tabIndex={0}
            aria-label="Filter by contains"
            aria-pressed={operator === 'contains'}
          >
            Contains
          </button>
          <button
            type="button"
            onClick={() => handleOperatorChange('startsWith')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.currentTarget.click()
              }
            }}
            className={`px-3 py-1 text-xs font-medium rounded transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
              operator === 'startsWith'
                ? 'bg-blue-100 text-tm-loyal-blue border border-blue-300 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 hover:border-gray-400'
            }`}
            tabIndex={0}
            aria-label="Filter by starts with"
            aria-pressed={operator === 'startsWith'}
          >
            Starts with
          </button>
        </div>

        {/* Text Input */}
        <div className="relative">
          <input
            type="text"
            value={localValue}
            onChange={e => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition-colors duration-200"
            autoFocus
            tabIndex={0}
            aria-label={`Filter text input. Current operator: ${operator}`}
          />
          {localValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded p-1 transition-all duration-200"
              aria-label="Clear filter"
              tabIndex={0}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {operator === 'contains' ? 'Contains text' : 'Starts with text'}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-tm-loyal-blue hover:text-tm-loyal-blue hover:underline font-medium focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue rounded transition-all duration-200"
            tabIndex={0}
            aria-label="Clear text filter"
          >
            Clear Filter
          </button>
        </div>
      </div>
    </div>
  )
}
