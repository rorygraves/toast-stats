# Region pages — feedback analysis & epic

**Date:** 2026-05-24
**Source:** Amy voice note (`.routine-tmp/region-feedback/transcript.md`) + spreadsheet mock (Region 7).
**Personas:** ron-pm + ron-ux. Grounded in code via Explore + live-data validation.

## Two surfaces

- **Regions index** (`/regions` → `RegionsPage.tsx`, `RegionGrid.tsx`, `RegionsLeaderboard`).
- **Region detail** (`/region/:n` → `RegionPage.tsx`), a per-district table (13 cols today).

## What Amy likes (keep — do not regress)

Districts at top; Paid Clubs; region-at-a-glance (lost/down for paid, payments, distinguished); region-rank column (1st); district-number column (2nd); world-rank comparison.

## Findings (code + live data)

### F1 — "Net Club Growth" shows the wrong number (data correctness, P0)

The column renders the **distinguished gap** `Math.max(0, requiredNetChange − netChange)` (`DistinguishedDistrictCalculator.ts:255`, rendered `RegionPage.tsx:162,70-84`), not the actual signed net change. District 48 _lost_ 8 clubs (paidClubs 79→71, net **−8**) but the column shows **+8**. A district that is shrinking appears to be growing — actively misleading. Validated against live `v1/rankings.json`.

### F2 — Regions index unreadable until hover (a11y, P0/P1)

Amy: "I cannot read any of the fonts… white font on the gray background of a specific region… only [visible] when I put my mouse over top… I have to scroll through each to find region seven." Code reading was inconclusive on the exact element (`RegionGrid.tsx:37` cards vs leaderboard rows) — **reproduce at `/regions` with a screenshot first**, then fix contrast to WCAG AA at rest (not only on hover) and make finding a specific region easy (highlight / search / jump-to-region).

### F3 — Wants base → current → Δ per metric (P1)

Today Paid Clubs shows current only (`d.paidClubs`). Amy wants, per metric:

- **Paid Clubs:** base → current → net growth (signed, from F1).
- **Membership Payments:** base → current → ± delta.
- **Distinguished Clubs:** base → current → Δ.

Data is available in `CdnRankingsData`: `paidClubBase`, `paidClubs`, `paymentBase`, `totalPayments`, `distinguishedClubs`, `activeClubs`.

### F4 — Three "remaining to minimum distinguished" columns, absolute not % (P1, headline)

Keep the ✓ when the minimum distinguished metric is met. When not met, show the **absolute number remaining** to the minimum Distinguished tier — one column each for **paid clubs, payments (memberships), distinguished clubs**. Today the gap is shown in **percentage points** (e.g. "+4.1%" = `paymentGrowthPercent`); Amy wants the count.

**Validated formula (Distinguished tier minimums: payment growth ≥ +1%, distinguished ≥ 45% of active clubs, net no-loss):**

```
payments_remaining      = max(0, ceil(paymentBase × 1.01) − totalPayments)
distinguished_remaining = max(0, ceil(activeClubs × 0.45) − distinguishedClubs)
paidclub_remaining      = clubs to regain base + required net growth   # calibrate with Amy vs the spreadsheet
```

Live checks (today's snapshot): **D47 payments_remaining = 277 ✓**, **D37 = 170 ✓** (exact match to audio + spreadsheet). Distinguished-clubs and paid-clubs counts are close to the spreadsheet but not exact (the mock was an earlier snapshot) — **calibrate the paid-club + distinguished formulas with Amy against the spreadsheet before locking**. Thresholds live in `DistinguishedDistrictCalculator.TIER_THRESHOLDS`; `DistinguishedDistrictGap` already carries `paidClubBase`/`paymentBase` and the percentage gaps.

---

## Epic — "Region pages: net-growth fix + readability + base/current/Δ + distinguished-remaining"

Sequenced: the P0 correctness/readability fixes first, then the analytics that the new columns depend on, then the table redesign.

1. **fix(region): net club growth shows the distinguished-gap, not signed net change (P0, bug).** Make the net-growth value `paidClubs − paidClubBase` (signed); D48 → **−8**. Decide whether to keep a separate gap concept (it moves into the F4 columns). TDD with D48 (−8) and a growing-district case. Trace `DistinguishedDistrictCalculator.ts:238-255`, `RegionPage.tsx:70-84,162`.
2. **fix(regions): index readability — regions legible at rest + easy to find (P0/P1, a11y).** Reproduce at `/regions` (screenshot 1280/768/375 + dark), fix the white-on-gray element to WCAG AA without requiring hover, add a way to find/jump to a region. **Relevant lessons:** R10 (theme at CSS level).
3. **feat(analytics): district "remaining to minimum distinguished" as absolute counts (P1, data — blocks #5).** In `analytics-core`, derive payments/distinguished/paid-club remaining counts from base + tier minimums; expose new fields on `DistinguishedDistrictGap` / the CDN payload. Calibration anchors: D47 payments = 277, D37 = 170. Calibrate paid-club + distinguished formulas with Amy vs the spreadsheet. Honour the DCP/Distinguished tripwires; raw fields only.
4. **feat(region): table column model — base → current → Δ for Paid Clubs, Payments, Distinguished Clubs (P1).** Restructure the table to the grouped base|current|Δ shape; keep the liked columns (region rank #1, district #2, world rank, score, glance). Uses the signed net growth from #1. Depends on #1.
5. **feat(region): three Distinguished-remaining columns, absolute not % (P1).** ✓ when met; else the absolute count from #3, one each for paid clubs / payments / distinguished clubs. Mirrors the spreadsheet mock. Depends on #3 (and visually on #4).
6. **chore(region): dark-mode + responsive (wide table → mobile) + verification + docs (P2).** Redesign tokens, AA contrast, mobile collapse for the now-wider table, Playwright prod-vs-design verification, update `docs/product-spec.md` Region section + a lessons entry.

### Open decisions

- Paid-club & distinguished-club "remaining" exact formulas — calibrate with Amy against the spreadsheet (#3).
- Whether the old percentage-point columns (`paymentGrowth %`, `clubGrowth %`, `distinguished %`) are removed or kept alongside the new absolute columns (#5).
- Mobile strategy for a wider table (card collapse à la clubs table, or horizontal scroll).
