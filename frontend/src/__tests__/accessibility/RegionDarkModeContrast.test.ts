/**
 * Region pages dark-mode contrast audit (#609, epic #574 Track D).
 *
 * RegionsPage (`/regions`) and RegionPage (`/region/:n`) must reach dark-mode
 * parity with District Detail: every text colour and the tier-chip graphics
 * must clear WCAG AA on the dark backgrounds they sit on.
 *
 * Like the Awards audit (#608), this reads the *actual* CSS rather than relying
 * on jest-axe (which can't compute contrast in jsdom — no layout). But the
 * Region pages don't style with semantic component tokens; they wear Tailwind
 * utility classes (`text-gray-500`, `bg-purple-200`, `bg-tm-happy-yellow`, …)
 * that `dark-mode.css` overrides at `[data-theme='dark']` scope (R10). So the
 * resolver here models that cascade: a utility's dark colour is its
 * `[data-theme='dark'] .utility` override if one exists, else the Tailwind
 * default. Translucent tier backgrounds are composited over their surface
 * before the ratio is taken.
 *
 * It is falsifiable. Before the #609 fix these fail:
 *   - the page-header eyebrow (`--maroon-500` #7b1828, no dark remap) → 1.69:1
 *   - the Smedley chip (`bg-purple-200` has no dark remap; only `.bg-purple-100`
 *     does) → light text on light purple, 1.00:1
 *   - the President's chip (`text-gray-900` is globally remapped LIGHT in dark,
 *     leaving light text on the light golden `bg-tm-happy-yellow`) → 1.70:1
 *   - muted body text (`text-gray-500` / `text-gray-400` hardcoded #6B6575,
 *     unlike `text-gray-600` which maps to `--text-muted`) → 3.16:1 on the page
 *     surface, ~2.9:1 on the lighter `bg-gray-800` region cards.
 *
 * Lives in `__tests__/accessibility/` so it routes to the integration project
 * (Lesson 090). Pure computation, so it's fast.
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

/** Tailwind palette defaults for the utilities the Region pages use that may
 *  have NO dark override (framework constants — like trusting the contrast
 *  calculator). A utility absent from dark-mode.css falls back here. */
const TAILWIND: Record<string, string> = {
  'text-purple-900': '#581c87',
  'bg-purple-200': '#e9d5ff',
  'text-white': '#ffffff',
  'bg-gray-800': '#1f2937', // region cards: `bg-white dark:bg-gray-800`
}

/** Parse `--name: value;` declarations from the first rule whose selector
 *  matches `selectorLiteral` exactly. Anchored to a real rule start so a
 *  comment mentioning the selector can't poison the match (Lesson 093). */
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
// Dark tokens live in BOTH redesign.css and dark-mode.css `[data-theme='dark']`
// blocks; dark-mode.css wins for any name it redefines (e.g. --text-muted).
const darkTokens = new Map([
  ...parseTokenBlock(redesignCss, "[data-theme='dark']"),
  ...parseTokenBlock(darkModeCss, "[data-theme='dark']"),
])

/** Resolve a `var(--x)` chain to a literal (hex or rgba) in dark mode. */
function resolveVar(value: string, depth = 0): string {
  if (depth > 8) throw new Error(`var() too deep: ${value}`)
  const v = value.trim()
  const m = v.match(/^var\((--[\w-]+)\)$/)
  if (!m) return v
  const next = darkTokens.get(m[1]) ?? lightTokens.get(m[1])
  if (!next) throw new Error(`token ${m[1]} undefined`)
  return resolveVar(next, depth + 1)
}

/** Value of `prop` from the first `[data-theme='dark'] <selector> { … }` rule,
 *  or null if none. `selector` is matched literally (escaped). */
function darkRuleValue(
  css: string,
  selector: string,
  prop: string
): string | null {
  const re = new RegExp(
    "\\[data-theme='dark'\\]\\s*" +
      selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      // allow the selector to sit in a comma-group (e.g. `.text-green-700,
      // .text-green-800 { … }`): consume the rest of the group up to `{`.
      '(?![\\w-])[^{}]*\\{'
  )
  const m = re.exec(css)
  if (!m) return null
  const open = css.indexOf('{', m.index)
  const close = css.indexOf('}', open)
  const pm = css
    .slice(open + 1, close)
    .match(new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;!]+)'))
  return pm ? pm[1].trim() : null
}

