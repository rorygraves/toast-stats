import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatePairPicker } from '../DatePairPicker'

/* #794 (epic #797 Sprint 2) — the from/to picker for the "What Changed" page.
   Offers only the district's recorded dates and reports selections up via
   callbacks; the page owns the state (R3). */

const DATES = ['2026-05-20', '2026-05-22', '2026-05-25', '2026-05-26']

describe('DatePairPicker', () => {
  it('renders a from and a to control reflecting the selected pair', () => {
    render(
      <DatePairPicker
        dates={DATES}
        from="2026-05-22"
        to="2026-05-26"
        onFromChange={vi.fn()}
        onToChange={vi.fn()}
      />
    )
    expect(screen.getByTestId('changes-from-chip')).toBeInTheDocument()
    expect(screen.getByTestId('changes-to-chip')).toBeInTheDocument()
    expect(screen.getByTestId('changes-from-chip-select')).toHaveValue(
      '2026-05-22'
    )
    expect(screen.getByTestId('changes-to-chip-select')).toHaveValue(
      '2026-05-26'
    )
  })

  it('offers exactly the district index dates as from options', () => {
    render(
      <DatePairPicker
        dates={DATES}
        from="2026-05-22"
        to="2026-05-26"
        onFromChange={vi.fn()}
        onToChange={vi.fn()}
      />
    )
    const opts = Array.from(
      screen.getByTestId('changes-from-chip-select').querySelectorAll('option')
    ).map(o => (o as HTMLOptionElement).value)
    expect(opts.sort()).toEqual([...DATES].sort())
  })

  it('reports a new from selection to onFromChange', async () => {
    const user = userEvent.setup()
    const onFromChange = vi.fn()
    render(
      <DatePairPicker
        dates={DATES}
        from="2026-05-22"
        to="2026-05-26"
        onFromChange={onFromChange}
        onToChange={vi.fn()}
      />
    )
    await user.selectOptions(
      screen.getByTestId('changes-from-chip-select'),
      '2026-05-20'
    )
    expect(onFromChange).toHaveBeenCalledWith('2026-05-20')
  })

  // #886 (epic #888 Sprint 2) — Family A touch-target floor. Same chip shape as
  // DataControlsBar: a visible <label> with an inset-0 opacity-0 <select>
  // overlay. Audit #885 measured these at 34px tall. min-h-[44px] on the label
  // lifts the overlay to the 44px floor in both engines (L111 family). jsdom
  // can't measure geometry (L66); the live proof is the dual-engine smoke.
  it('declares the 44px touch-target floor on the from/to chips', () => {
    render(
      <DatePairPicker
        dates={DATES}
        from="2026-05-22"
        to="2026-05-26"
        onFromChange={vi.fn()}
        onToChange={vi.fn()}
      />
    )
    expect(screen.getByTestId('changes-from-chip').className).toContain(
      'min-h-[44px]'
    )
    expect(screen.getByTestId('changes-to-chip').className).toContain(
      'min-h-[44px]'
    )
  })
})
