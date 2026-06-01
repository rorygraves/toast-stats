/**
 * The MCP read-only tool set over the {@link CdnClient} (ADR-008 Sprint 2).
 *
 * Each tool validates its args, calls the thin CDN reader, and returns the
 * standard {@link toToolResult} envelope (data + sourceUrl + date, or a
 * structured not-available). Handlers do retrieval + field projection/filtering
 * ONLY — they never derive a tier, threshold, or recognition state, and the
 * package imports no `analytics-core` (enforced by a dependency test).
 */
import { z, type ZodRawShape } from 'zod'
import type { CdnClient } from '../cdn/CdnClient.js'
import { toToolResult, type ToolTextResult } from './envelope.js'

/**
 * A registrable MCP tool, stored with its handler args type-erased to a plain
 * record. The server validates args against `inputSchema` before invoking the
 * handler, so the erased shape is safe; {@link defineTool} preserves full
 * arg-type inference at the authoring site.
 */
export interface ToolDef {
  name: string
  title: string
  description: string
  inputSchema: ZodRawShape
  handler: (
    client: CdnClient,
    args: Record<string, unknown>
  ) => Promise<ToolTextResult>
}

/**
 * Author a tool with handler args inferred from its Zod raw-shape input, then
 * erase to {@link ToolDef} for heterogeneous storage in {@link TOOLS}. The cast
 * bridges handler contravariance — sound because args are runtime-validated
 * against `inputSchema` by the MCP server before the handler runs.
 */
function defineTool<Shape extends ZodRawShape>(def: {
  name: string
  title: string
  description: string
  inputSchema: Shape
  handler: (
    client: CdnClient,
    args: z.infer<z.ZodObject<Shape>>
  ) => Promise<ToolTextResult>
}): ToolDef {
  return def as unknown as ToolDef
}

/**
 * Resolve the date to read: the caller's `date` if given, else the current
 * `latest.json` date. Returns the not-available envelope verbatim if the
 * latest-date discovery read itself fails (never guesses a date).
 */
async function resolveDate(
  client: CdnClient,
  date: string | undefined
): Promise<{ ok: true; date: string } | { ok: false; error: ToolTextResult }> {
  if (date) return { ok: true, date }
  const latest = await client.getLatestDate()
  if (!latest.available) return { ok: false, error: toToolResult(latest) }
  return { ok: true, date: latest.data.latestSnapshotDate }
}

/** The raw health-signal fields surfaced per club (no derived status). */
interface ClubHealthFields {
  clubId: string
  clubName: string
  divisionId: string
  divisionName: string
  areaId: string
  areaName: string
  membershipCount: number
  membershipBase: number
  newMembers: number
  octoberRenewals: number
  aprilRenewals: number
  paymentsCount: number
  dcpGoals: number
  status: string
  clubStatus: string | null
  charterDate: string | null
}

/** The health-relevant RAW fields a snapshot already carries, per club. No
 * derived thriving/vulnerable/intervention status (that needs analytics-core,
 * which this package must not import — see plan + ADR-008 discrepancy note). */
function projectClubHealthFields(club: {
  clubId: string
  clubName: string
  divisionId: string
  divisionName: string
  areaId: string
  areaName: string
  membershipCount: number
  membershipBase: number
  newMembers: number
  octoberRenewals: number
  aprilRenewals: number
  paymentsCount: number
  dcpGoals: number
  status: string
  clubStatus?: string
  charterDate?: string
}): ClubHealthFields {
  return {
    clubId: club.clubId,
    clubName: club.clubName,
    divisionId: club.divisionId,
    divisionName: club.divisionName,
    areaId: club.areaId,
    areaName: club.areaName,
    membershipCount: club.membershipCount,
    membershipBase: club.membershipBase,
    newMembers: club.newMembers,
    octoberRenewals: club.octoberRenewals,
    aprilRenewals: club.aprilRenewals,
    paymentsCount: club.paymentsCount,
    dcpGoals: club.dcpGoals,
    status: club.status,
    clubStatus: club.clubStatus ?? null,
    charterDate: club.charterDate ?? null,
  }
}

