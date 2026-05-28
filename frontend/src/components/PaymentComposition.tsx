/* PaymentComposition (#868) — responsive chooser for the district payment
   breakdown. Below the mobile breakpoint (768px, matching the #867 fold) the
   donut is unreadable, so it is replaced by an inline sparkbar conveying the
   same shares. Desktop keeps the donut unchanged. The swap is width-driven
   (useIsMobile → matchMedia), not viewport-scroll-gated, so it stays visible
   in non-scroll capture contexts (Lesson 113). */

import React from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import PaymentCompositionDonut from './PaymentCompositionDonut'
import PaymentCompositionSparkbar from './PaymentCompositionSparkbar'
import type { PaymentCompositionInputs } from '../utils/paymentComposition'

interface PaymentCompositionProps extends PaymentCompositionInputs {
  totalMembership: number
}

const PaymentComposition: React.FC<PaymentCompositionProps> = props => {
  const isMobile = useIsMobile(768)
  return isMobile ? (
    <PaymentCompositionSparkbar {...props} />
  ) : (
    <PaymentCompositionDonut {...props} />
  )
}

export default PaymentComposition
