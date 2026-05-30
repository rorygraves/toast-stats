# Decision: URL-sync for storage-only preferences (epic #969 Sprint 6 / #982)

**Date:** 2026-05-30
**Source:** `deep-link-audit-2026-05-30.md` §4 + §6 **P3** ("Storage-only → URL — product call").
**Status:** Decided. **No control is promoted to the URL.** All three stay storage-backed.

The P3 caveat in the audit deliberately left this to the implementing sprint: the
audit "flags them for the principle's sake but does not mandate the change." This
document records the per-control decision and the principle that draws the line,
and is locked by a tripwire test so a future sprint can't silently URL-sync these.

## The deciding principle

Deep-linking is for **state that describes the data/view you want to show** —
filters, search, sort, comparison pins, program year, region. Sharing that state
**informs** the recipient: the link reproduces the thing you're pointing at.

The P3 controls describe **your personal viewing environment**, not the data:
which district is _yours_, how dense _you_ like the header, which columns _you_
declutter. URL-syncing these makes a shared link **impose the sender's
environment on the recipient** rather than inform them. That is exactly why the
audit already excludes the theme toggle (§4) — these three are the same category.

> Shareable = "look at _this_." Preference = "this is how _I_ view it." Only the
> first belongs in the URL.

## Per-control decision

| Control                                                                                | Proposed param | Decision                                  | Why                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------- | -------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| My-district star (`useMyDistrict`, localStorage `my-district-id`)                      | `myDistrict`   | **Keep localStorage. Do NOT URL-sync.**   | A personal identity anchor ("which district is mine"), set once. A shared `/?myDistrict=61` would label _someone else's_ home district as the recipient's — semantically **wrong**, not merely noisy. Strongest "no" of the three.                                                                                                                                                                                                            |
| KPI-strip collapse (`DistrictKpiStrip`, sessionStorage `district-kpi-strip-collapsed`) | `kpiCollapsed` | **Keep sessionStorage. Do NOT URL-sync.** | Pure viewing-density chrome. Sharing a district link is "look at this district's stats"; a `?kpiCollapsed=true` would **hide the headline metrics** from the very person you shared them with. Unlike the P2 disclosures (which _reveal_ extra content), collapsing _hides primary_ content — sharing must never hide the headline. sessionStorage is already per-tab, per-device by design.                                                  |
| Column-group visibility (`ClubsTable`, localStorage `clubs-table:hidden-groups`)       | `hiddenGroups` | **Keep localStorage. Do NOT URL-sync.**   | The most debatable — it _is_ symmetric (hiding "Membership" is a defensible thing to share). But the clubs page already round-trips the **meaningful** shareable state (search, sort, filters, "Close to Distinguished" preset). Column visibility is cosmetic decluttering layered on top; URL-syncing it **imposes** the sender's decluttering rather than informing, for marginal value over the state that already travels. Tips to "no." |

## Consequence / scope

- **No production code change.** The three controls keep their current
  storage-backed mechanisms. There is no new URL param, no codec change.
- **Lock-in tripwire** (the audit's guardrail cites [Lesson 107 / #680] —
  "reserve a future seam with a tripwire test, not just a comment"):
  `frontend/src/components/__tests__/storageOnlyPrefsNotUrlSynced.tripwire.test.tsx`
  asserts each control is (a) **URL-inert** — mounting at the proposed param does
  NOT seed its state — and (b) **storage-backed** — toggling writes storage and
  leaves the URL search string empty. It is GREEN today and goes RED the moment
  a future sprint wires any of these to `useSearchParams`/`useUrlState`. That is
  the inverse of [Lesson 144]: there we proved a newly URL-seedable value gained
  an unguarded write path; here we prove these three never gain one.

## Revisit triggers

Reopen this decision only if one of these changes the calculus:

- A **"share my exact view"** feature ships (an explicit "copy view link" button
  that bundles _all_ preferences) — then encode them in that link's scope, not in
  the canonical shareable URL.
- My-district grows into a **multi-district "my dashboard"** that a user would
  legitimately want to hand to a co-leader — at which point it stops being a
  single personal anchor and the imposition argument weakens.

[Lesson 107 / #680]: ../../tasks/lessons/107-reserve-a-future-seam-with-a-tripwire-test-not-just-a-comment.md
[Lesson 144]: ../../tasks/lessons/144-a-cap-enforced-only-on-the-mutation-path-is-bypassed-once-the-value-becomes-url-seedable.md
