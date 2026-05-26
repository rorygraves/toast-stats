import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { ChartSkeleton } from '../ChartSkeleton'

// jsdom can't compute stylesheet colours and vitest stubs CSS imports to empty,
// so we read the CSS source from disk. cwd is the frontend workspace when the
// pre-push hook runs it, or the repo root under `npm run test` — resolve both.
function readChartSkeletonCss(): string {
  const rel = 'src/components/ChartSkeleton.css'
  const candidate = [
    resolve(process.cwd(), rel),
    resolve(process.cwd(), 'frontend', rel),
  ].find(existsSync)
  if (!candidate)
    throw new Error('ChartSkeleton.css not found from cwd ' + process.cwd())
  return readFileSync(candidate, 'utf8')
}

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
    const css = readChartSkeletonCss()
    expect(css).toMatch(/\[data-theme=['"]dark['"]\]\s+\.chart-skeleton/)
    // The surface must use the remapping token, not the old hardcoded white.
    expect(css).toMatch(/background:\s*var\(--surface-secondary/)
  })
})
