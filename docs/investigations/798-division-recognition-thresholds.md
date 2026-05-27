# 798 — Division recognition badge is one tier too low (threshold reconciliation)

**Date:** 2026-05-27
**Issue:** #798 (epic #800, Sprint 1)
**Status:** thresholds validated; fix routes the badge through the manual-correct source.

## Symptom (D61, snapshot 2026-05-26)

| Division | Official TI dashboard | Toast Stats badge (before fix) | Error        |
| -------- | --------------------- | ------------------------------ | ------------ |
| G        | Select Distinguished  | Distinguished                  | one tier low |
| H        | Distinguished         | Not Distinguished              | one tier low |

The card's summary/gap line was already correct (matched TI); only the top-right
recognition **badge** was one tier below it.

## Authoritative source

Toastmasters **District Recognition Program** manual (item 1490). Distinguished
Division Program (DDP), verbatim:

| Level                     | Distinguished clubs    | Paid clubs (net growth)           |
| ------------------------- | ---------------------- | --------------------------------- |
| Distinguished             | ≥ **45%** of club base | ≥ base (no net club loss)         |
| Select Distinguished      | ≥ **50%** of club base | ≥ base **+1** (net growth of one) |
| President's Distinguished | ≥ **55%** of club base | ≥ base **+2** (net growth of two) |

Qualifying (all levels): no net club loss; division has ≥4 areas. Club base =
paid clubs as of July 1. Required distinguished count is `Math.ceil(base × pct)`
("at least X%").

This is distinct from the **Distinguished _Area_ Program** (DAP), which uses
50% / 50%+1 thresholds, base/base/base+1 paid offsets, and adds 75% club-visit
requirements. Areas legitimately use DAP — divisions do not.

## Root cause

Two frontend code paths computed the division recognition tier with **different
threshold sets**:

- **Badge** ← `frontend/src/utils/divisionStatus.ts::calculateDivisionStatus()`
  used **DAP** thresholds (50% / 50%+1, base/base/base+1). Wrong for divisions.
- **Gap/summary line** ← `frontend/src/utils/divisionGapAnalysis.ts::determineDivisionRecognitionLevel()`
  uses **DDP** thresholds (45/50/55 + paid offset 0/1/2). Correct — reproduces TI.

`calculateDivisionStatus` and `calculateAreaStatus` are two near-identical DAP
functions in `divisionStatus.ts`. DAP is correct for **areas**; applying it to
divisions is the bug.

## Reconciliation (proof)

**Division G** — base 16, paid 17, distinguished 8.

- Required distinguished: Distinguished `ceil(.45×16)=8`, Select `ceil(.50×16)=8`,
  President's `ceil(.55×16)=9`.
- DDP: no net loss (17≥16) ✓. Select needs dist≥8 ✓ and paid≥17 ✓ → **Select**.
  President's needs dist≥9 (8<9) ✗. Highest = **Select Distinguished** (matches TI).
- DAP (old badge): required `ceil(.5×16)=8`; Select needs dist≥9 → fail;
  Distinguished needs dist≥8, paid≥16 ✓ → **Distinguished** (one tier low). ✗

**Division H** — base 17, paid 18, distinguished 8.

- Required distinguished: Distinguished `ceil(.45×17)=ceil(7.65)=8`,
  Select `ceil(.50×17)=ceil(8.5)=9`.
- DDP: no net loss (18≥17) ✓. Distinguished needs dist≥8 ✓ and paid≥17 ✓;
  Select needs dist≥9 (8<9) ✗ → highest = **Distinguished** (matches TI).
- DAP (old badge): required `ceil(.5×17)=9`; Distinguished needs dist≥9 → 8<9 fail
  → **Not Distinguished** (one tier low). ✗

## Fix

`calculateDivisionStatus` now derives its tier from
`determineDivisionRecognitionLevel` (the single DDP source the gap line already
uses) and maps the recognition level to the badge's `DistinguishedStatus`. The
badge and the gap line can no longer disagree by construction — both flow from
one threshold table that lives only in `divisionGapAnalysis.ts`.
`calculateAreaStatus` is untouched (DAP is correct for areas).

## Out of scope (Sprint 2, #799)

- `packages/analytics-core/src/analytics/AreaDivisionRecognitionModule.ts` — a
  third, area-%-based (50/75/100) recognition implementation. Consolidation of
  all three sources is Sprint 2 (`needs-product-review`).
- The "X of Y distinguished" progress **pill** color in `DivisionSummary` still
  uses `requiredDistinguishedClubs` computed at 50% (`divisionStatus.ts`); for a
  division the Distinguished threshold is 45%. Cosmetic (pill shade only, not the
  recognition tier) — fold into the Sprint 2 consolidation.
- `'Presidents'` vs `'President'` recognition-enum string inconsistency
  (`recognition.ts` vs `ClubEligibilityUtils.ts`) — Sprint 2.
