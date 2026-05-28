/* PaymentCompositionDonut (#360 redesign) — donut chart breaking down
   the district's total membership payments into New / April Renewals /
   October Renewals (plus an 'Other' wedge for late/charter payments not
   broken out in our current schema). Pure SVG — no chart library
   needed for a 4-segment donut. */

import React from 'react'
import {
  buildPaymentSegments,
  type PaymentCompositionInputs,
} from '../utils/paymentComposition'
import PaymentCompositionHeader from './PaymentCompositionHeader'

interface PaymentCompositionDonutProps extends PaymentCompositionInputs {
  /** Number of currently-paid members (the cohort — for the tooltip only). */
  totalMembership: number
}

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const PaymentCompositionDonut: React.FC<PaymentCompositionDonutProps> = ({
  totalMembership,
  ...inputs
}) => {
  // Total PAYMENTS is the sum of payment events across the program year
  // (a single member can show up in multiple buckets). All 5 categories
  // are sourced from the all-districts-rankings.json file. Segment math is
  // shared with the mobile sparkbar via buildPaymentSegments (#868).
  const { totalPayments, segments } = buildPaymentSegments(inputs)
  if (totalPayments <= 0) return null

  // Compute each arc's length and its cumulative start offset along the
  // circle. Done functionally (no post-render reassignment) so the React
  // Compiler immutability rule stays satisfied; n ≤ 5 so the inner sum is
  // cheap.
  const arcs = segments.map((seg, i) => {
    const length = (seg.count / totalPayments) * CIRCUMFERENCE
    const precedingLength = segments
      .slice(0, i)
      .reduce((sum, s) => sum + (s.count / totalPayments) * CIRCUMFERENCE, 0)
    return {
      ...seg,
      length,
      offset: -precedingLength,
    }
  })

  const formatK = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return String(n)
  }

  return (
    <section
      className="redesign-panel"
      aria-labelledby="payment-composition-heading"
      data-testid="payment-composition"
    >
      <PaymentCompositionHeader
        headingId="payment-composition-heading"
        totalPayments={totalPayments}
        totalMembership={totalMembership}
      />

      <div className="flex items-center gap-6 flex-wrap">
        <svg
          width="118"
          height="118"
          viewBox="0 0 120 120"
          aria-label={`Donut chart of payment composition, ${totalPayments} total payment events`}
          role="img"
          className="flex-shrink-0"
        >
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="18"
          />
          {/* Segments */}
          {arcs.map(a => (
            <circle
              key={a.key}
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={a.color}
              strokeWidth="18"
              strokeDasharray={`${a.length} ${CIRCUMFERENCE - a.length}`}
              strokeDashoffset={a.offset}
              transform="rotate(-90 60 60)"
            >
              <title>
                {a.label}: {a.count.toLocaleString()} ({a.percent}%)
              </title>
            </circle>
          ))}
          {/* Center label — payment-events count, NOT membership count.
              The two were swapped (#486 / observed on production). */}
          <text
            x="60"
            y="58"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fill="currentColor"
          >
            {formatK(totalPayments)}
          </text>
          <text
            x="60"
            y="74"
            textAnchor="middle"
            fontSize="10"
            fill="rgba(0,0,0,0.5)"
          >
            payments
          </text>
        </svg>

        <ul className="m-0 p-0 list-none text-sm font-tm-body text-gray-700 flex-1 min-w-[180px]">
          {arcs.map(a => (
            <li
              key={a.key}
              className="flex items-center gap-2 py-1 border-b border-gray-100 last:border-b-0"
            >
              <span
                aria-hidden="true"
                className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: a.color }}
              />
              <span className="flex-1">{a.label}</span>
              <span className="text-gray-500 tabular-nums">
                {a.count.toLocaleString()} · {a.percent}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default PaymentCompositionDonut
