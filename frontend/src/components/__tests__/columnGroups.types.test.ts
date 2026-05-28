/**
 * Column-group metadata guard (#819, epic #821 Sprint 1 — Epic C / C1).
 *
 * ADR-006 §4 adds a `group` dimension to the column descriptor so a growing
 * column set can be shown/hidden by group (Identity / Membership / Renewals /
 * Recognition / Changes) instead of every column being always-on. These are
 * falsifiable invariants of the metadata, independent of the UI:
 *
 *   1. Every column declares a group drawn from the canonical group set.
 *   2. COLUMN_GROUPS lists the five groups in display order.
 *   3. The sticky key column (Club/name) is flagged so the group toggle never
 *      hides the row's own label (ADR-006 §3 — key column never hidden).
 */

import { describe, it, expect } from 'vitest'
import {
  COLUMN_CONFIGS,
  COLUMN_GROUPS,
  COLUMN_GROUP_IDS,
  STICKY_COLUMN_FIELD,
  type ColumnGroup,
} from '../filters/types'

describe('column-group metadata (#819)', () => {
  it('lists the five canonical groups in display order', () => {
    expect(COLUMN_GROUPS.map(g => g.id)).toEqual([
      'identity',
      'membership',
      'renewals',
      'recognition',
      'changes',
    ])
    // Every group carries a human label for the show/hide control.
    for (const g of COLUMN_GROUPS) {
      expect(g.label.length).toBeGreaterThan(0)
    }
  })

  it('assigns every column to a canonical group', () => {
    const valid = new Set<ColumnGroup>(COLUMN_GROUP_IDS)
    for (const c of COLUMN_CONFIGS) {
      expect(valid.has(c.group)).toBe(true)
    }
  })

  it('names the sticky key column, and it belongs to Identity', () => {
    expect(STICKY_COLUMN_FIELD).toBe('name')
    const sticky = COLUMN_CONFIGS.find(c => c.field === STICKY_COLUMN_FIELD)
    expect(sticky?.group).toBe('identity')
  })

  it('the Changes group is empty until #795 lands the delta columns', () => {
    expect(COLUMN_CONFIGS.filter(c => c.group === 'changes')).toHaveLength(0)
  })
})
