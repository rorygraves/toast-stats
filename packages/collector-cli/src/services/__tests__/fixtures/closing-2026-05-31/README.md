# Closing-period reconciliation fixture — 2026-05-31 (captured 2026-06-03)

Real staging-vs-prod `all-districts-rankings.json` pair for snapshot date
`2026-05-31`, captured 2026-06-03T22:39Z while the #1034 value gate was blocking
daily promotion during the May 2026 month-end closing period (epic #1083,
decision doc `docs/investigations/closing-period-promote-policy-2026-06-03.md`).

- `prod-all-districts-rankings.json` — prod CDN copy (promoted 2026-06-01,
  `sourceCsvDate 2026-05-31`).
- `staging-all-districts-rankings.json` — staging copy two reconciliation days
  later (`sourceCsvDate 2026-06-02`, the #309 date-pinned closing remap).

Why this is preserved as a fixture: staging is overwritten daily, so this
overlap diff is **unreproducible** after the closing window ends. It is the
acceptance fixture for the Sprint 2 (#1083) closing-period auto-allow
implementation, and it contains both behavior classes the policy must separate:

- **102 changed districts**, of which the counter-field movers are small and
  mostly upward (e.g. D92 totalPayments +158, D124 paidClubs +3) — the routine
  reconciliation the policy must auto-promote;
- **5 districts with genuine counter decreases** (D114 charter reversal:
  paidClubs 90→89, charterPayments 214→193, totalPayments 4158→4137;
  D88 presidentsDistinguished 7→6; D128 paidClubs −1; D44/D50 payments −1) —
  the decreases the policy must still hard-block (default decrease floor 0).

The remaining ~78 changed districts moved only in derived fields
(ranks/percents/aggregateScore) — zero-sum consequences of other districts'
counter moves, which the policy excludes from the monotonicity check.
