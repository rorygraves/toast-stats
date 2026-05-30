/**
 * methodologyUrl — URL contract for the /methodology page's open-section state
 * (#981, epic #969 Sprint 5 — deep-link Methodology sections).
 *
 * Two entry points encode "which sections are open" so reload / back / share
 * all preserve it:
 *   - `?openSections=borda-count,glossary` — the persistent multi-section state,
 *     round-tripped through `useUrlState`.
 *   - `#borda-count` fragment — an on-mount directive to expand + scroll to one
 *     section (the natural shape of a shared anchor link).
 *
 * Both are adversarial input: a hand-edited or shared URL is a write path that
 * bypasses every guard on the toggle handler (Lesson 144). So the parse here is
 * the chokepoint — it whitelists ids against the page's known section list and
 * de-dups, exactly so `?openSections=bogus` or `#bogus` can never seed a phantom
 * open id.
 */

/** URL search-param key for the persistent multi-section open state. */
export const OPEN_SECTIONS_PARAM = 'openSections'

/**
 * Parse `?openSections=` into a de-duped, whitelisted, order-preserving id list.
 *
 * Curried on the valid-id set so the page can build a module-scope `parse` with
 * stable identity (keeps `useUrlState`'s memoised value/setter stable).
 */
export const parseOpenSections =
  (validIds: ReadonlySet<string>) =>
  (raw: string): string[] => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const part of raw.split(',')) {
      const id = part.trim()
      if (id && validIds.has(id) && !seen.has(id)) {
        seen.add(id)
        out.push(id)
      }
    }
    return out
  }

/** Serialize an open-section id list back to the `?openSections=` value. */
export const serializeOpenSections = (ids: ReadonlyArray<string>): string =>
  ids.join(',')

/**
 * Resolve a location hash (`#borda-count`) to a known section id, or null when
 * the fragment is empty / unknown. Whitelisted for the same reason as parse —
 * a shared `#bogus` must not drive an expand/scroll.
 */
export const sectionFromHash = (
  hash: string,
  validIds: ReadonlySet<string>
): string | null => {
  const id = hash.replace(/^#/, '').trim()
  return id && validIds.has(id) ? id : null
}
