/**
 * District subnav dark-mode contrast audit (#678, epic #674 Sprint 4).
 *
 * The lateral section nav (`DistrictSubnav`) sits on the `.app-shell__main`
 * surface (`--surface`) with a transparent background, so its active-link text,
 * active bottom-border, and focus outline are read directly against `--surface`
 * in both themes. The navy accent `--loyal-500` (#004165) has NO dark remap
 * (lessons 093/096) — used as a foreground on the dark `--surface` (#111922) it
 * lands at ~1.6:1, failing AA. The dark-safe token is `--link` (== `--loyal-500`
 * in light, remaps to #60a5d8 in dark; R10, lesson 093).
 *
 * Like the sibling Awards/Region/Clubs audits this reads the *real* CSS (jest-axe
 * can't compute contrast in jsdom — no layout) and resolves each token through
 * the `[data-theme='dark']` cascade. Falsifiable: before the fix the active and
 * focus assertions fail (raw `--loyal-500` on dark `--surface`). Lives in
 * `__tests__/accessibility/` → integration project (lesson 090).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { calculateContrastRatio } from '../../utils/contrastCalculator'

const here = dirname(fileURLToPath(import.meta.url))
const stylesDir = resolve(here, '../../styles')

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const read = (p: string) =>
  stripComments(readFileSync(resolve(stylesDir, p), 'utf8'))

const redesignCss = read('tokens/redesign.css')
const subnavCss = read('components/district-subnav.css')

/** Parse `--name: value;` declarations from the first rule whose selector
 *  matches `selectorLiteral` exactly (anchored to a real rule start). */
function parseTokenBlock(css: string, selectorLiteral: string) {
  const re = new RegExp(
    '(?:^|\\n)\\s*' +
      selectorLiteral.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\{'
  )
  const m = re.exec(css)
  if (!m) return new Map<string, string>()
  const open = css.indexOf('{', m.index)
  const close = css.indexOf('}', open)
  const map = new Map<string, string>()
  for (const d of css
    .slice(open + 1, close)
    .matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))
    map.set(d[1].trim(), d[2].trim())
  return map
}

const lightTokens = parseTokenBlock(redesignCss, ':root')
const darkTokens = parseTokenBlock(redesignCss, "[data-theme='dark']")

/** Resolve a `var(--x)` chain to a literal hex, in the requested theme. */
function resolveVar(value: string, theme: 'light' | 'dark', depth = 0): string {
  if (depth > 8) throw new Error(`var() too deep: ${value}`)
  const v = value.trim()
  const m = v.match(/^var\((--[\w-]+)\)$/)
  if (!m) return v
  const map = theme === 'dark' ? darkTokens : lightTokens
  const next =
    theme === 'dark' ? (map.get(m[1]) ?? lightTokens.get(m[1])) : map.get(m[1])
  if (!next) throw new Error(`token ${m[1]} undefined in ${theme}`)
  return resolveVar(next, theme, depth + 1)
}

/** The raw `var(--x)` token a prop references in a flat subnav rule. */
function ruleProp(selectorLiteral: string, prop: string): string {
  const re = new RegExp(
    '(?:^|\\n)\\s*' +
      selectorLiteral.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\{'
  )
  const m = re.exec(subnavCss)
  if (!m) throw new Error(`rule ${selectorLiteral} not found`)
  const open = subnavCss.indexOf('{', m.index)
  const close = subnavCss.indexOf('}', open)
  const pm = subnavCss
    .slice(open + 1, close)
    .match(new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;!]+)'))
  if (!pm) throw new Error(`prop ${prop} not in rule ${selectorLiteral}`)
  return pm[1].trim()
}

const AA_TEXT = 4.5
const AA_NONTEXT = 3.0 // WCAG 1.4.11 (focus indicator / UI component)

describe('DistrictSubnav dark-mode contrast (#678)', () => {
  const surface = {
    light: resolveVar('var(--surface)', 'light'),
    dark: resolveVar('var(--surface)', 'dark'),
  }

  it('active-link text clears AA against --surface in light AND dark', () => {
    const token = ruleProp(
      ".district-subnav__link[aria-current='page']",
      'color'
    )
    for (const theme of ['light', 'dark'] as const) {
      const fg = resolveVar(token, theme)
      const ratio = calculateContrastRatio(fg, surface[theme])
      expect(
        ratio,
        `${theme}: ${token}→${fg} on ${surface[theme]}`
      ).toBeGreaterThanOrEqual(AA_TEXT)
    }
  })

  it('active bottom-border clears the 3:1 non-text threshold in light AND dark', () => {
    const token = ruleProp(
      ".district-subnav__link[aria-current='page']",
      'border-bottom-color'
    )
    for (const theme of ['light', 'dark'] as const) {
      const fg = resolveVar(token, theme)
      const ratio = calculateContrastRatio(fg, surface[theme])
      expect(ratio, `${theme}: ${token}→${fg}`).toBeGreaterThanOrEqual(
        AA_NONTEXT
      )
    }
  })

  it('focus outline clears the 3:1 non-text threshold in light AND dark', () => {
    const token = ruleProp('.district-subnav__link:focus-visible', 'outline')
    const colorToken = token.match(/var\(--[\w-]+\)/)?.[0] ?? token
    for (const theme of ['light', 'dark'] as const) {
      const fg = resolveVar(colorToken, theme)
      const ratio = calculateContrastRatio(fg, surface[theme])
      expect(ratio, `${theme}: ${colorToken}→${fg}`).toBeGreaterThanOrEqual(
        AA_NONTEXT
      )
    }
  })
})
