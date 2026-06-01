import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(here, '..', '..')
const srcRoot = join(pkgRoot, 'src')

/**
 * ADR-008 hard rule: the MCP server is a THIN reader. It must never import
 * analytics-core (that would re-introduce a compute path that can diverge from
 * the pre-computed CDN bytes — the #800-class bug). These guards fail loudly
 * the moment someone wires in the forbidden dependency, in package.json OR in
 * any source import.
 */
describe('no analytics-core dependency (ADR-008 thin-reader rule)', () => {
  it('does not declare @toastmasters/analytics-core in package.json', () => {
    const pkg = JSON.parse(
      readFileSync(join(pkgRoot, 'package.json'), 'utf8')
    ) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const all = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    }
    expect(Object.keys(all)).not.toContain('@toastmasters/analytics-core')
  })

  it('does not import analytics-core from any source file', () => {
    // Match an actual import of the package specifier — not a prose mention of
    // "analytics-core" in a comment (which is legitimate, e.g. documenting the
    // rule). Covers static `from '…'`, dynamic `import('…')`, and `require('…')`.
    const importRe =
      /(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"]@toastmasters\/analytics-core(?:\/[^'"]*)?['"]/
    const offenders: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) {
          if (entry === '__fixtures__') continue
          walk(full)
          continue
        }
        if (!full.endsWith('.ts')) continue
        if (importRe.test(readFileSync(full, 'utf8'))) offenders.push(full)
      }
    }
    walk(srcRoot)
    expect(offenders).toEqual([])
  })
})
