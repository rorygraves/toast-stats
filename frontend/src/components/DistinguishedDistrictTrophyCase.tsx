import React, { useState } from 'react'
import {
  deriveRemainingToTier,
  type RemainingInputs,
} from '../utils/distinguishedCountdown'

export type DistinguishedDistrictTier =
  | 'NotDistinguished'
  | 'Distinguished'
  | 'Select'
  | 'Presidents'
  | 'Smedley'

export interface DistinguishedDistrictPrerequisites {
  dspSubmitted: boolean
  trainingMet: boolean
  marketAnalysisSubmitted: boolean
  communicationPlanSubmitted: boolean
  regionAdvisorVisitMet: boolean
}

export interface DistinguishedDistrictGap {
  tier: DistinguishedDistrictTier
  paymentGrowthGap: number
  clubGrowthGap: number
  distinguishedPercentGap: number
  netClubGrowthGap: number
  /** Program-year baselines, used as fallback inputs when canonical
      `*Remaining` fields are absent (#840 / lesson 104). */
  paidClubBase?: number
  paymentBase?: number
}

export interface DistinguishedDistrictStatus {
  districtId: string
  currentTier: DistinguishedDistrictTier
  allPrerequisitesMet: boolean
  prerequisites: DistinguishedDistrictPrerequisites
  nextTierGap: DistinguishedDistrictGap | null
  /** Canonical absolute counts remaining to the minimum (Distinguished)
      tier (#686). When `nextTierGap.tier === 'Distinguished'` these are
      the same integers the region row consumes — preferred over any
      ranking-row derivation. */
  paidClubsRemaining?: number
  paymentsRemaining?: number
  distinguishedClubsRemaining?: number
}

interface DistinguishedDistrictTrophyCaseProps {
  status: DistinguishedDistrictStatus | null
  /** Optional rankings row used to derive the absolute remaining counts
      when the canonical fields are absent or the next tier is above
      Distinguished. Matches the region page's data source. */
  ranking?: RemainingInputs | null
  clubStrengthQualifies?: boolean | undefined
  clubStrengthGrowth?: number | null | undefined
  leadershipExcellenceQualifies?: boolean | undefined
  leadershipExcellenceYears?: number | undefined
  educationTrainingQualifies?: boolean | undefined
  clubGrowthQualifies?: boolean | undefined
}

const TIER_LABELS: Record<DistinguishedDistrictTier, string> = {
  NotDistinguished: 'Not Yet Distinguished',
  Distinguished: 'Distinguished District',
  Select: 'Select Distinguished District',
  Presidents: "President's Distinguished District",
  Smedley: 'Smedley Distinguished District',
}

const TIER_BADGE_STYLES: Record<DistinguishedDistrictTier, string> = {
  NotDistinguished: 'bg-gray-100 text-gray-700 border-gray-300',
  Distinguished: 'bg-tm-true-maroon text-white border-tm-true-maroon',
  Select: 'bg-tm-cool-gray text-gray-900 border-gray-400',
  Presidents:
    'bg-tm-happy-yellow text-gray-900 border-yellow-500 font-semibold',
  Smedley: 'bg-purple-100 text-purple-900 border-purple-400 font-semibold',
}

const TIER_ICONS: Record<DistinguishedDistrictTier, string> = {
  NotDistinguished: '○',
  Distinguished: '🥉',
  Select: '🥈',
  Presidents: '🥇',
  Smedley: '🏆',
}

const PREREQUISITE_LABELS: Record<
  keyof DistinguishedDistrictPrerequisites,
  string
> = {
  dspSubmitted: 'District Success Plan submitted',
  trainingMet: '85% Director training complete',
  marketAnalysisSubmitted: 'Market Analysis Plan submitted',
  communicationPlanSubmitted: 'Communication Plan submitted',
  regionAdvisorVisitMet: '2+ Region Advisor meetings',
}

const PREREQUISITE_KEYS = Object.keys(PREREQUISITE_LABELS) as Array<
  keyof DistinguishedDistrictPrerequisites
>

interface GapTileSpec {
  label: string
  /** Canonical integer count remaining to the next tier. `null` skips
      the headline integer (no canonical field, no rankings row). */
  count: number | null
  /** Sub-item: the same gap expressed as a percentage. */
  gapPercent: number
  unitSingular: string
  unitPlural: string
}

