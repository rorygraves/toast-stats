/* DivisionPage (#424) — landing for a single division within a district.
   Shows the same division + areas recognition data as the Divisions overview
   (status, Gap-to-D/S/P, per-area visit metrics) via the shared
   extractDivisionPerformance + DivisionPerformanceCard (#1015), then lists
   every club in the division by area with health status. Reuses the shared
   district analytics + snapshot React-Query caches. */

import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDistrictAnalytics } from '../hooks/useDistrictAnalytics'
import { useDistrictStatistics } from '../hooks/useMembershipData'
import { extractDivisionPerformance } from '../utils/extractDivisionPerformance'
import { calculateDivisionGapAnalysis } from '../utils/divisionGapAnalysis'
import { generateDivisionProgressText } from '../utils/divisionProgressText'
import { DivisionPerformanceCard } from '../components/DivisionPerformanceCard'
import { SubpageBreadcrumb } from '../components/SubpageBreadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/ErrorDisplay'
import { ClubMiniList } from '../components/ClubMiniList'
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

  // Recognition / gap / visit data come from the same raw snapshot the
  // Divisions overview reads — one source of truth (R6/R8, #1015). We reuse the
  // overview's extractDivisionPerformance util + DivisionPerformanceCard rather
  // than re-deriving from allClubs, so this scoped page can't drift from it.
  const { data: snapshot, isLoading: isLoadingSnapshot } =
    useDistrictStatistics(districtId ?? '', undefined, 'divisions')
  const normalizedDivId = divId?.toUpperCase()
  const divisionPerformance = React.useMemo(() => {
    if (!snapshot || !normalizedDivId) return undefined
    return extractDivisionPerformance(snapshot, snapshot.asOfDate).find(
      d => d.divisionId.toUpperCase() === normalizedDivId
    )
  }, [snapshot, normalizedDivId])

  // Scoped division-level narrative — the same prose the overview's Division and
  // Area Progress Summary shows, scoped to this division (#1016 S2 refactor).
  // Reuses the existing generateDivisionProgressText generator (R6/R7).
  const divisionNarrative = React.useMemo(() => {
    if (!divisionPerformance) return undefined
    const gapAnalysis = calculateDivisionGapAnalysis({
      clubBase: divisionPerformance.clubBase,
      paidClubs: divisionPerformance.paidClubs,
      distinguishedClubs: divisionPerformance.distinguishedClubs,
    })
    return generateDivisionProgressText(divisionPerformance, gapAnalysis)
  }, [divisionPerformance])

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

  // Slug validation (#1017): once the snapshot has LOADED, a division id absent
  // from its division list is a bad URL, not a real-but-empty division. Throw a
  // 404 so the root errorElement (#1011/#1012) renders the branded not-found
  // page with district-subpage recovery, instead of a misleading empty page.
  // Gate strictly on `snapshot` being present — never 404 while it's still
  // loading or errored (data-unavailable ≠ not-found), and never 404 a real
  // division whose clubs are all suspended (Lesson 147): the snapshot's division
  // list is the source of truth, the same one the recognition card reads.
  if (snapshot && !divisionPerformance) {
    throw new Response(null, { status: 404, statusText: 'Division not found' })
  }

  const clubs = data.allClubs.filter(
    c => c.divisionId.toUpperCase() === normalizedDivId
  )

  const divisionName = clubs[0]?.divisionName ?? `Division ${divId}`

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
      {/* District › Division wayfinding via the shared SubpageBreadcrumb every
          routed sub-page uses (Lesson 085) — replaces the ad-hoc eyebrow link so
          the trail, link affordance, and aria-current are consistent (#1017). */}
      <SubpageBreadcrumb
        crumbs={[
          { label: `District ${districtId}`, to: `/district/${districtId}` },
          { label: divisionName },
        ]}
      />
      <header className="districts-page-header">
        <div className="districts-page-header__intro">
          <h1 className="districts-page-header__title">{divisionName}</h1>
          <p className="districts-page-header__lede">
            {clubs.length === 0
              ? 'Division recognition standing for this program year.'
              : `${clubs.length} club${clubs.length === 1 ? '' : 's'} across ${areas.length} area${areas.length === 1 ? '' : 's'} in this division.`}
          </p>
        </div>
      </header>

      {/* Division + areas recognition data, reused from the Divisions overview
          (#1015). Replaces the old ad-hoc allClubs KPI strip so the standalone
          page shows the same status / Gap-to-D-S-P / per-area visit metrics on
          the same computation as the overview. */}
      <div style={{ marginBottom: 24 }}>
        {divisionPerformance ? (
          <DivisionPerformanceCard division={divisionPerformance} />
        ) : (
          isLoadingSnapshot && <LoadingSkeleton variant="table" count={3} />
        )}
      </div>

      {/* Scoped division-level narrative (#1016 S2) — same prose as the overview
          summary, scoped to this division. */}
      {divisionNarrative && (
        <article
          className="bg-tm-loyal-blue/10 rounded-lg p-4 border border-tm-loyal-blue/30"
          style={{ marginBottom: 24 }}
          aria-label="Division progress summary"
        >
          <p
            data-testid="division-progress-text"
            className="text-gray-800 font-tm-body leading-relaxed font-medium"
            style={{ fontSize: '15px' }}
          >
            {divisionNarrative.progressText}
          </p>
        </article>
      )}

      {/* No analytics-club rows for this division (suspended/migrated clubs).
          The recognition card above still renders from the snapshot — don't
          hide it behind an empty club list (#1015). */}
      {clubs.length === 0 && (
        <p className="placeholder-page__body">
          No clubs are currently listed in this division.{' '}
          <Link to={`/district/${districtId}`}>
            Back to District {districtId}
          </Link>
          .
        </p>
      )}

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

          {/* CC-4 (#871): the 4-col table overflows 375px and clips the
              Status chip, so mobile de-tables to a stacked card list; desktop
              keeps the table unchanged. */}
          {isMobile ? (
            <ClubMiniList
              clubs={area.clubs}
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
                    {area.clubs.map(c => {
                      const last =
                        c.membershipTrend[c.membershipTrend.length - 1]
                      return (
                        <tr
                          key={c.clubId}
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(`/district/${districtId}/club/${c.clubId}`)
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {/* CC-7 (#872): a real <Link> on the club name —
                                middle-click / open-in-new-tab work; whole-row
                                click stays as a mouse convenience (stop the
                                bubble so a name-click navigates once). */}
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
          )}
        </section>
      ))}
    </div>
  )
}

export default DivisionPage
