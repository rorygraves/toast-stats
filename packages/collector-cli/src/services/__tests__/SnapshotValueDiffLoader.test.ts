import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { AllDistrictsRankingsData } from '@toastmasters/shared-contracts'
import { loadDateDigests, runValueDiff } from '../SnapshotValueDiffLoader.js'

function rankings(
  date: string,
  totalPayments: number
): AllDistrictsRankingsData {
  return {
    metadata: {
      snapshotId: date,
      calculatedAt: '2024-07-01T00:00:00.000Z',
      schemaVersion: '1.0.0',
      calculationVersion: '1.0.0',
      rankingVersion: '1.0.0',
      sourceCsvDate: date,
      csvFetchedAt: '2024-07-01T00:00:00.000Z',
      totalDistricts: 1,
      fromCache: false,
    },
    rankings: [
      {
        districtId: '61',
        districtName: 'District 61',
        region: 'Region 7',
        paidClubs: 100,
        paidClubBase: 98,
        clubGrowthPercent: 2.04,
        totalPayments,
        paymentBase: 4800,
        paymentGrowthPercent: 4.17,
        activeClubs: 95,
        distinguishedClubs: 30,
        selectDistinguished: 10,
        presidentsDistinguished: 5,
        distinguishedPercent: 30,
        clubsRank: 3,
        paymentsRank: 4,
        distinguishedRank: 2,
        aggregateScore: 88.5,
        overallRank: 3,
      },
    ],
  }
}

function writeSnapshot(
  root: string,
  date: string,
  data: AllDistrictsRankingsData
) {
  const dir = join(root, date)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'all-districts-rankings.json'),
    JSON.stringify(data, null, 2)
  )
}

let tmp: string
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'svd-'))
})
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe('loadDateDigests', () => {
  it('loads one digest per date dir that has all-districts-rankings.json', () => {
    const root = join(tmp, 'staging')
    writeSnapshot(root, '2024-06-30', rankings('2024-06-30', 5000))
    writeSnapshot(root, '2024-07-31', rankings('2024-07-31', 5100))
    mkdirSync(join(root, 'not-a-snapshot')) // skipped: no rankings file
    const digests = loadDateDigests(root)
    expect(digests.map(d => d.date).sort()).toEqual([
      '2024-06-30',
      '2024-07-31',
    ])
  })

  it('returns [] for a missing root', () => {
    expect(loadDateDigests(join(tmp, 'does-not-exist'))).toEqual([])
  })
})

describe('runValueDiff', () => {
  it('promotes (exit 0) when staging is additive-only', () => {
    const staging = join(tmp, 'staging')
    const prod = join(tmp, 'prod')
    writeSnapshot(prod, '2024-06-30', rankings('2024-06-30', 5000))
    writeSnapshot(staging, '2024-06-30', rankings('2024-06-30', 5000))
    writeSnapshot(staging, '2024-07-31', rankings('2024-07-31', 5100)) // new
    const { decision, exitCode } = runValueDiff({
      stagingDir: staging,
      prodDir: prod,
    })
    expect(decision.promote).toBe(true)
    expect(exitCode).toBe(0)
  })

  it('blocks (exit 1) a value re-derive unless allowValueChanges', () => {
    const staging = join(tmp, 'staging')
    const prod = join(tmp, 'prod')
    writeSnapshot(prod, '2024-06-30', rankings('2024-06-30', 5000))
    writeSnapshot(staging, '2024-06-30', rankings('2024-06-30', 5001)) // changed
    const blocked = runValueDiff({ stagingDir: staging, prodDir: prod })
    expect(blocked.decision.promote).toBe(false)
    expect(blocked.decision.requiresReview).toBe(true)
    expect(blocked.exitCode).toBe(1)

    const allowed = runValueDiff({
      stagingDir: staging,
      prodDir: prod,
      allowValueChanges: true,
    })
    expect(allowed.decision.promote).toBe(true)
    expect(allowed.exitCode).toBe(0)
  })
})

describe('runValueDiff — Closing-Pinned Auto-Allow end-to-end (#1086)', () => {
  /** rankings() variant with an independent As-of date (closing signature). */
  function closingRankings(
    date: string,
    sourceCsvDate: string,
    totalPayments: number
  ): AllDistrictsRankingsData {
    const data = rankings(date, totalPayments)
    return { ...data, metadata: { ...data.metadata, sourceCsvDate } }
  }

  it('auto-allows (exit 0) a closing-pinned monotone reconciliation', () => {
    const staging = join(tmp, 'staging')
    const prod = join(tmp, 'prod')
    writeSnapshot(
      prod,
      '2026-05-31',
      closingRankings('2026-05-31', '2026-05-31', 5000)
    )
    writeSnapshot(
      staging,
      '2026-05-31',
      closingRankings('2026-05-31', '2026-06-02', 5050)
    )
    const { decision, exitCode } = runValueDiff({
      stagingDir: staging,
      prodDir: prod,
    })
    expect(decision.promote).toBe(true)
    expect(decision.requiresReview).toBe(false)
    expect(decision.autoAllowed).toBe('closing-monotonic')
    expect(decision.closingDeltas).toHaveLength(1)
    expect(exitCode).toBe(0)
  })

  it('still blocks (exit 1) a closing-period counter decrease', () => {
    const staging = join(tmp, 'staging')
    const prod = join(tmp, 'prod')
    writeSnapshot(
      prod,
      '2026-05-31',
      closingRankings('2026-05-31', '2026-05-31', 5000)
    )
    writeSnapshot(
      staging,
      '2026-05-31',
      closingRankings('2026-05-31', '2026-06-02', 4999)
    )
    const { decision, exitCode } = runValueDiff({
      stagingDir: staging,
      prodDir: prod,
    })
    expect(decision.promote).toBe(false)
    expect(decision.autoAllowed).toBeUndefined()
    expect(decision.reasons.join(' ')).toMatch(/decrease/i)
    expect(exitCode).toBe(1)
  })
})
