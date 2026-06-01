---
id: '152'
category: lesson
tags: [verification, playwright, frontend, cdn, scope]
auto_load: true
date: 2026-06-01
issues: [1058, 1055]
---

# Lesson 152 — A live-verification locator must key on the stable route, not a CDN-derived label

**Date:** 2026-06-01
**Issue:** #1058 (epic #1055 Sprint 3 — omni-search header bar)
**PR:** [#1061](https://github.com/taverns-red/toast-stats/pull/1061)

## What happened

The header omni-search Playwright smoke located a district result by its
accessible name — `getByRole('link', { name: /District 61/i })`. It passed in
the unit tests (whose fixtures set `districtName: 'District 61'`) and on the
region/Cmd-K cases, but **failed on the preview** for districts in both
engines: 4 of 8 checks red on a feature that actually worked.

Root cause was the data, not the UI. The staging CDN's `v1/rankings.json` ships
`districtName` as the **bare number** (`"61"`, `"93"`, …), not `"District 61"`.
The district result correctly renders that through `DistrictChipAndName`, whose
#522 no-duplicate guard collapses a bare-number name into just the `D61` chip —
so the rendered link's accessible name is `"D61"`, and `/District 61/i` never
matches. Regions passed because their label is built **in code**
(`` `Region ${n}` ``), independent of the CDN string.

Switching the locator to the route — `locator('a[href="/district/61"]')` —
made all 8 green. The route is derived from `districtId`, which is stable and
identical in fixtures and prod; the label is CDN-authored and varies.

## The transferable principle

**When you live-verify a result/link against deployed CDN data, key the locator
on the stable identifier the app derives (the route / `href` / `data-id`), not
on display text that the CDN authors.** Unit fixtures are the author's idea of
the data; the live payload is the real thing, and a human-readable label is
exactly the field most likely to differ (bare vs prefixed, abbreviated,
localized, re-skinned). A label-based assertion that passes in jsdom can still
be testing a string the backend never emits.

## How to apply

- Prefer `a[href="…"]` / `getByTestId` / `data-*` over `getByRole('link', {
name })` whenever the visible text comes from fetched data. Reserve
  name-based locators for labels the component builds itself (here: regions).
- When a label-based live assertion fails on a feature you can see working,
  suspect the CDN string before the component — `curl` the actual
  `rankings.json` / index and read the field, don't assume the fixture shape.
- The chip-vs-name divergence is a known local trap: `DistrictChipAndName`
  hides the name when it equals the id (#522), so "the district's name" is not
  reliably on screen as text at all.

## Related

- [[149-a-responsively-duplicated-component-needs-a-visible-selector-in-live-verification]]
  — sibling lesson: the live-drive locator must target what the user actually
  sees; here the failure mode is the label's _content_, there it's the hidden
  twin.
- [[115-a-fields-name-and-comment-can-lie-about-whether-its-populated]] — same
  theme one layer down: don't trust the fixture/comment about a field's live value.
- `frontend/src/components/DistrictChipAndName.tsx` (#522 guard),
  `frontend/src/services/searchIndex.ts` (region label built in code).
