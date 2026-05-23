import React, { Suspense, ComponentProps } from 'react'
import { ChartSkeleton } from '../ChartSkeleton'

const LazyComponent = React.lazy(() => import('../ComparisonPanel'))

// ComparisonPanel itself returns null when fewer than 2 districts are
// pinned. Without this short-circuit the Suspense fallback reserves
// 400px on every landing-page load (the default state has nothing
// pinned), then collapses to 0 once the lazy chunk resolves — a large
// late layout shift (#488).
export function LazyComparisonPanel(
  props: ComponentProps<typeof LazyComponent>
) {
  if (props.pinnedDistricts.length < 2) return null
  return (
    <Suspense fallback={<ChartSkeleton height={400} />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}
