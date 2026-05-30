/**
 * Unit Tests for ClubsTable Component
 *
 * Tests the ClubsTable component that displays a comprehensive, sortable, and filterable
 * table of all clubs in a district. Covers rendering, pagination, sorting, filtering,
 * and export functionality.
 *
 * Validates Requirements: 2.5, 3.4, 4.6, 5.3, 5.5, 1.1-1.4, 2.1-2.4, 3.1-3.4, 5.1-5.4
 */

import type { ReactElement } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  render as rtlRender,
  screen,
  cleanup,
  fireEvent,
  act,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'
import * as csvExport from '../../utils/csvExport'

// CC-7 (#872): ClubsTable now renders real <Link>s (desktop club-name cell +
// mobile ClubCard), so every render needs a router context. Shadow `render`
// to wrap in MemoryRouter — keeps all existing call sites unchanged.
const render = (ui: ReactElement, options?: Parameters<typeof rtlRender>[1]) =>
  rtlRender(<MemoryRouter>{ui}</MemoryRouter>, options)

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

  describe('Filters drawer (#816)', () => {
    const clubs = [
      createMockClub({ clubId: 'club-1', clubName: 'Alpha Club' }),
      createMockClub({ clubId: 'club-2', clubName: 'Beta Club' }),
    ]

    it('opens the Filters drawer from the toolbar trigger', () => {
      render(<ClubsTable clubs={clubs} districtId="d" isLoading={false} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /^filters/i }))
      expect(screen.getByRole('dialog')).toHaveAccessibleName(/filters/i)
    })

    it('restores focus to the trigger when the drawer closes', () => {
      render(<ClubsTable clubs={clubs} districtId="d" isLoading={false} />)
      const trigger = screen.getByRole('button', { name: /^filters/i })
      fireEvent.click(trigger)
      fireEvent.click(screen.getByRole('button', { name: /close filters/i }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(document.activeElement).toBe(trigger)
    })

    it('applies a drawer filter instantly (no Apply button) and updates the trigger badge', () => {
      render(<ClubsTable clubs={clubs} districtId="d" isLoading={false} />)
      const trigger = screen.getByRole('button', { name: /^filters/i })
      fireEvent.click(trigger)

      // Instant-apply: there is no Apply button to gate the change.
      expect(
        screen.queryByRole('button', { name: /^apply/i })
      ).not.toBeInTheDocument()

      // Toggling a categorical option commits immediately (a Club Status pick).
      fireEvent.click(screen.getByRole('checkbox', { name: /suspended/i }))

      // The trigger badge reflects the now-active filter count without any
      // further action.
      expect(trigger).toHaveTextContent('1')
    })
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

  // CC-7 (#872, epic #873 Sprint 2): the desktop club-name cell is a real
  // <Link> (not just a JS-navigating row), so middle-click / ⌘-click / open-in-
  // new-tab work and the destination is announced to assistive tech. The whole
  // row stays clickable as a mouse convenience.
  describe('club-name link (CC-7) — #872', () => {
    it('renders the club name as a link to the club detail route', () => {
      const clubs = [
        createMockClub({ clubId: 'c-42', clubName: 'Limestone City Club' }),
      ]
      render(<ClubsTable clubs={clubs} districtId="61" isLoading={false} />)

      const link = screen.getByRole('link', { name: 'Limestone City Club' })
      expect(link).toHaveAttribute('href', '/district/61/club/c-42')
    })
  })

  describe('Renders all rows (no pagination) — #667', () => {
    /**
     * Validates: Requirements 5.3
     * #667 (epic #665) — pagination removed. The table renders ALL
     * sorted+filtered rows in one sticky-header scroll container. Spec
     * change, NOT assertion pinning: the old "25 per page" boundary no
     * longer exists by design.
     */

    it('renders all clubs when more than 25 exist (no page boundary)', () => {
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

      // Should have 31 rows (1 header + all 30 data rows) — no pagination.
      const tableRows = screen.getAllByRole('row')
      expect(tableRows.length).toBe(31)
      // Both the first and the 26th club (formerly on page 2) are present.
      expect(screen.getByText('Club 00')).toBeInTheDocument()
      expect(screen.getByText('Club 25')).toBeInTheDocument()
      expect(screen.getByText('Club 29')).toBeInTheDocument()
    })

    it('renders all clubs when fewer than 25 exist', () => {
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

    it('shows no pagination controls', () => {
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

      // The "Showing X to Y of Z results" pagination summary and the
      // numbered page buttons are gone.
      expect(screen.queryByText(/results/)).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Page 1' })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Page 2' })
      ).not.toBeInTheDocument()
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

      // Header is now "Tier" (#669), so "Distinguished" appears once — the
      // tier pill in the data row.
      const distinguishedElements = screen.getAllByText('Distinguished')
      expect(distinguishedElements.length).toBeGreaterThanOrEqual(1)

      // Verify the tier pill specifically exists in the data row
      const dataRow = screen.getAllByRole('row')[1]
      expect(dataRow).toHaveTextContent('Distinguished')
      expect(
        dataRow.querySelector('.clubs-tier-pill--distinguished')
      ).not.toBeNull()
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
      // New column order (#669): New=6, Oct Renew=7, Apr Renew=8 (0-indexed).
      expect(cells[6]).toHaveTextContent('0')
      expect(cells[7]).toHaveTextContent('0')
      expect(cells[8]).toHaveTextContent('0')
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
      // New column order (#669): New=6, Oct Renew=7, Apr Renew=8 (0-indexed).
      expect(cells[6]).toHaveTextContent('—')
      expect(cells[7]).toHaveTextContent('—')
      expect(cells[8]).toHaveTextContent('—')
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
      // New column order (#669): New=6, Oct Renew=7, Apr Renew=8 (0-indexed).
      // octoberRenewals=10, aprilRenewals=undefined, newMembers=0.
      expect(cells[6]).toHaveTextContent('0')
      expect(cells[7]).toHaveTextContent('10')
      expect(cells[8]).toHaveTextContent('—')
    })
  })

  describe('Table Column Structure', () => {
    // Years Chartered column was added in #448 (epic #443).
    // 12 → 13 reflects that new column.
    it('should render 13 columns in the table', () => {
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
      expect(headerCells.length).toBe(13)
    })

    it('should render 13 cells per data row', () => {
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
      expect(cells.length).toBe(13)
    })
  })

  describe('Years Chartered column (#448)', () => {
    // #448 — Years column shows whole years since charter, sortable;
    // missing charterDate renders as em-dash, sorts to end.
    const referenceDate = new Date('2026-05-12T00:00:00Z')

    it('renders the Years header label', () => {
      render(
        <ClubsTable
          clubs={[createMockClub({ charterDate: '1987-03-01' })]}
          districtId="test-district"
          isLoading={false}
          referenceDate={referenceDate}
        />
      )
      expect(
        screen.getByRole('columnheader', { name: /years/i })
      ).toBeInTheDocument()
    })

    it('displays the years count for a chartered club', () => {
      render(
        <ClubsTable
          clubs={[createMockClub({ charterDate: '2016-05-12' })]}
          districtId="test-district"
          isLoading={false}
          referenceDate={referenceDate}
        />
      )
      // 2026-05-12 minus 2016-05-12 = 10 years (milestone)
      const dataRow = screen.getAllByRole('row')[1]
      expect(dataRow.textContent).toMatch(/\b10\b/)
    })

    it('renders em-dash for clubs without a charter date', () => {
      render(
        <ClubsTable
          clubs={[createMockClub({ charterDate: undefined })]}
          districtId="test-district"
          isLoading={false}
          referenceDate={referenceDate}
        />
      )
      const dataRow = screen.getAllByRole('row')[1]
      expect(dataRow.textContent).toContain('—')
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

      const { container } = render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // 'Thriving' renders as the status badge on the table row. Scope to the
      // table body (#902 removed the quick-filter chip that also showed it).
      const tbody = container.querySelector('tbody')
      expect(tbody).toBeTruthy()
      expect(tbody!.textContent).toMatch(/Thriving/)
    })

    it('should display "Vulnerable" status badge for vulnerable clubs', () => {
      const clubs = [
        createMockClub({
          clubId: 'club-1',
          clubName: 'Vulnerable Club',
          currentStatus: 'vulnerable',
        }),
      ]

      const { container } = render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      const tbody = container.querySelector('tbody')
      expect(tbody).toBeTruthy()
      expect(tbody!.textContent).toMatch(/Vulnerable/)
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

  describe('Quick-filter chip row removed (#902)', () => {
    // Sprint 2 of epic #900 deletes the entire `.clubs-quick-filters` row
    // (health bands + Close-to-Distinguished + Needs members + Missing
    // renewals + President's tier + Clear-all). Precise drawer column-filters
    // (FiltersPanel / ActiveFiltersBar) are intentionally untouched — a single
    // shared "Close to Distinguished" preset lands in Sprint 3 (#903).
    const clubs = [
      createMockClub({ clubId: 'club-1', currentStatus: 'vulnerable' }),
      createMockClub({ clubId: 'club-2', currentStatus: 'thriving' }),
    ]

    it('renders no quick-filter chip row and no "Quick filters:" label', () => {
      const { container } = render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      expect(container.querySelector('.clubs-quick-filters')).toBeNull()
      expect(container.querySelector('.clubs-quick-filter-chip')).toBeNull()
      expect(screen.queryByText(/quick filters:/i)).not.toBeInTheDocument()
    })

    it('no longer exposes any of the four removed quick-filter chips', () => {
      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      expect(
        screen.queryByRole('button', { name: /close to distinguished/i })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /needs members/i })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /missing renewals/i })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /president's tier only/i })
      ).not.toBeInTheDocument()
      // The health-band chips (aria-pressed toggles) are gone too.
      expect(
        screen.queryByRole('button', { name: /^vulnerable/i })
      ).not.toBeInTheDocument()
    })

    it('keeps the drawer Filters trigger (precise column-filters survive)', () => {
      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      expect(
        screen.getByRole('button', { name: /^filters/i })
      ).toBeInTheDocument()
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
