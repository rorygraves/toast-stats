/**
 * Theme-toggle icon contrast audit (#700).
 *
 * The dark-mode toggle in the top bar (`.app-shell-theme-toggle`, rendered by
 * ThemeToggle.tsx) was invisible in LIGHT mode because it hardcoded a near-white
 * icon colour (`rgba(255,255,255,0.8)`) inline. On the light header surface
 * (`.app-shell-top-bar` background = `--surface` = #ffffff) that icon reached
 * only ~1.07:1 — effectively blank. The fix drives the colour from the
 * theme-aware `--ink-3` token (the same token the visible "?" help icon uses).
 *
 * Like the other Track-D audits (AwardsDarkModeContrast etc.), this reads the
 * *actual* CSS source and resolves the token through both the `:root` (light)
 * and `[data-theme='dark']` maps, then checks the ratio against the surface the
 * icon sits on. It is falsifiable: revert to a near-white colour and the light
 * case drops below the bar. An icon is a non-text graphic (WCAG 1.4.11 → 3:1),
 * but `--ink-3` clears the stricter 4.5:1 text bar in both modes, so we assert
 * that for headroom.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { calculateContrastRatio } from '../../utils/contrastCalculator'

const here = dirname(fileURLToPath(import.meta.url))
const stylesDir = resolve(here, '../../styles')

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const tokensCss = stripComments(
  readFileSync(resolve(stylesDir, 'tokens/redesign.css'), 'utf8')
)
const appShellCss = stripComments(
  readFileSync(resolve(stylesDir, 'components/app-shell.css'), 'utf8')
)
// The raw (uncommented) CSS — for asserting a rule *exists* (focus ring).
const appShellCssRaw = readFileSync(
  resolve(stylesDir, 'components/app-shell.css'),
  'utf8'
)

/** Declarations from the first block whose selector matches exactly. */
function parseTokenBlock(
  css: string,
  selectorLiteral: string
): Map<string, string> {
  const re = new RegExp(
    '(?:^|\\n)\\s*' +
      selectorLiteral.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\{'
  )
  const m = re.exec(css)
  if (!m) throw new Error(`block ${selectorLiteral} not found`)
  const open = css.indexOf('{', m.index)
  const close = css.indexOf('}', open)
  const body = css.slice(open + 1, close)
  const map = new Map<string, string>()
  for (const d of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    map.set(d[1].trim(), d[2].trim())
  }
  return map
}

const lightTokens = parseTokenBlock(tokensCss, ':root')
const darkTokens = parseTokenBlock(tokensCss, "[data-theme='dark']")

/** Resolve a token / var() chain to a hex string in the requested theme. */
function resolve_(value: string, dark: boolean, depth = 0): string {
  if (depth > 8) throw new Error(`var() resolution too deep: ${value}`)
  const v = value.trim()
  const varMatch = v.match(/^var\((--[\w-]+)\)$/)
  if (varMatch) {
    const name = varMatch[1]
    const next = dark
      ? (darkTokens.get(name) ?? lightTokens.get(name))
      : lightTokens.get(name)
    if (!next) throw new Error(`token ${name} undefined`)
    return resolve_(next, dark, depth + 1)
  }
  return v
}

/** Value of `prop` from the LAST *base* rule that names `selector` exactly and
 *  declares it (cascade last-wins — lesson 095). The negative lookahead
 *  excludes `:` as well as `\w-` so a pseudo-class rule
 *  (`.x:hover { color: var(--ink) }`) can't shadow the resting-state colour
 *  we're auditing — that shadowing made an earlier version of this audit
 *  pass even when the base colour was reverted to white. */
function declFor(css: string, selector: string, prop: string): string {
  const re = new RegExp(
    selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-:])',
    'g'
  )
  let m: RegExpExecArray | null
  let found: string | null = null
  while ((m = re.exec(css)) !== null) {
    const open = css.indexOf('{', m.index)
    if (open === -1) continue
    const close = css.indexOf('}', open)
    const body = css.slice(open + 1, close)
    const propMatch = body.match(
      new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;]+);')
    )
    if (propMatch) found = propMatch[1].trim()
  }
  if (found === null) throw new Error(`no ${prop} for ${selector}`)
  return found
}

describe('Theme-toggle icon contrast (#700)', () => {
  it.each([
    { mode: 'light', dark: false },
    { mode: 'dark', dark: true },
  ])('icon colour clears WCAG AA on the $mode header surface', ({ dark }) => {
    const fg = resolve_(
      declFor(appShellCss, '.app-shell-theme-toggle', 'color'),
      dark
    )
    const surface = resolve_('var(--surface)', dark)
    const ratio = calculateContrastRatio(fg, surface)
    expect(
      ratio,
      `icon ${fg} on ${surface} = ${ratio.toFixed(2)}:1 (need 4.5:1)`
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('is not the near-white literal that caused the bug', () => {
    const lightFg = resolve_(
      declFor(appShellCss, '.app-shell-theme-toggle', 'color'),
      false
    ).toLowerCase()
    expect(['#fff', '#ffffff', '#fefefe']).not.toContain(lightFg)
  })

  it('declares a visible focus-visible ring (WCAG 2.4.7)', () => {
    expect(appShellCssRaw).toMatch(
      /\.app-shell-theme-toggle:focus-visible\s*\{[^}]*outline[^}]*\}/
    )
  })
})
