---
id: '139'
category: lesson
tags: [css, frontend, accessibility, router, verification, playwright, mobile]
auto_load: true
date: 2026-05-29
issues: [878, 880]
---

# Lesson 139 — A TOC-anchor jump fired from inside a scroll-locked sheet has three independent scroll-clobbering traps; only live measurement separates them

**Date:** 2026-05-29
**Issue:** #878 (epic #880 Sprint 2 — sticky "Jump to ▾" chip + TOC sheet on /methodology)
**PR:** [#935](https://github.com/taverns-red/toast-stats/pull/935)

## What happened

The chip opens the TOC as a modal **sheet** (`role="dialog"`, body
`overflow:hidden` while open), and tapping a section link should close the
sheet and jump to that `#section`. The unit/integration tests were green (they
assert `aria-expanded` flips, not geometry — jsdom can't see layout, L66). On
the live 375px preview the jump kept landing the heading at the very top of the
viewport, **behind the new sticky chip bar** — i.e. the exact "obscures
content" failure the acceptance criterion forbids. It took three separate fixes,
each isolated by _measuring on the preview_, not by reasoning:

1. **Stale offset.** `scroll-margin-top: 80px` (Sprint 1, sized for the 56px top
   bar alone) no longer clears the ~61px chip bar stacked under it. Bump to
   124px **only at `<768px`** (the chip is mobile-only). A sticky element added
   _above_ anchored content silently invalidates every downstream
   `scroll-margin-top` — same family as L138.
2. **Native hash scroll fires while scroll is locked.** Clicking `<a href="#id">`
   while the sheet still has `body{overflow:hidden}` computes the fragment
   scroll against the locked state and ignores `scroll-margin-top`.
   `preventDefault()` and drive `el.scrollIntoView({block:'start'})` yourself
   **after** `close()` unlocks scroll + `onJump()` expands the target (double
   `requestAnimationFrame`). `scrollIntoView` honours `scroll-margin-top`;
   the native locked scroll did not.
3. **Focus-restore scrolls back to the trigger.** The dialog's focus-trap
   restores focus to the opener on close; the opener (the chip) sits near the
   **top** of document flow, so `chip.focus()` scrolled the page back up and
   clobbered the jump. Restore with `focus({ preventScroll: true })`.

## The verification trap on top of all that (the part that cost the most)

Even with the product correct, the Playwright smoke still read `headingTop ≈ 9`.
`scroll-behavior: smooth` is set globally, so the jump **animates ~900ms and
overshoots the target, pausing ~90ms at the overshoot before correcting back**.
L138's `expect.poll(scrollY > 0)` returns mid-flight; a naive "two equal frames"
settle check **false-positively settles on the overshoot plateau**. A live diag
(`setInterval` sampling `scrollY`) showed the truth: `[…1107,1109,1109,1090,
1050,…,994,994,994]` → final `getBoundingClientRect().top === 124`, exactly the
offset. The product was right the whole time. Fix the _measurement_: require
`scrollY` unchanged for ≥8 consecutive 30ms polls (~240ms, longer than the
overshoot plateau) before asserting geometry.

## How to apply

- Adding a sticky/fixed bar above anchored content? Re-derive `scroll-margin-top`
  for **every** anchor target to clear the new chrome's full stacked height,
  scoped to the breakpoint where the chrome exists.
- A hash/anchor jump triggered from inside a scroll-locked modal must
  `preventDefault` and scroll **programmatically after unlock** — the native
  scroll is computed against `overflow:hidden`.
- Restoring focus to a near-top trigger on dialog close needs
  `focus({ preventScroll: true })`, or it scrolls the page to the trigger.
- Verifying a _smooth_-scroll landing: poll until `scrollY` is **stable across a
  window longer than the overshoot plateau**, not until it is merely `> 0` or
  "two equal frames." Confirm with a `scrollY` time-series diag before blaming
  the product — here all three product fixes were real, but the final red was
  the test measuring the overshoot.

## Related

- [[138-scroll-margin-top-belongs-on-the-element-that-holds-the-anchor-id]]
  — the Sprint 1 predecessor: which element carries the offset, and `scrollY`
  settles a tick after the click. This sprint extends it: a sticky bar
  invalidates the offset value, and smooth scroll overshoots the settle.
- [[134-a-status-chip-in-an-overflowing-table-is-still-clipped-detable-the-row]]
  — verify mobile geometry by bounding box, and measure after `fonts.ready`.
- [[130-a-debounced-outward-push-must-gate-on-the-debounce-having-settled]]
  — same shape one layer over: assert on the _settled_ value, not a transient.
- `frontend/src/components/JumpToChip.tsx`,
  `frontend/src/styles/components/app-shell.css` (`.methodology-section`
  `@media (max-width: 767px)`).
