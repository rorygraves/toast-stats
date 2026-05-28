import React from 'react'
import { useIsMobile } from '../hooks/useIsMobile'

export interface MobileDisclosureProps {
  /** Label shown on the collapsed summary row (mobile only). */
  summaryLabel: string
  /** Viewport width (px) below which the content folds. Default 768. */
  breakpoint?: number
  children: React.ReactNode
}

/**
 * Folds its children behind a collapsed-by-default native `<details>`
 * disclosure below `breakpoint`; at or above it the children render
 * directly, so the desktop layout is untouched (#867).
 *
 * Native `<details>`/`<summary>` gives keyboard operability and the
 * disclosure ARIA semantics for free — the same progressive-enhancement
 * pattern as the DistrictsPage "Show all" fold (#863). The
 * `useIsMobile` gate (rather than CSS alone) is what keeps the desktop
 * tree free of disclosure chrome; in JSDOM it resolves to `false`, so
 * existing desktop tests see the bare children unchanged.
 */
export const MobileDisclosure: React.FC<MobileDisclosureProps> = ({
  summaryLabel,
  breakpoint = 768,
  children,
}) => {
  const isMobile = useIsMobile(breakpoint)

  if (!isMobile) return <>{children}</>

  return (
    <details className="mobile-disclosure">
      <summary className="mobile-disclosure__summary">{summaryLabel}</summary>
      <div className="mobile-disclosure__content">{children}</div>
    </details>
  )
}

export default MobileDisclosure
