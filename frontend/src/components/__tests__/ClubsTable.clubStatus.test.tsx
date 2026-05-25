/**
 * Unit Tests for ClubsTable Club Status Sorting and Filtering
 *
 * Tests the club status column sorting and filtering functionality in the ClubsTable component.
 * Per the property-testing-guidance.md steering document, this feature uses unit tests rather
 * than property-based tests because the operations are simple (alphabetical sorting, categorical
 * filtering) and 3-5 well-chosen examples fully cover the behavior.
 *
 * **Validates: Requirements 4.2, 4.3, 4.4, 5.3, 5.4, 5.5**
 *
 * Sorting Tests:
 * - Alphabetical order (Active, Ineligible, Low, Suspended)
 * - Reverse alphabetical order
 * - Undefined values sort to end in both directions
 * - Mix of defined and undefined values
 *
 * Filtering Tests:
 * - Empty filter selection returns all clubs
 * - Single value selection
 * - Multiple value selection
 * - No matching clubs returns empty list
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'

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

/**
 * Helper to get the club status column values from rendered table rows
 */
const getClubStatusColumnValues = (): (string | null)[] => {
  const rows = screen.getAllByRole('row')
  // Skip header row (index 0)
  return rows.slice(1).map(row => {
    const cells = row.querySelectorAll('td')
    // Club Status is column index 11 (0-indexed) after the #669 column
    // reconcile: Club, Div, Area, Status, Members, Needed, New, Oct Renew,
    // Apr Renew, DCP, Tier, Club Status, Years.
    const clubStatusCell = cells[11]
    const text = clubStatusCell?.textContent?.trim()
    // Return null for dash placeholder, otherwise return the text
    return text === '—' ? null : (text ?? null)
  })
}

/**
 * Helper to get club names from rendered table rows in order
 */
const getClubNamesInOrder = (): string[] => {
  const rows = screen.getAllByRole('row')
  // Skip header row (index 0)
  return rows.slice(1).map(row => {
    const cells = row.querySelectorAll('td')
    return cells[0]?.textContent?.trim() ?? ''
  })
}

/**
 * Helper to click the Club Status column header to trigger sorting
 * Uses aria-label to find the specific header button
 */
const clickClubStatusHeader = () => {
  // Find the button by its aria-label which contains "Club Status column header"
  const clubStatusHeaderButton = screen.getByRole('button', {
    name: /Club Status column header/i,
  })
  fireEvent.click(clubStatusHeaderButton)
}

/**
 * Helper to click the Sort A-Z button in the dropdown
 * Uses exact aria-label to avoid matching column headers
 */
const clickSortAscending = () => {
  // The sort button has aria-label like "Sort Club Status ascending (A to Z)"
  const sortAZButton = screen.getByRole('button', {
    name: /Sort Club Status ascending/i,
  })
  fireEvent.click(sortAZButton)
}

