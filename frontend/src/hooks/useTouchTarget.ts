/**
 * Touch Target Validation Hook
 *
 * This hook provides utilities for validating that interactive elements
 * meet the minimum 44px touch target requirement for accessibility.
 *
 * Requirements: 3.2 - Touch Target Accessibility
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { INTERACTIVE_SELECTORS } from '../utils/touchTargetUtils'

export interface TouchTargetResult {
  width: number
  height: number
  passes: boolean
  element: HTMLElement
  recommendation?: string
}

export interface TouchTargetValidationOptions {
  minSize?: number
  includeMargin?: boolean
  checkOnResize?: boolean
  onViolation?: (result: TouchTargetResult) => void
}

/**
 * Hook for validating touch target accessibility
 */
export function useTouchTarget(options: TouchTargetValidationOptions = {}) {
  const {
    minSize = 44,
    includeMargin = true,
    checkOnResize = true,
    onViolation,
  } = options

  const [violations, setViolations] = useState<TouchTargetResult[]>([])
  const observerRef = useRef<ResizeObserver | null>(null)
  const elementsRef = useRef<Set<HTMLElement>>(new Set())

  /**
   * Check if an element meets touch target requirements
   */
  const checkTouchTarget = useCallback(
    (element: HTMLElement): TouchTargetResult => {
      const rect = element.getBoundingClientRect()
      let effectiveWidth = rect.width
      let effectiveHeight = rect.height

      if (includeMargin) {
        const computedStyle = window.getComputedStyle(element)
        const marginLeft = parseFloat(computedStyle.marginLeft) || 0
        const marginRight = parseFloat(computedStyle.marginRight) || 0
        const marginTop = parseFloat(computedStyle.marginTop) || 0
        const marginBottom = parseFloat(computedStyle.marginBottom) || 0

        effectiveWidth += marginLeft + marginRight
        effectiveHeight += marginTop + marginBottom
      }

      const passes = effectiveWidth >= minSize && effectiveHeight >= minSize

      let recommendation: string | undefined
      if (!passes) {
        const widthDeficit = Math.max(0, minSize - effectiveWidth)
        const heightDeficit = Math.max(0, minSize - effectiveHeight)

        if (widthDeficit > 0 && heightDeficit > 0) {
          recommendation = `Increase width by ${widthDeficit.toFixed(1)}px and height by ${heightDeficit.toFixed(1)}px to meet ${minSize}px minimum`
        } else if (widthDeficit > 0) {
          recommendation = `Increase width by ${widthDeficit.toFixed(1)}px to meet ${minSize}px minimum`
        } else {
          recommendation = `Increase height by ${heightDeficit.toFixed(1)}px to meet ${minSize}px minimum`
        }
      }

      return {
        width: effectiveWidth,
        height: effectiveHeight,
        passes,
        element,
        ...(recommendation && { recommendation }),
      }
    },
    [minSize, includeMargin]
  )

  /**
   * Validate all interactive elements in a container
   */
  const validateAllTouchTargets = useCallback(
    (container: HTMLElement = document.body): TouchTargetResult[] => {
      const elements = container.querySelectorAll(
        INTERACTIVE_SELECTORS.join(', ')
      )
      const results: TouchTargetResult[] = []

      elements.forEach(element => {
        const htmlElement = element as HTMLElement

        // Skip hidden elements
        const computedStyle = window.getComputedStyle(htmlElement)
        if (
          computedStyle.display === 'none' ||
          computedStyle.visibility === 'hidden'
        ) {
          return
        }

        const result = checkTouchTarget(htmlElement)
        results.push(result)

        if (!result.passes && onViolation) {
          onViolation(result)
        }
      })

      return results
    },
    [checkTouchTarget, onViolation]
  )

  /**
   * Register an element for continuous monitoring
   */
  const registerElement = useCallback(
    (element: HTMLElement) => {
      elementsRef.current.add(element)

      if (checkOnResize && !observerRef.current) {
        observerRef.current = new ResizeObserver(entries => {
          const newViolations: TouchTargetResult[] = []

          entries.forEach(entry => {
            const element = entry.target as HTMLElement
            const result = checkTouchTarget(element)

            if (!result.passes) {
              newViolations.push(result)
              if (onViolation) {
                onViolation(result)
              }
            }
          })

          setViolations(prev => {
            // Remove old violations for these elements and add new ones
            const elementSet = new Set(entries.map(entry => entry.target))
            const filtered = prev.filter(v => !elementSet.has(v.element))
            return [...filtered, ...newViolations]
          })
        })
      }

      if (observerRef.current) {
        observerRef.current.observe(element)
      }

      // Initial check
      const result = checkTouchTarget(element)
      if (!result.passes) {
        setViolations(prev => [
          ...prev.filter(v => v.element !== element),
          result,
        ])
        if (onViolation) {
          onViolation(result)
        }
      }
    },
    [checkTouchTarget, checkOnResize, onViolation]
  )

  /**
   * Unregister an element from monitoring
   */
  const unregisterElement = useCallback((element: HTMLElement) => {
    elementsRef.current.delete(element)

    if (observerRef.current) {
      observerRef.current.unobserve(element)
    }

    setViolations(prev => prev.filter(v => v.element !== element))
  }, [])

  /**
   * Get current violations
   */
  const getCurrentViolations = useCallback(() => {
    return violations
  }, [violations])

  /**
   * Check all registered elements
   */
  const recheckAll = useCallback(() => {
    const newViolations: TouchTargetResult[] = []

    elementsRef.current.forEach(element => {
      const result = checkTouchTarget(element)
      if (!result.passes) {
        newViolations.push(result)
        if (onViolation) {
          onViolation(result)
        }
      }
    })

    setViolations(newViolations)
  }, [checkTouchTarget, onViolation])

  /**
   * Auto-fix touch target by adding padding
   */
  const autoFixTouchTarget = useCallback(
    (element: HTMLElement): boolean => {
      const result = checkTouchTarget(element)
      if (result.passes) return true

      const widthDeficit = Math.max(0, minSize - result.width)
      const heightDeficit = Math.max(0, minSize - result.height)

      if (widthDeficit > 0 || heightDeficit > 0) {
        const computedStyle = window.getComputedStyle(element)
        const currentPaddingLeft = parseFloat(computedStyle.paddingLeft) || 0
        const currentPaddingRight = parseFloat(computedStyle.paddingRight) || 0
        const currentPaddingTop = parseFloat(computedStyle.paddingTop) || 0
        const currentPaddingBottom =
          parseFloat(computedStyle.paddingBottom) || 0

        // Add padding to reach minimum size
        const additionalHorizontalPadding = widthDeficit / 2
        const additionalVerticalPadding = heightDeficit / 2

        element.style.paddingLeft = `${currentPaddingLeft + additionalHorizontalPadding}px`
        element.style.paddingRight = `${currentPaddingRight + additionalHorizontalPadding}px`
        element.style.paddingTop = `${currentPaddingTop + additionalVerticalPadding}px`
        element.style.paddingBottom = `${currentPaddingBottom + additionalVerticalPadding}px`

        // Verify the fix worked
        const newResult = checkTouchTarget(element)
        return newResult.passes
      }

      return false
    },
    [checkTouchTarget, minSize]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return {
    checkTouchTarget,
    validateAllTouchTargets,
    registerElement,
    unregisterElement,
    getCurrentViolations,
    recheckAll,
    autoFixTouchTarget,
    violations,
  }
}

/**
 * Hook for automatically monitoring touch targets in a container
 */
export function useAutoTouchTargetValidation(
  containerRef: React.RefObject<HTMLElement>,
  options: TouchTargetValidationOptions = {}
) {
  const touchTarget = useTouchTarget(options)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    // Use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setIsValidating(true)
      touchTarget.validateAllTouchTargets(containerRef.current!)
      setIsValidating(false)
    }, 0)

    // Register all interactive elements for monitoring
    const interactiveElements = containerRef.current.querySelectorAll(
      'button, a[href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"], [onclick]'
    )

    interactiveElements.forEach(element => {
      touchTarget.registerElement(element as HTMLElement)
    })

    return () => {
      clearTimeout(timeoutId)
      interactiveElements.forEach(element => {
        touchTarget.unregisterElement(element as HTMLElement)
      })
    }
  }, [containerRef, touchTarget])

  return {
    ...touchTarget,
    isValidating,
  }
}

// Re-export utility functions for backward compatibility
export {
  isInteractiveElement,
  getAllInteractiveElements,
} from '../utils/touchTargetUtils'
