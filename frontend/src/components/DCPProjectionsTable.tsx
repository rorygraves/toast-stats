import React, { useState, useMemo } from 'react'
import type { ClubTrend } from '../hooks/useDistrictAnalytics'
import {
  calculateClubProjections,
  type ClubDCPProjection,
  type DistinguishedLevel,
} from '../utils/dcpProjections'
import { LoadingSkeleton } from './LoadingSkeleton'

// --- Types ---

type SortField =
  | 'clubName'
  | 'goals'
  | 'members'
  | 'currentLevel'
  | 'gapToNext'
  | 'projectedLevel'
  | 'aprilRenewals'

type SortDirection = 'asc' | 'desc'
type FilterTier = 'all' | DistinguishedLevel

// --- Constants ---

const TIER_ORDER: Record<DistinguishedLevel, number> = {
  NotDistinguished: 0,
  Distinguished: 1,
  Select: 2,
  President: 3,
  Smedley: 4,
}

const TIER_BADGE_STYLES: Record<
  DistinguishedLevel,
  { bg: string; text: string }
> = {
  Smedley: { bg: 'bg-amber-100', text: 'text-amber-800' },
  President: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Select: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  Distinguished: { bg: 'bg-green-100', text: 'text-green-800' },
  NotDistinguished: { bg: 'bg-gray-100', text: 'text-gray-500' },
}

// --- Helpers ---

function totalGap(gap: { goals: number; members: number }): number {
  return gap.goals + gap.members
}

function getNextTierGap(
  proj: ClubDCPProjection
): { goals: number; members: number } | null {
  const level = proj.currentLevel
  if (level === 'Smedley') return null
  if (level === 'President') return proj.gapToSmedley
  if (level === 'Select') return proj.gapToPresident
  if (level === 'Distinguished') return proj.gapToSelect
  return proj.gapToDistinguished // NotDistinguished
}

// --- Sub-components ---

const SortIcon: React.FC<{
  field: SortField
  activeSortField: SortField
  activeSortDirection: SortDirection
}> = ({ field, activeSortField, activeSortDirection }) => {
  if (activeSortField !== field)
    return <span className="text-gray-300 ml-1">↕</span>
  return (
    <span className="text-tm-loyal-blue ml-1">
      {activeSortDirection === 'asc' ? '↑' : '↓'}
    </span>
  )
}

const TierBadge: React.FC<{ level: DistinguishedLevel }> = ({ level }) => {
  if (level === 'NotDistinguished') {
    return <span className="text-sm text-gray-400">—</span>
  }
  const style = TIER_BADGE_STYLES[level]
  return (
    <span
      className={`px-1.5 py-0.5 text-xs font-medium rounded-sm ${style.bg} ${style.text}`}
    >
      {level === 'President' ? "President's" : level}
    </span>
  )
}

// --- Component ---

interface DCPProjectionsTableProps {
  clubs: ClubTrend[]
  isLoading?: boolean
}

