import React from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import { useUrlBoolean } from '../hooks/useUrlBoolean'

export interface MobileDisclosureProps {
  /** Label shown on the collapsed summary row (mobile only). */
  summaryLabel: string
  /** Viewport width (px) below which the content folds. Default 768. */
  breakpoint?: number
  /**
   * When set, the mobile open/closed state deep-links via this URL search param
   * (#980): `?<urlParam>=1` when open, absent when collapsed. Requires a router.
   * When omitted the disclosure stays uncontrolled (native default — router-free).
   */
  urlParam?: string
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
  urlParam,
  children,
}) => {
  const isMobile = useIsMobile(breakpoint)

  if (!isMobile) return <>{children}</>

  // URL-synced state source is split into its own component so the uncontrolled
  // path never calls useSearchParams (no router required — Lesson 473 spirit).
  if (urlParam) {
    return (
      <UrlSyncedDisclosure urlParam={urlParam} summaryLabel={summaryLabel}>
        {children}
      </UrlSyncedDisclosure>
    )
  }

  return (
    <details className="mobile-disclosure">
      <summary className="mobile-disclosure__summary">{summaryLabel}</summary>
      <div className="mobile-disclosure__content">{children}</div>
    </details>
  )
}

const UrlSyncedDisclosure: React.FC<{
  urlParam: string
  summaryLabel: string
  children: React.ReactNode
}> = ({ urlParam, summaryLabel, children }) => {
  const [open, setOpen] = useUrlBoolean(urlParam)
  return (
    <details
      className="mobile-disclosure"
      open={open}
      onToggle={e => setOpen(e.currentTarget.open)}
    >
      <summary className="mobile-disclosure__summary">{summaryLabel}</summary>
      <div className="mobile-disclosure__content">{children}</div>
    </details>
  )
}

export default MobileDisclosure
