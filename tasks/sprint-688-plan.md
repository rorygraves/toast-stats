# Sprint 5 / #688 — three Distinguished-remaining columns (absolute, not %)

Epic #683 F4 (headline). Frontend-only. Depends on #686 (Sprint 3) analytics fields.

## Decisions

### PM — remove vs keep the % columns (open decision #5)

**REPLACE.** Amy explicitly wants the count, "NOT the percentage." Lesson 092:
find what already ships the feature and replace it; don't bolt a second one on.
The 3 percentage prerequisite columns (Payment Growth, Distinguished %, Club
Growth %) map 1:1 to the 3 absolute fields and are swapped in place. Officer-award
booleans (Education/Training, CGD) and Tier are untouched.

### Architecture — data source (lesson 103: derive from the same gate)

- Canonical: `DistinguishedDistrictStatus.{paymentsRemaining,paidClubsRemaining,
distinguishedClubsRemaining}` (#686), present once the pipeline regenerates.
- Today's prod snapshot (2026-05-23) predates the pipeline run, so those fields
  are absent. Frontend fallback derives the count from the **rankings row's
  base + current counts** with the SAME formula the analytics calculator uses
  (`deriveRemainingToMinimum`, twin of `computeRemainingToMinimum`):
  - paymentTarget = ceil(paymentBase × 1.01); paymentsRemaining = max(0, paymentTarget − totalPayments)
  - paidClubTarget = ceil(paidClubBase × 1.01); paidClubsRemaining = max(0, paidClubTarget − paidClubs)
  - distinguishedTarget = ceil(paidClubBase × 0.45); distinguishedClubsRemaining = max(0, distinguishedTarget − distinguishedClubs)
- **Why counts, NOT the gap %:** the first cut derived from `nextTierGap`'s gap %
  (`ceil(gap/100 × base)`). The /review agent caught that TI publishes the
  paymentGrowth/clubGrowth percentages **pre-rounded to 1 dp**, so a gap-based
  derivation drifts ±1 from the canonical field on ~12 live districts (D21 1031
  vs 1032, D33 515 vs 516, D64 265 vs 264 …) and can flip met/not-met. The raw
  integer counts carry no such rounding, so deriving from base+current matches
  the canonical analytics value EXACTLY (verified against prod D47/D21/D33/D64).
  The MINIMUM-tier thresholds (1%, 1%, 45%) are duplicated once on the frontend,
  cross-referenced to analytics-core's `TIER_THRESHOLDS`, and pinned by an
  equivalence test (lesson 103: one fact, kept in lockstep + tested).
- A district already at/above Distinguished has current ≥ target ⇒ remaining 0
  ⇒ ✓, so the derivation handles met districts without a special tier branch.

### Render rule (AC #2)

- canonical field present → ✓ if 0, else the count
- canonical absent + rankings row present → derived count (✓ if 0)
- otherwise (no awards entry / awards null) → em-dash
  Count renders plain (e.g. `277`), no `+` prefix — a "remaining" countdown is a
  clamped non-negative count, not a signed delta (lesson 102 family).

## Plan (TDD)

1. RED: rewrite `distinguishedCountdown.test.ts` for the new field names +
   absolute-remaining semantics + derivation fallback + D47=277 anchor.
2. GREEN: `distinguishedCountdown.ts` — fields renamed, source from canonical
   then gap-derived fallback.
3. RED: RegionPage tests — three "Remaining to Distinguished" columns
   (Paid Clubs / Payments / Distinguished Clubs), ✓/count/—.
4. GREEN: RegionPage header (colgroup) + DistinguishedCells + renderer.
5. /simplify, fresh-context /review, axe.
6. Verify: full suite; live smoke on ts.taverns.red; doc product-spec.

## Verification note

AC "D47 payments reads 277 on today's snapshot": with the gap-derived fallback
this renders 277 LIVE today (no pipeline wait). Confirmed prod D47 nextTierGap:
paymentGrowthGap=4.1, paymentBase=6738 → ceil(4.1/100×6738)=ceil(276.3)=277. ✓
