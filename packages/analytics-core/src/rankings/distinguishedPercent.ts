/**
 * Toastmasters International Distinguished District Program (Item 1490)
 * — % Distinguished is computed against Paid Club Base (PY-start club
 * count), NOT current Active Clubs. Using activeClubs as the
 * denominator under-reports the percentage whenever a district has
 * gained clubs since PY start.
 *
 * When paidClubBase is 0, return 0 rather than falling back to
 * activeClubs. A missing base is either a brand-new district (0% is
 * correct) or a pipeline schema regression (we want it LOUD, not
 * silently masked by the old buggy denominator).
 *
 * Single source of truth for this formula across the codebase. See
 * lessons 60 + 61 for the two-copies failure mode that motivated
 * dedupe (#547).
 */
export function calculateDistinguishedPercent(
  distinguishedClubs: number,
  paidClubBase: number
): number {
  if (paidClubBase === 0) return 0
  return (distinguishedClubs / paidClubBase) * 100
}
