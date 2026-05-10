/* Shared .redesign-panel class (#360). Used as the token-driven
   replacement for the legacy `bg-white rounded-lg shadow-md p-6`
   Tailwind triplet on Overview tab components. Static guard so future
   edits don't accidentally drop the class or break dark mode. */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const css = readFileSync(
  resolve(__dirname, '../../styles/components/app-shell.css'),
  'utf-8'
)

describe('Shared redesign-panel chrome (#360)', () => {
  it('declares .redesign-panel inside @layer brand with token-driven background + border + shadow', () => {
    const rule = css.match(/\.redesign-panel\s*\{([\s\S]*?)\n\s*\}/)
    expect(rule).toBeTruthy()
    const block = rule?.[1] ?? ''
    expect(block).toMatch(/background-color\s*:\s*var\(--surface\)/)
    expect(block).toMatch(/border\s*:[^;]*var\(--line\)/)
    expect(block).toMatch(/border-radius\s*:\s*var\(--rds-radius-md\)/)
    expect(block).toMatch(/box-shadow\s*:\s*var\(--rds-shadow-sm\)/)
  })

  it('does NOT use hardcoded colors that would break dark mode', () => {
    const rule = css.match(/\.redesign-panel\s*\{([\s\S]*?)\n\s*\}/)
    const block = rule?.[1] ?? ''
    // No bare hex / rgb() in the rule body.
    expect(block).not.toMatch(/#[0-9a-f]{3,6}/i)
    expect(block).not.toMatch(/rgba?\(/)
  })

  it('has a paired .redesign-panel__header rule with serif typography', () => {
    const rule = css.match(/\.redesign-panel__header\s*\{([\s\S]*?)\n\s*\}/)
    expect(rule).toBeTruthy()
    const block = rule?.[1] ?? ''
    expect(block).toMatch(/font-family\s*:\s*var\(--serif\)/)
    expect(block).toMatch(/font-weight\s*:\s*700/)
  })
})
