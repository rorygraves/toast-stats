// Axe scan of ClubDCPGoalsPanel (#620, Sprint 3 of the Club Redesign epic).
//
// The panel introduces a progressbar, a per-goal status grid, and met-state
// styling. Colour/glyph alone is not accessible, so each row carries an
// sr-only "Achieved / Not yet achieved" label; this test guards the structural
// WCAG 2.1 AA rules (ARIA, labels, semantics). As with the other axe suites,
// axe-core auto-disables `color-contrast` under JSDOM — contrast is covered by
// contrastRequirements.test.ts and verified live on ts.taverns.red.

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ClubDCPGoalsPanel } from '../../components/ClubDCPGoalsPanel'

// @ts-expect-error - jest-axe matcher types vs vitest expect
expect.extend(toHaveNoViolations)

const record = {
  'Club Number': '00000606',
  'Level 1s': '4',
  'Level 2s': '2',
  'Add. Level 2s': '0',
  'Level 3s': '0',
  'Level 4s, Path Completions, or DTM Awards': '0',
  'Add. Level 4s, Path Completions, or DTM award': '0',
  'New Members': '4',
  'Add. New Members': '0',
  'Off. Trained Round 1': '4',
  'Off. Trained Round 2': '4',
  'Mem. dues on time Oct': '0',
  'Mem. dues on time Apr': '0',
  'Off. List On Time': '0',
}

describe('ClubDCPGoalsPanel — accessibility (#620)', () => {
  afterEach(() => cleanup())

  it('has no axe violations with the per-goal grid rendered', async () => {
    const { container } = render(
      <ClubDCPGoalsPanel
        goalsAchieved={4}
        clubRecord={record}
        isLoading={false}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations in the loading state', async () => {
    const { container } = render(
      <ClubDCPGoalsPanel
        goalsAchieved={0}
        clubRecord={undefined}
        isLoading={true}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
