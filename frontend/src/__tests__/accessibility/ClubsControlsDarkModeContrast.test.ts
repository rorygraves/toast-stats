/**
 * Clubs-table controls-row dark-mode contrast audit (#670, epic #665 Sprint 4).
 *
 * The controls row (segmented status filter, quick-filter chips, and the
 * column-filter popover) was authored on redesign tokens back in #361/#470 but
 * was never part of the Track-D dark sweep (#574 covered Awards/Region/Club/
 * Methodology/History/Landing, not the clubs table). Sprint 4 re-skins the
 * active/hover states to the handoff pattern — `--loyal-500` text on `--loyal-50`,
 * hover `--surface-3` — which is exactly the navy-on-navy trap lessons 093/096
 * warn about: `--loyal-500` (#004165) has NO dark remap, so used as foreground
 * on the dark `--loyal-50` pill (#112432) it lands at ~1.5:1.
 *
 * The fix (R10, lesson 093): use the semantic `--link` token for text — it
 * equals `--loyal-500` in light (zero light-mode change) but remaps to a
 * dark-safe `#60a5d8`. The maroon "Clear" chip (`--maroon-500`, also no remap)
 * gets a scoped `[data-theme='dark']` override (lesson 096, value #e8879a).
 *
 * Like the Awards/Region/Club audits this reads the *real* CSS (jest-axe can't
 * compute contrast in jsdom — no layout) and resolves each foreground through
 * the `[data-theme='dark']` cascade. It is falsifiable: before the fix the
 * segmented-active and chip-clear assertions fail (raw `--loyal-500`/`--maroon-500`
 * on dark). Lives in `__tests__/accessibility/` → integration project (lesson 090).
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
const darkModeCss = read('dark-mode.css')
const appShellCss = read('components/app-shell.css')

/** Parse `--name: value;` declarations from the first rule whose selector
 *  matches `selectorLiteral` exactly. Anchored to a real rule start so a
 *  comment mentioning the selector can't poison the match (lesson 093). */
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
const darkTokens = new Map([
  ...parseTokenBlock(redesignCss, "[data-theme='dark']"),
  ...parseTokenBlock(darkModeCss, "[data-theme='dark']"),
])

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

/** Value of `prop` from a flat (non-nested) CSS rule whose selector matches
 *  `selectorLiteral` exactly. Anchored to the rule start so `--active` doesn't
 *  match `--active .descendant`. Throws if the rule or prop is missing — the
 *  audit must fail loudly if the surface it guards was renamed away. */
function ruleProp(css: string, selectorLiteral: string, prop: string): string {
  const re = new RegExp(
    '(?:^|\\n)\\s*' +
      selectorLiteral.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\{'
  )
  const m = re.exec(css)
  if (!m) throw new Error(`rule ${selectorLiteral} not found`)
  const open = css.indexOf('{', m.index)
  const close = css.indexOf('}', open)
  const body = css.slice(open + 1, close)
  const pm = body.match(
    new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;!]+)')
  )
  if (!pm) throw new Error(`prop ${prop} not in rule ${selectorLiteral}`)
  return pm[1].trim()
}

/** Value of `prop` from the cascade-winning `[data-theme='dark'] <selector>`
 *  rule in dark-mode.css (last wins, lesson 095). Null if none. */
function darkOverride(selector: string, prop: string): string | null {
  const re = new RegExp(
    "\\[data-theme='dark'\\]\\s*" +
      selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '(?![\\w-])[^{}]*\\{',
    'g'
  )
  let winner: string | null = null
  for (const m of darkModeCss.matchAll(re)) {
    const open = darkModeCss.indexOf('{', m.index)
    const close = darkModeCss.indexOf('}', open)
    const pm = darkModeCss
      .slice(open + 1, close)
      .match(new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;!]+)'))
    if (pm) winner = pm[1].trim()
  }
  return winner
}

const AA = 4.5

/**
 * Each row: a foreground/background pair drawn from the *real* controls CSS,
 * with the spec-mandated token it must reference. `bg` is either the same rule
 * (active button bg) or the surface the element sits on. We assert (1) the rule
 * uses the dark-safe token (spec alignment — fails today for the raw-token
 * surfaces), and (2) the resolved colour clears AA in dark AND light.
 */
interface Surface {
  name: string
  /** selector + prop yielding the foreground token */
  fg: [string, string]
  /** the foreground token we expect (spec/dark-safety) */
  expectFgToken: string
  /** the background: a token literal (resolved both themes) */
  bgToken: string
  /** dark-mode override selector/prop for the fg, if it's a raw non-remapping
   *  token that needs a scoped `[data-theme='dark']` rule instead of `--link`. */
  darkFg?: [string, string]
}

