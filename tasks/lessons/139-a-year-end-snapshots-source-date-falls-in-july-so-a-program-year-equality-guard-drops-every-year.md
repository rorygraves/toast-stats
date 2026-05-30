---
id: '139'
category: lesson
tags: [data-pipeline, frontend, hooks, analytics, verification, cdn]
auto_load: true
date: 2026-05-29
issues: [892, 893]
---

# Lesson 139 — A year-end snapshot's `sourceCsvDate` falls in July, so a program-year-equality guard silently drops every completed year

**Date:** 2026-05-29
**Issue:** #892 (epic #893 — per-year summary cards on `/history`)
**PR:** #947

## What happened

The `/history` cards fetch each completed program year's standings via
`fetchCdnRankingsForDate(yearEndDate)`. `cdn.ts` **silently falls back to the
CURRENT `v1/rankings.json`** when a per-date file 404s, so a fresh-context
review (correctly) asked for a guard: never render current data on a past
"final standings" card.

My first guard compared program years:
`if (startYearOf(returnedDate) !== startYear) return null` — i.e. "the data I
got back must belong to the program year I asked for." It passed every unit
test (the mocks returned `date === yearEndDate`) and shipped to the PR preview.

The preview rendered **"No completed program years on file yet."** Every CDN
fetch returned `200` — yet all eight years were filtered out. The reason only
showed up by inspecting the live response metadata:

```
snapshots/2024-06-30/all-districts-rankings.json
  → metadata.sourceCsvDate: "2024-07-19"
```

The June-30 year-end **freeze is published ~3 weeks later** (`sourceCsvDate`
~Jul 18-19). `startYearOf("2024-07-19")` = **2024** (July ≥ month 7 → next
program year), but the file is the year-end of PY **2023-24** (startYear 2023).
`2024 !== 2023` → dropped. Same for every year. The guard's premise — "year-end
data is dated within its own program year" — is simply false for this dataset.

The fix: a **date-window** guard, not a program-year guard.

```ts
const lagDays = (Date.parse(date) - Date.parse(yearEndDate)) / 86_400_000
if (!Number.isFinite(lagDays) || lagDays > MAX_YEAR_END_LAG_DAYS) return null
```

`MAX_YEAR_END_LAG_DAYS = 120` tolerates the ~3-week July publish while still
rejecting the fallback (current data is months-to-years newer).

## The transferable lesson

**A program year is a fiscal period, not a calendar slice — its _closing_ data
is published in the _next_ period.** Any check that maps a snapshot's
`sourceCsvDate` / fetch date back to a program year via the Jul-1 boundary will
put the year-end freeze in the _following_ year. When you need "is this the data
for year N," compare against the **period boundary with a tolerance window**, not
against the program year the date string falls in.

More generally (this is the [[137-an-audits-false-confidence-list-is-a-per-file-hypothesis-reconfirm-before-deleting]]
family): **a guard encodes an assumption about the data's shape; verify that
assumption against a live response before trusting it.** Unit tests that
fabricate the happy-path shape (`date === requested`) will never falsify a guard
whose bug is in the _real_ shape it never sees.

## How to apply

- For "is this snapshot the year-end of PY N?" use a window:
  `0 ≤ daysAfter(yearEndDate) ≤ ~120`, not `startYearOf(date) === N`.
- When a guard rejects data, log/inspect the **actual rejected values** on the
  live surface — a 200-with-zero-results is a filter bug, not a fetch bug.
- Drive new data-derived UI on the **PR preview** (real CDN), not just unit
  tests. This bug was invisible to 20 green unit tests and surfaced the instant
  the preview rendered an empty state.
- Mirror the real shape in at least one test: assert a year whose
  `sourceCsvDate` is in July is **kept**, so the next refactor can't re-introduce
  the program-year-equality bug.

## Related

- [[115-a-fields-name-and-comment-can-lie-about-whether-its-populated-in-your-surface]]
  — sibling "the field's metadata can mislead; check the live value" lesson.
- [[123-totals-distinguished-is-unpopulated-mid-year-count-from-clubperformance]]
  — another "the obvious field doesn't carry what its name implies, mid-period"
  data-shape trap.
- R2 (`tasks/rules.md`) — "it works locally" (here: in unit mocks) does not
  count; verify against the real artifact.
