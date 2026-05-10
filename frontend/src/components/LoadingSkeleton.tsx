import React from 'react'
import { ChartSkeleton } from './ChartSkeleton'

interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'chart' | 'text' | 'stat'
  count?: number
  className?: string
  height?: string
}

/**
 * Reusable loading skeleton component for various UI elements
 * Provides accessible loading states with proper ARIA attributes
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 1,
  className = '',
  height,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded-sm'

  if (variant === 'card') {
    return (
      <div
        className={`redesign-panel ${className}`}
        role="status"
        aria-label="Loading"
      >
        <div className={`${baseClasses} h-6 w-1/3 mb-4`}></div>
        <div className={`${baseClasses} h-4 w-full mb-2`}></div>
        <div className={`${baseClasses} h-4 w-5/6 mb-2`}></div>
        <div className={`${baseClasses} h-4 w-4/6`}></div>
        <span className="sr-only">Loading content...</span>
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div
        className={`redesign-panel ${className}`}
        role="status"
        aria-label="Loading table"
      >
        <div className="p-6 border-b border-gray-200">
          <div className={`${baseClasses} h-6 w-1/4 mb-4`}></div>
          <div className={`${baseClasses} h-10 w-full`}></div>
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className={`${baseClasses} h-12 flex-1`}></div>
              <div className={`${baseClasses} h-12 w-24`}></div>
              <div className={`${baseClasses} h-12 w-24`}></div>
            </div>
          ))}
        </div>
        <span className="sr-only">Loading table data...</span>
      </div>
    )
  }

  if (variant === 'chart') {
    const chartHeight = height ? parseInt(height, 10) : 256
    return (
      <div className={className}>
        <ChartSkeleton height={chartHeight} />
      </div>
    )
  }

  if (variant === 'stat') {
    return (
      <div
        className={`redesign-panel ${className}`}
        role="status"
        aria-label="Loading statistics"
      >
        <div className={`${baseClasses} h-4 w-1/2 mb-2`}></div>
        <div className={`${baseClasses} h-8 w-3/4 mb-2`}></div>
        <div className={`${baseClasses} h-3 w-1/3`}></div>
        <span className="sr-only">Loading statistics...</span>
      </div>
    )
  }

  // text variant
  return (
    <div className={className} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${baseClasses} h-4 w-full mb-2`}></div>
      ))}
      <span className="sr-only">Loading text...</span>
    </div>
  )
}

/**
 * Spinner component for inline loading states
 */
export const Spinner: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-tm-loyal-blue ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
