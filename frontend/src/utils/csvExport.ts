/**
 * Utility functions for exporting data to CSV format
 */

import type { SnapshotDiff } from '@toastmasters/shared-contracts'
import { distinguishedTierName } from './distinguishedTier'
import { logger } from './logger'

/**
 * Converts a 2D array to CSV string
 */
export const arrayToCSV = (data: (string | number)[][]): string => {
  return data
    .map(row =>
      row
        .map(cell => {
          // Convert to string and escape quotes
          const cellStr = String(cell ?? '')
          // If cell contains comma, quote, or newline, wrap in quotes and escape quotes
          if (
            cellStr.includes(',') ||
            cellStr.includes('"') ||
            cellStr.includes('\n')
          ) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        })
        .join(',')
    )
    .join('\n')
}

/**
 * Triggers a browser download of CSV data
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Generates a filename with district ID and current date
 */
export const generateFilename = (
  dataType: string,
  districtId: string
): string => {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  return `${dataType}_district_${districtId}_${date}.csv`
}

/**
 * Export membership history data to CSV
 */
export const exportMembershipHistory = (
  data: Array<{ date: string; count: number }>,
  districtId: string,
  districtName: string
): void => {
  const headers = ['Date', 'Member Count']
  const rows = data.map(point => [point.date, point.count])

  const csvData = [
    [`District: ${districtName} (${districtId})`],
    [`Export Date: ${new Date().toISOString()}`],
    [],
    headers,
    ...rows,
  ]

  const csvContent = arrayToCSV(csvData)
  const filename = generateFilename('membership_history', districtId)
  downloadCSV(csvContent, filename)
}

/**
 * Export clubs data to CSV
 */
export const exportClubs = (
  clubs: Array<{
    id: string
    name: string
    status: string
    memberCount: number
    distinguished: boolean
    distinguishedLevel?: string
    awards: number
  }>,
  districtId: string,
  districtName: string
): void => {
  const headers = [
    'Club ID',
    'Club Name',
    'Status',
    'Member Count',
    'Distinguished',
    'Distinguished Level',
    'Awards',
  ]

  const rows = clubs.map(club => [
    club.id,
    club.name,
    club.status,
    club.memberCount,
    club.distinguished ? 'Yes' : 'No',
    club.distinguishedLevel || 'N/A',
    club.awards,
  ])

  const csvData = [
    [`District: ${districtName} (${districtId})`],
    [`Export Date: ${new Date().toISOString()}`],
    [`Total Clubs: ${clubs.length}`],
    [],
    headers,
    ...rows,
  ]

  const csvContent = arrayToCSV(csvData)
  const filename = generateFilename('clubs', districtId)
  downloadCSV(csvContent, filename)
}

/**
 * Export educational awards data to CSV
 */
export const exportEducationalAwards = (
  data: {
    totalAwards: number
    byType: Array<{ type: string; count: number }>
    topClubs: Array<{ clubId: string; clubName: string; awards: number }>
    byMonth: Array<{ month: string; count: number }>
  },
  districtId: string,
  districtName: string
): void => {
  const csvData: (string | number)[][] = [
    [`District: ${districtName} (${districtId})`],
    [`Export Date: ${new Date().toISOString()}`],
    [`Total Awards: ${data.totalAwards}`],
    [],
    ['Awards by Type'],
    ['Type', 'Count'],
  ]

  // Add awards by type
  data.byType.forEach(item => {
    csvData.push([item.type, item.count])
  })

  csvData.push([])
  csvData.push(['Top Performing Clubs'])
  csvData.push(['Club ID', 'Club Name', 'Awards'])

  // Add top clubs
  data.topClubs.forEach(club => {
    csvData.push([club.clubId, club.clubName, club.awards])
  })

  csvData.push([])
  csvData.push(['Awards by Month'])
  csvData.push(['Month', 'Count'])

  // Add monthly data
  data.byMonth.forEach(item => {
    csvData.push([item.month, item.count])
  })

  const csvContent = arrayToCSV(csvData)
  const filename = generateFilename('educational_awards', districtId)
  downloadCSV(csvContent, filename)
}

/**
 * Export daily reports data to CSV
 */
export const exportDailyReports = (
  reports: Array<{
    date: string
    newMembers: number
    renewals: number
    clubChanges: Array<{ clubId: string; change: string }>
    awards: number
  }>,
  districtId: string,
  districtName: string
): void => {
  const headers = [
    'Date',
    'New Members',
    'Renewals',
    'Club Changes',
    'Awards',
    'Net Change',
  ]

  const rows = reports.map(report => [
    report.date,
    report.newMembers,
    report.renewals,
    report.clubChanges.length,
    report.awards,
    report.newMembers + report.renewals,
  ])

  const csvData = [
    [`District: ${districtName} (${districtId})`],
    [`Export Date: ${new Date().toISOString()}`],
    [
      `Date Range: ${reports[0]?.date || 'N/A'} to ${reports[reports.length - 1]?.date || 'N/A'}`,
    ],
    [],
    headers,
    ...rows,
  ]

  const csvContent = arrayToCSV(csvData)
  const filename = generateFilename('daily_reports', districtId)
  downloadCSV(csvContent, filename)
}

