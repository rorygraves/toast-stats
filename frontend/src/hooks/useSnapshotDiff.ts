import { useQuery } from '@tanstack/react-query'
import { fetchCdnDistrictSnapshot } from '../services/cdn'
import { diffSnapshots } from '@toastmasters/analytics-core'
import type {
  PerDistrictData,
  SnapshotDiff,
} from '@toastmasters/shared-contracts'

/**
 * Resolve the default "since the previous recorded date" pair from a district's
 * recorded snapshot dates. `to` is the latest date, `from` is the one before it
 * (index `[-2]`). Returns null when fewer than two dates exist (the page shows a
 * disabled / explanatory state).
 *
 * Dates are assumed already sorted ascending — the per-district snapshot index
 * is stored that way. The page owns this pair and passes it to useSnapshotDiff
 * as props (R3 — never re-derive from response data).
 *
 * @see docs/design/what-changed-feature.md §5
 */
export function previousRecordedDate(
  dates: string[]
): { from: string; to: string } | null {
  if (dates.length < 2) return null
  return {
    from: dates[dates.length - 2]!,
    to: dates[dates.length - 1]!,
  }
}

/**
 * Fetch two dated district snapshots and compute the diff between them.
 *
 * Keyed by the (districtId, from, to) triple so each pair caches independently.
 * The dated file is the `PerDistrictData` wrapper — the diff engine consumes its
 * `.data` (`DistrictStatisticsFile`). Disabled until all three are present.
 */
export function useSnapshotDiff(
  districtId: string | undefined,
  from: string | undefined,
  to: string | undefined
) {
  return useQuery<SnapshotDiff, Error>({
    queryKey: ['snapshot-diff', districtId, from, to],
    queryFn: async () => {
      const [fromSnap, toSnap] = await Promise.all([
        fetchCdnDistrictSnapshot<PerDistrictData>(from!, districtId!),
        fetchCdnDistrictSnapshot<PerDistrictData>(to!, districtId!),
      ])
      return diffSnapshots(fromSnap.data, toSnap.data)
    },
    enabled: !!districtId && !!from && !!to,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}
