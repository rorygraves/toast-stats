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
import { computeTiedRanks } from '../utils/tieRankingUtils'
import { useCompetitiveAwards } from '../hooks/useCompetitiveAwards'
import type { DistinguishedDistrictTier } from '../services/cdn'
import {
  getDistinguishedCountdown,
  type CountdownCell,
} from '../utils/distinguishedCountdown'
import { DistrictChipAndName } from '../components/DistrictChipAndName'

interface KpiCardProps {
  label: string
  base: number
  current: number
}

/** KPI card with a base → current → Δ → ±% rhythm. Negative deltas
 *  render in maroon. Percent is omitted when base is 0 (avoid /0; the
 *  Distinguished case in particular relies on this). */
const KpiCard: React.FC<KpiCardProps> = ({ label, base, current }) => {
  const delta = current - base
  const percent = base === 0 ? null : ((current - base) / base) * 100
  const sign = delta >= 0 ? '+' : ''
  const deltaTone = delta >= 0 ? 'text-green-700' : 'text-tm-true-maroon'
  return (
    <div className="districts-kpi-card" aria-label={`${label} KPI`}>
      <p className="districts-kpi-card__label">{label}</p>
      <div className="districts-kpi-card__value">
        {current.toLocaleString()}
      </div>
      <p className="text-xs text-gray-500 tabular-nums mt-1">
        <span data-testid="kpi-base">Base {base.toLocaleString()}</span> ·{' '}
        <span data-testid="kpi-delta" className={`font-semibold ${deltaTone}`}>
          {sign}
          {delta.toLocaleString()}
        </span>
        {percent !== null && (
          <>
            {' '}
            ·{' '}
            <span
              data-testid="kpi-percent"
              className={`font-semibold ${deltaTone}`}
            >
              {sign}
              {percent.toFixed(1)}%
            </span>
          </>
        )}
      </p>
    </div>
  )
}

/* Cell renderer for the Distinguished countdown columns. Absolute
   remaining counts render as a plain maroon number (#688 — "277 to go",
   a clamped non-negative countdown, NOT a signed delta, so no +/− prefix;
   lesson 102 family); metric-met as ✓ (green); boolean (officer awards)
   as ✓ or em-dash. Em-dash when the cell prop is null (district missing
   from awards, or a legacy snapshot lacking both the canonical count and
   the gap+base needed to derive it). */
const renderCountdownInner = (cell: CountdownCell | null): React.ReactNode => {
  if (!cell) return <span className="text-gray-400">—</span>
  if (cell.kind === 'met')
    return <span className="text-green-700 font-semibold">✓</span>
  if (cell.kind === 'boolean')
    return cell.met ? (
      <span className="text-green-700 font-semibold">✓</span>
    ) : (
      <span className="text-gray-400">—</span>
    )
  return (
    <span className="text-tm-true-maroon font-semibold tabular-nums">
      {cell.value.toLocaleString()}
    </span>
  )
}

const CountdownTd: React.FC<{
  metric: keyof import('../utils/distinguishedCountdown').DistinguishedCountdown
  cell: CountdownCell | null
  groupStart?: boolean
}> = ({ metric, cell, groupStart }) => (
  <td
    data-testid={`countdown-${metric}`}
    className={`px-3 py-4 whitespace-nowrap text-sm text-right${
      groupStart ? ' border-l border-[var(--line)]' : ''
    }`}
  >
    {renderCountdownInner(cell)}
  </td>
)

/* Signed Δ cell for a base→current→Δ metric group (#687). Renders the
   SIGNED actual change: growth green +N, loss maroon −N, matching the
   KpiCard delta convention above. Distinct from the clamped
   distinguished-gap that once rendered here and made a shrinking district
   look like it was growing (#684) — `value` must already be the signed
   `current − base`, never a `max(0, …)` gap (lesson 102). */
const SignedDeltaTd: React.FC<{ value: number; testid: string }> = ({
  value,
  testid,
}) => {
  const sign = value >= 0 ? '+' : ''
  const tone = value >= 0 ? 'text-green-700' : 'text-tm-true-maroon'
  return (
    <td
      data-testid={testid}
      className="px-3 py-4 whitespace-nowrap text-sm text-right"
    >
      <span className={`${tone} font-semibold tabular-nums`}>
        {sign}
        {value.toLocaleString()}
      </span>
    </td>
  )
}

/* Base / Current numeric cell for a metric group (#687). `groupStart`
   draws the left separator that visually binds each base→current→Δ
   triple (border uses var(--line), so it remaps in dark mode). */
