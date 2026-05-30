# "Close to Distinguished" — canonical predicate & shared-helper plan

**Sprint 1 of epic #900** (#901) · 2026-05-28 · _design note, no behaviour change_

This note pins the canonical "Close to Distinguished" predicate against **real
snapshot data** (2026-05-27 CDN, Districts 61/42/116), confirms every condition
resolves from already-stored fields, documents the **actual** divergence in the
codebase (which differs from what the 2026-05-28 review assumed), and specifies
the single shared helper that Sprints 2–4 will converge both surfaces onto.

---

## 1. The canonical predicate

A club is **Close to Distinguished** when **all four** hold (logical AND):

| #      | Condition                   | Expression                                              | Source field                                                        |
| ------ | --------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| **C1** | Membership gap ≤ 3          | `min(20 − members, 3 − netGrowth) ≤ 3`                  | `ClubDCPProjection.gapToDistinguished.members`                      |
| **C2** | ≤ 2 DCP points from 5       | `currentGoals ≥ 3`                                      | `ClubDCPProjection.currentGoals`                                    |
| **C3** | CSP submitted _or_ pre-2025 | `cspSubmitted === true \|\| cspSubmitted === undefined` | `ClubTrend.cspSubmitted`                                            |
| **C4** | Not already Distinguished+  | `currentLevel === 'NotDistinguished'`                   | `ClubDCPProjection.currentLevel` (= `ClubTrend.distinguishedLevel`) |

