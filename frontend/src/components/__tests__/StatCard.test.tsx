import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import StatCard from '../StatCard'
import {
  testComponentVariants,
  ComponentVariant,
} from '../../__tests__/utils/componentTestUtils'
import { StatCardProps } from '../StatCard'

describe('StatCard', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  // Test basic rendering variants
  const basicVariants: ComponentVariant<StatCardProps>[] = [
    {
      name: 'with name and value',
      props: { name: 'Total Members', value: 1250 },
      expectedText: 'Total Members',
      customAssertion: () => {
        expect(screen.getByText('1250')).toBeInTheDocument()
      },
    },
    {
      name: 'with string value',
      props: { name: 'Status', value: 'Active' },
      expectedText: 'Active',
    },
    {
      name: 'with loading state',
      props: { name: 'Total Members', value: 1250, isLoading: true },
      customAssertion: () => {
        expect(screen.getByLabelText('Loading statistics')).toBeInTheDocument()
        expect(screen.queryByText('Total Members')).not.toBeInTheDocument()
      },
    },
  ]

  testComponentVariants(
    StatCard as unknown as React.ComponentType<Record<string, unknown>>,
    basicVariants as unknown as ComponentVariant<Record<string, unknown>>[]
  )

  // Test trend variants with brand-compliant colors
  const trendVariants: ComponentVariant<StatCardProps>[] = [
    {
      name: 'positive trend',
      props: {
        name: 'Total Members',
        value: 1250,
        change: 50,
        changePercent: 4.2,
        trend: 'positive',
      },
      customAssertion: () => {
        const trendElement = screen.getByRole('status')
        expect(trendElement).toHaveTextContent('+50')
        expect(trendElement).toHaveTextContent('(+4.2%)')
        expect(trendElement).toHaveClass('tm-text-loyal-blue')
      },
    },
    {
      name: 'negative trend',
      props: {
        name: 'Total Members',
        value: 1200,
        change: -50,
        changePercent: -4.0,
        trend: 'negative',
      },
      customAssertion: () => {
        const trendElement = screen.getByRole('status')
        expect(trendElement).toHaveTextContent('-50')
        expect(trendElement).toHaveTextContent('(-4.0%)')
        expect(trendElement).toHaveClass('tm-text-true-maroon')
      },
    },
    {
      name: 'neutral trend',
      props: {
        name: 'Total Members',
        value: 1250,
        change: 0,
        changePercent: 0,
        trend: 'neutral',
      },
      customAssertion: () => {
        const trendElement = screen.getByRole('status')
        expect(trendElement).toHaveTextContent('0')
        expect(trendElement).toHaveClass('tm-text-cool-gray')
      },
    },
  ]

  testComponentVariants(
    StatCard as unknown as React.ComponentType<Record<string, unknown>>,
    trendVariants as unknown as ComponentVariant<Record<string, unknown>>[]
  )

  // Test footer content
  it('renders footer content when provided', () => {
    renderWithProviders(
      <StatCard
        name="Total Members"
        value={1250}
        footer={<div>Last updated: Today</div>}
      />
    )

    expect(screen.getByText('Last updated: Today')).toBeInTheDocument()
  })
})
