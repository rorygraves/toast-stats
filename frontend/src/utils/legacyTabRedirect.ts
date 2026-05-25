/* Legacy `?tab=…` redirect translator (#571, epic #568 Phase 3).
   Generalises the original `redirectLegacyClubsTab` to cover all three
   district subviews that now live at their own routes:

     ?tab=clubs          → /district/:id/clubs          (#570)
     ?tab=divisions      → /district/:id/divisions      (#571)
     ?tab=globalRankings → /district/:id/rankings       (#571)

   For tab=clubs the redirect also translates the legacy `f_status` /
   `f_name` filter codec into the cleaner `status` / `search` URL.
   For tab=globalRankings it renames the chart-metric URL key from
   `rank_metric` → `metric` and maps the internal `clubs` token to the
   product-facing `paid`. Other params pass through unchanged.

   Returns null for any URL that doesn't match a legacy tab — the
   router then falls through to the live DistrictDetailPage. */

const STATUS_INTERNAL_TO_URL: Record<string, string> = {
  thriving: 'thriving',
  vulnerable: 'vulnerable',
  'intervention-required': 'intervention',
}

const METRIC_INTERNAL_TO_URL: Record<string, string> = {
  clubs: 'paid',
  payments: 'payments',
  distinguished: 'distinguished',
  aggregate: 'aggregate',
}

const TAB_ROUTE_SLUG: Record<string, string> = {
  clubs: 'clubs',
  divisions: 'divisions',
  globalRankings: 'rankings',
}

function translateClubsParams(parsed: URL): URLSearchParams {
  const next = new URLSearchParams()

  const oldStatus = parsed.searchParams.get('f_status')
  if (oldStatus) {
    // f_status uses comma-separated categorical values. The new contract
    // is single-value: take the first recognised status.
    const first = oldStatus.split(',')[0]
    if (first) {
      const mapped = STATUS_INTERNAL_TO_URL[first] ?? null
      if (mapped) next.set('status', mapped)
    }
  }

  const oldName = parsed.searchParams.get('f_name')
  if (oldName) next.set('search', oldName)

  // `page` is intentionally dropped (#667, epic #665): pagination was
  // removed, so a legacy `?page=` no longer has meaning. Sort/dir carry
  // through unchanged.
  for (const key of ['sort', 'dir'] as const) {
    const v = parsed.searchParams.get(key)
    if (v) next.set(key, v)
  }
  return next
}

function translateRankingsParams(parsed: URL): URLSearchParams {
  const next = new URLSearchParams()

  const oldMetric = parsed.searchParams.get('rank_metric')
  if (oldMetric) {
    const mapped = METRIC_INTERNAL_TO_URL[oldMetric]
    if (mapped) next.set('metric', mapped)
  }

  // Pass through unrelated params that the rankings page may use later.
  parsed.searchParams.forEach((value, key) => {
    if (key === 'tab' || key === 'rank_metric') return
    next.set(key, value)
  })
  return next
}

function translateDivisionsParams(parsed: URL): URLSearchParams {
  const next = new URLSearchParams()
  parsed.searchParams.forEach((value, key) => {
    if (key === 'tab') return
    next.set(key, value)
  })
  return next
}

export function redirectLegacyDistrictTab(
  url: string,
  districtId: string | undefined
): string | null {
  if (!districtId) return null
  const parsed = new URL(url)
  const tab = parsed.searchParams.get('tab')
  if (!tab) return null
  const slug = TAB_ROUTE_SLUG[tab]
  if (!slug) return null

  let next: URLSearchParams
  switch (tab) {
    case 'clubs':
      next = translateClubsParams(parsed)
      break
    case 'globalRankings':
      next = translateRankingsParams(parsed)
      break
    default:
      next = translateDivisionsParams(parsed)
  }

  const qs = next.toString()
  return `/district/${districtId}/${slug}${qs ? `?${qs}` : ''}`
}
