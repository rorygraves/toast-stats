import type {
  CompetitiveAwardStandings,
  DistinguishedDistrictTier,
} from '../services/cdn'

/* Per-district countdown to the *minimum* Distinguished District tier.
   Folds three absolute "remaining" counts (paid clubs, payments,
   distinguished clubs) + two officer-award booleans from the
   competitive-awards JSON into a uniform shape the table cell renderer
   can consume (#688, epic #683 F4).

   The three numeric metrics used to render the percentage-point gap to
   the next tier; Amy wants the absolute count remaining to the minimum
   (e.g. "277 payments to go"), so they now carry a `count`.

   Data source (lesson 103 — derive the countdown from the same gate it
   counts down to):
   - prefer the canonical `*Remaining` fields (#686, post-pipeline);
   - else derive from the rankings row's program-year base + current
     counts with the SAME formula the analytics calculator uses, so the
     column renders correctly on a pre-pipeline snapshot and matches the
     canonical analytics value EXACTLY. We derive from the raw counts —
     not from `nextTierGap`'s gap % — because the payment/club growth
     percentages TI publishes are pre-rounded to 1 dp, so deriving from
     them drifts ±1 from the canonical field (and can flip met/not-met).
     The raw integer counts have no such rounding. */

export type CountdownCell =
  | { kind: 'count'; value: number }
  | { kind: 'met' }
  | { kind: 'boolean'; met: boolean }

export interface DistinguishedCountdown {
  paidClubsRemaining: CountdownCell | null
  paymentsRemaining: CountdownCell | null
  distinguishedClubsRemaining: CountdownCell | null
  educationTraining: CountdownCell
  clubGrowth: CountdownCell
}

/* Tier thresholds — frontend twin of the analytics-core
   TIER_THRESHOLDS in
   packages/analytics-core/src/rankings/DistinguishedDistrictCalculator.ts.
   These MUST stay in lockstep with the calculator: they are the gates the
   countdown counts down to. If the program rules change, update both
   (lesson 103). The equivalence test pins the derived counts to the
   canonical analytics values for several real districts. */
export type DistinguishedTier = Exclude<
  DistinguishedDistrictTier,
  'NotDistinguished'
>

interface TierThreshold {
  paymentGrowthMin: number
  clubGrowthMin: number
  distinguishedPercentMin: number
}

const TIER_THRESHOLDS: Record<DistinguishedTier, TierThreshold> = {
  Distinguished: {
    paymentGrowthMin: 1,
    clubGrowthMin: 1,
    distinguishedPercentMin: 45,
  },
  Select: {
    paymentGrowthMin: 3,
    clubGrowthMin: 3,
    distinguishedPercentMin: 50,
  },
  Presidents: {
    paymentGrowthMin: 5,
    clubGrowthMin: 5,
    distinguishedPercentMin: 55,
  },
  Smedley: {
    paymentGrowthMin: 8,
    clubGrowthMin: 8,
    distinguishedPercentMin: 60,
  },
}

/** Inputs needed to derive the remaining-to-tier counts from a
    rankings row, when the canonical analytics fields are absent. */
export interface RemainingInputs {
  paidClubBase: number
  paymentBase: number
  paidClubs: number
  totalPayments: number
  distinguishedClubs: number
}

/* Frontend twin of the analytics-core countdown formula. Same targets,
   same denominators, same clamp — so the derived value equals the
   canonical `*Remaining` field for any snapshot. Generalised over tier
   so the district trophy case can count down to whichever tier the
   district is targeting next (#840). */
export function deriveRemainingToTier(
  tier: DistinguishedTier,
  r: RemainingInputs
): {
  paidClubsRemaining: number
  paymentsRemaining: number
  distinguishedClubsRemaining: number
} {
  const t = TIER_THRESHOLDS[tier]
  const paymentTarget = Math.ceil(
    r.paymentBase * (1 + t.paymentGrowthMin / 100)
  )
  const paidClubTarget = Math.ceil(r.paidClubBase * (1 + t.clubGrowthMin / 100))
  const distinguishedTarget = Math.ceil(
    r.paidClubBase * (t.distinguishedPercentMin / 100)
  )
  return {
    paidClubsRemaining: Math.max(0, paidClubTarget - r.paidClubs),
    paymentsRemaining: Math.max(0, paymentTarget - r.totalPayments),
    distinguishedClubsRemaining: Math.max(
      0,
      distinguishedTarget - r.distinguishedClubs
    ),
  }
}

/** Count down to the minimum (Distinguished) tier. Kept as a thin
    wrapper so the region-table path and its equivalence-pinned tests
    stay unchanged. */
export function deriveRemainingToMinimum(r: RemainingInputs): {
  paidClubsRemaining: number
  paymentsRemaining: number
  distinguishedClubsRemaining: number
} {
  return deriveRemainingToTier('Distinguished', r)
}

const countCell = (value: number): CountdownCell =>
  value <= 0 ? { kind: 'met' } : { kind: 'count', value }

/* Resolve one numeric "remaining to minimum Distinguished" cell.
   `canonical` is the #686 field (authoritative when present); `derived`
   is the count computed from the rankings row for a pre-pipeline snapshot.
   Returns null (→ em-dash) only when neither is available. */
const remainingCell = (
  canonical: number | undefined,
  derived: number | undefined
): CountdownCell | null => {
  if (canonical !== undefined) return countCell(canonical)
  if (derived !== undefined) return countCell(derived)
  return null
}

export function getDistinguishedCountdown(
  districtId: string,
  awards: CompetitiveAwardStandings | null,
  ranking?: RemainingInputs | null
): DistinguishedCountdown | null {
  if (!awards) return null
  const status = awards.distinguishedDistrict?.[districtId]
  if (!status) return null

  const derived = ranking ? deriveRemainingToMinimum(ranking) : undefined

  const paidClubsRemaining = remainingCell(
    status.paidClubsRemaining,
    derived?.paidClubsRemaining
  )
  const paymentsRemaining = remainingCell(
    status.paymentsRemaining,
    derived?.paymentsRemaining
  )
  const distinguishedClubsRemaining = remainingCell(
    status.distinguishedClubsRemaining,
    derived?.distinguishedClubsRemaining
  )

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

  return {
    paidClubsRemaining,
    paymentsRemaining,
    distinguishedClubsRemaining,
    educationTraining,
    clubGrowth,
  }
}
