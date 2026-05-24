/**
 * ClubDetailPage dark-mode contrast audit (#610, epic #574 Track D).
 *
 * Brings the club page (`/district/:id/club/:clubId`) to dark-mode parity: the
 * anniversary badge variants, the CSP status pip, the per-stat values, and the
 * membership-chart axis labels must all clear WCAG AA on the dark backgrounds
 * they actually render on.
 *
 * Like the Awards (#608) and Region (#609) audits, this reads the *real* CSS
 * (jest-axe can't compute contrast in jsdom — no layout) and resolves each
 * foreground through the `[data-theme='dark']` cascade. Two surfaces matter:
 *
 *   - the page surface `--surface` (#111922) — stat cards / panels / chart, and
 *   - the club-hero gradient base `--loyal-500` (#004165, fixed in BOTH themes
 *     per #618) — the anniversary badge pills sit on the hero, not the surface.
 *
 * It is falsifiable. Before the #610 fix these fail:
 *   - the milestone badge (`bg-yellow-100 text-yellow-900`): the bg has a dark
 *     remap but `.text-yellow-900` has none (only 700/800 do), so the dark
 *     Tailwind brown #713f12 lands on the darkened amber pill — ~1.2:1. The
 *     Lesson 94 asymmetry: bg remapped, text didn't.
 *   - the upcoming badge (`bg-blue-50 text-blue-900`): same shape — dark navy
 *     #1e3a8a on the darkened blue pill.
 *   - the CSP "—" pip and the chart axis labels (`var(--ink-4)` #5d6878): 3.1:1
 *     on `--surface`, below AA for the small informational text they carry.
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

/** Tailwind palette defaults for utilities that may have NO dark override.
 *  A utility absent from dark-mode.css falls back here (framework constants). */
const TAILWIND: Record<string, string> = {
  'text-yellow-900': '#713f12',
  'text-blue-900': '#1e3a8a',
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

/** Value of `prop` from the `[data-theme='dark'] <selector> { … }` rule that
 *  WINS the cascade — i.e. the LAST matching rule that sets `prop`, not the
 *  first. (`.bg-blue-50` is declared twice in dark-mode.css with different
 *  alphas; the browser renders the last, so the audit must too.) Null if none.
 *  `selector` is matched literally (escaped). */
function darkRuleValue(
  css: string,
  selector: string,
  prop: string
): string | null {
  const re = new RegExp(
    "\\[data-theme='dark'\\]\\s*" +
      selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      // allow the selector to sit in a comma-group: consume to `{`.
      '(?![\\w-])[^{}]*\\{',
    'g'
  )
  let winner: string | null = null
  for (const m of css.matchAll(re)) {
    const open = css.indexOf('{', m.index)
    const close = css.indexOf('}', open)
    const pm = css
      .slice(open + 1, close)
      .match(new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;!]+)'))
    if (pm) winner = pm[1].trim()
  }
  return winner
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
const heroBg = resolveVar('var(--loyal-500)') // #004165 hero gradient base

describe('ClubDetailPage dark-mode contrast (#610)', () => {
  // ── Anniversary badge variants (#445), on the fixed loyal-blue hero ────────
  // Each variant is `bg-* text-*` Tailwind utilities. Under the manual
  // [data-theme='dark'] toggle the `dark:` variants are inert (Lesson 73), so
  // the base classes apply and dark-mode.css overrides drive the colours. Text
  // and bg must remap together (Lesson 94).
  const BADGES: ReadonlyArray<{ name: string; bg: string; text: string }> = [
    { name: 'milestone (gold)', bg: 'bg-yellow-100', text: 'text-yellow-900' },
    { name: 'upcoming (countdown)', bg: 'bg-blue-50', text: 'text-blue-900' },
    { name: 'quiet', bg: 'bg-gray-100', text: 'text-gray-600' },
  ]

  it.each(BADGES)('$name badge text clears AA on the hero', ({ bg, text }) => {
    const bgHex = utilityDark(bg, 'background-color', heroBg)
    const fg = utilityDark(text, 'color', bgHex)
    const ratio = calculateContrastRatio(fg, bgHex)
    expect(
      ratio,
      `${bg}+${text}: ${fg} on ${bgHex} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })

  // ── Token-driven foregrounds on the dark page surface ──────────────────────
  // The stat strip, CSP pip, and membership-chart labels colour via CSS vars
  // (R10), so they're resolved straight through the dark token map. --ink-4 is
  // the regression target: the muted CSP "—" pip and the chart axis labels use
  // it, and at #5d6878 it sits at ~3.1:1 on --surface, below AA.
  const TOKENS: ReadonlyArray<{ name: string; token: string }> = [
    { name: 'CSP ✓ pip / stat positive', token: 'var(--green-600)' },
    { name: 'CSP ✗ pip / stat negative', token: 'var(--red-600)' },
    { name: 'CSP "—" pip / muted stat value', token: 'var(--ink-4)' },
    { name: 'membership-chart axis label', token: 'var(--ink-4)' },
    { name: 'chart key-date label / panel meta', token: 'var(--ink-3)' },
    { name: 'panel body / stat value', token: 'var(--ink)' },
  ]

  it.each(TOKENS)('$name clears AA on the dark surface', ({ token }) => {
    const fg = resolveVar(token)
    const ratio = calculateContrastRatio(fg, surface)
    expect(
      ratio,
      `${token} = ${fg} on ${surface} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })

  // --ink-4 is a global token; lightening it for the club page must also clear
  // AA on the LIGHTEST dark surface it lands on app-wide (--surface-3 #1a2330),
  // or other consumers (e.g. the nav "soon" badge) silently stay sub-AA. This
  // locks the bound the bump was sized against (review finding, #610).
  it('muted --ink-4 clears AA on the lightest dark surface', () => {
    const fg = resolveVar('var(--ink-4)')
    const bg = resolveVar('var(--surface-3)')
    const ratio = calculateContrastRatio(fg, bg)
    expect(
      ratio,
      `--ink-4 ${fg} on --surface-3 ${bg} = ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(4.5)
  })
})
