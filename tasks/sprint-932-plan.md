# Sprint 5 (#932) — Simulated-zombie verification, docs, lessons

**Epic:** #933 (sprint-runner stuck-session liveness). Final sprint.
**Branch:** `sprint-932-liveness-verify` off `origin/main` (R19 — the worktree base
was 27 commits stale; Sprints 1–4 live on origin/main).

## Discovery finding (the load-bearing one)

The #871 zombie mode (screen alive, `claude` alive + spinning CPU, no commits,
output looping) is **not detectable in production as currently wired**:

- `launch_sprint_session` starts `screen -dmS … bash -c "claude …"` — claude's
  output goes only to the in-memory PTY. **Nothing is written to disk.**
- `evaluate_liveness` reads `$RUNNER_LOG_DIR/session-$issue.log` _if present_,
  else the log probe → UNKNOWN (the safe direction).
- So in production: commit=STALL, process=OK (CPU spins, not idle, not husk),
  log=UNKNOWN → **1 STALL → SUSPECT → never reaped.**

The design always intended a per-session logfile (§2.3) but flagged screen-build
availability as open-Q #2; the impl deferred it to "a later sprint"
(`tasks/sprint-930-plan.md`: "Full #871 end-to-end catch is Sprint 5 (#932) and
will need the logfile"). **Sprint 5 is that sprint.**

`screen 4.00.03` (installed) has **no `-Logfile`** (verified). `-L` alone writes
`screenlog.0` in cwd (collides across concurrent sessions, pollutes worktree).
**Working approach (canary-verified):** a per-session screenrc with
`logfile <path>` + `deflog on`, launched via `screen -c <screenrc> -L -dmS …`.
Writes to the exact path `evaluate_liveness` reads, no cwd pollution, PTY
preserved (claude's interactive UI intact).

## Changes (TDD order)

1. **Red A / Green A — wire the session logfile at launch.**
   `launch_sprint_session` writes a per-session screenrc (`logfile
$RUNNER_LOG_DIR/session-$issue.log`, `deflog on`) and launches with `-c
<screenrc> -L`. `RUNNER_LOG_DIR` defaults to `$WORKTREE_BASE/.runner-logs`
   (sibling of worktrees, never inside one). Test asserts the screen invocation
   carries logging configured at the per-session path.
2. **Red B / Green B — reap the logfile.** `reap_screen_session` and the GC
   orphan sweep delete `session-$issue.log` (truth-tied to session lifetime).
3. **Green — un-defer** the log-probe comment in `evaluate_liveness` (now live).
4. **Standing regression test** `scripts/tests/sprint-runner-zombie-verify.test.sh`
   — the three epic modes end-to-end + the wiring/cleanup:
   - **#871 alive-loop:** claude alive + busy CPU + no commits + looping logfile
     → STUCK (commit+log corroborate, NOT cpu) → reap + relaunch + attempts++.
   - **HUSK crashed:** screen alive, claude gone → STUCK(HUSK) → reap.
   - **slow-but-healthy:** busy CPU + recent commit + growing log, many ticks →
     never STUCK (HEALTHY / transient-SUSPECT only) — the false-positive guard.
   - launch wires the logfile; reap removes it.
5. **Docs:** runner-header liveness contract block; CLAUDE.md runner section
   (HUSK vs corroborated-STUCK, clearing `runner-stuck`); design-doc status +
   logfile-resolution note; ops#53 extraction note (comment).
6. **Lesson** (the deferred-instrument gap: a probe whose feed is never wired
   reports UNKNOWN forever — the detector is blind exactly where the headline
   failure lives) + INDEX regen.

## Constraints

- Shell tests are **macOS-local** (`ps -o lstart`, `stat -f`, `date -j`) — not
  ubuntu-CI-portable by design (the runner is a macOS launchd job). "Regression
  test green" = passes here; "CI green" = the vitest/lint/format pipeline stays
  green. Run `npm run format` (prettier touches \*_/_.md) before commit; regen
  `tasks/lessons/INDEX.md` (lessonsIndexGuard vitest asserts it).
- Every commit references #932. No `Closes #932` in the PR body (L106/R15).
