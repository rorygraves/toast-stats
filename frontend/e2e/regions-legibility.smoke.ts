import { test, expect, type Page } from '@playwright/test'

/* Regions leaderboard legibility guard (#710, retargeted #881, #964).
 *
 * Regression guard for Amy's bug: /regions content went near-invisible when
 * the OS preferred dark but the app showed light mode, because Tailwind
 * `dark:` utilities fire on @media(prefers-color-scheme) not the app's
 * [data-theme] toggle. #685 verified Chromium-at-rest only and missed it —
 * this smoke runs in BOTH engines (see playwright.config) and across all four
 * theme/OS quadrants, at rest AND on hover.
 *
 * #964 restored the leaderboard table as the PRIMARY surface and removed the
 * card grid (reversing CC-9 / #881), so this guard samples the table-row text:
 * the region chip, the leader label, and a numeric metric cell. Asserts every
 * sampled cell clears WCAG AA (4.5:1) against the background actually rendered
 * behind it. */

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
  const rows = page.locator('table[aria-label="Region rankings"] tbody tr')
  await rows.first().waitFor({ state: 'visible', timeout: 20_000 })
  const n = await rows.count()
  const results: { label: string; ratio: number }[] = []
  for (let i = 0; i < n; i++) {
    const row = rows.nth(i)
    if (hover) await row.hover()
    // region chip (translucent tint), the leader label, a numeric metric value
    const chip = row.locator('td:first-child span.font-mono').first()
    const leader = row.locator('td:first-child span').last()
    const num = row.locator('td.tabular-nums').first()
    for (const [label, loc] of [
      ['chip', chip],
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
      results.push({ label: `row${i}.${label}`, ratio: contrast(color, bg) })
    }
  }
  return results
}

for (const q of QUADRANTS) {
  const label = `app-${q.store}_OS-${q.os}`
  test(`regions leaderboard is AA-legible (${label})`, async ({ browser }) => {
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
