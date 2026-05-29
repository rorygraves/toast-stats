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
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const FRONTEND_DIR = fileURLToPath(new URL('..', import.meta.url))

function listUnitFiles() {
  let out
  try {
    out = execFileSync(
      'npx',
      ['vitest', 'list', '--json', '--project=unit'],
      {
        cwd: FRONTEND_DIR,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    )
  } catch (err) {
    out = err.stdout ? String(err.stdout) : ''
  }
  let cases
  try {
    cases = JSON.parse(out)
  } catch {
    throw new Error(
      'vitest list --project=unit produced no parseable JSON. Is the "unit" project configured?'
    )
  }
  return [...new Set(cases.map((c) => c.file))]
}

function rel(f) {
  const i = f.indexOf('/frontend/')
  return i === -1 ? f : f.slice(i + 1)
}

// Capture the module specifier of every static import and dynamic import().
const IMPORT_RE = /(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g

/** Is this specifier a page component or the app root (a full-page mount)? */
function isPageMountSpecifier(spec) {
  if (!spec.includes('/pages/') && !/(^|\/)App$/.test(spec)) {
    // Allow a bare '../App' / './App' too (no /pages/).
    if (!/(^|\/)App$/.test(spec)) return false
  }
  const base = spec.split('/').pop() || ''
  // A page component module ends in "Page" and lives under pages/; the app root
  // basename is exactly "App". Helper/type modules under pages/ (e.g.
  // pages/utils) are intentionally NOT flagged — they aren't a mount.
  if (base === 'App') return true
  return spec.includes('/pages/') && /Page$/.test(base)
}

const violations = []
for (const file of listUnitFiles()) {
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
