---
name: Pin related queries to the same snapshot date to avoid drift
description: Two "latest" queries on the same page can resolve to different
  snapshots if data publishes between them — pin both to a single resolved
  date instead.
type: feedback
id: '059'
category: principle
tags: [data-pipeline, react, hooks, frontend]
auto_load: true
date: 2026-05-15
issues: [535, 513]
---

# Lesson 59 — Pin related queries to the same snapshot date

**Date:** 2026-05-15
**PR:** #535 (Sprint D/E of Epic #513 — region countdown)

## What happened

`RegionPage.tsx` fetches two CDN JSONs:

1. `fetchCdnRankings()` — all-districts rankings (defaults to "latest").
2. `useCompetitiveAwards(undefined)` — competitive-awards JSON. With
   `undefined`, the hook internally calls `fetchCdnManifest()` to resolve
   "latest" and then fetches awards for that date.

Each call independently resolves "latest." Fresh-context reviewer caught
that during a snapshot publish, request #1 could read snapshot N while
request #2 reads snapshot N+1 — the rankings row would show one set of
numbers but the countdown cells would describe a different snapshot.
Blast radius small in normal operation, but the inconsistency is real
and silent.

## Fix

Pass the rankings query's resolved date through to the awards hook:

```diff
- const { data: awards } = useCompetitiveAwards(undefined)
+ const { data: awards } = useCompetitiveAwards(data?.date)
```

Now both queries are anchored to the same snapshot. Awards refetches
when `data?.date` settles, which is correct.

## How to apply

**When a page assembles a view from multiple CDN/API JSONs that are
versioned by date, treat the date as a single source of truth and
thread it through every related query.** Don't let each call resolve
"latest" independently.

Signs you have this issue:

- Two `useQuery` calls in the same component, both with default-date
  semantics.
- One hook takes a date param but the call site passes `undefined`.
- A `fetchManifest()` call inside one query's `queryFn` that another
  query in the same component doesn't share.

The fix is almost always to pass the resolved date down. The cost is a
one-line wiring change; the benefit is consistent snapshot semantics
forever.

## Test infrastructure note

TanStack Query refetches when `queryKey` changes. If a test uses
`mockResolvedValueOnce`, the pending-state call (e.g. `undefined` date)
will consume the mock, leaving the actual assertion to hit the default
fallback. Use `mockResolvedValue` (not Once) when the keyed-by-date
query will fetch twice in the test lifecycle: once with the initial
undefined date, once with the settled date.

## Related

- `frontend/src/pages/RegionPage.tsx` — `useCompetitiveAwards(data?.date)`
- `frontend/src/hooks/useCompetitiveAwards.ts` — accepts `date | undefined`
- Lesson 58 (invisible-select focus-within) — also from fresh-context review on PR #532
