---
id: '052'
category: principle
tags: [frontend, scope, dcp]
auto_load: true
issues: [433]
---

# 🗓️ 2026-05-10 — Lesson 52: "Close to Distinguished" had two definitions in two surfaces (#433)

**Discovery**: The ClubDetailPage banner and the ClubsTable quick-filter chip both said "Close to Distinguished" but defined "close" differently. Banner used `projection.gapToDistinguished.members` (raw tier gap from `dcpProjections.ts` — `min(absoluteGap, growthGap)`). Chip used `membersNeeded` (sophisticated value from `membersToDistinguished.computeMembersToDistinguished` — qualification + Goal 7/8 aware). They share a numeric scale (≤ 4 means "close") but answer different questions. A club can satisfy one without the other. Neither was wrong on its own — but the labels implied a parity that didn't exist.

**Proof**: Banner condition was `gap.goals === 0 && gap.members > 0` with no upper bound, so the screenshot's club at gap.members=12 (currentMembers=8 vs base=17, netGrowth=-9) showed the banner as "Close to Distinguished" despite needing a multi-month membership drive to qualify. Chip filtered `membersNeeded === 1`, missing clubs at 2, 3, or 4 short.

**Fix**: New shared module `frontend/src/utils/closeToDistinguished.ts` exports `CLOSE_TO_DISTINGUISHED_MAX_MEMBERS = 4` and `isCloseToDistinguished(gap: TierGap)`. Banner uses the helper. Chip uses the constant in its `[1, MAX]` range. Inline comment in `ClubsTable.tsx` documents the dual-metric semantics so future readers don't assume parity.

**Rule**: When two surfaces share a label, audit whether they share a _definition_. Identical copy with different semantics is a trust bug — users will read the chip results and assume the banner will fire on each club. If two metrics genuinely differ, a shared numeric bound is fine, but the divergence must be documented at every touchpoint.

**Warning**: This pattern recurs for any "health"-style indicator that's computed in multiple places. Watch for it on: Vulnerable / Intervention Required clubs (status overlay vs. banner copy), Distinguished projections (currentLevel vs. projectedLevel), district recognition gaps (per-prerequisite vs. composite badge). Whenever a status appears in both a list-filter context AND a detail-page-call-out context, suspect divergence.

**Process note**: The fresh-context /review caught the divergence; my own analysis missed it. Per Lessons 49–51, fresh-context review remains the only reliable guard against author blind-spots. Updated `~/.claude/skills/review/SKILL.md` so the skill works on local diffs (pre-push) as well as opened PRs — that closes the loop where I had to spawn a manual Agent because the built-in /review required a PR number.

**rules.md**: none — could become an R-rule if this dual-definition pattern recurs ("audit shared labels for shared semantics").
