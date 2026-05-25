import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Contract test for ADR-004: release-gated production deploys (#707).
 *
 * Production deploys must fire on a release-please *release*, not on every
 * merge to main, and the redundant per-merge full-CI re-run must be gone.
 * These assertions are dependency-free (no YAML parser available at root):
 * we strip full-line comments and check the structural contract as text.
 */

const WORKFLOWS = join(__dirname, '..', '..', '..', '.github', 'workflows')

function readWorkflow(name: string): string {
  return readFileSync(join(WORKFLOWS, name), 'utf8')
}

/** Lines with all full-line `#` comments removed (keeps inline content). */
function stripComments(yaml: string): string[] {
  return yaml.split('\n').filter(line => !/^\s*#/.test(line))
}

/**
 * Return the top-level `on:` trigger keys (one indent level under `on:`).
 * Stops at the next top-level (column-0) key.
 */
function topLevelTriggers(yaml: string): string[] {
  const lines = stripComments(yaml)
  const onIdx = lines.findIndex(l => /^on:\s*$/.test(l))
  expect(onIdx, 'workflow must have a block-style `on:`').toBeGreaterThan(-1)
  const triggers: string[] = []
  for (let i = onIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') continue
    if (/^\S/.test(line)) break // next top-level key
    const m = line.match(/^\s{2}([A-Za-z_]+):/)
    if (m) triggers.push(m[1])
  }
  return triggers
}

describe('ADR-004: release-gated production deploy', () => {
  describe('deploy.yml', () => {
    const deploy = readWorkflow('deploy.yml')

    it('does NOT trigger on push to main (deploys are release-gated)', () => {
      expect(topLevelTriggers(deploy)).not.toContain('push')
    })

    it('is callable by release-please (workflow_call)', () => {
      expect(topLevelTriggers(deploy)).toContain('workflow_call')
    })

    it('retains workflow_dispatch for manual/hotfix deploys', () => {
      expect(topLevelTriggers(deploy)).toContain('workflow_dispatch')
    })

    it('drops the redundant per-merge full-CI re-run job', () => {
      const lines = stripComments(deploy)
      // No top-level `ci:` job, and deploy-frontend no longer needs it.
      expect(lines.some(l => /^\s{2}ci:\s*$/.test(l))).toBe(false)
      expect(deploy).not.toMatch(/needs:\s*\[?\s*ci\b/)
    })
  })

  describe('release-please.yml', () => {
    const rp = readWorkflow('release-please.yml')

    it('exposes the aggregate releases_created output', () => {
      expect(rp).toMatch(/releases_created/)
    })

    it('has a deploy job gated on releases_created (not per-component)', () => {
      expect(rp).toMatch(/^\s{2}deploy:\s*$/m)
      expect(rp).toMatch(/if:\s*.*releases_created\s*==\s*'true'/)
    })

    it('deploys by calling the reusable deploy workflow', () => {
      expect(rp).toMatch(/uses:\s*\.\/\.github\/workflows\/deploy\.yml/)
    })
  })
})
