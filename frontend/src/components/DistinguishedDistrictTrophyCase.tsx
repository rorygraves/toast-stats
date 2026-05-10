import React from 'react'

/**
 * Distinguished District tier (#332)
 */
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
  /** Club Strength Award qualification (#333) */
  clubStrengthQualifies?: boolean | undefined
  clubStrengthGrowth?: number | null | undefined
  /** Leadership Excellence Award (#333) */
  leadershipExcellenceQualifies?: boolean | undefined
  leadershipExcellenceYears?: number | undefined
  /** Officer Awards (#333) */
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

/**
 * DistinguishedDistrictTrophyCase (#332)
 *
 * Displays the district's current Distinguished tier with:
 * - Tier badge (D / Select / Presidents / Smedley)
 * - 5-prerequisite checklist (gates eligibility)
 * - Gap analysis to the next tier ("you need +X% for Select")
 */
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
  if (!status) return null

  const { currentTier, allPrerequisitesMet, prerequisites, nextTierGap } =
    status

  return (
    <div className="redesign-panel">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 font-tm-headline mb-1">
            District Recognition
          </h2>
          <p className="text-sm text-gray-500 font-tm-body">
            Distinguished District Program (Item 1490)
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border ${TIER_BADGE_STYLES[currentTier]}`}
          aria-label={`Current tier: ${TIER_LABELS[currentTier]}`}
        >
          <span aria-hidden="true">{TIER_ICONS[currentTier]}</span>
          {TIER_LABELS[currentTier]}
        </span>
      </div>

      {/* Prerequisites Checklist */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 font-tm-body">
          Prerequisites{' '}
          <span
            className={
              allPrerequisitesMet ? 'text-tm-loyal-blue' : 'text-tm-true-maroon'
            }
          >
            {allPrerequisitesMet ? '(all met)' : '(some missing)'}
          </span>
        </h3>
        <ul className="space-y-1">
          {(
            Object.keys(PREREQUISITE_LABELS) as Array<
              keyof DistinguishedDistrictPrerequisites
            >
          ).map(key => {
            const met = prerequisites[key]
            return (
              <li key={key} className="flex items-center gap-2 text-sm">
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
      </div>

      {/* Gap to Next Tier */}
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
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <GapRow
              label="Payment growth"
              gap={nextTierGap.paymentGrowthGap}
              suffix="%"
            />
            <GapRow
              label="Club growth"
              gap={nextTierGap.clubGrowthGap}
              suffix="%"
            />
            <GapRow
              label="% Distinguished"
              gap={nextTierGap.distinguishedPercentGap}
              suffix="%"
            />
            <GapRow
              label="Net club growth"
              gap={nextTierGap.netClubGrowthGap}
              suffix=" clubs"
            />
          </ul>
        </div>
      )}

      {/* Additional Awards (#333) */}
      {(clubStrengthQualifies ||
        leadershipExcellenceQualifies ||
        educationTrainingQualifies ||
        clubGrowthQualifies) && (
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

const GapRow: React.FC<{ label: string; gap: number; suffix: string }> = ({
  label,
  gap,
  suffix,
}) => (
  <li className="flex items-center justify-between gap-2 text-gray-700 font-tm-body">
    <span>{label}</span>
    <span
      className={
        gap === 0
          ? 'text-tm-loyal-blue font-semibold tabular-nums'
          : 'text-gray-900 font-semibold tabular-nums'
      }
    >
      {gap === 0 ? '✓' : `+${gap.toFixed(1)}${suffix}`}
    </span>
  </li>
)
