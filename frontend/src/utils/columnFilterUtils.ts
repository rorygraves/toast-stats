/**
 * Pure utility functions for column filtering.
 *
 * Extracted from useColumnFilters hook to enable unit testing
 * of filter logic without React rendering overhead.
 */

import type { ClubTrend } from '../hooks/useDistrictAnalytics'
import type {
  ColumnFilter,
  ProcessedClubTrend,
} from '../components/filters/types'
import { getClubAnniversary } from './clubAnniversary'
import {
  deriveGoalContext,
  computeMembersToDistinguished,
} from './membersToDistinguished'
import { calculateClubProjection } from './dcpProjections'

// ========== Data Processing Functions ==========

/**
 * Get latest membership count from club trend data
 */
export function getLatestMembership(club: ClubTrend): number {
  if (club.membershipTrend.length === 0) return 0
  return club.membershipTrend[club.membershipTrend.length - 1]?.count ?? 0
}

/**
 * Get latest DCP goals from club trend data
 */
export function getLatestDcpGoals(club: ClubTrend): number {
  if (club.dcpGoalsTrend.length === 0) return 0
  return club.dcpGoalsTrend[club.dcpGoalsTrend.length - 1]?.goalsAchieved ?? 0
}

/**
 * Get distinguished order for sorting
 */
export function getDistinguishedOrder(club: ClubTrend): number {
  const order = {
    NotDistinguished: 0,
    Distinguished: 1,
    Select: 2,
    President: 3,
    Smedley: 4,
  }
  return order[club.distinguishedLevel as keyof typeof order] ?? 999
}

/**
 * Get members needed to become distinguished (0 if none or already distinguished)
 */
export function getMembersNeeded(club: ClubTrend): number {
  const projection = calculateClubProjection(club)
  const goalContext = deriveGoalContext(club)
  const result = computeMembersToDistinguished(projection, goalContext)
  return result?.membersNeeded ?? 0
}

/**
 * Process clubs with computed properties for filtering
 */
export function processClubs(
  clubs: ClubTrend[],
  referenceDate: Date = new Date()
): ProcessedClubTrend[] {
  return clubs.map(club => ({
    ...club,
    latestMembership: getLatestMembership(club),
    latestDcpGoals: getLatestDcpGoals(club),
    distinguishedOrder: getDistinguishedOrder(club),
    membersNeeded: getMembersNeeded(club),
    // #448 — Years Chartered column. null when charterDate is absent
    // or invalid, which the table renders as em-dash and sorts to end.
    yearsChartered: club.charterDate
      ? (getClubAnniversary(club.charterDate, referenceDate)?.years ?? null)
      : null,
  }))
}

// ========== Filter Application ==========

/**
 * Apply a single filter to the club data (pure function)
 */
