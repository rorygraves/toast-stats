import { useQuery } from '@tanstack/react-query'
import {
  fetchCdnCompetitiveAwards,
  fetchCdnManifest,
  type CompetitiveAwardStandings,
} from '../services/cdn'

/**
 * React Query hook for fetching competitive award standings (#330).
 *
 * Returns null when the snapshot does not have a competitive-awards.json
 * file (legacy snapshots predating #330).
 *
 * If `date` is undefined, resolves the latest snapshot date via the
 * v1/latest.json manifest first, then fetches awards for that date.
 * (Pre-fix the hook returned null for undefined date — the AwardsPage
 * surfaced this as an empty state.)
 */
export function useCompetitiveAwards(date: string | undefined) {
  return useQuery<CompetitiveAwardStandings | null>({
    queryKey: ['competitive-awards', date ?? 'latest'],
    queryFn: async () => {
      const resolvedDate = date ?? (await fetchCdnManifest()).latestSnapshotDate
      return fetchCdnCompetitiveAwards(resolvedDate)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
