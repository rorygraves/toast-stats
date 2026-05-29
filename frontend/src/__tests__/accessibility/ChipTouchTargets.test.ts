/**
 * Chip touch-target floor — #886 (epic #888 Sprint 2, "Touch-target sweep").
 *
 * Audit #885 found two `<button>` chip families short of the 44px floor on
 * their failing dimension (WIDTH; height already passed):
 *   - Family B: `.districts-toolbar__region-chip`  measured 36 × 44
 *   - Family C: `.region-finder__chip`             measured 40–41 × 44
 *
 * Both are styled in CSS (not Tailwind utilities), so the contract lives in the
 * stylesheet: each rule must declare `min-width: 44px`. This reads the *actual*
 * CSS rather than relying on jsdom geometry (jsdom has no layout — L66); the
 * live per-engine box is proven by the dual-engine preview smoke. Same
 * read-the-CSS approach as the dark-mode contrast audits (e.g.
 * RegionDarkModeContrast), and it routes to the integration project by living
 * in `__tests__/accessibility/` (Lesson 090).
 *
 * Falsifiable: before the fix these rules carry `min-width: 36px` / `40px` and
 * the assertions fail.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const stylesDir = resolve(here, '../../styles')

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const appShellCss = stripComments(
  readFileSync(resolve(stylesDir, 'components/app-shell.css'), 'utf8')
)

/** Body of the first rule whose selector matches `selector` exactly. Anchored
 *  to a real `selector {` rule start so a comment mentioning the class can't
 *  poison the match (Lesson 093). */
function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?:^|})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm')
  const m = css.match(re)
  if (!m) throw new Error(`rule not found: ${selector}`)
  return m[1]
}

/** Parse `min-width: Npx` from a rule body, in px. */
function minWidthPx(body: string): number {
  const m = body.match(/min-width:\s*(\d+)px/)
  if (!m) throw new Error('no min-width declaration')
  return Number(m[1])
}

describe('Chip touch-target floor (#886)', () => {
  it('Family B — .districts-toolbar__region-chip declares min-width ≥ 44px', () => {
    const body = ruleBody(appShellCss, '.districts-toolbar__region-chip')
    expect(minWidthPx(body)).toBeGreaterThanOrEqual(44)
  })

  it('Family C — .region-finder__chip declares min-width ≥ 44px', () => {
    const body = ruleBody(appShellCss, '.region-finder__chip')
    expect(minWidthPx(body)).toBeGreaterThanOrEqual(44)
  })
})