const GapTile: React.FC<GapTileSpec> = ({
  label,
  count,
  gapPercent,
  unitSingular,
  unitPlural,
}) => {
  // `count === 0` is the canonical "met" signal (lesson 103); only the
  // un-evaluable case (no canonical, no ranking) leaves the headline blank.
  const closed = count === 0
  const noun = count === 1 ? unitSingular : unitPlural
  return (
    <div className="rounded-md border border-gray-200 theme-dark:border-gray-700 px-3 py-2">
      <div
        data-testid="gap-tile-label"
        className="text-[11px] uppercase tracking-wide text-gray-600 theme-dark:text-gray-400 font-tm-body"
      >
        {label}
      </div>
      <div
        data-testid="gap-tile-value"
        className={`mt-0.5 text-base font-semibold tabular-nums ${
          closed
            ? 'text-tm-loyal-blue'
            : 'text-gray-900 theme-dark:text-gray-100'
        }`}
      >
        {closed ? '✓' : count != null ? `${count} ${noun}` : '—'}
      </div>
      {!closed && count != null && (
        <div
          data-testid="gap-tile-subitem"
          className="mt-0.5 text-[11px] text-gray-600 theme-dark:text-gray-400 font-tm-body tabular-nums"
        >
          +{gapPercent.toFixed(1)}%
        </div>
      )}
    </div>
  )
}

export const DistinguishedDistrictTrophyCase: React.FC<
  DistinguishedDistrictTrophyCaseProps
