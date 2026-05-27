/**
 * Toastmasters DCP "Club Distinguished Status" tier codes → display names.
 *
 * Codes are stable domain values (`'' | D | S | P | M`) set by Toastmasters;
 * this mirrors the private `TIER_NAMES` in analytics-core's `diffSnapshots`.
 * One frontend home so the "What Changed" table and its CSV export can't drift
 * apart (lesson 117 — diverged copies of the same map are a trap). The empty
 * code means "no distinguished status" → "None".
 */
const TIER_NAMES: Record<string, string> = {
  D: 'Distinguished',
  S: 'Select Distinguished',
  P: "President's Distinguished",
  M: 'Distinguished',
}

export function distinguishedTierName(code: string): string {
  if (!code) return 'None'
  return TIER_NAMES[code] ?? 'Distinguished'
}
