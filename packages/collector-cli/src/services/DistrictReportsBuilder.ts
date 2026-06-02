/**
 * DistrictReportsBuilder — assemble the de-identified per-district "Daily
 * Reports" dataset (epic #1062, Sprint 3 #1065) from raw fetched report HTML.
 *
 * Pure: parse each in-scope report with `DailyReportParser` (KEEP-only — every
 * personal column already dropped at parse time), tag each section with
 * provenance (reportType + tableId + the report's `asOf` date), and apply the
 * cross-report derivations Sprint 3 owns:
 *   - **Officer-list cadence join** — a club in the JANUARY report holds
 *     semiannual elections; a club present only in JULY is annual. Submission is
 *     read from the "List Status" column ("Received …" ⇒ submitted).
 *   - **Coach activeCoach** — a `PENDING` coach status means an active coach is
 *     assigned (an `AWARDED` status is a completed engagement).
 *   - **Triple Crown scalar** — the report has no club column once `Member` is
 *     excluded, so it collapses to one district number: the achiever count.
 *
 * Sponsors/Mentors is DEFERRED (#11): its GUID is intentionally NOT in scope, so
 * even if fetched it is dropped here. No I/O, no pipeline wiring (that is the
 * writer / orchestrator step).
 */

import type {
  CoachRecord,
  DistrictReportsDataset,
  DistrictReportsSections,
  OfficerListRecord,
  ReportSource,
} from '@toastmasters/shared-contracts'

import {
  extractReportAsOf,
  parseDistrictReport,
  type OfficerListRow,
  type ParsedDistrictReport,
} from './DailyReportParser.js'

/** The in-scope report-type GUIDs (per sub-issue #1065; sponsors deferred). */
export const REPORT_GUIDS = {
  aprilDues: '0235cdd5-ffee-4101-ab43-a952a2736fc0',
  octoberDues: '0d56c054-0cd2-46ba-b3b1-3bf17221bd6c',
  officerJan: '43abeb51-40a6-4514-868a-d697d6481753',
  officerJul: '68d834ff-90c1-40ae-a79e-c9270bd9919c',
  csp: '99b20422-f82f-456b-8376-18d5ce1b70c5',
  education: 'c757d313-f815-4b22-93dc-b839d04cec7b',
  tripleCrown: 'b546ef04-e602-4ffc-95c5-5a786aba36b7',
  newClubs: 'ac6df5db-13de-425a-b8b9-f9c6093b538a',
  prospective: '50630d17-1492-40c9-8244-930b1d94167b',
  coaches: '41955922-25ab-4a5a-8025-ebb7634f68bf',
  /** Deferred (#11) — present for the skip test, never routed into a section. */
  sponsors: '4da53bd8-f6d9-4fa5-81d8-34ed5966dddd',
} as const

/**
 * GUIDs whose data is wired into a section this sprint, in fetch order. The
 * fetcher iterates this; the builder uses it to drop out-of-scope reports.
 * Sponsors/Mentors (#11) and the empty Archive are intentionally absent.
 */
export const IN_SCOPE_REPORT_GUIDS: readonly string[] = [
  REPORT_GUIDS.aprilDues,
  REPORT_GUIDS.octoberDues,
  REPORT_GUIDS.officerJan,
  REPORT_GUIDS.officerJul,
  REPORT_GUIDS.csp,
  REPORT_GUIDS.education,
  REPORT_GUIDS.tripleCrown,
  REPORT_GUIDS.newClubs,
  REPORT_GUIDS.prospective,
  REPORT_GUIDS.coaches,
]

/** GUIDs whose data is wired into a section this sprint. */
const IN_SCOPE_GUIDS: ReadonlySet<string> = new Set(IN_SCOPE_REPORT_GUIDS)

/** A fetched report: its tableID GUID and the raw HTML response body. */
export interface RawReport {
  tableId: string
  html: string
}

export interface BuildDistrictReportsInput {
  districtId: string
  programYear: string
  /** ISO timestamp; the caller supplies it (the module stays pure). */
  generatedAt: string
  reports: RawReport[]
}

/** A coach's status is "PENDING" while the engagement is active (an active coach). */
const ACTIVE_COACH_STATUS = 'PENDING'
/** Officer-list "List Status" values that count as a submitted list. */
const isSubmitted = (listStatus: string): boolean =>
  listStatus.startsWith('Received')

function sourceFor(
  reportType: string,
  tableId: string,
  html: string
): ReportSource {
  return { reportType, tableId, asOf: extractReportAsOf(html) }
}

/**
 * Join the January + July officer-list reports into one per-club record set.
 * January presence ⇒ semiannual (Jan wins for a club in both); July-only ⇒
 * annual. The submission flag/status comes from the report the club is in,
 * preferring January for a semiannual club (its Jan re-election is the relevant
 * one) — for the common annual club there is only the July report.
 */
