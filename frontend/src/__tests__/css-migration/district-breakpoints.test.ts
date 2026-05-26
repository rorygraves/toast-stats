// District-surface breakpoint reconciliation guard (#682, epic #674 Sprint 8)
//
// The redesign HANDOFF (docs/design/club-redesign-2026-05/HANDOFF.md §126/§234)
// defines ONE responsive system for the district pages:
//   - 2-col content grids collapse to 1-col under 980px
//   - tables collapse to cards under 640px (owned by ClubsTable useIsMobile(640))
//
// Before this sprint the district surface mixed 768 / 1024 for its 2-col grids
// and KPI strip. This guard pins every 2-col content grid and the KPI strip's
// desktop threshold to 980px so the system can't drift back. It reads the real
// source (CSS + the two TSX call sites), so it's falsifiable and fast — no
// layout engine needed (jsdom can't compute media queries; cf. Lesson 66).

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SRC = resolve(__dirname, '../..')
const read = (p: string) => readFileSync(resolve(SRC, p), 'utf-8')

const narrativeCss = read('styles/components/district-narrative.css')
const districtOverview = read('components/DistrictOverview.tsx')
const topGrowthClubs = read('components/TopGrowthClubs.tsx')

describe('District breakpoint reconciliation (#682)', () => {
  describe('district-narrative.css KPI strip', () => {
    it('uses 980px as the desktop threshold, not 1024px or 768px', () => {
      expect(narrativeCss).toContain('min-width: 980px')
      expect(narrativeCss).not.toContain('min-width: 1024px')
      expect(narrativeCss).not.toContain('min-width: 768px')
    })

    it('keeps the 640px 2-col intermediate step (#681)', () => {
      // The 4-card strip steps 1 → 2 (640) → 4 (980); the 640 intermediate
      // avoids four tall stacked cards on tablet and is intentionally kept.
      expect(narrativeCss).toContain('min-width: 640px')
    })
  })

  describe('DistrictOverview composition grid', () => {
    it('collapses the 2-col content grid at 980px, not Tailwind lg (1024)', () => {
      expect(districtOverview).toContain('min-[980px]:grid-cols-2')
      expect(districtOverview).not.toContain('lg:grid-cols-2')
    })
  })

  describe('TopGrowthClubs Achievement Highlights grid', () => {
    it('collapses the 2-col stat grid at 980px, not Tailwind md (768)', () => {
      expect(topGrowthClubs).toContain('min-[980px]:grid-cols-2')
      expect(topGrowthClubs).not.toContain('md:grid-cols-2')
    })
  })
})
