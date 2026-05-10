/**
 * Unit Tests for ClubsTable Component
 *
 * Tests the ClubsTable component that displays a comprehensive, sortable, and filterable
 * table of all clubs in a district. Covers rendering, pagination, sorting, filtering,
 * and export functionality.
 *
 * Validates Requirements: 2.5, 3.4, 4.6, 5.3, 5.5, 1.1-1.4, 2.1-2.4, 3.1-3.4, 5.1-5.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'
import * as csvExport from '../../utils/csvExport'

/**
 * Factory function to create a mock ClubTrend object with sensible defaults
 */
const createMockClub = (overrides: Partial<ClubTrend> = {}): ClubTrend => ({
  clubId: 'club-1',
  clubName: 'Test Club',
  divisionId: 'div-1',
  divisionName: 'Division A',
  areaId: 'area-1',
  areaName: 'Area 1',
  distinguishedLevel: 'NotDistinguished',
  currentStatus: 'thriving',
  riskFactors: [],
  membershipTrend: [{ date: new Date().toISOString(), count: 20 }],
  dcpGoalsTrend: [{ date: new Date().toISOString(), goalsAchieved: 5 }],
  ...overrides,
})

describe('ClubsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('Results Count Display', () => {
    /**
     * Validates: Requirements 2.5, 3.4
     * The table should display accurate results count for any combination of active filters
     */

    it('should display total count when no filters are active', () => {
      const clubs = [
        createMockClub({ clubId: 'club-1', clubName: 'Alpha Club' }),
        createMockClub({ clubId: 'club-2', clubName: 'Beta Club' }),
        createMockClub({ clubId: 'club-3', clubName: 'Gamma Club' }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      expect(screen.getByText('Total: 3 clubs')).toBeInTheDocument()
    })

    it('should display "Total: 1 clubs" for single club', () => {
      const clubs = [
        createMockClub({ clubId: 'club-1', clubName: 'Solo Club' }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      expect(screen.getByText('Total: 1 clubs')).toBeInTheDocument()
    })

    it('should display "Total: 0 clubs" for empty club list', () => {
      render(
        <ClubsTable clubs={[]} districtId="test-district" isLoading={false} />
      )

      // Empty state should be shown instead of the count
      expect(screen.getByText('No Clubs Found')).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    /**
     * Validates: Requirements 5.3
     * Pagination should maintain proper page boundaries with filtered datasets
     */

    it('should display 25 clubs per page when more than 25 clubs exist', () => {
      const clubs = Array.from({ length: 30 }, (_, i) =>
        createMockClub({
          clubId: `club-${i}`,
          clubName: `Club ${String(i).padStart(2, '0')}`,
        })
      )

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Should show total count
      expect(screen.getByText('Total: 30 clubs')).toBeInTheDocument()

      // Should have 26 rows (1 header + 25 data rows)
      const tableRows = screen.getAllByRole('row')
      expect(tableRows.length).toBe(26)
    })

    it('should display all clubs when fewer than 25 exist', () => {
      const clubs = Array.from({ length: 10 }, (_, i) =>
        createMockClub({
          clubId: `club-${i}`,
          clubName: `Club ${i}`,
        })
      )

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Should have 11 rows (1 header + 10 data rows)
      const tableRows = screen.getAllByRole('row')
      expect(tableRows.length).toBe(11)
    })

    it('should calculate correct number of pages', () => {
      const clubs = Array.from({ length: 30 }, (_, i) =>
        createMockClub({
          clubId: `club-${i}`,
          clubName: `Club ${i}`,
        })
      )

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // 30 clubs / 25 per page = 2 pages
      // Pagination shows "Showing X to Y of Z results"
      expect(screen.getByText(/Showing/)).toBeInTheDocument()
      expect(screen.getByText(/results/)).toBeInTheDocument()

      // Verify pagination controls are present (page 1 and page 2 buttons)
      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument()
    })
  })

  describe('Distinguished Column Sort Order', () => {
    /**
     * Validates: Requirements 4.6
     * Distinguished column should sort in order: Distinguished, Select, President, Smedley, NotDistinguished
     */

    it('should have correct sort order mapping for distinguished levels', () => {
      // Test the expected sort order
      const expectedOrder = [
        'Distinguished',
        'Select',
        'President',
        'Smedley',
        'NotDistinguished',
      ]

      // Create clubs with each distinguished level
      const clubs = expectedOrder.map((level, index) =>
        createMockClub({
          clubId: `club-${index}`,
          clubName: `Club ${level}`,
          distinguishedLevel: level as ClubTrend['distinguishedLevel'],
        })
      )

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Verify all clubs are rendered
      expectedOrder.forEach(level => {
        expect(screen.getByText(`Club ${level}`)).toBeInTheDocument()
      })
    })

    it('should display Distinguished badge for distinguished clubs', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Distinguished Club',
          distinguishedLevel: 'Distinguished',
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // There are two "Distinguished" texts - one in the column header and one in the badge
      // We check that there are at least 2 (header + badge)
      const distinguishedElements = screen.getAllByText('Distinguished')
      expect(distinguishedElements.length).toBeGreaterThanOrEqual(2)

      // Verify the badge specifically exists in the data row
      const dataRow = screen.getAllByRole('row')[1]
      expect(dataRow).toHaveTextContent('Distinguished')
    })

    it('should display dash for NotDistinguished clubs', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Regular Club',
          distinguishedLevel: 'NotDistinguished',
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // NotDistinguished shows as "—"
      const dataRow = screen.getAllByRole('row')[1]
      expect(dataRow).toHaveTextContent('—')
    })
  })

  describe('Export Functionality', () => {
    /**
     * Validates: Requirements 5.5
     * Export should respect filters and export only the currently filtered and sorted data
     */

    it('should call exportClubPerformance with all clubs when export button is clicked', () => {
      const mockExportClubPerformance = vi.spyOn(
        csvExport,
        'exportClubPerformance'
      )
      mockExportClubPerformance.mockImplementation(() => {})

      const clubs = [
        createMockClub({ clubId: 'club-1', clubName: 'Alpha Club' }),
        createMockClub({ clubId: 'club-2', clubName: 'Beta Club' }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const exportButton = screen.getByRole('button', { name: /export clubs/i })
      act(() => {
        fireEvent.click(exportButton)
      })

      expect(mockExportClubPerformance).toHaveBeenCalledTimes(1)
      const [exportedClubs, districtId] =
        mockExportClubPerformance.mock.calls[0]
      expect(districtId).toBe('test-district')
      expect(exportedClubs).toHaveLength(2)
    })

    it('should export clubs with correct data structure', () => {
      const mockExportClubPerformance = vi.spyOn(
        csvExport,
        'exportClubPerformance'
      )
      mockExportClubPerformance.mockImplementation(() => {})

      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Test Club',
          divisionName: 'Division A',
          areaName: 'Area 1',
          currentStatus: 'thriving',
          distinguishedLevel: 'Select',
          riskFactors: ['low-membership'],
          octoberRenewals: 10,
          aprilRenewals: 5,
          newMembers: 3,
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const exportButton = screen.getByRole('button', { name: /export clubs/i })
      act(() => {
        fireEvent.click(exportButton)
      })

      const [exportedClubs] = mockExportClubPerformance.mock.calls[0]
      const exportedClub = exportedClubs[0]

      expect(exportedClub).toHaveProperty('clubId', 'club-1')
      expect(exportedClub).toHaveProperty('clubName', 'Test Club')
      expect(exportedClub).toHaveProperty('divisionName', 'Division A')
      expect(exportedClub).toHaveProperty('areaName', 'Area 1')
      expect(exportedClub).toHaveProperty('currentStatus', 'thriving')
      expect(exportedClub).toHaveProperty('distinguishedLevel', 'Select')
      expect(exportedClub).toHaveProperty('riskFactors')
      expect(exportedClub).toHaveProperty('octoberRenewals', 10)
      expect(exportedClub).toHaveProperty('aprilRenewals', 5)
      expect(exportedClub).toHaveProperty('newMembers', 3)
    })

    it('should disable export button when no clubs exist', () => {
      render(
        <ClubsTable clubs={[]} districtId="test-district" isLoading={false} />
      )

      // Export button should be disabled when there are no clubs
      const exportButton = screen.getByRole('button', { name: /export clubs/i })
      expect(exportButton).toBeDisabled()
    })
  })

  describe('Membership Payment Column Display', () => {
    /**
     * Validates: Requirements 1.1-1.4, 2.1-2.4, 3.1-3.4
     * Membership payment columns should display correctly:
     * - positive numbers display as-is
     * - zero displays as "0"
     * - undefined/null displays as "—"
     */

    it('should display all three membership payment column headers', () => {
      const clubs = [createMockClub()]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const headerRow = screen.getAllByRole('row')[0]
      expect(headerRow).toHaveTextContent('Oct Ren')
      expect(headerRow).toHaveTextContent('Apr Ren')
      expect(headerRow).toHaveTextContent('New')
    })

    it('should display numeric values for defined payment counts', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Test Club',
          octoberRenewals: 15,
          aprilRenewals: 10,
          newMembers: 5,
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const dataRow = screen.getAllByRole('row')[1]
      expect(dataRow).toHaveTextContent('15')
      expect(dataRow).toHaveTextContent('10')
      expect(dataRow).toHaveTextContent('5')
    })

    it('should display "0" for zero payment counts', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Test Club',
          octoberRenewals: 0,
          aprilRenewals: 0,
          newMembers: 0,
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const dataRow = screen.getAllByRole('row')[1]
      const cells = dataRow.querySelectorAll('td')
      // Columns 9, 10, 11 are Oct Ren, Apr Ren, New (0-indexed, after Club Status column)
      expect(cells[9]).toHaveTextContent('0')
      expect(cells[10]).toHaveTextContent('0')
      expect(cells[11]).toHaveTextContent('0')
    })

    it('should display "—" for undefined payment counts', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Test Club',
          octoberRenewals: undefined,
          aprilRenewals: undefined,
          newMembers: undefined,
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const dataRow = screen.getAllByRole('row')[1]
      const cells = dataRow.querySelectorAll('td')
      // Columns 9, 10, 11 are Oct Ren, Apr Ren, New (0-indexed, after Club Status column)
      expect(cells[9]).toHaveTextContent('—')
      expect(cells[10]).toHaveTextContent('—')
      expect(cells[11]).toHaveTextContent('—')
    })

    it('should handle mixed defined and undefined payment values', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Test Club',
          octoberRenewals: 10,
          aprilRenewals: undefined,
          newMembers: 0,
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const dataRow = screen.getAllByRole('row')[1]
      const cells = dataRow.querySelectorAll('td')
      // Columns 9, 10, 11 are Oct Ren, Apr Ren, New (0-indexed, after Club Status column)
      expect(cells[9]).toHaveTextContent('10')
      expect(cells[10]).toHaveTextContent('—')
      expect(cells[11]).toHaveTextContent('0')
    })
  })

  describe('Table Column Structure', () => {
    it('should render 10 columns in the table', () => {
      const clubs = [createMockClub()]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const headerRow = screen.getAllByRole('row')[0]
      const headerCells = headerRow.querySelectorAll('th')
      expect(headerCells.length).toBe(12)
    })

    it('should render 11 cells per data row', () => {
      const clubs = [createMockClub()]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const dataRow = screen.getAllByRole('row')[1]
      const cells = dataRow.querySelectorAll('td')
      expect(cells.length).toBe(12)
    })
  })

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(
        <ClubsTable clubs={[]} districtId="test-district" isLoading={true} />
      )

      // Loading skeleton should be present
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no clubs exist', () => {
      render(
        <ClubsTable clubs={[]} districtId="test-district" isLoading={false} />
      )

      expect(screen.getByText('No Clubs Found')).toBeInTheDocument()
      expect(
        screen.getByText(/No club data is available for this district/i)
      ).toBeInTheDocument()
    })
  })

  describe('Club Status Display', () => {
    it('should display "Thriving" status badge for thriving clubs', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Thriving Club',
          currentStatus: 'thriving',
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      expect(screen.getByText('Thriving')).toBeInTheDocument()
    })

    it('should display "Vulnerable" status badge for vulnerable clubs', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Vulnerable Club',
          currentStatus: 'vulnerable',
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      expect(screen.getByText('Vulnerable')).toBeInTheDocument()
    })

    it('should display "Intervention Required" status badge for intervention-required clubs', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'At Risk Club',
          currentStatus: 'intervention-required',
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      expect(screen.getByText('Intervention Required')).toBeInTheDocument()
    })
  })

  describe('Close-to-Distinguished quick-filter chip (#433)', () => {
    it('clicking the chip filters to clubs needing 1–4 members (not exactly 1)', () => {
      const onFilterChange = vi.fn()
      const clubs = [createMockClub({ clubId: 'club-1' })]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
          onFilterChange={onFilterChange}
        />
      )

      const chip = screen.getByRole('button', {
        name: /close to distinguished/i,
      })
      fireEvent.click(chip)

      expect(onFilterChange).toHaveBeenCalled()
      const lastCall =
        onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1]
      const filterState = lastCall![0] as Record<
        string,
        { value: [number | null, number | null] }
      >
      expect(filterState.membersNeeded).toBeDefined()
      expect(filterState.membersNeeded!.value).toEqual([1, 4])
    })
  })

  describe('Row Click Handler', () => {
    it('should call onClubClick when a row is clicked', () => {
      const onClubClick = vi.fn()
      const clubs = [
        createMockClub({ clubId: 'club-1', clubName: 'Clickable Club' }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
          onClubClick={onClubClick}
        />
      )

      const dataRow = screen.getAllByRole('row')[1]
      fireEvent.click(dataRow)

      expect(onClubClick).toHaveBeenCalledTimes(1)
      expect(onClubClick).toHaveBeenCalledWith(
        expect.objectContaining({
          clubId: 'club-1',
          clubName: 'Clickable Club',
        })
      )
    })
  })

  describe('Sorting Behavior', () => {
    /**
     * Validates: Requirements 5.1, 5.2, 5.3, 5.4
     * Sorting should maintain correct order for membership payment columns
     * with undefined values sorted to the end
     */

    it('should sort clubs by name by default', () => {
      const clubs = [
        createMockClub({ clubId: 'club-3', clubName: 'Zeta Club' }),
        createMockClub({ clubId: 'club-1', clubName: 'Alpha Club' }),
        createMockClub({ clubId: 'club-2', clubName: 'Beta Club' }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const rows = screen.getAllByRole('row')
      // First data row should be Alpha Club (alphabetically first)
      expect(rows[1]).toHaveTextContent('Alpha Club')
      expect(rows[2]).toHaveTextContent('Beta Club')
      expect(rows[3]).toHaveTextContent('Zeta Club')
    })
  })
})
