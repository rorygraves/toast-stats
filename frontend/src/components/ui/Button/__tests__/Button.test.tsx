import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

// Provider-free unit-test render (#473): the component under test
// uses no router / no React Query, so wrapping each render in a
// fresh QueryClient + memory router was pure contention amplifier.
const renderWithProviders = (ui: React.ReactElement) => render(ui)
const cleanupAllResources = () => cleanup()
import { describe, it, expect, vi, afterEach } from 'vitest'
import Button from '../Button'
import {
  testComponentVariants,
  ComponentVariant,
} from '../../../../__tests__/utils/componentTestUtils'
import { ButtonProps } from '../types'

describe('Button Component', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  // Test all button variants using shared utility
  const buttonVariants: ComponentVariant<ButtonProps>[] = [
    {
      name: 'primary (default)',
      props: { children: 'Primary Button' },
      expectedText: 'Primary Button',
      expectedClass: 'bg-tm-loyal-blue',
    },
    {
      name: 'secondary',
      props: { children: 'Secondary Button', variant: 'secondary' },
      expectedText: 'Secondary Button',
      expectedClass: 'text-tm-loyal-blue',
    },
    {
      name: 'accent',
      props: { children: 'Accent Button', variant: 'accent' },
      expectedText: 'Accent Button',
      expectedClass: 'bg-tm-happy-yellow',
    },
    {
      name: 'ghost',
      props: { children: 'Ghost Button', variant: 'ghost' },
      expectedText: 'Ghost Button',
      expectedClass: 'text-tm-loyal-blue',
    },
  ]

  testComponentVariants(
    Button as unknown as React.ComponentType<Record<string, unknown>>,
    buttonVariants as unknown as ComponentVariant<Record<string, unknown>>[],
    {
      skipAccessibilityCheck: true, // Skip due to browser default button styling contrast issues
    }
  )

  // Test button sizes
  const buttonSizes: ComponentVariant<ButtonProps>[] = [
    {
      name: 'small size',
      props: { children: 'Small', size: 'sm' },
      expectedClass: 'min-h-[44px]',
    },
    {
      name: 'medium size (default)',
      props: { children: 'Medium', size: 'md' },
      expectedClass: 'min-h-[44px]',
    },
    {
      name: 'large size',
      props: { children: 'Large', size: 'lg' },
      expectedClass: 'min-h-[44px]',
    },
  ]

  testComponentVariants(
    Button as unknown as React.ComponentType<Record<string, unknown>>,
    buttonSizes as unknown as ComponentVariant<Record<string, unknown>>[],
    {
      skipAccessibilityCheck: true, // Skip due to browser default button styling contrast issues
    }
  )

  // Test button states
  const buttonStates: ComponentVariant<ButtonProps>[] = [
    {
      name: 'disabled state',
      props: { children: 'Disabled Button', disabled: true },
      customAssertion: container => {
        const button = container.querySelector('button')
        expect(button).toBeDisabled()
      },
    },
    {
      name: 'loading state',
      props: { children: 'Loading Button', loading: true },
      customAssertion: container => {
        const button = container.querySelector('button')
        expect(button).toBeDisabled()
        expect(button).toHaveAttribute('aria-busy', 'true')
        expect(button?.querySelector('svg')).toBeInTheDocument()
      },
    },
  ]

  testComponentVariants(
    Button as unknown as React.ComponentType<Record<string, unknown>>,
    buttonStates as unknown as ComponentVariant<Record<string, unknown>>[],
    {
      skipAccessibilityCheck: true, // Skip due to browser default button styling contrast issues
    }
  )

  // Test button types
  const buttonTypes: ComponentVariant<ButtonProps>[] = [
    {
      name: 'submit type',
      props: { children: 'Submit', type: 'submit' },
      expectedAttribute: { name: 'type', value: 'submit' },
    },
    {
      name: 'reset type',
      props: { children: 'Reset', type: 'reset' },
      expectedAttribute: { name: 'type', value: 'reset' },
    },
  ]

  testComponentVariants(
    Button as unknown as React.ComponentType<Record<string, unknown>>,
    buttonTypes as unknown as ComponentVariant<Record<string, unknown>>[],
    {
      skipAccessibilityCheck: true, // Skip due to browser default button styling contrast issues
    }
  )

  // Interactive behavior tests
  it('handles click events', () => {
    const handleClick = vi.fn()
    renderWithProviders(<Button onClick={handleClick}>Clickable Button</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('prevents click when disabled', () => {
    const handleClick = vi.fn()
    renderWithProviders(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  // Customization tests
  it('supports custom aria-label and className', () => {
    renderWithProviders(
      <Button aria-label="Custom label" className="custom">
        Button
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Custom label' })
    expect(button).toHaveClass('custom')
    expect(button).toHaveClass('bg-tm-loyal-blue') // Preserves variant classes
  })

  it('passes through additional props', () => {
    renderWithProviders(
      <Button data-testid="test-btn" id="btn">
        Button
      </Button>
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-testid', 'test-btn')
    expect(button).toHaveAttribute('id', 'btn')
  })
})
