import React from 'react'

/**
 * Props for the ChartLegend component
 */
interface ChartLegendProps {
  /** Legend items with labels and colors */
  items: Array<{
    label: string
    color: string
    value?: string | number
  }>
  /** Position of the legend */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Optional CSS classes */
  className?: string
  /** Whether to show values alongside labels */
  showValues?: boolean
}

/**
 * Brand-compliant Chart Legend Component
 *
 * Provides accessible legend for charts using TM brand typography
 * and ensuring WCAG AA compliance.
 *
 * Features:
 * - Brand-compliant typography (Source Sans 3)
 * - Accessible color indicators
 * - Screen reader friendly
 * - Flexible positioning
 * - Optional value display
 *
 * @component
 * @example
 * ```tsx
 * <ChartLegend
 *   items={[
 *     { label: 'Active Clubs', color: 'var(--tm-loyal-blue)', value: '150' },
 *     { label: 'Suspended Clubs', color: 'var(--tm-true-maroon)', value: '12' }
 *   ]}
 *   position="bottom"
 *   showValues
 * />
 * ```
 */
export const ChartLegend: React.FC<ChartLegendProps> = ({
  items,
  position = 'bottom',
  className = '',
  showValues = false,
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'flex-wrap justify-center mb-4'
      case 'bottom':
        return 'flex-wrap justify-center mt-4'
      case 'left':
        return 'flex-col mr-4'
      case 'right':
        return 'flex-col ml-4'
      default:
        return 'flex-wrap justify-center mt-4'
    }
  }

  const getItemClasses = () => {
    return position === 'left' || position === 'right'
      ? 'mb-2 last:mb-0'
      : 'mr-4 mb-2 last:mr-0'
  }

  return (
    <div
      className={`flex ${getPositionClasses()} ${className}`}
      role="list"
      aria-label="Chart legend"
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={`flex items-center gap-2 ${getItemClasses()}`}
          role="listitem"
        >
          {/* Color indicator */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />

          {/* Label and optional value */}
          <span className="font-tm-body text-sm text-tm-black">
            {item.label}
            {showValues && item.value && (
              <span className="font-semibold ml-1">({item.value})</span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Props for the ChartTitle component
 */
interface ChartTitleProps {
  /** Main chart title */
  title: string
  /** Optional subtitle */
  subtitle?: string
  /** Optional CSS classes */
  className?: string
  /** Heading level for accessibility */
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * Brand-compliant Chart Title Component
 *
 * Provides accessible chart titles using TM brand typography.
 *
 * @component
 */
export const ChartTitle: React.FC<ChartTitleProps> = ({
  title,
  subtitle,
  className = '',
  level = 2,
}) => {
  const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements

  const getTitleClasses = () => {
    switch (level) {
      case 1:
        return 'tm-h1 text-tm-black'
      case 2:
        return 'tm-h2 text-tm-black'
      case 3:
        return 'tm-h3 text-tm-black'
      default:
        return 'text-lg font-tm-headline font-semibold text-tm-black'
    }
  }

  return (
    <div className={`mb-4 ${className}`}>
      <HeadingTag className={getTitleClasses()}>{title}</HeadingTag>
      {subtitle && (
        <p className="font-tm-body text-sm text-tm-cool-gray mt-1">
          {subtitle}
        </p>
      )}
    </div>
  )
}

/**
 * Props for the ChartContainer component
 */
interface ChartContainerProps {
  /** Chart content */
  children: React.ReactNode
  /** Chart title */
  title?: string
  /** Chart subtitle */
  subtitle?: string
  /** Legend items */
  legend?: Array<{
    label: string
    color: string
    value?: string | number
  }>
  /** Legend position */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  /** Whether to show legend values */
  showLegendValues?: boolean
  /** Chart description for screen readers */
  description?: string
  /** Optional CSS classes */
  className?: string
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: string
}

/**
 * Complete Brand-compliant Chart Container
 *
 * Wraps chart content with brand-compliant title, legend, and accessibility features.
 *
 * @component
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  children,
  title,
  subtitle,
  legend,
  legendPosition = 'bottom',
  showLegendValues = false,
  description,
  className = '',
  isLoading = false,
  error,
}) => {
  const chartId = React.useId()
  const descriptionId = `${chartId}-description`

  if (isLoading) {
    return (
      <div className={`redesign-panel ${className}`}>
        {title && <ChartTitle title={title} {...(subtitle && { subtitle })} />}
        <div className="flex items-center justify-center h-80">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`redesign-panel ${className}`} role="alert">
        {title && <ChartTitle title={title} {...(subtitle && { subtitle })} />}
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <p className="text-tm-true-maroon font-tm-body font-semibold mb-2">
              Failed to load chart data
            </p>
            <p className="text-tm-cool-gray font-tm-body text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`redesign-panel ${className}`}>
      {title && <ChartTitle title={title} {...(subtitle && { subtitle })} />}

      {legend && legendPosition === 'top' && (
        <ChartLegend
          items={legend}
          position="top"
          showValues={showLegendValues}
        />
      )}

      <div className="flex">
        {legend && legendPosition === 'left' && (
          <ChartLegend
            items={legend}
            position="left"
            showValues={showLegendValues}
          />
        )}

        <div
          className="flex-1"
          role="img"
          aria-label={title || 'Chart'}
          aria-describedby={description ? descriptionId : undefined}
        >
          {children}
        </div>

        {legend && legendPosition === 'right' && (
          <ChartLegend
            items={legend}
            position="right"
            showValues={showLegendValues}
          />
        )}
      </div>

      {legend && legendPosition === 'bottom' && (
        <ChartLegend
          items={legend}
          position="bottom"
          showValues={showLegendValues}
        />
      )}

      {description && (
        <p id={descriptionId} className="sr-only">
          {description}
        </p>
      )}
    </div>
  )
}
