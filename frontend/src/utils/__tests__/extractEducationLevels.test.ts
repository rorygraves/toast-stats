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

  // #486 M1: when a snapshot carries BOTH a primary column name and
  // its legacy alias for the same value (e.g. 'Level 4s' alongside
  // 'Level 4s, Path Completions, or DTM Awards'), the alias names
  // must be treated as first-match-wins fallbacks, not summed. The
  // old implementation double-counted these clubs.
  it('does not double-count when a club carries primary + legacy-alias column names', () => {
    const snapshot = {
      data: {
        clubPerformance: [
          {
            'Club Name': 'A',
            'Level 4s, Path Completions, or DTM Awards': 3,
            'Level 4s': 3, // legacy alias for the same value
            'Add. Level 4s, Path Completions, or DTM award': 1,
            'Add. Level 4s': 1, // legacy alias
            'Level 2s': 2,
            'Add. Level 2s': 1,
            'Add Level 2s': 1, // legacy alias (no period)
          },
        ],
      },
    }
    const result = extractEducationLevels(snapshot)
    // L4: primary=3 (not 3+3=6), additional=1 (not 1+1=2). Total=4.
    expect(result.level4PathDtm).toBe(4)
    // L2: primary=2, additional=1 (not 1+1=2). Total=3.
    expect(result.level2).toBe(3)
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
