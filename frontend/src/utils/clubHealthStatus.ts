import type { ClubHealthStatus } from '../hooks/useDistrictAnalytics'

/**
 * Single source of truth for how a club's HEALTH status
 * (thriving / vulnerable / intervention-required) renders as a pill — the
 * display label and the `.clubs-status-pill--*` CSS modifier.
 *
 * Both the desktop ClubsTable row and the mobile ClubCard import these so the
 * same datum reads identically on both surfaces (lesson 052 — one definition,
 * not two). This is distinct from the OPERATIONAL club status
 * (active/suspended/ineligible) handled by `clubStatusBadge.ts`.
 */

export function getClubHealthStatusLabel(status: ClubHealthStatus): string {
  switch (status) {
    case 'intervention-required':
      return 'Intervention Required'
    case 'vulnerable':
      return 'Vulnerable'
    default:
      return 'Thriving'
  }
}

export function getClubHealthStatusPillModifier(
  status: ClubHealthStatus
): string {
  switch (status) {
    case 'intervention-required':
      return 'clubs-status-pill--intervention'
    case 'vulnerable':
      return 'clubs-status-pill--vulnerable'
    default:
      return 'clubs-status-pill--thriving'
  }
}
