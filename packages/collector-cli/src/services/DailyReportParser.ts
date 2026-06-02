/**
 * DailyReportParser — pure parser for the 12 TM District "Daily Reports"
 * (epic #1062, Sprint 2 #1064). Promotes the keep/EXCLUDE column map validated
 * in spike #1063 (`__tests__/dailyReportsColumnMap.test.ts`) into typed,
 * KEEP-only rows.
 *
 * HARD PRIVACY RULE (epic #1062): ingest club/area/division-level data only.
 * Every EXCLUDE (personal) column — and every personal cell value — is dropped
 * at parse time, here, before anything could be persisted. Only columns named in
 * a report's KEEP map are ever read into a typed field; EXCLUDE columns are
 * never projected, so a personal value has no path out of this module.
 *
 * The reports arrive as anonymous HTML (a desktop `<table>` plus a duplicate
 * `<div class="mobile-table">` we ignore). No new HTML-parser dependency: the
 * tables are flat and regex-parseable, the same approach the spike validated.
 * This module is pure — no I/O, no pipeline wiring (that is a later sprint).
 */

// ─── Typed per-report KEEP shapes ───────────────────────────────────────────

export interface DuesRenewalRow {
  club: string
  division: string
  area: string
  renewalStatus: string
  /** Overloaded "Name" column = the CLUB name here (KEEP). */
  name: string
  location: string
}

export interface OfficerListRow {
  club: string
  division: string
  area: string
  listStatus: string
  election: string
  /** "Name" = club. */
  name: string
}

export interface ClubSuccessPlanRow {
  clubNumber: string
  division: string
  area: string
  submissionDate: string
  clubName: string
}

/**
 * Education Achievements de-identified: per (club, area, award) achievement
 * COUNT. The raw report is a member-level ledger (one row per achievement, with
 * a personal `Member` column); we drop `Member` and aggregate to counts so no
 * member is identifiable while the per-club recognition signal survives.
 */
export interface EducationAchievementCount {
  club: string
  division: string
  area: string
  /** "Name" = club. */
  name: string
  location: string
  award: string
  count: number
}

/**
 * Triple Crown has NO club/area/division column; its only non-personal columns
 * are Count + Award. With `Member` excluded, nothing per-club survives — this is
 * the awkward shape the spike flagged for deferral.
 */
export interface TripleCrownRow {
  count: string
  award: string
}

export interface NewClubRow {
  division: string
  area: string
  club: string
  charterDate: string
  status: string
  name: string
  location: string
}

export interface ProspectiveClubRow {
  division: string
  area: string
  club: string
  status: string
  name: string
  location: string
  prospect: string
}

export interface SponsorMentorRow {
  club: string
  clubName: string
  charterDate: string
  code: string
  status: string
}

export interface CoachRow {
  club: string
  clubName: string
  code: string
  beginDate: string
  status: string
}

export type DistrictReportType =
  | 'dues-renewal'
  | 'officer-list'
  | 'club-success-plan'
  | 'education-achievements'
  | 'triple-crown'
  | 'education-archive'
  | 'new-clubs'
  | 'prospective-clubs'
  | 'sponsors-mentors'
  | 'coaches'

export type ParsedDistrictReport =
  | { tableId: string; reportType: 'dues-renewal'; rows: DuesRenewalRow[] }
  | { tableId: string; reportType: 'officer-list'; rows: OfficerListRow[] }
  | {
      tableId: string
      reportType: 'club-success-plan'
      rows: ClubSuccessPlanRow[]
    }
  | {
      tableId: string
      reportType: 'education-achievements'
      rows: EducationAchievementCount[]
    }
  | { tableId: string; reportType: 'triple-crown'; rows: TripleCrownRow[] }
  | { tableId: string; reportType: 'education-archive'; rows: never[] }
  | { tableId: string; reportType: 'new-clubs'; rows: NewClubRow[] }
  | {
      tableId: string
      reportType: 'prospective-clubs'
      rows: ProspectiveClubRow[]
    }
  | {
      tableId: string
      reportType: 'sponsors-mentors'
      rows: SponsorMentorRow[]
    }
  | { tableId: string; reportType: 'coaches'; rows: CoachRow[] }

// ─── Report registry: tableId → reportType + KEEP column map ─────────────────
//
// `columns` lists ONLY the KEEP headers (live header text → output field). A
// column the report emits but isn't listed here (every EXCLUDE/personal one) is
// never read — that is the privacy guarantee, by construction.

