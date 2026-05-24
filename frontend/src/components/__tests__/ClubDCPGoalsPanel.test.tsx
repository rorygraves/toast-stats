/**
 * Tests for ClubDCPGoalsPanel (#620) — Sprint 3 of the Club Redesign epic.
 *
 * The new design's "DCP Goals Progress" panel: a `.club-panel` with a progress
 * bar (current goals / 10) and a flat per-goal status grid. The Goal Achievement
 * Timeline (the panel's middle section) is Sprint 4 (#621) and intentionally NOT
 * built here.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ClubDCPGoalsPanel } from '../ClubDCPGoalsPanel'

// A record where goals 1–5, 7, 9 are met (7 of 10). Keys mirror dcpGoals.ts.
const record = {
  'Club Number': '00000606',
  'Level 1s': '4', // goal 1 ✓
  'Level 2s': '2', // goal 2 ✓
  'Add. Level 2s': '2', // goal 3 ✓
  'Level 3s': '2', // goal 4 ✓
  'Level 4s, Path Completions, or DTM Awards': '1', // goal 5 ✓
  'Add. Level 4s, Path Completions, or DTM award': '0', // goal 6 ✗
  'New Members': '4', // goal 7 ✓
  'Add. New Members': '0', // goal 8 ✗
  'Off. Trained Round 1': '4', // goal 9 ✓ (with round 2)
  'Off. Trained Round 2': '4',
  'Mem. dues on time Oct': '0', // goal 10 ✗
  'Mem. dues on time Apr': '0',
  'Off. List On Time': '0',
}

describe('ClubDCPGoalsPanel (#620)', () => {
  afterEach(() => cleanup())

  it('renders the panel header and a goals-achieved meta', () => {
    render(
      <ClubDCPGoalsPanel
        goalsAchieved={7}
        clubRecord={record}
        isLoading={false}
      />
    )
    expect(screen.getByText('DCP Goals Progress')).toBeInTheDocument()
    expect(screen.getByText('7 of 10 goals achieved')).toBeInTheDocument()
  })

  it('renders the progress bar fill proportional to goals achieved', () => {
    const { container } = render(
      <ClubDCPGoalsPanel
        goalsAchieved={7}
        clubRecord={record}
        isLoading={false}
      />
    )
    expect(screen.getByText('7 / 10 goals')).toBeInTheDocument()
    const fill = container.querySelector(
      '.dcp-progress-fill'
    ) as HTMLElement | null
    expect(fill).not.toBeNull()
    expect(fill!.style.width).toBe('70%')
  })

  it('renders all 10 goal rows with canonical (real-data) goal names', () => {
    const { container } = render(
      <ClubDCPGoalsPanel
        goalsAchieved={7}
        clubRecord={record}
        isLoading={false}
      />
    )
    const rows = container.querySelectorAll('.goals-table .goal-row')
    expect(rows).toHaveLength(10)
    // Names come from GOAL_DEFINITIONS (Pathways-era), not the illustrative
    // CC/AC names in the reference HTML.
    expect(screen.getByText('Level 1 awards')).toBeInTheDocument()
    expect(screen.getByText('New members')).toBeInTheDocument()
    expect(screen.getByText('Officer training')).toBeInTheDocument()
  })

  it('marks met goals with the .met class and leaves unmet rows unmarked', () => {
    const { container } = render(
      <ClubDCPGoalsPanel
        goalsAchieved={7}
        clubRecord={record}
        isLoading={false}
      />
    )
    const metRows = container.querySelectorAll('.goals-table .goal-row.met')
    expect(metRows).toHaveLength(7)
  })

  it('conveys met state to assistive tech (not colour-only)', () => {
    const { container } = render(
      <ClubDCPGoalsPanel
        goalsAchieved={7}
        clubRecord={record}
        isLoading={false}
      />
    )
    const firstRow = container.querySelector(
      '.goals-table .goal-row'
    ) as HTMLElement
    // Goal 1 is met → row carries a screen-reader-only "Achieved" label.
    expect(within(firstRow).getByText(/achieved/i)).toBeInTheDocument()
  })

  it('still renders the progress bar when no raw record is available', () => {
    const { container } = render(
      <ClubDCPGoalsPanel
        goalsAchieved={3}
        clubRecord={null}
        isLoading={false}
      />
    )
    // Bar + meta come from the authoritative trend count, so they render even
    // without the per-goal CSV record.
    expect(screen.getByText('3 / 10 goals')).toBeInTheDocument()
    expect(container.querySelector('.goals-table')).toBeNull()
  })

  it('shows a loading skeleton for the grid while the raw record loads', () => {
    const { container } = render(
      <ClubDCPGoalsPanel
        goalsAchieved={0}
        clubRecord={undefined}
        isLoading={true}
      />
    )
    expect(container.querySelector('.dcp-goals-skeleton')).not.toBeNull()
  })

  it('renders the Goal Achievement Timeline between the bar and the grid (#621)', () => {
    const { container } = render(
      <ClubDCPGoalsPanel
        goalsAchieved={7}
        clubRecord={record}
        isLoading={false}
        timelineRows={[
          {
            targetDate: '2025-09-01',
            actualDate: '2025-09-01',
            goalsMet: 3,
            totalGoals: 10,
            gain: null,
            isFallback: false,
          },
          {
            targetDate: '2025-11-01',
            actualDate: '2025-11-01',
            goalsMet: 7,
            totalGoals: 10,
            gain: 4,
            isFallback: false,
          },
        ]}
      />
    )
    expect(screen.getByText('Goal Achievement Timeline')).toBeInTheDocument()
    // DOM order: progress bar → timeline → per-goal grid.
    const markers = Array.from(
      container.querySelectorAll('.dcp-progress, .goal-timeline, .goals-table')
    ).map(el => el.className.split(' ')[0])
    expect(markers).toEqual(['dcp-progress', 'goal-timeline', 'goals-table'])
  })

  it('omits the timeline when no rows are provided (Sprint 3 behaviour)', () => {
    const { container } = render(
      <ClubDCPGoalsPanel
        goalsAchieved={7}
        clubRecord={record}
        isLoading={false}
      />
    )
    expect(container.querySelector('.goal-timeline')).toBeNull()
    expect(screen.queryByText('Goal Achievement Timeline')).toBeNull()
  })
})
