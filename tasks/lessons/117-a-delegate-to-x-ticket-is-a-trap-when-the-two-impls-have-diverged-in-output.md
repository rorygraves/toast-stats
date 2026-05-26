---
id: '117'
category: lesson
tags: [monorepo, analytics, refactor, tdd, data-pipeline]
auto_load: true
date: 2026-05-26
issues: [306, 757]
---

# Lesson 117 — A "delegate to X" refactor ticket is a trap when the two impls have diverged in output

**Date:** 2026-05-26
**Issue:** #306 (epic #757 Sprint 1)

## What happened

#306's title said `TransformService.calculateAllDistrictsRankings should
delegate to BordaCountRankingCalculator` — the two classes had ~300 lines of
duplicated ranking logic. The obvious reading is "make TransformService call
the calculator." But the calculator's public entry points (`calculateRankings`

- `buildRankingsData`) are **not** output-equivalent to what TransformService
  produces:

* **Metadata differs**: TransformService writes `schemaVersion:
ANALYTICS_SCHEMA_VERSION` (`'1.0.0'`); the calculator hardcodes `'1.0'`.
* **Confirmed-Distinguished gating differs**: TransformService computes the
  pre-April confirmed count only when **all** districts report 0
  (`metrics.every(m => m.distinguishedClubs === 0)`); the calculator gates
  **per-district** (`if (metric.distinguishedClubs === 0)`). These produce
  different snapshot values whenever some districts have 0 and some don't.
* **Metric extraction reads different inputs**: TransformService parses
  `AllDistrictsCSVRecord` + does per-district disk I/O + district-ID
  validation; the calculator reads in-memory `RankingDistrictStatistics`.

Full delegation would have silently changed the snapshot the CDN serves —
exactly the kind of pipeline-output regression lesson 61 is about, in reverse.

## The principle

When a ticket says "delegate to / call X instead of duplicating," **audit
output-equivalence of the two implementations before delegating.** Two methods
with the same name and shape can have quietly diverged at the lines that matter
(a denominator, a gating condition, a version string). Diff the actual
behaviour, not the signatures.

If they HAVE diverged, don't force delegation — that imports a behaviour change
under the banner of a "pure refactor." Instead extract only the **proven
byte-identical pure core** into the lower-level package (here:
`calculateCategoryRanking`, `calculateAggregateRankings`, the program-year date
parsers) and have both sites call it. The legitimately-different surrounding
logic (metric extraction, metadata, conditional gating) stays where it is.
This still kills the drift surface lessons 61/76 warn about, without changing
output.

## How to apply

- Before a "delegate to X" refactor: for each field the two paths write, confirm
  they compute it identically. `git show` both originals side by side; grep for
  the field name (lesson 76's audit). Any divergence = a behaviour decision the
  ticket didn't authorise.
- Extract the intersection (the identical pure functions), not the union. A
  partial extraction that preserves output beats a full delegation that changes
  it.
- The existing test suites on both sides are your equivalence proof: if the
  extracted core is truly identical, both suites stay green untouched (here:
  803 analytics-core + 735 collector-cli, zero assertion changes).

## Related

- [[076-shared-formula-helper-eliminates-the-two-copies-trap]] — extract a
  pure helper, inline at the call site, no wrapper. This lesson adds: first
  prove the two copies are actually identical; extract only what is.
- [[061-fix-the-formula-everywhere-not-just-the-one-in-the-bug-report]] —
  collector-cli writes the snapshot the CDN serves; a delegation that changes
  its output ships the change to prod data, not just the library.
