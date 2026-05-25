import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import playwrightConfig from '../../../playwright.config'

/**
 * Guard: WebKit/Safari verification coverage must stay wired (#713).
 *
 * #685 closed as "0 contrast violations" while /regions was unreadable in
 * Safari (#710) — verification was Chromium-only. #710 added a `webkit`
 * Playwright project; #713 formalizes it so the coverage cannot silently
 * regress:
 *   (a) the config keeps a `webkit` project bound to the smoke suite, and
 *   (b) the PR-preview CI workflow installs the WebKit browser AND runs the
 *       smoke against the live preview.
 *
 * (b) matters because a declared-but-uninstalled engine is INERT — the
 * webkit project resolves in config yet never executes (cf. lesson 082: a
 * rule can be present-at-error and still detect nothing). Assert the wiring
 * actually runs, not just that "webkit" appears somewhere.
 */

// Resolve a repo-root-relative path by walking up from cwd, so the test
// passes whether the runner launches from the repo root (`npm run test`) or
// the workspace (`npm run test:frontend`). `import.meta.url` is not a file://
// URL under vitest's transform, so we can't derive it from the module path.
function repoFile(rel: string): string {
  let dir = process.cwd()
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, rel)
    if (existsSync(candidate)) return candidate
    dir = dirname(dir)
  }
  throw new Error(`could not locate ${rel} walking up from ${process.cwd()}`)
}

type Project = {
  name?: string
  testMatch?: unknown
  use?: Record<string, unknown>
}

describe('WebKit verification coverage (#713)', () => {
  const projects = (playwrightConfig.projects ?? []) as Project[]

  it('playwright config keeps a webkit project bound to the smoke suite', () => {
    const webkit = projects.find(p => p.name === 'webkit')
    expect(webkit, 'a project named "webkit" must exist').toBeDefined()
    expect(webkit?.testMatch).toBe('**/*.smoke.ts')
    // Desktop Safari device → WebKit engine. Assert the ENGINE, not the name:
    // a project called "webkit" that runs Chromium would be a silent lie.
    expect(webkit?.use?.['defaultBrowserType']).toBe('webkit')
  })

  it('a chromium-default smoke project still runs the smoke suite', () => {
    const smoke = projects.find(p => p.name === 'smoke')
    expect(smoke?.testMatch).toBe('**/*.smoke.ts')
  })

  it('pr-preview workflow installs webkit and runs the smoke against the preview', () => {
    const wf = readFileSync(
      repoFile('.github/workflows/pr-preview.yml'),
      'utf8'
    )
    expect(
      /playwright install[^\n]*\bwebkit\b/.test(wf),
      'pr-preview.yml must install the WebKit browser before smokes run'
    ).toBe(true)
    expect(
      /playwright test[^\n]*smoke/.test(wf),
      'pr-preview.yml must run the smoke suite against the preview'
    ).toBe(true)
  })
})
