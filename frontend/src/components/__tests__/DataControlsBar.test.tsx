import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { DataControlsBar } from '../DataControlsBar'
import { getProgramYear } from '../../utils/programYear'

afterEach(() => cleanup())

const py2425 = getProgramYear(2024)
const py2526 = getProgramYear(2025)
const py2627 = getProgramYear(2026)
const availableProgramYears = [py2627, py2526, py2425]

const baseProps = {
  latestSnapshotDate: '2026-04-26',
  availableProgramYears,
  selectedProgramYear: py2526,
  onProgramYearChange: vi.fn(),
  availableDates: ['2026-04-26', '2026-03-15', '2026-02-01'],
  selectedDate: undefined,
  onDateChange: vi.fn(),
}

describe('DataControlsBar (#529 #528)', () => {
  it('renders the freshness pill with a green dot and the latest snapshot date', () => {
    render(<DataControlsBar {...baseProps} />)
    const pill = screen.getByTestId('freshness-pill')
    expect(pill).toHaveTextContent(/Data fresh/i)
    expect(pill).toHaveTextContent(/Apr 26, 2026/)
    // The dot is decorative — find via test id.
    expect(pill.querySelector('[data-testid="freshness-dot"]')).not.toBeNull()
  })

  it('renders the PY chip showing the selected program year as "PY YYYY–YY"', () => {
    render(<DataControlsBar {...baseProps} />)
    const py = screen.getByTestId('py-chip')
    expect(py).toHaveTextContent(/PY 2025–26/)
  })

  it('fires onProgramYearChange when a different PY is selected', () => {
    const onProgramYearChange = vi.fn()
    render(
      <DataControlsBar
        {...baseProps}
        onProgramYearChange={onProgramYearChange}
      />
    )
    const select = screen.getByTestId('py-chip-select')
    fireEvent.change(select, { target: { value: '2024' } })
    expect(onProgramYearChange).toHaveBeenCalledWith(py2425)
  })

  it('renders the date chip showing "Latest in PY" when selectedDate is undefined', () => {
    render(<DataControlsBar {...baseProps} />)
    const date = screen.getByTestId('date-chip')
    expect(date).toHaveTextContent(/Latest in PY/i)
  })

  it('renders the date chip showing the formatted date when selectedDate is set', () => {
    render(<DataControlsBar {...baseProps} selectedDate="2026-03-15" />)
    expect(screen.getByTestId('date-chip')).toHaveTextContent(/Mar 15, 2026/)
  })

  it('fires onDateChange with undefined when "Latest in PY" is selected', () => {
    const onDateChange = vi.fn()
    render(
      <DataControlsBar
        {...baseProps}
        selectedDate="2026-03-15"
        onDateChange={onDateChange}
      />
    )
    const select = screen.getByTestId('date-chip-select')
    fireEvent.change(select, { target: { value: '' } })
    expect(onDateChange).toHaveBeenCalledWith(undefined)
  })

  it('fires onDateChange with the selected ISO date when a specific date is chosen', () => {
    const onDateChange = vi.fn()
    render(<DataControlsBar {...baseProps} onDateChange={onDateChange} />)
    const select = screen.getByTestId('date-chip-select')
    fireEvent.change(select, { target: { value: '2026-02-01' } })
    expect(onDateChange).toHaveBeenCalledWith('2026-02-01')
  })

  it('hides the freshness pill when latestSnapshotDate is undefined', () => {
    render(<DataControlsBar {...baseProps} latestSnapshotDate={undefined} />)
    expect(screen.queryByTestId('freshness-pill')).toBeNull()
  })

  it('groups all three chips inside one container with role=toolbar', () => {
    render(<DataControlsBar {...baseProps} />)
    const bar = screen.getByRole('toolbar', { name: /data controls/i })
    expect(bar).toContainElement(screen.getByTestId('freshness-pill'))
    expect(bar).toContainElement(screen.getByTestId('py-chip'))
    expect(bar).toContainElement(screen.getByTestId('date-chip'))
  })

  // #886 (epic #888 Sprint 2) — Family A touch-target floor. The <select> IS
  // the tap target (a full-bleed inset-0 opacity-0 overlay). inset-0 sizes it
  // to the label's PADDING box (44px − 2px border = 42px), so the floor must
  // live on the select itself: min-h-[44px] + appearance-none (the latter opts
  // out of native sizing so WebKit honours min-height — L111). The visible
  // label also carries min-h-[44px] so the chip matches the tap area. jsdom
  // can't measure geometry (L66) — this asserts the class contract; live
  // per-engine geometry is proven by the dual-engine preview smoke.
  it('declares the 44px touch-target floor on the PY and date chip selects', () => {
    render(<DataControlsBar {...baseProps} />)
    expect(screen.getByTestId('py-chip').className).toContain('min-h-[44px]')
    expect(screen.getByTestId('date-chip').className).toContain('min-h-[44px]')
    for (const id of ['py-chip-select', 'date-chip-select']) {
      const cls = screen.getByTestId(id).className
      expect(cls, `${id} floor`).toContain('min-h-[44px]')
      expect(cls, `${id} appearance-none`).toContain('appearance-none')
    }
  })
})