interface ColumnSpec {
  /** Live header text exactly as the report emits it. */
  header: string
  /** Output field name on the typed row. */
  field: string
}

interface ReportSpec {
  reportType: DistrictReportType
  columns: ColumnSpec[]
}

const col = (header: string, field: string): ColumnSpec => ({ header, field })

const DUES_RENEWAL: ReportSpec = {
  reportType: 'dues-renewal',
  columns: [
    col('Club', 'club'),
    col('Division', 'division'),
    col('Area', 'area'),
    col('Renewal Status', 'renewalStatus'),
    col('Name', 'name'),
    col('Location', 'location'),
  ],
}

const OFFICER_LIST: ReportSpec = {
  reportType: 'officer-list',
  columns: [
    col('Club', 'club'),
    col('Division', 'division'),
    col('Area', 'area'),
    col('List Status', 'listStatus'),
    col('Election', 'election'),
    col('Name', 'name'),
  ],
}

const REGISTRY: Record<string, ReportSpec> = {
  // April + October Dues Renewal share a shape.
  '0235cdd5-ffee-4101-ab43-a952a2736fc0': DUES_RENEWAL,
  '0d56c054-0cd2-46ba-b3b1-3bf17221bd6c': DUES_RENEWAL,
  // January + July Officer List share a shape.
  '43abeb51-40a6-4514-868a-d697d6481753': OFFICER_LIST,
  '68d834ff-90c1-40ae-a79e-c9270bd9919c': OFFICER_LIST,
  '99b20422-f82f-456b-8376-18d5ce1b70c5': {
    reportType: 'club-success-plan',
    columns: [
      col('Club Number', 'clubNumber'),
      col('Division', 'division'),
      col('Area', 'area'),
      col('Submission Date', 'submissionDate'),
      col('Club Name', 'clubName'),
    ],
  },
  'c757d313-f815-4b22-93dc-b839d04cec7b': {
    // Education Achievements: Member (person) EXCLUDED; Name = club KEEP.
    // Aggregated to counts after projection (see parseDistrictReport).
    reportType: 'education-achievements',
    columns: [
      col('Club', 'club'),
      col('Division', 'division'),
      col('Area', 'area'),
      col('Award', 'award'),
      col('Name', 'name'),
      col('Location', 'location'),
    ],
  },
  'b546ef04-e602-4ffc-95c5-5a786aba36b7': {
    // Triple Crown: Member EXCLUDED; no club column exists.
    reportType: 'triple-crown',
    columns: [col('Count', 'count'), col('Award', 'award')],
  },
  'a30b93f3-081e-42c8-9a36-137acb24be69': {
    reportType: 'education-archive',
    columns: [],
  },
  'ac6df5db-13de-425a-b8b9-f9c6093b538a': {
    reportType: 'new-clubs',
    columns: [
      col('Division', 'division'),
      col('Area', 'area'),
      col('Club', 'club'),
      col('Charter Date', 'charterDate'),
      col('Status', 'status'),
      col('Name', 'name'),
      col('Location', 'location'),
    ],
  },
  '50630d17-1492-40c9-8244-930b1d94167b': {
    // Prospective Clubs: Club Contact (person) EXCLUDED.
    reportType: 'prospective-clubs',
    columns: [
      col('Division', 'division'),
      col('Area', 'area'),
      col('Club', 'club'),
      col('Status', 'status'),
      col('Name', 'name'),
      col('Location', 'location'),
      col('Prospect', 'prospect'),
    ],
  },
  '4da53bd8-f6d9-4fa5-81d8-34ed5966dddd': {
    // Sponsors & Mentors: Name (person) EXCLUDED.
    reportType: 'sponsors-mentors',
    columns: [
      col('Club', 'club'),
      col('Club Name', 'clubName'),
      col('Charter Date', 'charterDate'),
      col('Code', 'code'),
      col('Status', 'status'),
    ],
  },
  '41955922-25ab-4a5a-8025-ebb7634f68bf': {
    // Coaches: Name (person) EXCLUDED.
    reportType: 'coaches',
    columns: [
      col('Club', 'club'),
      col('Club Name', 'clubName'),
      col('Code', 'code'),
      col('Begin Date', 'beginDate'),
      col('Status', 'status'),
    ],
  },
}

// ─── HTML table parsing (desktop <table> only) ───────────────────────────────

interface RawTable {
  headers: string[]
  rows: string[][]
}

