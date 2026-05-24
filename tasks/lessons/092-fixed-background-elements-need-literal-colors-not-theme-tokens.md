---
id: '092'
category: lesson
tags: [dark-mode, css, frontend]
auto_load: true
date: 2026-05-23
issues: [618, 617, 638, 639]
---

# Lesson 092 — A fixed-background element needs literal text colours, not theme tokens

**Date:** 2026-05-23
**Issue:** #618 (Club redesign Sprint 1, epic #617) — PRs #638 + #639
**Tags:** css, dark-mode, accessibility, axe, design-tokens, live-verification

## What happened

The redesigned club hero has health/DCP-tier "pills" with a **hardcoded white
background in both light and dark themes** (`background-color: #ffffff`). The
pill _text_ colours were written with semantic theme tokens —
`var(--ink)`, `var(--green-600)`, `var(--yellow-600)`.

In light mode every pill passed axe colour-contrast. The component test suite
(jsdom) can't compute stylesheet colours, so it was silent on the issue. The
in-repo accessibility tests render light mode. Everything looked green.

The **live dark-mode axe scan** on `ts.taverns.red` (injected from CDN during
the #618 verification gate) flagged the Distinguished tier pill at **2.27:1** —
`#22c55e` on white. The reviewer had already caught the same shape on the
_thriving_ pill pre-merge; the live gate found the _whole class_ of it.

## Root cause

`redesign.css` dark-mode remaps the status palette so it reads on dark
_surfaces_: `--green-600` light `#15803d` → dark `#22c55e`. That lift is
correct for text on `--surface`. But the pill background is **not** a surface —
it's a fixed white. So in dark mode:

- `--ink` flips to near-white `#eef2f7` → **white-on-white** (watch/at-risk pills),
- `--green-600` → `#22c55e` → 2.27:1 (tier-distinguished),
- `--yellow-600` `#c9b748` is ~1.85:1 on white in **both** themes (President's).

A theme token encodes "this colour adapts to the active theme's surfaces." When
the background does **not** adapt, the token is the wrong abstraction — it
introduces a contrast bug precisely _because_ it does its job.

## Fix

Pin every pill text colour to a literal that passes AA on white, regardless of
theme: base/watch/at-risk `#0f1720`, thriving/distinguished `#0d6b2f`, select
`#004165`, President's `#5a4a14`, maroon `#7b1828`. Light mode is unchanged
(the literals equal the light-mode token values); dark mode now passes.

## How to apply

- **If an element's background is a fixed literal (not a `--surface`/`--bg`
  token), its foreground must be a fixed literal too.** Mixing a theme-adaptive
  token on a non-adaptive background is a latent dark-mode contrast bug. Audit
  every `background-color: #fff` (or any hardcoded bg) for token-based text.
- **jsdom component tests and light-only a11y tests will not catch this.**
  Computed-style contrast needs a real browser in the actual theme. Put a
  **dark-mode axe scan in the live-verification gate**, scoped to the surfaces
  you changed (`axe.run({ include: [...] }, { runOnly: ['color-contrast'] })`),
  injected from CDN so it adds no dependency.
- **Fresh-context review caught one instance; the live gate caught the class.**
  Both layers earned their keep. When a reviewer flags "X fails in dark mode,"
  treat it as a _pattern_ to sweep, not a single line to patch — the same root
  cause usually has siblings (here: 1 thriving pill → 5 more pill variants).

## Related

- [[081-phase-gated-deferral-tests-move-with-the-spec]] — same family: the
  visual/theme detail that unit tests structurally can't see.
- [[090-vitest-project-split-needs-a-partition-guard]] — measure/scan against
  the real tool's output (vitest list / live axe), not a jsdom proxy.
