/**
 * Changed-files gate — pure classification logic (#720).
 *
 * The husky pre-commit / pre-push hooks use this to decide whether a set of
 * changed files is "docs/lessons-only". When it is, the expensive
 * typecheck/lint/test gate can be skipped locally — CI remains the gate of
 * record. This is NOT a `--no-verify` bypass: the hook is correctly
 * determining there is nothing code-relevant to verify.
 *
 * The non-code set mirrors the CI/Deploy `paths-ignore` globs introduced in
 * #704 (see .github/workflows/ci.yml, deploy.yml):
 *   - any Markdown file at any depth
 *   - everything under tasks/
 *   - everything under docs/
 *   - the root .gitignore
 *   - the root LICENSE
 *
 * All functions are pure (no git / fs I/O) so they can be unit-tested.
 */

/**
 * True if a single repo-relative path is a "non-code" file per the #704
 * paths-ignore set. ALL-not-ANY semantics live in {@link isDocsOnly}.
 */
export function isNonCodeFile(path: string): boolean {
  // `**/*.md` — any Markdown file, any depth.
  if (path.endsWith('.md')) return true
  // Root literals (a nested `frontend/.gitignore` is NOT the root one).
  if (path === '.gitignore' || path === 'LICENSE') return true
  // `tasks/**` and `docs/**` — anything under these trees.
  if (path.startsWith('tasks/')) return true
  if (path.startsWith('docs/')) return true
  return false
}

/**
 * True only when EVERY changed file is non-code — the same ALL-not-ANY
 * semantics as a GitHub `paths-ignore` filter. A mixed code+docs change runs
 * the full gate.
 *
 * An empty set returns false: an ambiguous/empty change defaults to running
 * the gate (safe default), never to skipping it.
 */
export function isDocsOnly(files: string[]): boolean {
  if (files.length === 0) return false
  return files.every(isNonCodeFile)
}

/**
 * True if any changed file is a YAML file that `npm run lint:yaml` covers.
 * `lint:yaml` runs `yamllint` over `.github/` and `docs/`, so only YAML under
 * those trees is relevant. Used by the docs-only pre-commit branch to still
 * lint a `docs/*.yml` change after skipping typecheck/lint.
 */
export function needsYamlLint(files: string[]): boolean {
  return files.some(
    f =>
      (f.startsWith('.github/') || f.startsWith('docs/')) &&
      (f.endsWith('.yml') || f.endsWith('.yaml'))
  )
}
