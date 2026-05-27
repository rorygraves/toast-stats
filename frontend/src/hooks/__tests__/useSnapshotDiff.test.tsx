import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useSnapshotDiff, previousRecordedDate } from '../useSnapshotDiff'
import { fetchCdnDistrictSnapshot } from '../../services/cdn'
import type {
  PerDistrictData,
  ClubStatisticsFile,
} from '@toastmasters/shared-contracts'

vi.mock('../../services/cdn', () => ({
  fetchCdnDistrictSnapshot: vi.fn(),
}))

const mockedFetch = vi.mocked(fetchCdnDistrictSnapshot)

function club(id: string, membershipCount: number): ClubStatisticsFile {
  return {
    clubId: id,
    clubName: `Club ${id}`,
    divisionId: 'A',
    areaId: '01',
    membershipCount,
    paymentsCount: membershipCount,
    dcpGoals: 0,
    status: 'Active',
    divisionName: 'Division A',
    areaName: 'Area 01',
    octoberRenewals: 0,
    aprilRenewals: 0,
    newMembers: 0,
    membershipBase: membershipCount,
    clubStatus: 'Active',
  }
}

function wrapper(date: string, members: number): PerDistrictData {
  return {
    districtId: '61',
    districtName: 'District 61',
    collectedAt: `${date}T00:00:00Z`,
    status: 'success',
    data: {
      districtId: '61',
      snapshotDate: date,
      clubs: [club('001', members)],
      divisions: [],
      areas: [],
      totals: {
        totalClubs: 1,
        totalMembership: members,
        totalPayments: members,
        distinguishedClubs: 0,
        selectDistinguishedClubs: 0,
        presidentDistinguishedClubs: 0,
      },
      divisionPerformance: [],
      clubPerformance: [
        { 'Club Number': '001', 'Club Distinguished Status': '' },
      ],
      districtPerformance: [],
    },
  }
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('previousRecordedDate', () => {
  it('returns the second-most-recent as `from` and the latest as `to`', () => {
    expect(
      previousRecordedDate(['2026-05-24', '2026-05-25', '2026-05-26'])
    ).toEqual({ from: '2026-05-25', to: '2026-05-26' })
  })

  it('returns null when fewer than two dates are recorded', () => {
    expect(previousRecordedDate(['2026-05-26'])).toBeNull()
    expect(previousRecordedDate([])).toBeNull()
  })
})

describe('useSnapshotDiff', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches both dated snapshots and returns the computed diff', async () => {
    mockedFetch.mockImplementation(
      (date: string) =>
        Promise.resolve(
          wrapper(date, date === '2026-05-26' ? 26 : 20) as unknown
        ) as Promise<unknown>
    )

    const { result } = renderHook(
      () => useSnapshotDiff('61', '2026-05-25', '2026-05-26'),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totals.membership).toEqual({
      from: 20,
      to: 26,
      delta: 6,
    })
    expect(result.current.data?.from.date).toBe('2026-05-25')
    expect(result.current.data?.to.date).toBe('2026-05-26')
  })

  it('is disabled (does not fetch) when from or to is missing', () => {
    renderHook(() => useSnapshotDiff('61', undefined, '2026-05-26'), {
      wrapper: makeWrapper(),
    })
    expect(mockedFetch).not.toHaveBeenCalled()
  })
})
