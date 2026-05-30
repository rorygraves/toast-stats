---
id: '145'
category: lesson
tags: [router, react, hooks, frontend, scope]
auto_load: true
date: 2026-05-30
issues: [979, 969]
---

# Lesson 145 — A URL param that's a pipeline step layered on the filtered set must NOT join the wholesale filter-reconcile key set

**Date:** 2026-05-30
**Issue:** #979 (epic #969 Sprint 3 — deep-link the Clubs "Close to Distinguished" preset + RegionsPage region finder)
**PR:** [#988](https://github.com/taverns-red/toast-stats/pull/988)

## What happened

The clubs page round-trips its column filters through the URL via one
**wholesale reconcile** (`clubFilterUrl` + `FILTER_PARAM_KEYS`): on any filter
change it deletes _every_ key the codec owns, then re-emits only what
`filterStateToParams(state)` produces. This is the lesson-070 fix — reconciling
the full set sidesteps the same-batch `prev`-snapshot clobber.

Deep-linking the "Close to Distinguished" preset (`?preset=`) looked like "just
add `preset` to the codec." But the preset is **not a column filter** — it's a
separate pipeline step (R11) layered on top of the already-filtered rows, and
`filterStateToParams` never emits it. So folding `preset` into
`FILTER_PARAM_KEYS` would mean the reconcile **deletes** `preset` on _every_
filter change and never re-adds it — the deep link would silently evaporate the
moment the user touched any other filter.

## The principle

**A param that the wholesale-reconcile codec doesn't itself emit must not live
in that codec's delete-list.** A "delete-all-then-re-emit-present" reconcile is
only safe for params the reconcile fully owns (reads _and_ writes). A param that
represents a concept the codec doesn't model — a preset toggle, a view mode, a
selection that sits beside the filters rather than among them — needs its **own
single-writer handler** with a disjoint key, exactly like the page's existing
`sort`/`dir` seam: own `setSearchParams(prev => …)`, `{ replace: true }`,
read-once-on-mount for the initial value, live state owned downstream and pushed
back via a callback (R3). Disjoint keys + distinct user gestures ⇒ the two
writers never co-occur in one batch, so there is no lesson-070 race to fix.

This is the **inverse** of lesson 070: 070 says _fold sibling writes into one
reconcile_ to dodge the same-batch clobber; 144 says _don't fold a param the
reconcile can't round-trip_ — give it a separate writer instead. The deciding
question is not "is it filter-ish?" but "does the reconcile both read AND
emit it?" If not, it belongs outside `FILTER_PARAM_KEYS`.

## How to apply

- Before adding a key to a `DELETE_KEYS`/`FILTER_PARAM_KEYS`-style reconcile
  list, confirm the reconcile's writer actually emits it. If the writer can't
  produce the key, the delete-list will strip it and nothing will restore it.
- Lock the contract with a test that asserts the param is **not** in the
  reconcile set (here: `clubFilterUrl.test.ts` — `expect(FILTER_PARAM_KEYS).not
.toContain(PRESET_PARAM)`), so a future "tidy-up" that folds it in goes red.
- Keep the param's name/value/parse in the same codec _module_ (one URL
  contract, no parallel scheme) even while keeping it out of the reconcile
  _list_ — module membership and delete-list membership are different things.

## Related

- [[070-setSearchParams-prev-races-in-batched-updates]] — the same-batch
  clobber this reconcile exists to dodge; 145 is its inverse (when NOT to fold).
- [[124-validate-url-synced-range-state-at-the-page-not-the-picker]] — the page
  owns URL state and validates it; the preset's single writer lives there too.
- `frontend/src/utils/clubFilterUrl.ts`, `frontend/src/pages/DistrictClubsPage.tsx`
  (`handlePresetChange`, disjoint from `handleFilterChange`).
