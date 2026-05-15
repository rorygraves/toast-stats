import { describe, it, expect } from 'vitest'
import {
  getDistinguishedCountdown,
  type DistinguishedCountdown,
} from '../distinguishedCountdown'
import type {
  CompetitiveAwardStandings,
  DistinguishedDistrictStatus,
} from '../../services/cdn'

/* Unit tests for the per-district countdown helper used by the
   Region page (#516). The helper folds three numeric gaps (net club
   growth, payment growth, distinguished percent) and two officer-
   award booleans (education-training, club-growth) into a uniform
   shape the table cell renderer can consume. */

const mkAwards = (
  status: DistinguishedDistrictStatus | undefined,
  educationQualifies: boolean,
  clubGrowthQualifies: boolean
): CompetitiveAwardStandings =>
  ({
    metadata: { snapshotId: 'x', calculatedAt: 'x', totalDistricts: 1 },
    extensionAward: [],
    twentyPlusAward: [],
    retentionAward: [],
    byDistrict: {},
    distinguishedDistrict: status ? { [status.districtId]: status } : {},
    officerAwards: {
      educationTraining: [
        {
          districtId: '61',
          districtName: 'District 61',
          region: '2',
          qualifies: educationQualifies,
        },
      ],
      clubGrowth: [
        {
          districtId: '61',
          districtName: 'District 61',
          region: '2',
          qualifies: clubGrowthQualifies,
        },
      ],
    },
  }) as CompetitiveAwardStandings

const ddStatus = (
  overrides: Partial<DistinguishedDistrictStatus> = {}
): DistinguishedDistrictStatus => ({
  districtId: '61',
  currentTier: 'NotDistinguished',
  allPrerequisitesMet: false,
  prerequisites: {
    dspSubmitted: false,
    trainingMet: false,
    marketAnalysisSubmitted: false,
    communicationPlanSubmitted: false,
    regionAdvisorVisitMet: false,
  },
  nextTierGap: {
    tier: 'Distinguished',
    netClubGrowthGap: 3,
    paymentGrowthGap: 12,
    distinguishedPercentGap: 8,
    clubGrowthGap: 0,
  },
  ...overrides,
})

describe('getDistinguishedCountdown (#516 #534)', () => {
  it('returns the four numeric gaps + two officer-award booleans', () => {
    const awards = mkAwards(ddStatus(), false, true)
    const c = getDistinguishedCountdown('61', awards)
    expect(c).not.toBeNull()
    expect(c!.netClubGrowth).toEqual({ kind: 'gap', value: 3 })
    expect(c!.paymentGrowth).toEqual({ kind: 'gap', value: 12 })
    expect(c!.distinguishedPercent).toEqual({ kind: 'gap', value: 8 })
    // #534 — the fourth numeric DD prerequisite, distinct from the
    // officer-award clubGrowth boolean below.
    expect(c!.clubGrowthPercent).toEqual({ kind: 'met' })
    expect(c!.educationTraining).toEqual({ kind: 'boolean', met: false })
    expect(c!.clubGrowth).toEqual({ kind: 'boolean', met: true })
  })

  it('surfaces clubGrowthGap as a gap when the % Club Growth prerequisite is unmet', () => {
    const status = ddStatus({
      nextTierGap: {
        tier: 'Distinguished',
        netClubGrowthGap: 0,
        paymentGrowthGap: 0,
        distinguishedPercentGap: 0,
        clubGrowthGap: 4,
      },
    })
    const awards = mkAwards(status, true, true)
    const c = getDistinguishedCountdown('61', awards)
    expect(c!.clubGrowthPercent).toEqual({ kind: 'gap', value: 4 })
  })

  it('flips a numeric gap to "met" when the value is 0 or negative', () => {
    const status = ddStatus({
      nextTierGap: {
        tier: 'Distinguished',
        netClubGrowthGap: 0,
        paymentGrowthGap: -5,
        distinguishedPercentGap: 4,
        clubGrowthGap: 0,
      },
    })
    const awards = mkAwards(status, false, false)
    const c = getDistinguishedCountdown('61', awards)
    expect(c!.netClubGrowth).toEqual({ kind: 'met' })
    expect(c!.paymentGrowth).toEqual({ kind: 'met' })
    expect(c!.distinguishedPercent).toEqual({ kind: 'gap', value: 4 })
  })

  it('returns "met" for all three numeric metrics when nextTierGap is null (district at Smedley)', () => {
    const status = ddStatus({ currentTier: 'Smedley', nextTierGap: null })
    const awards = mkAwards(status, true, true)
    const c = getDistinguishedCountdown('61', awards)
    expect(c!.netClubGrowth).toEqual({ kind: 'met' })
    expect(c!.paymentGrowth).toEqual({ kind: 'met' })
    expect(c!.distinguishedPercent).toEqual({ kind: 'met' })
  })

  it('returns null when the district has no Distinguished District status entry', () => {
    const awards = mkAwards(undefined, false, false)
    const c = getDistinguishedCountdown('61', awards)
    expect(c).toBeNull()
  })

  it('returns null when awards is null (legacy snapshot)', () => {
    const c: DistinguishedCountdown | null = getDistinguishedCountdown(
      '61',
      null
    )
    expect(c).toBeNull()
  })

  it('officer-award booleans default to {met: false} when the district is missing from the lists', () => {
    // Awards present, but officerAwards arrays don't include district 61.
    const awards: CompetitiveAwardStandings = {
      ...mkAwards(ddStatus(), false, false),
      officerAwards: { educationTraining: [], clubGrowth: [] },
    }
    const c = getDistinguishedCountdown('61', awards)
    expect(c!.educationTraining).toEqual({ kind: 'boolean', met: false })
    expect(c!.clubGrowth).toEqual({ kind: 'boolean', met: false })
  })
})
