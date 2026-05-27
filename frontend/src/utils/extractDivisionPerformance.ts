/**
 * Data Extraction Module for Division and Area Performance
 *
 * This module provides functions to extract division and area performance data
 * from district snapshot JSON structures. It transforms raw snapshot data into
 * typed performance structures suitable for rendering in the UI.
 *
 * Requirements: 1.4, 7.1, 7.2
 */

import type {
  DivisionPerformance,
  AreaPerformance,
  VisitStatus,
} from './divisionStatus.js'
import {
  calculateRequiredDistinguishedClubs,
  calculateNetGrowth,
  calculateVisitStatus,
  calculateDivisionStatus,
  calculateAreaStatus,
  checkAreaQualifying,
} from './divisionStatus.js'
import { logger } from './logger'

/**
 * Determines the distinguished level for a club based on DCP criteria
 * Uses the same logic as DistinguishedClubAnalyticsModule for consistency
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * @param club - Raw club data record from CSV
 * @returns Distinguished level or null if not distinguished
 */
export function determineDistinguishedLevel(
  club: Record<string, unknown>
): 'Smedley' | 'Presidents' | 'Select' | 'Distinguished' | null {
  // Requirement 3.5: CSP requirement for 2025-2026+
  // Check if CSP field exists and if so, require it to be submitted
  const cspSubmitted = getCSPStatus(club)
  if (!cspSubmitted) {
    // Club cannot be distinguished without CSP (when CSP field is present)
    return null
  }

  // Requirement 3.2: Check "Club Distinguished Status" field as primary source
  const statusField = club['Club Distinguished Status']
  const extractedLevel = extractDistinguishedLevelFromStatus(statusField)

  if (extractedLevel !== null) {
    return extractedLevel
  }

  // Requirement 3.3: Calculate from DCP goals, membership, and net growth if status field is missing
  const dcpGoals = parseIntSafe(club['Goals Met'])
  const membership = parseIntSafe(
    club['Active Members'] ??
      club['Active Membership'] ??
      club['Membership'] ??
      club['Paid Members']
  )
  const netGrowth = calculateClubNetGrowth(club)

  return calculateDistinguishedLevelFromCriteria(
    dcpGoals,
    membership,
    netGrowth
  )
}

/**
 * Extracts distinguished level from Club Distinguished Status field
 *
 * @param statusField - Value from "Club Distinguished Status" field
 * @returns Distinguished level or null if not found/empty
 */
function extractDistinguishedLevelFromStatus(
  statusField: unknown
): 'Smedley' | 'Presidents' | 'Select' | 'Distinguished' | null {
  if (statusField === null || statusField === undefined) {
    return null
  }

  const status = String(statusField).toLowerCase().trim()

  if (status === '' || status === 'none' || status === 'n/a') {
    return null
  }

  // Check for Smedley Distinguished (highest level)
  if (status.includes('smedley')) {
    return 'Smedley'
  }

  // Check for President's Distinguished
  if (status.includes('president')) {
    return 'Presidents'
  }

  // Check for Select Distinguished
  if (status.includes('select')) {
    return 'Select'
  }

  // Check for Distinguished (base level)
  if (status.includes('distinguished')) {
    return 'Distinguished'
  }

  return null
}

/**
 * Calculates distinguished level based on DCP goals, membership, and net growth
 *
 * Distinguished Level Criteria (from Toastmasters DCP):
 * - Smedley Distinguished: 10 goals + 25 members
 * - President's Distinguished: 9 goals + 20 members
 * - Select Distinguished: 7 goals + (20 members OR net growth of 5)
 * - Distinguished: 5 goals + (20 members OR net growth of 3)
 *
 * @param dcpGoals - Number of DCP goals achieved
 * @param membership - Current active membership count
 * @param netGrowth - Net membership growth (current - base)
 * @returns Distinguished level or null if not distinguished
 */
