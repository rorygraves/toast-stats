# 799 — Recognition consolidation plan (epic #800, Sprint 2)

**Date:** 2026-05-27
**Issue:** #799
**Predecessor:** #798 (badge fix, shipped — PR #805)

## Verified source of truth (manual item 1490)

Per `docs/investigations/798-division-recognition-thresholds.md`, validated by the
operator against the official _District Recognition Program_ manual:

- **DDP (Division):** distinguished **clubs** as % of division club base —
  45% Distinguished / 50% Select / 55% President's — AND paid-club growth offset
  base+0 / base+1 / base+2 (no net club loss). ≥4 areas. **Not** area-percentage.
- **DAP (Area):** distinguished **clubs** as % of club base — 50% Distinguished /
  50%+1 Select / 50%+1 President's — with paid offset base/base/base+1 and a 75%
  club-visit gate per round.

Live implementations that already match the manual (= the source of truth):

- `frontend/src/utils/divisionGapAnalysis.ts::determineDivisionRecognitionLevel` (DDP 45/50/55).
- `frontend/src/utils/divisionStatus.ts::calculateAreaStatus` + `areaGapAnalysis.ts` (DAP 50/50+1, visits).
- Badge `calculateDivisionStatus` already routes through `divisionGapAnalysis` (Sprint 1 / #798).

## The three divergent implementations (audit result)

| #   | Impl                                                                 | Model                                                    | Live?    | Disposition                              |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------- | -------- | ---------------------------------------- |
| 1   | `divisionStatus.calculateDivisionStatus` (badge)                     | DDP via #2                                               | yes      | already unified (Sprint 1) — no change   |
| 2   | `divisionGapAnalysis.determineDivisionRecognitionLevel` (gap line)   | DDP 45/50/55                                             | yes      | **the source of truth** — keep           |
| 3   | `analytics-core/AreaDivisionRecognitionModule` recognition-**level** | legacy area-% (DAP 50/75/100, DDP %-of-areas + 85% paid) | **DEAD** | delete (operator rule: "delete if dead") |

R8 audit of #3: `calculateDivisionRecognition` is **never called**. `calculateAreaRecognition`
is called once (`AnalyticsComputer.ts:1646`) but the consumer only sums raw
`area.paidClubs` / `area.distinguishedClubs` (perf-target counts) — it never reads
`recognitionLevel`, percentages, or eligibility. So the recognition-LEVEL surface is dead;
the per-area **club counting** is live.

Dead frontend mirror of #3:

- `frontend/src/components/DivisionRankings.tsx` — **not rendered anywhere** (no import/lazy ref). Dead.
- recognition types in `useDistrictAnalytics.ts` (`AreaRecognition`/`DivisionRecognition`/`AreaDivisionRecognitionLevel`/`divisionRecognition?`).

## Remaining LIVE divergence (must fix)

- **Division progress pill** (`DivisionSummary`) renders `distinguishedClubs / requiredDistinguishedClubs`,
  where `extractDivisionPerformance.ts:538` computes `requiredDistinguishedClubs` via
  `divisionStatus.calculateRequiredDistinguishedClubs(clubBase)` = **50%**. For a _division_ the
  DDP Distinguished threshold is **45%** → pill currently demands too many clubs and can disagree
  with the badge. Areas correctly stay at 50%.

## Enum inconsistency

`DistinguishedLevel` (club, analytics-core types) uses `'President'`; `AreaDivisionRecognitionLevel`
(area/division) uses `'Presidents'`. They are distinct domain enums. The `'Presidents'` variant lives
ONLY on the dead recognition-level surface (#3 + DivisionRankings) → resolved by deletion, not a risky
cross-domain rename of the live club-level `'President'`.

## Doc correction (`docs/toastmasters-rules-reference.md`)

- §6.3 (DAP): currently "% of _paid clubs_, 50/75/100" → manual is "% of _club base_, 50 / 50+1 / 50+1"
  with paid offset base/base/base+1; visit gate 75% (§6.1 already right).
- §7 (DDP): currently "85% paid _areas_, % of distinguished _areas_ 50/75/100" → manual is
  "distinguished _clubs_ as % of club base 45/50/55, no net club loss + paid growth +0/+1/+2, ≥4 areas".
- §9 legacy-mapping row(s) referencing the area-% denominator.

## Sequencing (each commit leaves the suite green)

- **A. Fix live pill divergence (TDD).** Division required-distinguished count → DDP 45% (areas stay 50%).
  Badge + gap + pill all agree. Smallest, highest user value.
- **B. Delete dead divergent analytics-core recognition-level surface.** Remove `calculateDivisionRecognition`
  - division/area recognition-level determination + DDP/DAP threshold constants; keep `calculateAreaRecognition`
    producing the live `paidClubs`/`distinguishedClubs` counts. Trim `recognition.ts` types to live fields;
    drop `AreaDivisionRecognitionLevel`. Update the 890-line module test to the surviving surface.
- **C. Delete dead frontend mirror.** `DivisionRankings.tsx` (+ test) and recognition types in
  `useDistrictAnalytics.ts`. Resolves the `'Presidents'` enum by removal.
- **D. Correct the doc** §6.3 / §7 / §9 to the manual model.

Each group is independently shippable and reversible. If B proves too risky within the 3-iteration
green budget, A + D alone still deliver user-facing correctness + the documented source of truth.
