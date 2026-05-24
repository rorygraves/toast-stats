---
id: '098'
category: principle
tags: [process, lessons, automation, sprint-runner, prompts]
auto_load: true
date: 2026-05-24
issues: [650, 647]
---

# Lesson 098 — A curated manifest beats tag inference when the operator knows better

**Date:** 2026-05-24
**Issue:** #650 (epic #647 Sprint 3 — per-sprint relevant-lessons manifest)

## What happened

Sprint 1 (#648) made the bootstrap prompt load lessons by **inferring** work-type
tags from the sub-issue's title/labels/body and intersecting them with the
INDEX. That's a good default, but it's a guess: the loader can't know that a
TypeScript-major sprint specifically needs Lesson 092 (workspace `dist/`
rebuild) and Lesson 087 (branch from `origin/main`) — those don't share an
obvious tag with "TypeScript 6 bump." Sprint 3 added an operator-curatable
`## Relevant lessons` section to sprint sub-issue bodies that the bootstrap reads
**in full**, and which **wins over** tag inference when present.

The principle: **inference is the fallback; human curation is the source of
truth.** When someone who groomed the sprint already knows which prior
incidents will bite, encode that knowledge in the artifact rather than hoping a
tag-overlap heuristic rediscovers it.

## Two design decisions worth keeping

1. **Parse pure, resolve with an injected predicate.** The manifest parser
   (`scripts/lib/relevantLessons.ts`) is a pure function over the issue body;
   `resolveRelevantLessons` takes an `exists(path)` predicate so the
   path-existence check is testable without touching the filesystem — the same
   shape as the `lessonsIndex.ts` generator. The IO (gh fetch, `existsSync`)
   lives only in the CLI entry point.

2. **The path-traversal guard belongs at the resolve boundary, not the parse
   boundary.** A manifest line is external input; `resolveRelevantLessons`
   rejects any path that isn't under `tasks/lessons/` or contains `..` even if
   the existence predicate says it's there. (Same family as the `Path.join`
   tripwire in rules.md.) Note this means any _future_ caller of
   `parseRelevantLessons` that does its own IO must re-apply the guard.

## The honest-verification angle

This sprint ships nothing to `ts.taverns.red`, so the usual Playwright + CDN
live-check doesn't apply. The strongest available end-to-end check was running
the dry-run CLI against the **real, freshly-annotated** issues over the live
`gh` API (`scripts/relevant-lessons.sh 612` / `614`) and confirming it resolved
each listed path to a file on disk with exit 0. That exercises the exact path a
future session walks (gh fetch → parse → resolve → would-load list) — the
process analogue of "verify against a real production record, not a fixture."

## A permission-boundary note

Annotating #612/#614 was acceptance criterion #2, but the auto-mode classifier
blocked `gh issue edit` on issues not created this session (reasonable default:
external writes outside the named task look like scope creep). The fix wasn't to
work around it — it was to surface the conflict to the operator with the
criterion cited and get a one-time approval. **When an automation guardrail
collides with an explicit acceptance criterion, escalate the specific decision;
don't silently widen your own scope.**

## How to apply

- Add a `## Relevant lessons` section to a sprint sub-issue whenever you know,
  at grooming time, which prior lessons will bite. Format:
  `- [Lesson NNN](tasks/lessons/NNN-….md) — why it matters here`.
- Dry-run it before launch: `scripts/relevant-lessons.sh <issue#>`.
- For new "read external input → resolve to a file" code, guard the path at the
  resolve boundary and inject the existence check so it stays unit-testable.

## Related

- [[091-bootstrap-prompt-scope-must-be-explicit-or-runs-diverge]] — the same
  bootstrap step; explicit-scope theme.
- [[097-promote-the-always-relevant-invariant-not-every-principle]] — the
  rules side of "what context should a session load."
- [[087-spawned-sessions-need-their-own-worktree-not-shared-checkout]] — caught
  again here: this worktree's base was 10 commits stale; branched from
  `origin/main`.
