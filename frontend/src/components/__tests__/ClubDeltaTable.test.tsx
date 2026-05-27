import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  render,
  screen,
  within,
  fireEvent,
  cleanup,
} from '@testing-library/react'
import type {
  SnapshotDiff,
  ClubDiff,
  ClubPresence,
} from '@toastmasters/shared-contracts'
import { ClubDeltaTable } from '../ClubDeltaTable'

/* #795 (epic #797 Sprint 3) — per-club delta drill-down beneath the digest.
   Operates on SnapshotDiff.clubs (a different data model from the current-state
   ClubsTable — R6/lesson 117). Signed deltas (lesson 102); roster appear/
   disappear classified in their own groups (lesson 118). */

function clubDiff(over: Partial<ClubDiff> = {}): ClubDiff {
  return {
    clubId: over.clubId ?? 'c1',
    clubName: over.clubName ?? 'Alpha Club',
    divisionId: over.divisionId ?? 'A',
    areaId: over.areaId ?? '1',
    membership: over.membership ?? { from: 20, to: 26, delta: 6 },
    payments: over.payments ?? { from: 20, to: 26, delta: 6 },
    dcpGoals: over.dcpGoals ?? { from: 4, to: 5, delta: 1 },
    distinguishedFrom: over.distinguishedFrom ?? '',
    distinguishedTo: over.distinguishedTo ?? '',
    distinguishedChanged: over.distinguishedChanged ?? false,
  }
}

function presence(over: Partial<ClubPresence> = {}): ClubPresence {
  return {
    clubId: over.clubId ?? 'p1',
    clubName: over.clubName ?? 'New Club',
    divisionId: over.divisionId ?? 'B',
    areaId: over.areaId ?? '2',
    clubStatus: over.clubStatus,
  }
}

function diff(over: Partial<SnapshotDiff['clubs']> = {}): SnapshotDiff {
  return {
    districtId: '61',
    from: { date: '2026-05-25' },
    to: { date: '2026-05-26' },
    dayCount: 1,
    totals: {
      membership: { from: 100, to: 110, delta: 10 },
      payments: { from: 100, to: 110, delta: 10 },
      clubCount: { from: 2, to: 2, delta: 0 },
      distinguished: { from: 0, to: 1, delta: 1 },
    },
    clubs: {
      bothPresent: over.bothPresent ?? [clubDiff()],
      onlyInFrom: over.onlyInFrom ?? [],
      onlyInTo: over.onlyInTo ?? [],
    },
    events: [],
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ClubDeltaTable (#795)', () => {
  it('renders one row per club present in both snapshots', () => {
    render(
      <ClubDeltaTable
        diff={diff({
          bothPresent: [
            clubDiff({ clubId: 'c1', clubName: 'Alpha Club' }),
            clubDiff({ clubId: 'c2', clubName: 'Beta Club' }),
          ],
        })}
      />
    )
    expect(screen.getByText('Alpha Club')).toBeInTheDocument()
    expect(screen.getByText('Beta Club')).toBeInTheDocument()
  })

  it('renders signed deltas via ChangeIndicator (members + / −)', () => {
    render(
      <ClubDeltaTable
        diff={diff({
          bothPresent: [
            clubDiff({
              clubName: 'Gainers',
              membership: { from: 20, to: 26, delta: 6 },
              payments: { from: 20, to: 20, delta: 0 },
              dcpGoals: { from: 5, to: 5, delta: 0 },
            }),
            clubDiff({
              clubId: 'c2',
              clubName: 'Losers',
              membership: { from: 30, to: 22, delta: -8 },
              payments: { from: 20, to: 20, delta: 0 },
              dcpGoals: { from: 5, to: 5, delta: 0 },
            }),
          ],
        })}
      />
    )
    expect(screen.getByText('+6')).toBeInTheDocument()
    // Typographic minus (U+2212), lesson 102: a loss must render negative.
    expect(screen.getByText('−8')).toBeInTheDocument()
  })

  it('"Changed only" filter hides zero-delta clubs; default shows all', () => {
    render(
      <ClubDeltaTable
        diff={diff({
          bothPresent: [
            clubDiff({ clubId: 'c1', clubName: 'Mover' }),
            clubDiff({
              clubId: 'c2',
              clubName: 'Static',
              membership: { from: 20, to: 20, delta: 0 },
              payments: { from: 20, to: 20, delta: 0 },
              dcpGoals: { from: 5, to: 5, delta: 0 },
              distinguishedChanged: false,
            }),
          ],
        })}
      />
    )
    // Default: both visible.
    expect(screen.getByText('Mover')).toBeInTheDocument()
    expect(screen.getByText('Static')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('changed-only-toggle'))
    expect(screen.getByText('Mover')).toBeInTheDocument()
    expect(screen.queryByText('Static')).not.toBeInTheDocument()
  })

  it('renders distinguished became/lost as text (never colour alone)', () => {
    render(
      <ClubDeltaTable
        diff={diff({
          bothPresent: [
            clubDiff({
              clubId: 'c1',
              clubName: 'Risen',
              distinguishedFrom: '',
              distinguishedTo: 'D',
              distinguishedChanged: true,
            }),
            clubDiff({
              clubId: 'c2',
              clubName: 'Fallen',
              distinguishedFrom: 'P',
              distinguishedTo: '',
              distinguishedChanged: true,
            }),
          ],
        })}
      />
    )
    expect(screen.getByText(/became distinguished/i)).toBeInTheDocument()
    expect(screen.getByText(/lost distinguished/i)).toBeInTheDocument()
  })

  it('classifies roster changes in their own groups with status (lesson 118)', () => {
    render(
      <ClubDeltaTable
        diff={diff({
          bothPresent: [],
          onlyInTo: [presence({ clubName: 'Joined Co', clubStatus: 'Active' })],
          onlyInFrom: [
            presence({
              clubId: 'p2',
              clubName: 'Left Co',
              clubStatus: 'Suspended',
            }),
          ],
        })}
      />
    )
    const joined = screen.getByTestId('roster-joined')
    expect(within(joined).getByText('Joined Co')).toBeInTheDocument()
    expect(within(joined).getByText(/Active/)).toBeInTheDocument()

    const left = screen.getByTestId('roster-left')
    expect(within(left).getByText('Left Co')).toBeInTheDocument()
    expect(within(left).getByText(/Suspended/)).toBeInTheDocument()
  })

  it('omits roster groups when there are no roster changes', () => {
    render(<ClubDeltaTable diff={diff()} />)
    expect(screen.queryByTestId('roster-joined')).not.toBeInTheDocument()
    expect(screen.queryByTestId('roster-left')).not.toBeInTheDocument()
  })

  it('renders a card view below the 640px breakpoint', () => {
    const queries: string[] = []
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => {
        queries.push(query)
        return {
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }
      })
    )
    render(<ClubDeltaTable diff={diff()} />)
    // Keys off a 640px collapse like ClubsTable (lesson 105 — clubs browsed
    // one at a time, so card-collapse is right).
    expect(queries.some(q => q.includes('639'))).toBe(true)
    expect(screen.getByTestId('club-delta-cards')).toBeInTheDocument()
    expect(screen.queryByTestId('club-delta-table')).not.toBeInTheDocument()
  })
})