function calculateDistinguishedLevelFromCriteria(
  dcpGoals: number,
  membership: number,
  netGrowth: number
): 'Smedley' | 'Presidents' | 'Select' | 'Distinguished' | null {
  // Smedley Distinguished: 10 goals + 25 members
  if (dcpGoals >= 10 && membership >= 25) {
    return 'Smedley'
  }

  // President's Distinguished: 9 goals + 20 members
  if (dcpGoals >= 9 && membership >= 20) {
    return 'Presidents'
  }

  // Select Distinguished: 7 goals + (20 members OR net growth of 5)
  if (dcpGoals >= 7 && (membership >= 20 || netGrowth >= 5)) {
    return 'Select'
  }

  // Distinguished: 5 goals + (20 members OR net growth of 3)
  if (dcpGoals >= 5 && (membership >= 20 || netGrowth >= 3)) {
    return 'Distinguished'
  }

  return null
}

/**
 * Gets CSP (Club Success Plan) submission status from club data
 *
 * CSP data availability by program year:
 * - 2025-2026 and later: CSP field is guaranteed to be present
 * - Prior to 2025-2026: CSP field did not exist, defaults to true
 *
 * @param club - Raw club data record
 * @returns true if CSP is submitted or field is absent (historical data), false otherwise
 */
function getCSPStatus(club: Record<string, unknown>): boolean {
  // Check for CSP field in various possible formats
  const cspValue =
    club['CSP'] ??
    club['Club Success Plan'] ??
    club['CSP Submitted'] ??
    club['Club Success Plan Submitted']

  // Historical data compatibility: if field doesn't exist (pre-2025-2026 data), assume submitted
  if (cspValue === undefined || cspValue === null) {
    return true
  }

  // Parse the value
  const cspString = String(cspValue).toLowerCase().trim()

  // Check for positive indicators
  if (
    cspString === 'yes' ||
    cspString === 'true' ||
    cspString === '1' ||
    cspString === 'submitted' ||
    cspString === 'y'
  ) {
    return true
  }

  // Check for negative indicators
  if (
    cspString === 'no' ||
    cspString === 'false' ||
    cspString === '0' ||
    cspString === 'not submitted' ||
    cspString === 'n'
  ) {
    return false
  }

  // Default to true for unknown values (historical data compatibility)
  return true
}

/**
 * Calculates net growth for a club (Active Members - Mem. Base)
 *
 * @param club - Raw club data record
 * @returns Net membership growth
 */
function calculateClubNetGrowth(club: Record<string, unknown>): number {
  const currentMembers = parseIntSafe(
    club['Active Members'] ??
      club['Active Membership'] ??
      club['Membership'] ??
      club['Paid Members']
  )

  const membershipBase = parseIntSafe(club['Mem. Base'] ?? club['Base'])

  return currentMembers - membershipBase
}

/**
 * Safely parses a value to an integer, returning 0 for invalid values
 *
 * @param value - Value to parse
 * @returns Parsed integer or 0 if invalid
 */
function parseIntSafe(value: unknown): number {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return Math.floor(value)
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? 0 : parsed
  }

  return 0
}

/**
 * Counts the number of clubs with completed visits for a given visit field
 *
 * This function iterates through all clubs and counts those with "1" in the
 * specified visit field. Only the exact value "1" is counted as completed.
 * Any other value (including "0", empty string, missing field, or invalid data)
 * is NOT counted as a completed visit.
 *
 * Requirements: 4.2, 5.2
 *
 * @param clubs - Array of club records (unknown type for safety)
 * @param visitField - Field name ("Nov Visit award" or "May Visit award")
 * @returns Number of clubs with "1" in the visit field
 *
 * @example
 * const clubs = [
 *   { "Nov Visit award": "1" },
 *   { "Nov Visit award": "0" },
 *   { "Nov Visit award": "1" },
 *   { }  // missing field
 * ]
 * countVisitCompletions(clubs, "Nov Visit award") // Returns 2
 */