Note C1 includes a member gap of **0** (a club that already meets membership but
still lacks goals): C4 excludes the clubs that have _fully_ crossed the line, so
a 0-member-gap / goal-short club is correctly still "close". This is intentional
per the operator decision table (epic #900): "keep 5+-goal clubs that still lack
members" and its mirror — keep member-met clubs that still lack goals.

### Every condition resolves from existing fields (C-confirmed)

All four already flow to the frontend `ClubTrend` and are computed by
`calculateClubProjection` — **no new pipeline/backend work**:

- `gapToDistinguished.members` — `frontend/src/utils/dcpProjections.ts`
  `computeGap(…, netGrowth, 3)` returns `min(memberGapAbsolute, growthGap)`,
  exactly C1's `min(20 − members, 3 − netGrowth)` (both paths clamped ≥ 0).
- `currentGoals` — `latestGoals(club.dcpGoalsTrend)` (last trend point).
- `cspSubmitted?: boolean` — `frontend/src/hooks/useDistrictAnalytics.ts:46`,
  populated by `DataTransformer` / `ClubHealthAnalyticsModule.getCSPStatus`.
  **Verified populated** in the live 2025-26 snapshot (D61: 148 `true` / 14
  `false` / 0 `undefined`). The `undefined` branch is the documented pre-2025
  fallback (no CSP column), not a live-data hole — keep it for year switching.
- `currentLevel` / `distinguishedLevel` — `determineLevel(goals, members,
netGrowth)`; the stored `distinguishedLevel` agrees with the projection.

---

## 2. Real-data result count (2026-05-27 snapshot)

Predicate computed over `allClubs` of three live districts (faithful Python port
of `calculateClubProjection`; script archived in the PR evidence comment):

| District  | Clubs | C1 ≤3 | C2 ≥3 goals | C3 CSP | C4 not-dist | **Predicate (AND)** |
| --------- | ----- | ----- | ----------- | ------ | ----------- | ------------------- |
| **D61**   | 162   | 108   | 129         | 148    | 111         | **41**              |
| **D42**   | 105   | —     | —           | —      | —           | **28**              |
| **D116**  | 136   | —     | —           | —      | —           | **14**              |
| **Total** | 403   |       |             |        |             | **83**              |

Example D61 matches (all four conditions, real values):

| Club                        | goals | members | base | net | gapMembers | csp  |
| --------------------------- | ----- | ------- | ---- | --- | ---------- | ---- |
| Limestone City Club         | 4     | 13      | 13   | +0  | 3          | true |
| KEYS Toastmasters Club      | 7     | 18      | 16   | +2  | 1          | true |
| Manotick Club               | 4     | 19      | 16   | +3  | 0          | true |
| Smiths Falls Toastmasters   | 5     | 13      | 11   | +2  | 1          | true |
| Carleton Place Toastmasters | 4     | 8       | 6    | +2  | 1          | true |

The predicate yields a **non-empty, actionable** set in every district sampled
(10–25 % of clubs) — neither so loose it surfaces the whole district nor so
tight it empties.

---

## 3. The actual divergence (code over ticket)

> ⚠️ **Correction to the epic/review premise.** The epic body and the
> 2026-05-28 review describe the divergence as _"table chip
> (`computeMembersToDistinguished`, goal-7/8-aware) vs detail-card banner
> (`gap.members`)"_. **That is no longer the live state.** Verified against the
> current `main` checkout:

- **Both** surfaces already share **one** engine. The table chip
  (`ClubsTable.tsx` `membersNeeded` filter `[1,4]` → `columnFilterUtils.getMembersNeeded`
  → `computeMembersToDistinguished`) **and** the detail-card banner
  (`ClubDetailPage.tsx:291-300` → `computeMembersToDistinguished`) both call
  `computeMembersToDistinguished(projection, goalContext)` bounded by
  `CLOSE_TO_DISTINGUISHED_MAX_MEMBERS = 4`. The Lesson-052 (#433) divergence was
  **already resolved** by #620.
- The old `gap.members` banner predicate — `isCloseToDistinguished(gap: TierGap)`
  in `frontend/src/utils/closeToDistinguished.ts` — is **dead code**: exported
  but **zero callers** (the `isCloseToDistinguishedActive` references in
  `ClubsTable.tsx` are an unrelated local boolean, not this function). The review
  was reading a function that no longer drives any surface.

So the real divergence this epic resolves is **not** chip-vs-banner; it is
**{the shared `computeMembersToDistinguished ≤ 4` engine} vs {the new
4-condition predicate}**. They answer different questions:

|               | Current engine (`computeMembersToDistinguished ≤ 4`)                                               | New predicate                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Member metric | `membersNeeded` — members that _alone_ close the gap, **folding Goal 7/8 earning into one number** | `gapToDistinguished.members` — pure membership gap, goals counted separately (C2) |
| Goal handling | Returns **null** unless members-via-Goals-7/8 can close the _entire_ DCP gap                       | Independent: `currentGoals ≥ 3` (any 2-point gap, regardless of which goals)      |
| CSP           | not considered                                                                                     | C3 gate                                                                           |
| Bound         | `≤ 4`                                                                                              | `≤ 3` (C1)                                                                        |

**Real-data delta** (3 districts, 2026-05-27): current engine surfaces **57**
clubs, new predicate **83**, overlap **45**. The new predicate adds **38**
clubs the engine wrongly excludes (goals-short clubs whose 2-point gap can't be
closed by Goals 7/8 alone — e.g. a club needing one _non-member_ goal) and drops
**12** the engine over-includes (member gap 4, CSP not submitted, or member-only
qualification beyond the 3-member line). The new predicate matches operator
intent — _"2 or fewer points from 5 goals"_ read literally — where the engine's
member-only framing does not.

### Recommendation: which becomes canonical

**Adopt the new 4-condition predicate as canonical.** `gapToDistinguished.members`
(C1) becomes the member metric — **not** `computeMembersToDistinguished.membersNeeded`.
Rationale:

1. **It is the operator's literal definition.** Epic decision table fixes C1 as
   `min(20 − members, 3 − netGrowth) ≤ 3`, which _is_ `gapToDistinguished.members`.
2. **It separates the two axes the engine conflates.** Goals (C2) and members
   (C1) are independent DCP dimensions; collapsing them into one
   member-count answer (the engine) is why goals-short-by-a-non-member-goal
   clubs silently vanish.
3. **`computeMembersToDistinguished` / `closeToDistinguished.ts`
   `CLOSE_TO_DISTINGUISHED_MAX_MEMBERS = 4` are superseded** by this predicate
   for the _close-to-distinguished_ question. (`computeMembersToDistinguished`
   also produces the banner's _explanatory copy_ — "N more members for Goal 7" —
   which Sprint 3 may retain as presentation only, decoupled from the
   _eligibility_ decision.)

Per Lesson 052/076/117: one shared pure helper, inlined at both call sites, no
wrapper; identical label ⇒ identical definition.

---

## 4. Shared helper — location & signature

Repurpose the existing (now-dead) file rather than add a new one. Both consumers
are frontend-only and already hold a `ClubDCPProjection` + the `ClubTrend`
(for `cspSubmitted`), so the helper stays in the frontend utils layer:

**File:** `frontend/src/utils/closeToDistinguished.ts`

```ts
import type { ClubDCPProjection } from './dcpProjections'

/**
 * Canonical "Close to Distinguished" predicate (epic #900).
 * A club a small, single nudge away from Distinguished — see
 * docs/design/close-to-distinguished-predicate-2026-05-28.md.
 */
export function isCloseToDistinguished(
  projection: Pick<
    ClubDCPProjection,
    'currentGoals' | 'gapToDistinguished' | 'currentLevel'
  >,
  cspSubmitted: boolean | undefined
): boolean {
  return (
    projection.currentLevel === 'NotDistinguished' && // C4
    projection.currentGoals >= 3 && // C2
    projection.gapToDistinguished.members <= 3 && // C1
    (cspSubmitted === true || cspSubmitted === undefined) // C3
  )
}
```

- **Delete** the old `isCloseToDistinguished(gap: TierGap)` body and the
  `CLOSE_TO_DISTINGUISHED_MAX_MEMBERS = 4` constant (dead once both sites call
  the new helper; keeping them re-creates the drift surface Lesson 076 warns of).
- **Inline at each call site** (`isCloseToDistinguished(projection,
club.cspSubmitted)`); no per-surface wrapper method.
- A `ClubTrend`-level convenience (`isClubCloseToDistinguished(club: ClubTrend)`
  that builds the projection internally) is optional sugar for the table's
  row-level filter; if added, it must call the pure helper above — not
  re-implement the four conditions.

---

## 5. Call sites to converge (work for Sprints 2 & 3)

| Site          | Current                                                                                              | Target                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Detail banner | `ClubDetailPage.tsx:291-300` calls `computeMembersToDistinguished(…) ≤ 4`                            | call shared `isCloseToDistinguished(projection, club.cspSubmitted)` for the _eligibility_ gate; keep `computeMembersToDistinguished` (if at all) only to render the explanatory copy |
| Table preset  | `ClubsTable.tsx:325-340, 760-810` chip wiring `membersNeeded [1,4]` + `isCloseToDistinguishedActive` | Sprint 2 removes the whole chip row; Sprint 3 builds the single preset on the shared helper                                                                                          |
| Dead helper   | `closeToDistinguished.ts` `isCloseToDistinguished(gap)` + `CLOSE_TO_DISTINGUISHED_MAX_MEMBERS`       | replaced by the new helper above; delete old export                                                                                                                                  |

**Tripwire for Sprint 2 (R8 / Lesson 119).** `membersNeeded` is **not** only the
chip — it is also a computed property on `ProcessedClubTrend`
(`columnFilterUtils.getMembersNeeded` / `processClubs`) and a filter case
(`columnFilterUtils.ts:161`) and a **drawer column** (`clubsColumns.tsx:245`,
`filters/types.ts`). The epic says _do not touch the Filters drawer_. So Sprint 2
must remove the **chip's** use of `membersNeeded` (the `[1,4]` quick-filter) while
leaving the `membersNeeded` column-filter plumbing intact for the drawer. Grep
the _shape_, not just the named chip, before deleting.

---

## 6. Acceptance check for this sprint (#901)

- [x] Predicate computed over real snapshot clubs — **83 / 403** across D61/42/116
      (D61 = 41); per-condition counts and example clubs in §2.
- [x] All four conditions confirmed to resolve from existing fields (§1), CSP
      verified populated in the live 2025-26 snapshot.
- [x] Divergence documented (§3) — corrected to the real code state (already
      converged on `computeMembersToDistinguished`; old `gap.members` helper is
      dead) and recommendation made (adopt `gapToDistinguished.members`).
- [x] Canonical predicate, shared-helper location/signature (§4), and call-site
      convergence list (§5) documented.
- [x] **No source/behaviour change** — this commit adds only this note.
