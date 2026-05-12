/* Education Levels rollup (#426).

   Aggregates per-club education awards from a district snapshot into the
   four reportable buckets that Toastmasters publishes:

   - Level 1s
   - Level 2s
   - Level 3s
   - Level 4s, Path Completions, or DTM Awards

   The raw CSV bundles Level 4 + Path Completion + DTM into a single
   column — TI doesn't publicly break out per-Pathway completions in the
   district dashboard, so we report the bundle as-is rather than invent
   a breakdown. The issue's "11 Pathway" ask isn't achievable from
   public data without a per-member feed (see issue #426 comment).

   The "Add. Level Xs" columns also exist in the CSV; they are
   additional/secondary awards earned by clubs that already have a
   primary level award. We include them in the totals so the rollup
   reflects total awards, not unique clubs. */

export interface EducationLevelsTotals {
  level1: number
  level2: number
  level3: number
  /** Level 4s + Path Completions + DTM Awards bundled — TI publishes
   *  these in a single column. */
  level4PathDtm: number
  /** Total of all four buckets. */
  total: number
  /** Number of clubs that contributed at least one award. */
  contributingClubs: number
  /** Total clubs in the snapshot (denominator for participation %). */
  totalClubs: number
}

/* Each bucket has a primary column and an optional additional-awards
   column. The CSV pipeline renames the schema across years (e.g.
   'Level 4s, Path Completions, or DTM Awards' is sometimes shortened
   to 'Level 4s'), so we treat the listed names as fallback aliases:
   first match wins for each (primary, additional) pair. Summing all
   aliases as if they were distinct columns would double-count clubs
   whose snapshot carries both old and new names (#486 M1).

   Mirrors the first-match-wins extraction in
   analytics-core/src/transformation/DataTransformer.ts (extractNumber). */
const LEVEL_DEFS = {
  level1: {
    primary: ['Level 1s'],
    additional: [],
  },
  level2: {
    primary: ['Level 2s'],
    additional: ['Add. Level 2s', 'Add Level 2s'],
  },
  level3: {
    primary: ['Level 3s'],
    additional: [],
  },
  level4PathDtm: {
    primary: ['Level 4s, Path Completions, or DTM Awards', 'Level 4s'],
    additional: [
      'Add. Level 4s, Path Completions, or DTM award',
      'Add. Level 4s',
    ],
  },
} as const

const toNumber = (raw: unknown): number => {
  if (raw == null || raw === '') return 0
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

const firstPresent = (
  club: Record<string, unknown>,
  keys: ReadonlyArray<string>
): number => {
  for (const key of keys) {
    if (key in club && club[key] != null && club[key] !== '') {
      return toNumber(club[key])
    }
  }
  return 0
}

const bucketTotal = (
  club: Record<string, unknown>,
  def: { primary: ReadonlyArray<string>; additional: ReadonlyArray<string> }
): number =>
  firstPresent(club, def.primary) + firstPresent(club, def.additional)

export function extractEducationLevels(
  districtSnapshot: unknown
): EducationLevelsTotals {
  const empty: EducationLevelsTotals = {
    level1: 0,
    level2: 0,
    level3: 0,
    level4PathDtm: 0,
    total: 0,
    contributingClubs: 0,
    totalClubs: 0,
  }

  if (typeof districtSnapshot !== 'object' || districtSnapshot === null) {
    return empty
  }

  const rawSnapshot = districtSnapshot as Record<string, unknown>
  const snapshot =
    typeof rawSnapshot['data'] === 'object' && rawSnapshot['data'] !== null
      ? (rawSnapshot['data'] as Record<string, unknown>)
      : rawSnapshot

  const clubPerformanceRaw = snapshot['clubPerformance']
  if (!Array.isArray(clubPerformanceRaw)) return empty

  const totals = { level1: 0, level2: 0, level3: 0, level4PathDtm: 0 }
  let contributingClubs = 0

  for (const clubRaw of clubPerformanceRaw) {
    if (typeof clubRaw !== 'object' || clubRaw === null) continue
    const club = clubRaw as Record<string, unknown>

    const l1 = bucketTotal(club, LEVEL_DEFS.level1)
    const l2 = bucketTotal(club, LEVEL_DEFS.level2)
    const l3 = bucketTotal(club, LEVEL_DEFS.level3)
    const l4 = bucketTotal(club, LEVEL_DEFS.level4PathDtm)

    totals.level1 += l1
    totals.level2 += l2
    totals.level3 += l3
    totals.level4PathDtm += l4

    if (l1 + l2 + l3 + l4 > 0) contributingClubs += 1
  }

  return {
    ...totals,
    total: totals.level1 + totals.level2 + totals.level3 + totals.level4PathDtm,
    contributingClubs,
    totalClubs: clubPerformanceRaw.length,
  }
}
