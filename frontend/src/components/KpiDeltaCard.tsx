import React from 'react'
import { Tooltip, InfoIcon } from './Tooltip'

export interface KpiDeltaCardProps {
  title: string
  /** Signed delta (positive = increase, negative = decrease). */
  current: number
  tooltipContent?: string
  secondaryLabel?: string
}

/**
 * #681 — KPI card for a signed-delta metric (Net Member Change).
 *
 * Net Member Change has no Distinguished tiers, so — unlike KpiBulletCard —
 * it renders the signed value directly rather than a bullet bar (lesson 063:
 * pick the visual by the question the metric answers; lesson 102: a signed
 * delta is not a clamped tier-gap). Direction is conveyed by sign + arrow +
 * screen-reader word, never colour alone (WCAG 1.4.1). The green/red
 * utilities carry dark-mode overrides in dark-mode.css (lesson 067).
 */
export const KpiDeltaCard: React.FC<KpiDeltaCardProps> = ({
  title,
  current,
  tooltipContent,
  secondaryLabel,
}) => {
  const isUp = current > 0
  const isDown = current < 0
  const magnitude = Math.abs(current).toLocaleString()
  // U+2212 minus for negatives; '+' for positives; bare value for zero.
  const display = isUp ? `+${magnitude}` : isDown ? `−${magnitude}` : '0'
  const colorClass = isUp
    ? 'text-green-700'
    : isDown
      ? 'text-red-700'
      : 'text-gray-900'

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4"
      data-testid="kpi-delta-card"
    >
      <div className="flex items-center gap-1">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {tooltipContent && (
          <Tooltip content={tooltipContent}>
            <button
              type="button"
              aria-label="More info"
              className="inline-flex items-center justify-center rounded-full p-1 cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-loyal-blue"
            >
              <InfoIcon />
            </button>
          </Tooltip>
        )}
      </div>

      <p
        data-testid="kpi-delta-value"
        className={`mt-1 flex items-center gap-1 text-3xl font-bold ${colorClass}`}
      >
        {(isUp || isDown) && (
          <span
            data-testid="kpi-delta-arrow"
            aria-hidden="true"
            className="text-xl leading-none"
          >
            {isUp ? '▲' : '▼'}
          </span>
        )}
        <span>{display}</span>
        {(isUp || isDown) && (
          <span className="sr-only">{isUp ? 'increase' : 'decrease'}</span>
        )}
      </p>

      {secondaryLabel && (
        <p className="mt-2 text-xs text-gray-600">{secondaryLabel}</p>
      )}
    </div>
  )
}

export default KpiDeltaCard
