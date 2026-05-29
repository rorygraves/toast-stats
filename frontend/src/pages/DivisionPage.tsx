/* DivisionPage (#424) — landing for a single division within a
   district. Lists every club in that division with health status and
   a small KPI strip. Reuses the shared district analytics React-Query
   cache. */

import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDistrictAnalytics } from '../hooks/useDistrictAnalytics'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/ErrorDisplay'
import { StatusChip } from '../components/StatusChip'
import { useIsMobile } from '../hooks/useIsMobile'

const DivisionPage: React.FC = () => {
  const { districtId, divId } = useParams<{
    districtId: string
    divId: string
  }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

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
        title="Could not load division"
        message="The district analytics file is unavailable. Try again in a moment."
        icon="data"
      />
    )
  }

  const clubs = data.allClubs.filter(c => c.divisionId === divId)

  if (clubs.length === 0) {
    return (
      <div className="app-shell__page">
        <p className="placeholder-page__eyebrow">Division</p>
        <h1 className="placeholder-page__title">
          District {districtId} · Division {divId}
        </h1>
        <p className="placeholder-page__body">
          No clubs found in this division.{' '}
          <Link to={`/district/${districtId}`}>
            Back to District {districtId}
          </Link>
          .
        </p>
      </div>
    )
  }

  const divisionName = clubs[0]?.divisionName ?? `Division ${divId}`

  // KPI rollup — counts by health status, total members.
  const totalMembers = clubs.reduce((sum, c) => {
    const last = c.membershipTrend[c.membershipTrend.length - 1]
    return sum + (last?.count ?? 0)
  }, 0)
  const thriving = clubs.filter(c => c.currentStatus === 'thriving').length
  const vulnerable = clubs.filter(c => c.currentStatus === 'vulnerable').length
  const intervention = clubs.filter(
    c => c.currentStatus === 'intervention-required'
  ).length

  // Group clubs by area for the table sections.
  const areaGroups = new Map<
    string,
    { areaId: string; areaName: string; clubs: typeof clubs }
  >()
  for (const c of clubs) {
    const existing = areaGroups.get(c.areaId)
    if (existing) {
      existing.clubs.push(c)
    } else {
      areaGroups.set(c.areaId, {
        areaId: c.areaId,
        areaName: c.areaName,
        clubs: [c],
      })
    }
  }
  const areas = Array.from(areaGroups.values()).sort((a, b) =>
    a.areaId.localeCompare(b.areaId)
  )

  return (
    <div className="app-shell__page">
      <header className="districts-page-header">
        <div className="districts-page-header__intro">
          <p className="districts-page-header__eyebrow">
            District {districtId} ·{' '}
            <Link to={`/district/${districtId}`}>back to district</Link>
          </p>
          <h1 className="districts-page-header__title">{divisionName}</h1>
          <p className="districts-page-header__lede">
            {clubs.length} club{clubs.length === 1 ? '' : 's'} across{' '}
            {areas.length} area{areas.length === 1 ? '' : 's'} in this division.
          </p>
        </div>
      </header>

      <div
        className="districts-kpi-strip"
        style={{ marginBottom: 24 }}
        aria-label="Division totals"
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
          <div
            className="districts-kpi-card__value"
            style={{ color: 'var(--green-600, #16a34a)' }}
          >
            {thriving}
          </div>
        </div>
        <div className="districts-kpi-card">
          <p className="districts-kpi-card__label">Needs Attention</p>
          <div
            className="districts-kpi-card__value"
            style={{
              color:
                intervention > 0 ? 'var(--red-600, #dc2626)' : 'var(--ink-2)',
            }}
          >
            {vulnerable + intervention}
          </div>
        </div>
      </div>

      {areas.map(area => (
        <section key={area.areaId} style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 18,
              fontWeight: 700,
              margin: '0 0 12px',
            }}
          >
            <Link
              to={`/district/${districtId}/division/${divId}/area/${area.areaId}`}
            >
              Area {area.areaId} — {area.areaName}
            </Link>
            <span
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 13,
                fontWeight: 400,
                color: 'var(--ink-3)',
                marginLeft: 8,
              }}
            >
              {area.clubs.length} club{area.clubs.length === 1 ? '' : 's'}
            </span>
          </h2>

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
                  {area.clubs.map(c => {
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
                          {/* CC-4 (#871): chip at <768px so the status label
                              never truncates; desktop unchanged. */}
                          {isMobile ? (
                            <StatusChip status={c.currentStatus} />
                          ) : (
                            c.currentStatus
                          )}
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
        </section>
      ))}
    </div>
  )
}

export default DivisionPage
