import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChartSkeleton } from '../ChartSkeleton'
// Vite `?raw` import gives the CSS source as a string (jsdom can't compute
// stylesheet colours, so we assert against the source — see #675 test below).
import chartSkeletonCss from '../ChartSkeleton.css?raw'

describe('ChartSkeleton (#223)', () => {
  it('should render with loading status role', () => {
    render(<ChartSkeleton />)
    expect(screen.getByRole('status')).toBeDefined()
  })

  it('should display loading text', () => {
    render(<ChartSkeleton />)
    expect(screen.getByText('Loading chart…')).toBeDefined()
  })

  it('should accept custom height', () => {
    render(<ChartSkeleton height={500} />)
    const el = screen.getByRole('status')
    expect(el.style.height).toBe('500px')
  })

  it('should render placeholder bars', () => {
    const { container } = render(<ChartSkeleton />)
    const bars = container.querySelectorAll('.chart-skeleton__bar')
    expect(bars.length).toBe(7)
  })

  // #675 — the skeleton was a hardcoded light surface (`#f9fafb`) with no
  // dark-mode override, so it rendered as a bright white block on the dark
  // district page (R10 violation). jsdom can't compute stylesheet colours, so
  // we sentinel the CSS source: a `[data-theme='dark']` rule for the skeleton
  // must exist (the rendered result is verified live in dark mode, both
  // engines). See lesson 092 (fixed-bg needs theme-aware colours) and 082
  // (sentinel a known-bad source state, don't assert config severity).
  it('defines a dark-mode override for the skeleton surface (#675)', () => {
    expect(chartSkeletonCss).toMatch(
      /\[data-theme=['"]dark['"]\]\s+\.chart-skeleton/
    )
  })
})
