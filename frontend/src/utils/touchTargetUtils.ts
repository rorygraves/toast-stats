/**
 * Pure utility functions for touch target validation.
 *
 * Extracted from useTouchTarget hook to enable unit testing
 * without React rendering overhead.
 */

/**
 * The single selector set defining what counts as an interactive (tappable)
 * element. Exported as the one source of truth so every consumer agrees:
 * `getAllInteractiveElements` (runtime audit), `useTouchTarget`
 * (`validateAllTouchTargets`), AND the dual-engine 44px touch-target tripwire
 * smoke (`frontend/e2e/touch-targets.smoke.ts`, #887) all import this array.
 * Drift between the product and its guard is the failure mode this prevents
 * (R20 spirit — source the partition from the tool itself, not a re-typed glob).
 */
export const INTERACTIVE_SELECTORS = [
  'button',
  'a[href]',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[onclick]',
] as const

/**
 * The minimum tap-target dimension in px (WCAG 2.5.5 / mobile handoff floor).
 * One source of truth for the policy: `useTouchTarget`'s default `minSize` and
 * the dual-engine touch-target tripwire (`frontend/e2e/touch-targets.smoke.ts`,
 * #887) both use it, so the guard and the runtime check the same number.
 */
export const MIN_TOUCH_TARGET_PX = 44

/**
 * Utility function to check if an element is interactive
 */
export function isInteractiveElement(element: HTMLElement): boolean {
  const interactiveTags = ['button', 'a', 'input', 'select', 'textarea']
  const interactiveRoles = ['button', 'link', 'menuitem', 'tab']

  const tagName = element.tagName.toLowerCase()
  const role = element.getAttribute('role')
  const tabIndex = element.getAttribute('tabindex')
  const hasClickHandler =
    element.onclick !== null || element.getAttribute('onclick') !== null

  return (
    interactiveTags.includes(tagName) ||
    (role && interactiveRoles.includes(role)) ||
    (tabIndex && tabIndex !== '-1') ||
    hasClickHandler
  )
}

/**
 * Get all interactive elements in a container
 */
export function getAllInteractiveElements(
  container: HTMLElement = document.body
): HTMLElement[] {
  const elements = container.querySelectorAll(INTERACTIVE_SELECTORS.join(', '))
  return Array.from(elements).filter(element => {
    const htmlElement = element as HTMLElement
    const computedStyle = window.getComputedStyle(htmlElement)
    return (
      computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden'
    )
  }) as HTMLElement[]
}
