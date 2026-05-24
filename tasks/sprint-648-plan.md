# Sprint 1 (#648) — Implementation Plan

**Epic:** #647 lesson curation. **Input:** `tasks/lessons-audit-2026-05-23.md` (Sprint 0).
**Decision adopted:** Option X — flat `tasks/lessons/` + frontmatter; **no file moves**.
"archive (incident)" ⇒ `category: incident, auto_load: false` (NOT relocate).

## Adaptation: no production surface

This sprint changes repo tooling + docs only (lesson frontmatter, INDEX.md, a
generator script, the bootstrap prompt, the global/repo DoD). **Nothing deploys
to ts.taverns.red.** The runner's step-5 Playwright/CDN live-verification does
not apply. "Verification" = repo-state invariants + green CI on the PR + the
generator's own unit tests. The global `~/.claude/CLAUDE.md` + sprint SKILL.md
edits live OUTSIDE the repo and cannot be in the PR/CI — applied directly and
noted in the PR body.

## Frontmatter shape (audit §5, Option X)

```yaml
---
id: 089
category: principle | lesson | incident | superseded | noise
tags: [bash, screen, automation]
auto_load: true # false for incident/superseded/noise
superseded_by: 089 # omitted when null
date: 2026-05-23
issues: [603]
---
```

`date` + `issues` auto-extracted from each file's `**Date:**` / `**Issue:**`
lines. `category` / `tags` / `auto_load` / `superseded_by` come from the audit.

## TDD slices (each = its own commit, every msg refs #648)

1. **RED** — `scripts/lib/__tests__/lessonsIndex.test.ts`: unit tests for
   `parseFrontmatter`, `buildIndexLine`, `generateIndex` (module absent → fail).
2. **GREEN** — `scripts/lib/lessonsIndex.ts` pure module + thin
   `scripts/regenerate-lessons-index.ts` IO entry + `scripts/regenerate-lessons-index.sh`
   wrapper. Add `test:scripts` npm script.
3. **Apply frontmatter** to all 52 `tasks/lessons/*.md` (one-shot canary script,
   deleted after). Superseded/incident/noise per audit §2/§7 get `auto_load:false`;
   085-screen-dms gets a prominent superseded banner → 089.
4. **Generate INDEX.md** via the script; add a guard test (committed INDEX ==
   regenerated, ≤200 lines, every lesson present).
5. **Bootstrap prompt** step 1 → rules + INDEX + tag-matched + 2 newest.
6. **DoD softening** — repo `CLAUDE.md`, global `~/.claude/CLAUDE.md`, sprint
   `SKILL.md` (audit §4 diff).
7. **Verify** — full frontend suite + scripts suite green; PR; CI.

## Files NOT covered by audit (classified here)

- `092-fixed-background-elements-need-literal-colors`: lesson, [dark-mode,css,frontend]
- `093-gcs-cors-has-no-subdomain-wildcard`: lesson, [gcs,ci,data-pipeline,automation]
  </content>
