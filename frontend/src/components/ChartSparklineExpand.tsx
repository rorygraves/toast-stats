import React, { useState } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import { useUrlState } from '../hooks/useUrlState'
import { Sparkline } from './Sparkline'
import { ChartExpandSheet } from './ChartExpandSheet'

export interface ChartSparklineExpandProps {
  /** Chart name — sheet heading, sparkline aria-label, default expand label. */
  title: string
  /** Series for the collapsed mobile sparkline. */
  sparklineData: number[]
  /** Headline numbers rendered above the sparkline (the chart's key figures). */
  headline: React.ReactNode
  /** The desktop chart: rendered directly on desktop, inside the sheet on mobile. */
  children: React.ReactNode
  /** Viewport width (px) below which the chart collapses. Default 768. */
  breakpoint?: number
  /** Accessible label for the expand trigger. Default `Expand <title> chart`. */
  expandLabel?: string
  /** Class on the collapsed-mobile wrapper (Lesson 077 — override, no variant). */
  className?: string
  /**
   * When set, the expand sheet deep-links via `?chartExpanded=<urlId>` (#980).
   * The param holds WHICH chart is open (the sheet is mutually exclusive), so
   * multiple charts on one page each pass a distinct id. Requires a router.
   * When omitted, the sheet uses purely-local state (router-free).
   */
  urlId?: string
}

/**
 * Sparkline-then-expand wrapper (epic #876 / CC-3). At and above `breakpoint`
 * the desktop chart renders directly — zero added chrome, so desktop layout is
 * untouched. Below it, the multi-series chart (unreadable at 375px) collapses
 * to its headline numbers + a sparkline behind a tap target; tapping opens a
 * full-screen `ChartExpandSheet` with the full desktop chart.
 *
 * The collapse is width-driven (`useIsMobile` → matchMedia), NOT scroll/visibility
 * gated, so the collapsed view is present on mount in every context including
 * non-scroll capture (Lesson 113). In JSDOM `useIsMobile` resolves to false, so
 * desktop tests and existing consumers see the bare chart unchanged.
 *
 * This sprint (#874) ships only the reusable wrapper; #875 applies it to the
 * District Trends, Club detail, Rankings Progression and Awards charts.
 */
type ViewProps = Omit<ChartSparklineExpandProps, 'breakpoint' | 'urlId'> & {
  isOpen: boolean
  setOpen: (open: boolean) => void
}

/** The collapsed-mobile sparkline + expand sheet. State source is injected. */
const ChartSparklineExpandView: React.FC<ViewProps> = ({
  title,
  sparklineData,
  headline,
  children,
  expandLabel,
  className,
  isOpen,
  setOpen,
}) => (
  <div className={className ?? 'chart-spark'}>
    <button
      type="button"
      className="chart-spark__trigger"
      aria-haspopup="dialog"
      aria-label={expandLabel ?? `Expand ${title} chart`}
      onClick={() => setOpen(true)}
    >
      <span className="chart-spark__headline">{headline}</span>
      <Sparkline
        data={sparklineData}
        ariaLabel={`${title} sparkline`}
        className="chart-spark__sparkline"
      />
      <span className="chart-spark__hint" aria-hidden="true">
        Tap to expand
      </span>
    </button>

    <ChartExpandSheet
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title={title}
    >
      {children}
    </ChartExpandSheet>
  </div>
)

/** URL-synced state source — `?chartExpanded` holds which chart id is open. */
const UrlSyncedChartSparklineExpand: React.FC<
  Omit<ChartSparklineExpandProps, 'breakpoint'> & { urlId: string }
> = ({ urlId, ...viewProps }) => {
  const [expandedId, setExpandedId] = useUrlState('chartExpanded', '')
  return (
    <ChartSparklineExpandView
      {...viewProps}
      isOpen={expandedId === urlId}
      setOpen={open => setExpandedId(open ? urlId : '')}
    />
  )
}

/** Local (router-free) state source — the default. */
const LocalChartSparklineExpand: React.FC<
  Omit<ChartSparklineExpandProps, 'breakpoint' | 'urlId'>
> = viewProps => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <ChartSparklineExpandView
      {...viewProps}
      isOpen={isOpen}
      setOpen={setIsOpen}
    />
  )
}

export const ChartSparklineExpand: React.FC<ChartSparklineExpandProps> = ({
  breakpoint = 768,
  urlId,
  ...viewProps
}) => {
  const isMobile = useIsMobile(breakpoint)

  if (!isMobile) return <>{viewProps.children}</>

  return urlId ? (
    <UrlSyncedChartSparklineExpand urlId={urlId} {...viewProps} />
  ) : (
    <LocalChartSparklineExpand {...viewProps} />
  )
}

export default ChartSparklineExpand
