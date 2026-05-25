#!/usr/bin/env tsx
/**
 * CLI bridge for the path-aware husky hooks (#720).
 *
 * Reads a newline-separated list of repo-relative changed-file paths from
 * stdin and answers one yes/no question via exit code, so the bash hooks stay
 * thin and the classification has a single tested source of truth
 * (scripts/lib/changedFilesGate.ts) rather than a parallel bash reimplementation.
 *
 *   is-docs-only    exit 0 if every changed file is non-code (safe to skip the
 *                   local gate), else exit 1.
 *   needs-yaml-lint exit 0 if any changed file is YAML under .github/ or docs/
 *                   (lint:yaml covers it), else exit 1.
 *
 * Empty / ambiguous input → exit 1 for both (default to running the gate).
 */

import { isDocsOnly, needsYamlLint } from './lib/changedFilesGate.js'

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

async function main(): Promise<void> {
  const mode = process.argv[2]
  if (mode !== 'is-docs-only' && mode !== 'needs-yaml-lint') {
    console.error(
      `usage: changed-files-gate.ts <is-docs-only|needs-yaml-lint>  (paths on stdin)`
    )
    process.exit(2)
  }

  const files = (await readStdin())
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  const answer =
    mode === 'is-docs-only' ? isDocsOnly(files) : needsYamlLint(files)
  process.exit(answer ? 0 : 1)
}

main().catch(err => {
  console.error(err)
  process.exit(2)
})