export function applyFilter(
  clubs: ProcessedClubTrend[],
  filter: ColumnFilter
): ProcessedClubTrend[] {
  switch (filter.field) {
    case 'name':
      if (filter.type === 'text' && typeof filter.value === 'string') {
        const searchTerm = filter.value.toLowerCase().trim()
        if (searchTerm === '') return clubs
        return clubs.filter(club => {
          const clubName = club.clubName.toLowerCase()
          if (filter.operator === 'startsWith') {
            return clubName.startsWith(searchTerm)
          }
          return clubName.includes(searchTerm)
        })
      }
      break

    case 'division':
      if (filter.type === 'text' && typeof filter.value === 'string') {
        const searchTerm = filter.value.toLowerCase().trim()
        if (searchTerm === '') return clubs
        return clubs.filter(club => {
          const divisionName = club.divisionName.toLowerCase()
          if (filter.operator === 'startsWith') {
            return divisionName.startsWith(searchTerm)
          }
          return divisionName.includes(searchTerm)
        })
      }
      break

    case 'area':
      if (filter.type === 'text' && typeof filter.value === 'string') {
        const searchTerm = filter.value.toLowerCase().trim()
        if (searchTerm === '') return clubs
        return clubs.filter(club => {
          const areaName = club.areaName.toLowerCase()
          if (filter.operator === 'startsWith') {
            return areaName.startsWith(searchTerm)
          }
          return areaName.includes(searchTerm)
        })
      }
      break

    case 'membership':
      if (filter.type === 'numeric' && Array.isArray(filter.value)) {
        const [min, max] = filter.value as [number | null, number | null]
        if (min === null && max === null) return clubs
        return clubs.filter(club => {
          const membership = club.latestMembership
          if (min !== null && membership < min) return false
          if (max !== null && membership > max) return false
          return true
        })
      }
      break

    case 'dcpGoals':
      if (filter.type === 'numeric' && Array.isArray(filter.value)) {
        const [min, max] = filter.value as [number | null, number | null]
        if (min === null && max === null) return clubs
        return clubs.filter(club => {
          const dcpGoals = club.latestDcpGoals
          if (min !== null && dcpGoals < min) return false
          if (max !== null && dcpGoals > max) return false
          return true
        })
      }
      break

    case 'membersNeeded':
      if (filter.type === 'numeric' && Array.isArray(filter.value)) {
        const [min, max] = filter.value as [number | null, number | null]
        if (min === null && max === null) return clubs
        return clubs.filter(club => {
          const membersNeeded = club.membersNeeded
          if (min !== null && membersNeeded < min) return false
          if (max !== null && membersNeeded > max) return false
          return true
        })
      }
      break

    case 'distinguished':
      if (filter.type === 'categorical' && Array.isArray(filter.value)) {
        const selectedValues = filter.value as string[]
        if (selectedValues.length === 0) return clubs
        return clubs.filter(club => {
          return (
            club.distinguishedLevel &&
            selectedValues.includes(club.distinguishedLevel)
          )
        })
      }
      break

    case 'status':
      if (filter.type === 'categorical' && Array.isArray(filter.value)) {
        const selectedValues = filter.value as string[]
        if (selectedValues.length === 0) return clubs
        return clubs.filter(club => selectedValues.includes(club.currentStatus))
      }
      break

    case 'clubStatus':
      if (filter.type === 'categorical' && Array.isArray(filter.value)) {
        const selectedValues = filter.value as string[]
        if (selectedValues.length === 0) return clubs
        return clubs.filter(club => {
          return club.clubStatus && selectedValues.includes(club.clubStatus)
        })
      }
      break

    case 'octoberRenewals':
      if (filter.type === 'numeric' && Array.isArray(filter.value)) {
        const [min, max] = filter.value as [number | null, number | null]
        if (min === null && max === null) return clubs
        return clubs.filter(club => {
          const value = club.octoberRenewals
          if (value === undefined) return false
          if (min !== null && value < min) return false
          if (max !== null && value > max) return false
          return true
        })
      }
      break

    case 'aprilRenewals':
      if (filter.type === 'numeric' && Array.isArray(filter.value)) {
        const [min, max] = filter.value as [number | null, number | null]
        if (min === null && max === null) return clubs
        return clubs.filter(club => {
          const value = club.aprilRenewals
          if (value === undefined) return false
          if (min !== null && value < min) return false
          if (max !== null && value > max) return false
          return true
        })
      }
      break

    case 'newMembers':
      if (filter.type === 'numeric' && Array.isArray(filter.value)) {
        const [min, max] = filter.value as [number | null, number | null]
        if (min === null && max === null) return clubs
        return clubs.filter(club => {
          const value = club.newMembers
          if (value === undefined) return false
          if (min !== null && value < min) return false
          if (max !== null && value > max) return false
          return true
        })
      }
      break

    default:
      return clubs
  }
  return clubs
}

/**
 * Apply all active filters using AND logic (pure function)
 */
export function applyAllFilters(
  clubs: ProcessedClubTrend[],
  filters: ColumnFilter[]
): ProcessedClubTrend[] {
  if (filters.length === 0) return clubs
  return filters.reduce((filtered, filter) => {
    return applyFilter(filtered, filter)
  }, clubs)
}
