# Investigation #490 — Why ~410 dashboard clubs are missing from Find-A-Club

**Date:** 2026-05-26
**Issue:** #490 (epic #757, Sprint 3)
**Status:** Pattern identified. Merge handling verified correct. Surfacing decision → operator.

## Question

The 2026-05-11 launch investigation found the daily snapshot's `clubPerformance`
total exceeded the public Find-A-Club (FAC) registry total by ~410 clubs. Why?

## Method

FAC raw JSON is merged into each district snapshot by `FindAClubMerger`
(`packages/collector-cli/src/services/FindAClubMerger.ts`). A matched club
receives FAC enrichment fields (`coordinates`, `address`, `charterDate`, …);
a snapshot-only club is left as-is. So within a **post-merge** snapshot,
`coordinates == null` ⟺ no FAC match — a clean, derivable proxy.

Validated the proxy two ways on the 2026-05-25 staging snapshots (126 districts):

1. **Internal consistency** — 0 clubs have `address` without `coordinates` (or
   vice versa). The enrichment fields move together; the proxy never misfires.
2. **Live ground truth** — fetched the live FAC API for D61
   (`/api/sitecore/FindAClub/Search?…&district=61`, 166 clubs) and joined by
   club number. All 4 of D61's `coordinates==null` clubs were **absent** from
   live FAC; a matched club (`00003045`) was **present**.

## Findings (2026-05-25, all districts)

| Cohort                                              | Count     |
| --------------------------------------------------- | --------- |
| Total clubs (snapshot `clubPerformance`)            | 14,705    |
| Matched in FAC                                      | 13,693    |
| **Snapshot-only (not in FAC)**                      | **1,012** |
| FAC-only (prospective / ATOs, `prospectiveClubs[]`) | 584       |

Net delta = snapshot-only − FAC-only = 1012 − 584 = **428** ≈ the −410 observed
on 2026-05-11 (the 18-club difference is two weeks of registry churn).

### The 1,012 snapshot-only clubs, by `Club Status`

| Club Status   | Snapshot-only | Total of that status | Share of status missing |
| ------------- | ------------- | -------------------- | ----------------------- |
| **Suspended** | **750**       | 750                  | **100%**                |
| Active        | 221           | 12,804               | 1.7%                    |
| Ineligible    | 32            | 489                  | 6.5%                    |
| Low           | 9             | 662                  | 1.4%                    |

## The dominant pattern: two distinct, expected causes

1. **Suspended ⇒ hidden from the public registry (74% of the cohort).**
   **Every single one of the 750 Suspended clubs** is absent from FAC. TI does
   not publish suspended clubs in the public Find-A-Club search — a suspended
   club is exactly one a prospective member should not be directed to. This is
   correct TI behaviour, not a data error.

2. **Corporate / private "closed" clubs (the 221 Active + most of the
   Ineligible/Low tail).** These are active clubs hosted inside a company or
   organisation that does **not** accept public members, so TI omits them from
   the public registry. The names make this unambiguous: _Apple Seattle,
   Synopsys Hillsboro, Genetec Inc., MDS Aero, Toast of TCS, ToastMercksters
   (Merck), Schwab Wealth Advisory, Toyota, Bell, Physicians Mutual,
   Chicago Booth, Harrah's Club 777_. (A keyword scan undercounts these — many
   corporate clubs pick whimsical names like "Synonym Toast Crunch" or "Word
   Merchants" — but the absence of any FAC listing for an _active_ club is the
   tell.)

So "missing from FAC" is **not a single cause and not a bug**: it is a
registry-visibility signal that resolves to _suspended_ or _closed-corporate_.

## Acceptance criteria

- [x] **Pattern identified and documented** — this doc + Lesson 118.
- [x] **Snapshot-merge handles the dominant pattern gracefully** — confirmed.
      `FindAClubMerger` leaves snapshot-only rows byte-for-byte unchanged
      (`FindAClubMerger.ts:133-135`); they keep all DCP / membership / status
      fields and stay in every analytics aggregate. This is the correct behaviour:
      suspended and corporate clubs are real performance entities and must not be
      dropped just because they aren't publicly listed. Already pinned by
      `FindAClubMerger.test.ts:250` ("leaves snapshot-only rows untouched") and the
      Suspended-club no-enrichment assertions at lines 145/192. No code change
      required.
- [x] **Decide whether 'missing-from-FAC' is itself a signal worth surfacing** —
      **Operator decision (2026-05-26): no badge, ship as-is.**

## Surfacing decision

A naive badge "_Not listed in public Find-A-Club registry — typically indicates
Suspended_" would be **wrong for the 221 active corporate clubs**, which are not
suspended. And suspended status is **already** surfaced by the existing
`ClubStatusBadge`. So the only _new_ information a FAC-absence badge adds is for
the active-but-unlisted (corporate/private) cohort.

**Resolved:** the operator chose **not to ship a badge**. The suspended signal is
already covered by `ClubStatusBadge`, and a "not in public registry" indicator
for the corporate cohort is low-value and possibly sensitive (flagging a
company's private club as "not public"). A scoped UI issue can be opened later if
a concrete user need appears; nothing in the pipeline changes today.
