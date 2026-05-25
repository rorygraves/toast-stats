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
import { readFileSync } from 'fs'
import { resolve } from 'path'

const FRONTEND_SRC = resolve(__dirname, '../..')

// The two components that render the /regions page surface (#710 scope).
const REGION_COMPONENTS = [
  'components/RegionsLeaderboard.tsx',
  'components/RegionGrid.tsx',
]

// Match a Tailwind `dark:` variant token (incl. stacked like
// `dark:hover:`), but NOT our toggle-scoped `theme-dark:`. A `dark:`
// token is bounded on the left by start/whitespace/quote and is not
// preceded by `theme-`.
const RAW_DARK_VARIANT = /(?<![\w-])dark:/g

describe('region components scope dark styling to [data-theme], not the OS', () => {
  it.each(REGION_COMPONENTS)(
    '%s uses no raw prefers-color-scheme `dark:` utilities',
    file => {
      const src = readFileSync(resolve(FRONTEND_SRC, file), 'utf-8')
      const matches = src.match(RAW_DARK_VARIANT) ?? []
      expect(
        matches.length,
        `${file} contains ${matches.length} raw \`dark:\` utility(ies). ` +
          'These fire via @media(prefers-color-scheme:dark) and misfire when ' +
          'the OS is dark but the app shows light mode (#710). Use the ' +
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
