// District analytics panel-surface guard (#682, epic #674 Sprint 8)
//
// The district pages theme dark mode via the manual `[data-theme='dark']`
// toggle, NOT `prefers-color-scheme`. Tailwind `dark:` variants are therefore
// INERT here (the project registers `@custom-variant theme-dark`, not `dark`;
// Lessons 73 / 95). A panel styled with `bg-white dark:bg-gray-800` renders
// `bg-white` in dark — which the dark-mode.css override routes to
// `--surface-card` (#1A1722), a LIGHTER surface than the neighbour
// `.redesign-panel`'s `--surface` (#111922). Result: the Education Levels and
// Achievement Highlights panels read lighter than their neighbours in dark.
//
// Fix: drive both panels from the token-driven `.redesign-panel` primitive
// (matches every neighbour), and give the nested stat cards a `--surface-2`
// arbitrary-value background that re-resolves live under the dark toggle
// (Lesson 093). This guard pins that so the legacy patterns can't return.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SRC = resolve(__dirname, '../..')
const read = (p: string) => readFileSync(resolve(SRC, p), 'utf-8')

const educationCard = read('components/EducationLevelsCard.tsx')
const topGrowthClubs = read('components/TopGrowthClubs.tsx')

describe('District panel dark-mode surfaces (#682)', () => {
  describe('EducationLevelsCard', () => {
    it('is a token-driven redesign-panel, not a bg-white card', () => {
      expect(educationCard).toContain('redesign-panel')
      expect(educationCard).not.toContain('bg-white')
    })

    it('drops the inert dark: panel utilities', () => {
      // `dark:bg-gray-800` / `dark:border-gray-700` never fire under the
      // manual toggle — they are dead selectors, not a dark-mode fix.
      expect(educationCard).not.toContain('dark:bg-gray-800')
      expect(educationCard).not.toContain('dark:border-gray-700')
    })
  })

  describe('TopGrowthClubs Achievement Highlights', () => {
    it('uses a token-driven panel surface, not a light-baked gradient', () => {
      expect(topGrowthClubs).not.toContain(
        'from-tm-loyal-blue-10 to-tm-cool-gray-20'
      )
    })

    it('nests the stat cards on a re-resolving --surface-2 token, not bg-white', () => {
      expect(topGrowthClubs).toContain('bg-[var(--surface-2)]')
      expect(topGrowthClubs).not.toContain('bg-white')
    })
  })
})
