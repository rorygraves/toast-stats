/* Legacy `?tab=clubs` redirect translator (#570, epic #568 Phase 2).
   Returns the new `/district/:id/clubs` URL when the incoming request
   carries `tab=clubs`, translating the old `f_status` / `f_name` filter
   codec values into the new clean URL contract (status / search) and
   preserving sort / dir / page. Returns null for any other URL so the
   router falls through to DistrictDetailPage. */

const STATUS_INTERNAL_TO_URL: Record<string, string> = {
  thriving: 'thriving',
  vulnerable: 'vulnerable',
  'intervention-required': 'intervention',
}

export function redirectLegacyClubsTab(
  url: string,
  districtId: string | undefined
): string | null {
  if (!districtId) return null
  const parsed = new URL(url)
  if (parsed.searchParams.get('tab') !== 'clubs') return null

  const next = new URLSearchParams()

  const oldStatus = parsed.searchParams.get('f_status')
  if (oldStatus) {
    // f_status uses comma-separated categorical values. The new contract
    // is single-value: take the first recognized status.
    const first = oldStatus.split(',')[0]
    if (first) {
      const mapped = STATUS_INTERNAL_TO_URL[first] ?? null
      if (mapped) next.set('status', mapped)
    }
  }

  const oldName = parsed.searchParams.get('f_name')
  if (oldName) next.set('search', oldName)

  for (const key of ['sort', 'dir', 'page'] as const) {
    const v = parsed.searchParams.get(key)
    if (v) next.set(key, v)
  }

  const qs = next.toString()
  return `/district/${districtId}/clubs${qs ? `?${qs}` : ''}`
}
