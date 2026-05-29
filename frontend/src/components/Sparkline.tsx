import React, { useMemo } from 'react'

export interface SparklineProps {
  /** The series to plot. Each value is one point, evenly spaced on x. */
  data: number[]
  /** SVG viewBox width in px (intrinsic; scales via CSS). Default 96. */
  width?: number
  /** SVG viewBox height in px. Default 28. */
  height?: number
  /** Accessible label for the graphic. Falls back to a generic one. */
  ariaLabel?: string
  /** Class on the root <svg> (Lesson 077 — override, don't add a variant). */
  className?: string
}

/**
 * A minimal, dependency-free SVG sparkline — a single polyline, no axes,
 * ticks, or tooltip. Used as the collapsed mobile representation of a
 * multi-series chart by `ChartSparklineExpand`.
 *
 * Recharts is deliberately NOT used here: a sparkline has none of the chrome
 * recharts provides, and the inner charts it represents are already its only
 * recharts consumers. A flat polyline keeps the collapsed view cheap and
 * synchronous (no lazy chunk, no `ResponsiveContainer` measure pass), which
 * matters because it must render immediately on mobile mount — not gated on
 * scroll/visibility (Lesson 113).
 */
export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 96,
  height = 28,
  ariaLabel,
  className,
}) => {
  // Inset the stroke so the rounded caps aren't clipped at the edges.
  const pad = 2
  const points = useMemo(() => {
    if (data.length === 0) return ''
    const innerW = width - pad * 2
    const innerH = height - pad * 2
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min
    // Flat series (range 0) sits on the vertical midline — never divide by
    // zero, never invert the axis (CLAUDE.md y-axis tripwire).
    const denom = data.length > 1 ? data.length - 1 : 1
    return data
      .map((value, i) => {
        const x = pad + (i / denom) * innerW
        const yFrac = range === 0 ? 0.5 : (value - min) / range
        // SVG y grows downward; a higher value should sit higher.
        const y = pad + (1 - yFrac) * innerH
        return `${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')
  }, [data, width, height])

  return (
    <svg
      className={className ?? 'sparkline'}
      role="img"
      aria-label={ariaLabel ?? 'Trend sparkline'}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {points && (
        <polyline
          className="sparkline__line"
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}

export default Sparkline
