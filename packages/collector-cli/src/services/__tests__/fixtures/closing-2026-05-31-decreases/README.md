# Fixture: closing-2026-05-31-decreases — the real 9-decrease reconciliation set

Captured 2026-06-04 from the live buckets (epic #1083 Sprint 3, #1092), in the
exact directory layout `runValueDiff` reads (`{root}/{date}/all-districts-rankings.json`)
so the integration test drives the same fs → digest → diff → promote path the
pipeline's value-gate step calls.

| Side    | Source                                                                           | Metadata                                                     |
| ------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| staging | `gs://toast-stats-data-staging/snapshots/2026-05-31/all-districts-rankings.json` | `sourceCsvDate 2026-06-03`, `calculatedAt 2026-06-04T11:01Z` |
| prod    | `gs://toast-stats-data-ca/snapshots/2026-05-31/all-districts-rankings.json`      | `sourceCsvDate 2026-06-02`, `calculatedAt 2026-06-03T22:32Z` |

This is the pair that blocked scheduled run
[26947541298](https://github.com/taverns-red/toast-stats/actions/runs/26947541298)
under the #1086 non-decreasing rule: **53 counter moves (44 increases, 9
decreases)** across 11 districts, 79 changed districts total (68 derived-only),
identical 128-district sets, zero base/identity/plan-boolean/optionality
violations. The decreases are legitimate closing reconciliation (operator
decision 2026-06-04 on #1092):

| District | Decreases                                                                              |
| -------- | -------------------------------------------------------------------------------------- |
| D14      | paidClubs 98→97, totalPayments 3774→3764, newPayments 770→769, aprilPayments 1469→1460 |
| D46      | totalPayments 3375→3374, newPayments 612→611, clubsWith20PlusMembers 28→27             |
| D94      | totalPayments 9081→9080, newPayments 2058→2057                                         |

Staging is overwritten daily — this evidence is otherwise unreproducible.
Sibling fixture `closing-2026-05-31/` (flat files) is the 2026-06-03 5-reversal
capture used by the unit-level CPAA tests.
