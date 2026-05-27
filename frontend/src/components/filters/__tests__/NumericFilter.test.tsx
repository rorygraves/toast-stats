/**
 * NumericFilter — render-phase prop-sync must compare the range ELEMENT-WISE,
 * not by array reference (#816 review).
 *
 * The FiltersPanel reuses NumericFilter and rebuilds its `[min, max]` tuple on
 * every render. A reference compare would treat each unrelated panel re-render
 * (e.g. toggling a different field) as an "external change" and reset the
 * user's in-progress min/max — wiping an invalid, uncommitted edit. Element-wise
 * comparison fixes that while still syncing genuine external changes.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { NumericFilter } from '../NumericFilter'

afterEach(cleanup)

const min = () =>
  screen.getByLabelText(/minimum members value/i) as HTMLInputElement
const max = () =>
  screen.getByLabelText(/maximum members value/i) as HTMLInputElement

describe('NumericFilter render-phase sync', () => {
  it('does NOT clobber an uncommitted edit when re-rendered with an equal-valued new array', () => {
    const { rerender } = render(
      <NumericFilter
        value={[null, 5]}
        onChange={vi.fn()}
        onClear={vi.fn()}
        label="Members"
      />
    )

    // Enter an invalid min (9 > max 5): NumericFilter shows an error and does
    // NOT commit, so the parent's `value` stays [null, 5].
    fireEvent.change(min(), { target: { value: '9' } })
    expect(min().value).toBe('9')

    // Unrelated re-render: parent hands a brand-new array with the SAME values.
    rerender(
      <NumericFilter
        value={[null, 5]}
        onChange={vi.fn()}
        onClear={vi.fn()}
        label="Members"
      />
    )

    // The uncommitted "9" survives (a reference compare would have wiped it).
    expect(min().value).toBe('9')
  })

  it('still syncs when the committed value genuinely changes (e.g. a preset chip)', () => {
    const { rerender } = render(
      <NumericFilter
        value={[null, null]}
        onChange={vi.fn()}
        onClear={vi.fn()}
        label="Members"
      />
    )
    expect(min().value).toBe('')

    rerender(
      <NumericFilter
        value={[1, 4]}
        onChange={vi.fn()}
        onClear={vi.fn()}
        label="Members"
      />
    )

    expect(min().value).toBe('1')
    expect(max().value).toBe('4')
  })
})
