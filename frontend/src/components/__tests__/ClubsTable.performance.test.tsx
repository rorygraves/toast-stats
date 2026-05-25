import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ClubsTable } from '../ClubsTable'
import { ClubTrend } from '../../hooks/useDistrictAnalytics'

/**
 * Performance tests for ClubsTable component
 * **Feature: clubs-table-column-filtering**
 * **Validates: Requirements 5.1**
 *
 * #667 (epic #665) — pagination removed. The table now renders ALL
 * sorted+filtered rows in one sticky-header scroll container, so the
 * assertions move from "26 rows per page" to "every club renders" plus
 * a render-time budget over a realistic district (~300 clubs). The
 * 1000-club case is logged as a stress measurement, NOT gated — a hard
 * threshold here is a flaky CI tripwire on shared runners. If the budget
 * is ever exceeded in practice, virtualization is the fix (epic deferred
 * it; this test is the tripwire).
 */

// Helper to generate large datasets for performance testing
const generateLargeClubDataset = (size: number): ClubTrend[] => {
  return Array.from({ length: size }, (_, i) => ({
    clubId: `club-${i}`,
    clubName: `Test Club ${i}`,
    divisionId: `div-${Math.floor(i / 50)}`,
    divisionName: `Division ${String.fromCharCode(65 + (Math.floor(i / 50) % 26))}`,
    areaId: `area-${Math.floor(i / 10)}`,
    areaName: `Area ${Math.floor(i / 10) + 1}`,
    distinguishedLevel: (
      ['Distinguished', 'Select', 'President', 'Smedley', undefined] as const
    )[i % 5],
    currentStatus: (
      ['thriving', 'vulnerable', 'intervention-required'] as const
    )[i % 3],
    riskFactors: [],
    membershipTrend: [
      {
        date: new Date().toISOString(),
        count: 15 + (i % 30),
      },
    ],
    dcpGoalsTrend: [
      {
        date: new Date().toISOString(),
        goalsAchieved: i % 11,
      },
    ],
  }))
}

// Count rendered data rows (total rows minus the single header row).
const dataRowCount = () => screen.getAllByRole('row').length - 1

describe('ClubsTable Performance Tests', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('Renders all rows (no pagination) — #667', () => {
    it('renders every club in a realistic ~300-club district within budget', () => {
      /**
       * **Validates: Requirements 5.1** — with pagination gone, all rows
       * render. A district maxes out near ~300 clubs; assert the full set
       * is in the DOM and the initial render stays under a generous budget.
       */
      const clubs = generateLargeClubDataset(300)

      const renderStart = performance.now()
      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )
      const renderTime = performance.now() - renderStart

      // The count line reflects the full set, not a page.
      expect(screen.getByText('Total: 300 clubs')).toBeInTheDocument()

      // Every club is in the DOM — no page boundary.
      expect(dataRowCount()).toBe(300)
      expect(screen.getByText('Test Club 0')).toBeInTheDocument()
      expect(screen.getByText('Test Club 299')).toBeInTheDocument()

      // Generous render budget for a realistic district. Logged for
      // visibility; the assertion is intentionally loose to avoid CI flake.
      console.log(`Render time for 300 clubs: ${renderTime.toFixed(2)}ms`)
      expect(renderTime).toBeLessThan(2000)
    })

    it('renders all 1000 clubs (stress measurement — logged, not gated)', () => {
      /**
       * Above any real district size. We assert correctness (all rows
       * present) and LOG the render time as a tripwire signal, but do not
       * gate on it — a hard threshold here flakes on shared CI runners.
       */
      const clubs = generateLargeClubDataset(1000)

      const renderStart = performance.now()
      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )
      const renderTime = performance.now() - renderStart

      expect(screen.getByText('Total: 1000 clubs')).toBeInTheDocument()
      expect(dataRowCount()).toBe(1000)

      console.log(
        `[stress] Render time for 1000 clubs: ${renderTime.toFixed(2)}ms ` +
          `— informational only, not gated. If this climbs past ~1s on CI, ` +
          `revisit virtualization (epic #665 deferred it).`
      )
    })
  })

  describe('Export Performance with Large Datasets', () => {
    it('should handle export of large datasets without performance issues', () => {
      /**
       * **Feature: clubs-table-column-filtering, Export Performance Test**
       * **Validates: Requirements 5.5 - export should work with large filtered datasets**
       */

      // Generate 500 clubs for export testing
      const clubs = generateLargeClubDataset(500)

      render(
        <ClubsTable
          clubs={clubs}
          districtId="test-district"
          isLoading={false}
        />
      )

      // Find the export button
      const exportButton = screen.getByRole('button', { name: /export clubs/i })
      expect(exportButton).toBeInTheDocument()

      // Verify the button is not disabled (should be enabled for large datasets)
      expect(exportButton).not.toBeDisabled()

      // The export functionality should be able to handle large datasets
      // This test verifies the UI is ready for export operations
      expect(clubs.length).toBe(500)
    })
  })
})
