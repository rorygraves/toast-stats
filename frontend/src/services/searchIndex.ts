/* Unified omni-search data layer (epic #1055 Sprint 1, #1056).

   A pure, React-free module: a typed in-memory index over the three
   globally-indexable entity types (districts, regions, clubs) plus a ranked
   substring/prefix matcher. The UI (header bar, modal palette) is built on top
   of this in later sprints — keep this file presentation-free.

   Laziness: the 1MB club index is only fetched when `loadSearchIndex()` is
   invoked, never at import / app boot. `buildSearchIndex` is pure (data in,
   index out) so it is trivially unit-testable without the network. */

import { fetchCdnRankings, fetchCdnClubIndex } from './cdn'

export type SearchEntityType = 'district' | 'region' | 'club'

export interface SearchEntity {
  type: SearchEntityType
  /** Stable id: districtId | region string ("07") | clubId */
  id: string
  /** Primary display label, e.g. "District 61", "Region 7", "Toast of the Town" */
  label: string
  /** Disambiguation context shown beside the label, e.g. a club's "District 61" */
  context?: string
  /** Canonical route to navigate to */
  route: string
  /** Lowercased terms the query is matched against (id, name, aliases) */
  terms: string[]
}

export interface SearchIndex {
  entities: SearchEntity[]
}

export interface SearchResultGroup {
  type: SearchEntityType
  entities: SearchEntity[]
}

export interface SearchOptions {
  /** Maximum total results across all groups. */
  cap?: number
}

/** The three fields the index reads from a CDN rankings row. */
type RankingRow = {
  districtId: string
  districtName: string
  region: string
}

type ClubIndexEntry = { districtId: string; clubName: string }

const DEFAULT_CAP = 8

// Group display order: navigate-to-a-place entities (districts, regions) lead;
// clubs follow. The matcher also weights types so this order survives the cap.
const GROUP_ORDER: SearchEntityType[] = ['district', 'region', 'club']

// Higher = ranked first among equal-strength matches, and weighted to survive
// the result cap (so a club merely containing "61" can't bury District 61).
const TYPE_RANK: Record<SearchEntityType, number> = {
  district: 2,
  region: 1,
  club: 0,
}

/**
 * Build the unified search index from already-loaded data. Pure — no network,
 * no React. Districts + regions come from the rankings file; clubs from the
 * global club index.
 */
export function buildSearchIndex(
  rankings: ReadonlyArray<RankingRow>,
  clubs: Readonly<Record<string, ClubIndexEntry>>
): SearchIndex {
  const entities: SearchEntity[] = []

  // Districts — one per ranking row.
  for (const r of rankings) {
    entities.push({
      type: 'district',
      id: r.districtId,
      label: r.districtName,
      route: `/district/${r.districtId}`,
      terms: dedupeTerms([r.districtId, r.districtName]),
    })
  }

  // Regions — one per distinct numeric region (rankings repeat it per district).
  const seenRegions = new Set<string>()
  for (const r of rankings) {
    if (!/^\d+$/.test(r.region) || seenRegions.has(r.region)) continue
    seenRegions.add(r.region)
    const n = Number(r.region)
    entities.push({
      type: 'region',
      id: r.region,
      label: `Region ${n}`,
      route: `/region/${r.region}`,
      // Match both padded ("07") and unpadded ("7") forms.
      terms: dedupeTerms([r.region, String(n), `region ${n}`]),
    })
  }

  // Clubs — resolve each to its district's club route.
  for (const [clubId, club] of Object.entries(clubs)) {
    entities.push({
      type: 'club',
      id: clubId,
      label: club.clubName,
      context: `District ${club.districtId}`,
      route: `/district/${club.districtId}/club/${clubId}`,
      terms: dedupeTerms([clubId, club.clubName]),
    })
  }

  return { entities }
}

function dedupeTerms(raw: string[]): string[] {
  return Array.from(new Set(raw.map(t => t.toLowerCase())))
}

// Match strength of a single entity against the query: 3 exact, 2 prefix,
// 1 substring, 0 no match (best over all of the entity's terms).
function matchLevel(terms: string[], q: string): number {
  let best = 0
  for (const term of terms) {
    if (term === q) return 3
    if (term.startsWith(q)) best = Math.max(best, 2)
    else if (term.includes(q)) best = Math.max(best, 1)
  }
  return best
}

/**
 * Rank entities matching `query`, grouped by type. Case-insensitive
 * substring/prefix match; ranked exact > prefix > substring, with
 * districts/regions weighted above clubs and shorter labels preferred. The
 * total result count is capped (default 8) before grouping. An empty or
 * whitespace-only query returns no results.
 */
export function searchEntities(
  query: string,
  index: SearchIndex,
  options: SearchOptions = {}
): SearchResultGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const cap = options.cap ?? DEFAULT_CAP

  const scored = index.entities
    .map(entity => ({ entity, level: matchLevel(entity.terms, q) }))
    .filter(s => s.level > 0)
    .sort((a, b) => {
      // 1) stronger match first
      if (a.level !== b.level) return b.level - a.level
      // 2) districts/regions above clubs
      const at = TYPE_RANK[a.entity.type]
      const bt = TYPE_RANK[b.entity.type]
      if (at !== bt) return bt - at
      // 3) shorter label first
      if (a.entity.label.length !== b.entity.label.length) {
        return a.entity.label.length - b.entity.label.length
      }
      // 4) stable alphabetical
      return a.entity.label.localeCompare(b.entity.label)
    })
    .slice(0, cap)
    .map(s => s.entity)

  // Group the survivors by type in canonical order; drop empty groups.
  return GROUP_ORDER.map(type => ({
    type,
    entities: scored.filter(e => e.type === type),
  })).filter(g => g.entities.length > 0)
}

/**
 * Load and build the unified index from the CDN. The club index (~1MB) is only
 * fetched here — never at import — so it does not regress cold app-load.
 */
export async function loadSearchIndex(): Promise<SearchIndex> {
  const [rankings, clubIndex] = await Promise.all([
    fetchCdnRankings(),
    fetchCdnClubIndex(),
  ])
  return buildSearchIndex(rankings.rankings, clubIndex.clubs)
}