function joinOfficerLists(
  jan: OfficerListRow[] | undefined,
  jul: OfficerListRow[] | undefined
): OfficerListRecord[] {
  const byClub = new Map<string, OfficerListRecord>()

  // July first (the comprehensive list) → tentatively annual.
  for (const row of jul ?? []) {
    byClub.set(row.club, {
      club: row.club,
      clubName: row.name,
      division: row.division,
      area: row.area,
      listStatus: row.listStatus,
      electionCadence: 'annual',
      officerListSubmitted: isSubmitted(row.listStatus),
    })
  }

  // January upgrades a club to semiannual; its Jan status is the relevant one.
  for (const row of jan ?? []) {
    byClub.set(row.club, {
      club: row.club,
      clubName: row.name,
      division: row.division,
      area: row.area,
      listStatus: row.listStatus,
      electionCadence: 'semiannual',
      officerListSubmitted: isSubmitted(row.listStatus),
    })
  }

  return [...byClub.values()]
}

function deriveCoaches(
  rows: ReadonlyArray<Omit<CoachRecord, 'activeCoach'>>
): CoachRecord[] {
  return rows.map(r => ({
    ...r,
    activeCoach: r.status === ACTIVE_COACH_STATUS,
  }))
}

/**
 * Build the de-identified dataset for one district from its fetched reports.
 * Reports not fetched (or out of scope) simply have no section — absence is
 * unambiguous, an empty section would not be.
 */
export function buildDistrictReports(
  input: BuildDistrictReportsInput
): DistrictReportsDataset {
  const sections: DistrictReportsSections = {}

  // Index raw reports by GUID so the cross-report officer-list join can reach
  // both halves regardless of fetch order.
  const byGuid = new Map<string, RawReport>()
  for (const r of input.reports) {
    if (IN_SCOPE_GUIDS.has(r.tableId)) byGuid.set(r.tableId, r)
  }

  const parsed = (
    tableId: string
  ): { report: ParsedDistrictReport; html: string } | undefined => {
    const raw = byGuid.get(tableId)
    if (!raw) return undefined
    return { report: parseDistrictReport(tableId, raw.html), html: raw.html }
  }

  // ── Dues renewal (April + October are separate provenanced sections) ──
  for (const [guid, key] of [
    [REPORT_GUIDS.aprilDues, 'aprilDuesRenewal'],
    [REPORT_GUIDS.octoberDues, 'octoberDuesRenewal'],
  ] as const) {
    const p = parsed(guid)
    if (p && p.report.reportType === 'dues-renewal') {
      sections[key] = {
        sources: [sourceFor('dues-renewal', guid, p.html)],
        records: p.report.rows,
      }
    }
  }

  // ── Officer list — cross-report join of January + July ──
  const jan = parsed(REPORT_GUIDS.officerJan)
  const jul = parsed(REPORT_GUIDS.officerJul)
  if (jan || jul) {
    const sources: ReportSource[] = []
    if (jan)
      sources.push(sourceFor('officer-list', REPORT_GUIDS.officerJan, jan.html))
    if (jul)
      sources.push(sourceFor('officer-list', REPORT_GUIDS.officerJul, jul.html))
    sections.officerList = {
      sources,
      records: joinOfficerLists(
        jan?.report.reportType === 'officer-list' ? jan.report.rows : undefined,
        jul?.report.reportType === 'officer-list' ? jul.report.rows : undefined
      ),
    }
  }

  // ── Club Success Plan ──
  const csp = parsed(REPORT_GUIDS.csp)
  if (csp && csp.report.reportType === 'club-success-plan') {
    sections.clubSuccessPlan = {
      sources: [sourceFor('club-success-plan', REPORT_GUIDS.csp, csp.html)],
      records: csp.report.rows,
    }
  }

  // ── Education Achievements (already aggregated to per-club/award counts) ──
  const edu = parsed(REPORT_GUIDS.education)
  if (edu && edu.report.reportType === 'education-achievements') {
    sections.educationAchievements = {
      sources: [
        sourceFor('education-achievements', REPORT_GUIDS.education, edu.html),
      ],
      records: edu.report.rows,
    }
  }

  // ── Triple Crown → district scalar (achiever count) ──
  const tc = parsed(REPORT_GUIDS.tripleCrown)
  if (tc && tc.report.reportType === 'triple-crown') {
    sections.tripleCrown = {
      sources: [sourceFor('triple-crown', REPORT_GUIDS.tripleCrown, tc.html)],
      summary: { achieverCount: tc.report.rows.length },
    }
  }

  // ── New Clubs ──
  const newClubs = parsed(REPORT_GUIDS.newClubs)
  if (newClubs && newClubs.report.reportType === 'new-clubs') {
    sections.newClubs = {
      sources: [sourceFor('new-clubs', REPORT_GUIDS.newClubs, newClubs.html)],
      records: newClubs.report.rows,
    }
  }

  // ── Prospective Clubs ──
  const prospective = parsed(REPORT_GUIDS.prospective)
  if (prospective && prospective.report.reportType === 'prospective-clubs') {
    sections.prospectiveClubs = {
      sources: [
        sourceFor(
          'prospective-clubs',
          REPORT_GUIDS.prospective,
          prospective.html
        ),
      ],
      records: prospective.report.rows,
    }
  }

  // ── Coaches → derive activeCoach ──
  const coaches = parsed(REPORT_GUIDS.coaches)
  if (coaches && coaches.report.reportType === 'coaches') {
    sections.coaches = {
      sources: [sourceFor('coaches', REPORT_GUIDS.coaches, coaches.html)],
      records: deriveCoaches(coaches.report.rows),
    }
  }

  return {
    districtId: input.districtId,
    programYear: input.programYear,
    generatedAt: input.generatedAt,
    sections,
  }
}