/**
 * Export daily report detail to CSV
 */
export const exportDailyReportDetail = (
  report: {
    date: string
    newMembers: Array<{ name: string; clubId: string; clubName: string }>
    renewals: Array<{ name: string; clubId: string; clubName: string }>
    clubChanges: Array<{
      clubId: string
      clubName: string
      changeType: string
      details?: string
    }>
    awards: Array<{
      type: string
      level?: string
      recipient: string
      clubId: string
      clubName: string
    }>
    summary: {
      totalNewMembers: number
      totalRenewals: number
      totalAwards: number
      netMembershipChange: number
      dayOverDayChange: number
    }
  },
  districtId: string,
  districtName: string
): void => {
  const csvData: (string | number)[][] = [
    [`District: ${districtName} (${districtId})`],
    [`Date: ${report.date}`],
    [`Export Date: ${new Date().toISOString()}`],
    [],
    ['Summary'],
    ['Metric', 'Value'],
    ['Total New Members', report.summary.totalNewMembers],
    ['Total Renewals', report.summary.totalRenewals],
    ['Total Awards', report.summary.totalAwards],
    ['Net Membership Change', report.summary.netMembershipChange],
    ['Day-over-Day Change', report.summary.dayOverDayChange],
    [],
  ]

  // Add new members
  if (report.newMembers.length > 0) {
    csvData.push(['New Members'])
    csvData.push(['Name', 'Club ID', 'Club Name'])
    report.newMembers.forEach(member => {
      csvData.push([member.name, member.clubId, member.clubName])
    })
    csvData.push([])
  }

  // Add renewals
  if (report.renewals.length > 0) {
    csvData.push(['Renewals'])
    csvData.push(['Name', 'Club ID', 'Club Name'])
    report.renewals.forEach(member => {
      csvData.push([member.name, member.clubId, member.clubName])
    })
    csvData.push([])
  }

  // Add club changes
  if (report.clubChanges.length > 0) {
    csvData.push(['Club Changes'])
    csvData.push(['Club ID', 'Club Name', 'Change Type', 'Details'])
    report.clubChanges.forEach(change => {
      csvData.push([
        change.clubId,
        change.clubName,
        change.changeType,
        change.details || '',
      ])
    })
    csvData.push([])
  }

  // Add awards
  if (report.awards.length > 0) {
    csvData.push(['Awards'])
    csvData.push(['Type', 'Level', 'Recipient', 'Club ID', 'Club Name'])
    report.awards.forEach(award => {
      csvData.push([
        award.type,
        award.level || '',
        award.recipient,
        award.clubId,
        award.clubName,
      ])
    })
  }

  const csvContent = arrayToCSV(csvData)
  const filename = generateFilename(`daily_report_${report.date}`, districtId)
  downloadCSV(csvContent, filename)
}

/**
 * Export district statistics summary to CSV
 */
export const exportDistrictStatistics = (
  statistics: {
    districtId: string
    asOfDate: string
    membership: {
      total: number
      change: number
      changePercent: number
    }
    clubs: {
      total: number
      active: number
      suspended: number
      distinguished: number
    }
    education: {
      totalAwards: number
    }
  },
  districtName: string
): void => {
  const csvData: (string | number)[][] = [
    [`District: ${districtName} (${statistics.districtId})`],
    [`As of Date: ${statistics.asOfDate}`],
    [`Export Date: ${new Date().toISOString()}`],
    [],
    ['Membership Statistics'],
    ['Metric', 'Value'],
    ['Total Members', statistics.membership.total],
    ['Change', statistics.membership.change],
    ['Change Percent', `${statistics.membership.changePercent}%`],
    [],
    ['Club Statistics'],
    ['Metric', 'Value'],
    ['Total Clubs', statistics.clubs.total],
    ['Active Clubs', statistics.clubs.active],
    ['Suspended Clubs', statistics.clubs.suspended],
    ['Distinguished Clubs', statistics.clubs.distinguished],
    [
      'Distinguished Percentage',
      `${((statistics.clubs.distinguished / statistics.clubs.total) * 100).toFixed(1)}%`,
    ],
    [],
    ['Educational Statistics'],
    ['Metric', 'Value'],
    ['Total Awards', statistics.education.totalAwards],
  ]

  const csvContent = arrayToCSV(csvData)
  const filename = generateFilename(
    'district_statistics',
    statistics.districtId
  )
  downloadCSV(csvContent, filename)
}

