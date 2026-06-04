/**
 * Closing auto-allow — END-TO-END integration (epic #1083 Sprint 3, #1092).
 *
 * The #1086 gap: the unit verdicts (evaluateClosingAutoAllow / evaluatePromote)
 * were green while the INTEGRATED pipeline verdict still blocked — scheduled
 * run 26947541298 (2026-06-04) blocked on 9 legitimate counter decreases
 * across D14/D46/D94. This suite drives the exact path the workflow's
 * value-gate step calls (`runValueDiff`: fs read → schema validation → digest
 * → diff → evaluatePromote → CPAA) against the REAL captured staging/prod
 * pair (see fixtures/closing-2026-05-31-decreases/README.md), so a future
 * unit/integration divergence fails loudly here.
 */
import { describe, it, expect, afterAll } from 'vitest'
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runValueDiff } from '../SnapshotValueDiffLoader.js'

const FIXTURE_ROOT = fileURLToPath(
  new URL('./fixtures/closing-2026-05-31-decreases/', import.meta.url)
)
const STAGING_DIR = join(FIXTURE_ROOT, 'staging')
const PROD_DIR = join(FIXTURE_ROOT, 'prod')
const RANKINGS_FILE = 'all-districts-rankings.json'

const tmpRoots: string[] = []
afterAll(() => {
  for (const root of tmpRoots) rmSync(root, { recursive: true, force: true })
})

/** A scratch snapshot root seeded with the given date dirs from a fixture side. */
function scratchRoot(sourceDir: string, dates: string[]): string {
  const root = mkdtempSync(join(tmpdir(), 'value-diff-1092-'))
  tmpRoots.push(root)
  for (const date of dates) {
    mkdirSync(join(root, date), { recursive: true })
    copyFileSync(
      join(sourceDir, '2026-05-31', RANKINGS_FILE),
      join(root, date, RANKINGS_FILE)
    )
  }
  return root
}

describe('runValueDiff — real 2026-05-31 closing reconciliation pair (#1092)', () => {
  it('promotes the 9-decrease set autonomously (direction-agnostic auto-allow)', () => {
    const { report, decision, exitCode } = runValueDiff({
      stagingDir: STAGING_DIR,
      prodDir: PROD_DIR,
    })

    // The diff sees exactly one changed overlap date — the pinned month-end.
    expect(report.changed.map(c => c.date)).toEqual(['2026-05-31'])
    expect(report.removed).toEqual([])

    // The integrated verdict — what run 26947541298 got wrong (#1092).
    expect(decision.promote).toBe(true)
    expect(decision.requiresReview).toBe(false)
    expect(decision.autoAllowed).toBe('closing-reconciliation')
    expect(exitCode).toBe(0)

    // Provenance: all 53 counter moves carried, including the 9 decreases.
    const deltas = decision.closingDeltas ?? []
    expect(deltas).toHaveLength(53)
    expect(deltas.filter(d => d.delta < 0)).toHaveLength(9)
    expect(decision.derivedOnlyDistricts).toBe(68)

    // The issue's named evidence rows survive byte-for-byte.
    expect(deltas).toContainEqual({
      date: '2026-05-31',
      districtId: '14',
      field: 'paidClubs',
      prod: 98,
      staging: 97,
      delta: -1,
    })
    expect(deltas).toContainEqual({
      date: '2026-05-31',
      districtId: '14',
      field: 'totalPayments',
      prod: 3774,
      staging: 3764,
      delta: -10,
    })
    expect(deltas).toContainEqual({
      date: '2026-05-31',
      districtId: '46',
      field: 'clubsWith20PlusMembers',
      prod: 28,
      staging: 27,
      delta: -1,
    })
  })

  it('still blocks a date removed from staging (subtractive protection intact)', () => {
    // Prod carries an extra date that staging lost — must block regardless of
    // the closing window (#1034 protection, unchanged by #1092).
    const prodWithExtraDate = scratchRoot(PROD_DIR, [
      '2026-05-31',
      '2026-04-30',
    ])
    const { decision, exitCode } = runValueDiff({
      stagingDir: STAGING_DIR,
      prodDir: prodWithExtraDate,
    })
    expect(decision.promote).toBe(false)
    expect(decision.autoAllowed).toBeUndefined()
    expect(decision.reasons.join(' ')).toMatch(/subtractive/)
    expect(exitCode).toBe(1)
  })

  it('still blocks a district removed on the changed date (D61 protection intact)', () => {
    // Staging side rebuilt without D61 — district sets differ on the pinned
    // date, so CPAA must refuse and the verdict stays blocked.
    const stagingMissingDistrict = mkdtempSync(
      join(tmpdir(), 'value-diff-1092-')
    )
    tmpRoots.push(stagingMissingDistrict)
    mkdirSync(join(stagingMissingDistrict, '2026-05-31'), { recursive: true })
    const data = JSON.parse(
      readFileSync(join(STAGING_DIR, '2026-05-31', RANKINGS_FILE), 'utf8')
    ) as {
      rankings: Array<{ districtId: string }>
      metadata: { totalDistricts: number }
    }
    data.rankings = data.rankings.filter(r => r.districtId !== '61')
    data.metadata.totalDistricts = data.rankings.length
    writeFileSync(
      join(stagingMissingDistrict, '2026-05-31', RANKINGS_FILE),
      JSON.stringify(data)
    )

    const { decision, exitCode } = runValueDiff({
      stagingDir: stagingMissingDistrict,
      prodDir: PROD_DIR,
    })
    expect(decision.promote).toBe(false)
    expect(decision.autoAllowed).toBeUndefined()
    expect(decision.reasons.join(' ')).toMatch(/only in production: 61/)
    expect(exitCode).toBe(1)
  })
})
