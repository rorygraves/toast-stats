import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'
import * as csvExport from '../../utils/csvExport'

/**
 * Integration tests for ClubsTable component
 * Tests complete user workflows from filter application to export
 * **Feature: clubs-table-column-filtering**
 */

// Sample test data for integration testing
const createTestClubs = (): ClubTrend[] => [
  {
    clubId: 'club-1',
    clubName: 'Alpha Toastmasters',
    divisionId: 'div-a',
    divisionName: 'Division A',
    areaId: 'area-1',
    areaName: 'Area 1',
    distinguishedLevel: 'Distinguished',
    currentStatus: 'thriving',
    riskFactors: [],
    membershipTrend: [{ date: '2024-01-01', count: 25 }],
    dcpGoalsTrend: [{ date: '2024-01-01', goalsAchieved: 8 }],
    aprilRenewals: 25,
    membershipBase: 20,
  },
  {
    clubId: 'club-2',
    clubName: 'Beta Speakers',
    divisionId: 'div-a',
    divisionName: 'Division A',
    areaId: 'area-2',
    areaName: 'Area 2',
    distinguishedLevel: 'Select',
    aprilRenewals: 20,
    membershipBase: 15,
    currentStatus: 'vulnerable',
    riskFactors: ['DCP checkpoint not met'],
    membershipTrend: [{ date: '2024-01-01', count: 15 }],
    dcpGoalsTrend: [{ date: '2024-01-01', goalsAchieved: 5 }],
  },
  {
    clubId: 'club-3',
    clubName: 'Gamma Club',
    divisionId: 'div-b',
    divisionName: 'Division B',
    areaId: 'area-3',
    areaName: 'Area 3',
    distinguishedLevel: 'President',
    currentStatus: 'intervention-required',
    riskFactors: ['Membership below 12', 'Net growth below 3'],
    membershipTrend: [{ date: '2024-01-01', count: 10 }],
    dcpGoalsTrend: [{ date: '2024-01-01', goalsAchieved: 2 }],
  },
  {
    clubId: 'club-4',
    clubName: 'Delta Orators',
    divisionId: 'div-b',
    divisionName: 'Division B',
    areaId: 'area-4',
    areaName: 'Area 4',
    distinguishedLevel: 'Smedley',
    currentStatus: 'thriving',
    riskFactors: [],
    membershipTrend: [{ date: '2024-01-01', count: 30 }],
    dcpGoalsTrend: [{ date: '2024-01-01', goalsAchieved: 9 }],
  },
  {
    clubId: 'club-5',
    clubName: 'Echo Communicators',
    divisionId: 'div-a',
    divisionName: 'Division A',
    areaId: 'area-1',
    areaName: 'Area 1',
    distinguishedLevel: 'NotDistinguished',
    currentStatus: 'thriving',
    riskFactors: [],
    membershipTrend: [{ date: '2024-01-01', count: 20 }],
    dcpGoalsTrend: [{ date: '2024-01-01', goalsAchieved: 6 }],
  },
]

