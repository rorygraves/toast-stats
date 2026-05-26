/**
 * clubHealthStatus — single source of truth for health-status pill rendering
 * shared by the desktop ClubsTable row and the mobile ClubCard (#671, epic
 * #665 Sprint 5). Locks the lesson-052 invariant: one label + one modifier per
 * status, used by both surfaces.
 */
import { describe, it, expect } from 'vitest'
import type { ClubHealthStatus } from '../../hooks/useDistrictAnalytics'
import {
  getClubHealthStatusLabel,
  getClubHealthStatusPillModifier,
} from '../clubHealthStatus'

describe('clubHealthStatus', () => {
  const cases: Array<[ClubHealthStatus, string, string]> = [
    ['thriving', 'Thriving', 'clubs-status-pill--thriving'],
    ['vulnerable', 'Vulnerable', 'clubs-status-pill--vulnerable'],
    [
      'intervention-required',
      'Intervention Required',
      'clubs-status-pill--intervention',
    ],
  ]

  it.each(cases)(
    'maps %s → label "%s" and modifier "%s"',
    (status, label, modifier) => {
      expect(getClubHealthStatusLabel(status)).toBe(label)
      expect(getClubHealthStatusPillModifier(status)).toBe(modifier)
    }
  )
})
