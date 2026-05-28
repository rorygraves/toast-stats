/* PaymentCompositionHeader (#868) — the shared heading + "N payment events"
   eyebrow rendered identically by both the desktop donut and the mobile
   sparkbar. Extracted so the title text and the events/members tooltip can
   never drift between the two surfaces. */

import React from 'react'

interface PaymentCompositionHeaderProps {
  /** id wired to the panel's aria-labelledby (differs per surface). */
  headingId: string
  totalPayments: number
  totalMembership: number
}

const PaymentCompositionHeader: React.FC<PaymentCompositionHeaderProps> = ({
  headingId,
  totalPayments,
  totalMembership,
}) => (
  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
    <h2
      id={headingId}
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
)

export default PaymentCompositionHeader
