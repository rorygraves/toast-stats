import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import PaymentComposition from '../PaymentComposition'

/* #868 — DistrictOverview swaps the payment donut for an inline sparkbar
   below the mobile breakpoint (768px, matching the #867 fold). The donut is
   unreadable at 375px; the sparkbar shows the same shares. Desktop keeps the
   donut unchanged. matchMedia is stubbed the same way the #867 fold test does
   it, so no page-mount/hook mocking is needed. */

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const stubViewport = (mobile: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: mobile,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )
}

const baseProps = {
  totalMembership: 1200,
  newPayments: 580,
  aprilPayments: 720,
  octoberPayments: 1110,
  latePayments: 18,
  charterPayments: 380,
}

describe('PaymentComposition responsive swap', () => {
  it('renders the donut at desktop widths', () => {
    stubViewport(false)
    render(<PaymentComposition {...baseProps} />)
    expect(screen.getByTestId('payment-composition')).toBeInTheDocument()
    expect(
      screen.queryByTestId('payment-sparkbar-track')
    ).not.toBeInTheDocument()
  })

  it('renders the sparkbar (not the donut) at mobile widths', () => {
    stubViewport(true)
    render(<PaymentComposition {...baseProps} />)
    expect(screen.getByTestId('payment-sparkbar-track')).toBeInTheDocument()
    expect(screen.queryByTestId('payment-composition')).not.toBeInTheDocument()
  })
})
