import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

import { Sparkline } from '../Sparkline'

afterEach(cleanup)

describe('Sparkline', () => {
  it('renders an accessible svg with a polyline of N points', () => {
    const { container } = render(
      <Sparkline data={[1, 5, 2, 8, 3]} ariaLabel="Membership sparkline" />
    )
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-label')).toBe('Membership sparkline')

    const poly = container.querySelector('polyline')
    expect(poly).not.toBeNull()
    // 5 data points → 5 "x,y" coordinate pairs
    const points = poly?.getAttribute('points')?.trim().split(/\s+/) ?? []
    expect(points).toHaveLength(5)
  })

  it('does not produce NaN coordinates when all values are equal (range 0)', () => {
    const { container } = render(<Sparkline data={[4, 4, 4]} />)
    const points = container.querySelector('polyline')?.getAttribute('points')
    expect(points).toBeTruthy()
    expect(points).not.toMatch(/NaN/)
  })

  it('renders nothing meaningful for empty data (no polyline)', () => {
    const { container } = render(<Sparkline data={[]} />)
    expect(container.querySelector('polyline')).toBeNull()
  })
})
