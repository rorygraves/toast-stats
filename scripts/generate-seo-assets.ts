/**
 * Regenerate frontend/public/robots.txt + sitemap.xml from the manifest in
 * scripts/lib/seoAssets.ts (#782, epic #785, finding F-SA2).
 *
 * IO entry point for the pure builders. Vite copies `frontend/public/`
 * verbatim into the deploy, so these committed files serve directly at
 * `/robots.txt` and `/sitemap.xml`.
 *
 * Usage:
 *   npx tsx scripts/generate-seo-assets.ts          # write both files
 *   npx tsx scripts/generate-seo-assets.ts --check   # exit 1 if stale
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildRobotsTxt, buildSitemapXml } from './lib/seoAssets'

const PUBLIC_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'frontend',
  'public'
)

const TARGETS = [
  { file: 'robots.txt', content: buildRobotsTxt() },
  { file: 'sitemap.xml', content: buildSitemapXml() },
]

function readOrEmpty(path: string): string {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return ''
  }
}

function main(): void {
  const check = process.argv.includes('--check')
  let stale = false

  for (const { file, content } of TARGETS) {
    const path = join(PUBLIC_DIR, file)
    if (check) {
      if (readOrEmpty(path) !== content) {
        console.error(
          `frontend/public/${file} is stale. Run: npm run seo:generate`
        )
        stale = true
      }
    } else {
      writeFileSync(path, content)
      console.error(`Wrote frontend/public/${file}`)
    }
  }

  if (check && stale) process.exit(1)
}

main()