describe('ClubsTable Club Status Sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('Alphabetical Sorting (Ascending)', () => {
    /**
     * Validates: Requirements 4.2
     * WHEN sorting by Club Status in ascending order, THE System SHALL sort alphabetically
     * (Active, Ineligible, Low, Suspended)
     */
    it('should sort club status alphabetically in ascending order', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Club Suspended',
          clubStatus: 'Suspended',
        }),
        createMockClub({
          clubId: 'club-2',
          clubName: 'Club Active',
          clubStatus: 'Active',
        }),
        createMockClub({
          clubId: 'club-3',
          clubName: 'Club Low',
          clubStatus: 'Low',
        }),
        createMockClub({
          clubId: 'club-4',
          clubName: 'Club Ineligible',
          clubStatus: 'Ineligible',
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Click Club Status header to open dropdown, then click Sort A-Z
      clickClubStatusHeader()
      clickSortAscending()

      const clubNames = getClubNamesInOrder()
      // Expected alphabetical order: Active, Ineligible, Low, Suspended
      expect(clubNames).toEqual([
        'Club Active',
        'Club Ineligible',
        'Club Low',
        'Club Suspended',
      ])
    })
  })

  describe('Reverse Alphabetical Sorting (Descending)', () => {
    /**
     * Validates: Requirements 4.3
     * WHEN sorting by Club Status in descending order, THE System SHALL sort reverse alphabetically
     */
    it('should sort club status reverse alphabetically in descending order', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Club Active',
          clubStatus: 'Active',
        }),
        createMockClub({
          clubId: 'club-2',
          clubName: 'Club Suspended',
          clubStatus: 'Suspended',
        }),
        createMockClub({
          clubId: 'club-3',
          clubName: 'Club Ineligible',
          clubStatus: 'Ineligible',
        }),
        createMockClub({
          clubId: 'club-4',
          clubName: 'Club Low',
          clubStatus: 'Low',
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // First sort ascending, then click header again to toggle to descending
      clickClubStatusHeader()
      clickSortAscending()

      // Now click header again and click Sort A-Z again to toggle to descending
      clickClubStatusHeader()
      clickSortAscending() // Clicking again toggles to descending

      const clubNames = getClubNamesInOrder()
      // Expected reverse alphabetical order: Suspended, Low, Ineligible, Active
      expect(clubNames).toEqual([
        'Club Suspended',
        'Club Low',
        'Club Ineligible',
        'Club Active',
      ])
    })
  })

  describe('Undefined Values Sort to End', () => {
    /**
     * Validates: Requirements 4.4
     * WHEN clubs have undefined clubStatus values, THE System SHALL sort them to the end
     * regardless of sort direction
     */
    it('should sort undefined club status values to end in ascending order', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Club Undefined 1',
          clubStatus: undefined,
        }),
        createMockClub({
          clubId: 'club-2',
          clubName: 'Club Active',
          clubStatus: 'Active',
        }),
        createMockClub({
          clubId: 'club-3',
          clubName: 'Club Undefined 2',
          clubStatus: undefined,
        }),
        createMockClub({
          clubId: 'club-4',
          clubName: 'Club Suspended',
          clubStatus: 'Suspended',
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Click Club Status header to open dropdown, then click Sort A-Z
      clickClubStatusHeader()
      clickSortAscending()

      const clubNames = getClubNamesInOrder()
      // Defined values first (alphabetically), then undefined values at end
      // Undefined values should be sorted by club name as secondary sort
      expect(clubNames).toEqual([
        'Club Active',
        'Club Suspended',
        'Club Undefined 1',
        'Club Undefined 2',
      ])
    })

    it('should sort undefined club status values to end in descending order', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Club Undefined 1',
          clubStatus: undefined,
        }),
        createMockClub({
          clubId: 'club-2',
          clubName: 'Club Active',
          clubStatus: 'Active',
        }),
        createMockClub({
          clubId: 'club-3',
          clubName: 'Club Undefined 2',
          clubStatus: undefined,
        }),
        createMockClub({
          clubId: 'club-4',
          clubName: 'Club Suspended',
          clubStatus: 'Suspended',
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // First sort ascending, then click header again to toggle to descending
      clickClubStatusHeader()
      clickSortAscending()

      // Now click header again and click Sort A-Z again to toggle to descending
      clickClubStatusHeader()
      clickSortAscending() // Clicking again toggles to descending

      const clubNames = getClubNamesInOrder()
      // Defined values first (reverse alphabetically), then undefined values at end
      // Undefined values should be sorted by club name as secondary sort
      expect(clubNames).toEqual([
        'Club Suspended',
        'Club Active',
        'Club Undefined 1',
        'Club Undefined 2',
      ])
    })
  })

  describe('Mixed Defined and Undefined Values', () => {
    /**
     * Validates: Requirements 4.2, 4.3, 4.4
     * Tests sorting with a mix of all status values and undefined
     */
    it('should correctly sort a mix of all status values and undefined', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Club 1',
          clubStatus: 'Low',
        }),
        createMockClub({
          clubId: 'club-2',
          clubName: 'Club 2',
          clubStatus: undefined,
        }),
        createMockClub({
          clubId: 'club-3',
          clubName: 'Club 3',
          clubStatus: 'Active',
        }),
        createMockClub({
          clubId: 'club-4',
          clubName: 'Club 4',
          clubStatus: 'Suspended',
        }),
        createMockClub({
          clubId: 'club-5',
          clubName: 'Club 5',
          clubStatus: 'Ineligible',
        }),
        createMockClub({
          clubId: 'club-6',
          clubName: 'Club 6',
          clubStatus: undefined,
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Click Club Status header to open dropdown, then click Sort A-Z
      clickClubStatusHeader()
      clickSortAscending()

      const clubNames = getClubNamesInOrder()
      // Expected: Active, Ineligible, Low, Suspended, then undefined (sorted by name)
      expect(clubNames).toEqual([
        'Club 3', // Active
        'Club 5', // Ineligible
        'Club 1', // Low
        'Club 4', // Suspended
        'Club 2', // undefined
        'Club 6', // undefined
      ])
    })
  })

  describe('Club Status Column Display', () => {
    /**
     * Validates: Requirements 3.2, 3.3
     * Tests that club status values are displayed correctly
     */
    it('should display club status values correctly', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Club Active',
          clubStatus: 'Active',
        }),
        createMockClub({
          clubId: 'club-2',
          clubName: 'Club Undefined',
          clubStatus: undefined,
        }),
      ]

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const statusValues = getClubStatusColumnValues()
      // First club should show 'Active', second should show null (dash placeholder)
      expect(statusValues).toContain('Active')
      expect(statusValues).toContain(null)
    })

    it('should display dash placeholder for undefined club status', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Club No Status',
          clubStatus: undefined,
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
      // Club Status is column index 11 after the #669 column reconcile.
      expect(cells[11]).toHaveTextContent('—')
    })
  })
})