/** Composite an `rgba(r,g,b,a)` over an opaque hex base; pass hex through. */
function compositeOver(value: string, baseHex: string): string {
  const m = value.match(/rgba?\(([^)]+)\)/)
  if (!m) return value
  const [r, g, b, a = 1] = m[1].split(',').map(s => parseFloat(s.trim()))
  const base = baseHex.replace('#', '')
  const [br, bg, bb] = [0, 2, 4].map(i => parseInt(base.slice(i, i + 2), 16))
  const mix = (f: number, k: number) =>
    Math.round(f * Number(a) + k * (1 - Number(a)))
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(mix(r, br))}${h(mix(g, bg))}${h(mix(b, bb))}`
}

/** Dark-mode colour for a Tailwind utility class on a given background: its
 *  `[data-theme='dark']` override (resolved + composited) if present, else the
 *  Tailwind default. */
function utilityDark(
  className: string,
  prop: 'color' | 'background-color',
  bgHex: string
): string {
  const override = darkRuleValue(darkModeCss, `.${className}`, prop)
  if (override) return compositeOver(resolveVar(override), bgHex)
  const def = TAILWIND[className]
  if (!def)
    throw new Error(`no dark override or Tailwind default for .${className}`)
  return def
}

const surface = resolveVar('var(--surface)') // #111922 page surface
const cardBg = TAILWIND['bg-gray-800'] // region grid cards

describe('Region pages dark-mode contrast (#609)', () => {
  it('page-header eyebrow clears AA on the dark surface', () => {
    // Base is `color: var(--maroon-500)` (app-shell.css). The fix is a scoped
    // [data-theme='dark'] .districts-page-header__eyebrow rule; without it the
    // raw maroon (#7b1828) sits at ~1.7:1 on #111922.
    const override = darkRuleValue(
      appShellCss,
      '.districts-page-header__eyebrow',
      'color'
    )
    const fg = resolveVar(override ?? 'var(--maroon-500)')
    const ratio = calculateContrastRatio(fg, surface)
    expect(
      ratio,
      `eyebrow ${fg} on ${surface} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })

  // Tier achievement chips: text class over a (possibly translucent) brand bg.
  // Text colour respects the cascade — a compound `.bg.text` dark rule wins
  // over the plain `.text` override (how the President's chip keeps dark text).
  const TIERS: ReadonlyArray<{ name: string; bg: string; text: string }> = [
    { name: 'Distinguished', bg: 'bg-tm-true-maroon', text: 'text-white' },
    { name: 'Select', bg: 'bg-tm-cool-gray', text: 'text-gray-900' },
    { name: "President's", bg: 'bg-tm-happy-yellow', text: 'text-gray-900' },
    { name: 'Smedley', bg: 'bg-purple-200', text: 'text-purple-900' },
  ]

  it.each(TIERS)('$name tier chip text clears AA in dark', ({ bg, text }) => {
    const bgHex = utilityDark(bg, 'background-color', surface)
    const compound = darkRuleValue(darkModeCss, `.${bg}.${text}`, 'color')
    const fg = compound
      ? compositeOver(resolveVar(compound), bgHex)
      : utilityDark(text, 'color', bgHex)
    const ratio = calculateContrastRatio(fg, bgHex)
    expect(
      ratio,
      `${bg}+${text}: ${fg} on ${bgHex} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })

  // Normal text utilities, each on the dark background it actually renders on.
  // Muted grays (gray-500/gray-400) are the regression target — they're
  // hardcoded #6B6575 (3.16:1 on surface, worse on the lighter cards) instead
  // of mapping to --text-muted the way gray-600 does.
  const TEXT: ReadonlyArray<{ name: string; cls: string; bg: string }> = [
    { name: 'table header (muted)', cls: 'text-gray-500', bg: surface },
    { name: 'em-dash / footnote (muted)', cls: 'text-gray-400', bg: surface },
    {
      name: 'region card label (muted, on card)',
      cls: 'text-gray-500',
      bg: cardBg,
    },
    {
      name: 'region card sublabel (muted, on card)',
      cls: 'text-gray-400',
      bg: cardBg,
    },
    { name: 'tied label', cls: 'text-gray-600', bg: surface },
    { name: 'leaderboard body', cls: 'text-gray-700', bg: surface },
    { name: 'rank cell', cls: 'text-gray-900', bg: surface },
    { name: 'KPI delta (maroon)', cls: 'text-tm-true-maroon', bg: surface },
    { name: 'region links (blue)', cls: 'text-tm-loyal-blue', bg: surface },
    { name: 'countdown ✓ (green)', cls: 'text-green-700', bg: surface },
  ]

  it.each(TEXT)('$name clears AA in dark', ({ cls, bg }) => {
    const fg = utilityDark(cls, 'color', bg)
    const ratio = calculateContrastRatio(fg, bg)
    expect(
      ratio,
      `${cls}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })

  // RegionFinder jump-to-region chips (#685). Token-driven CSS rules (not
  // dark-scoped overrides) — their dark colour is the dark remap of each var.
  // The hover state is the trap: raw `--loyal-500` (#004165, no dark remap)
  // would render ~1.6:1 navy-on-dark; `--link` (#60a5d8 in dark) clears AA.
  /** Value of `prop` from the first plain (non-dark-scoped) `selector { … }`. */
  function ruleValue(css: string, selector: string, prop: string) {
    const re = new RegExp(
      '(?:^|[\\n}])\\s*' +
        selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        '[^{]*\\{'
    )
    const m = re.exec(css)
    if (!m) return null
    const open = css.indexOf('{', m.index)
    const close = css.indexOf('}', open)
    const pm = css
      .slice(open + 1, close)
      .match(new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;!]+)'))
    return pm ? pm[1].trim() : null
  }

  it('finder chip default text clears AA on the dark surface', () => {
    const fg = resolveVar(
      ruleValue(appShellCss, '.region-finder__chip', 'color') ?? ''
    )
    const bg = resolveVar(
      ruleValue(appShellCss, '.region-finder__chip', 'background-color') ?? ''
    )
    const ratio = calculateContrastRatio(fg, bg)
    expect(
      ratio,
      `chip ${fg} on ${bg} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('finder chip HOVER text clears AA on the dark surface', () => {
    const fg = resolveVar(
      ruleValue(appShellCss, '.region-finder__chip:hover', 'color') ?? ''
    )
    const ratio = calculateContrastRatio(fg, surface)
    expect(
      ratio,
      `chip:hover ${fg} on ${surface} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('finder chip ACTIVE text clears AA on its brand background', () => {
    const fg = resolveVar(
      ruleValue(appShellCss, '.region-finder__chip--active', 'color') ?? ''
    )
    const bg = resolveVar(
      ruleValue(
        appShellCss,
        '.region-finder__chip--active',
        'background-color'
      ) ?? ''
    )
    const ratio = calculateContrastRatio(fg, bg)
    expect(
      ratio,
      `active ${fg} on ${bg} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })
})
