import { test, expect, type Page } from '@playwright/test'
import {
  INTERACTIVE_SELECTORS,
  MIN_TOUCH_TARGET_PX,
} from '../src/utils/touchTargetUtils'

/* Dual-engine 44×44px touch-target tripwire (#887, epic #888 "Epic G" Sprint 3).
 *
 * Locks in the Sprint-2 fix (#886): every interactive element on every routed
 * page must keep the WCAG 2.5.5 / handoff 44px floor in BOTH Chromium and
 * WebKit. The audit (#885) found 45 sub-44 instances in three component
 * families — A (chip-select overlays, 30–34px tall), B (landing region chips,
 * 36px wide), C (/regions finder chips, 40–41px wide). #886 lifted all three;
 * this guard fails loudly if any regresses, or if a NEW sub-44 control ships.
 *
 * Why this shape (lessons 108 / 111 / 134 / 138):
 *  - BOTH engines. A native <select> ignores `min-height` in WebKit unless it
 *    opts out with `appearance:none` (L111); an `inset-0` overlay is 2px short
 *    of a bordered label's box (L138). Chromium-only is blind to both. The two
 *    playwright.config projects (`smoke`=Chromium, `webkit`=Safari) run this
 *    file in each; a WebKit-only regression reds `webkit` while `smoke` stays
 *    green — exactly the #710 class.
 *  - Real geometry, not `toBeVisible` or a className (L108/134/138). A jsdom
 *    class-contract test asserts `min-h-[44px]` is *present*; only a live
 *    `boundingBox()` proves the rendered pixels. We measure the box.
 *  - The selector set is imported from the PRODUCT's own `INTERACTIVE_SELECTORS`
 *    (touchTargetUtils.ts) so the guard cannot drift from what the app, the
 *    audit, and `useTouchTarget` consider interactive (R20 spirit).
 *
 * Exemptions (faithful to the #885 audit method):
 *  - Inline prose links (`<a>` with computed `display:inline`, no `role=button`)
 *    are WCAG 2.5.5-exempt — they live in flowing text, not as tap chrome.
 *  - sr-only collapsed controls (≤1px box — e.g. `.tm-skip-link` is 1×1
 *    off-screen at rest) are not real tap targets until focused; skipped. Real
 *    defects are 30–42px (well above 1px), so this can't mask one.
 */

const FLOOR = MIN_TOUCH_TARGET_PX // px, WCAG 2.5.5 / mobile handoff floor
const VIEWPORT = { width: 375, height: 812 } // iPhone-class portrait

// One concrete instance of every route shape in App.tsx (the #885 audit set).
// District 61 / club 01479548 / division A / region 1 are representative; the
// three defect families are component-level, so params don't change them.
//
// `mustRender` is a CONTENT sentinel (not chrome): a selector for a control the
// page is REQUIRED to mount before we measure. It does double duty — (1) it is
// the content-ready wait (so we don't measure a half-rendered page, cf.
// regions-legibility.smoke), and (2) it closes the vacuous-green hole: nav/theme
// chrome renders even when a route's real content fails to load, so a bare
// `found.length > 0` would pass having measured nothing relevant. Pinning the
// family-bearing control means "the toolbar/finder #886 fixed didn't render" is
// a loud red, not a silent pass. Routes the #885 audit found clean (no family
// control) carry no sentinel — they still get the ≥1 non-vacuity floor.
const CHIP_SELECT = '[data-testid$="-chip-select"]' // family A (shared toolbar)
const ROUTES: { path: string; mustRender?: string }[] = [
  { path: '/', mustRender: CHIP_SELECT }, // families A + B
  { path: '/district/61', mustRender: CHIP_SELECT },
  { path: '/district/61/clubs', mustRender: CHIP_SELECT },
  { path: '/district/61/changes', mustRender: CHIP_SELECT },
  { path: '/district/61/divisions', mustRender: CHIP_SELECT },
  { path: '/district/61/rankings', mustRender: CHIP_SELECT },
  { path: '/district/61/trends', mustRender: CHIP_SELECT },
  { path: '/district/61/analytics', mustRender: CHIP_SELECT },
  { path: '/district/61/division/A' },
  { path: '/district/61/club/01479548' },
  { path: '/club/01479548' },
  { path: '/history' },
  { path: '/methodology' },
  { path: '/awards' },
  { path: '/regions', mustRender: '.region-finder__chip' }, // family C
  { path: '/region/1' },
]

interface Finding {
  tag: string
  testid: string | null
  aria: string | null
  cls: string
  w: number
  h: number
}

async function measureInteractiveTargets(
  page: Page,
  selectors: readonly string[]
): Promise<Finding[]> {
  return page.evaluate(sels => {
    const els = Array.from(document.querySelectorAll(sels.join(', ')))
    const out: Finding[] = []
    for (const el of els as HTMLElement[]) {
      const cs = getComputedStyle(el)
      // Mirror the product's own visibility filter (getAllInteractiveElements).
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      const rect = el.getBoundingClientRect()
      // sr-only collapsed / zero-box: not a real tap target (see header).
      if (rect.width <= 1 || rect.height <= 1) continue
      const tag = el.tagName.toLowerCase()
      // WCAG 2.5.5 inline-prose-link exemption.
      const inlineProseLink =
        tag === 'a' &&
        cs.display === 'inline' &&
        el.getAttribute('role') !== 'button'
      if (inlineProseLink) continue
      out.push({
        tag,
        testid: el.getAttribute('data-testid'),
        aria: el.getAttribute('aria-label'),
        cls: (el.getAttribute('class') || '').slice(0, 90),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      })
    }
    return out
  }, selectors)
}

function describe(f: Finding): string {
  const id = f.testid
    ? `[data-testid="${f.testid}"]`
    : f.aria
      ? `[aria-label="${f.aria}"]`
      : f.cls
        ? `.${f.cls.split(/\s+/).slice(0, 2).join('.')}`
        : ''
  return `${f.tag}${id} ${f.w}×${f.h}`
}

for (const { path, mustRender } of ROUTES) {
  test(`every interactive element clears ${FLOOR}px at 375px — ${path}`, async ({
    page,
  }) => {
    // The global config timeout (30s) governs the whole test; raise it so the
    // 60s goto budget is actually reachable on a cold preview hitting the CDN.
    test.setTimeout(90_000)
    await page.setViewportSize(VIEWPORT)
    await page.goto(path, { waitUntil: 'networkidle', timeout: 60_000 })

    // Wait for the page's REQUIRED content control to mount before measuring —
    // this is both the content-ready gate and the anti-vacuous-green guard.
    if (mustRender) {
      await page
        .locator(mustRender)
        .first()
        .waitFor({ state: 'visible', timeout: 30_000 })
    }
    // Display-font reflow settles before we measure text-driven controls (L134).
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)

    const found = await measureInteractiveTargets(page, INTERACTIVE_SELECTORS)

    // Non-vacuity: a blank/broken page (zero interactive elements) must not pass
    // green. Every routed page has at least a nav/theme/menu control.
    expect(
      found.length,
      `${path}: found 0 measurable interactive elements — page did not render`
    ).toBeGreaterThan(0)

    const failing = found.filter(f => f.w < FLOOR || f.h < FLOOR)
    expect(
      failing,
      `${path}: ${failing.length} sub-${FLOOR}px target(s): ` +
        failing.map(describe).join('; ')
    ).toEqual([])
  })
}
