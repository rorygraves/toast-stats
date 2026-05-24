// Unmitigated color-utility guard (#564 Phase 4)
//
// Parent issue #564 catalogued 53 Tailwind color utilities that are used in
// the component tree but lack a corresponding `[data-theme='dark']` override
// in `frontend/src/styles/dark-mode.css`. Phases 1–3 fixed the highest-
// impact dark-mode bugs (tier badges, opacity variants) and the light-mode
// small-text contrast issues. Phase 4 closes the loop with this guard so
// future PRs cannot grow the gap.
//
// Watchlist composition:
//   - All `text-{red,green,yellow,blue,purple,teal}-{700,800,900}` — mid /
//     dark saturated foregrounds that go illegible on the dark surface.
//   - All `border-{red,green,yellow,blue,purple,teal}-{200,300}` — light
//     pastel borders that vanish on the dark surface.
//   - `text-gray-200` — already very light; needs adjustment on dark.
//   - `border-gray-700` — identical tone to the dark surface, invisible.
//   - High-saturation backgrounds (`bg-red-500`, `bg-green-500`,
//     `bg-yellow-500`, `bg-blue-500`) that need text-on-fill contrast checks.
//
// For each watchlist class actually USED in a `.tsx`/`.jsx` file under
// `frontend/src/`, the test asserts a `[data-theme='dark']` rule exists in
// `dark-mode.css`. Classes that are known-missing today (the residue of
// the original 53 after Phases 1–3) live in `EXPECTED_FAILURES` and may
// only SHRINK in future PRs — never grow. New classes appearing in the
// codebase without an override fail the build.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, join } from 'path'

const FRONTEND_SRC = resolve(__dirname, '../..')
const DARK_MODE_CSS = readFileSync(
  resolve(FRONTEND_SRC, 'styles/dark-mode.css'),
  'utf-8'
)

// Watchlist of Tailwind color utilities considered high-risk for dark-mode
// contrast bugs (per #564 audit). Any of these used in a component without
// a corresponding dark override is a regression candidate.
const WATCHLIST_COLORS = ['red', 'green', 'yellow', 'blue', 'purple', 'teal']
const WATCHLIST_DARK_SHADES = ['700', '800', '900']
const WATCHLIST_LIGHT_SHADES = ['200', '300']
const WATCHLIST_FILL_SHADES = ['500']

const WATCHLIST: string[] = [
  ...WATCHLIST_COLORS.flatMap(c =>
    WATCHLIST_DARK_SHADES.map(s => `text-${c}-${s}`)
  ),
  ...WATCHLIST_COLORS.flatMap(c =>
    WATCHLIST_LIGHT_SHADES.map(s => `border-${c}-${s}`)
  ),
  ...WATCHLIST_COLORS.flatMap(c =>
    WATCHLIST_FILL_SHADES.map(s => `bg-${c}-${s}`)
  ),
  'text-gray-200',
  'border-gray-700',
]

// Classes known to be in use without an override at the time of #564 Phase 4
// (2026-05-22). Each entry is technical debt scheduled for fix in Track D
// sprints 12–15 (per epic #574). PRs MAY shrink this list (by adding an
// override). PRs MAY NOT add to it — that would mean a new component
// introduced an unmitigated utility, which is the regression class this
// guard exists to prevent. To shrink: add the override in dark-mode.css,
// run this test, delete the entry from EXPECTED_FAILURES.
const EXPECTED_FAILURES = new Set<string>([
  // Tracked debt from #564 audit, scoped to Track D sprints (epic #574):
  //   - Sprint 12 (Awards), Sprint 13 (Region pages), Sprint 14 (ClubDetail),
  //     Sprint 15 (Methodology / History / Districts landing) each remove
  //     entries from this list as their page-by-page dark-mode sweeps land.
  // Saturated foreground tones — illegible on the dark surface, need a
  // lighter shade override in dark mode.
  'text-red-900',
  'text-green-900',
  // text-yellow-900 / text-blue-900 mitigated in Sprint 14 (#610) — the club
  // anniversary badge consumes them, now remapped light in the dark block.
  // High-saturation fill colors — text-on-fill contrast may degrade on the
  // dark surface; needs a per-callsite check before override.
  'bg-red-500',
  'bg-green-500',
  'bg-yellow-500',
  // Already-light foreground; bleeds into the dark surface.
  'text-gray-200',
  // Matches the dark surface tone — invisible border.
  'border-gray-700',
])

// Recursive .tsx/.jsx file walker, excluding test files (so test fixtures
// using a watchlist class for assertions don't trip the guard).
function collectComponentFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue
      out.push(...collectComponentFiles(full))
    } else if (/\.(tsx|jsx)$/.test(entry) && !/\.test\.|\.spec\./.test(entry)) {
      out.push(full)
    }
  }
  return out
}

function classIsUsed(cls: string, files: string[]): boolean {
  // Match the class as a standalone token inside a className attribute.
  // Bound by non-word chars on both sides to avoid e.g. `text-red-700` matching
  // a hypothetical `border-text-red-700`.
  const pattern = new RegExp(`(?<![\\w-])${cls}(?![\\w-])`)
  return files.some(f => pattern.test(readFileSync(f, 'utf-8')))
}

function darkOverrideExists(cls: string): boolean {
  // Mirror the regex shape proven in opacity-variants-dark.test.ts: anchor
  // to `[data-theme='dark']` followed by the class, allowing intermediate
  // descendant tokens but not crossing a comma (which would scope a
  // sibling, not this class).
  const pattern = new RegExp(
    `\\[data-theme=['"]dark['"]\\]\\s+(?:[^,{]*\\s)?\\.${cls.replace(/[-/]/g, '\\$&')}(?![\\w-])`,
    'm'
  )
  return pattern.test(DARK_MODE_CSS)
}

describe('Unmitigated color utility guard (#564 Phase 4)', () => {
  const files = collectComponentFiles(FRONTEND_SRC)
  const usedClasses = WATCHLIST.filter(cls => classIsUsed(cls, files))
  const missingOverrides = usedClasses.filter(cls => !darkOverrideExists(cls))
  const unexpected = missingOverrides.filter(cls => !EXPECTED_FAILURES.has(cls))
  const stale = [...EXPECTED_FAILURES].filter(
    cls => !missingOverrides.includes(cls)
  )

  it('no new watchlist class appears without a dark-mode override', () => {
    if (unexpected.length > 0) {
      const msg = [
        'Watchlist color utilities found in components without a',
        "`[data-theme='dark']` override in styles/dark-mode.css.",
        '',
        'Either add the override (preferred) or, if this is intentional',
        'tracked debt, add the class to EXPECTED_FAILURES in this file',
        'with a comment linking the follow-up issue.',
        '',
        'Missing overrides:',
        ...unexpected.map(c => `  - ${c}`),
      ].join('\n')
      throw new Error(msg)
    }
    expect(unexpected).toEqual([])
  })

  it('EXPECTED_FAILURES entries reflect real gaps (no stale entries)', () => {
    if (stale.length > 0) {
      const msg = [
        'EXPECTED_FAILURES entries are stale — these classes are either',
        'no longer used or now have a dark-mode override. Remove from',
        'EXPECTED_FAILURES to keep the allowlist accurate.',
        '',
        'Stale entries:',
        ...stale.map(c => `  - ${c}`),
      ].join('\n')
      throw new Error(msg)
    }
    expect(stale).toEqual([])
  })

  it('watchlist is non-empty (regression on the test itself)', () => {
    expect(WATCHLIST.length).toBeGreaterThan(20)
  })
})
