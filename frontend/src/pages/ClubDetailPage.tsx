import React, { useMemo } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useDistrictAnalytics, ClubTrend } from '../hooks/useDistrictAnalytics'
import { useDistricts } from '../hooks/useDistricts'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useUrlProgramYear } from '../hooks/useUrlProgramYear'
import { useDistrictCachedDates } from '../hooks/useDistrictData'
import {
  getAvailableProgramYears,
  getMostRecentDateInProgramYear,
  calculateProgramYearDay,
  type ProgramYear,
} from '../utils/programYear'
import { formatDisplayDate } from '../utils/dateFormatting'
import { formatCharterDate } from '../utils/formatCharterDate'
import { getClubAnniversary } from '../utils/clubAnniversary'
import { ClubAnniversaryBadge } from '../components/ClubAnniversaryBadge'
import { SubpageBreadcrumb } from '../components/SubpageBreadcrumb'
import {
  isProvisionallyDistinguished,
  getConfirmedLevel,
  getProvisionalTooltip,
} from '../utils/provisionalDistinguished'
import {
  calculateClubProjection,
  type ClubDCPProjection,
  type DistinguishedLevel,
} from '../utils/dcpProjections'
import { CLOSE_TO_DISTINGUISHED_MAX_MEMBERS } from '../utils/closeToDistinguished'
import {
  computeMembersToDistinguished,
  deriveGoalContext,
} from '../utils/membersToDistinguished'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/ErrorDisplay'
import ErrorBoundary from '../components/ErrorBoundary'
import { ChartSparklineExpand } from '../components/ChartSparklineExpand'
import { useDistrictStatistics } from '../hooks/useMembershipData'
import { ClubDCPGoalsPanel } from '../components/ClubDCPGoalsPanel'
import { useClubGoalTimeline } from '../hooks/useClubGoalTimeline'

// ── DCP Status Card ────────────────────────────────────────────────────────
// Re-skinned to club-reference.html (#619): a `.club-panel` with a bordered
// header, a 2-cell tier row (Current Level + Outlook), and a per-tier gap list.
// Health-based outlook (#231) and provisional-distinguished handling (#239)
// are preserved — the reference only depicts the on-track/confirmed case.

const OUTLOOK = {
  thriving: { label: 'On Track', icon: '✓', cell: 'dcp-cell--pos' },
  vulnerable: { label: 'At Risk', icon: '⚠', cell: 'dcp-cell--warn' },
  default: { label: 'Unlikely', icon: '✗', cell: 'dcp-cell--bad' },
} as const

function levelLabel(level: DistinguishedLevel): string {
  if (level === 'President') return "President's"
  if (level === 'NotDistinguished') return 'Not Distinguished'
  return level
}

