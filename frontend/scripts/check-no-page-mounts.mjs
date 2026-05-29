#!/usr/bin/env node
/**
 * V12 guard (#916, epic #917 S5) — a UNIT-project test must not full-page-mount.
 *
 * The Sprint 1 deep-dive (§4.1, V1/L53) named full-page mounts the primary
 * contention debt: every `render(<SomePage/>)` drags in QueryClientProvider +
 * router + lazy children + hook mocks, all competing for the worker pool. Those
 * heavy tests belong in the CI-only `integration` project (page-mount tests →
 * src/pages/__tests__/ or src/__tests__/integration/ by the partition's own
 * convention); the fast `unit` project — which also gates pre-push — must stay
 * mount-light, or the L53 contention surface creeps back into the gate.
 *
 * Like the R20 partition guard (check-test-projects.mjs), this sources the unit
 * file set from vitest's OWN resolution (`vitest list --project=unit --json`),
 * never a re-implemented glob walk that could drift from the real config. It
 * then statically flags any unit test that imports a page component
 * (`.../pages/XxxPage`) or the app root (`.../App`) — the signature of a
 * full-page mount. A flagged test should move to the integration project (or be
 * named *.integration.test.tsx) so it routes off the fast gate.
 *
 * Exits non-zero with the offending files + specifiers listed on any violation.
 */
import { readFileSync } from 'node:fs'
import { listVitestFiles, relFromFrontend as rel } from './lib/listVitestFiles.mjs'

// Capture the module specifier of every static import and dynamic import().
const IMPORT_RE = /(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g

/**
 * Is this specifier a page component or the app root (a full-page mount)?
 *
 * This is a naming-convention guard (basename `App`, or `.../pages/*Page`), not
 * a render-call analysis — it assumes the repo's convention that page modules
 * live under `pages/` and end in `Page`, and uses relative imports (no `@/pages`
 * alias today). A page mounted via a re-export not ending in `Page`, or a future
 * path alias, would slip past; the nightly flake sentinel (R21) is the backstop
 * that would catch the contention such a mount reintroduces.
 */
function isPageMountSpecifier(spec) {
  const base = spec.split('/').pop() || ''
  // The app root: a bare './App' / '../App' or any `.../App` — the basename
  // pop covers every relative form, so no separate regex is needed.
  if (base === 'App') return true
  // A page component module lives under pages/ and its basename ends in "Page".
  // Helper/type modules under pages/ (e.g. pages/utils) are intentionally NOT
  // flagged — they aren't a mount.
  return spec.includes('/pages/') && /Page$/.test(base)
}

const violations = []
for (const file of listVitestFiles('unit')) {
  let src
  try {
    src = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  const hits = new Set()
  for (const m of src.matchAll(IMPORT_RE)) {
    if (isPageMountSpecifier(m[1])) hits.add(m[1])
  }
  if (hits.size > 0) violations.push({ file, specs: [...hits] })
}

if (violations.length > 0) {
  console.error(
    '✗ unit-project test(s) full-page-mount (V12, #916) — move them to the integration project:\n'
  )
  for (const v of violations) {
    console.error(`    ${rel(v.file)}`)
    for (const s of v.specs) console.error(`        imports ${s}`)
  }
  console.error(
    '\nPage mounts belong in src/pages/__tests__/ or src/__tests__/integration/\n' +
      '(or name the file *.integration.test.tsx) so they route off the fast unit gate.'
  )
  process.exit(1)
}

console.error(
  '✓ no-page-mounts-in-unit OK: no unit-project test imports a page component'
)