/**
 * Export historical rank data to CSV
 */
export const exportHistoricalRankData = (
  data: Array<{
    districtId: string
    districtName: string
    history: Array<{
      date: string
      aggregateScore: number
      clubsRank: number
      paymentsRank: number
      distinguishedRank: number
    }>
  }>,
  programYear?: { startDate: string; endDate: string; year: string }
): void => {
  // Get all unique dates across all districts
  const allDates = new Set<string>()
  data.forEach(district => {
    district.history.forEach(point => allDates.add(point.date))
  })
  const sortedDates = Array.from(allDates).sort()

  const csvData: (string | number)[][] = [
    ['Historical Rank Progression'],
    [`Export Date: ${new Date().toISOString()}`],
  ]

  if (programYear) {
    csvData.push([
      `Program Year: ${programYear.year} (${programYear.startDate} to ${programYear.endDate})`,
    ])
  }

  csvData.push([`Districts: ${data.map(d => d.districtName).join(', ')}`])
  csvData.push([])

  // Create headers
  const headers = ['Date']
  data.forEach(district => {
    headers.push(
      `${district.districtName} - Overall Score`,
      `${district.districtName} - Clubs Rank`,
      `${district.districtName} - Payments Rank`,
      `${district.districtName} - Distinguished Rank`
    )
  })
  csvData.push(headers)

  // Create rows for each date
  sortedDates.forEach(date => {
    const row: (string | number)[] = [date]

    data.forEach(district => {
      const point = district.history.find(p => p.date === date)
      if (point) {
        row.push(
          Math.round(point.aggregateScore),
          point.clubsRank,
          point.paymentsRank,
          point.distinguishedRank
        )
      } else {
        row.push('', '', '', '')
      }
    })

    csvData.push(row)
  })

  const csvContent = arrayToCSV(csvData)
  const date = new Date().toISOString().split('T')[0]
  const filename = `historical_rank_progression_${date}.csv`
  downloadCSV(csvContent, filename)
}

/**
 * Export district analytics data using CDN snapshot data.
 * Generates CSV client-side from CDN snapshot data.
 */
export const exportDistrictAnalytics = async (
  districtId: string,
  startDate?: string,
  _endDate?: string
): Promise<void> => {
  try {
    // Dynamically import CDN services to avoid circular dependencies
    const { fetchCdnManifest, fetchCdnDistrictSnapshot } =
      await import('../services/cdn')

    const date = startDate || (await fetchCdnManifest()).latestSnapshotDate

    const snapshot = await fetchCdnDistrictSnapshot<{
      districtId: string
      districtName: string
      clubPerformance: Array<{
        clubId: string
        clubName: string
        divisionName?: string
        areaName?: string
        memberCount: number
        activeMemberCount?: number
        dcpGoals: number
        status: string
        distinguishedLevel?: string | null
      }>
      metadata?: { sourceCsvDate?: string }
    }>(date, districtId)

    const headers = [
      'Club ID',
      'Club Name',
      'Division',
      'Area',
      'Members',
      'Active Members',
      'DCP Goals',
      'Status',
      'Distinguished Level',
    ]

    const rows: (string | number)[][] = (snapshot.clubPerformance || []).map(
      club => [
        club.clubId,
        club.clubName,
        club.divisionName || 'N/A',
        club.areaName || 'N/A',
        club.memberCount,
        club.activeMemberCount ?? club.memberCount,
        club.dcpGoals,
        club.status,
        club.distinguishedLevel || 'None',
      ]
    )

    const csvData: (string | number)[][] = [
      [`District ${districtId} - ${snapshot.districtName || 'Analytics'}`],
      [`Export Date: ${new Date().toISOString()}`],
      [`Data As Of: ${snapshot.metadata?.sourceCsvDate || date}`],
      [`Total Clubs: ${rows.length}`],
      [],
      headers,
      ...rows,
    ]

    const csvContent = arrayToCSV(csvData)
    const filename = generateFilename('analytics', districtId)
    downloadCSV(csvContent, filename)
  } catch (error) {
    logger.error('Failed to export district analytics:', error)
    throw error
  }
}

/**
 * Export club performance data to CSV (client-side generation)
 */
