/**
 * Property Test: Touch Target Accessibility
 *
 * **Property 4: Touch Target Accessibility**
 * **Validates: Requirements 3.2**
 *
 * Feature: toastmasters-brand-compliance, Property 4: For any interactive element,
 * the minimum touch target size should be 44px in both width and height
 *
 * §4.2 re-confirmation (#916): the deep-dive flagged this as a possible
 * mock→mock tautology, but on re-read it is REAL — the mocked
 * getBoundingClientRect is the *controlled input* to `useTouchTarget`, and the
 * assertions verify the hook's *classification logic* (passes/fails the 44px
 * threshold, recommendation text, margin-inclusion math) plus
 * `isInteractiveElement`, which inspects real DOM with no geometry mock at all.
 * Kept as a unit test of the hook; live geometry is covered by Playwright
 * elsewhere (L66/L134).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import {
  useTouchTarget,
  isInteractiveElement,
} from '../../hooks/useTouchTarget'
import { renderHook } from '@testing-library/react'

// Test data generators
const interactiveTagArbitrary = fc.constantFrom(
  'button',
  'a',
  'input',
  'select',
  'textarea'
)
const interactiveRoleArbitrary = fc.constantFrom(
  'button',
  'link',
  'menuitem',
  'tab'
)

// Helper function to create test elements with mocked dimensions
function createTestElement(
  tag: string,
  width: number,
  height: number,
  attributes: Record<string, string> = {}
): HTMLElement {
  const element = document.createElement(tag)

  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })

  // Mock getBoundingClientRect to return our desired dimensions
  element.getBoundingClientRect = vi.fn().mockReturnValue({
    width,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })

  // Mock getComputedStyle for margin calculations
  const originalGetComputedStyle = window.getComputedStyle
  vi.spyOn(window, 'getComputedStyle').mockImplementation(el => {
    if (el === element) {
      return {
        marginLeft: '0px',
        marginRight: '0px',
        marginTop: '0px',
        marginBottom: '0px',
        display: 'inline-block',
        visibility: 'visible',
      } as CSSStyleDeclaration
    }
    return originalGetComputedStyle(el)
  })

  return element
}

// Helper function to create test element with margins
function createTestElementWithMargins(
  tag: string,
  width: number,
  height: number,
  margin: number,
  attributes: Record<string, string> = {}
): HTMLElement {
  const element = createTestElement(tag, width, height, attributes)

  // Override getComputedStyle to include margins
  const originalGetComputedStyle = window.getComputedStyle
  vi.spyOn(window, 'getComputedStyle').mockImplementation(el => {
    if (el === element) {
      return {
        marginLeft: `${margin}px`,
        marginRight: `${margin}px`,
        marginTop: `${margin}px`,
        marginBottom: `${margin}px`,
        display: 'inline-block',
        visibility: 'visible',
      } as CSSStyleDeclaration
    }
    return originalGetComputedStyle(el)
  })

  return element
}

describe('Touch Target Accessibility - Property Tests', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    vi.restoreAllMocks()
  })

  describe('Property 4: Touch target validation', () => {
    it('should validate that elements with 44px+ dimensions pass touch target requirements', () => {
      fc.assert(
        fc.property(
          interactiveTagArbitrary,
          fc.integer({ min: 44, max: 100 }),
          fc.integer({ min: 44, max: 100 }),
          (tag, width, height) => {
            const element = createTestElement(
              tag,
              width,
              height,
              tag === 'a' ? { href: '#' } : {}
            )
            container.appendChild(element)

            const { result } = renderHook(() => useTouchTarget())
            const touchTargetResult = result.current.checkTouchTarget(element)

            expect(touchTargetResult.passes).toBe(true)
            expect(touchTargetResult.width).toBeGreaterThanOrEqual(44)
            expect(touchTargetResult.height).toBeGreaterThanOrEqual(44)
            expect(touchTargetResult.element).toBe(element)
            expect(touchTargetResult.recommendation).toBeUndefined()

            container.removeChild(element)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should validate that elements smaller than 44px fail touch target requirements', () => {
      fc.assert(
        fc.property(
          interactiveTagArbitrary,
          fc.integer({ min: 10, max: 43 }),
          fc.integer({ min: 10, max: 43 }),
          (tag, width, height) => {
            const element = createTestElement(
              tag,
              width,
              height,
              tag === 'a' ? { href: '#' } : {}
            )
            container.appendChild(element)

            const { result } = renderHook(() => useTouchTarget())
            const touchTargetResult = result.current.checkTouchTarget(element)

            expect(touchTargetResult.passes).toBe(false)
            expect(touchTargetResult.width).toBeLessThan(44)
            expect(touchTargetResult.height).toBeLessThan(44)
            expect(touchTargetResult.element).toBe(element)
            expect(touchTargetResult.recommendation).toBeDefined()
            expect(touchTargetResult.recommendation).toContain('44px minimum')

            container.removeChild(element)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should correctly identify interactive elements', () => {
      fc.assert(
        fc.property(interactiveTagArbitrary, tag => {
          const element = createTestElement(
            tag,
            50,
            50,
            tag === 'a' ? { href: '#' } : {}
          )

          expect(isInteractiveElement(element)).toBe(true)
        }),
        { numRuns: 30 }
      )
    })

    it('should correctly identify elements with interactive roles', () => {
      fc.assert(
        fc.property(interactiveRoleArbitrary, role => {
          const element = createTestElement('div', 50, 50, { role })

          expect(isInteractiveElement(element)).toBe(true)
        }),
        { numRuns: 30 }
      )
    })

    it('should provide appropriate recommendations for undersized elements', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 43 }),
          fc.integer({ min: 10, max: 43 }),
          (width, height) => {
            const element = createTestElement('button', width, height)
            container.appendChild(element)

            const { result } = renderHook(() => useTouchTarget())
            const touchTargetResult = result.current.checkTouchTarget(element)

            expect(touchTargetResult.passes).toBe(false)
            expect(touchTargetResult.recommendation).toBeDefined()

            const widthDeficit = 44 - width
            const heightDeficit = 44 - height

            if (widthDeficit > 0 && heightDeficit > 0) {
              expect(touchTargetResult.recommendation).toContain('width')
              expect(touchTargetResult.recommendation).toContain('height')
            } else if (widthDeficit > 0) {
              expect(touchTargetResult.recommendation).toContain('width')
            } else if (heightDeficit > 0) {
              expect(touchTargetResult.recommendation).toContain('height')
            }

            container.removeChild(element)
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  describe('Interactive element detection', () => {
    it('should detect all standard interactive elements', () => {
      const interactiveElements: Array<{
        tag: string
        attrs: Record<string, string>
      }> = [
        { tag: 'button', attrs: {} },
        { tag: 'a', attrs: { href: '#' } },
        { tag: 'input', attrs: { type: 'text' } },
        { tag: 'input', attrs: { type: 'button' } },
        { tag: 'select', attrs: {} },
        { tag: 'textarea', attrs: {} },
      ]

      interactiveElements.forEach(({ tag, attrs }) => {
        const element = createTestElement(tag, 50, 50, attrs)
        expect(isInteractiveElement(element)).toBe(true)
      })
    })

    it('should not detect non-interactive elements', () => {
      const nonInteractiveElements = ['div', 'span', 'p', 'h1', 'img']

      nonInteractiveElements.forEach(tag => {
        const element = createTestElement(tag, 50, 50)
        expect(isInteractiveElement(element)).toBe(false)
      })
    })

    it('should detect elements with tabindex', () => {
      const element = createTestElement('div', 50, 50, { tabindex: '0' })
      expect(isInteractiveElement(element)).toBe(true)

      const negativeTabIndex = createTestElement('div', 50, 50, {
        tabindex: '-1',
      })
      expect(isInteractiveElement(negativeTabIndex)).toBe(false)
    })

    it('should detect elements with onclick handlers', () => {
      const element = createTestElement('div', 50, 50, {
        onclick: 'return false;',
      })
      expect(isInteractiveElement(element)).toBe(true)
    })
  })

  describe('Touch target validation with margin inclusion', () => {
    it('should include margins when calculating effective touch target size', () => {
      const element = createTestElementWithMargins('button', 30, 30, 7) // 30 + 7*2 = 44px
      container.appendChild(element)

      const { result } = renderHook(() =>
        useTouchTarget({ includeMargin: true })
      )
      const touchTargetResult = result.current.checkTouchTarget(element)

      expect(touchTargetResult.passes).toBe(true)
      expect(touchTargetResult.width).toBe(44) // 30 + 14
      expect(touchTargetResult.height).toBe(44) // 30 + 14

      container.removeChild(element)
    })

    it('should exclude margins when configured to do so', () => {
      const element = createTestElementWithMargins('button', 30, 30, 10)
      container.appendChild(element)

      const { result } = renderHook(() =>
        useTouchTarget({ includeMargin: false })
      )
      const touchTargetResult = result.current.checkTouchTarget(element)

      expect(touchTargetResult.passes).toBe(false)
      expect(touchTargetResult.width).toBe(30)
      expect(touchTargetResult.height).toBe(30)

      container.removeChild(element)
    })
  })

  describe('Batch validation', () => {
    it('should validate all interactive elements in a container', () => {
      // Create a mix of passing and failing elements with individual mocks
      const passingButton = document.createElement('button')
      passingButton.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 50,
        height: 50,
        top: 0,
        left: 0,
        bottom: 50,
        right: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })

      const failingButton = document.createElement('button')
      failingButton.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 30,
        height: 30,
        top: 0,
        left: 0,
        bottom: 30,
        right: 30,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })

      const passingLink = document.createElement('a')
      passingLink.setAttribute('href', '#')
      passingLink.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 44,
        height: 44,
        top: 0,
        left: 0,
        bottom: 44,
        right: 44,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })

      // Mock getComputedStyle for all elements
      vi.spyOn(window, 'getComputedStyle').mockImplementation(
        () =>
          ({
            marginLeft: '0px',
            marginRight: '0px',
            marginTop: '0px',
            marginBottom: '0px',
            display: 'inline-block',
            visibility: 'visible',
          }) as CSSStyleDeclaration
      )

      container.appendChild(passingButton)
      container.appendChild(failingButton)
      container.appendChild(passingLink)

      const { result } = renderHook(() => useTouchTarget())
      const results = result.current.validateAllTouchTargets(container)

      expect(results).toHaveLength(3)

      const passingResults = results.filter(r => r.passes)
      const failingResults = results.filter(r => !r.passes)

      expect(passingResults).toHaveLength(2)
      expect(failingResults).toHaveLength(1)

      container.removeChild(passingButton)
      container.removeChild(failingButton)
      container.removeChild(passingLink)
    })
  })
})