const MetricValueTd: React.FC<{
  value: number
  testid: string
  groupStart?: boolean
}> = ({ value, testid, groupStart }) => (
  <td
    data-testid={testid}
    className={`px-3 py-4 whitespace-nowrap text-right text-sm text-gray-900 tabular-nums${
      groupStart ? ' border-l border-[var(--line)]' : ''
    }`}
  >
    {value.toLocaleString()}
  </td>
)

/* Per-tier display label + chip style. Pre-Distinguished districts get
   an em-dash; achieved tiers get a colored chip matching the tier. */
type AchievedTier = Exclude<DistinguishedDistrictTier, 'NotDistinguished'>

const TIER_DISPLAY: Record<AchievedTier, { label: string; className: string }> =
  {
    Distinguished: {
      label: 'Distinguished',
      className: 'bg-tm-true-maroon text-white',
    },
    Select: {
      label: 'Select',
      className: 'bg-tm-cool-gray text-gray-900',
    },
    Presidents: {
      label: "President's",
      className: 'bg-tm-happy-yellow text-gray-900',
    },
    Smedley: {
      label: 'Smedley',
      className: 'bg-purple-200 text-purple-900',
    },
  }

const TierTd: React.FC<{ tier: DistinguishedDistrictTier | null }> = ({
  tier,
}) => {
  if (!tier || tier === 'NotDistinguished') {
    return (
      <td
        data-testid="tier-cell"
        className="px-3 py-4 whitespace-nowrap text-right text-sm text-gray-400"
      >
        —
      </td>
    )
  }
  const config = TIER_DISPLAY[tier]
  return (
    <td
      data-testid="tier-cell"
      className="px-3 py-4 whitespace-nowrap text-right"
    >
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${config.className}`}
      >
        {config.label}
      </span>
    </td>
  )
}

/* Trailing remaining-to-Distinguished + officer-award + tier cells for
   one district row. The three numeric columns (#688, epic #683 F4) show
   the ABSOLUTE count remaining to the minimum Distinguished tier — paid
   clubs / payments / distinguished clubs, Amy's spreadsheet order —
   replacing the percentage-point prerequisite columns. Folds the awards
   lookup so the row map stays a clean list of sub-components. */
const DistinguishedCells: React.FC<{
  districtId: string
  awards: import('../services/cdn').CompetitiveAwardStandings | null
  ranking: import('../utils/distinguishedCountdown').RemainingInputs
}> = ({ districtId, awards, ranking }) => {
  const c = getDistinguishedCountdown(districtId, awards, ranking)
  const tier = awards?.distinguishedDistrict?.[districtId]?.currentTier ?? null
  return (
    <>
      <CountdownTd
        metric="paidClubsRemaining"
        cell={c?.paidClubsRemaining ?? null}
        groupStart
      />
      <CountdownTd
        metric="paymentsRemaining"
        cell={c?.paymentsRemaining ?? null}
      />
      <CountdownTd
        metric="distinguishedClubsRemaining"
        cell={c?.distinguishedClubsRemaining ?? null}
      />
      <CountdownTd
        metric="educationTraining"
        cell={c?.educationTraining ?? null}
        groupStart
      />
      <CountdownTd metric="clubGrowth" cell={c?.clubGrowth ?? null} />
      <TierTd tier={tier} />
    </>
  )
}

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

  // Distinguished District prerequisite gaps. Pin to the rankings
  // snapshot date so the countdown/tier columns can never drift to a
  // newer snapshot than the row they describe — two independent "latest"
  // calls would race during a publish.
  const { data: awards } = useCompetitiveAwards(data?.date)

  // No useMemo — list is small (≤ ~10 districts) and the page is
  // route-level. The React Compiler manages memoization automatically.
  const regionDistricts: DistrictRanking[] =
    data?.rankings && region
      ? data.rankings
          .filter(r => r.region === region)
          .sort((a, b) => (b.aggregateScore ?? 0) - (a.aggregateScore ?? 0))
      : []

  // Rank within the region by aggregateScore desc. Ties share rank
  // (competition ranking via computeTiedRanks).
  const regionRanks = computeTiedRanks(
    regionDistricts,
    d => d.aggregateScore ?? 0
  )

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
      acc.paidClubBase += d.paidClubBase ?? 0
      acc.totalPayments += d.totalPayments ?? 0
      acc.paymentBase += d.paymentBase ?? 0
      acc.distinguishedClubs += d.distinguishedClubs ?? 0
      return acc
    },
    {
      paidClubs: 0,
      paidClubBase: 0,
      totalPayments: 0,
      paymentBase: 0,
      distinguishedClubs: 0,
    }
  )

  return (
    // #848 — data-grid surface (19-column rankings table); uses the wide
    // --page-max-wide cap, same policy as .districts-page /
    // .district-detail-page (ADR-006 §1). The empty-state branch above
    // stays on .app-shell__page since it's prose, not a data grid.
    <div className="districts-page">
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
        <div className="districts-kpi-card" aria-label="Districts KPI">
          <p className="districts-kpi-card__label">Districts</p>
          <div className="districts-kpi-card__value">
            {regionDistricts.length}
          </div>
        </div>
        <KpiCard
          label="Paid Clubs"
          base={totals.paidClubBase}
          current={totals.paidClubs}
        />
        <KpiCard
          label="Payments"
          base={totals.paymentBase}
          current={totals.totalPayments}
        />
        {/* Distinguished is year-cumulative — every July 1 the count
            resets to zero. Treating base as 0 is semantically correct
            and makes Δ equal to the current count. */}
        <KpiCard
          label="Distinguished Clubs"
          base={0}
          current={totals.distinguishedClubs}
        />
      </div>

      <div className="districts-rankings-table-wrap">
        {/* Intentional, documented horizontal scroll (#689, epic #683 F-mobile).
            A 19-column ranking table can't fit a phone; collapsing to cards
            would destroy the cross-row comparison that is the table's whole
            purpose (ron-ux). Instead the scroll is made non-trap:
            role=region + tabIndex + aria-label make it keyboard-operable
            (WCAG 2.1.1 / axe scrollable-region-focusable); the sticky identity
            columns keep each row labelled; the scroll-cue overlay signals more
            columns to the right. */}
        <div
          className="overflow-x-auto region-rankings__scroll"
          role="region"
          tabIndex={0}
          aria-label={`Region ${region} district rankings — scroll horizontally to see all metrics`}
        >
          <table
            className="districts-rankings-table"
            aria-label={`Region ${region} district rankings`}
          >
            {/* Two-tier header (#687). The four liked single columns span
                both rows; each metric is a base→current→Δ group with a
                colspan group label over Base / Current / Δ sub-headers. */}
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  scope="col"
                  className="region-rankings__sticky-col region-rankings__sticky-col--rank px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-bottom"
                >
                  Region Rank
                </th>
                <th
                  rowSpan={2}
                  scope="col"
                  className="region-rankings__sticky-col region-rankings__sticky-col--district px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-bottom"
                >
                  District
                </th>
                <th
                  rowSpan={2}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-bottom"
                >
                  World Rank
                </th>
                <th
                  rowSpan={2}
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider align-bottom"
                >
                  Score
                </th>
                {/* Three base→current→Δ metric groups (Amy's request). */}
                <th
                  colSpan={3}
                  scope="colgroup"
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-[var(--line)]"
                >
                  Paid Clubs
                </th>
                <th
                  colSpan={3}
                  scope="colgroup"
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-[var(--line)]"
                >
                  Membership Payments
                </th>
                <th
                  colSpan={3}
                  scope="colgroup"
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-[var(--line)]"
                >
                  Distinguished Clubs
                </th>
                {/* Remaining-to-minimum-Distinguished columns (#688, epic
                    #683 F4). Replaces the former percentage-point gap
                    columns — Amy wants the absolute count, not the %.
                    One banner over three sub-columns in spreadsheet order:
                    paid clubs / payments / distinguished clubs. */}
                <th
                  colSpan={3}
                  scope="colgroup"
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-[var(--line)]"
                  title="Absolute count of each metric still needed to reach the minimum Distinguished tier"
                >
                  Remaining to Distinguished
                </th>
                <th
                  rowSpan={2}
                  scope="col"
                  className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider align-bottom border-l border-[var(--line)]"
                >
                  Education / Training
                </th>
                {/* CGD = Club Growth Director — TI officer award. Renamed
                    from "Club Growth" to disambiguate from the % Club
                    Growth prerequisite that used to sit to its left. */}
                <th
                  rowSpan={2}
                  scope="col"
                  className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider align-bottom"
                  title="Club Growth Director — officer award"
                >
                  CGD
                </th>
                {/* Current Distinguished tier when achieved; em-dash
                    for districts still below. */}
                <th
                  rowSpan={2}
                  scope="col"
                  className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider align-bottom"
                >
                  Tier
                </th>
              </tr>
              {/* Sub-header row: Base / Current / Δ under each metric group,
                  then the three Remaining-to-Distinguished sub-columns. */}
              <tr>
                {[
                  'Paid Clubs',
                  'Membership Payments',
                  'Distinguished Clubs',
                ].flatMap(group =>
                  ['Base', 'Current', 'Δ'].map((sub, j) => (
                    <th
                      key={`${group}-${sub}`}
                      scope="col"
                      title={`${group} — ${sub === 'Δ' ? 'change vs base' : sub}`}
                      className={`px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider${
                        j === 0 ? ' border-l border-[var(--line)]' : ''
                      }`}
                    >
                      {sub}
                    </th>
                  ))
                )}
                {/* #688: absolute count still needed for each metric, in
                    Amy's spreadsheet order. The group banner above carries
                    the "remaining to Distinguished" framing. */}
                {[
                  { label: 'Clubs', title: 'Paid clubs still needed' },
                  {
                    label: 'Payments',
                    title: 'Membership payments still needed',
                  },
                  {
                    label: 'Dist. Clubs',
                    title: 'Distinguished clubs still needed',
                  },
                ].map((col, j) => (
                  <th
                    key={`remaining-${col.label}`}
                    scope="col"
                    title={col.title}
                    className={`px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider${
                      j === 0 ? ' border-l border-[var(--line)]' : ''
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regionDistricts.map((d, i) => {
                const rank = regionRanks[i]!
                return (
                  <tr
                    key={d.districtId}
                    className="cursor-pointer"
                    onClick={() => navigate(`/district/${d.districtId}`)}
                  >
                    <td
                      data-testid="region-rank-cell"
                      className="region-rankings__sticky-col region-rankings__sticky-col--rank px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 tabular-nums"
                    >
                      #{rank.rank}
                      {rank.isTied && (
                        <span className="ml-1 text-xs text-gray-600 font-normal">
                          (tied)
                        </span>
                      )}
                    </td>
                    <td
                      data-testid="region-district-cell"
                      className="region-rankings__sticky-col region-rankings__sticky-col--district px-6 py-4 whitespace-nowrap"
                    >
                      <DistrictChipAndName
                        districtId={d.districtId}
                        name={d.districtName}
                        ariaHidden
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{d.overallRank}
                    </td>
                    <td
                      data-testid="score-cell"
                      className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 tabular-nums"
                    >
                      {d.aggregateScore}
                    </td>
                    {/* Paid Clubs: base → current → signed net growth (#1).
                        Net growth prefers the snapshot field, falling back
                        to paidClubs − paidClubBase (lesson 102). */}
                    <MetricValueTd
                      testid="paid-base"
                      value={d.paidClubBase ?? 0}
                      groupStart
                    />
                    <MetricValueTd
                      testid="paid-current"
                      value={d.paidClubs ?? 0}
                    />
                    <SignedDeltaTd
                      testid="countdown-netClubGrowth"
                      value={
                        awards?.distinguishedDistrict?.[d.districtId]
                          ?.netClubGrowth ??
                        (d.paidClubs ?? 0) - (d.paidClubBase ?? 0)
                      }
                    />
                    {/* Membership Payments: base → current → signed Δ. */}
                    <MetricValueTd
                      testid="payments-base"
                      value={d.paymentBase ?? 0}
                      groupStart
                    />
                    <MetricValueTd
                      testid="payments-current"
                      value={d.totalPayments ?? 0}
                    />
                    <SignedDeltaTd
                      testid="payments-delta"
                      value={(d.totalPayments ?? 0) - (d.paymentBase ?? 0)}
                    />
                    {/* Distinguished Clubs: year-cumulative, so base = 0 and
                        Δ = current (lesson 57). */}
                    <MetricValueTd testid="dist-base" value={0} groupStart />
                    <MetricValueTd
                      testid="dist-current"
                      value={d.distinguishedClubs ?? 0}
                    />
                    <SignedDeltaTd
                      testid="dist-delta"
                      value={d.distinguishedClubs ?? 0}
                    />
                    <DistinguishedCells
                      districtId={d.districtId}
                      awards={awards ?? null}
                      ranking={{
                        paidClubBase: d.paidClubBase ?? 0,
                        paymentBase: d.paymentBase ?? 0,
                        paidClubs: d.paidClubs ?? 0,
                        totalPayments: d.totalPayments ?? 0,
                        distinguishedClubs: d.distinguishedClubs ?? 0,
                      }}
                    />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Right-edge fade: a discoverability cue that the table scrolls for
            more columns. Themed (transparent → --surface, remaps in dark),
            pointer-events:none so it never blocks taps or scrolling. */}
        <div className="region-rankings__scroll-cue" aria-hidden="true" />
      </div>
    </div>
  )
}

export default RegionPage
