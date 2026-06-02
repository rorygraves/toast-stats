import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Spike #1063 (epic #1062) — Daily Reports ingest feasibility.
 *
 * This is the validated keep/EXCLUDE column map for the 12 District "Daily
 * Reports", verified against live D61 fixtures captured 2026-06-01 (see
 * `docs/investigations/1063-daily-reports-ingest-spike.md`).
 *
 * HARD PRIVACY RULE (epic #1062): ingest club/area/division-level data only;
 * EXCLUDE every individual personal name (and any personal identifier such as
 * a member number) at parse time, before anything is persisted.
 *
 * The map below is data, not pipeline wiring — nothing imports it yet. Sprint 2
 * promotes it into the real parser. This test proves, on recorded fixtures,
 * that the map is exhaustive (covers every header the live report emits) and
 * that projecting to KEEP columns drops every personal cell value.
 */

const FIXTURE_DIR = fileURLToPath(
  new URL('./fixtures/daily-reports/', import.meta.url)
)

interface ReportSpec {
  /** Human label. */
  report: string
  /** Report-type GUID (the `tableID` query param). */
  tableId: string
  /** Recorded fixture filename. */
  fixture: string
  /** Columns safe to persist (club/area/division-level). */
  keep: string[]
  /** Personal columns that must be dropped at parse time. */
  exclude: string[]
  /** Known personal cell values that must NOT survive projection. */
  personalSamples?: string[]
  /** Some PYs return an empty body (no table) — parser must tolerate it. */
  allowEmpty?: boolean
}

const DAILY_REPORTS: ReportSpec[] = [
  {
    report: 'April Dues Renewal Status',
    tableId: '0235cdd5-ffee-4101-ab43-a952a2736fc0',
    fixture: 'april-dues-renewal.html',
    keep: ['Club', 'Division', 'Area', 'Renewal Status', 'Name', 'Location'],
    exclude: [],
  },
  {
    report: 'October Dues Renewal Status',
    tableId: '0d56c054-0cd2-46ba-b3b1-3bf17221bd6c',
    fixture: 'october-dues-renewal.html',
    keep: ['Club', 'Division', 'Area', 'Renewal Status', 'Name', 'Location'],
    exclude: [],
  },
  {
    report: 'January Club Officer List Status',
    tableId: '43abeb51-40a6-4514-868a-d697d6481753',
    fixture: 'officer-list-january.html',
    keep: ['Club', 'Division', 'Area', 'List Status', 'Election', 'Name'],
    exclude: [],
  },
  {
    report: 'July Club Officer List Status',
    tableId: '68d834ff-90c1-40ae-a79e-c9270bd9919c',
    fixture: 'officer-list-july.html',
    keep: ['Club', 'Division', 'Area', 'List Status', 'Election', 'Name'],
    exclude: [],
  },
  {
    report: 'Club Success Plan Submission',
    tableId: '99b20422-f82f-456b-8376-18d5ce1b70c5',
    fixture: 'club-success-plan.html',
    keep: ['Club Number', 'Division', 'Area', 'Submission Date', 'Club Name'],
    exclude: [],
  },
  {
    // The overloaded-"Name" case: Name = CLUB (keep), Member = PERSON (exclude).
    report: 'Education Achievements',
    tableId: 'c757d313-f815-4b22-93dc-b839d04cec7b',
    fixture: 'education-achievements.html',
    keep: ['Club', 'Division', 'Area', 'Award', 'Date', 'Name', 'Location'],
    exclude: ['Member'],
    personalSamples: ['Ricardo J. Bocanegra, DTM'],
  },
  {
    // Member is "<memberId> - <name|Name unavailable>": the ID itself is
    // identifying, so the whole column is excluded. No club column exists →
    // only a district-level count is derivable.
    report: 'Triple Crown Awards',
    tableId: 'b546ef04-e602-4ffc-95c5-5a786aba36b7',
    fixture: 'triple-crown.html',
    keep: ['Count', 'Award'],
    exclude: ['Member'],
    personalSamples: ['00987204 - Name unavailable'],
  },
  {
    report: 'Educational Achievement Archive (empty this PY)',
    tableId: 'a30b93f3-081e-42c8-9a36-137acb24be69',
    fixture: 'education-archive-empty.html',
    keep: [],
    exclude: [],
    allowEmpty: true,
  },
  {
    report: 'New Clubs',
    tableId: 'ac6df5db-13de-425a-b8b9-f9c6093b538a',
    fixture: 'new-clubs.html',
    keep: [
      'Division',
      'Area',
      'Club',
      'Charter Date',
      'Status',
      'Name',
      'Location',
    ],
    exclude: [],
  },
  {
    report: 'Prospective Clubs',
    tableId: '50630d17-1492-40c9-8244-930b1d94167b',
    fixture: 'prospective-clubs.html',
    keep: [
      'Division',
      'Area',
      'Club',
      'Status',
      'Name',
      'Location',
      'Prospect',
    ],
    exclude: ['Club Contact'],
    personalSamples: ['Linda Brisebois'],
  },
  {
    report: 'New Club Sponsors and Mentors',
    tableId: '4da53bd8-f6d9-4fa5-81d8-34ed5966dddd',
    fixture: 'sponsors-mentors.html',
    keep: ['Club', 'Club Name', 'Charter Date', 'Code', 'Status'],
    exclude: ['Name'],
    personalSamples: ['Louise Audy, PM5'],
  },
  {
    report: 'Club Coaches',
    tableId: '41955922-25ab-4a5a-8025-ebb7634f68bf',
    fixture: 'coaches.html',
    keep: ['Club', 'Club Name', 'Code', 'Begin Date', 'Status'],
    exclude: ['Name'],
    personalSamples: ['Rodica Jelea, VC1'],
  },
]

/** Strip tags + collapse whitespace from an HTML cell's inner content. */
function cellText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface ParsedTable {
  headers: string[]
  rows: string[][]
}

/**
 * Parse the desktop `<table>` of a Daily Report response. The response also
 * carries a `<div class="mobile-table">` duplicate of the same data — the
 * parser keys off the `<table>` only (the fixtures drop the mobile copy).
 */
function parseDesktopTable(htmlRaw: string): ParsedTable {
  const tableMatch = htmlRaw.match(/<table[^>]*>([\s\S]*?)<\/table>/i)
  if (!tableMatch) return { headers: [], rows: [] }
  const trs = tableMatch[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? []
  const cellsOf = (tr: string): string[] =>
    (tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) ?? []).map(c =>
      cellText(c.replace(/^<t[dh][^>]*>/i, '').replace(/<\/t[dh]>$/i, ''))
    )
  if (trs.length === 0) return { headers: [], rows: [] }
  return {
    headers: cellsOf(trs[0]),
    rows: trs.slice(1).map(cellsOf),
  }
}

/** Project rows to only the KEEP columns, in the fixture's header order. */
function projectKeep(
  table: ParsedTable,
  keep: string[]
): { headers: string[]; rows: string[][] } {
  const keepIdx = table.headers
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => keep.includes(h))
    .map(({ i }) => i)
  return {
    headers: keepIdx.map(i => table.headers[i]),
    rows: table.rows.map(r => keepIdx.map(i => r[i] ?? '')),
  }
}

