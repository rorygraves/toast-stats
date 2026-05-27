import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import DistrictChangesPage from '../DistrictChangesPage'
import { useDistrictCachedDates } from '../../hooks/useDistrictData'
import { useSnapshotDiff } from '../../hooks/useSnapshotDiff'
import { useDistricts } from '../../hooks/useDistricts'
import type { SnapshotDiff } from '@toastmasters/shared-contracts'

vi.mock('../../hooks/useDistrictData')
vi.mock('../../hooks/useDistricts')
vi.mock('../../hooks/useSnapshotDiff', async () => {
  const actual = await vi.importActual<
    typeof import('../../hooks/useSnapshotDiff')
  >('../../hooks/useSnapshotDiff')
  return { ...actual, useSnapshotDiff: vi.fn() }
})

const mockedDates = vi.mocked(useDistrictCachedDates)
const mockedDiff = vi.mocked(useSnapshotDiff)
const mockedDistricts = vi.mocked(useDistricts)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/district/61/changes']}>
      <Routes>
        <Route
          path="/district/:districtId/changes"
          element={<DistrictChangesPage />}
        />
      </Routes>
    </MemoryRouter>
  )
}

const ag = (from: number, to: number) => ({ from, to, delta: to - from })

function diffFixture(over: Partial<SnapshotDiff> = {}): SnapshotDiff {
  return {
    districtId: '61',
    from: { date: '2026-05-25' },
    to: { date: '2026-05-26' },
    dayCount: 1,
    totals: {
      membership: ag(2716, 2742),
      payments: ag(5723, 5749),
      clubCount: ag(161, 162),
      distinguished: ag(49, 50),
    },
    clubs: { bothPresent: [], onlyInFrom: [], onlyInTo: [] },
    events: [
      {
        category: 'club-added',
        clubId: '28680300',
        clubName: 'iA Montreal Toastmasters',
        label: 'iA Montreal Toastmasters (Active) joined the roster',
        magnitude: 1,
      },
      {
        category: 'distinguished',
        clubId: '00002959',
        clubName: 'Club 00002959',
        label: 'Club 00002959 became Distinguished',
        magnitude: 1,
      },
    ],
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedDistricts.mockReturnValue({
    data: { districts: [{ id: '61', name: '61' }] },
  } as unknown as ReturnType<typeof useDistricts>)
})

describe('DistrictChangesPage', () => {
  it('renders headline, four KPI cards, and grouped events for a real diff', () => {
    mockedDates.mockReturnValue({
      data: { dates: ['2026-05-25', '2026-05-26'] },
      isLoading: false,
    } as unknown as ReturnType<typeof useDistrictCachedDates>)
    mockedDiff.mockReturnValue({
      data: diffFixture(),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSnapshotDiff>)

    renderPage()
    expect(screen.getByTestId('changes-headline')).toHaveTextContent(
      /from May 25, 2026 to May 26, 2026/
    )
    expect(screen.getAllByTestId('kpi-delta-card')).toHaveLength(4)
    expect(screen.getByTestId('changes-list')).toBeInTheDocument()
    expect(screen.getByText(/Clubs that joined/)).toBeInTheDocument()
    expect(
      screen.getByText('iA Montreal Toastmasters (Active) joined the roster')
    ).toBeInTheDocument()
  })

  it('shows a "no recorded changes" message when the diff has no events', () => {
    mockedDates.mockReturnValue({
      data: { dates: ['2026-05-25', '2026-05-26'] },
      isLoading: false,
    } as unknown as ReturnType<typeof useDistrictCachedDates>)
    mockedDiff.mockReturnValue({
      data: diffFixture({ events: [] }),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSnapshotDiff>)

    renderPage()
    expect(screen.getByTestId('changes-none')).toBeInTheDocument()
    expect(screen.queryByTestId('changes-list')).not.toBeInTheDocument()
  })

  it('explains the disabled state when only one snapshot exists', () => {
    mockedDates.mockReturnValue({
      data: { dates: ['2026-05-26'] },
      isLoading: false,
    } as unknown as ReturnType<typeof useDistrictCachedDates>)
    mockedDiff.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSnapshotDiff>)

    renderPage()
    expect(screen.getByTestId('changes-single')).toBeInTheDocument()
    expect(screen.queryByTestId('changes-headline')).not.toBeInTheDocument()
  })
})
