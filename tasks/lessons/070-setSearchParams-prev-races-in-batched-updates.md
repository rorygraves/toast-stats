---
name: setSearchParams prev callback races against same-batch updaters
description: Two setSearchParams(prev => …) calls dispatched in the same
  React batch see the SAME stale `prev` snapshot — the second clobbers
  the first. Bail out on no-op writes (e.g. delete a key that isn't
  present) so the simultaneous filter write survives.
type: feedback
id: '070'
category: lesson
tags: [router, react, hooks, frontend]
auto_load: true
date: 2026-05-22
issues: [570]
---

# Lesson 70 — `setSearchParams(prev => …)` races against same-batch updaters

**Date:** 2026-05-22
**Issue:** #570 (District IA Phase 2 — route Clubs to `/district/:id/clubs`)

## What happened

Wiring URL state for the new `/district/:id/clubs` route looked
identical to the pattern already used in `DistrictDetailPage`:

```ts
const handleFilterChange = useCallback(
  state => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (patch.status) next.set('status', patch.status)
        else next.delete('status')
        next.delete('page') // reset pagination
        return next
      },
      { replace: true }
    )
  },
  [setSearchParams]
)

const handlePageChange = useCallback(
  page => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (page === 1) next.delete('page')
        else next.set('page', String(page))
        return next
      },
      { replace: true }
    )
  },
  [setSearchParams]
)
```

A unit test that clicked the **Vulnerable** status chip and asserted
`?status=vulnerable` ended up on the URL with an **empty** search. The
filter change _did_ fire (`handleFilterChange` ran, set the URL to
`?status=vulnerable`) — and then `ClubsTable`'s own pagination-reset
effect fired in the same batch:

```ts
useEffect(() => {
  if (isInitialLoad.current && filteredClubs.length > 0) {
    isInitialLoad.current = false
    return
  }
  if (!isInitialLoad.current) {
    pagination.goToPage(1)
    onPageChange?.(1) // <- fires inside the same batch
  }
}, [filteredClubs.length, pagination.goToPage])
```

Both `handleFilterChange` and `handlePageChange` therefore called
`setSearchParams(prev => …)` inside the same React update cycle.
React Router calls each updater with the **same `prev`** — the
pre-batch snapshot — because, like `setState(prev => …)` queued
updates, there is no chained "result of the previous updater" for
`useSearchParams`. The first updater computed
`status=vulnerable`, the second computed `''` (no-op delete on an
empty prev), and the second one won. Status was clobbered.

The same race exists in `DistrictDetailPage` but stays latent in
existing tests because they don't exercise filter-then-pagination in
the same tick.

## How to apply

**Bail out of `setSearchParams` when the write would be a no-op.**
Particularly when the call originates from a "reset-on-change" effect
that fires after another `setSearchParams` in the same batch:

```ts
const handlePageChange = useCallback(
  (page: number) => {
    if (page === 1 && !searchParams.has('page')) return // bail
    setSearchParams(
      prev => {
        /* … */
      },
      { replace: true }
    )
  },
  [searchParams, setSearchParams]
)
```

The bail makes the function depend on the freshly-rendered
`searchParams` getter (which reflects the current location), not on a
stale `prev` snapshot. The dependency change also means the callback
identity refreshes each render — fine, because consumers re-attach to
the latest one through normal prop flow.

## Telltale signs

- A `setSearchParams` call demonstrably fires (you can log it) but
  the URL ends up empty / missing the key it just wrote.
- A second `setSearchParams` (or a sibling URL-writing hook like
  `useUrlProgramYear.setSelectedDate`) runs in the same render cycle.
- The "lost" key is one that the second call's `prev`-derived `next`
  would have stripped (e.g. `delete('page')` on an empty prev).
- Tests pass for a single status read (`?status=vulnerable` mounts
  cleanly) but fail when the value has to be written from a user
  action.

## Why this matters here vs. the existing `DistrictDetailPage`

`DistrictDetailPage` has the same wiring shape but the
filter-then-pagination race wasn't covered by tests there — clicking a
filter chip was always followed by an explicit assertion on filter
state, not URL search. #570 is the first sprint where the URL contract
is asserted directly under userEvent, so the race finally surfaced.
Phase 3 (#571) will move Divisions / Global Rankings to their own
routes too — apply the same bail-on-no-op pattern when extracting
those filter callbacks.

## Related

- `frontend/src/pages/DistrictClubsPage.tsx` — `handlePageChange` bail
- `frontend/src/components/ClubsTable.tsx` — the auto-reset effect
  that triggers the same-batch `onPageChange` call
- React Router 7 [`useSearchParams` docs](https://reactrouter.com/api/hooks/useSearchParams)
  — `prev` callback semantics
- Lesson 68 — IA refactors cascade tests; this one was the tests
  cascading **into** the production code (lesson here is the new
  feedback the assertions surfaced)
