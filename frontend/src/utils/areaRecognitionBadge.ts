/**
 * Pure presenter for the area-recognition badge (#832).
 *
 * Maps an `AreaRecognitionState` (the source-of-truth gate) to badge
 * label + Tailwind classes + tooltip copy. The deadline-aware gating
 * lives in `deriveAreaRecognitionState`; this module is cosmetic only.
 */
import type { AreaRecognitionState, PendingRound } from './areaRecognitionState'
import { formatShortDate } from './dateFormatting'

export interface BadgePresentation {
  label: string
  className: string
  tooltip?: string
}

const TIER_LABEL: Record<'presidents' | 'select' | 'distinguished', string> = {
  presidents: "President's Distinguished",
  select: 'Select Distinguished',
  distinguished: 'Distinguished',
}

const CONFIRMED_CLASS: Record<
  'presidents' | 'select' | 'distinguished',
  string
> = {
  presidents:
    'bg-tm-happy-yellow text-gray-900 border-yellow-500 font-semibold',
  select: 'bg-tm-cool-gray text-gray-900 border-gray-400',
  distinguished: 'bg-tm-true-maroon text-white border-tm-true-maroon',
}

const PROVISIONAL_CLASS = 'bg-amber-100 text-amber-800 border-amber-300'
const NOT_DISTINGUISHED_CLASS = 'bg-gray-100 text-gray-600 border-gray-300'
const NET_LOSS_CLASS = 'bg-red-100 text-red-800 border-red-300'

export function pendingRoundsTooltip(rounds: PendingRound[]): string {
  if (rounds.length === 0) return ''
  const labels = rounds.map(({ round, deadline }) => {
    const ordinal = round === 1 ? '1st' : '2nd'
    return `${ordinal}-round visits due ${formatShortDate(deadline)}`
  })
  return `Pending: ${labels.join('; ')}`
}

/**
 * Render a recognition badge from the source-of-truth state.
 *
 * @param state - The gated recognition state from `deriveAreaRecognitionState`.
 */
export function renderRecognitionBadge(
  state: AreaRecognitionState
): BadgePresentation {
  if (state.status === 'confirmed' && state.level !== 'none') {
    return {
      label: TIER_LABEL[state.level],
      className: CONFIRMED_CLASS[state.level],
    }
  }

  if (state.status === 'provisional' && state.level !== 'none') {
    return {
      label: `${TIER_LABEL[state.level]} (Provisional)`,
      className: PROVISIONAL_CLASS,
      tooltip: pendingRoundsTooltip(state.pendingRounds),
    }
  }

  // not-distinguished
  if (state.failureReason === 'net-loss') {
    return { label: 'Net Loss', className: NET_LOSS_CLASS }
  }
  return { label: 'Not Distinguished', className: NOT_DISTINGUISHED_CLASS }
}
