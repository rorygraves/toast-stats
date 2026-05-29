/**
 * Shared `vitest list --json` resolver for the test-infra guards.
 *
 * Both the R20 partition guard (check-test-projects.mjs) and the R22
 * no-page-mounts guard (check-no-page-mounts.mjs) need the set of files vitest
 * *actually* collects — the tool's own resolution, never a re-implemented glob
 * walk that could drift from the real config. Keeping that one invocation here
 * means the two guards can't disagree about how to ask vitest.
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const FRONTEND_DIR = fileURLToPath(new URL('..', import.meta.url))

/**
 * Return the Set of absolute test-file paths vitest collects, optionally scoped
 * to a single project. `project` null/undefined → all projects (no filter).
 * Throws if vitest produces no parseable JSON (a misconfigured project).
 */
export function listVitestFiles(project) {
  const args = ['vitest', 'list', '--json']
  if (project) args.push(`--project=${project}`)
  let out
  try {
    out = execFileSync('npx', args, {
      cwd: FRONTEND_DIR,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch (err) {
    out = err.stdout ? String(err.stdout) : ''
  }
  let cases
  try {
    cases = JSON.parse(out)
  } catch {
    throw new Error(
      `vitest list ${project ? `--project=${project}` : '(all)'} produced no parseable JSON. ` +
        `Is the "${project}" project configured?`
    )
  }
  return new Set(cases.map((c) => c.file))
}

/** Repo-relative path for friendly error output (`frontend/src/...`). */
export function relFromFrontend(f) {
  const i = f.indexOf('/frontend/')
  return i === -1 ? f : f.slice(i + 1)
}
