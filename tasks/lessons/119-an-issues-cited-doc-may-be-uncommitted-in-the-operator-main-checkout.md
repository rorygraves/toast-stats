---
id: '119'
category: lesson
tags: [automation, sprint-runner, prompts, process]
auto_load: true
date: 2026-05-27
issues: [809, 813]
---

# Lesson 119 — An issue's cited doc may be uncommitted in the operator's main checkout, not missing

**Date:** 2026-05-27
**Issue:** #809 (epic #813 Sprint 1)

## What happened

The ADR sprint (#809) required citing `docs/design/table-ux-review-2026-05-27.md`
by repo-relative path. That file did not exist in the spawned session's worktree,
was not on `origin/main`, and `git log --all` found it in **no** ref. It looked
like a hard blocker: the AC demands a citation to a doc that isn't in the repo.

It wasn't missing. The operator had authored it in their **main interactive
checkout** (`/Users/rservant/code/toast-stats/`) and never committed it — a
local artifact from grooming. The spawned worktree (`sprint-worktrees/sprint-809`)
is a separate working directory of the same repo, so it never saw the
uncommitted file. The fix was to copy it in-tree and commit it alongside the ADR
so the citation resolves.

## The transferable lesson

**When a sprint issue cites a repo-relative doc that doesn't exist in any git ref,
check the operator's primary checkout for an uncommitted copy before treating it
as a blocker.** Grooming artifacts (review docs, audits, decision notes) are often
written in the operator's main working tree and referenced in the issue _before_
they're committed. A spawned worktree only sees committed history, so "not in git"
≠ "doesn't exist." Bring it in-tree and commit it so the citation is a live link,
not a dangling reference.

## How to apply

- A spawned session's worktree and the operator's interactive checkout are
  **different working directories of the same repo**. Untracked files in one are
  invisible to the other. The operator's checkout here is `~/code/toast-stats/`
  (derivable from the memory dir slug `-Users-rservant-code-toast-stats`).
- Search order for a "missing" cited file: worktree → `git ls-tree origin/main`
  → `git log --all -- <path>` → **the operator's main checkout working tree**.
  Only escalate to the operator if all four come up empty.
- Don't fabricate the cited doc's contents to satisfy the AC — that's guessing,
  not evidence. If the operator authored it, commit _their_ file; if it genuinely
  doesn't exist anywhere, STOP and surface it rather than inventing analysis.
- A doc-only PR that touches only `docs/**` / `**/*.md` triggers **no CI**
  (`ci.yml` `paths-ignore`) and **no preview** (`pr-preview.yml` path filter) by
  design. "No checks reported" is the expected state, not a failure — verify via
  `npx prettier --check` on the changed files + link resolution, and say so in the
  evidence comment. See also
  [[098-curated-lesson-manifest-beats-tag-inference-when-the-operator-knows]].

## Related

- `docs/architecture-decisions/006-data-table-page-layout-and-column-model.md` —
  the ADR; cites `docs/design/table-ux-review-2026-05-27.md` (committed in the
  same PR #822).
- [[087-spawned-sessions-need-their-own-worktree-not-shared-checkout]] — the worktree
  isolation that causes the invisibility in the first place.
