import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import PaymentCompositionSparkbar from '../PaymentCompositionSparkbar'

/* #868 — at 375px the donut is unreadable; the sparkbar conveys the same
   shares as a single horizontal stacked bar + legend chips. Mirrors the
   DistinguishedCompositionBar pattern (Lesson 63/105 — composition wants a
   segmented bar, not a donut). */

afterEach(() => cleanup())

const baseProps = {
  totalMembership: 1200,
  newPayments: 580,
  aprilPayments: 720,
  octoberPayments: 1110,
  latePayments: 18,
  charterPayments: 380,
}

describe('PaymentCompositionSparkbar', () => {
  it('renders the panel heading and total payment-events eyebrow', () => {
    render(<PaymentCompositionSparkbar {...baseProps} />)
    expect(screen.getByText('Payment Composition')).toBeInTheDocument()
    // 2808 total payment events, not the 1200 membership count.
    expect(screen.getByText(/2,808 payment events/)).toBeInTheDocument()
  })

  it('renders a stacked bar with one segment per non-zero bucket', () => {
    render(<PaymentCompositionSparkbar {...baseProps} />)
    const bar = screen.getByTestId('payment-sparkbar-track')
    // 5 non-zero buckets → 5 segments.
    expect(bar.children).toHaveLength(5)
  })

  it('sizes each segment by its share of the total', () => {
    render(<PaymentCompositionSparkbar {...baseProps} />)
    const bar = screen.getByTestId('payment-sparkbar-track')
    const october = bar.querySelector('[data-segment="october"]') as HTMLElement
    // 1110 / 2808 = 39.53%
    expect(october.style.width).toBe('39.52991452991453%')
  })

  it('gives the bar an accessible role and summary label', () => {
    render(<PaymentCompositionSparkbar {...baseProps} />)
    const bar = screen.getByRole('img', { name: /payment composition/i })
    expect(bar).toHaveAttribute(
      'aria-label',
      expect.stringContaining('New member payments')
    )
    expect(bar.getAttribute('aria-label')).toContain('October renewals')
  })

  it('renders a legend chip per segment with label, count and percent', () => {
    render(<PaymentCompositionSparkbar {...baseProps} />)
    const legend = screen.getByTestId('payment-sparkbar-legend')
    const newChip = within(legend).getByText(/New member payments/)
    expect(newChip).toBeInTheDocument()
    // count · percent on the chip (580, 21%).
    expect(within(legend).getByText(/580/)).toBeInTheDocument()
    expect(within(legend).getByText(/21%/)).toBeInTheDocument()
  })

  it('renders nothing when there are zero payment events', () => {
    const { container } = render(
      <PaymentCompositionSparkbar
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
})
