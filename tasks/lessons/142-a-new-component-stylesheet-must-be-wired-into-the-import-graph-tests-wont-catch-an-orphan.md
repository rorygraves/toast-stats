---
name: 142-a-new-component-stylesheet-must-be-wired-into-the-import-graph-tests-wont-catch-an-orphan
category: lesson
tags: [css, frontend, verification, tests, accessibility]
issue: 903
date: 2026-05-30
created: 2026-05-30
---

# A new component stylesheet must be wired into the @import graph — tests won't catch an orphan

Sprint 3 (#903) added `frontend/src/styles/clubs-table.css` for the new
"Close to Distinguished" preset chip, but never added it to the `@import` list in
`frontend/src/index.css`. The file was therefore dead: the chip rendered as a
bare `<button>` — sub-44px tap target (fails the touch-target gate, #885), no
pressed-state affordance, no dark-mode inheritance.

**Why nothing caught it:** every unit test asserted on `role`, `aria-pressed`,
and text — never on computed style. JSDOM doesn't load the cascade, so an
orphaned stylesheet passes the entire unit suite green. The fresh-context
`/review` agent caught it by grepping the import graph, not the tests.

**How to apply:**

- A brand-new `.css` file is inert until something imports it. This codebase
  loads component styles through the `@import` chain in `index.css` (not via
  per-component `import './x.css'`, and not auto-globbed). Add the `@import`
  line in the same commit as the new file.
- When a CSS change carries an a11y contract (44px target, contrast, focus
  ring), unit tests are not sufficient evidence — verify on the live preview
  (a Playwright bounding-box / computed-style check, or eyes on the rendered
  screenshot).
- Smell test before commit: `grep -r <new-file-basename> src` should return at
  least the import site, not just the file itself.
