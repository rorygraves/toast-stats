# Sprint-runner stuck-session liveness detector — Design

**Status:** Design (doc-only) · **Sprint 1 of epic #933** · **Issue #928**
**Date:** 2026-05-30 · **Author:** sprint-928 session

> Implements the detection contract that Sprints 2–5 build. **No code in this
> sprint.** Sprints 2–5: probes (#929) → fusion + attempt-state (#930) →
> reap/relaunch/escalate (#931) → simulated-zombie verification + docs (#932).

---

## 1. Problem & goal

Today the runner's only liveness check is, in `mode_run`'s active-session
branch (`scripts/sprint-runner.sh:615–658`):

> "Is there a `sprint-runner-<issue>` screen, and is `<issue>` OPEN? → skip
> launch." (lines 631–634)

That is a **slot-occupancy** check, not a **progress** check. A zombie session
— e.g. #871's Claude-API thinking-block loop (screen alive, `claude` spinning,
zero commits) — satisfies "OPEN + screen present" forever and holds the slot
until the operator manually `--reap`s. The 7-day analysis
(`docs/investigations/sprint-runner-timeline-2026-05-29.md`) found 11
relaunched/stuck items and 9 sessions open at log tail.

**Goal:** detect a stalled session within ~45 min, reap it, auto-relaunch
(capped at 3), escalate when the cap is hit — **without** false-positiving a
session that is legitimately grinding one hard step. The false-positive guard
is the design's hardest constraint: a healthy 6–9h sprint must survive.

### Operator decisions (2026-05-29, from epic #933 / issue #928)

| Question           | Decision                                                                               |
| ------------------ | -------------------------------------------------------------------------------------- |
| Stuck signals      | Fused: no-commit (45 min) + repeated/identical log error/stall + process idle (CPU ~0) |
| Single vs combined | Single signal reaps **only if 100% conclusive**; else require **≥2** corroborating     |
| No-progress window | **45 min** (past the 15–30 min TDD commit cadence + build/test margin)                 |
| Action             | **Reap + auto-relaunch fresh, capped**                                                 |
| Attempt cap        | **3, then escalate** (notify, free slot, flag issue)                                   |
| Hard age cap       | **None** as a trigger (legit sprints ran 6–9h)                                         |

---

## 2. Signal probes

Three probes, each a **pure function** of inputs the runner can sample on a
tick (Sprint 2, #929, implements them as unit-tested pure functions —
"sample" side at the edge, "classify" side pure, per R20 spirit). Each returns
a tri-value: `STALL` (evidence of no progress), `OK` (evidence of progress),
or `UNKNOWN` (cannot tell — treated as not-STALL, never as evidence).

The session is keyed by **target issue #** throughout (matches the existing
`sprint-runner-<issue>` / worktree `sprint-<issue>` naming, #630).

### 2.1 Commit-age probe (`probe_commit_age`)

**Samples:** last-commit epoch on the session's worktree branch, and the
session start epoch (§4.1).

```bash
last_commit=$(git -C "$WORKTREE_BASE/sprint-$issue" log -1 --format=%ct 2>/dev/null)
# floor at session start so a just-launched session (no commits yet) isn't STALL
progress_epoch=$(( last_commit > start_epoch ? last_commit : start_epoch ))
age=$(( now - progress_epoch ))
```

- `age >= 2700` (45 min) → **STALL**
- `age < 2700` → **OK**
- worktree gone / `git log` errors → **UNKNOWN** (don't infer stall from a
  missing worktree — that's a different failure the GC path owns)

**Why floor at start_epoch:** a brand-new session has no commits; without the
floor every fresh launch reads as 45-min-stalled on tick one. The floor makes
"time since _last forward progress_" the metric, where launch counts as
progress-zero. (R3 spirit: don't infer the clock from the wrong datum.)

### 2.2 Process-liveness / CPU probe (`probe_process`)

**Samples:** the spawned `claude` PID under the screen, and its CPU%.

```bash
pid=$(pgrep -f "claude --remote-control sprint-$issue" | head -1)
screen_alive=$(pgrep -f "SCREEN -dmS sprint-runner-$issue" >/dev/null && echo 1 || echo 0)
```

Two distinct outputs from this one probe:

1. **Husk (conclusive):** `screen_alive == 1` **and** `pid` empty → the screen
   daemon outlived its `claude` child (claude crashed/exited, screen shell is
   idling on the `echo "...session ending"` tail or a dead PTY). This is
   **100% conclusive** — there is no session doing work. → emits the dedicated
   `HUSK` verdict (see §3), not merely `STALL`.
2. **Idle CPU (soft):** `pid` present → sample CPU twice over a short window
   and take the max to avoid catching a between-bursts trough:
   ```bash
   c1=$(ps -o %cpu= -p "$pid"); sleep 3; c2=$(ps -o %cpu= -p "$pid")
   ```
   `max(c1,c2) < 1.0%` → **STALL** (idle). Otherwise → **OK** (working).

`pgrep`/`ps` are used over `screen -ls` deliberately: macOS `screen -ls` exits
1 even when sessions exist, and under the script's `set -o pipefail` that
silently inverts any `screen -ls | grep -q` predicate (**R14 / L089** — the bug
that nearly GC'd a live worktree). The process table has no such interaction.

**Caveat (#871 shape):** a thinking-block loop may spin CPU _non-zero_. So
CPU-idle alone must **never** be sufficient — #871 is caught by the _other two_
probes (commit stall + log repeat) corroborating. This is exactly why fusion,
not any single soft signal, is the verdict mechanism.

### 2.3 Log-stall / repeat probe (`probe_log`)

**Prerequisite — define where session stdout lands.** Today `screen -dmS …
bash -c "claude …"` (lines 761–767) sends claude's output only to the screen's
in-memory PTY buffer — nothing on disk to tail. The design adds a **per-session
screen logfile**:

```bash
screen -L -Logfile "$RUNNER_LOG_DIR/session-$issue.log" -dmS "$session_name" bash -c '…'
```

- `RUNNER_LOG_DIR` defaults to `$WORKTREE_BASE/.runner-logs/` (sibling of the
  worktrees, outside any worktree so it never pollutes a git status or gets
  swept by `git worktree remove`).
- The logfile is reaped alongside the session (added to `reap_screen_session`
  and the GC orphan sweep), so it is truth-tied to session lifetime, not
  bookkeeping that can drift (L087 principle).

**Samples:** logfile mtime, byte size, and the tail (last ~40 lines).

- mtime age `>= 2700` (no new output in 45 min) → **STALL** (hard stall)
- tail shows the **same line/block repeated** beyond a threshold (e.g. the last
  20 non-blank lines collapse to `< 3` distinct lines) → **STALL** (loop;
  the #871 thinking-block signature)
- logfile missing (pre-rollout session, or never created) → **UNKNOWN**
- otherwise → **OK**

Repeat-detection is a pure function over the tail string (Sprint 2 unit-tests
it against a captured #871-shape transcript fixture and a healthy transcript).

---

## 3. Fusion / confidence model

Verdict ∈ `{ HEALTHY, SUSPECT, STUCK, HUSK }`. Pure function of the three probe
outputs (Sprint 3, #930).

```
inputs:  commit ∈ {STALL,OK,UNKNOWN}
         process ∈ {STALL,OK,UNKNOWN,HUSK}     # HUSK = screen-alive + claude-gone
         log ∈ {STALL,OK,UNKNOWN}

if process == HUSK:                         verdict = HUSK     # conclusive single
elif count(STALL among {commit,process,log}) >= 2:  verdict = STUCK    # corroborated
elif count(STALL ...) == 1:                 verdict = SUSPECT  # one soft signal
else:                                        verdict = HEALTHY
```

Rules that make this safe:

- **Conclusive-single → act immediately.** Only `HUSK` qualifies: there is
  provably no working process. Reap + relaunch with no waiting period.
- **Corroboration (≥2 STALL) → STUCK.** Two independent stall signals (e.g.
  commit-age + log-repeat — the #871 shape) clear the bar. A single soft signal
  never does.
- **SUSPECT does not reap.** One STALL → log + record, re-evaluate next tick.
  A grinding-but-healthy session escapes the moment _any_ probe flips to OK (a
  commit lands, CPU spikes, the log grows). This is the primary
  false-positive guard.
- **UNKNOWN is never evidence of stall.** Missing worktree/logfile/PID resolves
  toward HEALTHY, not STUCK — the conservative direction (a false _negative_
  here just delays a reap by a tick; a false _positive_ kills live work).

### Why 45 min × the tick cadence is the false-positive guard

Ticks run every 5 min (launchd `StartInterval 300`). The 45-min window means a
STALL probe only fires after **9 consecutive ticks** of no progress — far past
the 15–30 min TDD commit cadence plus build/test margin. STUCK additionally
needs **two** such signals agreeing. The combination (long window × multi-signal
corroboration × any-OK-resets) is what lets a 6–9h legit sprint survive while a
true zombie is caught inside ~45 min.

---

## 4. State persistence

The runner is otherwise stateless: filesystem + `screen`/process table +
GitHub are its truth. We add the **minimum** durable state that truth cannot
reconstruct, and **derive everything else from truth signals** (L087/R19
principle: prefer truth signals over bookkeeping files; bookkeeping drifts).

### 4.1 Session start time — DERIVED, not stored

Needed to floor the commit-age probe (§2.1). Reconstructable from truth:

```bash
start_epoch=$(ps -o lstart= -p "$screen_pid" | xargs -0 date -j -f '%c' +%s)   # screen daemon start
# fallback: stat the worktree creation mtime
```

The screen daemon's process start time _is_ the session start time — no file
needed. (If `lstart` parsing proves brittle on macOS, fall back to the worktree
directory's birth time via `stat -f %B`.)

### 4.2 Attempt count — PERSISTED (the one thing truth can't rebuild)

The attempt counter **must survive the reap** that destroys the worktree, the
screen, and the logfile — so it cannot be derived from any of them. It is the
single piece of genuinely durable runner-internal state.

**Decision: a small JSON state file**, not an issue label/comment.

`$WORKTREE_BASE/.runner-state.json`:

```json
{
  "928": {
    "attempts": 2,
    "last_verdict": "STUCK",
    "last_relaunch_epoch": 1717000000
  }
}
```

**Justification (vs. issue label/comment):**

| Criterion          | JSON state file                                                   | Issue label/comment                 |
| ------------------ | ----------------------------------------------------------------- | ----------------------------------- |
| Read cost per tick | local `cat`                                                       | `gh` API call (latency, rate limit) |
| Write atomicity    | `mktemp` + `mv` (atomic rename)                                   | API, no transaction                 |
| User-visible churn | none (internal bookkeeping)                                       | pollutes issue timeline every tick  |
| Survives reap      | yes (outside worktree)                                            | yes                                 |
| Failure mode       | file lost → counter resets to 0 (safe: at worst 3 extra attempts) | API flake mid-tick → ambiguous      |

The counter is **internal control state**, not a user-facing fact, so GitHub —
the right home for _shared_ truth (issue open/closed, epic checkbox) — is the
wrong home here. The JSON file is read/written only inside the already-held
`mode_run` lock, so no concurrent-writer hazard. It lives beside the worktrees
(already runner-owned) and is **reconciled**: an entry whose issue is CLOSED
(or absent from the active epic) is pruned each tick, so the file can't
accumulate stale keys. Loss of the file is _safe-by-design_ — it resets
counters to 0, costing at most a few extra relaunch attempts, never a
false-positive reap.

**Escalation, by contrast, IS user-facing** → it writes to GitHub (a comment +
notify), because that's shared state the operator must see (§5). Internal count
→ file; operator-facing escalation → issue. The split mirrors the existing
design: `screen`/fs for runner mechanics, GitHub for the human handshake.

---

## 5. Reap → relaunch → escalate state machine

Runs **inside the existing 5-min tick**, in `mode_run`'s active-session branch
— specifically replacing the unconditional "OPEN → skip launch" exit at
`scripts/sprint-runner.sh:631–634`. An OPEN active session now gets a liveness
verdict instead of an automatic pass. (Cadence decision per #928: no separate
timer; the tick already visits this branch every 5 min.)

```
                 ┌─────────── tick visits active session (issue OPEN) ──────────┐
                 ▼
         sample 3 probes → fuse → verdict
                 │
   ┌─────────────┼───────────────┬────────────────────┐
HEALTHY       SUSPECT          STUCK                  HUSK
   │             │                │                    │
 clear        log only,        ┌───┴────────────────────┘
 SUSPECT      leave running    │  attempts = state.attempts (file)
 record,      (no reap);       │  if attempts >= 3 → ESCALATE
 leave        next tick        │  else → REAP → SHIP-CHECK → RELAUNCH
 running      re-evaluates     ▼
                            REAP: reap_screen_session(issue)   # kills claude+screen, removes worktree+logfile
                               │
                               ▼
                  ┌─── SHIP-CHECK (L086 / R15 guardrail) ──────────────────────┐
                  │  Before relaunching, establish TRUE ship state:            │
                  │   • PR merged?  gh pr list --state all --search "<issue>"   │
                  │   • artifact on origin/main? (NOT log origin/main..HEAD —   │
                  │     a diverged local branch lies; check the tree/PR)        │
                  │   • issue CLOSED?  • Deploy green?                          │
                  ├────────────────────────────────────────────────────────────┤
                  │  if shipped-but-ungated → DO NOT relaunch implementation.   │
                  │     Resume the tail: live-verify → sprint-verified label →  │
                  │     tick epic checkbox → close. (verification-only run)     │
                  │  else (genuinely unstarted/partial) → RELAUNCH fresh        │
                  └───────────────┬────────────────────────────────────────────┘
                                  ▼
                       RELAUNCH: attempts += 1 (persist BEFORE launch, so a
                       crash mid-launch still counts the attempt), then the
                       existing create_worktree → screen -dmS launch path.
                                  │
                                  ▼   (if attempts would exceed 3)
                            ESCALATE: notify operator + post issue comment
                            ("auto-relaunch exhausted 3/3 — needs operator"),
                            add a `runner-stuck` label, LEAVE THE SLOT FREE
                            (do not relaunch). Counter stays at 3 so subsequent
                            ticks re-escalate-once via label idempotency, not
                            relaunch.
```

Key ordering & guardrails:

- **L086 ship-check is mandatory before every relaunch.** The zombie may have
  _already shipped_ and died only in its verify→label→tick→close tail. Naively
  relaunching `/sprint` would duplicate merged work. A diverged local branch is
  **not** evidence of unshipped work — check `git ls-tree origin/main` / the PR,
  never `git log origin/main..HEAD`.
- **Persist `attempts += 1` BEFORE the launch**, so a launch that itself
  crashes still burns an attempt (no infinite relaunch of a launch-failing
  config).
- **HUSK skips the SUSPECT delay** but still goes through SHIP-CHECK and the
  attempt cap — conclusive-dead ≠ exempt from "don't relaunch shipped work."
- **Escalation frees the slot** (per operator decision: "notify, leave slot,
  flag issue"). With the slot free and `runner-stuck` labeled, the normal
  launch path is gated off that issue until the operator clears the label —
  preventing a 4th silent relaunch.
- **R15 two-signal discipline reused:** escalation writes the strong,
  user-visible signal (issue comment + label) and the weak signal (counter)
  agrees; the operator clears the label to re-arm.

### Interaction with existing branch logic

The existing CLOSED-handling (lines 622–630: CLOSED+ticked → reap; CLOSED+not
ticked → let the tail finish) is **unchanged and runs first**. The liveness
verdict only engages on the `else` (OPEN) path that currently does an
unconditional `exit 0`. Foreign-session handling (lines 635–657) is likewise
untouched — liveness applies to a session whose issue is in the active epic and
OPEN.

---

## 6. `--status` surfacing

Acceptance requires liveness + attempt state in `--status`. `mode_status`
(read-only, never reaps) gains, per active session: the fused verdict, each
probe's value, derived session age, last-commit age, and `attempts N/3` from
the state file. Example line:

```
  - sprint-runner-928  [verdict=SUSPECT  commit=STALL(48m) cpu=OK(12%) log=OK  age=2h14m  attempts=0/3]
```

---

## 7. Test plan (drives Sprints 2–5)

Mirrors the existing hermetic harness style (`scripts/tests/sprint-runner-*.test.sh`:
mock `gh`/`screen`/`git`/`ps`/`pgrep` on `PATH`, run `--dry-run`/`--status`,
assert on log decisions — no live sessions, no network).

**Sprint 2 (#929) — probes as pure functions (unit):**

- `probe_commit_age`: fresh session (floored, OK) · 44-min (OK) · 46-min (STALL)
  · missing worktree (UNKNOWN).
- `probe_process`: husk (screen-alive + pid-gone → HUSK) · pid + 0% twice
  (STALL) · pid + spiking CPU (OK) · between-bursts trough caught by the max()
  of two samples.
- `probe_log`: mtime 46-min-old (STALL) · captured #871 thinking-block fixture
  → repeat-collapse (STALL) · healthy transcript fixture (OK) · missing logfile
  (UNKNOWN).

**Sprint 3 (#930) — fusion + state (unit):**

- Truth table over all probe combos → expected verdict (esp. HUSK precedence;
  exactly-1-STALL → SUSPECT; ≥2 → STUCK; all-UNKNOWN → HEALTHY).
- State file: atomic write, read-back, CLOSED-issue pruning, missing-file →
  attempts 0.

**Sprint 4 (#931) — reap/relaunch/escalate (integration, hermetic):**

- STUCK + attempts<3 → reap called + relaunch path entered.
- **L086:** STUCK but PR merged / artifact on `origin/main` → **no relaunch**;
  resumes verify→label→tick (assert it does NOT call `/sprint` launch).
- attempts==3 → escalate: notify + comment + `runner-stuck` label + slot left
  free (assert no launch).
- Attempt counter persists across a simulated reap.

**Sprint 5 (#932) — simulated-zombie end-to-end + false-positive guard:**

- **#871 reproduction:** screen alive, claude pid alive + non-zero CPU, no
  commits, repeating log → corroborated STUCK via commit+log (NOT cpu) →
  caught.
- **False-positive guard (the hard one):** a healthy long session — commits
  every ~20 min, CPU busy, log growing — sampled across many simulated ticks
  must **never** reach STUCK (stays HEALTHY/transient-SUSPECT only).
- A genuinely-slow-but-progressing session (one commit at minute 44) resets the
  window and survives.
- `--status` renders verdict + `attempts N/3`.

---

## 8. Documentation deliverables (Sprint 5)

- Liveness contract block in the `sprint-runner.sh` header comment.
- CLAUDE.md "Active Tripwires" / runner section: the detector exists, what
  HUSK vs corroborated-STUCK mean, how to clear `runner-stuck`.
- ops#53 extraction-readiness notes: this closes the #1 precondition for
  unattended multi-project use.
- A lesson (`tasks/lessons/`) if Sprint 5 surfaces a durable insight.

---

## 9. Open questions for implementation (non-blocking)

1. **`ps -o lstart` parsing on macOS** — confirm the `date -j -f` round-trip;
   fall back to worktree `stat -f %B` if brittle (§4.1).
2. **`screen -L -Logfile` availability** — confirm the installed screen build
   accepts `-Logfile` (older builds only `-L`); if not, fall back to a periodic
   `screen -X hardcopy` into the session log. Verify in Sprint 2 before the
   log-probe depends on it.
3. **CPU sample window (3s)** — tune if it materially lengthens a tick; the
   two-sample max is the floor, a longer window trades tick latency for fewer
   idle false-reads.

None block the contract; all are Sprint-2 spike items.
