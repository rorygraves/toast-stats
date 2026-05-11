/* RegionPage (#423) — landing page for a single Toastmasters region.
   Lists every district in that region with a small KPI strip + ranking
   table. Reuses the same rankings data as DistrictsPage (shared
   React-Query cache). */

import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCdnRankings } from '../services/cdn'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/ErrorDisplay'
import type { DistrictRanking } from '../types/districts'

const RegionPage: React.FC = () => {
  const { n } = useParams<{ n: string }>()
  const navigate = useNavigate()
  const region = (n ?? '').trim()

  const { data, isLoading, error } = useQuery({
    queryKey: ['district-rankings', 'latest'],
    queryFn: async () => {
      const cdnData = await fetchCdnRankings()
      return { rankings: cdnData.rankings, date: cdnData.date }
    },
    staleTime: 15 * 60 * 1000,
  })

  // No useMemo — list is small (≤ ~10 districts) and the page is
  // route-level. The React Compiler manages memoization automatically.
  const regionDistricts: DistrictRanking[] =
    data?.rankings && region
      ? data.rankings
          .filter(r => r.region === region)
          .sort((a, b) => (a.overallRank ?? 0) - (b.overallRank ?? 0))
      : []

  if (isLoading) {
    return <LoadingSkeleton variant="card" />
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Could not load region"
        message="The rankings file is unavailable. Try again in a moment."
        icon="data"
      />
    )
  }

  if (regionDistricts.length === 0) {
    return (
      <div className="app-shell__page">
        <p className="placeholder-page__eyebrow">Region</p>
        <h1 className="placeholder-page__title">Region {region}</h1>
        <p className="placeholder-page__body">
          No districts found for region {region}.{' '}
          <Link to="/">Back to all districts</Link>.
        </p>
      </div>
    )
  }

  // KPI rollup for this region.
  const totals = regionDistricts.reduce(
    (acc, d) => {
      acc.paidClubs += d.paidClubs ?? 0
      acc.totalPayments += d.totalPayments ?? 0
      acc.distinguishedClubs += d.distinguishedClubs ?? 0
      return acc
    },
    { paidClubs: 0, totalPayments: 0, distinguishedClubs: 0 }
  )

  return (
    <div className="app-shell__page">
      <header className="districts-page-header">
        <div className="districts-page-header__intro">
          <p className="districts-page-header__eyebrow">
            Toastmasters Region {region}
          </p>
          <h1 className="districts-page-header__title">Region {region}</h1>
          <p className="districts-page-header__lede">
            {regionDistricts.length} district
            {regionDistricts.length === 1 ? '' : 's'} in this region. Click a
            district to drill into its clubs.
          </p>
        </div>
      </header>

      <div
        className="districts-kpi-strip"
        style={{ marginBottom: 24 }}
        aria-label="Region totals"
      >
        <div className="districts-kpi-card">
          <p className="districts-kpi-card__label">Districts</p>
          <div className="districts-kpi-card__value">
            {regionDistricts.length}
          </div>
        </div>
        <div className="districts-kpi-card">
          <p className="districts-kpi-card__label">Paid Clubs</p>
          <div className="districts-kpi-card__value">
            {totals.paidClubs.toLocaleString()}
          </div>
        </div>
        <div className="districts-kpi-card">
          <p className="districts-kpi-card__label">Payments</p>
          <div className="districts-kpi-card__value">
            {totals.totalPayments.toLocaleString()}
          </div>
        </div>
        <div className="districts-kpi-card">
          <p className="districts-kpi-card__label">Distinguished Clubs</p>
          <div className="districts-kpi-card__value">
            {totals.distinguishedClubs.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="districts-rankings-table-wrap">
        <div className="overflow-x-auto">
          <table className="districts-rankings-table">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  World Rank
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Clubs
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distinguished
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {regionDistricts.map(d => (
                <tr
                  key={d.districtId}
                  className="cursor-pointer"
                  onClick={() => navigate(`/district/${d.districtId}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="districts-rankings-table__district-chip"
                      aria-hidden="true"
                    >
                      D{d.districtId}
                    </span>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {d.districtName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    #{d.overallRank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {d.paidClubs}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {d.distinguishedClubs}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 tabular-nums">
                    {d.aggregateScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RegionPage
