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

/* Cell renderer for the Distinguished countdown columns. Numeric gaps
   render as +N (maroon); metric-met as ✓ (green); boolean (officer
   awards) as ✓ or em-dash. Em-dash when the cell prop is null
   (district missing from awards or legacy snapshot). */
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
      +{cell.value}
    </span>
  )
}

const CountdownTd: React.FC<{
  metric: keyof import('../utils/distinguishedCountdown').DistinguishedCountdown
  cell: CountdownCell | null
}> = ({ metric, cell }) => (
  <td
    data-testid={`countdown-${metric}`}
    className="px-3 py-4 whitespace-nowrap text-sm text-right"
  >
    {renderCountdownInner(cell)}
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

/* Trailing six cells (5 countdown + 1 tier) for one district row.
   Folds the awards lookup so the row map stays a clean list of
   sub-components. */
const DistinguishedCells: React.FC<{
  districtId: string
  awards: import('../services/cdn').CompetitiveAwardStandings | null
}> = ({ districtId, awards }) => {
  const c = getDistinguishedCountdown(districtId, awards)
  const tier = awards?.distinguishedDistrict?.[districtId]?.currentTier ?? null
  return (
    <>
      <CountdownTd metric="netClubGrowth" cell={c?.netClubGrowth ?? null} />
      <CountdownTd metric="paymentGrowth" cell={c?.paymentGrowth ?? null} />
      <CountdownTd
        metric="distinguishedPercent"
        cell={c?.distinguishedPercent ?? null}
      />
      <CountdownTd
        metric="clubGrowthPercent"
        cell={c?.clubGrowthPercent ?? null}
      />
      <CountdownTd
        metric="educationTraining"
        cell={c?.educationTraining ?? null}
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
        <div className="overflow-x-auto">
          <table className="districts-rankings-table">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region Rank
                </th>
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
                {/* Show the gap to the next Distinguished tier per
                    district: numeric for the three DD prerequisites that
                    the pipeline calculates a delta for, ✓ / em-dash for
                    the two officer-award booleans. */}
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Club Growth
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Growth
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distinguished %
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Club Growth %
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Education / Training
                </th>
                {/* CGD = Club Growth Director — TI officer award. Renamed
                    from "Club Growth" to disambiguate from the % Club
                    Growth prerequisite immediately to its left. Title
                    attribute spells out the acronym for non-TM viewers. */}
                <th
                  className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  title="Club Growth Director — officer award"
                >
                  CGD
                </th>
                {/* Current Distinguished tier when achieved; em-dash
                    for districts still below. */}
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
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
                      className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 tabular-nums"
                    >
                      #{rank.rank}
                      {rank.isTied && (
                        <span className="ml-1 text-xs text-gray-400 font-normal">
                          (tied)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        data-testid={`district-number-chip-D${d.districtId}`}
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
                    <DistinguishedCells
                      districtId={d.districtId}
                      awards={awards ?? null}
                    />
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

export default RegionPage
