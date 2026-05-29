# Plan — #887 Epic G Sprint 3: dual-engine 44px touch-target tripwire

**Epic:** #888. **Predecessor:** #886 (CLOSED — fixed families A/B/C). **Branch:** `sprint-887-touch-target-tripwire` (from `origin/main` @ e02bc698 — R19).

## Goal

A _permanent_ regression guard so every interactive element on every routed page
keeps the 44×44px floor in **both** Chromium and WebKit. Locks in #886; catches a
future regression of families A (chip-select overlays), B/C (region chips), or any
new sub-44 control.

## Design

1. **Drift-proof selector source (R20 spirit).** Export `INTERACTIVE_SELECTORS`
   from `frontend/src/utils/touchTargetUtils.ts`; have `getAllInteractiveElements`
   and `useTouchTarget` both consume it (kills the existing duplicate). The e2e
   smoke imports the same const → audit/product/test cannot drift.
2. **`frontend/e2e/touch-targets.smoke.ts`** — drives the 15 route shapes from the
   #885 audit at 375×812, in both engines (existing `smoke`=Chromium /
   `webkit`=Safari projects). On each route:
   - inject `INTERACTIVE_SELECTORS`, query visible (display≠none, visibility≠hidden)
     interactive elements (mirrors product filter).
   - measure `getBoundingClientRect()`; flag any < 44 in either dimension (L108/134:
     real geometry, not `toBeVisible`/className).
   - **Exempt** inline prose `<a>` (computed `display:inline`, not role=button) per
     WCAG 2.5.5 / audit §method; **skip** sr-only collapsed elements (≤1px box —
     `.tm-skip-link` is 1×1 off-screen at rest).
   - **Non-vacuity floor:** assert ≥1 interactive element measured per route (a
     blank/broken page must not pass green).
   - settle on `document.fonts.ready` + rankings-table visible before measuring.
3. **CI wiring** — add a step to `pr-preview.yml` running the smoke against the
   deployed preview in both projects (mirrors the regions-legibility step, #713:
   install chromium+webkit first).

## Falsifiability (red proof)

Tripwire is a guard on already-fixed code, so the "red" is demonstrated by running
it against a **pre-#886 build** (lesson 133: serve each git state) → must flag
families A/B/C (45 instances). Green = current build/preview, 0 failures, both
engines. Both recorded in the evidence comment.

## Out of scope

No product UI change (the floor already ships via #886). No new route coverage
beyond the audited 15 shapes (component-level families; params don't change them).
