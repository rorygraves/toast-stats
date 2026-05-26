---
id: '111'
category: lesson
tags: [css, accessibility, frontend, tests, playwright, dark-mode]
auto_load: true
date: 2026-05-26
issues: [671, 665]
---

# Lesson 111 — A native `<select>` ignores `min-height` in WebKit; the 44px touch target needs `appearance:none`

**Date:** 2026-05-26
**Issue:** #671 (epic #665 Sprint 5 — clubs-table responsive)
**PR:** [#732](https://github.com/taverns-red/toast-stats/pull/732)

## What happened

The mobile clubs sort control is a native `<select>`. To hit the WCAG 2.5.5 /
handoff 44px touch-target floor I added `min-height: 44px` to
`.clubs-mobile-select`. The Chromium preview smoke passed at 44px. The **WebKit**
half of the same dual-engine smoke (#710) failed: the select measured **20px**
tall. `appearance: none` was missing.

A native form control (`<select>`, and to a lesser degree `<input type=date>`,
`<input type=checkbox>`) is drawn by the platform at its **intrinsic** size in
WebKit/Safari. `min-height` / `height` / vertical `padding` are largely ignored
until you opt out of native rendering with `appearance: none`
(`-webkit-appearance: none`). Chromium honours `min-height` on a styled select,
so a Chromium-only check reports a 44px box that **iOS Safari renders at ~20px** —
a real, shipped touch-target defect on the single most important mobile engine.

## The fix

```css
.clubs-mobile-select {
  appearance: none; /* opt out of native sizing so min-height applies */
  min-height: 44px;
  padding: 0 28px 0 10px; /* room for a custom caret on the right */
  background-image: url('data:image/svg+xml,…chevron…'); /* native arrow is gone */
  background-repeat: no-repeat;
  background-position: right 10px center;
}
/* the caret is an asset, so it needs a dark-mode variant (lesson 096) */
[data-theme='dark'] .clubs-mobile-select {
  background-image: url('…lighter…');
}
```

`appearance: none` removes the platform dropdown arrow, so you must supply your
own affordance (a background-SVG caret here). The caret is a baked-in colour, not
a theme token, so it needs an explicit `[data-theme='dark']` swap or it
disappears on dark surfaces — the same trap as lesson 096.

## How to apply

- **Setting a min size on a native control? Add `appearance: none` in the same
  rule, or the size silently won't apply in WebKit.** This covers the whole
  family — sizing a `<select>`/`<input>` to a touch target, a row height, or a
  custom look all depend on opting out of native rendering first.
- **Verify touch targets in WebKit, not just Chromium.** Engines disagree on
  how native controls honour CSS box properties; a Chromium-green 44px assertion
  is not iOS truth. The dual-engine preview smoke (#710) is what caught this —
  same diagnostic family as lesson 108 (measure the engine that actually ships).
- After `appearance: none`, re-supply the removed affordance (dropdown caret,
  checkbox tick) **and** give it a dark-mode variant if it's a coloured asset.

## Related

- [[108-verify-a-sticky-header-by-measuring-the-sticky-cell-not-the-thead-wrapper]]
  — same family: a layout assertion that's green in one engine and wrong in the
  other; drive the real surface in both.
- [[096-the-catch-all-darkmode-sweep-is-where-the-loyal-token-traps-hide]] — a
  baked-colour asset (here the caret SVG) needs an explicit dark variant.
- [[105-match-the-mobile-table-pattern-to-the-datas-purpose-not-a-sibling-tables-precedent]]
  — the same sprint's card-collapse decision; this is the touch-target half.
