---
name: Invisible <select> overlay needs explicit focus-within ring (WCAG 2.4.7)
description: When a styled chip wraps an absolutely-positioned opacity-0
  <select>, the parent label loses the browser's default focus ring. Add
  `focus-within:ring-*` so keyboard users still see focus.
type: feedback
id: '058'
category: lesson
tags: [accessibility, css, frontend]
auto_load: true
date: 2026-05-15
---

# Lesson 58 — Invisible `<select>` overlays lose focus visibility (WCAG 2.4.7)

**Date:** 2026-05-15
**PR:** #532 (Sprint A/B/C of epic #528 — DataControlsBar)

## What happened

Built `<DataControlsBar>` chips using a common React pattern: a styled
`<label>` wraps an absolutely-positioned `<select>` with `opacity: 0`.
This keeps full native keyboard / popover / mobile / screen-reader
behaviour for free without re-implementing a Listbox.

Three reviewer agents flagged it. Specifically the efficiency reviewer
caught a WCAG 2.4.7 (Focus Visible) violation: the `<select>` is still
keyboard-focusable, but its `opacity: 0` removes the browser's default
focus ring. A keyboard user tabbing through the toolbar gets **zero
visible feedback** that the chip has focus.

## Fix

Add a `focus-within` ring on the parent `<label>`:

```tsx
className={`${CHIP_BASE} relative cursor-pointer
  focus-within:ring-2 focus-within:ring-tm-loyal-blue
  focus-within:ring-offset-1`}
```

The styled chip lights up exactly when the invisible `<select>` gets
focus.

Also: the `aria-label` on the `<select>` should include the current
value, e.g. `Snapshot date: Mar 15, 2026`. Without it, screen readers
hear only the field name, never the current value (because the visible
display text is in the `<span>` outside the `<select>`).

## How to apply

**Whenever you stack an invisible interactive element over visible
chrome:**

1. Test it with the keyboard. Tab through. Can you tell when the
   element has focus? If not, you have a 2.4.7 violation.
2. Move the focus ring to the visible parent via `focus-within:`.
3. If the `aria-label` doesn't already announce the visible state,
   stitch it in.

This pattern is appearing more often as we lean on native primitives
for a11y — `<select>` overlays, hidden file `<input>`s under styled
buttons, hidden checkboxes under custom toggles. Same lesson applies
to all of them.

## Related

- `frontend/src/components/DataControlsBar.tsx` — `ChipSelect` helper
- WCAG 2.4.7 Focus Visible: https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html
