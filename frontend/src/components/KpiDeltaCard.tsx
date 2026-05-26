import React from 'react'

export interface KpiDeltaCardProps {
  title: string
  /** Signed delta (positive = increase, negative = decrease). */
  current: number
  tooltipContent?: string
  secondaryLabel?: string
}

// #681 — stub (RED). Real signed-delta rendering lands in the GREEN commit.
export const KpiDeltaCard: React.FC<KpiDeltaCardProps> = ({ title }) => (
  <div data-testid="kpi-delta-card">{title}</div>
)

export default KpiDeltaCard
