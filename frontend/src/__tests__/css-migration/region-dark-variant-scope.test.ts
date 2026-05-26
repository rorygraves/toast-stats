// Region components must scope dark styling to the app theme, not the OS (#710)
//
// Root cause of #710 (Amy's "regions leaderboard near-invisible in Safari"):
// Tailwind's `dark:` variant compiles to `@media (prefers-color-scheme: dark)`,
// but this app's dark mode is a MANUAL `[data-theme='dark']` toggle
// (DarkModeContext). When a user's OS prefers dark while the app shows light
// (white surface), every `dark:` utility fires anyway — painting light text on
// the light surface. The /regions leaderboard rows went invisible; only the
// hovered row (which got `dark:hover:bg-gray-800`) stayed legible. This is the
// inert-`dark:` trap of lesson 073, in reverse: it MISFIRES on OS preference.
//
// Fix: a `theme-dark:` custom variant keyed off `[data-theme='dark']`
// (defined in `src/index.css`) so dark styling tracks the toggle, never the OS.
// This guard fails if a region component reintroduces a raw `dark:` utility.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, resolve } from 'path'

const FRONTEND_SRC = resolve(__dirname, '../..')

// Match a Tailwind `dark:` variant token (incl. stacked like
// `dark:hover:`), but NOT our toggle-scoped `theme-dark:`. A `dark:`
// token is bounded on the left by start/whitespace/quote and is not
// preceded by `theme-` (the `[\w-]` lookbehind excludes `theme-dark:`).
const RAW_DARK_VARIANT = /(?<![\w-])dark:/g

// Recursive .tsx/.jsx walker, skipping tests so a guard-fixture string
// can't trip this assertion (mirrors unmitigated-color-utilities.test.ts).
function collectComponentFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue
      out.push(...collectComponentFiles(full))
    } else if (/\.(tsx|jsx)$/.test(entry) && !/\.test\.|\.spec\./.test(entry)) {
      out.push(full)
    }
  }
  return out
}

// Repo-wide guard (#715): the migration off raw `dark:` covers the WHOLE
// component tree, not just the two #710 region components. A raw `dark:`
// utility fires via @media(prefers-color-scheme:dark) and misfires when the
// OS prefers dark but the app shows light mode — light text on a light
// surface. Every dark style must scope to the manual `[data-theme='dark']`
// toggle via the `theme-dark:` custom variant instead.
describe('no component uses raw prefers-color-scheme `dark:` utilities (#715)', () => {
  const files = collectComponentFiles(FRONTEND_SRC)

  it('finds component files to scan', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map(f => relative(FRONTEND_SRC, f)))(
    '%s uses `theme-dark:`, never raw `dark:`',
    rel => {
      const src = readFileSync(resolve(FRONTEND_SRC, rel), 'utf-8')
      const matches = src.match(RAW_DARK_VARIANT) ?? []
      expect(
        matches.length,
        `${rel} contains ${matches.length} raw \`dark:\` utility(ies). ` +
          'These fire via @media(prefers-color-scheme:dark) and misfire when ' +
          'the OS is dark but the app shows light mode (#710/#715). Use the ' +
          'toggle-scoped `theme-dark:` variant instead.'
      ).toBe(0)
    }
  )

  it('defines the `theme-dark` custom variant in index.css', () => {
    const indexCss = readFileSync(resolve(FRONTEND_SRC, 'index.css'), 'utf-8')
    expect(
      /@custom-variant\s+theme-dark\b/.test(indexCss),
      'src/index.css must define `@custom-variant theme-dark` keyed off ' +
        "[data-theme='dark'] so region components can scope dark styling to " +
        'the manual toggle.'
    ).toBe(true)
  })
})
