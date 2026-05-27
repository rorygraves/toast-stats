#!/usr/bin/env node
/**
 * capture-site.mjs — render the Toast Stats site across breakpoints and
 * extract share/SEO-relevant DOM for visual + metadata QA.
 *
 * Because the frontend is a client-rendered SPA, a plain fetch only sees the
 * empty shell. This drives a headless browser so you get the *rendered* page:
 * screenshots at desktop/tablet/mobile plus a JSON dump of <title>, meta
 * description, Open Graph / Twitter tags, headings, nav, and footer. Seeded
 * the 2026-05 showcase audit (docs/audits/) and the SEO issues #778–#783.
 *
 * Usage:
 *   node scripts/capture-site.mjs [baseUrl]
 *
 *   baseUrl   Site root to capture. Default: https://ts.taverns.red
 *             Use http://localhost:3000 to audit a local dev build.
 *
 * Env:
 *   SITE_OUT  Output dir for screenshots. Default: .routine-tmp/site-audit/shots
 *             (the .routine-tmp scratch convention is gitignored).
 *
 * Output:
 *   - PNG screenshots written to SITE_OUT
 *   - extracted DOM/metadata JSON printed to stdout
 *
 * Requires the `playwright` devDependency (already in the workspace).
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = process.argv[2] || 'https://ts.taverns.red'
const OUT = resolve(
  process.env.SITE_OUT || '.routine-tmp/site-audit/shots'
)
mkdirSync(OUT, { recursive: true })

const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
]

// Stable public routes worth capturing. Add per-entity routes by following
// links from the home capture below.
const routes = [
  { name: 'home', path: '/' },
  { name: 'methodology', path: '/methodology' },
  { name: 'history', path: '/history' },
]

async function gotoSettled(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  } catch {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  }
  await page.waitForTimeout(2500)
}

async function extract(page) {
  return await page.evaluate(() => {
    const txt = (sel) =>
      Array.from(document.querySelectorAll(sel))
        .map((n) => n.textContent.trim())
        .filter(Boolean)
    const meta = (q) => document.querySelector(q)?.content || null
    return {
      title: document.title,
      metaDesc: meta('meta[name="description"]'),
      canonical:
        document.querySelector('link[rel="canonical"]')?.href || null,
      ogTitle: meta('meta[property="og:title"]'),
      ogDesc: meta('meta[property="og:description"]'),
      ogImage: meta('meta[property="og:image"]'),
      twitterCard: meta('meta[name="twitter:card"]'),
      h1: txt('h1'),
      h2: txt('h2'),
      navLinks: Array.from(document.querySelectorAll('nav a, header a')).map(
        (a) => ({ text: a.textContent.trim(), href: a.getAttribute('href') })
      ),
      footer: document.querySelector('footer')?.innerText || null,
      firstDistrictHref:
        document
          .querySelector('a[href*="/district/"]')
          ?.getAttribute('href') || null,
    }
  })
}

const browser = await chromium.launch()
const results = {}

for (const route of routes) {
  results[route.name] = {}
  for (const vp of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    })
    const page = await ctx.newPage()
    await gotoSettled(page, BASE + route.path)
    if (vp.name === 'desktop') results[route.name].data = await extract(page)
    await page.screenshot({
      path: `${OUT}/${route.name}-${vp.name}.png`,
      fullPage: vp.name === 'desktop',
    })
    await ctx.close()
  }
}

// Follow the first district (and a club within it) for entity-page coverage.
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
await gotoSettled(page, BASE + '/')
const districtHref = results.home.data?.firstDistrictHref
if (districtHref) {
  await gotoSettled(page, BASE + districtHref)
  results.district = { path: districtHref, data: await extract(page) }
  await page.screenshot({ path: `${OUT}/district-desktop.png`, fullPage: true })
  const clubHref = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('a'))
        .map((a) => a.getAttribute('href'))
        .find((h) => h && /\/club\//i.test(h)) || null
  )
  if (clubHref) {
    await gotoSettled(page, BASE + clubHref)
    results.club = { path: clubHref, data: await extract(page) }
    await page.screenshot({ path: `${OUT}/club-desktop.png`, fullPage: true })
  }
}

await browser.close()
console.log(JSON.stringify(results, null, 2))