export const TOOLS: ToolDef[] = [
  defineTool({
    name: 'get-latest-date',
    title: 'Get latest snapshot date',
    description:
      'Return the most recent snapshot date the CDN has published (from v1/latest.json).',
    inputSchema: {},
    handler: async client => toToolResult(await client.getLatestDate()),
  }),

  defineTool({
    name: 'list-dates',
    title: 'List available snapshot dates',
    description:
      'Return every snapshot date available on the CDN (from v1/dates.json).',
    inputSchema: {},
    handler: async client => toToolResult(await client.listDates()),
  }),

  defineTool({
    name: 'list-districts',
    title: 'List districts',
    description:
      'Return the district ids that have published snapshots, with the dates available for each (from config/district-snapshot-index.json).',
    inputSchema: {},
    handler: async client =>
      toToolResult(await client.getDistrictSnapshotIndex(), d => ({
        districtIds: Object.keys(d.districts),
        availableDatesByDistrict: d.districts,
      })),
  }),

  defineTool({
    name: 'resolve-club',
    title: 'Resolve a club to its district',
    description:
      'Look up which district a club id belongs to (from config/club-index.json). Returns not-available for an unknown club — never guesses.',
    inputSchema: {
      clubId: z.string().min(1).describe('Club id, e.g. "28680300"'),
    },
    handler: async (client, { clubId }) =>
      toToolResult(await client.resolveClubDistrict(clubId)),
  }),

  defineTool({
    name: 'get-district-snapshot',
    title: 'Get a district snapshot',
    description:
      'Return the full per-district snapshot (club roster, division/area aggregates, district totals) for a date. Omit date for the latest snapshot.',
    inputSchema: {
      districtId: z.string().min(1).describe('District id, e.g. "61" or "F"'),
      date: z
        .string()
        .optional()
        .describe('Snapshot date YYYY-MM-DD; omit for latest'),
    },
    handler: async (client, { districtId, date }) => {
      const resolved = await resolveDate(client, date)
      if (!resolved.ok) return resolved.error
      return toToolResult(
        await client.getDistrictSnapshot(districtId, resolved.date)
      )
    },
  }),

  defineTool({
    name: 'query-rankings',
    title: 'Query all-districts rankings',
    description:
      'Return the all-districts rankings (ranks, paid clubs, payments, distinguished tiers). Omit date for the current rankings, or pass a date for that dated snapshot.',
    inputSchema: {
      date: z
        .string()
        .optional()
        .describe('Snapshot date YYYY-MM-DD; omit for current rankings'),
    },
    handler: async (client, { date }) =>
      date
        ? toToolResult(await client.getDistrictRankingsForDate(date))
        : toToolResult(await client.getRankings()),
  }),

  defineTool({
    name: 'get-club-health',
    title: 'Get club health-signal fields',
    description:
      'Return the raw health-signal fields per club (membership, base, new members, renewals, DCP goals, status) from a district snapshot, optionally filtered to one division. These are the pre-computed inputs; the categorical thriving/vulnerable/intervention status is NOT a snapshot field and is not derived here.',
    inputSchema: {
      districtId: z.string().min(1).describe('District id, e.g. "61"'),
      date: z
        .string()
        .optional()
        .describe('Snapshot date YYYY-MM-DD; omit for latest'),
      divisionId: z
        .string()
        .optional()
        .describe('Optional division id to filter clubs by, e.g. "B"'),
    },
    handler: async (client, { districtId, date, divisionId }) => {
      const resolved = await resolveDate(client, date)
      if (!resolved.ok) return resolved.error
      const snapshot = await client.getDistrictSnapshot(
        districtId,
        resolved.date
      )
      return toToolResult(snapshot, d => {
        const clubs = divisionId
          ? d.data.clubs.filter(c => c.divisionId === divisionId)
          : d.data.clubs
        return {
          districtId: d.data.districtId,
          snapshotDate: d.data.snapshotDate,
          divisionId: divisionId ?? null,
          note: 'Raw health-signal fields only; categorical health status is not a pre-computed snapshot field and is not derived.',
          clubs: clubs.map(projectClubHealthFields),
        }
      })
    },
  }),

  defineTool({
    name: 'get-time-series',
    title: 'Get a district time-series',
    description:
      'Return the pre-computed program-year time series for a district (membership / payments / DCP goals / distinguished totals / club-health counts over time, plus a summary).',
    inputSchema: {
      districtId: z.string().min(1).describe('District id, e.g. "61"'),
      programYear: z
        .string()
        .describe('Program year YYYY-YYYY, e.g. "2025-2026"'),
    },
    handler: async (client, { districtId, programYear }) =>
      toToolResult(await client.getTimeSeries(districtId, programYear)),
  }),
]
