import { describe, it, expect } from 'vitest'
import { extractEducationLevels } from '../extractEducationLevels'

describe('extractEducationLevels (#426)', () => {
  it('returns zeros for an unrecognised input', () => {
    expect(extractEducationLevels(null)).toEqual({
      level1: 0,
      level2: 0,
      level3: 0,
      level4PathDtm: 0,
      total: 0,
      contributingClubs: 0,
      totalClubs: 0,
    })
    expect(extractEducationLevels(undefined)).toEqual({
      level1: 0,
      level2: 0,
      level3: 0,
      level4PathDtm: 0,
      total: 0,
      contributingClubs: 0,
      totalClubs: 0,
    })
    expect(extractEducationLevels({})).toEqual({
      level1: 0,
      level2: 0,
      level3: 0,
      level4PathDtm: 0,
      total: 0,
      contributingClubs: 0,
      totalClubs: 0,
    })
  })

  it('sums the four reportable buckets across all clubs', () => {
    const snapshot = {
      data: {
        clubPerformance: [
          {
            'Club Name': 'A',
            'Level 1s': 3,
            'Level 2s': 2,
            'Level 3s': 1,
            'Level 4s, Path Completions, or DTM Awards': 1,
          },
          {
            'Club Name': 'B',
            'Level 1s': 0,
            'Level 2s': 1,
            'Level 3s': 0,
            'Level 4s, Path Completions, or DTM Awards': 0,
          },
        ],
      },
    }
    const result = extractEducationLevels(snapshot)
    expect(result.level1).toBe(3)
    expect(result.level2).toBe(3)
    expect(result.level3).toBe(1)
    expect(result.level4PathDtm).toBe(1)
    expect(result.total).toBe(8)
    expect(result.contributingClubs).toBe(2)
    expect(result.totalClubs).toBe(2)
  })

  it('includes Add. Level columns and the bundled Level 4 column', () => {
    const snapshot = {
      data: {
        clubPerformance: [
          {
            'Club Name': 'A',
            'Level 2s': 1,
            'Add. Level 2s': 2,
            'Level 4s, Path Completions, or DTM Awards': 1,
            'Add. Level 4s, Path Completions, or DTM award': 1,
          },
        ],
      },
    }
    const result = extractEducationLevels(snapshot)
    expect(result.level2).toBe(3)
    expect(result.level4PathDtm).toBe(2)
  })

  it('handles snapshots that lack the .data wrapper (unwrapped)', () => {
    const snapshot = {
      clubPerformance: [
        {
          'Club Name': 'A',
          'Level 1s': 5,
        },
      ],
    }
    const result = extractEducationLevels(snapshot)
    expect(result.level1).toBe(5)
    expect(result.total).toBe(5)
  })

  it('parses string numerics from the raw CSV pipeline', () => {
    const snapshot = {
      data: {
        clubPerformance: [
          {
            'Level 1s': '4',
            'Level 2s': '2',
          },
        ],
      },
    }
    const result = extractEducationLevels(snapshot)
    expect(result.level1).toBe(4)
    expect(result.level2).toBe(2)
  })

  it('counts only clubs that contributed at least one award', () => {
    const snapshot = {
      data: {
        clubPerformance: [
          { 'Club Name': 'A', 'Level 1s': 1 },
          { 'Club Name': 'B' }, // zero awards
          { 'Club Name': 'C', 'Level 3s': 2 },
        ],
      },
    }
    const result = extractEducationLevels(snapshot)
    expect(result.contributingClubs).toBe(2)
    expect(result.totalClubs).toBe(3)
  })

  it('ignores non-numeric garbage', () => {
    const snapshot = {
      data: {
        clubPerformance: [
          {
            'Level 1s': 'n/a',
            'Level 2s': null,
            'Level 3s': '',
            'Level 4s, Path Completions, or DTM Awards': 'NaN',
          },
        ],
      },
    }
    const result = extractEducationLevels(snapshot)
    expect(result.total).toBe(0)
  })
})
