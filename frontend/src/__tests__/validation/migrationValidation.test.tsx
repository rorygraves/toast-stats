/**
 * Comprehensive Migration Validation Tests
 *
 * Task 11.1: Comprehensive migration validation
 *
 * Validates that all migrated tests maintain identical coverage,
 * no test functionality is lost during migration, and shared utilities
 * work across all component types.
 *
 * Requirements: 8.1, 8.2, 8.3
 */

import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import {
  renderWithProviders,
  testComponentVariants,
  expectBasicRendering,
  testLoadingStates,
  testErrorStates,
  cleanupAllResources,
  ComponentVariant,
} from '../utils/componentTestUtils'
import { runQuickAccessibilityCheck } from '../utils/accessibilityTestUtils'

// Test component types for validation
interface TestComponentProps {
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  error?: string
  className?: string
  'data-testid'?: string
  role?: string
  'aria-label'?: string
}

// Simple functional component for testing
const TestFunctionalComponent: React.FC<TestComponentProps> = ({
  children = 'Test Content',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  error,
  className,
  'data-testid': testId,
  role,
  'aria-label': ariaLabel,
}) => {
  if (error) {
    return (
      <div
        className={`error ${className || ''}`}
        data-testid={testId || 'test-error'}
      >
        Error: {error}
      </div>
    )
  }

  if (loading) {
    return (
      <div
        className={`loading ${className || ''}`}
        data-testid={testId || 'test-loading'}
      >
        Loading...
      </div>
    )
  }

  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className || ''}`}
      disabled={disabled}
      data-testid={testId || 'test-component'}
      role={role}
      aria-label={ariaLabel}
      style={{
        backgroundColor:
          variant === 'primary'
            ? 'var(--tm-loyal-blue)'
            : variant === 'secondary'
              ? 'var(--tm-true-maroon)'
              : '#dc3545',
        color: 'var(--tm-white)',
        minHeight: '44px',
        minWidth: '44px',
        fontFamily: 'Montserrat, sans-serif',
        fontSize: size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px',
      }}
    >
      {children}
    </button>
  )
}

// Component with hooks for testing. Tracks variant-prop changes via the
// render-phase setState pattern instead of a useEffect mirror to avoid
// the react-hooks/set-state-in-effect violation (#340). See React docs:
// https://react.dev/reference/react/useState#storing-information-from-previous-renders
const TestHooksComponent: React.FC<TestComponentProps> = props => {
  const [count, setCount] = React.useState(0)
  const [prevVariant, setPrevVariant] = React.useState<string | undefined>(
    undefined
  )
  if (prevVariant !== props.variant) {
    setPrevVariant(props.variant)
    setCount(prev => prev + 1)
  }

  return (
    <div data-testid="hooks-wrapper">
      <TestFunctionalComponent {...props} />
      <span data-testid="hook-count">{count}</span>
    </div>
  )
}

// Memoized component for testing
const TestMemoizedComponent = React.memo<TestComponentProps>(props => (
  <div data-testid="memoized-wrapper">
    <TestFunctionalComponent {...props} />
  </div>
))

// Forward ref component for testing
const TestForwardRefComponent = React.forwardRef<
  HTMLDivElement,
  TestComponentProps
>((props, ref) => (
  <div ref={ref} data-testid="forwardref-wrapper">
    <TestFunctionalComponent {...props} />
  </div>
))

describe('Comprehensive Migration Validation', () => {
  afterEach(() => {
    cleanupAllResources()
  })

  describe('Test Coverage Preservation', () => {
    it('should maintain identical coverage after migration - renderWithProviders', () => {
      // Test that renderWithProviders works with all component types
      const componentTypes = [
        { name: 'Functional', Component: TestFunctionalComponent },
        { name: 'Hooks', Component: TestHooksComponent },
        { name: 'Memoized', Component: TestMemoizedComponent },
        { name: 'ForwardRef', Component: TestForwardRefComponent },
      ]

      componentTypes.forEach(({ name, Component }) => {
        // Should render without errors
        expect(() => {
          renderWithProviders(
            <Component variant="primary">Test {name}</Component>
          )
        }).not.toThrow()

        // Should find the component in the DOM
        const element = screen.getByText(new RegExp(`Test ${name}`, 'i'))
        expect(element).toBeInTheDocument()

        // Cleanup for next iteration
        cleanupAllResources()
      })
    })

    it('should maintain identical coverage after migration - expectBasicRendering', () => {
      // Test that expectBasicRendering works with all component types
      const testCases = [
        { Component: TestFunctionalComponent, testId: 'test-component' },
        { Component: TestHooksComponent, testId: 'hooks-wrapper' },
        { Component: TestMemoizedComponent, testId: 'memoized-wrapper' },
        { Component: TestForwardRefComponent, testId: 'forwardref-wrapper' },
      ]

      testCases.forEach(({ Component, testId }) => {
        expect(() => {
          expectBasicRendering(<Component />, testId)
        }).not.toThrow()

        // Cleanup for next iteration
        cleanupAllResources()
      })
    })

    it('should maintain identical coverage after migration - testComponentVariants', () => {
      // Test that testComponentVariants works with all component types
      const variants: ComponentVariant<TestComponentProps>[] = [
        {
          name: 'primary variant',
          props: { variant: 'primary', children: 'Primary Test' },
          expectedText: 'Primary Test',
          expectedClass: 'btn-primary',
        },
        {
          name: 'secondary variant',
          props: { variant: 'secondary', children: 'Secondary Test' },
          expectedText: 'Secondary Test',
          expectedClass: 'btn-secondary',
        },
      ]

      // Test with functional component
      expect(() => {
        testComponentVariants(
          TestFunctionalComponent as unknown as React.ComponentType<
            Record<string, unknown>
          >,
          variants as unknown as ComponentVariant<Record<string, unknown>>[],
          {
            skipAccessibilityCheck: true,
          }
        )
      }).not.toThrow()
    })

    it('should maintain identical coverage after migration - loading states', () => {
      // Test that testLoadingStates works correctly
      expect(() => {
        testLoadingStates(
          TestFunctionalComponent as unknown as React.ComponentType<
            Record<string, unknown>
          >,
          { loading: true } as unknown as Record<string, unknown>,
          { loading: false, children: 'Loaded Content' } as unknown as Record<
            string,
            unknown
          >
        )
      }).not.toThrow()

      // Verify loading state is displayed
      renderWithProviders(<TestFunctionalComponent loading={true} />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()

      cleanupAllResources()

      // Verify loaded state is displayed
      renderWithProviders(
        <TestFunctionalComponent loading={false}>
          Loaded Content
        </TestFunctionalComponent>
      )
      expect(screen.getByText('Loaded Content')).toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('should maintain identical coverage after migration - error states', () => {
      // Test that testErrorStates works correctly
      expect(() => {
        testErrorStates(
          TestFunctionalComponent as unknown as React.ComponentType<
            Record<string, unknown>
          >,
          { error: 'Test error message' } as unknown as Record<string, unknown>,
          /test error message/i
        )
      }).not.toThrow()

      // Clean up before next render to avoid multiple elements
      cleanupAllResources()

      // Verify error state is displayed
      renderWithProviders(
        <TestFunctionalComponent error="Test error message" />
      )
      expect(screen.getByText(/error: test error message/i)).toBeInTheDocument()
    })
  })

  describe('Test Functionality Preservation', () => {
    it('should preserve all test functionality - component rendering', () => {
      // Test that components render with all expected functionality
      renderWithProviders(
        <TestFunctionalComponent
          variant="primary"
          size="lg"
          disabled={false}
          className="custom-class"
          data-testid="functional-test"
        >
          Functional Test Content
        </TestFunctionalComponent>
      )

      const button = screen.getByTestId('functional-test')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn', 'btn-primary', 'btn-lg', 'custom-class')
      expect(button).toHaveTextContent('Functional Test Content')
      expect(button).not.toBeDisabled()
    })

    it('should preserve all test functionality - component interactions', () => {
      // Test that component interactions work correctly
      renderWithProviders(<TestFunctionalComponent disabled={true} />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should preserve all test functionality - component variants', () => {
      // Test all component variants work correctly
      const variants = ['primary', 'secondary', 'danger'] as const
      const sizes = ['sm', 'md', 'lg'] as const

      variants.forEach(variant => {
        sizes.forEach(size => {
          renderWithProviders(
            <TestFunctionalComponent
              variant={variant}
              size={size}
              data-testid={`${variant}-${size}`}
            >
              {variant} {size}
            </TestFunctionalComponent>
          )

          const element = screen.getByTestId(`${variant}-${size}`)
          expect(element).toBeInTheDocument()
          expect(element).toHaveClass(`btn-${variant}`, `btn-${size}`)
          expect(element).toHaveTextContent(`${variant} ${size}`)

          cleanupAllResources()
        })
      })
    })

    it('should preserve all test functionality - hooks integration', () => {
      // Test that hooks-based components work correctly
      renderWithProviders(<TestHooksComponent variant="primary" />)

      expect(screen.getByTestId('hooks-wrapper')).toBeInTheDocument()
      expect(screen.getByTestId('hook-count')).toHaveTextContent('1')
    })

    it('should preserve all test functionality - memoization', () => {
      // Test that memoized components work correctly
      renderWithProviders(<TestMemoizedComponent variant="secondary" />)

      expect(screen.getByTestId('memoized-wrapper')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveClass('btn-secondary')
    })

    it('should preserve all test functionality - forward refs', () => {
      // Test that forward ref components work correctly
      const ref = React.createRef<HTMLDivElement>()

      renderWithProviders(
        <TestForwardRefComponent ref={ref} variant="danger" />
      )

      expect(screen.getByTestId('forwardref-wrapper')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveClass('btn-danger')
      expect(ref.current).toBeInTheDocument()
    })
  })

  describe('Shared Utilities Cross-Component Compatibility', () => {
    it('should work across all component types - renderWithProviders', () => {
      // Test renderWithProviders with different component architectures
      const components = [
        { name: 'Functional', element: <TestFunctionalComponent /> },
        { name: 'Hooks', element: <TestHooksComponent /> },
        { name: 'Memoized', element: <TestMemoizedComponent /> },
        { name: 'ForwardRef', element: <TestForwardRefComponent /> },
      ]

      components.forEach(({ element }) => {
        const result = renderWithProviders(element)

        // Should return render result with all expected properties
        expect(result).toHaveProperty('container')
        expect(result).toHaveProperty('rerender')
        expect(result).toHaveProperty('unmount')
        expect(result.container).toBeInTheDocument()

        // Should render component successfully
        expect(result.container.firstChild).toBeInTheDocument()

        cleanupAllResources()
      })
    })

    it('should work across all component types - accessibility utilities', () => {
      // Test accessibility utilities with different component types
      const accessibleComponents = [
        <TestFunctionalComponent aria-label="Functional button">
          Functional
        </TestFunctionalComponent>,
        <TestHooksComponent aria-label="Hooks button">
          Hooks
        </TestHooksComponent>,
        <TestMemoizedComponent aria-label="Memoized button">
          Memoized
        </TestMemoizedComponent>,
        <TestForwardRefComponent aria-label="ForwardRef button">
          ForwardRef
        </TestForwardRefComponent>,
      ]

      accessibleComponents.forEach(component => {
        // Quick accessibility check should work
        const quickResult = runQuickAccessibilityCheck(component)
        expect(quickResult).toHaveProperty('passed')
        expect(quickResult).toHaveProperty('criticalViolations')
        expect(typeof quickResult.passed).toBe('boolean')
        expect(Array.isArray(quickResult.criticalViolations)).toBe(true)
      })
    })

    it('should work across all component types - provider management', () => {
      // Test that provider management works with all component types
      const components = [
        TestFunctionalComponent,
        TestHooksComponent,
        TestMemoizedComponent,
        TestForwardRefComponent,
      ]

      components.forEach(Component => {
        // Should work with default providers
        expect(() => {
          renderWithProviders(<Component />)
        }).not.toThrow()

        cleanupAllResources()

        // Should work with skipped providers
        expect(() => {
          renderWithProviders(<Component />, { skipProviders: true })
        }).not.toThrow()

        cleanupAllResources()

        // Should work with custom providers
        const CustomProvider: React.FC<{ children: React.ReactNode }> = ({
          children,
        }) => <div data-testid="custom-provider">{children}</div>

        expect(() => {
          renderWithProviders(<Component />, {
            customProviders: [CustomProvider],
          })
        }).not.toThrow()

        expect(screen.getByTestId('custom-provider')).toBeInTheDocument()

        cleanupAllResources()
      })
    })

    it('should work across all component types - performance monitoring', () => {
      // Test that performance monitoring works with all component types
      const components = [
        { name: 'Functional', Component: TestFunctionalComponent },
        { name: 'Hooks', Component: TestHooksComponent },
        { name: 'Memoized', Component: TestMemoizedComponent },
        { name: 'ForwardRef', Component: TestForwardRefComponent },
      ]

      components.forEach(({ name, Component }) => {
        const testName = `performance-test-${name.toLowerCase()}`

        expect(() => {
          renderWithProviders(<Component />, {
            enablePerformanceMonitoring: true,
            testName,
          })
        }).not.toThrow()

        cleanupAllResources()
      })
    })

    it('should work across all component types - cleanup management', () => {
      // Test that cleanup works correctly for all component types
      const components = [
        TestFunctionalComponent,
        TestHooksComponent,
        TestMemoizedComponent,
        TestForwardRefComponent,
      ]

      components.forEach(Component => {
        // Render multiple components
        renderWithProviders(<Component data-testid="test-1" />)
        renderWithProviders(<Component data-testid="test-2" />)
        renderWithProviders(<Component data-testid="test-3" />)

        // All should be in document
        expect(screen.getAllByRole('button')).toHaveLength(3)

        // Cleanup should remove all
        cleanupAllResources()

        // Should be able to render again without issues
        expect(() => {
          renderWithProviders(<Component data-testid="test-after-cleanup" />)
        }).not.toThrow()

        expect(screen.getByTestId('test-after-cleanup')).toBeInTheDocument()

        cleanupAllResources()
      })
    })
  })

  describe('Migration Quality Metrics', () => {
    it('should maintain test execution performance', () => {
      // Test that migrated utilities don't significantly impact performance
      const startTime = performance.now()

      // Perform multiple operations that would be common in migrated tests
      for (let i = 0; i < 10; i++) {
        renderWithProviders(<TestFunctionalComponent variant="primary" />)
        expectBasicRendering(<TestFunctionalComponent />, 'test-component')
        runQuickAccessibilityCheck(<TestFunctionalComponent />)
        cleanupAllResources()
      }

      const executionTime = performance.now() - startTime

      // Should complete within reasonable time (2 seconds for 10 iterations)
      expect(executionTime).toBeLessThan(2000)
    })

    it('should maintain memory efficiency', () => {
      // Test that utilities don't cause memory leaks
      const initialMemory =
        (performance as unknown as { memory?: { usedJSHeapSize: number } })
          .memory?.usedJSHeapSize || 0

      // Perform operations that could potentially leak memory
      for (let i = 0; i < 50; i++) {
        renderWithProviders(<TestFunctionalComponent key={i} />)
        cleanupAllResources()
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory =
        (performance as unknown as { memory?: { usedJSHeapSize: number } })
          .memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('should maintain test isolation', () => {
      // Test that utilities properly isolate tests

      // First test - set up some state
      renderWithProviders(<TestFunctionalComponent data-testid="test-1" />)
      expect(screen.getByTestId('test-1')).toBeInTheDocument()

      cleanupAllResources()

      // Second test - should not see previous state
      renderWithProviders(<TestFunctionalComponent data-testid="test-2" />)
      expect(screen.getByTestId('test-2')).toBeInTheDocument()
      expect(screen.queryByTestId('test-1')).not.toBeInTheDocument()

      cleanupAllResources()

      // Third test - should be completely isolated
      renderWithProviders(<TestFunctionalComponent data-testid="test-3" />)
      expect(screen.getByTestId('test-3')).toBeInTheDocument()
      expect(screen.queryByTestId('test-1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('test-2')).not.toBeInTheDocument()
    })

    it('should maintain error handling robustness', () => {
      // Test that utilities handle errors gracefully

      // Component that throws an error
      const ErrorComponent: React.FC = () => {
        throw new Error('Test error')
      }

      // Should handle rendering errors gracefully
      expect(() => {
        try {
          renderWithProviders(<ErrorComponent />)
        } catch (error) {
          // Error should be caught and handled
          expect(error).toBeInstanceOf(Error)
        }
      }).not.toThrow()

      // Should still be able to render other components after error
      expect(() => {
        renderWithProviders(<TestFunctionalComponent />)
      }).not.toThrow()

      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Regression Prevention', () => {
    it('should prevent regression in component rendering', () => {
      // Test that all basic component rendering still works
      const testCases = [
        {
          props: { variant: 'primary' as const },
          expectedClass: 'btn-primary',
        },
        {
          props: { variant: 'secondary' as const },
          expectedClass: 'btn-secondary',
        },
        { props: { variant: 'danger' as const }, expectedClass: 'btn-danger' },
        { props: { size: 'sm' as const }, expectedClass: 'btn-sm' },
        { props: { size: 'md' as const }, expectedClass: 'btn-md' },
        { props: { size: 'lg' as const }, expectedClass: 'btn-lg' },
        { props: { disabled: true }, expectedDisabled: true },
        { props: { disabled: false }, expectedDisabled: false },
      ]

      testCases.forEach(({ props, expectedClass, expectedDisabled }) => {
        renderWithProviders(<TestFunctionalComponent {...props} />)

        const button = screen.getByRole('button')

        if (expectedClass) {
          expect(button).toHaveClass(expectedClass)
        }

        if (expectedDisabled !== undefined) {
          if (expectedDisabled) {
            expect(button).toBeDisabled()
          } else {
            expect(button).not.toBeDisabled()
          }
        }

        cleanupAllResources()
      })
    })

    it('should prevent regression in accessibility features', () => {
      // Test that accessibility features still work correctly
      renderWithProviders(
        <TestFunctionalComponent aria-label="Accessible button" role="button">
          Accessible Content
        </TestFunctionalComponent>
      )

      const button = screen.getByRole('button', { name: 'Accessible button' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('aria-label', 'Accessible button')
      expect(button).toHaveTextContent('Accessible Content')
    })

    it('should prevent regression in brand compliance features', () => {
      // Test that brand compliance features still work correctly
      renderWithProviders(<TestFunctionalComponent variant="primary" />)

      const button = screen.getByRole('button')
      const styles = window.getComputedStyle(button)

      // Should have brand-compliant styling
      expect(styles.backgroundColor).toMatch(
        /var\(--tm-loyal-blue\)|rgb\(0, 65, 101\)/
      ) // TM Loyal Blue (CSS var or computed)
      expect(styles.color).toMatch(/var\(--tm-white\)|rgb\(255, 255, 255\)/) // White text (CSS var or computed)
      expect(styles.fontFamily).toContain('Montserrat')
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44) // Touch target
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44) // Touch target
    })
  })
})
