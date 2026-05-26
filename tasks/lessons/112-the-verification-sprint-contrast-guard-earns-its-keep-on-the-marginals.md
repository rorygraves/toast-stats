---
id: '112'
category: lesson
tags: [accessibility, css, dark-mode, tests, frontend]
auto_load: true
date: 2026-05-26
issues: [672, 665]
---

# Lesson 112 — A "verification pass" contrast guard earns its keep on the marginals the eye and hand-math miss

**Date:** 2026-05-26
**Issue:** #672 (epic #665 Sprint 6 — clubs-table a11y + verification pass)

## What happened

Five careful re-skin sprints (#667–#671) built the clubs table on redesign
tokens, each with dark-mode contrast in mind. By Sprint 6 — the "a11y +
verification pass" — the expectation was that the new contrast guard would be
pure ceremony: render the audit, watch it pass, ship. Hand-math on the obvious
combos (tier-pill white-on-fill, `--ink-3` muted text on the surfaces) all
cleared AA with comfortable margins (5–10:1), reinforcing the "this is just a
guard" framing.

The CSS-parsing audit (modelled on the #608→#670 harness — resolve each token
through the `[data-theme]` map, assert the ratio) caught **two** genuinely
sub-threshold values that the five prior sprints, the eye, and back-of-envelope
math had all missed:

1. **A graphical-tier muted token on an off-white surface.** The sort caret is
   `var(--ink-4)`. On pure white `--ink-4` (#8b94a3) is 3.06:1 — just over the
   3:1 non-text floor. But the caret lives in the sticky header, which is
   `--surface-2` (#f9fafb, _off_-white), where it drops to **2.93:1**. The 0.13
   the surface isn't white costs the compliance.
2. **Text over the darker band of a striped fill.** The "projected" tier pill
   is dark text on a 45° `repeating-linear-gradient` of `--yellow-500`/`-600`.
   Against the _lighter_ band it's fine; against the **darker** band
   (`--yellow-600` #c9b748) the text was **4.27:1** — below AA. Auditing a
   striped/gradient bg against its single fill colour would have missed it;
   the worst band is the binding one.

## The principles

- **A contrast guard added "just to verify" is worth writing precisely because
  the marginals don't announce themselves.** The failures aren't the headline
  combos (those get hand-checked during the re-skin); they're the
  near-threshold ones a human rounds to "fine." Size the audit to catch 0.1-off
  cases, and include every surface a token actually lands on — not just the
  canonical one.
- **Marginal contrast failures cluster in two predictable places.** (a) A
  _graphical-tier_ muted token (carets, pips, axis labels — designed to sit
  near the 3:1 floor) on a _non-white_ near-surface; the surface being slightly
  off-white is enough to push it under. (b) _Text over a multi-band / striped /
  gradient_ background — audit the **darkest** band the text crosses, not the
  average or the lightest.
- **The light-side analog of a dark-mode token fix is a separate, real gap.**
  `--ink-4` was lightened in dark mode back in #610 (lesson 095) for exactly
  this "muted token below the floor on the lighter surface" reason. The **light**
  `--ink-4` never got the mirror treatment and quietly sat at 2.93:1 on
  `--surface-2`. Fixing one theme's muted token does not fix the other's — they
  are independent values with independent surfaces. When you bump a muted token
  for dark, check whether the light value has the same disease.

## How to apply

- When you add a contrast audit expecting it to pass, treat a green run as
  _unproven_ until you've (a) included every background a token lands on
  (sticky header `--surface-2`, hovered row `--surface-3`, not just the resting
  `--surface`), and (b) proven it falsifiable by injecting a known-bad value
  (lesson 107). The audit that "just passes" on the canonical surface is the one
  that misses the off-white one.
- For a striped/gradient fill, assert text contrast against the **darkest** band.
- Fix a sub-floor _graphical_ muted token at the **token** level (global, R10)
  when it's monotonic-safe (strictly darker in light mode → contrast only
  rises), not with a component-scoped override — every caret/pip/axis-label
  consumer benefits and none can regress. Lock the new value with the audit and
  the token-pin test, and mirror lesson 095's "sized for the surface it lands
  on" note in the comment.

## Related

- [[095-darkmode-token-bumps-must-be-sized-for-the-lightest-surface]] — the
  dark-side instance of the same `--ink-4` muted-token-below-the-floor fix;
  this is its light-side mirror, plus the off-white-surface and striped-band
  marginals.
- [[075-axe-core-jsdom-and-the-allowlist-pattern]] — why the static CSS-parsing
  audit exists at all (JSDOM axe can't compute contrast).
- [[107-css-audit-matcher-must-exclude-pseudo-class-rules-or-hover-shadows-the-resting-state]]
  — prove the audit is falsifiable; scope it to the resting state.
