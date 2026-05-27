---
id: '124'
category: lesson
tags: [router, react, hooks, frontend, verification]
auto_load: true
date: 2026-05-27
issues: [794, 797]
---

# Lesson 124 — Validate URL-synced range state at the page that owns it, not at the picker

**Date:** 2026-05-27
**Issue:** #794 (epic #797 Sprint 2 — arbitrary from/to date-pair picker)

## What happened

The "What Changed" page added a `?from=&to=` date-pair picker (`useUrlDatePair`

- `DatePairPicker`). The natural instinct is to make the **picker** enforce a
  valid pair — e.g. only offer `to` dates after the selected `from`. But the pair
  is URL state: a shared or hand-edited link (`?from=2026-05-26&to=2026-05-20`)
  arrives **without ever going through the picker's option list.** Any constraint
  expressed only in the dropdown is bypassed by the very mechanism (a shareable
  URL) the feature exists to support.

R17 ("an explicit case for every value") then bites twice, not once. `from ===
to` is the obvious invalid shape and got a guard early; `from > to` is the
second one and was initially missed — it silently rendered **reversed,
negative deltas** under a "Changes … from May 26 to May 20" header, because
`delta = to − from` is honestly negative and `dayCount` is `Math.abs`-padded so
the gap looked normal. Fresh-context review caught it.

## The principle

**Validate range/pair state at the page that owns it (R3), where every entry
path converges — typed URL, shared link, back-button, and picker click all
funnel through the same render.** A constraint placed only on the input widget
guards one of those paths. When you enumerate the invalid shapes (R17), a
two-ended range has at least two — equal and reversed — each deserving its own
explicit, distinct prompt, not a single catch-all that leaves one case to
render garbage.

## How to apply

- For URL-synced range inputs, compute `invalid = sameEnds || reversed` (ISO
  `YYYY-MM-DD` compares chronologically as strings) in the owning page, skip the
  fetch (`enabled` gate) for invalid pairs, and render a per-shape message.
- Don't rely on the picker's option list to prevent an invalid pair — it can't
  see a hand-edited URL. The picker reports selections; the page judges them.
- When you add the first invalid-case guard (`from === to`), immediately ask
  "what are the _other_ invalid shapes of this value?" — that is R17 in
  practice, and it's exactly the case a single happy-path test won't surface.

## Related

- [[070-setSearchParams-prev-races-in-batched-updates]] — sibling URL-state
  lesson; the setters here use its bail-on-no-op pattern.
- R3 (`tasks/rules.md`) — the page owns date/filter state and passes it as
  props; this adds "and the page is therefore where you validate it."
- R17 — explicit case for every value; a range has more invalid values than the
  first one you notice.
