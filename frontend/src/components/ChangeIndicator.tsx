import React from 'react'

export interface ChangeIndicatorProps {
  /** Signed delta (positive = increase, negative = decrease, 0 = no change). */
  value: number
  /** Optional formatter for the magnitude (e.g. `n => \`${n} goals\``). */
  format?: (magnitude: number) => string
  /** Extra classes appended to the span (lesson 077 — override, no variant enum). */
  className?: string
}

/**
 * #795 (epic #797 Sprint 3) — compact inline signed-delta indicator for the
 * per-club delta table.
 *
 * Same a11y contract as KpiDeltaCard (#681): the signed actual is rendered
 * (lesson 102 — never a clamped gap), and direction is conveyed by sign +
 * arrow + a screen-reader word, never colour alone (WCAG 1.4.1). The
 * `text-green-700`/`text-red-700` utilities carry dark-mode overrides in
 * dark-mode.css (lesson 067). Zero renders a neutral muted em-dash — no sign,
 * no arrow, no colour.
 */
export const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({
  value,
  format,
  className,
}) => {
  const isUp = value > 0
  const isDown = value < 0
  const magnitude = Math.abs(value)
  const formatted = format ? format(magnitude) : magnitude.toLocaleString()

  if (!isUp && !isDown) {
    return (
      <span
        data-testid="change-indicator"
        className={`change-indicator change-indicator--zero${
          className ? ` ${className}` : ''
        }`}
      >
        —
      </span>
    )
  }

  // U+2212 minus for negatives; '+' for positives.
  const display = isUp ? `+${formatted}` : `−${formatted}`
  const colorClass = isUp ? 'text-green-700' : 'text-red-700'

  return (
    <span
      data-testid="change-indicator"
      className={`change-indicator inline-flex items-center gap-1 tabular-nums ${colorClass}${
        className ? ` ${className}` : ''
      }`}
    >
      <span
        data-testid="change-indicator-arrow"
        aria-hidden="true"
        className="change-indicator__arrow"
      >
        {isUp ? '▲' : '▼'}
      </span>
      <span>{display}</span>
      <span className="sr-only">{isUp ? 'increase' : 'decrease'}</span>
    </span>
  )
}

export default ChangeIndicator
