import { useState, useEffect, useMemo } from 'react'

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: string, endDate: string) => void
  maxDays?: number
}

export const DateRangeSelector = ({
  onDateRangeChange,
  maxDays = 90,
}: DateRangeSelectorProps) => {
  const { today, thirtyDaysAgo } = useMemo(() => {
    const now = new Date()
    const todayDate = now.toISOString().split('T')[0]
    const thirtyDaysAgoDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    return { today: todayDate, thirtyDaysAgo: thirtyDaysAgoDate }
  }, [])

  const [startDate, setStartDate] = useState(thirtyDaysAgo)
  const [endDate, setEndDate] = useState(today)

  // Derived during render — no mirror-into-state effect (#340).
  const error = useMemo(() => {
    if (!startDate || !endDate) {
      return 'Both start and end dates are required'
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      return 'Start date must be before end date'
    }

    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysDiff > maxDays) {
      return `Date range cannot exceed ${maxDays} days`
    }

    return null
  }, [startDate, endDate, maxDays])

  // Emit valid date ranges
  useEffect(() => {
    if (!error && startDate && endDate) {
      onDateRangeChange(startDate, endDate)
    }
  }, [startDate, endDate, error, onDateRangeChange])

  const handlePresetRange = (days: number) => {
    const end = new Date()
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    setEndDate(end.toISOString().split('T')[0])
    setStartDate(start.toISOString().split('T')[0])
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
        Select Date Range
      </h3>

      <div className="space-y-4">
        {/* Date Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="start-date"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
            >
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              max={today}
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-base text-gray-900 bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="end-date"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
            >
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              max={today}
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-base text-gray-900 bg-white"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-xs sm:text-sm text-red-600 bg-red-50 px-3 py-2 rounded-sm">
            {error}
          </div>
        )}

        {/* Preset Ranges */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Quick Select
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePresetRange(7)}
              className="min-h-[44px] px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm text-xs sm:text-sm transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePresetRange(14)}
              className="min-h-[44px] px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm text-xs sm:text-sm transition-colors"
            >
              Last 14 Days
            </button>
            <button
              onClick={() => handlePresetRange(30)}
              className="min-h-[44px] px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm text-xs sm:text-sm transition-colors"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePresetRange(60)}
              className="min-h-[44px] px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm text-xs sm:text-sm transition-colors"
            >
              Last 60 Days
            </button>
            <button
              onClick={() => handlePresetRange(90)}
              className="min-h-[44px] px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm text-xs sm:text-sm transition-colors"
            >
              Last 90 Days
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
