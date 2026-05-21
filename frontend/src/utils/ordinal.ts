/**
 * English ordinal helpers. The 11–13 teens exception is handled.
 *
 * - `ordinalSuffix(n)` returns just the two-letter suffix ("st" / "nd" /
 *   "rd" / "th") — useful when the caller composes the surrounding text
 *   (e.g. `${count}${ordinalSuffix(count)} anniversary`).
 * - `toOrdinal(n)` returns the full ordinal ("1st", "2nd", "3rd", …) —
 *   useful when the entire number-with-suffix is the unit of display.
 */
export function ordinalSuffix(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return 'th'
  const mod10 = n % 10
  if (mod10 === 1) return 'st'
  if (mod10 === 2) return 'nd'
  if (mod10 === 3) return 'rd'
  return 'th'
}

export function toOrdinal(n: number): string {
  return `${n}${ordinalSuffix(n)}`
}
