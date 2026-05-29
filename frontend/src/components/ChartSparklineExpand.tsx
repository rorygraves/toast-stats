import React, { useState } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
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
export const ChartSparklineExpand: React.FC<ChartSparklineExpandProps> = ({
  title,
  sparklineData,
  headline,
  children,
  breakpoint = 768,
  expandLabel,
  className,
}) => {
  const isMobile = useIsMobile(breakpoint)
  const [isOpen, setIsOpen] = useState(false)

  if (!isMobile) return <>{children}</>

  return (
    <div className={className ?? 'chart-spark'}>
      <button
        type="button"
        className="chart-spark__trigger"
        aria-haspopup="dialog"
        aria-label={expandLabel ?? `Expand ${title} chart`}
        onClick={() => setIsOpen(true)}
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
        onClose={() => setIsOpen(false)}
        title={title}
      >
        {children}
      </ChartExpandSheet>
    </div>
  )
}

export default ChartSparklineExpand