export const exportClubPerformance = (
  clubs: Array<{
    clubId: string
    clubName: string
    divisionName?: string
    areaName?: string
    membershipTrend: Array<{ date: string; count: number }>
    dcpGoalsTrend: Array<{ date: string; goalsAchieved: number }>
    currentStatus: string
    distinguishedLevel?: string
    riskFactors?: string[]
    octoberRenewals?: number | undefined
    aprilRenewals?: number | undefined
    newMembers?: number | undefined
    clubStatus?: string
  }>,
  districtId: string
): void => {
  const headers = [
    'Club ID',
    'Club Name',
    'Division',
    'Area',
    'Current Membership',
    'Current DCP Goals',
    'Status',
    'Club Status',
    'Distinguished Level',
    'Oct Ren',
    'Apr Ren',
    'New',
    'Risk Factors',
  ]

  const rows = clubs.map(club => {
    const currentMembership =
      club.membershipTrend[club.membershipTrend.length - 1]?.count || 0
    const currentDcpGoals =
      club.dcpGoalsTrend[club.dcpGoalsTrend.length - 1]?.goalsAchieved || 0
    const riskFactors = club.riskFactors?.join('; ') || 'None'

    return [
      club.clubId,
      club.clubName,
      club.divisionName || 'N/A',
      club.areaName || 'N/A',
      currentMembership,
      currentDcpGoals,
      club.currentStatus,
      club.clubStatus ?? '',
      club.distinguishedLevel || 'None',
      club.octoberRenewals ?? '',
      club.aprilRenewals ?? '',
      club.newMembers ?? '',
      riskFactors,
    ]
  })

  const csvData = [
    [`District ${districtId} - Club Performance`],
    [`Export Date: ${new Date().toISOString()}`],
    [`Total Clubs: ${clubs.length}`],
    [],
    headers,
    ...rows,
  ]

  const csvContent = arrayToCSV(csvData)
  const filename = generateFilename('club_performance', districtId)
  downloadCSV(csvContent, filename)
}

/**
 * #795 (epic #821 Sprint 3) — export a snapshot-to-snapshot diff to CSV.
 *
 * A sibling of `exportClubPerformance` (current-snapshot fields), NOT an
 * extension of it: the diff CSV is from/to/delta data across two dates
 * (R6 / lesson 117 — the two datasets diverge, so they get distinct exporters).
 * Both-present clubs get from/to/Δ columns + the distinguished transition;
 * roster appear/disappear is a separate, status-classified section (lesson 118),
 * never folded into the per-club delta rows.
 */
export const exportSnapshotDiff = (diff: SnapshotDiff): void => {
  const { districtId, from, to } = diff

  const deltaHeaders = [
    'Club ID',
    'Club Name',
    'Division',
    'Area',
    'Members From',
    'Members To',
    'Δ Members',
    'Payments From',
    'Payments To',
    'Δ Payments',
    'DCP From',
    'DCP To',
    'Δ DCP',
    'Distinguished From',
    'Distinguished To',
    'Distinguished Changed',
  ]

  const deltaRows = diff.clubs.bothPresent.map(c => [
    c.clubId,
    c.clubName,
    c.divisionId,
    c.areaId,
    c.membership.from,
    c.membership.to,
    c.membership.delta,
    c.payments.from,
    c.payments.to,
    c.payments.delta,
    c.dcpGoals.from,
    c.dcpGoals.to,
    c.dcpGoals.delta,
    distinguishedTierName(c.distinguishedFrom),
    distinguishedTierName(c.distinguishedTo),
    c.distinguishedChanged ? 'Yes' : 'No',
  ])

  const csvData: (string | number)[][] = [
    [`District ${districtId} - What Changed`],
    [`From: ${from.date}  To: ${to.date}`],
    [`Export Date: ${new Date().toISOString()}`],
    [],
    ['Per-club changes'],
    deltaHeaders,
    ...deltaRows,
  ]

  // Roster changes — classified, not flagged as an error (lesson 118).
  if (diff.clubs.onlyInTo.length > 0 || diff.clubs.onlyInFrom.length > 0) {
    csvData.push([])
    csvData.push(['Roster changes'])
    csvData.push([
      'Club ID',
      'Club Name',
      'Division',
      'Area',
      'Roster Change',
      'Club Status',
    ])
    diff.clubs.onlyInTo.forEach(c => {
      csvData.push([
        c.clubId,
        c.clubName,
        c.divisionId,
        c.areaId,
        'Joined',
        c.clubStatus ?? '',
      ])
    })
    diff.clubs.onlyInFrom.forEach(c => {
      csvData.push([
        c.clubId,
        c.clubName,
        c.divisionId,
        c.areaId,
        'Left',
        c.clubStatus ?? '',
      ])
    })
  }

  const csvContent = arrayToCSV(csvData)
  const filename = generateFilename(
    `what_changed_${from.date}_to_${to.date}`,
    districtId
  )
  downloadCSV(csvContent, filename)
}