describe('ClubsTable Integration Tests', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('Basic Integration Tests', () => {
    it('should render table with all clubs initially', () => {
      /**
       * **Feature: clubs-table-column-filtering, Integration Test**
       * Tests basic table rendering and initial state
       */

      const clubs = createTestClubs()

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Should show all 5 clubs initially
      expect(screen.getByText('Total: 5 clubs')).toBeInTheDocument()

      // Should show table headers (reconciled to HANDOFF column set, #669)
      expect(screen.getByText('Club')).toBeInTheDocument()
      expect(screen.getByText('Div')).toBeInTheDocument()
      expect(screen.getByText('Area')).toBeInTheDocument()
      expect(screen.getByText('Members')).toBeInTheDocument()
      expect(screen.getByText('DCP')).toBeInTheDocument()
      expect(screen.getByText('Tier')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()

      // Should show club data
      expect(screen.getByText('Alpha Toastmasters')).toBeInTheDocument()
      expect(screen.getByText('Beta Speakers')).toBeInTheDocument()
      expect(screen.getByText('Gamma Club')).toBeInTheDocument()
      expect(screen.getByText('Delta Orators')).toBeInTheDocument()
      expect(screen.getByText('Echo Communicators')).toBeInTheDocument()

      // Should not show Clear All Filters button initially
      expect(screen.queryByText(/Clear All Filters/)).not.toBeInTheDocument()
    })

    it('should show column headers with interactive elements', () => {
      /**
       * **Feature: clubs-table-column-filtering, Integration Test**
       * Tests that column headers are interactive and show proper indicators
       */

      const clubs = createTestClubs()

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // All column headers should be clickable buttons
      const clubNameHeader = screen.getByRole('button', {
        name: /club name column header/i,
      })
      const divisionHeader = screen.getByRole('button', {
        name: /division column header/i,
      })
      const areaHeader = screen.getByRole('button', {
        name: /area column header/i,
      })
      const membersHeader = screen.getByRole('button', {
        name: /Members column header/i,
      })
      const dcpGoalsHeader = screen.getByRole('button', {
        name: /dcp goals column header/i,
      })
      const distinguishedHeader = screen.getByRole('button', {
        name: /distinguished column header/i,
      })
      // Use more specific regex to match "Status column header" but not "Club Status column header"
      const statusHeader = screen.getByRole('button', {
        name: /^status column header/i,
      })

      expect(clubNameHeader).toBeInTheDocument()
      expect(divisionHeader).toBeInTheDocument()
      expect(areaHeader).toBeInTheDocument()
      expect(membersHeader).toBeInTheDocument()
      expect(dcpGoalsHeader).toBeInTheDocument()
      expect(distinguishedHeader).toBeInTheDocument()
      expect(statusHeader).toBeInTheDocument()
    })

    it('should handle sorting by clicking column headers', () => {
      /**
       * **Feature: clubs-table-column-filtering, Integration Test**
       * Tests basic sorting functionality
       */

      const clubs = createTestClubs()

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Click on Members column to sort
      const membersHeader = screen.getByRole('button', {
        name: /Members column header/i,
      })
      fireEvent.click(membersHeader)

      // Table should still show all clubs
      expect(screen.getByText('Total: 5 clubs')).toBeInTheDocument()

      // All clubs should still be visible
      expect(screen.getByText('Alpha Toastmasters')).toBeInTheDocument()
      expect(screen.getByText('Beta Speakers')).toBeInTheDocument()
      expect(screen.getByText('Gamma Club')).toBeInTheDocument()
      expect(screen.getByText('Delta Orators')).toBeInTheDocument()
      expect(screen.getByText('Echo Communicators')).toBeInTheDocument()
    })
  })

  describe('Export Integration Workflow', () => {
    it('should export all data when no filters are applied', () => {
      /**
       * **Feature: clubs-table-column-filtering, Integration Test**
       * Tests export workflow with no filters
       */

      const clubs = createTestClubs()

      // Mock the export function
      const mockExportClubPerformance = vi.spyOn(
        csvExport,
        'exportClubPerformance'
      )
      mockExportClubPerformance.mockImplementation(() => {})

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Export without applying any filters
      const exportButton = screen.getByRole('button', { name: /export clubs/i })
      fireEvent.click(exportButton)

      // Verify export was called with all data
      expect(mockExportClubPerformance).toHaveBeenCalledTimes(1)

      const [exportedClubs, districtId] =
        mockExportClubPerformance.mock.calls[0]

      // Should export all 5 clubs
      expect(exportedClubs).toHaveLength(5)
      expect(districtId).toBe('test-district')

      // Verify exported data structure
      exportedClubs.forEach((club: unknown) => {
        const typedClub = club as Record<string, unknown>
        expect(typedClub).toHaveProperty('clubId')
        expect(typedClub).toHaveProperty('clubName')
        expect(typedClub).toHaveProperty('divisionName')
        expect(typedClub).toHaveProperty('areaName')
        expect(typedClub).toHaveProperty('membershipTrend')
        expect(typedClub).toHaveProperty('dcpGoalsTrend')
        expect(typedClub).toHaveProperty('currentStatus')
        expect(typedClub).toHaveProperty('distinguishedLevel')
        expect(typedClub).toHaveProperty('riskFactors')
      })
    })

    it('should handle export button state correctly', () => {
      /**
       * **Feature: clubs-table-column-filtering, Integration Test**
       * Tests export button behavior with different data states
       */

      // Test with clubs
      const clubs = createTestClubs()

      const { rerender } = render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Export button should be enabled with clubs
      const exportButton = screen.getByRole('button', { name: /export clubs/i })
      expect(exportButton).not.toBeDisabled()

      // Test with empty clubs array
      rerender(
        <ClubsTable clubs={[]} districtId="test-district" isLoading={false} />
      )

      // Export button should be disabled with no clubs
      const exportButtonEmpty = screen.getByRole('button', {
        name: /export clubs/i,
      })
      expect(exportButtonEmpty).toBeDisabled()
    })
  })

  describe('UI State Consistency', () => {
    it('should maintain consistent UI state across operations', () => {
      /**
       * **Feature: clubs-table-column-filtering, Integration Test**
       * Tests UI state consistency across basic operations
       */

      const clubs = createTestClubs()

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Initial state checks
      expect(screen.getByText('Total: 5 clubs')).toBeInTheDocument()
      expect(screen.queryByText(/Clear All Filters/)).not.toBeInTheDocument()

      // Click on different column headers to test interaction
      const clubNameHeader = screen.getByRole('button', {
        name: /club name column header/i,
      })
      const membersHeader = screen.getByRole('button', {
        name: /Members column header/i,
      })

      fireEvent.click(clubNameHeader)

      // Should maintain total count after header click
      expect(screen.getByText('Total: 5 clubs')).toBeInTheDocument()

      fireEvent.click(membersHeader)

      // Should still maintain total count
      expect(screen.getByText('Total: 5 clubs')).toBeInTheDocument()

      // All clubs should still be visible
      expect(screen.getByText('Alpha Toastmasters')).toBeInTheDocument()
      expect(screen.getByText('Beta Speakers')).toBeInTheDocument()
      expect(screen.getByText('Gamma Club')).toBeInTheDocument()
      expect(screen.getByText('Delta Orators')).toBeInTheDocument()
      expect(screen.getByText('Echo Communicators')).toBeInTheDocument()
    })

    it('renders all rows for large datasets (no pagination) — #667', () => {
      /**
       * **Feature: clubs-table-column-filtering, Integration Test**
       * #667 (epic #665) — pagination removed; the full set renders.
       */

      // Create a larger dataset to confirm every row renders.
      const largeClubSet: ClubTrend[] = Array.from({ length: 30 }, (_, i) => ({
        clubId: `club-${i}`,
        clubName: `Club ${i}`,
        divisionId: 'div-1',
        divisionName: 'Division A',
        areaId: 'area-1',
        areaName: 'Area 1',
        distinguishedLevel: (
          [
            'NotDistinguished',
            'Smedley',
            'President',
            'Select',
            'Distinguished',
          ] as const
        )[i % 5],
        currentStatus: (i % 3 === 0
          ? 'thriving'
          : i % 3 === 1
            ? 'vulnerable'
            : 'intervention-required') as
          | 'thriving'
          | 'vulnerable'
          | 'intervention-required',
        riskFactors: [],
        membershipTrend: [{ date: '2024-01-01', count: 20 + i }],
        dcpGoalsTrend: [{ date: '2024-01-01', goalsAchieved: i % 11 }],
      }))

      render(
        <ClubsTable
          clubs={largeClubSet}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Should show total count
      expect(screen.getByText('Total: 30 clubs')).toBeInTheDocument()

      // All 30 clubs render (1 header + 30 data rows = 31 total) — no page boundary.
      const tableRows = screen.getAllByRole('row')
      expect(tableRows).toHaveLength(31)

      // First, last, and a formerly-page-2 club are all present.
      expect(screen.getByText('Club 0')).toBeInTheDocument()
      expect(screen.getByText('Club 24')).toBeInTheDocument()
      expect(screen.getByText('Club 25')).toBeInTheDocument()
      expect(screen.getByText('Club 29')).toBeInTheDocument()
    })

    it('should handle loading and empty states correctly', () => {
      /**
       * **Feature: clubs-table-column-filtering, Integration Test**
       * Tests loading and empty state handling
       */

      // Test loading state
      const { rerender } = render(
        <ClubsTable clubs={[]} districtId="test-district" isLoading={true} />
      )

      // Should show loading skeleton (we can't easily test the skeleton content, but it should render)
      expect(screen.queryByText('Total:')).not.toBeInTheDocument()

      // Test empty state
      rerender(
        <ClubsTable clubs={[]} districtId="test-district" isLoading={false} />
      )

      // Should show empty state message
      expect(screen.getByText('No Clubs Found')).toBeInTheDocument()
      expect(
        screen.getByText(/No club data is available for this district/)
      ).toBeInTheDocument()

      // Test with data
      const clubs = createTestClubs()
      rerender(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Should show normal state
      expect(screen.getByText('Total: 5 clubs')).toBeInTheDocument()
      expect(screen.queryByText('No Clubs Found')).not.toBeInTheDocument()
    })
  })
})
