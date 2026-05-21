/**
 * usePerformanceTargets Hook
 *
 * Fetches per-district performance targets and rankings from CDN.
 * CDN path: snapshots/{date}/analytics/district_{id}_performance-targets.json
 *
 * This data powers the KpiBulletCard rankings (world rank, percentile,
 * region rank) and bullet-bar tier ticks (distinguished/select/presidents/smedley).
 *
 * Fixes #183 — world rank/percentile show "— —" and targets show "N/A"
 */

import { useQuery } from '@tanstack/react-query'
import {
  fetchCdnManifest,
  cdnAnalyticsUrl,
  fetchFromCdn,
} from '../services/cdn'
import type {
  DistrictPerformanceTargets,
  MetricPerformanceData,
  MetricRankings,
  RecognitionTargets,
  RecognitionLevel,
} from './useDistrictAnalytics'

/**
 * CDN performance-targets.json shape
 */
interface CdnPerformanceTargetsData {
  districtId: string
  computedAt: string
  membershipTarget: number
  distinguishedTarget: number
  clubGrowthTarget: number
  paidClubsCount: number
  currentProgress: {
    membership: number
    distinguished: number
    clubGrowth: number
  }
  projectedAchievement: {
    membership: boolean
    distinguished: boolean
    clubGrowth: boolean
  }
  paidClubsRankings: CdnRankings
  membershipPaymentsRankings: CdnRankings
  distinguishedClubsRankings: CdnRankings
  paidClubBase?: number
  paymentBase?: number
  paidClubsBase?: number
  membershipPaymentsBase?: number
  distinguishedClubsBase?: number
  paidClubsTargets?: CdnTargets
  membershipPaymentsTargets?: CdnTargets
  distinguishedClubsTargets?: CdnTargets
  paidClubsAchievedLevel?: string
  membershipPaymentsAchievedLevel?: string
  distinguishedClubsAchievedLevel?: string
}

interface CdnRankings {
  worldRank: number
  worldPercentile: number
  regionRank: number
  totalDistricts: number
  totalInRegion: number
  region: string
}

interface CdnTargets {
  distinguished: number
  select: number
  presidents: number
  smedley: number
}

function toMetricRankings(cdn: CdnRankings): MetricRankings {
  return {
    worldRank: cdn.worldRank,
    worldPercentile: cdn.worldPercentile,
    regionRank: cdn.regionRank,
    totalDistricts: cdn.totalDistricts,
    totalInRegion: cdn.totalInRegion,
    region: cdn.region,
  }
}

function toRecognitionLevel(level?: string): RecognitionLevel | null {
  if (!level) return null
  const valid: RecognitionLevel[] = [
    'distinguished',
    'select',
    'presidents',
    'smedley',
  ]
  return valid.includes(level as RecognitionLevel)
    ? (level as RecognitionLevel)
    : null
}

function toRecognitionTargets(cdn?: CdnTargets): RecognitionTargets | null {
  if (!cdn) return null
  return {
    distinguished: cdn.distinguished,
    select: cdn.select,
    presidents: cdn.presidents,
    smedley: cdn.smedley,
  }
}

function convertToPerformanceTargets(
  cdn: CdnPerformanceTargetsData
): DistrictPerformanceTargets {
  const buildMetric = (
    current: number,
    base: number | undefined,
    targets: CdnTargets | undefined,
    achievedLevel: string | undefined,
    rankings: CdnRankings
  ): MetricPerformanceData => ({
    current,
    base: base ?? null,
    targets: toRecognitionTargets(targets),
    achievedLevel: toRecognitionLevel(achievedLevel),
    rankings: toMetricRankings(rankings),
  })

  return {
    paidClubs: buildMetric(
      cdn.paidClubsCount,
      cdn.paidClubBase ?? cdn.paidClubsBase,
      cdn.paidClubsTargets,
      cdn.paidClubsAchievedLevel,
      cdn.paidClubsRankings
    ),
    membershipPayments: buildMetric(
      cdn.currentProgress.membership,
      cdn.paymentBase ?? cdn.membershipPaymentsBase,
      cdn.membershipPaymentsTargets,
      cdn.membershipPaymentsAchievedLevel,
      cdn.membershipPaymentsRankings
    ),
    distinguishedClubs: buildMetric(
      cdn.currentProgress.distinguished,
      cdn.distinguishedClubsBase,
      cdn.distinguishedClubsTargets,
      cdn.distinguishedClubsAchievedLevel,
      cdn.distinguishedClubsRankings
    ),
  }
}

/**
 * Hook to fetch performance targets and rankings for a district.
 *
 * @param districtId - The district ID
 * @param snapshotDate - The selected snapshot date (falls back to manifest latest)
 */
export function usePerformanceTargets(
  districtId: string | null,
  snapshotDate?: string
) {
  return useQuery<DistrictPerformanceTargets, Error>({
    queryKey: ['performanceTargets', districtId, snapshotDate],
    queryFn: async () => {
      if (!districtId) {
        throw new Error('District ID is required')
      }

      const date = snapshotDate || (await fetchCdnManifest()).latestSnapshotDate
      const url = cdnAnalyticsUrl(date, districtId, 'performance-targets')
      const file = await fetchFromCdn<{
        data: CdnPerformanceTargetsData
      }>(url)
      return convertToPerformanceTargets(file.data)
    },
    enabled: !!districtId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error: unknown) => {
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      return failureCount < 2
    },
  })
}
