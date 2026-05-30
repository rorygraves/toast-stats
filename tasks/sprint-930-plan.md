# Sprint 3 (#930) — Fusion verdict + attempt-tracking state, wired into the tick

Epic #933 (stuck-session liveness). Builds on Sprint 1 design
(`docs/design/sprint-runner-liveness-detector-2026-05-30.md`) and Sprint 2 probes
(`scripts/lib/sprint-runner-probes.sh`).

## Scope (from #930 body)

1. **Fusion function** — pure: combine 3 probe outputs → `{HEALTHY|SUSPECT|STUCK|HUSK}`.
   `process==HUSK` → HUSK (conclusive single); `count(STALL)>=2` → STUCK (corroborated);
   `==1` → SUSPECT (one soft signal, no reap); else HEALTHY. UNKNOWN never counts as STALL.
2. **State store** — durable per-issue attempt count + last verdict/relaunch epoch.
   JSON at `$WORKTREE_BASE/.runner-state.json` (override `RUNNER_STATE_FILE`), `jq`-backed
   (`/usr/bin/jq`, base PATH). Atomic write (mktemp+mv). Fail-safe: missing/corrupt → 0 attempts.
   Reconcile via prune-to-live-keys.
3. **Tick wiring** — replace `mode_run`'s unconditional OPEN-active `exit 0`
   (`sprint-runner.sh:637-640`) with: sample probes → fuse → log verdict → record state →
   on STUCK/HUSK log the Sprint-4 reap/relaunch handoff (NOT implemented here) and skip;
   else skip as before. **Every path still `exit 0` → no regression.**

## Files

- NEW `scripts/lib/sprint-runner-liveness.sh` — `fuse_verdict`, state store
  (`state_get_attempts` / `state_record` / `state_prune`), and the `evaluate_liveness <issue>`
  edge sampler (git/pgrep/ps/stat/date/tail → probes → fuse).
- EDIT `scripts/sprint-runner.sh` — source the lib; wire `evaluate_liveness` into the OPEN branch.
- NEW `scripts/tests/sprint-runner-fusion-state.test.sh` — pure unit tests: fusion truth table
  (HUSK precedence, >=2→STUCK, ==1→SUSPECT, all-UNKNOWN→HEALTHY) + state atomic write/read,
  CLOSED-prune, missing/corrupt→0.
- NEW `scripts/tests/sprint-runner-liveness-tick.test.sh` — integration: OPEN in-epic active
  session → HEALTHY skips (verdict logged, no launch); HUSK → Sprint-4 handoff logged, no reap,
  no launch; existing CLOSED-reap / foreign behavior unaffected.

## TDD order

1. Red: fusion+state unit test (functions absent) → commit.
2. Green: implement `fuse_verdict` + state store → commit.
3. Red: tick integration test (verdict not logged yet) → commit.
4. Green: `evaluate_liveness` + OPEN-branch wiring → commit.
5. Refactor / `/simplify` / `review` → commit. Verify all shell tests + `test:scripts` + lint.

## Discovered constraint (flagged for later sprint)

macOS system `screen 4.00.03 (FAU)` supports only `-L` (logs to `screenlog.0` in cwd — would
pollute the worktree), **not** `-Logfile` (design §2.3 / open-Q #2 assumed 4.06+). So the
production **screen-logfile wiring is deferred**: `evaluate_liveness` samples
`$RUNNER_LOG_DIR/session-<issue>.log` _if present_, else log-probe → UNKNOWN (safe direction).
Consequence: until a later sprint wires the logfile (hardcopy fallback), the log signal can't
fire, so the #871 shape (commit-stall + log-repeat) corroborates via commit-stall + process-idle
instead. Full #871 end-to-end catch is Sprint 5 (#932) and will need the logfile. Fusion +
state + wiring (this sprint's acceptance) are unaffected.

## Out of scope (later sprints)

- Reap + capped auto-relaunch + escalation + L086 ship-check → Sprint 4 (#931).
- `--status` verdict/attempts surfacing, simulated-zombie + false-positive guard,
  screen-logfile production, docs/lessons → Sprint 4/5 (#931/#932).