export function countVisitCompletions(
  clubs: unknown[],
  visitField: string
): number {
  let count = 0

  for (const clubRaw of clubs) {
    // Type guard: ensure club is an object
    if (typeof clubRaw !== 'object' || clubRaw === null) {
      continue
    }

    const club = clubRaw as Record<string, unknown>
    const visitValue = club[visitField]

    // Only count "1" as completed
    // Requirement 4.2/5.2: Count each club that has "1" in the visit field
    // Any other value (including "0", empty, invalid, missing) is NOT counted
    if (visitValue === '1' || visitValue === 1) {
      count++
    }
  }

  return count
}

/**
 * Extracts area visit data from snapshot JSON
 *
 * Retrieves first round visits from "Nov Visit award" field and second round
 * visits from "May visit award" field. Handles missing visit data gracefully
 * by treating missing values as zero completed visits.
 *
 * @param areaData - Raw area data from district snapshot (unknown type for safety)
 * @param clubBase - Number of clubs at the start of the program year
 * @returns Object containing first round and second round visit status
 *
 * @example
 * const areaData = { "Nov Visit award": "3", "May visit award": "4" }
 * const result = extractVisitData(areaData, 4)
 * // Returns: {
 * //   firstRound: { completed: 3, required: 3, percentage: 75, meetsThreshold: true },
 * //   secondRound: { completed: 4, required: 3, percentage: 100, meetsThreshold: true }
 * // }
 *
 * Requirements: 7.1, 7.2, 7.5
 */
export function extractVisitData(
  areaData: unknown,
  clubBase: number
): { firstRound: VisitStatus; secondRound: VisitStatus } {
  // Type guard: ensure areaData is an object
  if (typeof areaData !== 'object' || areaData === null) {
    // Missing area data - return zero visits for both rounds
    return {
      firstRound: calculateVisitStatus(0, clubBase),
      secondRound: calculateVisitStatus(0, clubBase),
    }
  }

  // Cast to record type for property access
  const data = areaData as Record<string, unknown>

  // Extract first round visits from "Nov Visit award"
  const novVisitRaw = data['Nov Visit award']
  const firstRoundCompleted =
    typeof novVisitRaw === 'string' || typeof novVisitRaw === 'number'
      ? Number(novVisitRaw)
      : 0

  // Extract second round visits from "May Visit award"
  const mayVisitRaw = data['May Visit award'] ?? data['May visit award']
  const secondRoundCompleted =
    typeof mayVisitRaw === 'string' || typeof mayVisitRaw === 'number'
      ? Number(mayVisitRaw)
      : 0

  // Calculate visit status for both rounds
  const firstRound = calculateVisitStatus(
    isNaN(firstRoundCompleted) ? 0 : firstRoundCompleted,
    clubBase
  )
  const secondRound = calculateVisitStatus(
    isNaN(secondRoundCompleted) ? 0 : secondRoundCompleted,
    clubBase
  )

  return { firstRound, secondRound }
}

/**
 * Extracts division and area performance data from district snapshot
 *
 * Processes the district snapshot JSON to extract all divisions and their
 * constituent areas, calculating performance metrics and status classifications
 * for each. Divisions and areas are sorted by their identifiers.
 *
 * @param districtSnapshot - Raw district snapshot data (unknown type for safety)
 * @returns Array of DivisionPerformance objects, sorted by division identifier
 *
 * @example
 * const snapshot = {
 *   divisionPerformance: [
 *     { Division: "A", "Club Base": "10", "Paid Clubs": "12", "Distinguished Clubs": "6" }
 *   ]
 * }
 * const divisions = extractDivisionPerformance(snapshot)
 * // Returns array of DivisionPerformance objects with calculated metrics
 *
 * Requirements: 1.1, 1.3, 1.4, 6.8
 */