> = ({
  status,
  ranking,
  clubStrengthQualifies,
  clubStrengthGrowth,
  leadershipExcellenceQualifies,
  leadershipExcellenceYears,
  educationTrainingQualifies,
  clubGrowthQualifies,
}) => {
  const [userExpanded, setUserExpanded] = useState(false)

  if (!status) return null

  const { currentTier, allPrerequisitesMet, prerequisites, nextTierGap } =
    status
  const metCount = PREREQUISITE_KEYS.filter(k => prerequisites[k]).length
  const totalCount = PREREQUISITE_KEYS.length
  // Unmet prereqs are the whole point of the panel — never let the user
  // collapse the list when something needs attention.
  const expanded = !allPrerequisitesMet || userExpanded
  const summaryText = `${metCount} of ${totalCount} prerequisites met`

  const additionalAwardsVisible =
    clubStrengthQualifies ||
    leadershipExcellenceQualifies ||
    educationTrainingQualifies ||
    clubGrowthQualifies

  /* Resolve the three headline integers via the SAME helper the region
     row uses. Canonical analytics fields (#686) win when the target is
     the Distinguished gate; otherwise (Select / Presidents / Smedley)
     we derive from the rankings row against the appropriate tier
     thresholds. (#840 / lessons 103, 104) */
  let paidClubsCount: number | null = null
  let paymentsCount: number | null = null
  let distinguishedClubsCount: number | null = null
  if (nextTierGap) {
    if (nextTierGap.tier === 'Distinguished') {
      paidClubsCount = status.paidClubsRemaining ?? null
      paymentsCount = status.paymentsRemaining ?? null
      distinguishedClubsCount = status.distinguishedClubsRemaining ?? null
    }
    if (
      (paidClubsCount === null ||
        paymentsCount === null ||
        distinguishedClubsCount === null) &&
      ranking &&
      nextTierGap.tier !== 'NotDistinguished'
    ) {
      const derived = deriveRemainingToTier(nextTierGap.tier, ranking)
      paidClubsCount = paidClubsCount ?? derived.paidClubsRemaining
      paymentsCount = paymentsCount ?? derived.paymentsRemaining
      distinguishedClubsCount =
        distinguishedClubsCount ?? derived.distinguishedClubsRemaining
    }
  }

  return (
    <div className="redesign-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 font-tm-headline">
            Distinguished District Status
          </h2>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-500 font-tm-body">
            Program Item 1490
          </p>
        </div>
        <span
          data-testid="distinguished-status-pill"
          className={`inline-flex items-center gap-2 px-4 py-2 text-base font-semibold rounded-full border-2 ${TIER_BADGE_STYLES[currentTier]}`}
          aria-label={`Current tier: ${TIER_LABELS[currentTier]}`}
        >
          <span aria-hidden="true">{TIER_ICONS[currentTier]}</span>
          {TIER_LABELS[currentTier]}
        </span>
      </div>

      <div className="mb-4">
        {allPrerequisitesMet ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="prerequisite-list"
            onClick={() => setUserExpanded(prev => !prev)}
            // min-h-11 = 44px touch target on mobile per WCAG 2.5.5.
            className="flex items-center gap-2 min-h-11 px-1 -mx-1 text-sm font-semibold font-tm-body text-tm-loyal-blue hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-loyal-blue rounded"
          >
            <span aria-hidden="true">✓</span>
            {summaryText}
            <span aria-hidden="true" className="text-xs">
              {expanded ? '▴' : '▾'}
            </span>
          </button>
        ) : (
          <div
            role="status"
            className="flex items-center gap-2 text-sm font-semibold font-tm-body text-tm-true-maroon"
          >
            <span aria-hidden="true">⚠</span>
            {summaryText}
          </div>
        )}
        {expanded && (
          <ul
            id="prerequisite-list"
            className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1"
          >
            {PREREQUISITE_KEYS.map(key => {
              const met = prerequisites[key]
              return (
                <li
                  key={key}
                  className="flex items-center gap-2 text-sm font-tm-body"
                >
                  <span
                    className={
                      met
                        ? 'text-tm-loyal-blue font-bold'
                        : 'text-tm-true-maroon font-bold'
                    }
                    aria-hidden="true"
                  >
                    {met ? '✓' : '✗'}
                  </span>
                  <span
                    className={
                      met ? 'text-gray-900' : 'text-gray-700 font-medium'
                    }
                  >
                    {PREREQUISITE_LABELS[key]}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {nextTierGap && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 font-tm-body">
            Gap to {TIER_LABELS[nextTierGap.tier]}
          </h3>
          {!allPrerequisitesMet && (
            <p className="text-xs text-tm-true-maroon mb-2 font-tm-body">
              ⚠ Prerequisites must be met before any tier can be earned
            </p>
          )}
          <div
            data-testid="distinguished-gap-tiles"
            className="grid grid-cols-1 md:grid-cols-3 gap-2"
          >
            {/* Headline integer is the canonical countdown to the next tier,
                matching the region row's "Remaining to Distinguished" cells.
                Percentage demoted to a sub-item. Labels mirror the region
                page exactly. (#840 / lesson 103) */}
            <GapTile
              label="Paid Clubs"
              count={paidClubsCount}
              gapPercent={nextTierGap.clubGrowthGap}
              unitSingular="club"
              unitPlural="clubs"
            />
            <GapTile
              label="Payments"
              count={paymentsCount}
              gapPercent={nextTierGap.paymentGrowthGap}
              unitSingular="payment"
              unitPlural="payments"
            />
            <GapTile
              label="Distinguished Clubs"
              count={distinguishedClubsCount}
              gapPercent={nextTierGap.distinguishedPercentGap}
              unitSingular="club"
              unitPlural="clubs"
            />
          </div>
        </div>
      )}

      {additionalAwardsVisible && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 font-tm-body">
            Additional Awards Earned
          </h3>
          <div className="flex flex-wrap gap-2">
            {clubStrengthQualifies && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border bg-green-50 text-green-800 border-green-200"
                title={`Club Strength Award — ${clubStrengthGrowth?.toFixed(1)}% avg club size growth`}
              >
                <span aria-hidden="true">💪</span>
                Club Strength
                {clubStrengthGrowth != null &&
                  ` (+${clubStrengthGrowth.toFixed(1)}%)`}
              </span>
            )}
            {leadershipExcellenceQualifies && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border bg-purple-50 text-purple-800 border-purple-200"
                title={`Leadership Excellence — ${leadershipExcellenceYears} consecutive Distinguished years`}
              >
                <span aria-hidden="true">⭐</span>
                Leadership Excellence ({leadershipExcellenceYears}yr)
              </span>
            )}
            {educationTrainingQualifies && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border bg-blue-50 text-blue-800 border-blue-200"
                title="Excellence in Education & Training (PQD)"
              >
                <span aria-hidden="true">🎓</span>
                Education & Training (PQD)
              </span>
            )}
            {clubGrowthQualifies && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border bg-teal-50 text-teal-800 border-teal-200"
                title="Excellence in Club Growth (CGD)"
              >
                <span aria-hidden="true">📈</span>
                Club Growth (CGD)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
