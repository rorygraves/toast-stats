/* PaymentCompositionSparkbar (#868) — mobile replacement for the
   PaymentCompositionDonut. At 375px the donut + legend stack is unreadable
   and eats ~3 viewports for one ratio (mobile UX audit §Epic B). This shows
   the same shares as a single horizontal stacked bar + legend chips —
   composition wants a segmented bar, not a donut (Lesson 63/105). Mirrors
   the sibling DistinguishedCompositionBar; segment math is shared via
   buildPaymentSegments so the two surfaces never drift (Lesson 117). */

import React from 'react'
import {
  buildPaymentSegments,
  type PaymentCompositionInputs,
} from '../utils/paymentComposition'

interface PaymentCompositionSparkbarProps extends PaymentCompositionInputs {
  /** Currently-paid members (the cohort — for the eyebrow tooltip only). */
  totalMembership: number
}

const PaymentCompositionSparkbar: React.FC<PaymentCompositionSparkbarProps> = ({
  totalMembership,
  ...inputs
}) => {
  const { totalPayments, segments } = buildPaymentSegments(inputs)
  if (totalPayments <= 0) return null

  const barLabel = `Payment composition: ${segments
    .map(s => `${s.label} ${s.count} (${s.percent}%)`)
    .join(', ')}, ${totalPayments} total payment events`

  return (
    <section
      className="redesign-panel"
      aria-labelledby="payment-composition-sparkbar-heading"
      data-testid="payment-composition-sparkbar"
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2
          id="payment-composition-sparkbar-heading"
          className="text-lg font-semibold text-gray-900 font-tm-headline"
        >
          Payment Composition
        </h2>
        <span
          className="text-sm text-gray-600 font-tm-body"
          title={`${totalPayments.toLocaleString()} payment events across ${totalMembership.toLocaleString()} current members`}
        >
          {totalPayments.toLocaleString()} payment events
        </span>
      </div>

      <div
        className="flex w-full h-7 rounded-md overflow-hidden border border-gray-200"
        role="img"
        aria-label={barLabel}
        data-testid="payment-sparkbar-track"
      >
        {segments.map(seg => {
          const widthPct = (seg.count / totalPayments) * 100
          return (
            <div
              key={seg.key}
              data-segment={seg.key}
              className="h-full"
              style={{
                width: `${widthPct}%`,
                minWidth: 0,
                backgroundColor: seg.color,
              }}
              title={`${seg.label}: ${seg.count.toLocaleString()} (${seg.percent}%)`}
            />
          )
        })}
      </div>

      <ul
        className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 list-none text-xs font-tm-body text-gray-700"
        data-testid="payment-sparkbar-legend"
      >
        {segments.map(seg => (
          <li key={seg.key} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span>{seg.label}</span>
            <span className="text-gray-500 tabular-nums">
              {seg.count.toLocaleString()} · {seg.percent}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default PaymentCompositionSparkbar
