/* AreaPage (#425) — narrowest hierarchy page: a single area within a
   division within a district. Lists every club in that area. */

import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDistrictAnalytics } from '../hooks/useDistrictAnalytics'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/ErrorDisplay'

const AreaPage: React.FC = () => {
  const { districtId, divId, areaId } = useParams<{
    districtId: string
    divId: string
    areaId: string
  }>()
  const navigate = useNavigate()

  const { data, isLoading, error } = useDistrictAnalytics(
    districtId ?? '',
    undefined,
    undefined
  )

  if (isLoading) {
    return <LoadingSkeleton variant="card" />
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Could not load area"
        message="The district analytics file is unavailable. Try again in a moment."
        icon="data"
      />
    )
  }

  const clubs = data.allClubs.filter(
    c => c.divisionId === divId && c.areaId === areaId
  )

  if (clubs.length === 0) {
    return (
      <div className="app-shell__page">
        <p className="placeholder-page__eyebrow">Area</p>
        <h1 className="placeholder-page__title">
          District {districtId} · Division {divId} · Area {areaId}
        </h1>
        <p className="placeholder-page__body">
          No clubs found in this area.{' '}
          <Link to={`/district/${districtId}/division/${divId}`}>
            Back to Division {divId}
          </Link>
          .
        </p>
      </div>
    )
  }

  const areaName = clubs[0]?.areaName ?? `Area ${areaId}`
  const divisionName = clubs[0]?.divisionName ?? `Division ${divId}`

  const totalMembers = clubs.reduce((sum, c) => {
    const last = c.membershipTrend[c.membershipTrend.length - 1]
    return sum + (last?.count ?? 0)
  }, 0)
  const thriving = clubs.filter(c => c.currentStatus === 'thriving').length
  const distinguished = clubs.filter(
    c => c.distinguishedLevel !== 'NotDistinguished'
  ).length

  return (
    <div className="app-shell__page">
      <header className="districts-page-header">
        <div className="districts-page-header__intro">
          <p className="districts-page-header__eyebrow">
            District {districtId} ·{' '}
            <Link to={`/district/${districtId}/division/${divId}`}>
              {divisionName}
            </Link>
          </p>
          <h1 className="districts-page-header__title">{areaName}</h1>
          <p className="districts-page-header__lede">
            {clubs.length} club{clubs.length === 1 ? '' : 's'} in this area.
          </p>
        </div>
      </header>

      <div
        className="districts-kpi-strip"
        style={{ marginBottom: 24 }}
        aria-label="Area totals"
      >
        <div className="districts-kpi-card">
          <p className="districts-kpi-card__label">Clubs</p>
          <div className="districts-kpi-card__value">{clubs.length}</div>
        </div>
        <div className="districts-kpi-card">
          <p className="districts-kpi-card__label">Total Members</p>
          <div className="districts-kpi-card__value">
            {totalMembers.toLocaleString()}
          </div>
        </div>
        <div className="districts-kpi-card">
          <p className="districts-kpi-card__label">Thriving</p>
          <div className="districts-kpi-card__value">{thriving}</div>
        </div>
        <div className="districts-kpi-card">
          <p className="districts-kpi-card__label">Distinguished+</p>
          <div className="districts-kpi-card__value">{distinguished}</div>
        </div>
      </div>

      <div className="districts-rankings-table-wrap">
        <div className="overflow-x-auto">
          <table className="districts-rankings-table">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Club
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distinguished
                </th>
              </tr>
            </thead>
            <tbody>
              {clubs.map(c => {
                const last = c.membershipTrend[c.membershipTrend.length - 1]
                return (
                  <tr
                    key={c.clubId}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(`/district/${districtId}/club/${c.clubId}`)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {c.clubName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {c.currentStatus}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 tabular-nums">
                      {last?.count ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {c.distinguishedLevel === 'NotDistinguished'
                        ? '—'
                        : c.distinguishedLevel}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AreaPage