const SURFACES: Surface[] = [
  {
    // #815: the segmented status control merged into the single preset row;
    // the active health-band chip is now `.clubs-quick-filter-chip--active`
    // (covered below), and its count badge inverts to --link on --surface.
    name: 'health preset active count badge',
    fg: [
      '.clubs-quick-filter-chip--active .clubs-quick-filter-chip__count',
      'color',
    ],
    expectFgToken: 'var(--link)',
    bgToken: 'var(--surface)',
  },
  {
    name: 'quick-filter chip active label',
    fg: ['.clubs-quick-filter-chip--active', 'color'],
    expectFgToken: 'var(--link)',
    bgToken: 'var(--loyal-50)',
  },
  {
    name: 'quick-filter chip hover label',
    fg: ['.clubs-quick-filter-chip:hover', 'color'],
    expectFgToken: 'var(--link)',
    bgToken: 'var(--surface-3)',
  },
  {
    name: 'filter popover operator/sort active',
    fg: ['.clubs-filter-btn--active', 'color'],
    expectFgToken: 'var(--link)',
    bgToken: 'var(--loyal-50)',
  },
]

describe('Clubs controls dark-mode contrast (#670)', () => {
  it.each(SURFACES)(
    '$name uses the dark-safe token and clears AA both themes',
    ({ fg, expectFgToken, bgToken }) => {
      const fgToken = ruleProp(appShellCss, fg[0], fg[1])
      expect(fgToken, `${fg[0]} { ${fg[1]} } should be ${expectFgToken}`).toBe(
        expectFgToken
      )
      for (const theme of ['light', 'dark'] as const) {
        const fgHex = resolveVar(fgToken, theme)
        const bgHex = resolveVar(bgToken, theme)
        const ratio = calculateContrastRatio(fgHex, bgHex)
        expect(
          ratio,
          `${fg[0]} ${fgHex} on ${bgToken} ${bgHex} (${theme}) = ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(AA)
      }
    }
  )

  // The maroon "Clear" chip keeps `--maroon-500` in light (brand danger colour)
  // but that token has no dark remap (#7b1828 → ~2:1 on the dark surface), so it
  // needs a scoped `[data-theme='dark']` override (lesson 096, #e8879a). It sits
  // on the chip's base `--surface` background.
  it('quick-filter Clear chip clears AA in both themes (light token + dark override)', () => {
    const lightFg = resolveVar(
      ruleProp(appShellCss, '.clubs-quick-filter-chip__clear', 'color'),
      'light'
    )
    const lightBg = resolveVar(
      ruleProp(appShellCss, '.clubs-quick-filter-chip', 'background-color'),
      'light'
    )
    expect(
      calculateContrastRatio(lightFg, lightBg),
      `clear chip light ${lightFg} on ${lightBg}`
    ).toBeGreaterThanOrEqual(AA)

    const darkFgRaw = darkOverride('.clubs-quick-filter-chip__clear', 'color')
    expect(
      darkFgRaw,
      'clear chip needs a [data-theme="dark"] color override (maroon-500 has no remap)'
    ).not.toBeNull()
    const darkFg = resolveVar(darkFgRaw as string, 'dark')
    const darkBg = resolveVar('var(--surface)', 'dark')
    expect(
      calculateContrastRatio(darkFg, darkBg),
      `clear chip dark ${darkFg} on ${darkBg}`
    ).toBeGreaterThanOrEqual(AA)
  })

  // The solid "Apply" button (primary action) is white on the brand navy
  // --loyal-500, which is fixed in both themes — assert it stays AA.
  it('filter Apply button (white on --loyal-500) clears AA', () => {
    const bg = resolveVar('var(--loyal-500)', 'dark')
    expect(calculateContrastRatio('#ffffff', bg)).toBeGreaterThanOrEqual(AA)
  })

  // Validation error band text on --surface-2, both themes (review #670):
  // --red-600 was 4.42:1 in dark; --red-500 remaps lighter and clears AA.
  it('filter error band text clears AA on --surface-2 both themes', () => {
    const fgToken = ruleProp(appShellCss, '.clubs-filter-error', 'color')
    for (const theme of ['light', 'dark'] as const) {
      const fg = resolveVar(fgToken, theme)
      const bg = resolveVar('var(--surface-2)', theme)
      const ratio = calculateContrastRatio(fg, bg)
      expect(
        ratio,
        `error ${fg} on --surface-2 ${bg} (${theme}) = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(AA)
    }
  })
})
