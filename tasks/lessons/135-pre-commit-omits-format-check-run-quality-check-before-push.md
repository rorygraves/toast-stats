---
id: '135'
category: lesson
tags: [ci, tests, prettier, automation, verification]
auto_load: true
date: 2026-05-29
issues: [872, 873]
---

# Lesson 135 — `npm run pre-commit` is a SUBSET of CI's quality gate; it skips `format:check`

**Date:** 2026-05-29
**Issue:** #872 (epic #873 Sprint 2 — CC-7 `<Link>` cards)
**PR:** [#911](https://github.com/taverns-red/toast-stats/pull/911)

## What happened

CC-7 was implemented, tested green, typechecked, and linted clean locally. I ran
`npm run pre-commit` (the documented gate), it passed (exit 0), I pushed and
opened the PR. CI's **Quality Gates → Lint and Format Check** failed in 1m10s on
**Prettier**: seven files (mostly the `MemoryRouter`-wrapper helper lines I'd
perl-injected, plus a few `> 80`-char arrow signatures) weren't formatted. A
full CI round-trip (~10 min) was burned on a whitespace failure that a local
check would have caught instantly.

The root cause is that the two gates are not the same set:

```
pre-commit   = typecheck + lint + lint:yaml          # NO format:check
quality:check = lint + lint:yaml + typecheck + format:check + test
```

CI's Quality Gates runs the equivalent of `quality:check` (lint **and**
`format:check`). So a Prettier-only delta passes `pre-commit` and fails CI. The
local husky pre-commit hook is a fast subset, not the gate.

(Compounding it: this was a fresh spawned worktree where husky wasn't even
installed — `prepare`/`husky install` had failed during `npm install`, so no
hook ran at all on commit. The manual `pre-commit` run was the only local gate,
and it's the subset that omits Prettier.)

## The takeaway

Before pushing, run the gate CI actually runs, not the commit-time subset. Either
`npm run format:check` (catch the Prettier delta) or the full `npm run
quality:check`. Cheapest reliable habit: `npm run format` (write) on touched
files immediately before the final commit — Prettier failures are
mechanical and never worth a CI round-trip.

Corollary for **code-generation that bypasses the editor** (sed/perl/awk
injecting lines, heredocs): that text never passed through format-on-save, so it
is the *most* likely source of a Prettier miss. Always `format:check` after a
scripted multi-file edit.
