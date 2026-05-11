import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import { YearOverYearComparison } from '../YearOverYearComparison'
const defaultCurrentYear = {
  totalMembership: 1000,
  distinguishedClubs: 10,
  thrivingClubs: 5,
  totalClubs: 20,
}

describe('YearOverYearComparison', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  describe('zero-change guard (Requirement 3.1)', () => {
    it('renders "No Historical Data" empty state when all yearOverYear changes are zero', () => {
      renderWithProviders(
        <YearOverYearComparison
          yearOverYear={{
            membershipChange: 0,
            distinguishedChange: 0,
            clubHealthChange: 0,
          }}
          currentYear={defaultCurrentYear}
        />
      )

      expect(screen.getByText('No Historical Data')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Year-over-year comparison requires data from previous program years. Continue collecting data to enable this feature.'
        )
      ).toBeInTheDocument()

      // Should NOT render comparison cards
      expect(screen.queryByText('Total Membership')).not.toBeInTheDocument()
      expect(screen.queryByText('Distinguished Clubs')).not.toBeInTheDocument()
      expect(screen.queryByText('Thriving Clubs %')).not.toBeInTheDocument()
    })
  })

  describe('non-zero yearOverYear renders comparison cards (Requirement 3.2)', () => {
    it('renders comparison cards when at least one change value is non-zero', () => {
      renderWithProviders(
        <YearOverYearComparison
          yearOverYear={{
            membershipChange: 5.2,
            distinguishedChange: 0,
            clubHealthChange: -3.1,
          }}
          currentYear={defaultCurrentYear}
        />
      )

      // Should render the comparison view with metric cards and charts
      // Each metric appears twice: once in the comparison card (h3) and once in the chart (h4)
      expect(
        screen.getAllByText('Total Membership').length
      ).toBeGreaterThanOrEqual(1)
      expect(
        screen.getAllByText('Distinguished Clubs').length
      ).toBeGreaterThanOrEqual(1)
      expect(
        screen.getAllByText('Thriving Clubs %').length
      ).toBeGreaterThanOrEqual(1)

      // Should render the Year-Over-Year Comparison heading
      expect(screen.getByText('Year-Over-Year Comparison')).toBeInTheDocument()

      // Should NOT render the empty state
      expect(screen.queryByText('No Historical Data')).not.toBeInTheDocument()
    })
  })

  describe('undefined yearOverYear renders empty state (existing behavior)', () => {
    it('renders "No Historical Data" empty state when yearOverYear is undefined', () => {
      renderWithProviders(
        <YearOverYearComparison currentYear={defaultCurrentYear} />
      )

      expect(screen.getByText('No Historical Data')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Year-over-year comparison requires data from previous program years. Continue collecting data to enable this feature.'
        )
      ).toBeInTheDocument()

      // Should NOT render comparison cards
      expect(screen.queryByText('Total Membership')).not.toBeInTheDocument()
    })
  })
})
