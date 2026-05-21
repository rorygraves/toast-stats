import React from 'react'
import type { DistinguishedDistrictTier } from '../services/cdn'

type AchievedTier = Exclude<DistinguishedDistrictTier, 'NotDistinguished'>

const TIER_CONFIG: Record<AchievedTier, { label: string; className: string }> =
  {
    Distinguished: {
      label: 'Distinguished',
      className: 'bg-tm-true-maroon text-white',
    },
    Select: {
      label: 'Select',
      className: 'bg-tm-cool-gray text-gray-900',
    },
    Presidents: {
      label: "President's",
      className: 'bg-tm-happy-yellow text-gray-900',
    },
    Smedley: {
      // Smedley is genuinely rare (<10 districts/year globally). The
      // gold ring is the rare-tier visual treatment required by #546.
      label: 'Smedley',
      className:
        'bg-purple-200 text-purple-900 ring-2 ring-tm-happy-yellow ring-offset-1',
    },
  }

interface Props {
  districtId: string
  tier: DistinguishedDistrictTier | null | undefined
}

export const DistrictTierChip: React.FC<Props> = ({ districtId, tier }) => {
  // Absence = signal: pre-Distinguished districts render nothing.
  // This keeps the row visually quiet while letting achieved districts
  // pop.
  if (!tier || tier === 'NotDistinguished') return null
  const cfg = TIER_CONFIG[tier]
  return (
    <span
      data-testid={`tier-chip-${districtId}`}
      data-tier={tier}
      aria-label={`${cfg.label} Distinguished District`}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}

export default DistrictTierChip
