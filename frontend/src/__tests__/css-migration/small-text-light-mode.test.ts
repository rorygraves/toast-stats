// Light-mode small-text contrast tightening (#564 Phase 3)
//
// WCAG 2.1 AA requires 4.5:1 contrast for normal text. Tailwind's
// default `text-gray-400` (#9ca3af) on white yields only 2.85:1 — a
// clear AA failure anywhere it lands on a light surface, and especially
// at small sizes (`text-xs` = 12px) where it's already at a legibility
// disadvantage. `text-gray-500` (#6b7280) on white is 4.83:1 — it
// passes AA but only barely, and at `text-[11px]` (smaller than the
// `text-xs` default) the audit calls for tightening to `text-gray-600`
// (7.59:1, full AAA).
//
// This test scans the component tree and fails on any of:
//
//   1. `text-gray-400` paired with `text-xs` (AA failure on white)
//   2. `text-gray-500` paired with `text-[11px]` (Phase 3 tightening)
//
// The check is greppy on purpose. It catches both forward-order
// (`text-xs text-gray-400`) and reverse-order (`text-gray-400 text-xs`)
// combinations within a single class attribute, which is the actual
// way these utilities ship together in JSX.
//
// Exclusions: `dark:text-gray-400` is fine — that selector only
// applies under the `[data-theme='dark']` toggle and is not the
// light-mode foreground.
//
// When a future component needs `text-gray-400` at `text-xs`, either
// (a) raise the foreground to `text-gray-600`+, or (b) raise the size
// out of small-text territory (>=18.66px bold / 24px normal) where AA
// drops to 3:1. Do not allowlist new offenders here.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, relative, join } from 'path'

const FRONTEND_SRC = resolve(__dirname, '../..')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full, out)
    } else if (
      (entry.endsWith('.tsx') || entry.endsWith('.jsx')) &&
      !entry.includes('.test.')
    ) {
      out.push(full)
    }
  }
  return out
}

const SOURCE_FILES = walk(FRONTEND_SRC)

// Match a JSX className/class attribute value (either string-literal or
// the inside of a template literal). The capture is the attribute body.
const CLASS_ATTR_PATTERN =
  /class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g

interface Offender {
  file: string
  line: number
  classAttr: string
  rule: string
}

function findOffenders(rule: {
  name: string
  hasForeground: RegExp
  hasSize: RegExp
}): Offender[] {
  const hits: Offender[] = []
  for (const file of SOURCE_FILES) {
    const src = readFileSync(file, 'utf-8')
    const lines = src.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      CLASS_ATTR_PATTERN.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = CLASS_ATTR_PATTERN.exec(line))) {
        const attr = m[1] ?? m[2] ?? m[3] ?? ''
        if (rule.hasForeground.test(attr) && rule.hasSize.test(attr)) {
          hits.push({
            file: relative(FRONTEND_SRC, file),
            line: i + 1,
            classAttr: attr.trim(),
            rule: rule.name,
          })
        }
      }
    }
  }
  return hits
}

// Negative lookbehind for `dark:` — we only care about the light-mode
// foreground. `(?<![\w-])` ensures we don't match `text-gray-4000` or
// similar.
const LIGHT_GRAY_400 = /(?<![\w-])(?<!dark:)text-gray-400(?![\w-])/
const LIGHT_GRAY_500 = /(?<![\w-])(?<!dark:)text-gray-500(?![\w-])/
const TEXT_XS = /(?<![\w-])text-xs(?![\w-])/
const TEXT_11PX = /(?<![\w-])text-\[11px\](?![\w-])/

describe('Small-text light-mode contrast (#564 Phase 3)', () => {
  it('no `text-gray-400` paired with `text-xs` (WCAG AA fail, 2.85:1 on white)', () => {
    const offenders = findOffenders({
      name: 'text-gray-400 + text-xs',
      hasForeground: LIGHT_GRAY_400,
      hasSize: TEXT_XS,
    })
    expect(
      offenders,
      offenders.length
        ? `Found ${offenders.length} light-mode AA failures. Bump foreground to text-gray-600 (7.59:1):\n` +
            offenders
              .map(o => `  ${o.file}:${o.line}  ${o.classAttr}`)
              .join('\n')
        : ''
    ).toEqual([])
  })

  it('no `text-gray-500` paired with `text-[11px]` (Phase 3 tightening to gray-600)', () => {
    const offenders = findOffenders({
      name: 'text-gray-500 + text-[11px]',
      hasForeground: LIGHT_GRAY_500,
      hasSize: TEXT_11PX,
    })
    expect(
      offenders,
      offenders.length
        ? `Found ${offenders.length} sites needing Phase 3 tightening. Bump foreground to text-gray-600:\n` +
            offenders
              .map(o => `  ${o.file}:${o.line}  ${o.classAttr}`)
              .join('\n')
        : ''
    ).toEqual([])
  })
})
