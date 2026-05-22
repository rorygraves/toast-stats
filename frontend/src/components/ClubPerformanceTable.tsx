import React, { useMemo } from 'react'
import { useUrlState } from '../hooks/useUrlState'
import type { Club } from '../types/districts'
import type { ClubWithRecentChanges } from '../utils/dataIntegration'
import { ExportButton } from './ExportButton'
import { exportClubs } from '../utils/csvExport'

export interface ClubPerformanceTableProps {
  clubs: (Club | ClubWithRecentChanges)[]
  districtId: string
  districtName: string
  isLoading?: boolean
}

type SortField = 'name' | 'memberCount' | 'awards' | 'status'
type SortDirection = 'asc' | 'desc'

const ClubPerformanceTable: React.FC<ClubPerformanceTableProps> = ({
  clubs,
  districtId,
  districtName,
  isLoading = false,
}) => {
  const [sortField, setSortField] = useUrlState<SortField>('perf_sort', 'name')
  const [sortDirection, setSortDirection] = useUrlState<SortDirection>(
    'perf_dir',
    'asc'
  )
  const [statusFilter, setStatusFilter] = useUrlState<string>(
    'perf_status',
    'all'
  )
  const [currentPage, setCurrentPage] = useUrlState('perf_page', 1, {
    parse: (v: string) => {
      const n = Number(v)
      return isNaN(n) || n < 1 ? undefined : Math.floor(n)
    },
    serialize: String,
  })
  const itemsPerPage = 10

  const handleExport = () => {
    if (sortedClubs && sortedClubs.length > 0) {
      exportClubs(sortedClubs, districtId, districtName)
    }
  }

  // Filter clubs by status
  const filteredClubs = useMemo(() => {
    if (statusFilter === 'all') return clubs
    return clubs.filter(club => club.status === statusFilter)
  }, [clubs, statusFilter])

  // Sort clubs - removed useMemo to avoid React Compiler issues
  const getSortedClubs = () => {
    return [...filteredClubs].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'memberCount':
          aValue = a.memberCount
          bValue = b.memberCount
          break
        case 'awards':
          aValue = a.awards
          bValue = b.awards
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const sortedClubs = getSortedClubs()

  // Paginate clubs
  const totalPages = Math.ceil(sortedClubs.length / itemsPerPage)
  const paginatedClubs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedClubs.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedClubs, currentPage])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      case 'ineligible':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDistinguishedBadge = (club: Club) => {
    if (!club.distinguished) return null

    const levelColors = {
      select: 'bg-tm-happy-yellow-30 text-tm-true-maroon',
      distinguished: 'bg-tm-loyal-blue-20 text-tm-loyal-blue',
      president: 'bg-tm-true-maroon-20 text-tm-true-maroon',
    }

    const levelText = {
      select: 'Select Distinguished',
      distinguished: 'Distinguished',
      president: "President's Distinguished",
    }

    const color = club.distinguishedLevel
      ? levelColors[club.distinguishedLevel]
      : 'bg-tm-loyal-blue-20 text-tm-loyal-blue'
    const text = club.distinguishedLevel
      ? levelText[club.distinguishedLevel]
      : 'Distinguished'

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}
      >
        ★ {text}
      </span>
    )
  }

  if (isLoading) {
    return (
      <section
        className="redesign-panel"
        aria-busy="true"
        aria-label="Loading club performance data"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded-sm w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-sm"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="redesign-panel sm:p-6"
      aria-label="Club performance table"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 sm:gap-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          Club Performance
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label
              htmlFor="status-filter"
              className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0"
            >
              Filter by Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-base"
            >
              <option value="all">All Clubs</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="ineligible">Ineligible</option>
            </select>
          </div>

          {/* Export Button */}
          <ExportButton
            onExport={handleExport}
            disabled={!sortedClubs || sortedClubs.length === 0}
            label="Export"
            className="text-xs sm:text-sm px-3 py-2 min-h-[44px]"
          />
        </div>
      </div>

      {/* Table - Scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table
              className="min-w-full divide-y divide-gray-200"
              aria-label="Club performance data"
            >
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[150px]"
                    onClick={() => handleSort('name')}
                    aria-sort={
                      sortField === 'name'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleSort('name')}
                    role="button"
                    aria-label={`Sort by club name, currently ${sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'not sorted'}`}
                  >
                    <div className="flex items-center gap-1">
                      Club Name
                      <span aria-hidden="true">{getSortIcon('name')}</span>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('memberCount')}
                    aria-sort={
                      sortField === 'memberCount'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    tabIndex={0}
                    onKeyDown={e =>
                      e.key === 'Enter' && handleSort('memberCount')
                    }
                    role="button"
                    aria-label={`Sort by member count, currently ${sortField === 'memberCount' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'not sorted'}`}
                  >
                    <div className="flex items-center gap-1">
                      Members
                      <span aria-hidden="true">
                        {getSortIcon('memberCount')}
                      </span>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('awards')}
                    aria-sort={
                      sortField === 'awards'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleSort('awards')}
                    role="button"
                    aria-label={`Sort by awards, currently ${sortField === 'awards' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'not sorted'}`}
                  >
                    <div className="flex items-center gap-1">
                      Awards
                      <span aria-hidden="true">{getSortIcon('awards')}</span>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                    aria-sort={
                      sortField === 'status'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleSort('status')}
                    role="button"
                    aria-label={`Sort by status, currently ${sortField === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'not sorted'}`}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <span aria-hidden="true">{getSortIcon('status')}</span>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                  >
                    Recognition
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                  >
                    Recent Activity (7d)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedClubs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No clubs found
                    </td>
                  </tr>
                ) : (
                  paginatedClubs.map(club => {
                    const hasRecentChanges =
                      'recentChanges' in club && club.recentChanges
                    return (
                      <tr
                        key={club.id}
                        className={`hover:bg-gray-50 ${club.distinguished ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">
                            {club.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {club.id}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {club.memberCount}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {club.awards}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(club.status)}`}
                          >
                            {club.status.charAt(0).toUpperCase() +
                              club.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {getDistinguishedBadge(club)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {hasRecentChanges ? (
                            <div className="text-xs space-y-1">
                              {club.recentChanges!.newMembers > 0 && (
                                <div className="text-green-600">
                                  +{club.recentChanges!.newMembers} new
                                </div>
                              )}
                              {club.recentChanges!.renewals > 0 && (
                                <div className="text-orange-600">
                                  {club.recentChanges!.renewals} renewals
                                </div>
                              )}
                              {club.recentChanges!.recentAwards > 0 && (
                                <div className="text-tm-loyal-blue">
                                  {club.recentChanges!.recentAwards} awards
                                </div>
                              )}
                              {club.recentChanges!.membershipChange !== 0 && (
                                <div
                                  className={`font-medium ${club.recentChanges!.membershipChange > 0 ? 'text-green-700' : 'text-red-700'}`}
                                >
                                  Net:{' '}
                                  {club.recentChanges!.membershipChange > 0
                                    ? '+'
                                    : ''}
                                  {club.recentChanges!.membershipChange}
                                </div>
                              )}
                              {!club.recentChanges!.newMembers &&
                                !club.recentChanges!.renewals &&
                                !club.recentChanges!.recentAwards && (
                                  <div className="text-gray-500">
                                    No activity
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-600">
                              Loading...
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-gray-200 gap-3">
          <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedClubs.length)} of{' '}
            {sortedClubs.length} clubs
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="min-h-[44px] px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="px-2 py-1 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(prev => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="min-h-[44px] px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default ClubPerformanceTable
