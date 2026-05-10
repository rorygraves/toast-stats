import type { TierGap } from './dcpProjections'

export const CLOSE_TO_DISTINGUISHED_MAX_MEMBERS = 4

export function isCloseToDistinguished(gap: TierGap): boolean {
  return (
    gap.goals === 0 &&
    gap.members > 0 &&
    gap.members <= CLOSE_TO_DISTINGUISHED_MAX_MEMBERS
  )
}
