/**
 * Generates the static Open Graph share image (#778).
 *
 * Renders a branded 1200x630 card with Playwright/Chromium and writes it to
 * `frontend/public/og-image.png`. The image is a STATIC asset (no user input,
 * F-SEC4) — this script exists only so the asset is reproducible and the brand
 * is reviewable in source. Re-run after a brand-token change:
 *
 *   node frontend/scripts/generate-og-image.mjs
 *
 * Colours mirror frontend/src/styles/tokens/rt-brand-v1.css (Red Taverns v1.0):
 *   --rt-paper #F4F1EB, --rt-ink #0F0E0D, --rt-ink-2 #3D3B38,
 *   --rt-stats #D4873F (product accent), --rt-red #E63946.
 */
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/og-image.png')

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: #F4F1EB;
    font-family: 'Inter', system-ui, sans-serif;
    color: #0F0E0D;
    display: flex;
    position: relative;
    overflow: hidden;
  }
  .accent { position: absolute; left: 0; top: 0; bottom: 0; width: 18px; background: #D4873F; }
  .content { padding: 96px 88px; display: flex; flex-direction: column; height: 100%; justify-content: center; }
  .kicker { font-size: 26px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #D4873F; margin-bottom: 28px; }
  .title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 116px; line-height: 0.98; letter-spacing: -0.02em; }
  .subtitle { font-family: 'Space Grotesk', sans-serif; font-weight: 500; font-size: 46px; color: #3D3B38; margin-top: 18px; }
  .facets { font-size: 28px; color: #3D3B38; margin-top: 40px; font-weight: 400; }
  .footer { position: absolute; left: 88px; bottom: 64px; display: flex; align-items: center; gap: 14px; font-size: 26px; color: #3D3B38; }
  .dot { width: 16px; height: 16px; border-radius: 50%; background: #E63946; }
  .host { position: absolute; right: 88px; bottom: 64px; font-family: 'Space Grotesk', sans-serif; font-weight: 500; font-size: 26px; color: #0F0E0D; }
</style></head>
<body>
  <div class="accent"></div>
  <div class="content">
    <div class="kicker">Toastmasters District Statistics</div>
    <div class="title">Toast Stats</div>
    <div class="subtitle">District performance, visualized</div>
    <div class="facets">Club health · DCP goals · Membership trends · Distinguished status</div>
  </div>
  <div class="footer"><span class="dot"></span>A Red Taverns project</div>
  <div class="host">ts.taverns.red</div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
})
await page.setContent(html, { waitUntil: 'networkidle' })
// String form (not a lexical `document` reference) so this node script lints
// clean — the expression is evaluated in the browser page context.
await page.waitForFunction("document.fonts.status === 'loaded'")
await page.screenshot({ path: OUT, type: 'png' })
await browser.close()
console.error(`Wrote ${OUT}`)
