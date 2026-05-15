import type { CompetitiveAwardStandings } from '../services/cdn'

/* Per-district countdown to the next Distinguished District tier.
   Folds three numeric gaps + two officer-award booleans from the
   competitive-awards JSON into a uniform shape the table cell renderer
   can consume. */

export type CountdownCell =
  | { kind: 'gap'; value: number }
  | { kind: 'met' }
  | { kind: 'boolean'; met: boolean }

export interface DistinguishedCountdown {
  netClubGrowth: CountdownCell
  paymentGrowth: CountdownCell
  distinguishedPercent: CountdownCell
  /** % Club Growth threshold (DD prerequisite #4 — distinct from the
   *  CGD officer-award boolean `clubGrowth` below). */
  clubGrowthPercent: CountdownCell
  educationTraining: CountdownCell
  clubGrowth: CountdownCell
}

const gapCell = (value: number): CountdownCell =>
  value <= 0 ? { kind: 'met' } : { kind: 'gap', value }

export function getDistinguishedCountdown(
  districtId: string,
  awards: CompetitiveAwardStandings | null
): DistinguishedCountdown | null {
  if (!awards) return null
  const status = awards.distinguishedDistrict?.[districtId]
  if (!status) return null

  // nextTierGap is null when the district is already at Smedley — every
  // numeric metric has been satisfied at the highest tier.
  const gap = status.nextTierGap
  const numeric: Pick<
    DistinguishedCountdown,
    | 'netClubGrowth'
    | 'paymentGrowth'
    | 'distinguishedPercent'
    | 'clubGrowthPercent'
  > = gap
    ? {
        netClubGrowth: gapCell(gap.netClubGrowthGap),
        paymentGrowth: gapCell(gap.paymentGrowthGap),
        distinguishedPercent: gapCell(gap.distinguishedPercentGap),
        clubGrowthPercent: gapCell(gap.clubGrowthGap),
      }
    : {
        netClubGrowth: { kind: 'met' },
        paymentGrowth: { kind: 'met' },
        distinguishedPercent: { kind: 'met' },
        clubGrowthPercent: { kind: 'met' },
      }

  const educationTraining: CountdownCell = {
    kind: 'boolean',
    met:
      awards.officerAwards?.educationTraining.find(
        e => e.districtId === districtId
      )?.qualifies ?? false,
  }
  const clubGrowth: CountdownCell = {
    kind: 'boolean',
    met:
      awards.officerAwards?.clubGrowth.find(c => c.districtId === districtId)
        ?.qualifies ?? false,
  }

  return { ...numeric, educationTraining, clubGrowth }
}
