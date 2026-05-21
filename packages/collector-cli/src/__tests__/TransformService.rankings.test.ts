/**
 * TransformService Rankings Tests
 *
 * Tests for the all-districts rankings calculation functionality
 * that was ported from the backend.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as os from 'node:os'
import { TransformService } from '../services/TransformService.js'

/**
 * Helper to create a minimal district directory with club performance CSV
 */
async function createDistrictDir(
  rawCsvDir: string,
  districtId: string
): Promise<void> {
  const districtDir = path.join(rawCsvDir, `district-${districtId}`)
  await fs.mkdir(districtDir, { recursive: true })
  await fs.writeFile(
    path.join(districtDir, 'club-performance.csv'),
    'Club Number,Club Name,Division,Area,Active Members,Goals Met\n1234,Test Club,A,1,20,5'
  )
}

describe('TransformService - All Districts Rankings', () => {
  let tempDir: string
  let transformService: TransformService

  beforeEach(async () => {
    // Create unique temp directory for test isolation
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'transform-rankings-test-')
    )
    transformService = new TransformService({ cacheDir: tempDir })
  })

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('District ID Validation', () => {
    it('should reject empty district IDs', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      // CSV with empty district ID
      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
,Region 1,100,95,5.26%,1000,950,5.26%,100,10,5,2
42,Region 2,200,190,5.26%,2000,1900,5.26%,200,20,10,5`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '42')

      const result = await transformService.transform({
        date,
        force: true,
      })

      // Check that rankings file was created with only valid district
      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankingsContent = await fs.readFile(rankingsPath, 'utf-8')
      const rankings = JSON.parse(rankingsContent)

      expect(rankings.rankings).toHaveLength(1)
      expect(rankings.rankings[0].districtId).toBe('42')
    })

    it('should reject date pattern district IDs (CSV footer rows)', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      // CSV with date pattern in district ID (common footer issue)
      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
42,Region 2,200,190,5.26%,2000,1900,5.26%,200,20,10,5
As of 1/15/2024,,,,,,,,,,,`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '42')

      const result = await transformService.transform({
        date,
        force: true,
      })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankingsContent = await fs.readFile(rankingsPath, 'utf-8')
      const rankings = JSON.parse(rankingsContent)

      // Should only have the valid district, not the date pattern
      expect(rankings.rankings).toHaveLength(1)
      expect(rankings.rankings[0].districtId).toBe('42')
    })

    it('should reject district IDs with invalid characters', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      // CSV with invalid characters in district ID
      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
42,Region 2,200,190,5.26%,2000,1900,5.26%,200,20,10,5
district-99,Region 3,150,140,7.14%,1500,1400,7.14%,150,15,8,3`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '42')

      const result = await transformService.transform({
        date,
        force: true,
      })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankingsContent = await fs.readFile(rankingsPath, 'utf-8')
      const rankings = JSON.parse(rankingsContent)

      // Should only have the valid district
      expect(rankings.rankings).toHaveLength(1)
      expect(rankings.rankings[0].districtId).toBe('42')
    })

    it('should accept alphanumeric district IDs like "U"', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      // CSV with special district code "U"
      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
42,Region 2,200,190,5.26%,2000,1900,5.26%,200,20,10,5
U,Undistricted,50,45,11.11%,500,450,11.11%,50,5,2,1`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '42')

      const result = await transformService.transform({
        date,
        force: true,
      })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankingsContent = await fs.readFile(rankingsPath, 'utf-8')
      const rankings = JSON.parse(rankingsContent)

      // Should have both valid districts
      expect(rankings.rankings).toHaveLength(2)
      const districtIds = rankings.rankings.map(
        (r: { districtId: string }) => r.districtId
      )
      expect(districtIds).toContain('42')
      expect(districtIds).toContain('U')
    })
  })

  describe('Borda Count Ranking Calculation', () => {
    it('should calculate correct Borda count rankings', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      // CSV with 3 districts for ranking
      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
1,Region 1,100,90,11.11%,1000,900,11.11%,100,30,15,10
2,Region 2,200,195,2.56%,2000,1950,2.56%,200,20,10,5
3,Region 3,150,145,3.45%,1500,1450,3.45%,150,40,20,15`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '1')

      const result = await transformService.transform({
        date,
        force: true,
      })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankingsContent = await fs.readFile(rankingsPath, 'utf-8')
      const rankings = JSON.parse(rankingsContent)

      expect(rankings.rankings).toHaveLength(3)

      // District 1 has highest club growth (11.11%) - rank 1
      // District 3 has second highest (3.45%) - rank 2
      // District 2 has lowest (2.56%) - rank 3
      const district1 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '1'
      )
      const district2 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '2'
      )
      const district3 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '3'
      )

      expect(district1.clubsRank).toBe(1)
      expect(district3.clubsRank).toBe(2)
      expect(district2.clubsRank).toBe(3)

      // Distinguished percent: D3 (26.67%) > D1 (30%) > D2 (10%)
      // D3: 40/150 = 26.67%, D1: 30/100 = 30%, D2: 20/200 = 10%
      expect(district1.distinguishedRank).toBe(1) // 30%
      expect(district3.distinguishedRank).toBe(2) // 26.67%
      expect(district2.distinguishedRank).toBe(3) // 10%

      // Borda points: 3 districts, so rank 1 = 3 points, rank 2 = 2 points, rank 3 = 1 point
      // Aggregate = clubs + payments + distinguished
      // D1: clubs=1(3pts) + payments=1(3pts) + distinguished=1(3pts) = 9
      // D3: clubs=2(2pts) + payments=2(2pts) + distinguished=2(2pts) = 6
      // D2: clubs=3(1pt) + payments=3(1pt) + distinguished=3(1pt) = 3
      expect(district1.aggregateScore).toBe(9)
      expect(district3.aggregateScore).toBe(6)
      expect(district2.aggregateScore).toBe(3)
    })

    it('should handle ties correctly', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      // CSV with tied values
      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
1,Region 1,100,95,5.26%,1000,950,5.26%,100,10,5,2
2,Region 2,200,190,5.26%,2000,1900,5.26%,200,20,10,5`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '1')

      const result = await transformService.transform({
        date,
        force: true,
      })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankingsContent = await fs.readFile(rankingsPath, 'utf-8')
      const rankings = JSON.parse(rankingsContent)

      // Both districts have same club growth and payment growth
      // They should have the same rank for those categories
      const district1 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '1'
      )
      const district2 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '2'
      )

      expect(district1.clubsRank).toBe(district2.clubsRank)
      expect(district1.paymentsRank).toBe(district2.paymentsRank)
    })
  })

  describe('Distinguished Percent uses Paid Club Base, not Active Clubs (#545)', () => {
    // Per TI Distinguished District Program (Item 1490, Rev. 04/2025),
    // % Distinguished is computed against the program-year-start club
    // count (Paid Club Base), NOT the current Active Clubs count.
    //
    // PR #538 fixed this in analytics-core's BordaCountRankingCalculator
    // but missed the parallel implementation in collector-cli's
    // TransformService.calculateDistinguishedPercent — which is the
    // method that actually writes distinguishedPercent into
    // all-districts-rankings.json (the snapshot the frontend reads).
    //
    // Live D93 + D110 evidence on 2026-05-18 confirms the snapshot
    // still has activeClubs-based percentages despite PR #538.

    it('should compute D93-shape distinguishedPercent against Paid Club Base', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      // D93 shape from 2026-05-18 snapshot: paidClubBase=69, activeClubs=75,
      // distinguishedClubs=39. Correct percent = 39/69 ≈ 56.52%.
      // Buggy (activeClubs-based) = 39/75 = 52.0%.
      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
93,Region 8,75,69,8.70%,2839,2566,10.63%,75,39,20,12`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '93')

      await transformService.transform({ date, force: true })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankings = JSON.parse(await fs.readFile(rankingsPath, 'utf-8'))
      const d93 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '93'
      )

      // 39 / 69 = 56.5217... — meets President's Distinguished 55% threshold.
      // Buggy value 39/75 = 52.0% would fail the 55% threshold by 3.0%,
      // which is the gap the founder reported on /district/93.
      expect(d93.distinguishedPercent).toBeCloseTo(56.5217, 3)
    })

    it('should compute D110-shape distinguishedPercent against Paid Club Base', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      // D110 shape from 2026-05-18 snapshot: paidClubBase=72, activeClubs=77,
      // distinguishedClubs=33. Correct = 33/72 ≈ 45.83% (meets Distinguished
      // 45% threshold). Buggy = 33/77 ≈ 42.86% (fails by 2.14%, which is
      // exactly the gap the live page shows).
      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
110,Region 11,75,72,4.17%,3181,3106,2.41%,77,33,15,8`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '110')

      await transformService.transform({ date, force: true })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankings = JSON.parse(await fs.readFile(rankingsPath, 'utf-8'))
      const d110 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '110'
      )

      expect(d110.distinguishedPercent).toBeCloseTo(45.8333, 3)
    })

    it('should fall back to 0 when Paid Club Base is missing or 0', async () => {
      // Brand-new district edge case — paidClubBase=0 → 0% (not NaN, not
      // a silent fall-through to activeClubs). Mirrors analytics-core
      // hardening from PR #538.
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
99,Region 1,30,0,0%,500,0,0%,30,5,2,1`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '99')

      await transformService.transform({ date, force: true })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankings = JSON.parse(await fs.readFile(rankingsPath, 'utf-8'))
      const d99 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '99'
      )

      expect(d99.distinguishedPercent).toBe(0)
    })
  })

  describe('Rankings File Output', () => {
    it('should write rankings file with correct metadata', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
42,Region 2,200,190,5.26%,2000,1900,5.26%,200,20,10,5`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '42')

      await transformService.transform({
        date,
        force: true,
      })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankingsContent = await fs.readFile(rankingsPath, 'utf-8')
      const rankings = JSON.parse(rankingsContent)

      // Check metadata
      expect(rankings.metadata.snapshotId).toBe(date)
      expect(rankings.metadata.totalDistricts).toBe(1)
      expect(rankings.metadata.rankingVersion).toBe('2.0')
      expect(rankings.metadata.calculatedAt).toBeDefined()
      expect(rankings.metadata.schemaVersion).toBeDefined()
    })

    it('should include rankings file in snapshot locations', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
42,Region 2,200,190,5.26%,2000,1900,5.26%,200,20,10,5`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '42')

      const result = await transformService.transform({
        date,
        force: true,
      })

      // Check that rankings file is in snapshot locations
      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      expect(result.snapshotLocations).toContain(rankingsPath)
    })
  })

  describe('District Recognition Prerequisites & Smedley (#329)', () => {
    it('should parse prerequisite Y/N columns as booleans', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      // CSV with prerequisite columns (DSP, Training, Market Analysis, etc.)
      const csvContent = `REGION,DISTRICT,DSP,Training,Market Analysis,Communication Plan,Region Advisor Visit,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs,Smedley Distinguished Clubs
05,61,Y,Y,Y,Y,Y,144,156,-7.69%,5487,5764,-4.81%,159,37,14,7,5
01,57,Y,Y,Y,Y,N,100,100,0%,1000,1000,0%,100,20,10,5,2`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '61')
      await createDistrictDir(rawCsvDir, '57')

      await transformService.transform({ date, force: true })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankings = JSON.parse(await fs.readFile(rankingsPath, 'utf-8'))

      const district61 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '61'
      )
      const district57 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '57'
      )

      // District 61: all prerequisites met
      expect(district61.dspSubmitted).toBe(true)
      expect(district61.trainingMet).toBe(true)
      expect(district61.marketAnalysisSubmitted).toBe(true)
      expect(district61.communicationPlanSubmitted).toBe(true)
      expect(district61.regionAdvisorVisitMet).toBe(true)

      // District 57: missing Region Advisor Visit
      expect(district57.dspSubmitted).toBe(true)
      expect(district57.trainingMet).toBe(true)
      expect(district57.marketAnalysisSubmitted).toBe(true)
      expect(district57.communicationPlanSubmitted).toBe(true)
      expect(district57.regionAdvisorVisitMet).toBe(false)
    })

    it('should parse Smedley Distinguished Clubs count', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      const csvContent = `REGION,DISTRICT,DSP,Training,Market Analysis,Communication Plan,Region Advisor Visit,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs,Smedley Distinguished Clubs
05,61,Y,Y,Y,Y,Y,144,156,-7.69%,5487,5764,-4.81%,159,37,14,7,5`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '61')

      await transformService.transform({ date, force: true })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankings = JSON.parse(await fs.readFile(rankingsPath, 'utf-8'))
      const district61 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '61'
      )

      expect(district61.smedleyDistinguished).toBe(5)
    })

    it('should aggregate clubs with 20+ paid members per district (#330)', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
61,Region 5,3,3,0%,100,100,0%,3,1,0,0`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)

      // 3 clubs: 25 members, 20 members, 19 members → 2 clubs with 20+
      const districtDir = path.join(rawCsvDir, 'district-61')
      await fs.mkdir(districtDir, { recursive: true })
      await fs.writeFile(
        path.join(districtDir, 'club-performance.csv'),
        `Club Number,Club Name,Division,Area,Active Members,Goals Met
1001,Alpha Club,A,1,25,5
1002,Beta Club,A,1,20,5
1003,Gamma Club,A,1,19,5`
      )

      await transformService.transform({ date, force: true })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankings = JSON.parse(await fs.readFile(rankingsPath, 'utf-8'))
      const d61 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '61'
      )

      // 2 of 3 clubs have ≥20 paid members
      expect(d61.clubsWith20PlusMembers).toBe(2)
    })

    it('should count newly chartered clubs from district-performance.csv (#336)', async () => {
      // The District Performance CSV has a "Charter Date/Suspend Date" column
      // populated with "Charter MM/DD/YY" for newly chartered clubs and
      // "Susp MM/DD/YY" for suspended ones. Snapshot date is 2026-04-25 → PY
      // start is 2025-07-01.
      const date = '2026-04-25'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
93,Region 9,73,69,5.8%,2895,2737,5.77%,73,3,1,0`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)

      const districtDir = path.join(rawCsvDir, 'district-93')
      await fs.mkdir(districtDir, { recursive: true })

      // Minimal club-performance.csv (required by pipeline; 4 clubs)
      await fs.writeFile(
        path.join(districtDir, 'club-performance.csv'),
        `Club Number,Club Name,Division,Area,Active Members,Goals Met
1001,New Club A,A,1,22,3
1002,New Club B,B,2,21,2
1003,New Club C,C,3,18,1
1004,New Club D,D,4,15,0`
      )

      // district-performance.csv has the "Charter Date/Suspend Date" column.
      // 3 new charters this PY (after 2025-07-01) + 1 from prior PY + 1 suspended.
      await fs.writeFile(
        path.join(districtDir, 'district-performance.csv'),
        `District,Division,Area,Club,Club Name,New,Late Ren.,Oct. Ren.,Apr. Ren.,Total Ren.,Total Chart,Total to Date,Distinguished Status,Charter Date/Suspend Date
93,A,1,1001,New Club A,0,0,0,0,0,20,20,,Charter 04/15/26
93,B,2,1002,New Club B,4,0,0,7,7,20,31,,Charter 12/01/25
93,C,3,1003,New Club C,0,0,0,21,21,21,42,,Charter 01/22/26
93,D,4,1004,Old Club D,0,0,5,3,8,0,8,,Charter 09/15/22
93,E,5,1005,Suspended Club,0,0,0,0,0,0,0,,Susp 09/30/25`
      )

      await transformService.transform({ date, force: true })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankings = JSON.parse(await fs.readFile(rankingsPath, 'utf-8'))
      const d93 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '93'
      )

      // 3 charter dates fall in the current PY (>= 2025-07-01); 1 is from 2022
      // and 1 is a suspension (not a charter). Expected: 3.
      expect(d93.newCharteredClubs).toBe(3)
    })

    it('should default missing prerequisite columns to false (legacy CSVs)', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      // Legacy CSV without prerequisite columns
      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
42,Region 2,200,190,5.26%,2000,1900,5.26%,200,20,10,5`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '42')

      await transformService.transform({ date, force: true })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankings = JSON.parse(await fs.readFile(rankingsPath, 'utf-8'))
      const d42 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '42'
      )

      // Legacy CSVs should default to false (unknown = not met)
      expect(d42.dspSubmitted).toBe(false)
      expect(d42.trainingMet).toBe(false)
      expect(d42.marketAnalysisSubmitted).toBe(false)
      expect(d42.communicationPlanSubmitted).toBe(false)
      expect(d42.regionAdvisorVisitMet).toBe(false)
      expect(d42.smedleyDistinguished).toBe(0)
    })
  })

  describe('Payment Breakdown Columns (#327)', () => {
    it('should parse payment breakdown from All Districts CSV', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      const csvContent = `REGION,DISTRICT,New Payments,April Payments,October Payments,Late Payments,Charter Payments,Total YTD Payments,Payment Base,% Payment Growth,Paid Clubs,Paid Club Base,% Club Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
05,61,1052,2310,2073,11,41,5487,5764,-4.81%,144,156,-7.69%,159,37,14,7`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '61')

      await transformService.transform({ date, force: true })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankings = JSON.parse(await fs.readFile(rankingsPath, 'utf-8'))
      const d61 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '61'
      )

      expect(d61.newPayments).toBe(1052)
      expect(d61.aprilPayments).toBe(2310)
      expect(d61.octoberPayments).toBe(2073)
      expect(d61.latePayments).toBe(11)
      expect(d61.charterPayments).toBe(41)
    })

    it('should default to 0 when payment breakdown columns are missing (legacy)', async () => {
      const date = '2024-01-15'
      const rawCsvDir = path.join(tempDir, 'raw-csv', date)
      await fs.mkdir(rawCsvDir, { recursive: true })

      const csvContent = `DISTRICT,REGION,Paid Clubs,Paid Club Base,% Club Growth,Total YTD Payments,Payment Base,% Payment Growth,Active Clubs,Total Distinguished Clubs,Select Distinguished Clubs,Presidents Distinguished Clubs
42,Region 2,200,190,5.26%,2000,1900,5.26%,200,20,10,5`

      await fs.writeFile(path.join(rawCsvDir, 'all-districts.csv'), csvContent)
      await createDistrictDir(rawCsvDir, '42')

      await transformService.transform({ date, force: true })

      const rankingsPath = path.join(
        tempDir,
        'snapshots',
        date,
        'all-districts-rankings.json'
      )
      const rankings = JSON.parse(await fs.readFile(rankingsPath, 'utf-8'))
      const d42 = rankings.rankings.find(
        (r: { districtId: string }) => r.districtId === '42'
      )

      expect(d42.newPayments).toBe(0)
      expect(d42.aprilPayments).toBe(0)
      expect(d42.octoberPayments).toBe(0)
      expect(d42.latePayments).toBe(0)
      expect(d42.charterPayments).toBe(0)
    })
  })
})
