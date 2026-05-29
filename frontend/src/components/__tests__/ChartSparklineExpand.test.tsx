import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { ChartSparklineExpand } from '../ChartSparklineExpand'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** Stub matchMedia so useIsMobile(768) resolves to the given viewport. */
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

const renderWrapper = () =>
  render(
    <ChartSparklineExpand
      title="Membership trend"
      sparklineData={[1, 3, 2, 5]}
      headline={<span data-testid="headline">1,234 members</span>}
    >
      <div data-testid="desktop-chart">desktop chart</div>
    </ChartSparklineExpand>
  )

describe('ChartSparklineExpand', () => {
  it('on desktop renders the chart directly with no sparkline trigger', () => {
    stubViewport(false)
    renderWrapper()
    expect(screen.getByTestId('desktop-chart')).toBeTruthy()
    expect(screen.queryByTestId('headline')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(document.querySelector('svg')).toBeNull()
  })

  it('on mobile renders headline + sparkline behind a trigger, chart hidden until tapped', () => {
    stubViewport(true)
    renderWrapper()
    // collapsed state: headline visible, sparkline svg present, chart not yet
    expect(screen.getByTestId('headline')).toBeTruthy()
    expect(document.querySelector('svg')).not.toBeNull()
    expect(screen.queryByTestId('desktop-chart')).toBeNull()
    // a single trigger control to expand
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('on mobile, tapping the trigger opens the full-screen sheet with the chart', () => {
    stubViewport(true)
    renderWrapper()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByTestId('desktop-chart')).toBeTruthy()
  })

  it('does not gate the collapsed view on scroll/IntersectionObserver (Lesson 113)', () => {
    // No IntersectionObserver involvement: the sparkline must be present
    // immediately on mobile mount, not after an intersection callback.
    stubViewport(true)
    renderWrapper()
    expect(document.querySelector('svg')).not.toBeNull()
  })
})
