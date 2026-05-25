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
    <div className={`p-4 clubs-filter-popover shadow-lg min-w-64 ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium clubs-filter-heading">
            {label} Range
          </span>
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs clubs-filter-link font-medium focus:outline-hidden focus:ring-2 focus:ring-tm-loyal-blue rounded transition-all duration-200"
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
            <label className="block text-xs clubs-filter-label mb-1">
              Minimum
            </label>
            <input
              type="number"
              value={localMin}
              onChange={e => handleMinChange(e.target.value)}
              placeholder="Min"
              min={min}
              max={max}
              className="w-full px-3 py-2 text-sm rounded clubs-filter-input focus:outline-hidden transition-colors duration-200"
              tabIndex={0}
              aria-label={`Minimum ${label.toLowerCase()} value`}
            />
          </div>
          <div>
            <label className="block text-xs clubs-filter-label mb-1">
              Maximum
            </label>
            <input
              type="number"
              value={localMax}
              onChange={e => handleMaxChange(e.target.value)}
              placeholder="Max"
              min={min}
              max={max}
              className="w-full px-3 py-2 text-sm rounded clubs-filter-input focus:outline-hidden transition-colors duration-200"
              tabIndex={0}
              aria-label={`Maximum ${label.toLowerCase()} value`}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-xs clubs-filter-error rounded px-2 py-1">
            {error}
          </div>
        )}

        {/* Range Display */}
        {hasValue && !error && (
          <div className="text-xs clubs-filter-meta rounded px-2 py-1">
            {localMin !== '' && localMax !== ''
              ? `${localMin} - ${localMax}`
              : localMin !== ''
                ? `≥ ${localMin}`
                : `≤ ${localMax}`}
          </div>
        )}

        {/* Bounds Info */}
        {(min !== undefined || max !== undefined) && (
          <div className="text-xs clubs-filter-note pt-2 border-t clubs-filter-divider">
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
