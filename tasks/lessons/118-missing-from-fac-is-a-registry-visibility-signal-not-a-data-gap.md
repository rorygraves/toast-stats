---
id: '118'
category: lesson
tags: [data-pipeline, analytics, collector-cli, find-a-club]
auto_load: true
date: 2026-05-26
issues: [490, 757]
---

# Lesson 118 — "Missing from Find-A-Club" is a registry-visibility signal, not a data gap

**Date:** 2026-05-26
**Issue:** #490 (epic #757 Sprint 3)

## What happened

The daily snapshot's `clubPerformance` total ran ~410 clubs ahead of the public
Find-A-Club (FAC) registry. The framing ("missing clubs") implies a data bug.
The investigation found the opposite: the gap is **two expected causes**, and
the merge already handles both correctly.

Of 1,012 snapshot-only clubs (2026-05-25, all districts):

- **750 (74%) — Suspended. That is _100%_ of every Suspended club.** TI hides
  suspended clubs from the public Find-A-Club search by design (you don't route
  a prospective member to a suspended club).
- **221 Active + most of the Ineligible/Low tail — corporate/private clubs**
  closed to public members (Apple, Synopsys, Genetec, TCS, Merck, Schwab,
  Toyota, Bell…). TI omits closed clubs from the public registry.

"Missing from FAC" is therefore not one cause and not a bug — it resolves to
_suspended_ or _closed-corporate_, both legitimately absent from a **public**
directory while remaining real performance entities.

## The transferable lesson

**When an "internal" dataset is wider than a "public" view of the same domain,
the delta is usually a visibility/eligibility rule, not missing data — find the
rule before treating it as a defect.** A public registry exists to serve the
public (don't list suspended or private clubs); an internal performance report
exists to measure everyone. They are _supposed_ to disagree, and the right
handling for the extra rows is to **leave them in** the internal aggregates, not
reconcile them away.

## How to apply

- Before "fixing" a count mismatch between two sources, ask what each source is
  _for_. A public-facing source filters by audience rules the internal one
  doesn't. Quantify the delta by the discriminating field (here: `Club Status`)
  before assuming a pipeline fault.
- A 100%-of-a-category result (every Suspended club absent) is a strong tell
  that you've found a **rule**, not noise — chase that, not the long tail.
- A derivable proxy beats re-fetching: a post-merge snapshot already encodes FAC
  membership (`coordinates == null` ⟺ no FAC match, verified 0 false either
  way), so the join needs no second API call. Still validate the proxy against
  live ground truth once (one district's FAC API) before trusting it at scale.
- Don't surface a multi-cause absence under a single-cause label. A "not in
  registry — likely Suspended" badge is wrong for the corporate cohort; the
  suspended case is already covered by `ClubStatusBadge`. (Operator chose no
  badge — #490.)

## Related

- `FindAClubMerger` snapshot-only pass-through (`FindAClubMerger.ts:133`), pinned
  by `FindAClubMerger.test.ts:250`. Leaving snapshot-only rows untouched is the
  correct behaviour, now documented at the call site.
- `docs/investigations/490-snapshot-only-clubs-missing-from-fac.md` — full data.
- #489 — the inverse cohort (FAC-only / prospective ATOs).
