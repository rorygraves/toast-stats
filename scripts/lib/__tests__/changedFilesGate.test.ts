// Unit tests for scripts/lib/changedFilesGate.ts
//
// The husky pre-commit / pre-push hooks use this pure classifier to decide
// whether a set of changed files is "docs/lessons-only" — in which case the
// expensive typecheck/lint/test gate can be skipped (CI remains the gate of
// record). The classifier mirrors the CI/Deploy `paths-ignore` glob set from
// #704: `**/*.md`, `tasks/**`, `docs/**`, `.gitignore`, `LICENSE`.
//
// RED phase (#720): these tests are written before the implementation exists.

import { describe, it, expect } from 'vitest'
import { isNonCodeFile, isDocsOnly, needsYamlLint } from '../changedFilesGate'

describe('isNonCodeFile', () => {
  it('treats any .md file as non-code (mirrors **/*.md)', () => {
    expect(isNonCodeFile('README.md')).toBe(true)
    expect(isNonCodeFile('tasks/lessons/106-foo.md')).toBe(true)
    expect(isNonCodeFile('frontend/src/components/Card.md')).toBe(true)
  })

  it('treats tasks/** and docs/** as non-code', () => {
    expect(isNonCodeFile('tasks/rules.md')).toBe(true)
    expect(isNonCodeFile('tasks/lessons/INDEX.md')).toBe(true)
    expect(isNonCodeFile('docs/ci-cd-flow.md')).toBe(true)
    expect(isNonCodeFile('docs/strategy/decisions/0004.md')).toBe(true)
  })

  it('treats the .gitignore and LICENSE literals as non-code', () => {
    expect(isNonCodeFile('.gitignore')).toBe(true)
    expect(isNonCodeFile('LICENSE')).toBe(true)
  })

  it('treats source / config / workflow files as code', () => {
    expect(isNonCodeFile('frontend/src/App.tsx')).toBe(false)
    expect(isNonCodeFile('packages/analytics-core/src/index.ts')).toBe(false)
    expect(isNonCodeFile('package.json')).toBe(false)
    expect(isNonCodeFile('.husky/pre-push')).toBe(false)
    // .github/ is NOT in the paths-ignore set → code
    expect(isNonCodeFile('.github/workflows/ci.yml')).toBe(false)
    // a nested .gitignore is not the root literal → code
    expect(isNonCodeFile('frontend/.gitignore')).toBe(false)
    // a docs-named file outside docs/ is code unless it ends in .md
    expect(isNonCodeFile('docsHelper.ts')).toBe(false)
  })
})

describe('isDocsOnly (ALL-not-ANY, mirrors paths-ignore)', () => {
  it('is true when every changed file is non-code', () => {
    expect(
      isDocsOnly([
        'tasks/lessons/107-foo.md',
        'docs/ci-cd-flow.md',
        'README.md',
      ])
    ).toBe(true)
  })

  it('is false when any changed file is code (mixed change runs the gate)', () => {
    expect(
      isDocsOnly(['tasks/lessons/107-foo.md', 'frontend/src/App.tsx'])
    ).toBe(false)
  })

  it('is false for an empty set (ambiguous → run the gate)', () => {
    expect(isDocsOnly([])).toBe(false)
  })
})

describe('needsYamlLint', () => {
  it('is true when a docs/ yaml file changed', () => {
    expect(needsYamlLint(['docs/some-config.yml'])).toBe(true)
    expect(needsYamlLint(['docs/nested/thing.yaml'])).toBe(true)
  })

  it('is true when a .github/ yaml file changed', () => {
    expect(needsYamlLint(['.github/workflows/ci.yml'])).toBe(true)
  })

  it('is false when no .github/ or docs/ yaml changed', () => {
    expect(needsYamlLint(['tasks/lessons/107-foo.md'])).toBe(false)
    expect(needsYamlLint(['frontend/src/config.yml'])).toBe(false)
    expect(needsYamlLint(['docs/ci-cd-flow.md'])).toBe(false)
    expect(needsYamlLint([])).toBe(false)
  })
})
