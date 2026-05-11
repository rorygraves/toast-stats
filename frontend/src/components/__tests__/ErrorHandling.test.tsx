import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import { LoadingSkeleton, Spinner } from '../LoadingSkeleton'
import { ErrorDisplay, EmptyState } from '../ErrorDisplay'
import {
  testComponentVariants,
  ComponentVariant,
} from '../../__tests__/utils/componentTestUtils'

describe('LoadingSkeleton', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  // Test LoadingSkeleton variants
  const skeletonVariants: ComponentVariant<{
    variant?: 'card' | 'table' | 'chart' | 'text' | 'stat'
    count?: number
  }>[] = [
    {
      name: 'card skeleton',
      props: { variant: 'card' },
      customAssertion: () => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('Loading content...')).toBeInTheDocument()
      },
    },
    {
      name: 'table skeleton',
      props: { variant: 'table', count: 3 },
      customAssertion: () => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('Loading table data...')).toBeInTheDocument()
      },
    },
    {
      name: 'chart skeleton',
      props: { variant: 'chart' },
      customAssertion: () => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('Loading chart…')).toBeInTheDocument()
      },
    },
    {
      name: 'stat skeleton',
      props: { variant: 'stat' },
      customAssertion: () => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('Loading statistics...')).toBeInTheDocument()
      },
    },
  ]

  testComponentVariants(
    LoadingSkeleton as unknown as React.ComponentType<Record<string, unknown>>,
    skeletonVariants as unknown as ComponentVariant<Record<string, unknown>>[]
  )
})

describe('Spinner', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  // Test Spinner variants
  const spinnerVariants: ComponentVariant<{
    size?: 'sm' | 'md' | 'lg'
    className?: string
  }>[] = [
    {
      name: 'default size',
      props: {},
      customAssertion: () => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      },
    },
    {
      name: 'small size',
      props: { size: 'sm' },
      customAssertion: container => {
        const spinner = container.querySelector('.h-4.w-4')
        expect(spinner).toBeInTheDocument()
      },
    },
    {
      name: 'large size',
      props: { size: 'lg' },
      customAssertion: container => {
        const spinner = container.querySelector('.h-12.w-12')
        expect(spinner).toBeInTheDocument()
      },
    },
  ]

  testComponentVariants(
    Spinner as unknown as React.ComponentType<Record<string, unknown>>,
    spinnerVariants as unknown as ComponentVariant<Record<string, unknown>>[]
  )
})

describe('ErrorDisplay', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  // Test ErrorDisplay variants
  const errorVariants: ComponentVariant<{
    error: Error
    onRetry?: () => void
    variant?: 'inline' | 'card' | 'full'
    showDetails?: boolean
  }>[] = [
    {
      name: 'basic error message',
      props: { error: new Error('Test error message') },
      customAssertion: () => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/Test error message/i)).toBeInTheDocument()
      },
    },
    {
      name: 'network error detection',
      props: { error: new Error('Network connection failed') },
      customAssertion: () => {
        expect(
          screen.getByText(/unable to connect to the server/i)
        ).toBeInTheDocument()
      },
    },
    {
      name: 'not found error detection',
      props: { error: new Error('404 not found') },
      customAssertion: () => {
        expect(screen.getByText(/could not be found/i)).toBeInTheDocument()
      },
    },
    {
      name: 'inline variant',
      props: {
        error: new Error('Inline error'),
        variant: 'inline',
      },
      customAssertion: container => {
        expect(container.querySelector('.text-red-600')).toBeInTheDocument()
      },
    },
    {
      name: 'with technical details',
      props: {
        error: new Error('Detailed error message'),
        showDetails: true,
      },
      customAssertion: () => {
        expect(screen.getByText('Technical Details')).toBeInTheDocument()
      },
    },
  ]

  testComponentVariants(
    ErrorDisplay as unknown as React.ComponentType<Record<string, unknown>>,
    errorVariants as unknown as ComponentVariant<Record<string, unknown>>[]
  )

  // Test retry functionality
  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn()
    renderWithProviders(
      <ErrorDisplay error={new Error('Network error')} onRetry={onRetry} />
    )

    const retryButton = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('EmptyState', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  // Test EmptyState variants
  const emptyStateVariants: ComponentVariant<{
    title: string
    message: string
    action?: { label: string; onClick: () => void }
    icon?: 'data' | 'search' | 'backfill'
  }>[] = [
    {
      name: 'basic empty state',
      props: { title: 'No Data', message: 'No data available' },
      customAssertion: () => {
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(screen.getByText('No Data')).toBeInTheDocument()
        expect(screen.getByText('No data available')).toBeInTheDocument()
      },
    },
    {
      name: 'with search icon',
      props: {
        title: 'No Results',
        message: 'Try another search',
        icon: 'search',
      },
      customAssertion: container => {
        expect(container.querySelector('svg')).toBeInTheDocument()
      },
    },
    {
      name: 'with backfill icon',
      props: {
        title: 'No Data',
        message: 'Start backfill',
        icon: 'backfill',
      },
      customAssertion: container => {
        expect(container.querySelector('svg')).toBeInTheDocument()
      },
    },
  ]

  testComponentVariants(
    EmptyState as unknown as React.ComponentType<Record<string, unknown>>,
    emptyStateVariants as unknown as ComponentVariant<Record<string, unknown>>[]
  )

  // Test action button functionality
  it('calls action onClick when button is clicked', () => {
    const onClick = vi.fn()
    renderWithProviders(
      <EmptyState
        title="No Data"
        message="No data available"
        action={{ label: 'Load Data', onClick }}
      />
    )

    const actionButton = screen.getByRole('button', { name: /load data/i })
    fireEvent.click(actionButton)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