export const DCPProjectionsTable: React.FC<DCPProjectionsTableProps> = ({
  clubs,
  isLoading = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('gapToNext')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterTier, setFilterTier] = useState<FilterTier>('all')
  const [filterDivision, setFilterDivision] = useState<string>('all')
  const [showCloseOnly, setShowCloseOnly] = useState(false)

  // Compute projections
  const projections = useMemo(() => calculateClubProjections(clubs), [clubs])

  // Get unique divisions for filter
  const divisions = useMemo(() => {
    const divSet = new Set(projections.map(p => p.division))
    return Array.from(divSet).sort()
  }, [projections])

  // Filter
  const filtered = useMemo(() => {
    let result = projections

    if (filterTier !== 'all') {
      result = result.filter(p => p.currentLevel === filterTier)
    }

    if (filterDivision !== 'all') {
      result = result.filter(p => p.division === filterDivision)
    }

    if (showCloseOnly) {
      // "Close" = within 2 goals or 2 members of next tier
      result = result.filter(p => {
        const gap = getNextTierGap(p)
        if (!gap) return false // already Smedley
        return gap.goals <= 2 && gap.members <= 2
      })
    }

    return result
  }, [projections, filterTier, filterDivision, showCloseOnly])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0

      switch (sortField) {
        case 'clubName':
          cmp = a.clubName.localeCompare(b.clubName)
          break
        case 'goals':
          cmp = a.currentGoals - b.currentGoals
          break
        case 'members':
          cmp = a.currentMembers - b.currentMembers
          break
        case 'currentLevel':
          cmp = TIER_ORDER[a.currentLevel] - TIER_ORDER[b.currentLevel]
          break
        case 'gapToNext': {
          const gapA = getNextTierGap(a)
          const gapB = getNextTierGap(b)
          // Clubs with no next tier (Smedley) sort to end
          if (!gapA && !gapB) cmp = 0
          else if (!gapA) cmp = 1
          else if (!gapB) cmp = -1
          else cmp = totalGap(gapA) - totalGap(gapB)
          break
        }
        case 'projectedLevel':
          cmp = TIER_ORDER[a.projectedLevel] - TIER_ORDER[b.projectedLevel]
          break
        case 'aprilRenewals': {
          const aVal = a.aprilRenewals ?? -1
          const bVal = b.aprilRenewals ?? -1
          cmp = aVal - bVal
          break
        }
      }

      if (sortDirection === 'desc') cmp = -cmp
      // Secondary sort by club name
      if (cmp === 0) cmp = a.clubName.localeCompare(b.clubName)
      return cmp
    })
  }, [filtered, sortField, sortDirection])

  // Summary stats
  const summary = useMemo(() => {
    const counts: Record<DistinguishedLevel, number> = {
      NotDistinguished: 0,
      Distinguished: 0,
      Select: 0,
      President: 0,
      Smedley: 0,
    }
    let closeToUpgrade = 0
    let projectedUpgrades = 0

    for (const p of projections) {
      counts[p.currentLevel]++

      const gap = getNextTierGap(p)
      if (gap && gap.goals <= 2 && gap.members <= 2) closeToUpgrade++
      if (TIER_ORDER[p.projectedLevel] > TIER_ORDER[p.currentLevel])
        projectedUpgrades++
    }

    return { counts, closeToUpgrade, projectedUpgrades }
  }, [projections])

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  if (isLoading) {
    return (
      <div className="redesign-panel">
        <h3 className="text-xl font-bold text-gray-900 font-tm-headline mb-4">
          DCP Projections
        </h3>
        <LoadingSkeleton variant="table" count={5} />
      </div>
    )
  }

  return (
    <div className="redesign-panel" data-testid="dcp-projections-table">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 font-tm-headline mb-4">
          📊 DCP Projections
        </h3>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {summary.counts.NotDistinguished}
            </div>
            <div className="text-xs text-gray-500">Not Distinguished</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">
              {summary.counts.Distinguished +
                summary.counts.Select +
                summary.counts.President +
                summary.counts.Smedley}
            </div>
            <div className="text-xs text-green-600">Distinguished+</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-700">
              {summary.closeToUpgrade}
            </div>
            <div className="text-xs text-amber-600">Close to Next Tier</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">
              {summary.projectedUpgrades}
            </div>
            <div className="text-xs text-blue-600">Projected Upgrades</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filterTier}
            onChange={e => setFilterTier(e.target.value as FilterTier)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:ring-tm-loyal-blue focus:border-tm-loyal-blue"
            aria-label="Filter by tier"
          >
            <option value="all">All Tiers</option>
            <option value="NotDistinguished">Not Distinguished</option>
            <option value="Distinguished">Distinguished</option>
            <option value="Select">Select</option>
            <option value="President">President&apos;s</option>
            <option value="Smedley">Smedley</option>
          </select>

          <select
            value={filterDivision}
            onChange={e => setFilterDivision(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:ring-tm-loyal-blue focus:border-tm-loyal-blue"
            aria-label="Filter by division"
          >
            <option value="all">All Divisions</option>
            {divisions.map(div => (
              <option key={div} value={div}>
                Division {div}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showCloseOnly}
              onChange={e => setShowCloseOnly(e.target.checked)}
              className="rounded border-gray-300 text-tm-loyal-blue focus:ring-tm-loyal-blue"
            />
            Close to next tier only
          </label>

          <span className="text-sm text-gray-500 ml-auto">
            {sorted.length} of {projections.length} clubs
          </span>
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          No clubs match the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('clubName')}
                >
                  Club{' '}
                  <SortIcon
                    field="clubName"
                    activeSortField={sortField}
                    activeSortDirection={sortDirection}
                  />
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Div
                </th>
                <th
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('goals')}
                >
                  Goals{' '}
                  <SortIcon
                    field="goals"
                    activeSortField={sortField}
                    activeSortDirection={sortDirection}
                  />
                </th>
                <th
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('members')}
                >
                  Members{' '}
                  <SortIcon
                    field="members"
                    activeSortField={sortField}
                    activeSortDirection={sortDirection}
                  />
                </th>
                <th
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('currentLevel')}
                >
                  Level{' '}
                  <SortIcon
                    field="currentLevel"
                    activeSortField={sortField}
                    activeSortDirection={sortDirection}
                  />
                </th>
                <th
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('gapToNext')}
                >
                  Gap to Next{' '}
                  <SortIcon
                    field="gapToNext"
                    activeSortField={sortField}
                    activeSortDirection={sortDirection}
                  />
                </th>
                <th
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('aprilRenewals')}
                >
                  Apr. Renewals{' '}
                  <SortIcon
                    field="aprilRenewals"
                    activeSortField={sortField}
                    activeSortDirection={sortDirection}
                  />
                </th>
                <th
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('projectedLevel')}
                >
                  Projected{' '}
                  <SortIcon
                    field="projectedLevel"
                    activeSortField={sortField}
                    activeSortDirection={sortDirection}
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sorted.map(proj => {
                const gap = getNextTierGap(proj)
                const isClose = gap && gap.goals <= 2 && gap.members <= 2
                const willUpgrade =
                  TIER_ORDER[proj.projectedLevel] >
                  TIER_ORDER[proj.currentLevel]

                return (
                  <tr
                    key={proj.clubId}
                    className={`hover:bg-gray-50 transition-colors ${
                      isClose ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {proj.clubName}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm text-gray-600">
                      {proj.division}
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm tabular-nums text-gray-900">
                      {proj.currentGoals}/10
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm tabular-nums text-gray-900">
                      {proj.currentMembers}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <TierBadge level={proj.currentLevel} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {gap ? (
                        <span
                          className={`text-sm ${
                            isClose
                              ? 'font-semibold text-amber-700'
                              : 'text-gray-600'
                          }`}
                        >
                          {proj.closestTierAbove}
                        </span>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">
                          ✓ Max
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm tabular-nums">
                      {proj.aprilRenewals !== null ? (
                        <span
                          className={
                            proj.aprilRenewals === 0
                              ? 'text-red-500'
                              : 'text-gray-900'
                          }
                        >
                          {proj.aprilRenewals}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {willUpgrade ? (
                        <span className="inline-flex items-center gap-1">
                          <TierBadge level={proj.projectedLevel} />
                          <span className="text-green-600 text-xs">▲</span>
                        </span>
                      ) : (
                        <TierBadge level={proj.projectedLevel} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
