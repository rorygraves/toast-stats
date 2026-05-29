#!/usr/bin/env node
/**
 * Partition guard for the vitest unit/integration project split (#482).
 *
 * The dangerous failure mode of splitting one vitest config into named
 * projects is a test file that matches NO project — it silently stops
 * running and the gap is invisible until a regression slips through.
 *
 * This guard uses vitest's OWN resolution as the source of truth (not a
 * parallel glob reimplementation that could drift from the real config):
 *
 *   ALL = files vitest collects with no --project filter
 *   U   = files in the `unit` project
 *   I   = files in the `integration` project
 *
 * It then asserts the partition is:
 *   - disjoint    (U ∩ I = ∅)        — no file runs twice
 *   - exhaustive  (U ∪ I = ALL)      — no file is orphaned
 *
 * Exits non-zero with the offending files listed on any violation.
 */
import {
  listVitestFiles,
  relFromFrontend as rel,
} from './lib/listVitestFiles.mjs'

const PROJECTS = ['unit', 'integration']

const all = listVitestFiles(null)
const sets = Object.fromEntries(PROJECTS.map((p) => [p, listVitestFiles(p)]))

const [unit, integration] = [sets.unit, sets.integration]
const errors = []

// Disjoint: no file in more than one project.
const overlap = [...unit].filter((f) => integration.has(f))
if (overlap.length > 0) {
  errors.push(
    `Files matched by BOTH unit and integration (will run twice):\n` +
      overlap.map((f) => `    ${rel(f)}`).join('\n')
  )
}

// Exhaustive: every collected file lands in exactly one project.
const covered = new Set([...unit, ...integration])
const orphans = [...all].filter((f) => !covered.has(f))
if (orphans.length > 0) {
  errors.push(
    `Files in NO project (silently not run by either gate):\n` +
      orphans.map((f) => `    ${rel(f)}`).join('\n')
  )
}

// Sanity: projects must actually collect something.
for (const p of PROJECTS) {
  if (sets[p].size === 0) {
    errors.push(`Project "${p}" collected 0 test files — is it configured?`)
  }
}

if (errors.length > 0) {
  console.error('✗ vitest project partition is broken:\n')
  console.error(errors.join('\n\n'))
  console.error(
    `\nTotals: all=${all.size} unit=${unit.size} integration=${integration.size}`
  )
  process.exit(1)
}

console.error(
  `✓ vitest project partition OK: ${all.size} files = ` +
    `${unit.size} unit + ${integration.size} integration (disjoint, exhaustive)`
)
