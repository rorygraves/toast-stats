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

const PRIMARY_KEYS = {
  level1: ['Level 1s'],
  level2: ['Level 2s', 'Add. Level 2s', 'Add Level 2s'],
  level3: ['Level 3s'],
  level4PathDtm: [
    'Level 4s, Path Completions, or DTM Awards',
    'Level 4s',
    'Add. Level 4s, Path Completions, or DTM award',
    'Add. Level 4s',
  ],
} as const

const toNumber = (raw: unknown): number => {
  if (raw == null || raw === '') return 0
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

const sumForKeys = (
  club: Record<string, unknown>,
  keys: ReadonlyArray<string>
): number => keys.reduce((acc, key) => acc + toNumber(club[key]), 0)

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

    const l1 = sumForKeys(club, PRIMARY_KEYS.level1)
    const l2 = sumForKeys(club, PRIMARY_KEYS.level2)
    const l3 = sumForKeys(club, PRIMARY_KEYS.level3)
    const l4 = sumForKeys(club, PRIMARY_KEYS.level4PathDtm)

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
