/**
 * Tests for extractDcpGoalProgress (#242).
 *
 * Was components/__tests__/ClubDCPGoalsCard.test.ts; that component was replaced
 * by ClubDCPGoalsPanel in #620, but these tests only ever exercised the
 * dcpGoals util, so they moved here with it (no behaviour change).
 */

import { describe, it, expect } from 'vitest'
import { extractDcpGoalProgress } from '../dcpGoals'

describe('extractDcpGoalProgress (#242)', () => {
  it('should extract all 10 goals from a raw CSV record', () => {
    const record = {
      'Club Number': '07634790',
      'Level 1s': '2',
      'Level 2s': '1',
      'Add. Level 2s': '0',
      'Level 3s': '1',
      'Level 4s, Path Completions, or DTM Awards': '1',
      'Add. Level 4s, Path Completions, or DTM award': '0',
      'New Members': '4',
      'Add. New Members': '0',
      'Off. Trained Round 1': '4',
      'Off. Trained Round 2': '6',
      'Mem. dues on time Oct': '2',
      'Mem. dues on time Apr': '1',
      'Off. List On Time': '1',
    }

    const goals = extractDcpGoalProgress(record)

    expect(goals).toHaveLength(10)

    // Goal 1: Level 1s — 2/4, not achieved
    expect(goals[0]?.achieved).toBe(false)
    expect(goals[0]?.subItems[0]?.achieved).toBe(2)
    expect(goals[0]?.subItems[0]?.required).toBe(4)
    expect(goals[0]?.statusText).toContain('2 Level 1 awards needed')

    // Goal 5: Level 4/DTM — 1/1, achieved
    expect(goals[4]?.achieved).toBe(true)
    expect(goals[4]?.subItems[0]?.achieved).toBe(1)

    // Goal 7: New Members — 4/4, achieved
    expect(goals[6]?.achieved).toBe(true)
    expect(goals[6]?.subItems[0]?.achieved).toBe(4)

    // Goal 9: Officer training — both rounds met (4/4, 6/4)
    expect(goals[8]?.achieved).toBe(true)
    expect(goals[8]?.subItems).toHaveLength(2)
    expect(goals[8]?.subItems[0]?.achieved).toBe(4)
    expect(goals[8]?.subItems[1]?.achieved).toBe(6)

    // Goal 10: Admin — all sub-items met
    expect(goals[9]?.achieved).toBe(true)
    expect(goals[9]?.subItems).toHaveLength(3)
  })

  it('should detect unmet multi-column goals', () => {
    const record = {
      'Level 1s': '0',
      'Level 2s': '0',
      'Add. Level 2s': '0',
      'Level 3s': '0',
      'Level 4s, Path Completions, or DTM Awards': '0',
      'Add. Level 4s, Path Completions, or DTM award': '0',
      'New Members': '0',
      'Add. New Members': '0',
      'Off. Trained Round 1': '4',
      'Off. Trained Round 2': '2', // below 4 threshold
      'Mem. dues on time Oct': '0',
      'Mem. dues on time Apr': '0',
      'Off. List On Time': '0',
    }

    const goals = extractDcpGoalProgress(record)

    // Goal 9: Round 2 not met
    expect(goals[8]?.achieved).toBe(false)
    expect(goals[8]?.statusText).toContain('2 Officers trained Nov–Feb needed')

    // Goal 10: none met
    expect(goals[9]?.achieved).toBe(false)
  })

  it('should handle missing/null columns gracefully', () => {
    const record = {
      'Club Number': '12345',
      // all goal columns missing
    }

    const goals = extractDcpGoalProgress(record)
    expect(goals).toHaveLength(10)
    expect(goals.every(g => !g.achieved)).toBe(true)
    expect(goals.every(g => g.subItems.every(s => s.achieved === 0))).toBe(true)
  })

  it('should count achieved goals correctly', () => {
    const record = {
      'Level 1s': '4',
      'Level 2s': '2',
      'Add. Level 2s': '2',
      'Level 3s': '2',
      'Level 4s, Path Completions, or DTM Awards': '1',
      'Add. Level 4s, Path Completions, or DTM award': '1',
      'New Members': '4',
      'Add. New Members': '4',
      'Off. Trained Round 1': '4',
      'Off. Trained Round 2': '4',
      'Mem. dues on time Oct': '1',
      'Mem. dues on time Apr': '1',
      'Off. List On Time': '1',
    }

    const goals = extractDcpGoalProgress(record)
    const achievedCount = goals.filter(g => g.achieved).length
    expect(achievedCount).toBe(10)
  })

  it('should assign correct categories', () => {
    const record = {} as Record<string, string | number | null>
    const goals = extractDcpGoalProgress(record)

    const categories = goals.map(g => g.category)
    expect(categories.slice(0, 6).every(c => c === 'Education')).toBe(true)
    expect(categories.slice(6, 8).every(c => c === 'Membership')).toBe(true)
    expect(categories[8]).toBe('Training')
    expect(categories[9]).toBe('Administration')
  })
})