function DCPProjectionCard({
  projection,
  healthStatus,
  isProvisional,
  confirmedLevel,
}: {
  projection: ClubDCPProjection
  healthStatus: string
  isProvisional?: boolean
  confirmedLevel?: DistinguishedLevel
}) {
  const gaps = [
    { tier: 'Distinguished', gap: projection.gapToDistinguished },
    { tier: 'Select', gap: projection.gapToSelect },
    { tier: "President's", gap: projection.gapToPresident },
    { tier: 'Smedley', gap: projection.gapToSmedley },
  ]

  const outlook =
    healthStatus === 'thriving'
      ? OUTLOOK.thriving
      : healthStatus === 'vulnerable'
        ? OUTLOOK.vulnerable
        : OUTLOOK.default

  const isAchieved = projection.currentLevel !== 'NotDistinguished'

  return (
    <section className="club-panel">
      <div className="club-panel__head">
        <h2>
          <svg
            className="club-panel__ico"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            aria-hidden="true"
          >
            <path d="M3 13V8M8 13V3M13 13v-7" />
          </svg>
          DCP Status
        </h2>
      </div>
      <div className="club-panel__body">
        {/* Tier row: Current Level + Outlook */}
        <div className="dcp-tier-row">
          <div className="dcp-cell">
            <div className="dcp-cell__lab">Current Level</div>
            <div
              className={
                'dcp-cell__val' +
                (isAchieved ? ' dcp-cell__val--distinguished' : '')
              }
            >
              {levelLabel(projection.currentLevel)}
            </div>
            {isProvisional && (
              <div className="dcp-cell__provisional">
                Provisional
                {confirmedLevel && confirmedLevel !== 'NotDistinguished' && (
                  <span className="dcp-cell__provisional-confirmed">
                    {' '}
                    — Confirmed: {levelLabel(confirmedLevel)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className={`dcp-cell ${outlook.cell}`}>
            <div className="dcp-cell__lab">Outlook</div>
            <div className="dcp-cell__val">
              {outlook.icon} {outlook.label}
            </div>
          </div>
        </div>

        {/* Per-tier gap list */}
        <div className="gap-section">
          <h3>Gap to Each Tier</h3>
          {gaps.map(({ tier, gap }) => {
            const met = gap.goals === 0 && gap.members === 0
            const tierLevel = tier === "President's" ? 'President' : tier
            const isCurrentTier = tierLevel === projection.currentLevel
            const tierProvisional = isProvisional && isCurrentTier && met
            const rowClass = met
              ? tierProvisional
                ? 'gap-row gap-row--provisional'
                : 'gap-row gap-row--met'
              : 'gap-row'
            return (
              <div key={tier} className={rowClass}>
                <span className="gap-row__tier">{tier}</span>
                {met ? (
                  <span className="gap-row__val">
                    {tierProvisional ? '⚠ Provisional' : '✓ Met'}
                  </span>
                ) : (
                  <span className="gap-row__val tabular-nums">
                    {gap.goals > 0 &&
                      `${gap.goals} goal${gap.goals > 1 ? 's' : ''}`}
                    {gap.goals > 0 && gap.members > 0 && ' + '}
                    {gap.members > 0 &&
                      `${gap.members} member${gap.members > 1 ? 's' : ''}`}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

const ClubDetailPage: React.FC = () => {
  const { districtId, clubId } = useParams<{
    districtId: string
    clubId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()

  // #577 — Filter round-trip: when the user arrived from a filtered clubs
  // list, ClubsTable passed the prior search via navigation state. The
  // "Clubs" breadcrumb prefers it so going back restores their filters;
  // deep links without state fall back to the unfiltered clubs route.
  const fromClubsSearch =
    typeof (location.state as { fromClubsSearch?: unknown } | null)
      ?.fromClubsSearch === 'string'
      ? (location.state as { fromClubsSearch: string }).fromClubsSearch
      : ''

  const { selectedProgramYear } = useUrlProgramYear()

  // Fetch district info
  const { data: districtsData } = useDistricts()
  const selectedDistrict = districtsData?.districts?.find(
    d => d.id === districtId
  )
  const rawName = selectedDistrict?.name || districtId || ''
  const districtName = /^\d+$/.test(rawName) ? `District ${rawName}` : rawName

  // Fetch cached dates to determine effective date range
  const { data: cachedDatesData } = useDistrictCachedDates(districtId || '')
  const allCachedDates = useMemo(
    () => cachedDatesData?.dates || [],
    [cachedDatesData?.dates]
  )

  // Determine effective program year
  const availableProgramYears = useMemo(
    () => getAvailableProgramYears(allCachedDates),
    [allCachedDates]
  )

  const effectiveProgramYear: ProgramYear | null = useMemo(() => {
    if (availableProgramYears.length === 0) return null
    const match = availableProgramYears.find(
      py => py.year === selectedProgramYear.year
    )
    return match ?? availableProgramYears[0] ?? null
  }, [availableProgramYears, selectedProgramYear.year])

  const effectiveEndDate = useMemo(() => {
    if (!effectiveProgramYear) return null
    return (
      getMostRecentDateInProgramYear(allCachedDates, effectiveProgramYear) ||
      effectiveProgramYear.endDate
    )
  }, [effectiveProgramYear, allCachedDates])

  const hasValidDates =
    effectiveProgramYear !== null && effectiveEndDate !== null

  // Fetch district analytics to get this club's data
  const { data: analytics, isLoading } = useDistrictAnalytics(
    hasValidDates ? districtId || null : null,
    effectiveProgramYear?.startDate,
    effectiveEndDate ?? undefined
  )

  // Fetch raw district statistics for per-goal DCP data (#242)
  const { data: districtStats, isLoading: isLoadingStats } =
    useDistrictStatistics(
      hasValidDates ? districtId || null : null,
      effectiveEndDate ?? undefined
    )

  // Find the club
  const club: ClubTrend | null = useMemo(() => {
    if (!analytics || !clubId) return null
    return analytics.allClubs.find(c => c.clubId === clubId) ?? null
  }, [analytics, clubId])

  // Find matching raw CSV record for per-goal progress (#242)
  const clubRawRecord = useMemo(() => {
    if (!districtStats || !clubId) return null
    // CDN snapshot wraps actual statistics under 'data' key
    const raw = districtStats as unknown as Record<string, unknown>
    const statsData = raw['data'] as Record<string, unknown> | undefined
    const records = (statsData?.['clubPerformance'] ??
      raw['clubPerformance']) as
      | Array<Record<string, string | number | null>>
      | undefined
    if (!records) return null
    return (
      records.find(r => {
        const num = String(r['Club Number'] ?? '')
        return num === clubId || num.padStart(8, '0') === clubId
      }) ?? null
    )
  }, [districtStats, clubId])

  // Compute DCP projection
  const projection: ClubDCPProjection | null = useMemo(() => {
    if (!club) return null
    return calculateClubProjection(club)
  }, [club])

  // Close-to-Distinguished result (#620). The issue asks us to reuse the
  // `membersToDistinguished` engine: it returns non-null only when adding
  // members is the *only* remaining barrier (closing the membership
  // qualification gap and/or earning the member-based DCP goals 7 & 8). We then
  // bound it by the calibrated CLOSE_TO_DISTINGUISHED_MAX_MEMBERS threshold so
  // the banner is encouragement, not noise (preserves the #433 fix that
  // suppressed far-off clubs). Already-Distinguished clubs return null upstream.
  const closeToDistinguished = useMemo(() => {
    if (!club || !projection) return null
    const result = computeMembersToDistinguished(
      projection,
      deriveGoalContext(club)
    )
    if (!result) return null
    return result.membersNeeded <= CLOSE_TO_DISTINGUISHED_MAX_MEMBERS
      ? result
      : null
  }, [club, projection])

  // Filter trends by program year
  const programYear = effectiveProgramYear ?? selectedProgramYear

  const filteredMembershipTrend = useMemo(() => {
    if (!club) return []
    return club.membershipTrend.filter(
      p => p.date >= programYear.startDate && p.date <= programYear.endDate
    )
  }, [club, programYear])

  const filteredDcpGoalsTrend = useMemo(() => {
    if (!club) return []
    return club.dcpGoalsTrend.filter(
      p => p.date >= programYear.startDate && p.date <= programYear.endDate
    )
  }, [club, programYear])

  // Goal Achievement Timeline rows (#621). Built from the PY-filtered trend so
  // nearest-prior fallback stays within the selected program year. As-of date =
  // the effective end date (most recent snapshot in the PY), falling back to
  // the PY end if dates haven't resolved yet.
  const goalTimelineRows = useClubGoalTimeline(
    filteredDcpGoalsTrend,
    programYear,
    effectiveEndDate ?? programYear.endDate
  )

  // Compute stats
  const baseMembership =
    club?.membershipBase ??
    (filteredMembershipTrend.length > 0
      ? (filteredMembershipTrend[0]?.count ?? 0)
      : 0)
  const latestMembership =
    filteredMembershipTrend.length > 0
      ? (filteredMembershipTrend[filteredMembershipTrend.length - 1]?.count ??
        0)
      : 0
  const membershipChange = latestMembership - baseMembership
  const latestDcpGoals =
    filteredDcpGoalsTrend.length > 0
      ? (filteredDcpGoalsTrend[filteredDcpGoalsTrend.length - 1]
          ?.goalsAchieved ?? 0)
      : 0

  const membershipChangePct =
    baseMembership > 0 ? (membershipChange / baseMembership) * 100 : null

  // #875 (epic #876, CC-3): collapsed-mobile sparkline series for the
  // membership trend — the same counts the hand-rolled .mem-chart plots.
  const membershipSparkline = useMemo(
    () => filteredMembershipTrend.map(p => p.count),
    [filteredMembershipTrend]
  )

  // Membership chart geometry — pixel-mapped to club-reference.html (#619).
  // viewBox 800×260 with PL36/PR14/PT14/PB26 padding → 750×220 plot area.
  const CHART = { W: 800, H: 260, PT: 14, PR: 14, PB: 26, PL: 36 }
  const innerW = CHART.W - CHART.PL - CHART.PR
  const innerH = CHART.H - CHART.PT - CHART.PB
  const membershipValues = filteredMembershipTrend.map(d => d.count)
  // ±4 padding per reference. This is what kills the y-axis inversion
  // tripwire: even a flat/single-point series spans ≥4 units (zero when v=0
  // → window [0,4]), so yRange is provably never 0 and no `|| 1` fallback is
  // needed. Empty series falls back to [0,8] but never reaches the SVG.
  const yMin = membershipValues.length
    ? Math.max(0, Math.min(...membershipValues) - 4)
    : 0
  const yMax = membershipValues.length ? Math.max(...membershipValues) + 4 : 8
  const yRange = yMax - yMin
  const xScale = (day: number) => CHART.PL + (day / 365) * innerW
  const yScale = (count: number) =>
    CHART.PT + (1 - (count - yMin) / yRange) * innerH

  const keyDates = [
    { day: 0, label: 'Jul 1', description: 'Program Year Start' },
    { day: 92, label: 'Oct 1', description: 'October Renewals' },
    { day: 275, label: 'Apr 1', description: 'April Renewals' },
    { day: 365, label: 'Jun 30', description: 'Program Year End' },
  ]

  const formatDate = (dateStr: string) => formatDisplayDate(dateStr)

  // En-dashed year for display ("2025–2026"), per reference. Used in both the
  // panel meta and the chart's aria-label so they stay in sync.
  const programYearLabelDisplay = programYear.label.replace(/-/g, '–')

  // Per-route title (#780): club + district, falling back to the branded
  // default while the club is still loading or absent.
  useDocumentTitle(club ? `${club.clubName} — ${districtName}` : null)

  // ── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <LoadingSkeleton variant="card" />
          <div className="mt-6">
            <LoadingSkeleton variant="chart" height="400px" />
          </div>
        </div>
      </div>
    )
  }

  // ── Club not found ───────────────────────────────────────────────────────

  if (!club) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <EmptyState
            title="Club Not Found"
            message={`Club ${clubId} was not found in ${districtName}. It may have been removed or the club ID may be incorrect.`}
            icon="data"
            action={{
              label: 'Back to District',
              onClick: () => navigate(`/district/${districtId}`),
            }}
          />
        </div>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {/* #618 — page container locked to the reference 1280px max-width
            with 24px padding (16px ≤640px), replacing Tailwind's `container`
            (which widens to 1536px at 2xl). */}
        <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 sm:py-6">
          {/* Breadcrumbs (#577) — leading 'Home' crumb removed per #442
              (the AppShell's 'Districts' active nav is the top-level
              signal). Trail: District › Clubs › <club>. The Clubs crumb
              restores the user's prior filtered list (filter round-trip). */}
          <SubpageBreadcrumb
            crumbs={[
              { label: districtName, to: `/district/${districtId}` },
              {
                label: 'Clubs',
                to: `/district/${districtId}/clubs${fromClubsSearch}`,
              },
              { label: club.clubName },
            ]}
          />

          {/* Redesigned hero per handoff (#23 follow-up). Loyal-blue panel
              with charter-style eyebrow + h1 + sub-line + right-side
              health & DCP tier pills.

              #432: append ' · Chartered <Month YYYY>' to the eyebrow when
              the daily Find-A-Club enrichment (#430) populated charterDate
              on the ClubTrend. Silently skipped when absent so the
              eyebrow stays clean. */}
          <header className="club-hero">
            <div className="club-hero__intro">
              <p className="club-hero__eyebrow">
                Club #{clubId}
                {(() => {
                  const formatted = formatCharterDate(club.charterDate)
                  return formatted ? ` · Chartered ${formatted}` : ''
                })()}
              </p>
              <h1 className="club-hero__title">{club.clubName}</h1>
              <p className="club-hero__sub">
                <span>{club.areaName}</span>
                <span aria-hidden="true" className="club-hero__sub-divider">
                  ·
                </span>
                <span>{club.divisionName}</span>
                {districtId && (
                  <>
                    <span aria-hidden="true" className="club-hero__sub-divider">
                      ·
                    </span>
                    <span>District {districtId}</span>
                  </>
                )}
              </p>
            </div>

            <div className="club-hero__pills">
              {/* #445 — anniversary badge surfaces years chartered, milestones,
                  and an upcoming countdown when within ±30 days. Returns null
                  when charterDate is missing so layout stays clean. */}
              {(() => {
                if (!club.charterDate) return null
                const charterLabel = formatCharterDate(club.charterDate)
                return (
                  <ClubAnniversaryBadge
                    anniversary={getClubAnniversary(club.charterDate)}
                    {...(charterLabel
                      ? { charterDateLabel: charterLabel }
                      : {})}
                  />
                )
              })()}
              <span
                className={
                  'club-hero__pill ' +
                  (club.currentStatus === 'intervention-required'
                    ? 'club-hero__pill--at-risk'
                    : club.currentStatus === 'vulnerable'
                      ? 'club-hero__pill--watch'
                      : 'club-hero__pill--thriving')
                }
              >
                <span aria-hidden="true" className="club-hero__pill-dot" />
                {club.currentStatus === 'intervention-required'
                  ? 'Intervention required'
                  : club.currentStatus === 'vulnerable'
                    ? 'Vulnerable'
                    : 'Thriving'}
              </span>
              {club.distinguishedLevel &&
                club.distinguishedLevel !== 'NotDistinguished' && (
                  <span
                    className={
                      'club-hero__pill club-hero__pill--tier ' +
                      (club.distinguishedLevel === 'President'
                        ? 'club-hero__pill--tier-presidents'
                        : club.distinguishedLevel === 'Select'
                          ? 'club-hero__pill--tier-select'
                          : 'club-hero__pill--tier-distinguished')
                    }
                    title={
                      isProvisionallyDistinguished(club)
                        ? getProvisionalTooltip(club)
                        : undefined
                    }
                  >
                    {club.distinguishedLevel === 'President'
                      ? "President's"
                      : club.distinguishedLevel}
                    {isProvisionallyDistinguished(club) &&
                      (() => {
                        const confirmed = getConfirmedLevel(club)
                        return confirmed === 'NotDistinguished'
                          ? ' (provisional)'
                          : ' (provisional)'
                      })()}
                  </span>
                )}
            </div>
          </header>

          {/* 8-stat strip (#618) — pixel-perfect to club-reference.html.
              Dedicated `.club-stats-grid` lays out 8 columns on desktop,
              collapsing to 4 (≤640px) then 2 (≤420px) in CSS. Stat value
              colour is carried by a `--pos/--neg/--muted/--tick/--cross`
              modifier so the cross-cutting dark-mode override lives in CSS
              (R10), not inline Tailwind classes. Net Δ and CSP keep their
              sign / ✓✗ glyph so colour is never the only signal. */}
          <div className="club-stats-grid">
            {[
              { label: 'Base', value: baseMembership },
              { label: 'Current', value: latestMembership },
              {
                label: 'Net Δ',
                value: `${membershipChange > 0 ? '+' : ''}${membershipChange}`,
                valClass:
                  membershipChange > 0
                    ? 'pos'
                    : membershipChange < 0
                      ? 'neg'
                      : '',
              },
              { label: 'DCP Goals', value: `${latestDcpGoals}/10` },
              {
                label: 'Oct Renewals',
                value: club.octoberRenewals ?? '—',
                valClass: club.octoberRenewals === undefined ? 'muted' : '',
              },
              {
                label: 'Apr Renewals',
                value: club.aprilRenewals ?? '—',
                valClass: club.aprilRenewals === undefined ? 'muted' : '',
              },
              {
                label: 'New Members',
                value: club.newMembers ?? '—',
                valClass: club.newMembers === undefined ? 'muted' : '',
              },
              {
                label: 'CSP',
                value:
                  club.cspSubmitted === undefined
                    ? '—'
                    : club.cspSubmitted
                      ? '✓'
                      : '✗',
                valClass:
                  club.cspSubmitted === undefined
                    ? 'muted'
                    : club.cspSubmitted
                      ? 'tick'
                      : 'cross',
                title:
                  club.cspSubmitted === undefined
                    ? 'CSP data not available for this program year'
                    : club.cspSubmitted
                      ? 'Club Success Plan submitted'
                      : 'Club Success Plan not submitted — required for Distinguished',
              },
            ].map(stat => (
              <div
                key={stat.label}
                className="club-stat"
                title={'title' in stat ? (stat.title as string) : undefined}
              >
                <div className="club-stat__label">{stat.label}</div>
                <div
                  className={`club-stat__val tabular-nums${
                    'valClass' in stat && stat.valClass
                      ? ` club-stat__val--${stat.valClass}`
                      : ''
                  }`}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* 2/3 + 1/3 row — Membership Trend + DCP Status (#619), pixel-mapped
              to club-reference.html. The chart is hand-rolled SVG (not Recharts):
              it already nails the program-year-day x-axis, and CSS-classed
              stroke/area/dot make the dark-mode swap a pure CSS override (R10). */}
          <div className="club-trend-grid">
            {/* Membership Trend (2/3) */}
            <section className="club-panel">
              <div className="club-panel__head">
                <h2>
                  <svg
                    className="club-panel__ico"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  >
                    <path d="M2 13l3-4 3 2 6-7" />
                    <path d="M10 4h3v3" />
                  </svg>
                  Membership Trend
                </h2>
                <span className="club-panel__meta">
                  Program Year {programYearLabelDisplay} ·{' '}
                  {filteredMembershipTrend.length} data point
                  {filteredMembershipTrend.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="club-panel__body">
                {filteredMembershipTrend.length > 0 ? (
                  <ChartSparklineExpand
                    title="Membership Trend"
                    sparklineData={membershipSparkline}
                    headline={
                      <>
                        {latestMembership} members
                        {membershipChange !== 0 &&
                          ` (${membershipChange > 0 ? '+' : ''}${membershipChange})`}
                      </>
                    }
                  >
                    <>
                      <div className="chart-stats">
                        <div className="chart-stats__row">
                          <span className="chart-stats__label">Base</span>
                          <span className="chart-stats__val">
                            {baseMembership}
                          </span>
                        </div>
                        <div className="chart-stats__row">
                          <span className="chart-stats__label">Current</span>
                          <span className="chart-stats__val">
                            {latestMembership}
                          </span>
                        </div>
                        <div className="chart-stats__row">
                          <span className="chart-stats__label">Change</span>
                          <span
                            className={
                              'chart-stats__val' +
                              (membershipChange > 0
                                ? ' chart-stats__val--pos'
                                : membershipChange < 0
                                  ? ' chart-stats__val--neg'
                                  : '')
                            }
                          >
                            {membershipChange >= 0 ? '+' : ''}
                            {membershipChange}
                            {membershipChangePct !== null &&
                              ` (${membershipChangePct >= 0 ? '+' : ''}${membershipChangePct.toFixed(1)}%)`}
                          </span>
                        </div>
                      </div>

                      <svg
                        className="mem-chart"
                        viewBox={`0 0 ${CHART.W} ${CHART.H}`}
                        preserveAspectRatio="none"
                        role="img"
                        aria-label={`Membership trend for program year ${programYearLabelDisplay}`}
                      >
                        {/* Y grid + labels (4 ticks) */}
                        {[0, 1, 2, 3].map(i => {
                          const v = yMin + yRange * (i / 3)
                          const y = yScale(v)
                          return (
                            <g key={`grid-${i}`}>
                              <line
                                className="grid"
                                x1={CHART.PL}
                                y1={y}
                                x2={CHART.W - CHART.PR}
                                y2={y}
                              />
                              <text
                                className="axis-text"
                                x={CHART.PL - 6}
                                y={y + 4}
                                textAnchor="end"
                              >
                                {Math.round(v)}
                              </text>
                            </g>
                          )
                        })}

                        {/* Key-date verticals (Jul 1 / Oct 1 / Apr 1 / Jun 30) */}
                        {keyDates.map(kd => {
                          const x = xScale(kd.day)
                          return (
                            <g key={kd.label}>
                              <line
                                className="key-line"
                                x1={x}
                                y1={CHART.PT}
                                x2={x}
                                y2={CHART.H - CHART.PB}
                              >
                                <title>{kd.description}</title>
                              </line>
                              <text
                                className="key-text"
                                x={x}
                                y={CHART.H - 10}
                                textAnchor="middle"
                              >
                                {kd.label}
                              </text>
                            </g>
                          )
                        })}

                        {/* Area fill + line */}
                        {(() => {
                          const pts = filteredMembershipTrend
                            .map(
                              p =>
                                `${xScale(calculateProgramYearDay(p.date)).toFixed(1)},${yScale(p.count).toFixed(1)}`
                            )
                            .join(' ')
                          const baseY = (CHART.PT + innerH).toFixed(1)
                          const firstX = xScale(
                            calculateProgramYearDay(
                              filteredMembershipTrend[0]!.date
                            )
                          ).toFixed(1)
                          const lastX = xScale(
                            calculateProgramYearDay(
                              filteredMembershipTrend[
                                filteredMembershipTrend.length - 1
                              ]!.date
                            )
                          ).toFixed(1)
                          return (
                            <>
                              {filteredMembershipTrend.length > 1 && (
                                <polygon
                                  className="area"
                                  points={`${pts} ${lastX},${baseY} ${firstX},${baseY}`}
                                />
                              )}
                              {filteredMembershipTrend.length > 1 && (
                                <polyline className="line" points={pts} />
                              )}
                            </>
                          )
                        })()}

                        {/* Dots + tooltips */}
                        {filteredMembershipTrend.map((point, index) => (
                          <circle
                            key={index}
                            className="dot"
                            cx={xScale(calculateProgramYearDay(point.date))}
                            cy={yScale(point.count)}
                            r="3"
                          >
                            <title>
                              {formatDate(point.date)}: {point.count} members
                            </title>
                          </circle>
                        ))}
                      </svg>
                    </>
                  </ChartSparklineExpand>
                ) : (
                  <EmptyState
                    title="No Membership Data"
                    message="No membership trend data available for this program year."
                    icon="data"
                  />
                )}
              </div>
            </section>

            {/* DCP Status (1/3) */}
            {projection && (
              <DCPProjectionCard
                projection={projection}
                healthStatus={club.currentStatus}
                isProvisional={isProvisionallyDistinguished(club)}
                confirmedLevel={getConfirmedLevel(club)}
              />
            )}
          </div>

          {/* Risk Factors */}
          {club.riskFactors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-red-900 mb-3 flex items-center gap-2 font-tm-headline">
                ⚠️ Risk Factors
              </h2>
              <div className="space-y-2">
                {club.riskFactors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span className="text-red-900 font-tm-body">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close-to-Distinguished call-out (#366, #433; repositioned #620).
              club-reference.html places it directly below the 2/3 + 1/3 trend
              row and above the DCP Goals panel — moved here from above the
              stats grid. Trigger + copy now come from the membersToDistinguished
              engine (see the `closeToDistinguished` memo). */}
          {closeToDistinguished && (
            <section
              role="region"
              aria-labelledby="close-to-distinguished-heading"
              className="club-close-to-distinguished"
            >
              <span
                aria-hidden="true"
                className="club-close-to-distinguished__icon"
              >
                ★
              </span>
              <div className="club-close-to-distinguished__body">
                <h2
                  id="close-to-distinguished-heading"
                  className="club-close-to-distinguished__title"
                >
                  Close to Distinguished
                </h2>
                <p className="club-close-to-distinguished__copy">
                  {closeToDistinguished.goalsEarned.length === 0 ? (
                    <>
                      This club has already met the required goals. They only
                      need{' '}
                      <strong>
                        {closeToDistinguished.membersNeeded} more member
                        {closeToDistinguished.membersNeeded > 1 ? 's' : ''}
                      </strong>{' '}
                      to achieve Distinguished status.
                    </>
                  ) : (
                    <>
                      <strong>
                        {closeToDistinguished.membersNeeded} more member
                        {closeToDistinguished.membersNeeded > 1 ? 's' : ''}
                      </strong>{' '}
                      will earn the remaining DCP goal
                      {closeToDistinguished.goalsEarned.length > 1
                        ? 's'
                        : ''}{' '}
                      and lock in Distinguished status.
                    </>
                  )}
                </p>
              </div>
            </section>
          )}

          {/* DCP Goals Progress panel (#620 + #621) — pixel-mapped to
              club-reference.html: a current-progress bar, the Goal Achievement
              Timeline (#621), then a flat per-goal status grid. The bar + meta
              use the authoritative trend count (always present); the per-goal
              grid uses the raw clubPerformance record; the timeline rows are
              computed from the PY-filtered trend (R3 — passed in, not
              re-derived in the child). */}
          <ClubDCPGoalsPanel
            goalsAchieved={latestDcpGoals}
            clubRecord={clubRawRecord}
            isLoading={isLoadingStats}
            timelineRows={goalTimelineRows}
          />

          {/* Bottom back-link (#618) — the redesign reintroduces a footer
              back affordance as an anchor (reference `.back-link` <a>), so a
              user who has scrolled the full page can return without scrolling
              back up to the breadcrumb. #577 removed the old *button*; this is
              a single styled link, not a duplicate button. */}
          <Link to={`/district/${districtId}`} className="club-back-link">
            <svg
              className="club-back-link__icon"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 13L5 8l5-5"
              />
            </svg>
            Back to {districtName}
          </Link>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default ClubDetailPage
