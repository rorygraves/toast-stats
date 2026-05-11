/* useDistrictRanking — fetch the single district's row out of the shared
   rankings.json cache. Returns null while loading or if not found.
   Used to surface district-level fields that aren't carried in the
   per-club analytics (e.g. payment breakdowns: new / april / october /
   late / charter). */

import { useQuery } from '@tanstack/react-query'
import { fetchCdnRankings } from '../services/cdn'
import type { DistrictRanking } from '../types/districts'

export function useDistrictRanking(districtId: string | undefined): {
  ranking: DistrictRanking | null
  isLoading: boolean
} {
  const { data, isLoading } = useQuery({
    queryKey: ['district-rankings', 'latest'],
    queryFn: async () => {
      const cdnData = await fetchCdnRankings()
      return { rankings: cdnData.rankings, date: cdnData.date }
    },
    staleTime: 15 * 60 * 1000,
  })

  const ranking =
    data?.rankings && districtId
      ? (data.rankings.find(r => r.districtId === districtId) ?? null)
      : null

  return { ranking, isLoading }
}
