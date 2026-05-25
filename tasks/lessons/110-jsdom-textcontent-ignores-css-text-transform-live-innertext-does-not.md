---
id: '110'
category: lesson
tags: [tests, e2e, css, frontend, verification]
auto_load: true
date: 2026-05-25
issues: [669, 665]
---

# Lesson 110 — jsdom `textContent` ignores CSS `text-transform`; a live `innerText` assertion doesn't

**Date:** 2026-05-25
**Issue:** #669 (epic #665 Sprint 3 — clubs-table column model)
**PR:** [#729](https://github.com/taverns-red/toast-stats/pull/729)

## What happened

The unit guard asserted the clubs-table header order by reading
`th .clubs-col-header span.flex-1` `textContent` and comparing to
`['Club', 'Div', 'Area', …]`. It passed. The same assertion, ported verbatim
into the live Playwright smoke (`allInnerTexts()` against the PR preview),
**failed on the first run** — the received array was
`['CLUB', 'DIV', 'AREA', …]`.

The header button carries Tailwind's `uppercase` utility
(`text-transform: uppercase`). jsdom doesn't run a layout/style engine, so
`textContent` returns the **authored** string (`"Club"`). A real browser
applies `text-transform`, and Playwright's `innerText` returns the
**rendered** string (`"CLUB"`). Both were "right" about the order — the diff
was pure case, introduced by CSS the unit environment can't see.

## The trap

A header-order (or any visible-text) check that passes in jsdom on
`textContent` does **not** predict what a live `innerText` assertion sees when
the element has `text-transform` (or `::first-letter`, `content`, etc.). Port
the assertion verbatim and the live smoke fails for a cosmetic reason that has
nothing to do with the behaviour under test — burning a verification
iteration and, worse, inviting someone to "fix" the order when the order was
never wrong.

## How to apply

- **When porting a visible-text assertion from a jsdom unit test to a live
  `innerText`/`allInnerTexts()` smoke, normalize case** (`.toUpperCase()` both
  sides) — or assert order/identity, not exact casing. The live surface is the
  source of truth for _rendering_; the unit test is the source of truth for
  _DOM content_. They legitimately disagree under `text-transform`.
- If exact casing matters as a spec, assert it in **one** place against the
  representation that owns it: authored case → unit `textContent`; rendered
  case → live `innerText`. Don't cross them.
- Same family as [[066-jsdom-style-assertions-dont-catch-positioning-bugs]]:
  jsdom proves _which DOM/classes ship_, the browser proves _what renders_.
  Text-transform is the text-layer instance of that split.

## Related

- [[066-jsdom-style-assertions-dont-catch-positioning-bugs]] — the layout-layer
  sibling: jsdom can't compute position; here it can't compute rendered text.
- [[092-redesign-sprints-replace-not-augment-the-thing-being-reskinned]] — same
  sprint family; the test-isolation footgun note there is the same "verify
  under the right environment before concluding" theme.
