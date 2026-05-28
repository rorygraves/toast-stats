import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SnapshotDiff } from '@toastmasters/shared-contracts'
import { exportSnapshotDiff } from '../csvExport'

/* #795 (epic #797 Sprint 3) — diff CSV export. A sibling of exportClubPerformance
   (which exports current-snapshot fields); the diff CSV is from/to/delta data
   for two dates, plus roster changes (lesson 118). */

let captured = ''
let capturedFilename = ''

beforeEach(() => {
  captured = ''
  capturedFilename = ''
  // Capture the blob text + filename without touching the real DOM download.
  global.URL.createObjectURL = vi.fn(() => 'blob:mock')
  global.URL.revokeObjectURL = vi.fn()
  vi.spyOn(document.body, 'appendChild').mockImplementation((node: never) => {
    const el = node as unknown as HTMLAnchorElement
    capturedFilename = el.getAttribute?.('download') ?? ''
    return node
  })
  vi.spyOn(document.body, 'removeChild').mockImplementation(
    (node: never) => node
  )
  // Intercept Blob construction to read the CSV string synchronously, without
  // naming the DOM lib types (eslint no-undef doesn't know them in this env).
  const RealBlob = global.Blob
  global.Blob = class extends RealBlob {
    constructor(...args: ConstructorParameters<typeof Blob>) {
      super(...args)
      const parts = args[0] as string[]
      captured = String(parts?.[0] ?? '')
    }
  } as typeof Blob
})

afterEach(() => {
  vi.restoreAllMocks()
})

function makeDiff(over: Partial<SnapshotDiff['clubs']> = {}): SnapshotDiff {
  return {
    districtId: '61',
    from: { date: '2026-05-25' },
    to: { date: '2026-05-26' },
    dayCount: 1,
    totals: {
      membership: { from: 100, to: 110, delta: 10 },
      payments: { from: 100, to: 110, delta: 10 },
      clubCount: { from: 2, to: 3, delta: 1 },
      distinguished: { from: 0, to: 1, delta: 1 },
    },
    clubs: {
      bothPresent: over.bothPresent ?? [
        {
          clubId: 'c1',
          clubName: 'Alpha Club',
          divisionId: 'A',
          areaId: '1',
          membership: { from: 20, to: 26, delta: 6 },
          payments: { from: 20, to: 25, delta: 5 },
          dcpGoals: { from: 4, to: 5, delta: 1 },
          distinguishedFrom: '',
          distinguishedTo: 'D',
          distinguishedChanged: true,
        },
      ],
      onlyInFrom: over.onlyInFrom ?? [],
      onlyInTo: over.onlyInTo ?? [],
    },
    events: [],
  }
}

describe('exportSnapshotDiff (#795)', () => {
  it('includes a header block with district and date range', () => {
    exportSnapshotDiff(makeDiff())
    expect(captured).toContain('District 61')
    expect(captured).toContain('2026-05-25')
    expect(captured).toContain('2026-05-26')
  })

  it('emits from/to/delta columns for each both-present club', () => {
    exportSnapshotDiff(makeDiff())
    const lines = captured.split('\n')
    const header = lines.find(l => l.includes('Δ Members'))
    expect(header).toBeDefined()
    expect(header).toContain('Members From')
    expect(header).toContain('Members To')
    // The Alpha row: membership 20 → 26 (+6), payments 20 → 25 (+5), dcp 4 → 5 (+1).
    const row = lines.find(l => l.startsWith('c1,'))
    expect(row).toContain('20')
    expect(row).toContain('26')
    expect(row).toContain('6')
  })

  it('records the distinguished transition', () => {
    exportSnapshotDiff(makeDiff())
    const row = captured.split('\n').find(l => l.startsWith('c1,'))
    // Became Distinguished: from '' to 'D'.
    expect(row).toContain('Yes')
  })

  it('includes roster-change rows classified by status (lesson 118)', () => {
    exportSnapshotDiff(
      makeDiff({
        bothPresent: [],
        onlyInTo: [
          {
            clubId: 'p1',
            clubName: 'Joined Co',
            divisionId: 'B',
            areaId: '2',
            clubStatus: 'Active',
          },
        ],
        onlyInFrom: [
          {
            clubId: 'p2',
            clubName: 'Left Co',
            divisionId: 'C',
            areaId: '3',
            clubStatus: 'Suspended',
          },
        ],
      })
    )
    expect(captured).toContain('Joined Co')
    expect(captured).toContain('Joined')
    expect(captured).toContain('Left Co')
    expect(captured).toContain('Left')
    expect(captured).toContain('Suspended')
  })

  it('names the file with the district and date range', () => {
    exportSnapshotDiff(makeDiff())
    expect(capturedFilename).toContain('61')
    expect(capturedFilename).toMatch(/\.csv$/)
  })
})
