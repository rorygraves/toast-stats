import React, { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDistrictAnalytics, ClubTrend } from '../hooks/useDistrictAnalytics'
import { useDistricts } from '../hooks/useDistricts'
import { useUrlProgramYear } from '../hooks/useUrlProgramYear'
import { useDistrictCachedDates } from '../hooks/useDistrictData'
import {
  getAvailableProgramYears,
  getMostRecentDateInProgramYear,
  calculateProgramYearDay,
  type ProgramYear,
} from '../utils/programYear'
import { formatDisplayDate } from '../utils/dateFormatting'
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
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/ErrorDisplay'
import ErrorBoundary from '../components/ErrorBoundary'
import { useDistrictStatistics } from '../hooks/useMembershipData'
import { ClubDCPGoalsCard } from '../components/ClubDCPGoalsCard'

// ── Tier badge ─────────────────────────────────────────────────────────────

const TIER_BADGE: Record<DistinguishedLevel, { bg: string; text: string }> = {
  Smedley: { bg: 'bg-amber-100', text: 'text-amber-800' },
  President: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Select: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  Distinguished: { bg: 'bg-green-100', text: 'text-green-800' },
  NotDistinguished: { bg: 'bg-gray-100', text: 'text-gray-500' },
}

function TierBadge({ level }: { level: DistinguishedLevel }) {
  if (level === 'NotDistinguished')
    return <span className="text-sm text-gray-400">Not Distinguished</span>
  const s = TIER_BADGE[level]
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${s.bg} ${s.text}`}
    >
      {level === 'President' ? "President's" : level}
    </span>
  )
}

// ── DCP Projection Card ────────────────────────────────────────────────────

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

  // Health-based prediction (#231)
  const prediction =
    healthStatus === 'thriving'
      ? {
          label: 'On Track',
          color: 'text-green-700',
          bg: 'bg-green-50 border-green-200',
          icon: '✓',
        }
      : healthStatus === 'vulnerable'
        ? {
            label: 'At Risk',
            color: 'text-yellow-700',
            bg: 'bg-yellow-50 border-yellow-200',
            icon: '⚠',
          }
        : {
            label: 'Unlikely',
            color: 'text-red-700',
            bg: 'bg-red-50 border-red-200',
            icon: '✗',
          }

  return (
    <div className="redesign-panel">
      <h2 className="text-lg font-semibold text-gray-900 font-tm-headline mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-tm-loyal-blue"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        DCP Status
      </h2>

      {/* Current Level + Prediction */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-500 mb-1 font-tm-body">
            Current Level
          </div>
          <TierBadge level={projection.currentLevel} />
          {isProvisional && (
            <div className="text-xs text-amber-600 mt-1 font-medium">
              Provisional
              {confirmedLevel && confirmedLevel !== 'NotDistinguished' && (
                <span className="text-gray-500 font-normal">
                  {' '}
                  — Confirmed:{' '}
                  {confirmedLevel === 'President'
                    ? "President's"
                    : confirmedLevel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`rounded-lg p-4 text-center border ${prediction.bg}`}>
          <div className="text-xs text-gray-500 mb-1 font-tm-body">
            Distinguished Outlook
          </div>
          <span className={`text-sm font-semibold ${prediction.color}`}>
            {prediction.icon} {prediction.label}
          </span>
        </div>
      </div>

      {/* Gap Table */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 font-tm-body">
          Gap to Each Tier
        </h3>
        {gaps.map(({ tier, gap }) => {
          const met = gap.goals === 0 && gap.members === 0
          // Check if this tier is the club's current level and is provisional
          const tierLevel = tier === "President's" ? 'President' : tier
          const isCurrentTier = tierLevel === projection.currentLevel
          const tierProvisional = isProvisional && isCurrentTier && met
          return (
            <div
              key={tier}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                met
                  ? tierProvisional
                    ? 'bg-amber-50'
                    : 'bg-green-50'
                  : 'bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-900">{tier}</span>
              {met ? (
                tierProvisional ? (
                  <span className="text-amber-600 font-medium">
                    ⚠ Provisional
                  </span>
                ) : (
                  <span className="text-green-600 font-medium">✓ Met</span>
                )
              ) : (
                <span className="text-gray-600 font-tm-body tabular-nums">
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
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

const ClubDetailPage: React.FC = () => {
  const { districtId, clubId } = useParams<{
    districtId: string
    clubId: string
  }>()
  const navigate = useNavigate()

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

  // Chart dimensions
  const membershipValues = filteredMembershipTrend.map(d => d.count)
  const rawMin = membershipValues.length > 0 ? Math.min(...membershipValues) : 0
  const rawMax = membershipValues.length > 0 ? Math.max(...membershipValues) : 0
  const yPadding = rawMax === rawMin ? 2 : 0
  const minMembership = Math.max(0, rawMin - yPadding)
  const maxMembership = rawMax + yPadding
  const membershipRange = maxMembership - minMembership || 1
  const totalProgramDays = 365

  const keyDates = [
    { day: 0, label: 'Jul 1', description: 'Program Year Start' },
    { day: 92, label: 'Oct 1', description: 'October Renewals' },
    { day: 275, label: 'Apr 1', description: 'April Renewals' },
    { day: 365, label: 'Jun 30', description: 'Program Year End' },
  ]

  const dayToX = (day: number) => (day / totalProgramDays) * 800
  const formatDate = (dateStr: string) => formatDisplayDate(dateStr)

  // Set page title
  React.useEffect(() => {
    if (club) {
      document.title = `${club.clubName} — ${districtName} | Toast Stats`
    }
    return () => {
      document.title = 'Toast Stats'
    }
  }, [club, districtName])

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
        <div className="container mx-auto px-4 py-4 sm:py-8">
          {/* Breadcrumbs */}
          <nav
            className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-tm-body"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="hover:text-tm-loyal-blue transition-colors">
              Home
            </Link>
            <span>›</span>
            <Link
              to={`/district/${districtId}`}
              className="hover:text-tm-loyal-blue transition-colors"
            >
              {districtName}
            </Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">{club.clubName}</span>
          </nav>

          {/* Redesigned hero per handoff (#23 follow-up). Loyal-blue panel
              with charter-style eyebrow + h1 + sub-line + right-side
              health & DCP tier pills. */}
          <header className="club-hero">
            <div className="club-hero__intro">
              <p className="club-hero__eyebrow">Club #{clubId}</p>
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

          {/* Close-to-Distinguished call-out (#366). Renders above the stats
              grid when the club has met the goals threshold but is short on
              members for Distinguished. */}
          {projection &&
            projection.gapToDistinguished.goals === 0 &&
            projection.gapToDistinguished.members > 0 && (
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
                    This club has met the {latestDcpGoals} DCP goal threshold.{' '}
                    <strong>
                      {projection.gapToDistinguished.members} more member
                      {projection.gapToDistinguished.members > 1 ? 's' : ''}
                    </strong>{' '}
                    will lock in Distinguished status.
                  </p>
                </div>
              </section>
            )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Base', value: baseMembership },
              { label: 'Current', value: latestMembership },
              {
                label: 'Net Change',
                value: `${membershipChange > 0 ? '+' : ''}${membershipChange}`,
                color:
                  membershipChange > 0
                    ? 'text-green-600'
                    : membershipChange < 0
                      ? 'text-red-600'
                      : '',
              },
              { label: 'DCP Goals', value: `${latestDcpGoals}/10` },
              { label: 'Oct Renewals', value: club.octoberRenewals ?? '—' },
              { label: 'Apr Renewals', value: club.aprilRenewals ?? '—' },
              { label: 'New Members', value: club.newMembers ?? '—' },
              {
                label: 'CSP',
                value:
                  club.cspSubmitted === undefined
                    ? '—'
                    : club.cspSubmitted
                      ? '✓'
                      : '✗',
                color:
                  club.cspSubmitted === undefined
                    ? 'text-gray-400'
                    : club.cspSubmitted
                      ? 'text-green-600'
                      : 'text-red-600',
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
                className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 text-center"
                title={'title' in stat ? (stat.title as string) : undefined}
              >
                <div className="text-xs text-gray-500 font-tm-body mb-1">
                  {stat.label}
                </div>
                <div
                  className={`text-lg font-semibold font-tm-body tabular-nums ${
                    'color' in stat && stat.color ? stat.color : 'text-gray-900'
                  }`}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Two-column layout for charts + projection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Membership Trend Chart (2 cols) */}
            <div className="lg:col-span-2 redesign-panel">
              <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2 font-tm-headline">
                <svg
                  className="w-5 h-5 text-tm-loyal-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Membership Trend
              </h2>
              <p className="text-xs text-gray-500 mb-4 font-tm-body">
                Program Year {programYear.label}
              </p>

              {filteredMembershipTrend.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <div>
                      <span className="text-gray-600 font-tm-body">Base: </span>
                      <span className="font-semibold text-gray-900 font-tm-body">
                        {baseMembership}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-tm-body">
                        Current:{' '}
                      </span>
                      <span className="font-semibold text-gray-900 font-tm-body">
                        {latestMembership}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-tm-body">
                        Change:{' '}
                      </span>
                      <span
                        className={`font-semibold font-tm-body ${membershipChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {membershipChange >= 0 ? '+' : ''}
                        {membershipChange}
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="relative h-48 bg-white rounded border border-gray-200 p-4">
                    <div className="absolute left-0 top-4 bottom-4 w-10 flex flex-col justify-between text-xs text-gray-500 font-tm-body">
                      <span>{maxMembership}</span>
                      <span>
                        {Math.round(minMembership + membershipRange * 0.5)}
                      </span>
                      <span>{minMembership}</span>
                    </div>
                    <svg
                      className="w-full h-full ml-8"
                      viewBox="0 0 800 180"
                      preserveAspectRatio="none"
                      aria-label={`Membership trend for ${programYear.label}`}
                    >
                      {[0, 45, 90, 135, 160].map(y => (
                        <line
                          key={`grid-${y}`}
                          x1="0"
                          y1={y}
                          x2="800"
                          y2={y}
                          stroke="var(--tm-cool-gray)"
                          strokeWidth="0.5"
                        />
                      ))}
                      {keyDates.map(kd => {
                        const x = dayToX(kd.day)
                        return (
                          <g key={kd.label}>
                            <line
                              x1={x}
                              y1="0"
                              x2={x}
                              y2="160"
                              stroke="var(--tm-cool-gray)"
                              strokeWidth="1"
                              strokeDasharray="4 3"
                            />
                            <text
                              x={x}
                              y="175"
                              textAnchor="middle"
                              fontSize="10"
                              fill="#6b7280"
                            >
                              {kd.label}
                            </text>
                          </g>
                        )
                      })}
                      {filteredMembershipTrend.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="var(--tm-loyal-blue)"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          points={filteredMembershipTrend
                            .map(point => {
                              const day = calculateProgramYearDay(point.date)
                              const x = dayToX(day)
                              const y =
                                160 -
                                ((point.count - minMembership) /
                                  membershipRange) *
                                  160
                              return `${x},${y}`
                            })
                            .join(' ')}
                        />
                      )}
                      {filteredMembershipTrend.map((point, index) => {
                        const day = calculateProgramYearDay(point.date)
                        const x = dayToX(day)
                        const y =
                          160 -
                          ((point.count - minMembership) / membershipRange) *
                            160
                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r="3"
                              fill="var(--tm-loyal-blue)"
                            />
                            <title>
                              {formatDate(point.date)}: {point.count} members
                            </title>
                          </g>
                        )
                      })}
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500 font-tm-body">
                    <span>{programYear.label} Program Year</span>
                    <span>{filteredMembershipTrend.length} data points</span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No Membership Data"
                  message="No membership trend data available for this program year."
                  icon="data"
                />
              )}
            </div>

            {/* DCP Projection (1 col) */}
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

          {/* DCP Goals Timeline */}
          {filteredDcpGoalsTrend.length > 0 && (
            <div className="redesign-panel mb-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 font-tm-headline">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                DCP Goals Progress
              </h2>

              {/* Current Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-tm-body">
                    Current Progress
                  </span>
                  <span className="font-semibold text-gray-900 font-tm-body">
                    {latestDcpGoals} / 10 goals
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-tm-loyal-blue h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${(latestDcpGoals / 10) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Goal Achievement Timeline */}
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 font-tm-body">
                Goal Achievement Timeline
              </h3>
              <div className="space-y-2">
                {(() => {
                  const changed = filteredDcpGoalsTrend.filter(
                    (point, index, arr) => {
                      if (index === 0) return true
                      return (
                        point.goalsAchieved !== arr[index - 1]?.goalsAchieved
                      )
                    }
                  )
                  return changed.map((point, index) => {
                    const prevGoals =
                      index > 0
                        ? (changed[index - 1]?.goalsAchieved ?? 0)
                        : (filteredDcpGoalsTrend[0]?.goalsAchieved ?? 0)
                    const gained = point.goalsAchieved - prevGoals
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="text-gray-600 w-24 flex-shrink-0 font-tm-body">
                          {formatDate(point.date)}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-tm-loyal-blue h-2 rounded-full"
                            style={{
                              width: `${(point.goalsAchieved / 10) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-gray-900 w-12 text-right font-tm-body">
                          {point.goalsAchieved}/10
                        </span>
                        {index > 0 && (
                          <span
                            className={`text-xs w-8 text-right font-medium font-tm-body ${
                              gained > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {gained > 0 ? '+' : ''}
                            {gained}
                          </span>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          {/* DCP Goals Progress — per-goal breakdown (#242, reordered #265) */}
          <ClubDCPGoalsCard
            clubRecord={clubRawRecord}
            isLoading={isLoadingStats}
          />

          {/* Back to District button */}
          <div className="flex justify-center py-4">
            <button
              onClick={() => navigate(`/district/${districtId}`)}
              className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium font-tm-body"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to {districtName}
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default ClubDetailPage
