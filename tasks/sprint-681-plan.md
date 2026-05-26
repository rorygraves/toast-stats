# Sprint 7 (#681) — KPI strip to spec: 4th card + simplify gauge

**Epic:** #674 · **Branch:** `sprint-681-kpi-strip` (from origin/main `6074f16c`)

## Decision (ron-ux + ron-pm)

**Add the 4th card** (HANDOFF specs 4; data exists) + **add a tier legend** to make
the gauge legible (rather than removing it — the bullet bar is a deliberate #550/#558
design win per lessons 063/065; the only real defect is the undefined D/S/P/Sm
abbreviations).

### Net Member Change = `analytics.memberCountChange`

Traced in `AnalyticsComputer.ts:183` — the **actual member-count delta** (last − first
snapshot). Distinct from `membershipChange` (payment-based, drives the Payments card).
It is a **signed delta with no Distinguished tiers**, so it must NOT reuse the bullet
bar (lesson 102/063: render the metric by its question). New `KpiDeltaCard` renders:

- big **signed** value (`+312` / `−87`), green/red via `text-green-700`/`text-red-700`
  (already dark-remapped, dark-mode.css:364–392; in-repo precedent ClubPerformanceTable).
- **not colour-alone** — sign char + ▲/▼ arrow + sr-only "increase/decrease".
- secondary context line ("members vs. base").
- same card frame as KpiBulletCard.

### Gauge legend

Strip-level legend row beneath the cards: `Tiers — D Distinguished · S Select ·
P President's · Sm Smedley`. Muted theme token, theme-aware. One row, not per-card.

## Responsive (criterion 3: 375 / 640 / 768 / 1280)

4 cards: 1-col (base) → 2-col (640) → 4-col (1024). Avoids a 3+1 orphan that a
768→3-col rule would create. (HANDOFF 980/640 reconciliation is Sprint 8 #682.)

## TDD steps

1. RED: `KpiDeltaCard.test.tsx` — signed format, arrow, colour class, a11y label, zero.
2. GREEN: `KpiDeltaCard.tsx`.
3. RED: extend `DistrictKpiStrip.test.tsx` — 4th card, collapsed summary net, legend.
4. GREEN: extend `DistrictKpiStrip.tsx` (+ `DistrictKpiStripData.netMemberChange`).
5. Wire `DistrictDetailPage.tsx` `kpiStripData`.
6. CSS: 4-col grid + legend styles (theme tokens).
7. /simplify + /review, verify light+dark+responsive on PR preview (both engines).
