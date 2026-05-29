---
id: '138'
category: lesson
tags: [css, accessibility, frontend, tests, playwright]
auto_load: true
date: 2026-05-29
issues: [886, 888]
---

# Lesson 138 — An `inset-0` overlay is sized to its container's PADDING box; a 1px border on the chip steals from the touch target

**Date:** 2026-05-29
**Issue:** #886 (epic #888 Sprint 2 — touch-target sweep)
**PR:** [#943](https://github.com/taverns-red/toast-stats/pull/943)

## What happened

The chip controls (`DataControlsBar`, `DatePairPicker`) are a visible `<label>`
with a full-bleed `absolute inset-0 opacity-0 <select>` overlaid — the select is
the real touch target. Audit #885 measured them 30–34 px tall. The obvious fix:
add `min-h-[44px]` to the visible label so the `inset-0` overlay follows.

It didn't reach 44. The dual-engine preview smoke (#710 pattern) measured the
select at **42 px in BOTH Chromium and WebKit** — short by exactly the label's
border (1 px top + 1 px bottom).

**Why:** the containing block of an absolutely-positioned element is the
**padding box** of its nearest positioned ancestor — _inside_ the border. So
`inset-0` sizes the overlay to `label height − borders`. A 44 px label with a
1 px border has a 42 px padding box, so the `inset-0` select is 42 px. Lifting
the bordered label can never make the offset-driven overlay clear 44; the border
is subtracted every time.

## The fix

Put the floor on the overlay itself, not the bordered label:

```tsx
// the <select> IS the tap target
className =
  'absolute inset-0 opacity-0 cursor-pointer appearance-none min-h-[44px]'
```

`min-h-[44px]` on the select wins over the 42 px offset-resolved height
(over-constrained abs positioning drops `bottom`, keeps `top`, honours
min-height). `appearance-none` is the Lesson 111 insurance: once you rely on
`min-height` on a native `<select>` rather than pure offset-sizing, WebKit can
fall back to intrinsic native sizing unless you opt out of native rendering.
Keep `min-h-[44px]` on the label too, so the _visible_ chip matches the tap area
(WCAG 2.5.5 spirit — the affordance shouldn't be smaller than the target).

Result: 44 px in both engines on every chip family.

## How to apply

- **`inset-0` (or `top/bottom:0`) sizes to the PADDING box, not the border
  box.** If the positioned ancestor has a border, an overlay sized to fill it is
  `2 × border` short. Put the size floor on the overlay, or make the ancestor's
  _padding box_ the target dimension.
- **A jsdom class-contract test cannot catch this** — it asserts `min-h-[44px]`
  is present, which it was on the label, while the rendered geometry was still 42. The 2 px deficit only appeared in the **live browser** smoke. Pair the
  contract test (fast, locks the class) with the dual-engine geometry smoke
  (slow, proves the pixels) — neither alone is sufficient (L66).
- This is the same diagnostic family as L111 (measure the engine that ships) —
  but the root cause here is the **box model**, not WebKit's native-control
  quirk. The smoke caught it precisely because it measures `boundingBox()`, not
  a className.

## Related

- [[111-native-select-ignores-min-height-in-webkit-defeating-touch-targets]] —
  sibling: `appearance-none` to make WebKit honour `min-height`; this lesson is
  the box-model half (the border-steals-from-inset-0 trap).
- [[108-verify-a-sticky-header-by-measuring-the-sticky-cell-not-the-thead-wrapper]],
  [[134-a-status-chip-in-an-overflowing-table-is-still-clipped-detable-the-row]]
  — measure the real box, not a proxy (`toBeVisible`, a wrapper, or a class).
