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
})
