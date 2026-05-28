---
id: '131'
category: lesson
tags: [css, frontend, scope, responsive, architecture]
auto_load: true
date: 2026-05-28
issues: [861, 865]
---

# Lesson 131 — The class-cardinality check must cover EVERY shared class your CSS diff touches, not just the headline one

**Date:** 2026-05-28
**Issue:** #861 (epic #865 Sprint 1 — landing mobile hoist) — surfaced by the
fresh-context review before push.

## What happened

The sprint hoisted the landing hero search and demoted the KPI strip to one
tile on mobile. Lesson 120 was top of mind, so I deliberately did **not** touch
`.districts-page` (the known route-family-shared chrome) and instead introduced
a new landing-only `.districts-hero-stack` wrapper. Good.

But the same diff also nudged a breakpoint on `.districts-kpi-strip`
(`min-width: 640px` → `768px`) so the lone demoted tile wouldn't sit in a
half-width 2-col grid cell. `.districts-kpi-strip` is **also shared** — RegionPage
(`pages/RegionPage.tsx`) renders a 4-card strip with the same class and no
`--secondary` demotion. So the "landing" breakpoint change silently reflowed
RegionPage's strip from 2-col to 1-col in the 640–767 band: an out-of-scope
visual regression on a page the sprint never meant to touch, untested (its
responsive test only covers the table), and invisible in jsdom (Lesson 66).

The fix: revert the shared rule and scope the re-collapse to
`.districts-hero-stack .districts-kpi-strip` so only the landing strip is
affected.

## The transferable point

**Applying the Lesson-120 cardinality check to the _obvious_ class is not
enough — run it on every class-scoped rule the diff edits.** I cleared the
headline class (`.districts-page`) and felt safe, but a secondary helper class
(`.districts-kpi-strip`) edited later in the same diff carried the identical
"looks page-local, is actually shared" trap. The blind spot moves to whichever
shared class you _didn't_ consciously vet.

Concretely: for each selector your CSS diff changes, run
`grep -rl 'className="<class>"' src/pages src/components` (or `<class>` for
template usages). >1 page hit = the change is route-family-wide. Do this for the
grid/strip/row helper classes too, not just the `*-page` wrapper — helpers are
the ones that look incidental and get shared the most.

## How to apply

- Before pushing a CSS diff, list every class selector it touches and confirm
  each one's consumer count. A breakpoint tweak on a "strip"/"grid"/"row" helper
  is as scope-sensitive as a change to the page wrapper.
- When a shared class needs page-specific behaviour, scope via an
  ancestor-qualified selector keyed off a page-local wrapper
  (`.districts-hero-stack .districts-kpi-strip`), never by editing the shared
  rule.
- A fresh-context review caught this where the author's "I already handled the
  sharing" confidence hid it — exactly the [[120-a-css-class-named-as-a-page-may-be-shared-chrome-for-a-whole-route-family]]
  blind spot, one class deeper.

## Related

- [[120-a-css-class-named-as-a-page-may-be-shared-chrome-for-a-whole-route-family]]
  — the parent lesson (verify class→page cardinality before a class-scoped CSS
  edit). This one adds: do it for _every_ class in the diff, not just the named
  page class.
- [[066-jsdom-style-assertions-do-not-catch-positioning-bugs]] — why the
  RegionPage reflow was invisible to the unit suite and only a live/visual check
  (or counting consumers) would surface it.
