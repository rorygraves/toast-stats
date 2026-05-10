import React from 'react'

interface PaymentCompositionCardProps {
  newPayments?: number | undefined
  aprilPayments?: number | undefined
  octoberPayments?: number | undefined
  latePayments?: number | undefined
  charterPayments?: number | undefined
  totalPayments?: number | undefined
}

interface PaymentCategory {
  label: string
  value: number
  color: string
  bgColor: string
}

/**
 * PaymentCompositionCard (#327)
 *
 * Horizontal stacked bar showing the breakdown of membership payments:
 * - October renewals (blue) — fall renewal retention
 * - April renewals (teal) — spring renewal retention
 * - New payments (green) — new member acquisition
 * - Charter payments (amber) — new club formation
 * - Late payments (red) — engagement concern
 *
 * Helps district directors distinguish acquisition from retention.
 */
export const PaymentCompositionCard: React.FC<PaymentCompositionCardProps> = ({
  newPayments = 0,
  aprilPayments = 0,
  octoberPayments = 0,
  latePayments = 0,
  charterPayments = 0,
  totalPayments,
}) => {
  if (!totalPayments || totalPayments === 0) return null

  const categories: PaymentCategory[] = [
    {
      label: 'October',
      value: octoberPayments,
      color: 'text-blue-700',
      bgColor: 'bg-blue-500',
    },
    {
      label: 'April',
      value: aprilPayments,
      color: 'text-teal-700',
      bgColor: 'bg-teal-500',
    },
    {
      label: 'New',
      value: newPayments,
      color: 'text-green-700',
      bgColor: 'bg-green-500',
    },
    {
      label: 'Charter',
      value: charterPayments,
      color: 'text-amber-700',
      bgColor: 'bg-amber-400',
    },
    {
      label: 'Late',
      value: latePayments,
      color: 'text-red-700',
      bgColor: 'bg-red-400',
    },
  ]

  return (
    <div className="payment-composition redesign-panel">
      <h2 className="text-lg font-bold text-gray-900 font-tm-headline mb-3">
        Payment Composition
      </h2>

      {/* Stacked bar */}
      <div
        className="flex h-6 rounded-full overflow-hidden mb-3"
        role="img"
        aria-label="Payment breakdown bar chart"
      >
        {categories.map(
          cat =>
            cat.value > 0 && (
              <div
                key={cat.label}
                className={`${cat.bgColor} transition-all`}
                style={{
                  width: `${(cat.value / totalPayments) * 100}%`,
                }}
                title={`${cat.label}: ${cat.value.toLocaleString()} (${((cat.value / totalPayments) * 100).toFixed(1)}%)`}
              />
            )
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 text-sm">
        {categories.map(cat => {
          const pct =
            totalPayments > 0
              ? ((cat.value / totalPayments) * 100).toFixed(1)
              : '0.0'
          return (
            <div key={cat.label} className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${cat.bgColor} flex-shrink-0`}
                aria-hidden="true"
              />
              <div className="font-tm-body">
                <span className={`font-medium ${cat.color}`}>{cat.label}</span>
                <span className="text-gray-500 ml-1">
                  {cat.value.toLocaleString()} ({pct}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
