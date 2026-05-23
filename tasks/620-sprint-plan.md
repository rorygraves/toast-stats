# Sprint 3 (#620) — Close-to-Distinguished callout + DCP Goals Progress panel

## Findings (context load)

- **Callout already exists** (ClubDetailPage 516–550, from #366/#433/#618) using
  `isCloseToDistinguished(gapToDistinguished)`, positioned **before the stats grid**.
  Design + issue want it **between the 2/3+1/3 row and the DCP Goals panel**.
  Issue says reuse `membersToDistinguished.ts`.
- **Old DCP block** (844–939) is a crude `redesign-panel` with a progress bar +
  Goal Achievement Timeline (Tailwind, not the new design). `<ClubDCPGoalsCard>`
  (941–945) renders a category-grouped detailed grid (#242).
- New design = single `.club-panel` "DCP Goals Progress": progress bar +
  [timeline — Sprint 4, OUT OF SCOPE] + flat 2-col per-goal grid.
- Reference goal names (CC/AC awards) are **illustrative**; HANDOFF says wire to
  real data. Canonical source = `GOAL_DEFINITIONS`/`extractDcpGoalProgress`
  (avoids the DCP-independence tripwire). Use those names.
- `ClubDCPGoalsCard.test.ts` actually tests `extractDcpGoalProgress` (misnamed);
  no separate dcpGoals test exists — preserve that coverage.

## Plan (TDD)

1. **Callout**: move JSX to between `.club-trend-grid` and the DCP panel; switch
   trigger to `computeMembersToDistinguished(projection, deriveGoalContext(club))`
   bounded by `CLOSE_TO_DISTINGUISHED_MAX_MEMBERS` (=4, preserves #433). Verified
   all 5 existing #433 tests stay green (nearly-equivalent with the cap). Copy uses
   the util's `membersNeeded`/`goalsEarned`.
2. **New `ClubDCPGoalsPanel.tsx`**: `.club-panel` header + meta + progress bar +
   per-goal grid (from `extractDcpGoalProgress`). Props: `goalsAchieved` (bar+meta),
   `clubRecord`, `isLoading`. Bar/meta from authoritative trend count; grid is the
   breakdown.
3. **CSS** in app-shell.css: `.dcp-progress*`, `.goals-table`, `.goal-row[.met]`,
   `.dcp-subhead` — mirror reference, dark mode via `[data-theme='dark']`.
4. **ClubDetailPage**: remove old block (844–939) + `<ClubDCPGoalsCard>`; render
   `<ClubDCPGoalsPanel>` in new position. Delete `ClubDCPGoalsCard.tsx`; rename its
   test → `dcpGoals.test.ts`.
5. **Tests**: new `ClubDCPGoalsPanel.test.tsx`; update the reposition test;
   add axe coverage.

## Files

- M ClubDetailPage.tsx, app-shell.css
- A ClubDCPGoalsPanel.tsx (+ test)
- D ClubDCPGoalsCard.tsx; R ClubDCPGoalsCard.test.ts → dcpGoals.test.ts
- M ClubDetailPage.test.tsx