/** Strip tags, decode &nbsp;, collapse whitespace from a cell's inner HTML. */
function cellText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parse the first `<table>` of a Daily Report response. The mobile-table
 * `<div>` duplicate is ignored. An empty body (no `<table>`) yields an empty
 * table — the caller must tolerate it (Archive report).
 */
function parseDesktopTable(html: string): RawTable {
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i)
  const tableInner = tableMatch?.[1]
  if (!tableInner) return { headers: [], rows: [] }
  const trs = tableInner.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? []
  const headerRow = trs[0]
  if (!headerRow) return { headers: [], rows: [] }
  const cellsOf = (tr: string): string[] =>
    (tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) ?? []).map(c =>
      cellText(c.replace(/^<t[dh][^>]*>/i, '').replace(/<\/t[dh]>$/i, ''))
    )
  return {
    headers: cellsOf(headerRow),
    rows: trs.slice(1).map(cellsOf),
  }
}

/**
 * Project raw rows to the KEEP columns, as `{ field: value }` objects. Only
 * headers named in `columns` are read; everything else (the EXCLUDE columns) is
 * dropped here — a personal value never reaches the output.
 */
function projectRows(
  table: RawTable,
  columns: ColumnSpec[]
): Array<Record<string, string>> {
  const headerIndex = new Map(table.headers.map((h, i) => [h, i]))
  return table.rows.map(row => {
    const out: Record<string, string> = {}
    for (const { header, field } of columns) {
      const idx = headerIndex.get(header)
      out[field] = idx === undefined ? '' : (row[idx] ?? '')
    }
    return out
  })
}

/**
 * Collapse Education Achievements' member-level rows into per-(club, award)
 * counts. Insertion order is preserved (first appearance of each group), so the
 * output is deterministic for a given input.
 */
function aggregateEducation(
  projected: Array<Record<string, string>>
): EducationAchievementCount[] {
  const groups = new Map<string, EducationAchievementCount>()
  for (const r of projected) {
    const club = r['club'] ?? ''
    const division = r['division'] ?? ''
    const area = r['area'] ?? ''
    const name = r['name'] ?? ''
    const location = r['location'] ?? ''
    const award = r['award'] ?? ''
    const key = [club, division, area, name, location, award].join('\u0000')
    const existing = groups.get(key)
    if (existing) {
      existing.count += 1
    } else {
      groups.set(key, { club, division, area, name, location, award, count: 1 })
    }
  }
  return [...groups.values()]
}

/**
 * Parse a District Daily Report response into typed, KEEP-only rows.
 *
 * @param tableId the report-type GUID (the `tableID` query param)
 * @param html    the raw HTML response body
 * @throws if `tableId` is not one of the 12 known reports
 */
export function parseDistrictReport(
  tableId: string,
  html: string
): ParsedDistrictReport {
  const spec = REGISTRY[tableId]
  if (!spec) {
    throw new Error(`parseDistrictReport: unknown report tableId "${tableId}"`)
  }

  const table = parseDesktopTable(html)
  const projected = projectRows(table, spec.columns)

  switch (spec.reportType) {
    case 'education-archive':
      return { tableId, reportType: 'education-archive', rows: [] }
    case 'education-achievements':
      return {
        tableId,
        reportType: 'education-achievements',
        rows: aggregateEducation(projected),
      }
    case 'dues-renewal':
      return {
        tableId,
        reportType: 'dues-renewal',
        rows: projected as unknown as DuesRenewalRow[],
      }
    case 'officer-list':
      return {
        tableId,
        reportType: 'officer-list',
        rows: projected as unknown as OfficerListRow[],
      }
    case 'club-success-plan':
      return {
        tableId,
        reportType: 'club-success-plan',
        rows: projected as unknown as ClubSuccessPlanRow[],
      }
    case 'triple-crown':
      return {
        tableId,
        reportType: 'triple-crown',
        rows: projected as unknown as TripleCrownRow[],
      }
    case 'new-clubs':
      return {
        tableId,
        reportType: 'new-clubs',
        rows: projected as unknown as NewClubRow[],
      }
    case 'prospective-clubs':
      return {
        tableId,
        reportType: 'prospective-clubs',
        rows: projected as unknown as ProspectiveClubRow[],
      }
    case 'sponsors-mentors':
      return {
        tableId,
        reportType: 'sponsors-mentors',
        rows: projected as unknown as SponsorMentorRow[],
      }
    case 'coaches':
      return {
        tableId,
        reportType: 'coaches',
        rows: projected as unknown as CoachRow[],
      }
  }
}