describe('Daily Reports keep/EXCLUDE column map (spike #1063)', () => {
  it('covers all 12 report types', () => {
    expect(DAILY_REPORTS).toHaveLength(12)
  })

  it.each(DAILY_REPORTS)(
    'keep ∪ exclude exactly equals the live header set — $report',
    spec => {
      const html = readFileSync(FIXTURE_DIR + spec.fixture, 'utf8')
      const { headers } = parseDesktopTable(html)

      if (spec.allowEmpty && headers.length === 0) {
        // Empty body is a real shape — parser must tolerate it, not crash.
        expect(spec.keep).toEqual([])
        expect(spec.exclude).toEqual([])
        return
      }

      // Exhaustive + disjoint (R20 spirit): every live header is classified
      // exactly once, and the map invents no header the report doesn't emit.
      const classified = [...spec.keep, ...spec.exclude].sort()
      expect(classified).toEqual([...headers].sort())
      // keep ∩ exclude = ∅
      expect(spec.keep.filter(k => spec.exclude.includes(k))).toEqual([])
    }
  )

  it.each(DAILY_REPORTS.filter(s => s.exclude.length > 0))(
    'projection drops every EXCLUDE column and personal value — $report',
    spec => {
      const html = readFileSync(FIXTURE_DIR + spec.fixture, 'utf8')
      const table = parseDesktopTable(html)
      const projected = projectKeep(table, spec.keep)

      // No excluded column header survives.
      for (const col of spec.exclude) {
        expect(projected.headers).not.toContain(col)
      }
      // No personal cell value survives anywhere in the projected output...
      const flat = projected.rows.flat().join('')
      for (const sample of spec.personalSamples ?? []) {
        expect(flat).not.toContain(sample)
        // ...even though it WAS present in the raw fixture (proves the drop
        // is real, not a fixture that never had the value — falsifiability).
        expect(html).toContain(sample)
      }
    }
  )

  // Independent of how the map classifies columns: no known personal value may
  // ever survive a KEEP projection. This is the privacy backstop — if a future
  // edit mis-classifies a personal column as KEEP, the exhaustiveness test still
  // passes (the header set is unchanged) but THIS test goes red.
  const PERSONAL_DENYLIST = DAILY_REPORTS.flatMap(s => s.personalSamples ?? [])

  it.each(DAILY_REPORTS.filter(s => !s.allowEmpty))(
    'no personal value from any report survives KEEP projection — $report',
    spec => {
      const html = readFileSync(FIXTURE_DIR + spec.fixture, 'utf8')
      const projected = projectKeep(parseDesktopTable(html), spec.keep)
      const flat = projected.rows.flat().join('')
      for (const personal of PERSONAL_DENYLIST) {
        expect(flat).not.toContain(personal)
      }
    }
  )

  it('tolerates the empty-body archive report without throwing', () => {
    const html = readFileSync(
      FIXTURE_DIR + 'education-archive-empty.html',
      'utf8'
    )
    const table = parseDesktopTable(html)
    expect(table.headers).toEqual([])
    expect(table.rows).toEqual([])
  })
})
