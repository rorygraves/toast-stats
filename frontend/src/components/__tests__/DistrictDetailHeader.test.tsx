import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
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
