import React, { useState } from 'react'
import { NumericFilterProps } from './types'

/**
 * NumericFilter Component
 *
 * Provides range-based filtering for numeric columns like Members and DCP Goals.
 *
 * Features:
 * - Min/max range inputs
 * - Validation to ensure min <= max
 * - Clear filter functionality
 * - Proper number input handling
 *
 * @component
 */
export const NumericFilter: React.FC<NumericFilterProps> = ({
  value,
  onChange,
  onClear,
  label,
  min,
  max,
  className = '',
}) => {
  // Initialize state from props and keep it synchronized
  const [localMin, setLocalMin] = useState<string>(
    () => value[0]?.toString() || ''
  )
  const [localMax, setLocalMax] = useState<string>(
    () => value[1]?.toString() || ''
  )
  const [error, setError] = useState<string>('')

  // Render-phase sync: when the parent updates `value` (e.g. external
  // "Clear all filters"), propagate it to local inputs without
  // setState-in-effect (#340).
  const [trackedValue, setTrackedValue] = useState(value)
  if (value !== trackedValue) {
    setTrackedValue(value)
    setLocalMin(value[0]?.toString() || '')
    setLocalMax(value[1]?.toString() || '')
  }

  // Validate and update filter
  const updateFilter = (minStr: string, maxStr: string) => {
    const minVal = minStr === '' ? null : parseFloat(minStr)
    const maxVal = maxStr === '' ? null : parseFloat(maxStr)

    // Validation
    if (minStr !== '' && isNaN(minVal!)) {
      setError('Invalid minimum value')
      return
    }
    if (maxStr !== '' && isNaN(maxVal!)) {
      setError('Invalid maximum value')
      return
    }
    if (minVal !== null && maxVal !== null && minVal > maxVal) {
      setError('Minimum cannot be greater than maximum')
      return
    }
    if (min !== undefined && minVal !== null && minVal < min) {
      setError(`Minimum cannot be less than ${min}`)
      return
    }
    if (max !== undefined && maxVal !== null && maxVal > max) {
      setError(`Maximum cannot be greater than ${max}`)
      return
    }

    setError('')
    onChange(minVal, maxVal)
  }

  // Handle min input change
  const handleMinChange = (newMin: string) => {
    setLocalMin(newMin)
    updateFilter(newMin, localMax)
  }

  // Handle max input change
  const handleMaxChange = (newMax: string) => {
    setLocalMax(newMax)
    updateFilter(localMin, newMax)
  }

  // Handle clear
  const handleClear = () => {
    setLocalMin('')
    setLocalMax('')
    setError('')
    onClear()
  }

  const hasValue = localMin !== '' || localMax !== ''

  return (
    <div
      className={`p-4 bg-white border border-gray-200 rounded-lg shadow-lg min-w-64 ${className}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {label} Range
          </span>
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-tm-loyal-blue hover:text-tm-loyal-blue hover:underline font-medium focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue rounded transition-all duration-200"
              tabIndex={0}
              aria-label="Clear numeric filter"
            >
              Clear
            </button>
          )}
        </div>

        {/* Range Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Minimum</label>
            <input
              type="number"
              value={localMin}
              onChange={e => handleMinChange(e.target.value)}
              placeholder="Min"
              min={min}
              max={max}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition-colors duration-200"
              tabIndex={0}
              aria-label={`Minimum ${label.toLowerCase()} value`}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Maximum</label>
            <input
              type="number"
              value={localMax}
              onChange={e => handleMaxChange(e.target.value)}
              placeholder="Max"
              min={min}
              max={max}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition-colors duration-200"
              tabIndex={0}
              aria-label={`Maximum ${label.toLowerCase()} value`}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
            {error}
          </div>
        )}

        {/* Range Display */}
        {hasValue && !error && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
            {localMin !== '' && localMax !== ''
              ? `${localMin} - ${localMax}`
              : localMin !== ''
                ? `≥ ${localMin}`
                : `≤ ${localMax}`}
          </div>
        )}

        {/* Bounds Info */}
        {(min !== undefined || max !== undefined) && (
          <div className="text-xs text-gray-600 pt-2 border-t border-gray-100">
            {min !== undefined && max !== undefined
              ? `Valid range: ${min} - ${max}`
              : min !== undefined
                ? `Minimum: ${min}`
                : `Maximum: ${max}`}
          </div>
        )}
      </div>
    </div>
  )
}
