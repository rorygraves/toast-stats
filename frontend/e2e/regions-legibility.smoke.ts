import { test, expect, type Page } from '@playwright/test'

/* Regions card-grid legibility guard (#710, retargeted #881).
 *
 * Regression guard for Amy's bug: /regions content went near-invisible when
 * the OS preferred dark but the app showed light mode, because Tailwind
 * `dark:` utilities fire on @media(prefers-color-scheme) not the app's
 * [data-theme] toggle. #685 verified Chromium-at-rest only and missed it —
 * this smoke runs in BOTH engines (see playwright.config) and across all four
 * theme/OS quadrants, at rest AND on hover.
 *
 * #881 deleted the duplicate leaderboard table (CC-9); the region cards are
 * now the sole surface, so this guard samples the card text. Asserts every
 * sampled card cell clears WCAG AA (4.5:1) against the background actually
 * rendered behind it. */

// sRGB relative luminance + WCAG contrast ratio.
function luminance(r: number, g: number, b: number): number {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function parseRgb(c: string): [number, number, number] {
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (!m) throw new Error(`unparseable color: ${c}`)
  const [r, g, b] = m[1].split(',').map(s => parseFloat(s.trim()))
  return [r, g, b]
}
function contrast(fg: string, bg: string): number {
  const l1 = luminance(...parseRgb(fg))
  const l2 = luminance(...parseRgb(bg))
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

const AA = 4.5 // normal text

const QUADRANTS = [
  { store: 'light', os: 'light' as const },
  { store: 'light', os: 'dark' as const }, // the #710 bug quadrant
  { store: 'dark', os: 'light' as const },
  { store: 'dark', os: 'dark' as const },
]

async function sampleRowContrasts(page: Page, hover: boolean) {
  const cards = page.locator('a[href^="/region/"]')
  await cards.first().waitFor({ state: 'visible', timeout: 20_000 })
  const n = await cards.count()
  const results: { label: string; ratio: number }[] = []
  for (let i = 0; i < n; i++) {
    if (hover) await cards.nth(i).hover()
    // eyebrow region label, the leader heading, a numeric metric value
    const card = cards.nth(i)
    const eyebrow = card.locator('header p').first()
    const leader = card.locator('header h3').first()
    const num = card.locator('li span.tabular-nums').first()
    for (const [label, loc] of [
      ['eyebrow', eyebrow],
      ['leader', leader],
      ['num', num],
    ] as const) {
      const { color, bg } = await loc.evaluate(el => {
        const fg = getComputedStyle(el).color
        // Resolve the first FULLY OPAQUE ancestor background. Translucent
        // overlays (e.g. the chip's loyal-blue/10, reported as oklab(.../0.1))
        // are skipped and we measure against the opaque surface beneath. This
        // is an approximation: a translucent overlay slightly shifts the true
        // contrast. It's adequate here because the only overlay is a ~10% tint
        // and the bug under guard is a ~30x light/dark text flip, not a
        // marginal few-tenths case.
        const isOpaqueRgb = (b: string) =>
          /^rgba?\([^)]*\)$/.test(b) &&
          !/,\s*0?\.\d+\s*\)$/.test(b) && // not rgba(...,0.x)
          b !== 'rgba(0, 0, 0, 0)' &&
          b !== 'transparent'
        let node: HTMLElement | null = el as HTMLElement
        let resolved = 'rgb(255, 255, 255)'
        while (node) {
          const b = getComputedStyle(node).backgroundColor
          if (isOpaqueRgb(b)) {
            resolved = b
            break
          }
          node = node.parentElement
        }
        return { color: fg, bg: resolved }
      })
      results.push({ label: `card${i}.${label}`, ratio: contrast(color, bg) })
    }
  }
  return results
}

for (const q of QUADRANTS) {
  const label = `app-${q.store}_OS-${q.os}`
  test(`regions card grid is AA-legible (${label})`, async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: q.os })
    const page = await ctx.newPage()
    await page.addInitScript(store => {
      window.localStorage.setItem('theme', store as string)
    }, q.store)
    await page.goto('/regions', { waitUntil: 'networkidle' })

    for (const hover of [false, true]) {
      const samples = await sampleRowContrasts(page, hover)
      const failing = samples.filter(s => s.ratio < AA)
      expect(
        failing,
        `${label} ${hover ? 'hover' : 'rest'}: sub-AA cells ` +
          failing.map(f => `${f.label}=${f.ratio.toFixed(2)}`).join(', ')
      ).toEqual([])
    }
    await ctx.close()
  })
}