export function extractDivisionPerformance(
  districtSnapshot: unknown
): DivisionPerformance[] {
  // Type guard: ensure districtSnapshot is an object
  if (typeof districtSnapshot !== 'object' || districtSnapshot === null) {
    return []
  }

  const rawSnapshot = districtSnapshot as Record<string, unknown>

  // CDN snapshots wrap their payload in a `.data` key
  // (e.g. { districtId, data: { divisionPerformance, clubPerformance, … } })
  // Support both the wrapped and unwrapped shapes.
  const snapshot =
    typeof rawSnapshot['data'] === 'object' && rawSnapshot['data'] !== null
      ? (rawSnapshot['data'] as Record<string, unknown>)
      : rawSnapshot

  // The divisionPerformance array contains club-level data organized by division/area
  // The clubPerformance array contains club status and distinguished status
  // We need to merge these two data sources
  const clubDataRaw = snapshot['divisionPerformance']
  const clubPerformanceRaw = snapshot['clubPerformance']

  if (!Array.isArray(clubDataRaw)) {
    return []
  }

  // Create a map of club performance data by club identifier for quick lookup
  const clubPerformanceMap = new Map<string, Record<string, unknown>>()
  if (Array.isArray(clubPerformanceRaw)) {
    for (const clubPerfRaw of clubPerformanceRaw) {
      if (typeof clubPerfRaw !== 'object' || clubPerfRaw === null) {
        continue
      }
      const clubPerf = clubPerfRaw as Record<string, unknown>
      // Use Club Number as the key (or Club Name if Number not available)
      const clubKey =
        (typeof clubPerf['Club Number'] === 'string' ||
        typeof clubPerf['Club Number'] === 'number'
          ? String(clubPerf['Club Number'])
          : '') ||
        (typeof clubPerf['Club Name'] === 'string' ? clubPerf['Club Name'] : '')

      if (clubKey) {
        clubPerformanceMap.set(clubKey, clubPerf)
      }
    }
  }

  // Group clubs by division to aggregate metrics
  const divisionMap = new Map<string, unknown[]>()

  for (const clubRaw of clubDataRaw) {
    if (typeof clubRaw !== 'object' || clubRaw === null) {
      continue
    }

    const clubData = clubRaw as Record<string, unknown>
    const divisionId =
      typeof clubData['Division'] === 'string' ? clubData['Division'] : ''

    if (!divisionId) {
      continue
    }

    if (!divisionMap.has(divisionId)) {
      divisionMap.set(divisionId, [])
    }
    divisionMap.get(divisionId)!.push(clubData)
  }

  // Process each division
  const divisions: DivisionPerformance[] = []

  for (const [divisionId, clubs] of divisionMap.entries()) {
    // Aggregate division metrics from club data
    let paidClubs = 0
    let distinguishedClubs = 0

    // Requirement 1.1, 1.2, 1.3: Read "Division Club Base" from first club in division
    // All clubs in a division have the same value for this field
    const firstClub = clubs[0] as Record<string, unknown>
    const divisionClubBaseRaw = firstClub['Division Club Base']
    let clubBase: number

    if (divisionClubBaseRaw !== undefined && divisionClubBaseRaw !== null) {
      const parsed = parseIntSafe(divisionClubBaseRaw)
      if (parsed > 0) {
        // Valid "Division Club Base" field found
        clubBase = parsed
      } else {
        // Requirement 1.4: Invalid/non-numeric value, fall back to counting clubs
        logger.debug(
          `Division "${divisionId}": Invalid "Division Club Base" value "${String(divisionClubBaseRaw)}", falling back to club count`
        )
        clubBase = clubs.length
      }
    } else {
      // Requirement 1.4: Field missing, fall back to counting clubs
      logger.debug(
        `Division "${divisionId}": "Division Club Base" field missing, falling back to club count`
      )
      clubBase = clubs.length
    }

    for (const clubRaw of clubs) {
      const clubData = clubRaw as Record<string, unknown>

      // Get the club identifier to look up performance data
      // Try multiple field names for club identifier
      const clubKey =
        (typeof clubData['Club'] === 'string' ||
        typeof clubData['Club'] === 'number'
          ? String(clubData['Club'])
          : '') ||
        (typeof clubData['Club Number'] === 'string' ||
        typeof clubData['Club Number'] === 'number'
          ? String(clubData['Club Number'])
          : '') ||
        (typeof clubData['Club Name'] === 'string' ? clubData['Club Name'] : '')

      // Look up club performance data for paid clubs status and distinguished status
      const clubPerf = clubKey ? clubPerformanceMap.get(clubKey) : undefined

      if (clubPerf) {
        // Paid Clubs: count clubs with "Active" status
        const status =
          typeof clubPerf['Club Status'] === 'string'
            ? clubPerf['Club Status']
            : ''
        if (status === 'Active') {
          paidClubs++
        }

        // Requirements 3.1, 3.2, 3.3, 3.4: Use determineDistinguishedLevel helper
        // for each club to count distinguished clubs consistently with analytics engine
        // IMPORTANT: Use clubPerf (from clubPerformance) which has "Club Distinguished Status"
        // field, not clubData (from divisionPerformance) which doesn't have this field
        const distinguishedLevel = determineDistinguishedLevel(clubPerf)
        if (distinguishedLevel !== null) {
          distinguishedClubs++
        }
      } else {
        // Fallback: try to determine distinguished status from divisionPerformance data
        // This may not have "Club Distinguished Status" field, so it will use DCP calculation
        const distinguishedLevel = determineDistinguishedLevel(clubData)
        if (distinguishedLevel !== null) {
          distinguishedClubs++
        }
      }
    }

    // Calculate derived metrics
    const netGrowth = calculateNetGrowth(paidClubs, clubBase)
    const requiredDistinguishedClubs =
      calculateRequiredDistinguishedClubs(clubBase)

    // Calculate division recognition status (DDP — see calculateDivisionStatus)
    const status = calculateDivisionStatus(
      distinguishedClubs,
      paidClubs,
      clubBase
    )

    // Extract areas for this division
    const areas = extractAreasForDivision(
      divisionId,
      clubDataRaw,
      clubPerformanceMap
    )

    // Add division to results
    divisions.push({
      divisionId,
      status,
      clubBase,
      paidClubs,
      netGrowth,
      distinguishedClubs,
      requiredDistinguishedClubs,
      areas,
    })
  }

  // Sort divisions by identifier
  divisions.sort((a, b) => a.divisionId.localeCompare(b.divisionId))

  return divisions
}

