/**
 * TargetProgressCard Unit Tests
 *
 * Tests for the TargetProgressCard component and its helper functions.
 * Covers target achievement visual indicators, progress bars, rankings display,
 * and missing data handling.
 *
 * Converted from property-based tests to example-based unit tests per
 * property-testing-guidance.md - UI component display testing is better
 * served by well-chosen examples than random generation.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import {
  TargetProgressCard,
  RecognitionTargets,
  MetricRankings,
} from '../TargetProgressCard'
import {
  isLevelAchieved,
  isLevelAtOrBelowAchieved,
} from '../../utils/targetProgressHelpers'
// Test icon component
const TestIcon = () => (
  <svg data-testid="test-icon" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
  </svg>
)

// Standard test targets (ascending order: distinguished < select < presidents < smedley)
const standardTargets: RecognitionTargets = {
  distinguished: 50,
  select: 75,
  presidents: 100,
  smedley: 125,
}

// Standard rankings for testing
const standardRankings: MetricRankings = {
  worldRank: 10,
  worldPercentile: 90,
  regionRank: 5,
  totalDistricts: 100,
  totalInRegion: 20,
  region: 'Region 1',
}

describe('TargetProgressCard', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  describe('Target Achievement Visual Indication', () => {
    it('displays checkmark when distinguished target is exactly met', () => {
      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={50}
          base={100}
          targets={standardTargets}
          achievedLevel="distinguished"
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      const achievedIndicator = screen.getByTestId(
        'achieved-indicator-distinguished'
      )
      expect(achievedIndicator).toBeInTheDocument()
      expect(achievedIndicator).toHaveTextContent('✓')
    })

    it('displays checkmark when target is exceeded', () => {
      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={80}
          base={100}
          targets={standardTargets}
          achievedLevel="select"
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      // Both distinguished and select should show checkmarks
      expect(
        screen.getByTestId('achieved-indicator-distinguished')
      ).toHaveTextContent('✓')
      expect(screen.getByTestId('achieved-indicator-select')).toHaveTextContent(
        '✓'
      )
    })

    it('displays checkmarks for all levels when smedley is achieved', () => {
      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={130}
          base={100}
          targets={standardTargets}
          achievedLevel="smedley"
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      // All four levels should show checkmarks
      expect(
        screen.getByTestId('achieved-indicator-distinguished')
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('achieved-indicator-select')
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('achieved-indicator-presidents')
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('achieved-indicator-smedley')
      ).toBeInTheDocument()
    })

    it('displays no checkmarks when below all targets', () => {
      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={25}
          base={100}
          targets={standardTargets}
          achievedLevel={null}
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      // No achievement indicators should be present
      expect(
        screen.queryByTestId('achieved-indicator-distinguished')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('achieved-indicator-select')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('achieved-indicator-presidents')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('achieved-indicator-smedley')
      ).not.toBeInTheDocument()
    })
  })

  describe('Progress Bar Display', () => {
    it('renders progress bars for all recognition levels', () => {
      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={60}
          base={100}
          targets={standardTargets}
          achievedLevel="distinguished"
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      const progressBars = screen.getByTestId('target-progress-bars')
      expect(progressBars).toBeInTheDocument()

      // All four progress bars should exist
      expect(
        screen.getByTestId('progress-bar-distinguished')
      ).toBeInTheDocument()
      expect(screen.getByTestId('progress-bar-select')).toBeInTheDocument()
      expect(screen.getByTestId('progress-bar-presidents')).toBeInTheDocument()
      expect(screen.getByTestId('progress-bar-smedley')).toBeInTheDocument()
    })

    it('marks progress bars as achieved when target is met', () => {
      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={80}
          base={100}
          targets={standardTargets}
          achievedLevel="select"
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      // Distinguished and select should be achieved
      expect(screen.getByTestId('progress-bar-distinguished')).toHaveAttribute(
        'data-achieved',
        'true'
      )
      expect(screen.getByTestId('progress-bar-select')).toHaveAttribute(
        'data-achieved',
        'true'
      )

      // Presidents and smedley should not be achieved
      expect(screen.getByTestId('progress-bar-presidents')).toHaveAttribute(
        'data-achieved',
        'false'
      )
      expect(screen.getByTestId('progress-bar-smedley')).toHaveAttribute(
        'data-achieved',
        'false'
      )
    })

    it('marks all progress bars as not achieved when below all targets', () => {
      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={25}
          base={100}
          targets={standardTargets}
          achievedLevel={null}
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      expect(screen.getByTestId('progress-bar-distinguished')).toHaveAttribute(
        'data-achieved',
        'false'
      )
      expect(screen.getByTestId('progress-bar-select')).toHaveAttribute(
        'data-achieved',
        'false'
      )
      expect(screen.getByTestId('progress-bar-presidents')).toHaveAttribute(
        'data-achieved',
        'false'
      )
      expect(screen.getByTestId('progress-bar-smedley')).toHaveAttribute(
        'data-achieved',
        'false'
      )
    })
  })

  describe('Rankings Display', () => {
    it('displays world rank when available', () => {
      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={60}
          base={100}
          targets={standardTargets}
          achievedLevel="distinguished"
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      const worldRank = screen.getByTestId('world-rank')
      expect(worldRank).toBeInTheDocument()
      expect(worldRank).toHaveTextContent('#10')
    })

    it('displays region rank when region is known', () => {
      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={60}
          base={100}
          targets={standardTargets}
          achievedLevel="distinguished"
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      const regionRank = screen.getByTestId('region-rank')
      expect(regionRank).toBeInTheDocument()
      expect(regionRank).toHaveTextContent('Region 1')
      expect(regionRank).toHaveTextContent('#5')
    })

    it('does not display region rank when region is null', () => {
      const rankingsWithoutRegion: MetricRankings = {
        worldRank: 10,
        worldPercentile: 90,
        regionRank: null,
        totalDistricts: 100,
        totalInRegion: 0,
        region: null,
      }

      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={60}
          base={100}
          targets={standardTargets}
          achievedLevel="distinguished"
          rankings={rankingsWithoutRegion}
          colorScheme="blue"
        />
      )

      // Region rank should not be displayed
      expect(screen.queryByTestId('region-rank')).not.toBeInTheDocument()

      // World rank should still be displayed
      expect(screen.getByTestId('world-rank')).toBeInTheDocument()
    })
  })

  describe('Missing Data Handling', () => {
    it('displays N/A when targets are unavailable', () => {
      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={60}
          base={null}
          targets={null}
          achievedLevel={null}
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      const unavailableIndicator = screen.getByTestId('targets-unavailable')
      expect(unavailableIndicator).toBeInTheDocument()
      expect(unavailableIndicator).toHaveTextContent('N/A')

      // Progress bars should not be displayed
      expect(
        screen.queryByTestId('target-progress-bars')
      ).not.toBeInTheDocument()
    })

    it('displays dash for world rank when unavailable', () => {
      const rankingsWithNullWorldRank: MetricRankings = {
        worldRank: null,
        worldPercentile: null,
        regionRank: null,
        totalDistricts: 100,
        totalInRegion: 0,
        region: null,
      }

      renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={60}
          base={100}
          targets={standardTargets}
          achievedLevel="distinguished"
          rankings={rankingsWithNullWorldRank}
          colorScheme="blue"
        />
      )

      const worldRank = screen.getByTestId('world-rank')
      expect(worldRank).toHaveTextContent('—')
    })
  })

  describe('Basic Rendering', () => {
    it('displays the title and current value', () => {
      renderWithProviders(
        <TargetProgressCard
          title="Membership Growth"
          icon={<TestIcon />}
          current={1234}
          base={100}
          targets={standardTargets}
          achievedLevel={null}
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      expect(screen.getByText('Membership Growth')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()
    })

    it('renders with different color schemes', () => {
      const { rerender } = renderWithProviders(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={60}
          base={100}
          targets={standardTargets}
          achievedLevel="distinguished"
          rankings={standardRankings}
          colorScheme="blue"
        />
      )

      expect(screen.getByTestId('target-progress-card')).toBeInTheDocument()

      // Rerender with green color scheme
      rerender(
        <TargetProgressCard
          title="Test Metric"
          icon={<TestIcon />}
          current={60}
          base={100}
          targets={standardTargets}
          achievedLevel="distinguished"
          rankings={standardRankings}
          colorScheme="green"
        />
      )

      expect(screen.getByTestId('target-progress-card')).toBeInTheDocument()
    })
  })
})

describe('Helper Functions', () => {
  describe('isLevelAchieved', () => {
    it('returns true when current equals target', () => {
      expect(isLevelAchieved('distinguished', 50, standardTargets)).toBe(true)
      expect(isLevelAchieved('select', 75, standardTargets)).toBe(true)
      expect(isLevelAchieved('presidents', 100, standardTargets)).toBe(true)
      expect(isLevelAchieved('smedley', 125, standardTargets)).toBe(true)
    })

    it('returns true when current exceeds target', () => {
      expect(isLevelAchieved('distinguished', 60, standardTargets)).toBe(true)
      expect(isLevelAchieved('select', 80, standardTargets)).toBe(true)
      expect(isLevelAchieved('presidents', 110, standardTargets)).toBe(true)
      expect(isLevelAchieved('smedley', 150, standardTargets)).toBe(true)
    })

    it('returns false when current is below target', () => {
      expect(isLevelAchieved('distinguished', 49, standardTargets)).toBe(false)
      expect(isLevelAchieved('select', 74, standardTargets)).toBe(false)
      expect(isLevelAchieved('presidents', 99, standardTargets)).toBe(false)
      expect(isLevelAchieved('smedley', 124, standardTargets)).toBe(false)
    })

    it('returns false when targets is null', () => {
      expect(isLevelAchieved('distinguished', 100, null)).toBe(false)
      expect(isLevelAchieved('smedley', 1000, null)).toBe(false)
    })

    it('handles edge case of zero current value', () => {
      expect(isLevelAchieved('distinguished', 0, standardTargets)).toBe(false)
    })
  })

  describe('isLevelAtOrBelowAchieved', () => {
    it('returns true for the achieved level itself', () => {
      expect(isLevelAtOrBelowAchieved('distinguished', 'distinguished')).toBe(
        true
      )
      expect(isLevelAtOrBelowAchieved('select', 'select')).toBe(true)
      expect(isLevelAtOrBelowAchieved('presidents', 'presidents')).toBe(true)
      expect(isLevelAtOrBelowAchieved('smedley', 'smedley')).toBe(true)
    })

    it('returns true for levels below the achieved level', () => {
      // When smedley is achieved, all lower levels should return true
      expect(isLevelAtOrBelowAchieved('distinguished', 'smedley')).toBe(true)
      expect(isLevelAtOrBelowAchieved('select', 'smedley')).toBe(true)
      expect(isLevelAtOrBelowAchieved('presidents', 'smedley')).toBe(true)

      // When presidents is achieved
      expect(isLevelAtOrBelowAchieved('distinguished', 'presidents')).toBe(true)
      expect(isLevelAtOrBelowAchieved('select', 'presidents')).toBe(true)

      // When select is achieved
      expect(isLevelAtOrBelowAchieved('distinguished', 'select')).toBe(true)
    })

    it('returns false for levels above the achieved level', () => {
      // When distinguished is achieved, higher levels should return false
      expect(isLevelAtOrBelowAchieved('select', 'distinguished')).toBe(false)
      expect(isLevelAtOrBelowAchieved('presidents', 'distinguished')).toBe(
        false
      )
      expect(isLevelAtOrBelowAchieved('smedley', 'distinguished')).toBe(false)

      // When select is achieved
      expect(isLevelAtOrBelowAchieved('presidents', 'select')).toBe(false)
      expect(isLevelAtOrBelowAchieved('smedley', 'select')).toBe(false)
    })

    it('returns false when achievedLevel is null', () => {
      expect(isLevelAtOrBelowAchieved('distinguished', null)).toBe(false)
      expect(isLevelAtOrBelowAchieved('select', null)).toBe(false)
      expect(isLevelAtOrBelowAchieved('presidents', null)).toBe(false)
      expect(isLevelAtOrBelowAchieved('smedley', null)).toBe(false)
    })
  })
})
