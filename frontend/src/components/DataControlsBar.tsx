import React from 'react'
import type { ProgramYear } from '../utils/programYear'
import { formatDisplayDate } from '../utils/dateFormatting'

/* Tight horizontal cluster of three pill-styled controls — freshness
   pill, PY chip, date chip — shared by /districts and /district/:id. */

export interface DataControlsBarProps {
  latestSnapshotDate: string | undefined
  availableProgramYears: ProgramYear[]
  selectedProgramYear: ProgramYear
  onProgramYearChange: (py: ProgramYear) => void
  availableDates: string[]
  selectedDate: string | undefined
  onDateChange: (date: string | undefined) => void
}

// min-h-[44px]: the WCAG 2.5.5 / handoff 44px touch-target floor (#886, epic
// #888 Sprint 2). The chip is a <label> with an inset-0 opacity-0 <select>
// overlay, so the overlay inherits the label's height — lifting the label to
// 44px lifts the real touch target in both engines (L111 family). Shared with
// the non-interactive freshness pill too, which keeps the control row at a
// uniform height.
const CHIP_BASE =
  'inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-full text-xs font-medium border bg-white border-gray-200 text-gray-700 theme-dark:bg-gray-800 theme-dark:border-gray-700 theme-dark:text-gray-200'

const FreshnessPill: React.FC<{ date: string }> = ({ date }) => (
  <div
    data-testid="freshness-pill"
    className={CHIP_BASE}
    title={`Latest snapshot: ${date}`}
  >
    <span
      data-testid="freshness-dot"
      aria-hidden="true"
      className="w-2 h-2 rounded-full bg-green-500"
    />
    <span>Data fresh · {formatDisplayDate(date)}</span>
  </div>
)

/* Native <select> styled to look like a pill chip — keeps full keyboard
   a11y and platform popover behaviour without re-implementing dropdowns.
   The label uses focus-within ring styling so keyboard users still see
   focus when tabbing through the invisible select (WCAG 2.4.7). */
const ChipSelect: React.FC<{
  testId: string
  ariaLabel: string
  value: string
  onChange: (value: string) => void
  display: React.ReactNode
  options: { value: string; label: string }[]
}> = ({ testId, ariaLabel, value, onChange, display, options }) => {
  const currentLabel = options.find(o => o.value === value)?.label
  return (
    <label
      data-testid={testId}
      className={`${CHIP_BASE} relative cursor-pointer hover:bg-gray-50 theme-dark:hover:bg-gray-700 focus-within:ring-2 focus-within:ring-tm-loyal-blue focus-within:ring-offset-1`}
    >
      <span>{display}</span>
      <span aria-hidden="true" className="text-gray-400">
        ▾
      </span>
      <select
        data-testid={`${testId}-select`}
        aria-label={currentLabel ? `${ariaLabel}: ${currentLabel}` : ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

const formatPyShort = (py: ProgramYear): string =>
  `PY ${py.year}–${(py.year + 1).toString().slice(-2)}`

export const DataControlsBar: React.FC<DataControlsBarProps> = ({
  latestSnapshotDate,
  availableProgramYears,
  selectedProgramYear,
  onProgramYearChange,
  availableDates,
  selectedDate,
  onDateChange,
}) => {
  const sortedDates = [...availableDates].sort((a, b) => b.localeCompare(a))

  return (
    <div
      role="toolbar"
      aria-label="Data controls"
      className="flex flex-wrap items-center gap-2"
    >
      {latestSnapshotDate && <FreshnessPill date={latestSnapshotDate} />}

      <ChipSelect
        testId="py-chip"
        ariaLabel="Program year"
        value={String(selectedProgramYear.year)}
        onChange={v => {
          const py = availableProgramYears.find(p => p.year === Number(v))
          if (py) onProgramYearChange(py)
        }}
        display={formatPyShort(selectedProgramYear)}
        options={availableProgramYears.map(py => ({
          value: String(py.year),
          label: formatPyShort(py),
        }))}
      />

      <ChipSelect
        testId="date-chip"
        ariaLabel="Snapshot date"
        value={selectedDate ?? ''}
        onChange={v => onDateChange(v === '' ? undefined : v)}
        display={
          selectedDate ? formatDisplayDate(selectedDate) : 'Latest in PY'
        }
        options={[
          { value: '', label: 'Latest in PY' },
          ...sortedDates.map(d => ({
            value: d,
            label: formatDisplayDate(d) ?? d,
          })),
        ]}
      />
    </div>
  )
}