/**
 * Extracts areas for a specific division from club performance data
 *
 * @param divisionId - Division identifier to filter areas
 * @param clubData - Array of club-level records
 * @param clubPerformanceMap - Map of club performance data by club identifier
 * @returns Array of AreaPerformance objects, sorted by area identifier
 */
function extractAreasForDivision(
  divisionId: string,
  clubData: unknown[],
  clubPerformanceMap: Map<string, Record<string, unknown>>
): AreaPerformance[] {
  // Group clubs by area
  const areaMap = new Map<string, unknown[]>()

  for (const clubRaw of clubData) {
    if (typeof clubRaw !== 'object' || clubRaw === null) {
      continue
    }

    const club = clubRaw as Record<string, unknown>

    // Check if club belongs to this division
    const clubDivision =
      typeof club['Division'] === 'string' ? club['Division'] : ''
    if (clubDivision !== divisionId) {
      continue
    }

    // Extract area identifier
    const areaId = typeof club['Area'] === 'string' ? club['Area'] : ''
    if (!areaId) {
      continue
    }

    // Add club to area group
    if (!areaMap.has(areaId)) {
      areaMap.set(areaId, [])
    }
    areaMap.get(areaId)!.push(club)
  }

  // Process each area
  const areas: AreaPerformance[] = []

  for (const [areaId, clubs] of areaMap.entries()) {
    // Requirement 2.1, 2.2, 2.3: Read "Area Club Base" from first club in area
    // All clubs in an area have the same value for this field
    const firstClub = clubs[0] as Record<string, unknown>
    const areaClubBaseRaw = firstClub['Area Club Base']
    let clubBase: number

    if (areaClubBaseRaw !== undefined && areaClubBaseRaw !== null) {
      const parsed = parseIntSafe(areaClubBaseRaw)
      if (parsed > 0) {
        // Valid "Area Club Base" field found
        clubBase = parsed
      } else {
        // Requirement 2.4: Invalid/non-numeric value, fall back to counting clubs
        logger.debug(
          `Area "${areaId}": Invalid "Area Club Base" value "${String(areaClubBaseRaw)}", falling back to club count`
        )
        clubBase = clubs.length
      }
    } else {
      // Requirement 2.4: Field missing, fall back to counting clubs
      logger.debug(
        `Area "${areaId}": "Area Club Base" field missing, falling back to club count`
      )
      clubBase = clubs.length
    }

    let paidClubs = 0
    let distinguishedClubs = 0

    // Requirements 4.1, 4.2, 4.3, 4.4, 4.5: Calculate first round visits by counting clubs
    // Iterate through all clubs in the area and count those with "1" in "Nov Visit award"
    // NOT reading from a single club and treating it as the total visit count
    const firstRoundCompleted = countVisitCompletions(clubs, 'Nov Visit award')
    const firstRound = calculateVisitStatus(firstRoundCompleted, clubBase)

    // Requirements 5.1, 5.2, 5.3, 5.4, 5.5: Calculate second round visits by counting clubs
    // Iterate through all clubs in the area and count those with "1" in "May Visit award"
    // Bug #268: CDN uses "May Visit award" (capital V). Fall back to lowercase variant.
    // NOT reading from a single club and treating it as the total visit count
    let secondRoundCompleted = countVisitCompletions(clubs, 'May Visit award')
    if (secondRoundCompleted === 0) {
      secondRoundCompleted = countVisitCompletions(clubs, 'May visit award')
    }
    const secondRound = calculateVisitStatus(secondRoundCompleted, clubBase)

    for (const clubRaw of clubs) {
      const club = clubRaw as Record<string, unknown>

      // Get the club identifier to look up performance data
      // Try multiple field names for club identifier
      const clubKey =
        (typeof club['Club'] === 'string' || typeof club['Club'] === 'number'
          ? String(club['Club'])
          : '') ||
        (typeof club['Club Number'] === 'string' ||
        typeof club['Club Number'] === 'number'
          ? String(club['Club Number'])
          : '') ||
        (typeof club['Club Name'] === 'string' ? club['Club Name'] : '')

      // Look up club performance data
      const clubPerf = clubKey ? clubPerformanceMap.get(clubKey) : undefined

      if (clubPerf) {
        // Count paid clubs (clubs with "Active" status)
        const status =
          typeof clubPerf['Club Status'] === 'string'
            ? clubPerf['Club Status']
            : ''
        if (status === 'Active') {
          paidClubs++
        }

        // Requirements 3.1, 3.2, 3.3, 3.4: Use determineDistinguishedLevel helper
        // for each club to count distinguished clubs consistently with analytics engine
        // IMPORTANT: Use clubPerf (from clubPerformance) which has "Club Distinguished Status"
        // field, not club (from divisionPerformance) which doesn't have this field
        const distinguishedLevel = determineDistinguishedLevel(clubPerf)
        if (distinguishedLevel !== null) {
          distinguishedClubs++
        }
      } else {
        // Fallback: try to determine distinguished status from divisionPerformance data
        // This may not have "Club Distinguished Status" field, so it will use DCP calculation
        const distinguishedLevel = determineDistinguishedLevel(club)
        if (distinguishedLevel !== null) {
          distinguishedClubs++
        }
      }
    }

    // Calculate derived metrics
    const netGrowth = calculateNetGrowth(paidClubs, clubBase)
    const requiredDistinguishedClubs =
      calculateRequiredDistinguishedClubs(clubBase)

    // Check if area is qualified
    const isQualified = checkAreaQualifying(netGrowth, firstRound, secondRound)

    // Calculate area status
    const status = calculateAreaStatus(
      isQualified,
      distinguishedClubs,
      requiredDistinguishedClubs,
      paidClubs,
      clubBase,
      netGrowth
    )

    // Add area to results
    areas.push({
      areaId,
      status,
      clubBase,
      paidClubs,
      netGrowth,
      distinguishedClubs,
      requiredDistinguishedClubs,
      firstRoundVisits: firstRound,
      secondRoundVisits: secondRound,
      isQualified,
    })
  }

  // Sort areas by identifier
  areas.sort((a, b) => a.areaId.localeCompare(b.areaId))

  return areas
}
