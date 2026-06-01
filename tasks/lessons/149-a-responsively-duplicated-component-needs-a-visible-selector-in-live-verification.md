---
id: '149'
category: lesson
tags: [verification, playwright, frontend, responsive, charts, scope]
auto_load: true
date: 2026-05-31
issues: [1023, 1022]
---

# Lesson 149 — A responsively-duplicated component needs a `:visible` selector in live verification (or the assertion hits the hidden twin)

**Date:** 2026-05-31
**Issue:** #1023 (epic #1022 Sprint 1 — disambiguate the Overview/Trends net-change labels)
**PR:** [#1039](https://github.com/taverns-red/toast-stats/pull/1039)

## What happened

The district Trends route renders `MembershipTrendChart` **twice** — a mobile
layout and a desktop layout in the same DOM, one hidden via `display:none` at the
active breakpoint (a common responsive pattern here: render both, let CSS pick).
A new inline secondary line (`since first snapshot (<date>) · member counts`) was
added to disambiguate the −45 member-count delta from the Overview's −8
payments-vs-base delta.

A naive Playwright assertion — `page.getByText('since first snapshot …')` or a
bare `locator('p:has-text(...)')` — resolves to the **first match in DOM order**,
which is the _hidden_ twin. `expect(...).toBeVisible()` then fails on a feature
that actually works (the visible copy is right there on screen), and a strict
locator would alternatively throw "resolved to 2 elements." Either way the
verification lies about a correct change.

The fix is to pin the selector to the rendered instance:
`locator('p:has-text("since first snapshot"):has-text("member counts"):visible').first()`.
The same applies to any text/role assertion driven against a surface that mounts a
component once per breakpoint.

## The transferable principle

**When live-verifying a component that is rendered more than once for responsive
layout (render-both + CSS-hide), every text/role selector must carry `:visible`
(or scope to the active layout's container) — a DOM-order match silently targets
the hidden twin.** Unit tests don't expose this (jsdom has no layout, so
`display:none` doesn't hide and there's usually one mount in the test fixture);
it only bites on a real browser drive. So the trap is invisible right up until the
PR-preview Playwright step — exactly where you're trusting the result to ship.

## How to apply

- Before asserting on a district/landing surface in Playwright, grep the page for
  the component: if it appears in two breakpoint branches, add `:visible` to the
  locator and `.first()` to be explicit. Don't assume one mount.
- A failing `toBeVisible()` on copy you can plainly see in the screenshot is the
  signature — check for a hidden duplicate before suspecting the feature.
- Capture the screenshot from the same `:visible`-scoped drive so the evidence and
  the assertion agree on which instance they mean.

## Related

- [[134-de-table-the-row-and-verify-unclipped-by-bounding-box-not-tobevisible]]
  — same theme: a live-browser assertion must measure the thing the user sees, not
  a proxy the DOM happens to expose first.
- [[138-a-verify-on-the-pr-preview-sprint-needs-a-diff-that-actually-triggers-the-preview]]
  — the preview drive is the gate this lesson protects; a wrong selector wastes it.
- `frontend/src/components/MembershipTrendChart.tsx` (the "Net Change" stat +
  secondary line), `frontend/src/pages/DistrictTrendsPage.tsx` (the dual mount).
