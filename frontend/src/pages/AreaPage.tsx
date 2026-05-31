/* AreaPage (#425) — narrowest hierarchy page: a single area within a division
   within a district. Shows the same recognition-aware data as the Divisions
   overview's per-area row (status badge, paid/distinguished, First/Second Round
   Visits, Gap-to-D/S/P) via the shared extractDivisionPerformance +
   AreaPerformanceTable, plus the scoped narrative (generateAreaProgressText —
   the #974/#976 per-area progress prose) — one source of truth (R6/R8, #1016).
   Then lists every club in that area. */

import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDistrictAnalytics } from '../hooks/useDistrictAnalytics'
import { useDistrictStatistics } from '../hooks/useMembershipData'
import { extractDivisionPerformance } from '../utils/extractDivisionPerformance'
import { calculateAreaGapAnalysis } from '../utils/areaGapAnalysis'
import { generateAreaProgressText } from '../utils/areaProgressText'
import { renderRecognitionBadge } from '../utils/areaRecognitionBadge'
import { AreaPerformanceTable } from '../components/AreaPerformanceTable'
import type { AreaWithDivision } from '../components/DivisionAreaProgressSummary'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/ErrorDisplay'
import { ClubMiniList } from '../components/ClubMiniList'
import { useIsMobile } from '../hooks/useIsMobile'

const AreaPage: React.FC = () => {
  const { districtId, divId, areaId } = useParams<{
    districtId: string
    divId: string
    areaId: string
  }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const { data, isLoading, error } = useDistrictAnalytics(
    districtId ?? '',
    undefined,
    undefined
  )

  // Recognition / gap / visit data come from the same raw snapshot the Divisions
  // overview reads — one source of truth (R6/R8, #1016). We reuse the overview's
  // extractDivisionPerformance util + AreaPerformanceTable + areaProgressText
  // rather than re-deriving from allClubs, so this scoped page can't drift from
  // it. Per Lesson 147, this surface is fed by the snapshot and must NOT be
  // hidden behind the allClubs emptiness check below.
  const { data: snapshot, isLoading: isLoadingSnapshot } =
    useDistrictStatistics(districtId ?? '', undefined, 'divisions')
  const normalizedDivId = divId?.toUpperCase()
  const normalizedAreaId = areaId?.toUpperCase()
  const matched = React.useMemo(() => {
    if (!snapshot || !normalizedDivId || !normalizedAreaId) return undefined
    // The CDN snapshot carries the as-of date; pass it so historical snapshots
    // gate visit deadlines correctly (R3).
    const division = extractDivisionPerformance(
      snapshot,
      snapshot.asOfDate
    ).find(d => d.divisionId.toUpperCase() === normalizedDivId)
    const area = division?.areas.find(
      a => a.areaId.toUpperCase() === normalizedAreaId
    )
    return area ? { area, divisionId: division!.divisionId } : undefined
  }, [snapshot, normalizedDivId, normalizedAreaId])
  const areaPerformance = matched?.area

  const areaNarrative = React.useMemo(() => {
    if (!matched) return undefined
    const { area, divisionId } = matched
    const gapAnalysis = calculateAreaGapAnalysis({
      clubBase: area.clubBase,
      paidClubs: area.paidClubs,
      distinguishedClubs: area.distinguishedClubs,
    })
    // The current-round visit fields (#973) and recognitionState (#832) travel
    // on the area row, so the generator reads them directly (#974). Use the
    // division's actual extracted id (not the route param) so the prose matches
    // the overview's "one source of truth" exactly.
    const areaWithDivision: AreaWithDivision = { ...area, divisionId }
    return generateAreaProgressText(areaWithDivision, gapAnalysis)
  }, [matched])

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
    c =>
      c.divisionId.toUpperCase() === normalizedDivId &&
      c.areaId.toUpperCase() === normalizedAreaId
  )

  const areaName =
    clubs[0]?.areaName ??
    (areaPerformance ? `Area ${areaPerformance.areaId}` : `Area ${areaId}`)
  const divisionName = clubs[0]?.divisionName ?? `Division ${divId}`
  const badge = areaPerformance
    ? renderRecognitionBadge(areaPerformance.recognitionState)
    : undefined

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
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="districts-page-header__title">{areaName}</h1>
            {badge && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full border ${badge.className}`}
                aria-label={`Area ${areaPerformance?.areaId ?? areaId} recognition: ${badge.label}`}
                title={badge.tooltip}
              >
                {badge.label}
              </span>
            )}
          </div>
          <p className="districts-page-header__lede">
            {clubs.length === 0
              ? 'Area recognition standing for this program year.'
              : `${clubs.length} club${clubs.length === 1 ? '' : 's'} in this area.`}
          </p>
        </div>
      </header>

      {/* Area recognition data, reused from the Divisions overview (#1016).
          Replaces the old ad-hoc allClubs KPI strip so the standalone page shows
          the same status / paid / distinguished / R1-R2 visit / Gap-to-D-S-P
          metrics on the same computation as the overview. */}
      <div style={{ marginBottom: 24 }}>
        {areaPerformance ? (
          <AreaPerformanceTable areas={[areaPerformance]} />
        ) : (
          isLoadingSnapshot && <LoadingSkeleton variant="table" count={2} />
        )}
      </div>

      {/* Scoped narrative — the same per-area progress prose the overview's
          Division and Area Progress Summary shows (#974/#976), generated from
          the snapshot-derived recognition source of truth. */}
      {areaNarrative && (
        <article
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          style={{ marginBottom: 24 }}
          aria-label="Area progress summary"
        >
          <p
            data-testid="area-progress-text"
            className="text-gray-700 font-tm-body leading-relaxed"
            style={{ fontSize: '14px' }}
          >
            {areaNarrative.progressText}
          </p>
        </article>
      )}

      {/* No analytics-club rows for this area (suspended/migrated clubs, or a
          casing skew). The recognition surface above still renders from the
          snapshot — don't hide it behind an empty club list (Lesson 147). */}
      {clubs.length === 0 && (
        <p className="placeholder-page__body">
          No clubs are currently listed in this area.{' '}
          <Link to={`/district/${districtId}/division/${divId}`}>
            Back to {divisionName}
          </Link>
          .
        </p>
      )}

      {/* CC-4 (#871): the 4-col table overflows 375px and clips the Status
          chip, so mobile de-tables to a stacked card list; desktop keeps the
          table unchanged. */}
      {clubs.length > 0 &&
        (isMobile ? (
          <ClubMiniList
            clubs={clubs}
            clubTo={c => `/district/${districtId}/club/${c.clubId}`}
          />
        ) : (
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
                          {/* CC-7 (#872): real <Link> on the club name; whole-row
                              click kept as a mouse convenience (stop the bubble so
                              a name-click navigates once). */}
                          <Link
                            to={`/district/${districtId}/club/${c.clubId}`}
                            onClick={e => e.stopPropagation()}
                            className="clubs-name-link text-sm font-medium text-gray-900"
                          >
                            {c.clubName}
                          </Link>
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
        ))}
    </div>
  )
}

export default AreaPage
