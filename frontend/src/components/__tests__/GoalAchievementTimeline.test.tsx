/**
 * Tests for GoalAchievementTimeline (#621) — Sprint 4 of the Club Redesign
 * epic (#617). The historical DCP-goals progression shown between the progress
 * bar and the per-goal grid inside the DCP Goals Progress panel. Pixel-mapped
 * to club-reference.html's `.timeline-row` grid.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { GoalAchievementTimeline } from '../GoalAchievementTimeline'
import type { GoalTimelineRow } from '../../hooks/useClubGoalTimeline'

const rows: GoalTimelineRow[] = [
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
    goalsMet: 5,
    totalGoals: 10,
    gain: 2,
    isFallback: false,
  },
  {
    targetDate: '2026-03-01',
    actualDate: '2026-02-15',
    goalsMet: 9,
    totalGoals: 10,
    gain: 4,
    isFallback: true,
  },
]

describe('GoalAchievementTimeline (#621)', () => {
  afterEach(() => cleanup())

  it('renders the section heading', () => {
    render(<GoalAchievementTimeline rows={rows} />)
    expect(screen.getByText('Goal Achievement Timeline')).toBeInTheDocument()
  })

  it('renders one row per data point', () => {
    const { container } = render(<GoalAchievementTimeline rows={rows} />)
    expect(container.querySelectorAll('.timeline-row')).toHaveLength(3)
  })

  it('renders the N/total count for each row', () => {
    render(<GoalAchievementTimeline rows={rows} />)
    expect(screen.getByText('3/10')).toBeInTheDocument()
    expect(screen.getByText('5/10')).toBeInTheDocument()
    expect(screen.getByText('9/10')).toBeInTheDocument()
  })

  it('sets the bar-fill width to goalsMet/total', () => {
    const { container } = render(<GoalAchievementTimeline rows={rows} />)
    const fills = container.querySelectorAll<HTMLElement>('.bar-fill')
    expect(fills[0]!.style.width).toBe('30%')
    expect(fills[1]!.style.width).toBe('50%')
    expect(fills[2]!.style.width).toBe('90%')
  })

  it('shows a positive gain in green and leaves the first row blank', () => {
    const { container } = render(<GoalAchievementTimeline rows={rows} />)
    const gains = container.querySelectorAll('.gain')
    expect(gains[0]!.textContent).toBe('') // first row: no baseline
    expect(gains[1]!.textContent).toBe('+2')
    expect(gains[1]!.className).toContain('pos')
  })

  it('shows a negative gain in red', () => {
    const neg: GoalTimelineRow[] = [
      { ...rows[0]! },
      { ...rows[1]!, gain: -2, goalsMet: 3 },
    ]
    const { container } = render(<GoalAchievementTimeline rows={neg} />)
    const gains = container.querySelectorAll('.gain')
    expect(gains[1]!.textContent).toBe('-2')
    expect(gains[1]!.className).toContain('neg')
  })

  it('does not color a zero gain as pos or neg', () => {
    const zero: GoalTimelineRow[] = [
      { ...rows[0]! },
      { ...rows[1]!, gain: 0, goalsMet: 3 },
    ]
    const { container } = render(<GoalAchievementTimeline rows={zero} />)
    const gain = container.querySelectorAll('.gain')[1]!
    expect(gain.className).not.toContain('pos')
    expect(gain.className).not.toContain('neg')
  })

  it('displays the actual snapshot date used for a fallback row', () => {
    render(<GoalAchievementTimeline rows={rows} />)
    // Fallback row used 2026-02-15 rather than the Mar 1 target.
    expect(screen.getByText(/Feb 15, 2026/)).toBeInTheDocument()
  })

  it('annotates fallback rows with a tooltip and a footnote', () => {
    const { container } = render(<GoalAchievementTimeline rows={rows} />)
    // Marker on the fallback row's date.
    const fallbackDate = container.querySelector('.timeline-row .date[title]')
    expect(fallbackDate).not.toBeNull()
    expect(fallbackDate!.getAttribute('title')).toMatch(/nearest/i)
    // Explanatory footnote present when at least one fallback exists.
    expect(screen.getByText(/nearest available snapshot/i)).toBeInTheDocument()
  })

  it('omits the footnote when no rows fell back', () => {
    const exact = rows.slice(0, 2) // both isFallback: false
    render(<GoalAchievementTimeline rows={exact} />)
    expect(screen.queryByText(/nearest available snapshot/i)).toBeNull()
  })

  it('renders nothing when there are no rows', () => {
    const { container } = render(<GoalAchievementTimeline rows={[]} />)
    expect(container.querySelector('.timeline-row')).toBeNull()
    expect(screen.queryByText('Goal Achievement Timeline')).toBeNull()
  })
})
