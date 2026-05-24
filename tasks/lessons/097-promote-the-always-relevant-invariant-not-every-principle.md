---
id: '097'
category: principle
tags: [process, lessons, automation, sprint-runner]
auto_load: true
date: 2026-05-24
issues: [649, 647]
---

# Lesson 097 — Promote the always-relevant invariant, not every `category: principle`

**Date:** 2026-05-24
**Issue:** #649 (epic #647 Sprint 2 — graduate stable lessons to R-rules)

## What happened

Sprint 1 (#648) tagged every lesson with a `category` (principle / lesson /
incident / noise). The naive read of Sprint 2 was "promote every
`category: principle` lesson to a rule." But 20 lessons carry that category,
and `tasks/rules.md` is the _always-loaded, every-task_ file — promoting all
20 would defeat the epic's whole purpose (relevance-driven loading) by bloating
the one artifact that can't be filtered.

## The promotion criterion (the actual decision)

A lesson graduates to a rule only if it is an **always-relevant invariant** —
something a session should check _regardless of which surface it's working on_.
A `category: principle` lesson that is only relevant inside one surface stays a
**tag-loaded lesson**, surfaced by Sprint 1's mechanism when that surface is
touched.

| Promote → rule (cross-cutting)                     | Keep → tag-loaded lesson (surface-specific)                 |
| -------------------------------------------------- | ----------------------------------------------------------- |
| 083 trap `return 0`, 089 pipefail, 086 dual-signal | 057 year-cumulative base=0 (only when touching analytics)   |
| 091 explicit conditionals, 088 cadence vs progress | 060 percentage denominators (only DCP math)                 |
| R16 workspace rebuild, R19 branch-from-remote-tip  | 066 JSDOM can't assert layout (only when writing CSS tests) |

The split mirrors the epic's thesis: **permanence ≠ relevance.** `rules.md` is
for permanent-AND-universal; tag-loaded lessons are for permanent-BUT-situational.
`category: principle` only proves the first half; the rule decision needs the
second.

## Two smaller catches

- **The ticket's rule numbers were a sketch.** #649 said "R12 onwards," but
  R1–R12 already existed. Started at R13. Same shape as
  [[092-ticket-helper-signatures-bend-to-the-real-data-shape]]: a ticket's
  identifiers are intent, not contract — bind them to the live state.
- **A "Promoted to R-N" back-reference is body content, not frontmatter, so it
  doesn't perturb `INDEX.md`.** Verified with the `--check` mode of the
  regeneration script after editing — the index stayed byte-identical, so no
  regen commit was needed. When you touch a generated artifact's _inputs_,
  always run the generator's check mode rather than assuming.

## How to apply

- When deciding whether a lesson becomes a rule, ask: "would a session working
  on a _completely unrelated_ part of the codebase still need this?" If no, it's
  a tag-loaded lesson, not a rule — no matter how true it is.
- Keep `rules.md` ruthlessly universal. Every line there is paid for by every
  session, every task. Situational truth has a cheaper home now (tags).

## Related

- [[091-bootstrap-prompt-scope-must-be-explicit-or-runs-diverge]] — promoted to
  R17 here; same "explicit beats implicit" family.
- [[092-ticket-helper-signatures-bend-to-the-real-data-shape]] — ticket
  identifiers are sketches.
