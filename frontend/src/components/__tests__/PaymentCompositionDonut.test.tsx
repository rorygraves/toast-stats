import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import PaymentCompositionDonut from '../PaymentCompositionDonut'

afterEach(() => cleanup())

const baseProps = {
  totalMembership: 1200,
  newPayments: 580,
  aprilPayments: 720,
  octoberPayments: 1110,
  latePayments: 18,
  charterPayments: 380,
}

describe('PaymentCompositionDonut', () => {
  // #486 regression: the donut center displayed totalMembership but
  // labelled it "payments". Center must show the sum of payment-event
  // counts so it matches the eyebrow "N payment events" line.
  it('shows the payment-events count in the donut center, not membership', () => {
    render(<PaymentCompositionDonut {...baseProps} />)
    const total =
      baseProps.newPayments +
      baseProps.aprilPayments +
      baseProps.octoberPayments +
      baseProps.latePayments +
      baseProps.charterPayments
    // 580+720+1110+18+380 = 2808 → formatK = '2.8K'
    expect(total).toBe(2808)
    expect(screen.getByText('2.8K')).toBeInTheDocument()
    // The membership value must NOT appear in the donut center (1.2K).
    // Sanity check: ensure no rogue text node matches '1.2K' anywhere
    // in the rendered chart.
    expect(screen.queryByText('1.2K')).not.toBeInTheDocument()
  })

  it('renders nothing when there are zero payment events', () => {
    const { container } = render(
      <PaymentCompositionDonut
        totalMembership={1000}
        newPayments={0}
        aprilPayments={0}
        octoberPayments={0}
        latePayments={0}
        charterPayments={0}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the "N payment events" header with the sum, not membership', () => {
    render(<PaymentCompositionDonut {...baseProps} />)
    expect(screen.getByText(/2,808 payment events/)).toBeInTheDocument()
  })
})
