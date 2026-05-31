import { DISTRICT_SECTIONS } from '../components/DistrictSubnav'

/**
 * Route-aware smart recovery resolver (#1012, epic #1010 Sprint 2).
 *
 * Sprint 1 (#1011) gave the branded error page generic Home + Back recovery.
 * This adds *contextual* recovery for the most common dead end: a malformed
 * `/district/:id/…` URL (e.g. `/district/61/dude`), which React Router treats
 * as an unmatched route (404). `useRouteError()` exposes no attempted URL, so
 * ErrorPage feeds us `useLocation().pathname` and the known district ids.
 *
 * Pure on purpose — all branching is unit-tested without a page mount (R22),
 * and ErrorPage stays a thin consumer (R3: the page owns the data, the
 * resolver only decides).
 */

export interface RecoverySuggestion {
  /** Visible link text. */
  label: string
  /** Destination path. */
  to: string
}

export type RecoveryKind = 'district-subpages' | 'districts-index' | 'none'

export interface RouteRecovery {
  kind: RecoveryKind
  /** The district id parsed from the path, when one was present. */
  districtId?: string
  suggestions: RecoverySuggestion[]
}

/** Matches `/district/<id>` optionally followed by `/<anything>`. */
const DISTRICT_PATH = /^\/district\/([^/]+)(?:\/.*)?$/

const DISTRICTS_INDEX: RouteRecovery = {
  kind: 'districts-index',
  suggestions: [{ label: 'All districts', to: '/' }],
}

/**
 * Decide what destinations to surface on the error page for an unmatched path.
 *
 * - A `/district/:id/…` path whose `:id` is a known district → links to that
 *   district's real subpages (built from the canonical {@link DISTRICT_SECTIONS}
 *   list, so no destination is ever invented — same source the subnav uses).
 * - A `/district/:id/…` path whose `:id` is unknown — or any `/district` path
 *   while the district list is still empty/unloaded — → the districts index
 *   (the safe place to find a valid district).
 * - Anything else → `none`; the page keeps its generic Home + Back affordances.
 */
export function resolveRouteRecovery(
  pathname: string,
  validDistrictIds: readonly string[]
): RouteRecovery {
  const match = DISTRICT_PATH.exec(pathname)
  if (!match) {
    // Not a district path at all (incl. `/district` with no id, and `/`).
    return pathname.startsWith('/district/') || pathname === '/district'
      ? DISTRICTS_INDEX
      : { kind: 'none', suggestions: [] }
  }

  const districtId = match[1] ?? ''
  if (!districtId || !validDistrictIds.includes(districtId)) {
    // Unknown id, or we can't confirm it yet (empty list). Either way the
    // districts index is the honest, useful destination.
    return DISTRICTS_INDEX
  }

  const suggestions: RecoverySuggestion[] = DISTRICT_SECTIONS.map(
    ({ label, segment }) => ({
      label,
      to: segment
        ? `/district/${districtId}/${segment}`
        : `/district/${districtId}`,
    })
  )
  return { kind: 'district-subpages', districtId, suggestions }
}
