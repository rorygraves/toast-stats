import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DistrictDetailHeader } from '../DistrictDetailHeader'
import { getProgramYear } from '../../utils/programYear'

afterEach(() => cleanup())

const py2526 = getProgramYear(2025)

const baseProps = {
  districtId: '61',
  districtName: 'District 61',
  selectedProgramYear: py2526,
  setSelectedProgramYear: vi.fn(),
  availableProgramYears: [py2526],
  selectedDate: undefined,
  onDateChange: vi.fn(),
  availableDates: ['2026-04-26'],
  latestSnapshotDate: '2026-04-26',
}

const renderHeader = (overrides: Partial<typeof baseProps> = {}) =>
  render(
    <MemoryRouter>
      <DistrictDetailHeader {...baseProps} {...overrides} />
    </MemoryRouter>
  )

describe('DistrictDetailHeader DataControlsBar adoption (#531 #528)', () => {
  it('renders the unified DataControlsBar toolbar in the header actions', () => {
    renderHeader()
    expect(
      screen.getByRole('toolbar', { name: /data controls/i })
    ).toBeInTheDocument()
  })

  it('does not render the legacy global-date-selector <select>', () => {
    renderHeader()
    expect(screen.queryByLabelText(/view specific date/i)).toBeNull()
    expect(document.getElementById('global-date-selector')).toBeNull()
  })
})

describe('DistrictDetailHeader action cluster consolidation (#676)', () => {
  it('moves Export + Share behind a single overflow menu, not inline buttons', () => {
    renderHeader()
    // Secondary actions are collapsed — no standalone Export/Share buttons.
    expect(screen.queryByRole('button', { name: /export/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^share$/i })).toBeNull()
    // A single overflow trigger replaces them.
    expect(
      screen.getByRole('button', { name: /more actions/i })
    ).toBeInTheDocument()
  })

  it('reveals Export CSV + Copy link when the overflow menu opens', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByRole('button', { name: /more actions/i }))
    expect(
      screen.getByRole('menuitem', { name: /export csv/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: /copy link/i })
    ).toBeInTheDocument()
  })

  it('keeps the PY and snapshot-date controls inline (no regression)', () => {
    renderHeader()
    expect(
      screen.getByRole('toolbar', { name: /data controls/i })
    ).toBeInTheDocument()
    expect(screen.getByTestId('py-chip')).toBeInTheDocument()
    expect(screen.getByTestId('date-chip')).toBeInTheDocument()
  })
})
