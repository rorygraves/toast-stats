import React, { useState } from 'react'

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
  /**
   * Program-year baseline values used to derive concrete unit counts
   * from the gap percentages (#555). Optional during the rollout —
   * downstream callers that don't populate them simply omit the
   * secondary "~N units" line.
   */
  paidClubBase?: number
  paymentBase?: number
}

export interface DistinguishedDistrictStatus {
  districtId: string
  currentTier: DistinguishedDistrictTier
  allPrerequisitesMet: boolean
  prerequisites: DistinguishedDistrictPrerequisites
  nextTierGap: DistinguishedDistrictGap | null
}

interface DistinguishedDistrictTrophyCaseProps {
  status: DistinguishedDistrictStatus | null
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
  /** Headline gap value, in percent. */
  gap: number
  /**
   * Concrete unit count derived from `gap × base`. `null` skips the
   * secondary line (older snapshots without base values).
   */
  concreteCount: number | null
  /** Unit noun used singular when concreteCount === 1. */
  unitSingular: string
  unitPlural: string
}

const GapTile: React.FC<GapTileSpec> = ({
  label,
  gap,
  concreteCount,
  unitSingular,
  unitPlural,
}) => {
  const closed = gap === 0
  const showConcrete = !closed && concreteCount != null && concreteCount > 0
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
        {closed ? '✓' : `+${gap.toFixed(1)}%`}
      </div>
      {showConcrete && (
        <div
          data-testid="gap-tile-units"
          className="mt-0.5 text-[11px] text-gray-600 theme-dark:text-gray-400 font-tm-body tabular-nums"
        >
          ~{concreteCount} {concreteCount === 1 ? unitSingular : unitPlural}
        </div>
      )}
    </div>
  )
}

/**
 * Convert a growth-percentage gap to a concrete unit count using the
 * program-year baseline. Returns `null` when base is unavailable so
 * the tile can omit the secondary line gracefully.
 */
function concreteUnitsFromGap(
  gapPercent: number,
  base: number | undefined
): number | null {
  if (gapPercent <= 0 || base == null || base <= 0) return null
  return Math.max(1, Math.round((base * gapPercent) / 100))
}

export const DistinguishedDistrictTrophyCase: React.FC<
  DistinguishedDistrictTrophyCaseProps
> = ({
  status,
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
            {/* Order: Club growth → Payment growth → % Distinguished (#556).
                Net Club Growth tile dropped — Club Growth % conveys the same
                fact as the absolute count for any positive growth. */}
            <GapTile
              label="Club growth"
              gap={nextTierGap.clubGrowthGap}
              concreteCount={concreteUnitsFromGap(
                nextTierGap.clubGrowthGap,
                nextTierGap.paidClubBase
              )}
              unitSingular="club"
              unitPlural="clubs"
            />
            <GapTile
              label="Payment growth"
              gap={nextTierGap.paymentGrowthGap}
              concreteCount={concreteUnitsFromGap(
                nextTierGap.paymentGrowthGap,
                nextTierGap.paymentBase
              )}
              unitSingular="payment"
              unitPlural="payments"
            />
            <GapTile
              label="% Distinguished"
              gap={nextTierGap.distinguishedPercentGap}
              concreteCount={concreteUnitsFromGap(
                nextTierGap.distinguishedPercentGap,
                nextTierGap.paidClubBase
              )}
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
