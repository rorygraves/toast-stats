/**
 * The result contract every CdnClient read returns.
 *
 * ADR-008 rules this shape:
 *  - **Cite the source.** Every result — success or not — carries the exact CDN
 *    `sourceUrl` it read, so a human can verify against the live site.
 *  - **Not-available, never guess.** A missing file, a network failure, or a
 *    body that fails its read-schema all resolve to `{ available: false }` with
 *    a human-readable `reason`. Reads never throw and never invent data.
 *  - **Surface the snapshot date.** Date-scoped datasets carry their snapshot
 *    `date`; index/discovery files that span all dates carry `null`.
 */
export type CdnReadResult<T> =
  | {
      readonly available: true
      readonly data: T
      readonly sourceUrl: string
      readonly date: string | null
    }
  | {
      readonly available: false
      readonly sourceUrl: string
      readonly reason: string
    }

/** Build a typed not-available result. Every `reason` starts with "not available". */
export function notAvailable(
  sourceUrl: string,
  reason: string
): CdnReadResult<never> {
  return { available: false, sourceUrl, reason }
}
