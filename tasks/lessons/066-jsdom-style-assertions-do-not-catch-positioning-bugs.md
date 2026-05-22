---
name: JSDOM style assertions don't catch positioning bugs
description: Asserting `toHaveStyle({ left: "X%" })` on an absolutely-positioned
  element confirms the inline style is set — not that the element ends up at
  X% of where you expect. If a positioned ancestor wraps the element, the %
  resolves against the wrapper's zero-width box and the visual position is wrong.
type: feedback
---

# Lesson 66 — JSDOM style assertions don't catch positioning bugs

**Date:** 2026-05-22
**Issue:** hotfix for #559 (caught by audit of live site)

## What happened

#559 zoomed the bullet bar scale into the tier band so the four
tier ticks would have room to spread. The Green commit's tests
asserted:

```ts
expect(within(bar).getByTestId('tier-tick-distinguished')).toHaveStyle({
  left: '44.82%',
})
```

All 18 tests passed. The math was right. The PR shipped to
production.

When the user audited the live site, every tier-tick label was
collapsed onto the same x-position — visually unfixed.

Root cause: the tier ticks were rendered INSIDE a `<Tooltip>` wrapper
that itself renders `<div className="relative inline-block">`. The
DOM looked like:

```html
<div role="progressbar" class="relative ...">
  <div class="relative inline-block">
    <!-- Tooltip wrapper -->
    <div class="absolute" style="left: 44.82%">D / 158</div>
  </div>
  <div class="relative inline-block">
    <div class="absolute" style="left: 53.33%">S / 161</div>
  </div>
  ...
</div>
```

`position: absolute` resolves against the nearest positioned ancestor.
The Tooltip's `relative inline-block` _is_ a positioned ancestor —
and it's a zero-width inline-block. All four ticks collapsed to ~0% of
their respective wrappers, producing the visual pile-up.

`toHaveStyle({ left: '44.82%' })` looks at the inline `style`
attribute, not at computed layout. It can't see the difference between
"44.82% of the progressbar" and "44.82% of a zero-width box". JSDOM
doesn't run a real layout engine, so even `getComputedStyle` wouldn't
help here.

## How to apply

**For absolutely-positioned elements, also assert the structural
context.** A style attribute is necessary but not sufficient — the
positioning context (nearest positioned ancestor) is part of the
semantic.

Add at least one regression test per layout that says:

```ts
// The positioned tick must be a direct child of the bar so its %
// offset resolves in the bar's coordinate space.
expect(distinguishedTick.parentElement).toBe(bar)
```

`parentElement === expectedAncestor` catches the "something wrapped my
element in a positioned div" class of bugs without requiring a real
browser. If the element needs to be exactly N levels deep (e.g. inside
a portal), assert the closest positioned ancestor with
`.closest('[class*="relative"]')` against the same expected ref.

**Telltale signs you have this kind of bug:**

- Tests pass; production looks broken.
- The element you styled has the right inline style attribute.
- Multiple sibling elements you positioned at different percentages
  visually overlap.
- A wrapper component (Tooltip, Popover, FocusTrap, etc.) was added
  recently — those often inject a positioned div.

**How to apply when adding tooltips/popovers to positioned
children:** position the OUTER wrapper of the
tooltip/popover, then put the visual content inside. Don't wrap a
positioned element in another positioned element; if you must, the
inner positioning should be relative to the outer, and that should
be deliberate.

## Related

- `frontend/src/components/KpiBulletCard.tsx` — the bullet bar
- `frontend/src/components/Tooltip.tsx` — the wrapper component that
  caused the issue (`<div className="relative inline-block">` is the
  fixed wrapper class; consumers can't opt out)
- Lesson 65 (#558) — the zoom-scale algorithm this hotfix preserves
- Lesson 49/50/51 (per earlier history) — components in isolation
  vs. under real chrome; this is the same lesson applied to positioning
