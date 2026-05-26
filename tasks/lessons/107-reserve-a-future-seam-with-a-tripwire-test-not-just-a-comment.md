---
id: '107'
category: principle
tags: [process, frontend, router, tdd, sprint-runner]
auto_load: true
date: 2026-05-26
issues: [680, 678, 674]
---

# Lesson 107 — Reserve a future seam with a tripwire test, not just a comment

**Date:** 2026-05-26
**Issue:** #680 (epic #674 Sprint 6 — promote Trends + Analytics to own routes)

## What happened

Sprint 6 added `/district/:id/trends` and `/district/:id/analytics`. The first
increment — extend the `DistrictSubnav` — took two edits and was essentially
mechanical, because Sprint 4 (#678) had done two things when it built the nav
primitive it _couldn't yet fully wire_:

1. **A single-point extension seam.** `DISTRICT_SECTIONS` is one ordered array
   with a comment: _"`/trends` and `/analytics` are created in Sprint 6 (#680);
   they join this array THEN, not before. This const is the single extension
   point."_
2. **A tripwire test that fails when the future arrives.** A test literally named
   `does not list Trends or Analytics yet — their routes land in #680` asserted
   the _absence_ of the two links and pinned the exact current array contents.

So when Sprint 6 started, there was already a red-on-arrival test telling me
precisely what to flip and in what order (ADR-005 §3). I didn't re-derive the
design or guess the insertion point — I inverted the assertion and the seam
accepted the two entries.

## The principle

**When you build an extension point you can't yet wire (the dependency isn't
built), leave BOTH the seam AND a test that fails the moment the dependency
lands.** A `// TODO: add X in #N` comment rots silently; a test that asserts the
_current_ not-yet state is a tripwire — the successor sprint can't ignore it,
because flipping it is the natural first red→green step. The comment says
_"someone should"_; the test says _"you, now, here."_

This is the inverse of the Lesson 081 / 085 family ("a removed thing encodes a
constraint — write the precondition down"). Here a _reserved_ thing encodes the
next step — so encode it as an executable expectation, not prose.

## How to apply

- Building a primitive whose full set of consumers/routes/cases doesn't exist
  yet? Funnel the variation through **one** extension point (a const array, a
  registry, a map), not scattered literals.
- Write a test that pins the _current_ contents/absence and names the issue that
  will change it (`expect(SECTIONS.map(s => s.label)).toEqual([...current])`,
  `queryByRole('link', { name: 'Trends' })` → `toBeNull()`).
- The successor sprint's Phase-2 "Red" is then free: invert that test. If your
  successor can't find a failing test waiting for them, you under-specified the
  seam.
- Pair it with the per-sprint relevant-lessons manifest (#650) / ADR so the
  _why_ (ordering, ARIA contract) travels with the _where_.

## Related

- [[085-subpage-breadcrumb-the-collision-442-feared-doesnt-exist-on-sub-pages]] —
  the inverse: a removal that should have carried its precondition.
- [[081-phase-gated-deferral-tests-move-with-the-spec]] — a deferral encoded as a
  test; same idea that the test, not the comment, is the durable record.
- ADR-005 §3 — the ordering/ARIA contract the tripwire test guarded.
- `frontend/src/components/DistrictSubnav.tsx` (`DISTRICT_SECTIONS`) — the seam.
