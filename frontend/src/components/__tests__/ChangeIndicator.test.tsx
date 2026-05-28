import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { ChangeIndicator } from '../ChangeIndicator'

/* #795 (epic #797 Sprint 3) — inline signed-delta indicator for the per-club
   delta table. Same a11y contract as KpiDeltaCard (lesson 102: render the
   signed actual; WCAG 1.4.1: direction by arrow + sr word, never colour
   alone), shaped for a compact table cell. Zero renders a neutral em-dash. */

afterEach(() => cleanup())

describe('ChangeIndicator (#795)', () => {
  it('formats a positive delta with a leading + and green colour', () => {
    render(<ChangeIndicator value={26} />)
    const el = screen.getByTestId('change-indicator')
    expect(el).toHaveTextContent('+26')
    expect(el.className).toContain('text-green-700')
  })

  it('formats a negative delta with a typographic minus and red colour', () => {
    render(<ChangeIndicator value={-8} />)
    const el = screen.getByTestId('change-indicator')
    // U+2212 minus, not a hyphen.
    expect(el).toHaveTextContent('−8')
    expect(el.className).toContain('text-red-700')
  })

  it('renders zero as a neutral em-dash with no sign, arrow, or colour', () => {
    render(<ChangeIndicator value={0} />)
    const el = screen.getByTestId('change-indicator')
    expect(el).toHaveTextContent('—')
    expect(el.textContent).not.toContain('+')
    expect(el.className).not.toContain('text-green-700')
    expect(el.className).not.toContain('text-red-700')
    expect(
      screen.queryByTestId('change-indicator-arrow')
    ).not.toBeInTheDocument()
  })

  it('conveys direction without colour alone (arrow + sr-only word)', () => {
    render(<ChangeIndicator value={5} />)
    expect(screen.getByTestId('change-indicator-arrow')).toBeInTheDocument()
    expect(screen.getByText(/increase/i)).toBeInTheDocument()
  })

  it('says "decrease" for a negative delta', () => {
    render(<ChangeIndicator value={-5} />)
    expect(screen.getByText(/decrease/i)).toBeInTheDocument()
  })

  it('formats thousands with locale separators', () => {
    render(<ChangeIndicator value={1234} />)
    expect(screen.getByTestId('change-indicator')).toHaveTextContent('+1,234')
  })

  it('applies an optional className override (lesson 077)', () => {
    render(<ChangeIndicator value={3} className="custom-cls" />)
    expect(screen.getByTestId('change-indicator').className).toContain(
      'custom-cls'
    )
  })

  it('formats the value via an optional formatter', () => {
    render(<ChangeIndicator value={2} format={n => `${n} goals`} />)
    expect(screen.getByTestId('change-indicator')).toHaveTextContent('+2 goals')
  })
})
